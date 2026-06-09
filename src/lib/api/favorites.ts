import { api } from "./client";
import { transformClinic, type BackendClinic } from "./clinics";
import type { Clinic } from "@/types/clinic";

// 會員收藏 + 最近瀏覽（跨裝置同步，皆需登入）
// 後端 GET 回 ClinicListItem[]（與診所列表同型別），共用 transformClinic 映射成前端 Clinic。
const PREFIX = "/api/v1/member";

export const favoritesApi = {
  /** 取得收藏清單（新到舊） */
  listFavorites: async (): Promise<Clinic[]> => {
    const items = await api.get<BackendClinic[]>(`${PREFIX}/favorites`);
    return items.map(transformClinic);
  },

  /** 加入收藏（冪等） */
  addFavorite: (facilityId: string): Promise<void> =>
    api.post<void>(`${PREFIX}/favorites/${facilityId}`),

  /** 移除收藏（冪等） */
  removeFavorite: (facilityId: string): Promise<void> =>
    api.delete<void>(`${PREFIX}/favorites/${facilityId}`),

  /** 取得最近瀏覽（最新在前，上限 10） */
  listRecentlyViewed: async (): Promise<Clinic[]> => {
    const items = await api.get<BackendClinic[]>(`${PREFIX}/recently-viewed`);
    return items.map(transformClinic);
  },

  /** 記錄一次瀏覽（upsert） */
  recordRecentlyViewed: (facilityId: string): Promise<void> =>
    api.post<void>(`${PREFIX}/recently-viewed/${facilityId}`),
};
