import { create } from "zustand";
import { authApi, type AuthUser } from "./api";
import { STATIC_DEMO } from "../lib/env";

type AuthState = {
  user: AuthUser | null;
  /** "loading" until the first /me round-trip settles. */
  status: "loading" | "ready";
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "loading",

  refresh: async () => {
    // The static Pages demo has no API — probing it only produces a 404.
    if (STATIC_DEMO) {
      set({ user: null, status: "ready" });
      return;
    }
    try {
      const { user } = await authApi.me();
      set({ user, status: "ready" });
    } catch {
      // 401 = signed out; network errors also land here and are treated the
      // same (the editor keeps working locally).
      set({ user: null, status: "ready" });
    }
  },

  login: async (email, password) => {
    const { user } = await authApi.login(email, password);
    set({ user, status: "ready" });
  },

  register: async (email, password) => {
    const { user } = await authApi.register(email, password);
    set({ user, status: "ready" });
  },

  logout: async () => {
    await authApi.logout();
    set({ user: null });
  },
}));
