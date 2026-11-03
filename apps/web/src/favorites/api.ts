import { request } from "../lib/http";

export const favoritesApi = {
  list: () => request<{ itemKeys: string[] }>("/api/favorites"),

  toggle: (itemKey: string) =>
    request<{ itemKeys: string[] }>("/api/favorites", {
      method: "PUT",
      body: JSON.stringify({ itemKey }),
    }),
};
