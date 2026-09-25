export interface Site {
  id: string;
  name: string;
  url: string;
  domain: string;
  category: string;
  isFavorite: boolean;
  isPinned?: boolean;
  iconUrl?: string;
  customIcon?: string;
  order: number;
  visitCount: number;
  lastVisitedAt?: number;
  createdAt: number;
  openMode?: 'auto' | 'app' | 'browser';
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  isDefault?: boolean;
  order: number;
}

export type SortOption =
  | 'most-visited'
  | 'recent-added'
  | 'recent-visited'
  | 'alpha-asc'
  | 'alpha-desc'
  | 'custom';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface BackupData {
  version: string;
  exportedAt: string;
  sites: Site[];
  categories?: Category[];
  settings?: {
    theme?: ThemeMode;
    sortOption?: SortOption;
  };
}

export interface AppSettings {
  theme: ThemeMode;
  sortOption: SortOption;
  hasSeenWelcome: boolean;
  defaultOpenMode: 'auto' | 'app' | 'browser';
}
