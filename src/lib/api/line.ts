import { api } from "./client";
import type { BindByTokenRequest, BindResponse } from "@/types/line";

export const lineApi = {
  /** 綁定 LINE 到目前登入帳號（需先登入） */
  bindByToken: (data: BindByTokenRequest) =>
    api.post<BindResponse>("/api/v1/line/bind", data),

  /** 解除目前登入帳號的 LINE 綁定 */
  unbind: () => api.delete<void>("/api/v1/line/bind"),
};
