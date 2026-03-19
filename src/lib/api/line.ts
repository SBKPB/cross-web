import { api } from "./client";
import type { BindByTokenRequest, BindResponse } from "@/types/line";

export const lineApi = {
  /** Token-based 綁定 */
  bindByToken: (data: BindByTokenRequest) =>
    api.post<BindResponse>("/api/v1/line/bind", data),
};
