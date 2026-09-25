import { AppSettings, BackupData, Category, Site } from '../types';
import { DEFAULT_CATEGORIES, INITIAL_SUGGESTED_SITES, normalizeUrl } from '../utils/url';

const DB_NAME = 'meus_sites_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('sites')) {
        const siteStore = db.createObjectStore('sites', { keyPath: 'id' });
        siteStore.createIndex('url', 'url', { unique: false });
        siteStore.createIndex('category', 'category', { unique: false });
        siteStore.createIndex('isFavorite', 'isFavorite', { unique: false });
        siteStore.createIndex('order', 'order', { unique: false });
        siteStore.createIndex('visitCount', 'visitCount', { unique: false });
      }

      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

export async function getAllSites(): Promise<Site[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sites', 'readonly');
    const store = tx.objectStore('sites');
    const req = store.getAll();
    req.onsuccess = () => {
      const sites = (req.result as Site[]) || [];
      // Default stable sorting by order or createdAt
      sites.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      resolve(sites);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function findSiteByUrl(url: string, excludeId?: string): Promise<Site | undefined> {
  const normalized = normalizeUrl(url);
  const all = await getAllSites();
  return all.find((s) => normalizeUrl(s.url) === normalized && s.id !== excludeId);
}

export async function saveSite(site: Site): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sites', 'readwrite');
    const store = tx.objectStore('sites');
    const req = store.put(site);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteSite(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sites', 'readwrite');
    const store = tx.objectStore('sites');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function recordSiteVisit(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sites', 'readwrite');
    const store = tx.objectStore('sites');
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const site = getReq.result as Site | undefined;
      if (site) {
        site.visitCount = (site.visitCount || 0) + 1;
        site.lastVisitedAt = Date.now();
        const putReq = store.put(site);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      } else {
        resolve();
      }
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function clearVisitHistory(): Promise<void> {
  const db = await getDB();
  const sites = await getAllSites();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sites', 'readwrite');
    const store = tx.objectStore('sites');

    for (const site of sites) {
      site.visitCount = 0;
      delete site.lastVisitedAt;
      store.put(site);
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function updateSitesOrder(orderedIds: string[]): Promise<void> {
  const db = await getDB();
  const sites = await getAllSites();
  const map = new Map(sites.map((s) => [s.id, s]));

  return new Promise((resolve, reject) => {
    const tx = db.transaction('sites', 'readwrite');
    const store = tx.objectStore('sites');

    orderedIds.forEach((id, index) => {
      const site = map.get(id);
      if (site) {
        site.order = index;
        store.put(site);
      }
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllCategories(): Promise<Category[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('categories', 'readonly');
    const store = tx.objectStore('categories');
    const req = store.getAll();
    req.onsuccess = () => {
      let categories = (req.result as Category[]) || [];
      if (categories.length === 0) {
        // Initialize with default categories
        saveDefaultCategories().then(resolve).catch(reject);
      } else {
        categories.sort((a, b) => a.order - b.order);
        resolve(categories);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

async function saveDefaultCategories(): Promise<Category[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('categories', 'readwrite');
    const store = tx.objectStore('categories');
    DEFAULT_CATEGORIES.forEach((cat) => store.put(cat));
    tx.oncomplete = () => resolve(DEFAULT_CATEGORIES);
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveCategory(category: Category): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('categories', 'readwrite');
    const store = tx.objectStore('categories');
    const req = store.put(category);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteCategory(categoryId: string, categoryName: string): Promise<void> {
  const db = await getDB();
  const allSites = await getAllSites();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(['categories', 'sites'], 'readwrite');
    const catStore = tx.objectStore('categories');
    const siteStore = tx.objectStore('sites');

    // Delete category
    catStore.delete(categoryId);

    // Reassign any sites in this category to 'Outros' (Rule 11: Não excluir os sites quando uma categoria for removida. Nesse caso, mover os sites para "Outros".)
    allSites.forEach((site) => {
      if (site.category.toLowerCase() === categoryName.toLowerCase()) {
        site.category = 'Outros';
        siteStore.put(site);
      }
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  sortOption: 'custom',
  hasSeenWelcome: false,
  defaultOpenMode: 'auto',
};

export async function getSettings(): Promise<AppSettings> {
  const db = await getDB();
  return new Promise((resolve) => {
    const tx = db.transaction('settings', 'readonly');
    const store = tx.objectStore('settings');
    const req = store.get('app_settings');
    req.onsuccess = () => {
      const data = req.result?.value;
      resolve({ ...DEFAULT_SETTINGS, ...data });
    };
    req.onerror = () => resolve(DEFAULT_SETTINGS);
  });
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readwrite');
    const store = tx.objectStore('settings');
    const req = store.put({ key: 'app_settings', value: updated });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function seedSuggestedSites(): Promise<void> {
  const now = Date.now();
  for (let i = 0; i < INITIAL_SUGGESTED_SITES.length; i++) {
    const item = INITIAL_SUGGESTED_SITES[i];
    const existing = await findSiteByUrl(item.url);
    if (!existing) {
      await saveSite({
        ...item,
        id: 'suggested-' + Math.random().toString(36).substring(2, 9),
        order: i,
        visitCount: item.isFavorite ? 5 - i : 0,
        createdAt: now - (INITIAL_SUGGESTED_SITES.length - i) * 1000,
      });
    }
  }
}

export async function exportBackup(): Promise<string> {
  const sites = await getAllSites();
  const categories = await getAllCategories();
  const settings = await getSettings();

  const backup: BackupData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    sites,
    categories,
    settings: {
      theme: settings.theme,
      sortOption: settings.sortOption,
    },
  };

  return JSON.stringify(backup, null, 2);
}

export async function importBackup(
  jsonData: string,
  mode: 'replace' | 'merge'
): Promise<{ added: number; updated: number; skipped: number }> {
  const parsed = JSON.parse(jsonData) as Partial<BackupData>;
  if (!parsed.sites || !Array.isArray(parsed.sites)) {
    throw new Error('Formato de arquivo inválido. O arquivo de backup deve conter uma lista de sites.');
  }

  const db = await getDB();

  if (mode === 'replace') {
    // Clear existing
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['sites', 'categories'], 'readwrite');
      tx.objectStore('sites').clear();
      if (parsed.categories && Array.isArray(parsed.categories)) {
        tx.objectStore('categories').clear();
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // If backup has categories, import them
  if (parsed.categories && Array.isArray(parsed.categories)) {
    for (const cat of parsed.categories) {
      if (cat.id && cat.name) {
        await saveCategory(cat);
      }
    }
  }

  const existingSites = mode === 'merge' ? await getAllSites() : [];
  const existingMap = new Map(existingSites.map((s) => [normalizeUrl(s.url), s]));

  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const s of parsed.sites) {
    if (!s.url || !s.name) {
      skipped++;
      continue;
    }

    const norm = normalizeUrl(s.url);
    const existing = existingMap.get(norm);

    if (existing && mode === 'merge') {
      // Merge updates
      const merged: Site = {
        ...existing,
        name: s.name || existing.name,
        category: s.category || existing.category,
        isFavorite: s.isFavorite ?? existing.isFavorite,
        iconUrl: s.iconUrl || existing.iconUrl,
        customIcon: s.customIcon || existing.customIcon,
      };
      await saveSite(merged);
      updated++;
    } else {
      const newSite: Site = {
        id: s.id || 'imported-' + Math.random().toString(36).substring(2, 9),
        name: s.name,
        url: s.url,
        domain: s.domain || normalizeUrl(s.url),
        category: s.category || 'Outros',
        isFavorite: !!s.isFavorite,
        isPinned: !!s.isPinned,
        iconUrl: s.iconUrl,
        customIcon: s.customIcon,
        order: typeof s.order === 'number' ? s.order : Date.now(),
        visitCount: s.visitCount || 0,
        createdAt: s.createdAt || Date.now(),
        openMode: s.openMode || 'auto',
      };
      await saveSite(newSite);
      added++;
    }
  }

  return { added, updated, skipped };
}
