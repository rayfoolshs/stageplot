import type { StageDoc } from "@stageplot/shared";
import { request } from "../lib/http";

export type SharedRider = {
  name: string;
  thumbnail: string | null;
  updatedAt: string;
  doc: StageDoc;
};

export const shareApi = {
  create: (riderId: string) =>
    request<{ shareToken: string; isPublic: boolean }>(`/api/riders/${riderId}/share`, {
      method: "POST",
      body: "{}",
    }),

  revoke: (riderId: string) =>
    request<{ ok: true }>(`/api/riders/${riderId}/share`, { method: "DELETE" }),

  get: (token: string) => request<{ rider: SharedRider }>(`/api/share/${token}`),
};
