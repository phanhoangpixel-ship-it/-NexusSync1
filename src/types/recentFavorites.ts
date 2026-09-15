import { ModuleDefinition } from '../config/moduleRegistry';

export interface RecentVisitItem {
  moduleId: string;
  moduleName: string;
  timestamp: string;
  clickCount: number;
  workspaceId?: string;
  iconName: string;
}

export interface FavoriteItem {
  moduleId: string;
  moduleName: string;
  timestamp: string;
  note?: string; // Optional user note/annotation
  customGroup?: string; // e.g. "Hàng ngày", "Cuối tháng"
  workspaceId?: string;
  iconName: string;
}

export interface RecentFavoritesState {
  recents: RecentVisitItem[];
  favorites: FavoriteItem[];
}
