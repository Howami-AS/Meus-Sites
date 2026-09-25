import { Category, Site } from '../types';

export function normalizeUrl(input: string): string {
  let trimmed = input.trim();
  if (!trimmed) return '';

  // If missing protocol, prepend https://
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.href;
  } catch {
    // If simple parse fails, try basic cleanup
    return trimmed;
  }
}

export function extractDomain(url: string): string {
  try {
    let normalized = url.trim();
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = `https://${normalized}`;
    }
    const parsed = new URL(normalized);
    let hostname = parsed.hostname;
    // Strip common www.
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    return hostname.toLowerCase();
  } catch {
    return url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] || url;
  }
}

export function suggestNameFromUrl(url: string): string {
  const domain = extractDomain(url);
  if (!domain) return '';

  const commonNames: Record<string, string> = {
    'youtube.com': 'YouTube',
    'google.com': 'Google',
    'chatgpt.com': 'ChatGPT',
    'openai.com': 'ChatGPT',
    'gmail.com': 'Gmail',
    'mail.google.com': 'Gmail',
    'facebook.com': 'Facebook',
    'instagram.com': 'Instagram',
    'whatsapp.com': 'WhatsApp Web',
    'web.whatsapp.com': 'WhatsApp Web',
    'netflix.com': 'Netflix',
    'twitter.com': 'X (Twitter)',
    'x.com': 'X',
    'linkedin.com': 'LinkedIn',
    'github.com': 'GitHub',
    'wikipedia.org': 'Wikipedia',
    'pt.wikipedia.org': 'Wikipedia',
    'amazon.com.br': 'Amazon',
    'amazon.com': 'Amazon',
    'mercadolivre.com.br': 'Mercado Livre',
    'g1.globo.com': 'G1 Notícias',
    'globo.com': 'Globo',
    'uol.com.br': 'UOL',
    'noticias.uol.com.br': 'UOL Notícias',
    'spotify.com': 'Spotify',
    'open.spotify.com': 'Spotify',
    'twitch.tv': 'Twitch',
    'reddit.com': 'Reddit',
    'canva.com': 'Canva',
    'figma.com': 'Figma',
    'notion.so': 'Notion',
    'trello.com': 'Trello',
  };

  if (commonNames[domain]) {
    return commonNames[domain];
  }

  // Derive title from main host segment (e.g., 'example' from 'example.com.br')
  const parts = domain.split('.');
  if (parts.length > 0) {
    const namePart = parts[0] === 'www' && parts.length > 1 ? parts[1] : parts[0];
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  }

  return domain;
}

export function getFaviconUrl(url: string, size: number = 128): string {
  const domain = extractDomain(url);
  if (!domain) return '';
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'favoritos', name: 'Favoritos', icon: '⭐', color: 'amber', isDefault: true, order: 0 },
  { id: 'trabalho', name: 'Trabalho', icon: '💼', color: 'blue', isDefault: true, order: 1 },
  { id: 'entretenimento', name: 'Entretenimento', icon: '🎬', color: 'purple', isDefault: true, order: 2 },
  { id: 'redes-sociais', name: 'Redes sociais', icon: '💬', color: 'pink', isDefault: true, order: 3 },
  { id: 'noticias', name: 'Notícias', icon: '📰', color: 'emerald', isDefault: true, order: 4 },
  { id: 'compras', name: 'Compras', icon: '🛒', color: 'orange', isDefault: true, order: 5 },
  { id: 'estudos', name: 'Estudos', icon: '📚', color: 'indigo', isDefault: true, order: 6 },
  { id: 'ferramentas', name: 'Ferramentas', icon: '🛠️', color: 'cyan', isDefault: true, order: 7 },
  { id: 'outros', name: 'Outros', icon: '🌐', color: 'slate', isDefault: true, order: 8 },
];

export const INITIAL_SUGGESTED_SITES: Omit<Site, 'id' | 'createdAt' | 'visitCount' | 'order'>[] = [
  {
    name: 'YouTube',
    url: 'https://www.youtube.com',
    domain: 'youtube.com',
    category: 'Entretenimento',
    isFavorite: true,
    isPinned: true,
    iconUrl: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=128',
    openMode: 'browser', // YouTube blocks iframes via CSP
  },
  {
    name: 'ChatGPT',
    url: 'https://chatgpt.com',
    domain: 'chatgpt.com',
    category: 'Ferramentas',
    isFavorite: true,
    isPinned: true,
    iconUrl: 'https://www.google.com/s2/favicons?domain=chatgpt.com&sz=128',
    openMode: 'browser',
  },
  {
    name: 'Gmail',
    url: 'https://mail.google.com',
    domain: 'mail.google.com',
    category: 'Trabalho',
    isFavorite: true,
    isPinned: true,
    iconUrl: 'https://www.google.com/s2/favicons?domain=mail.google.com&sz=128',
    openMode: 'browser',
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com',
    domain: 'instagram.com',
    category: 'Redes sociais',
    isFavorite: false,
    iconUrl: 'https://www.google.com/s2/favicons?domain=instagram.com&sz=128',
    openMode: 'browser',
  },
  {
    name: 'G1 Notícias',
    url: 'https://g1.globo.com',
    domain: 'g1.globo.com',
    category: 'Notícias',
    isFavorite: false,
    iconUrl: 'https://www.google.com/s2/favicons?domain=g1.globo.com&sz=128',
    openMode: 'auto',
  },
  {
    name: 'Wikipedia',
    url: 'https://pt.wikipedia.org',
    domain: 'pt.wikipedia.org',
    category: 'Estudos',
    isFavorite: false,
    iconUrl: 'https://www.google.com/s2/favicons?domain=pt.wikipedia.org&sz=128',
    openMode: 'auto',
  },
  {
    name: 'Mercado Livre',
    url: 'https://www.mercadolivre.com.br',
    domain: 'mercadolivre.com.br',
    category: 'Compras',
    isFavorite: false,
    iconUrl: 'https://www.google.com/s2/favicons?domain=mercadolivre.com.br&sz=128',
    openMode: 'browser',
  },
];
