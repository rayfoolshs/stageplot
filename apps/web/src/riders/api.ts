import type { StageDoc } from "@stageplot/shared";
import { request } from "../lib/http";

export type RiderSummary = {
  id: string;
  name: string;
  thumbnail: string | null;
  /** Set while the rider is publicly shareable; null after revoking. */
  shareToken: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RiderWithDoc = RiderSummary & { doc: StageDoc };

export const ridersApi = {
  list: () => request<{ riders: RiderSummary[] }>("/api/riders"),

  get: (id: string) => request<{ rider: RiderWithDoc }>(`/api/riders/${id}`),

  create: (doc: StageDoc, thumbnail?: string) =>
    request<{ rider: RiderSummary }>("/api/riders", {
      method: "POST",
      body: JSON.stringify({ doc, thumbnail }),
    }),

  update: (
    id: string,
    patch: { doc?: StageDoc; name?: string; thumbnail?: string },
  ) =>
    request<{ rider: RiderSummary }>(`/api/riders/${id}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    }),

  remove: (id: string) => request<{ ok: true }>(`/api/riders/${id}`, { method: "DELETE" }),
};
