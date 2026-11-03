import { request } from "../lib/http";

export { ApiError } from "../lib/http";

export type AuthUser = {
  id: string;
  email: string;
  createdAt: string;
};

export const authApi = {
  me: () => request<{ user: AuthUser }>("/api/auth/me"),

  login: (email: string, password: string) =>
    request<{ user: AuthUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string) =>
    request<{ user: AuthUser }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () => request<{ ok: true }>("/api/auth/logout", { method: "POST", body: "{}" }),
};
