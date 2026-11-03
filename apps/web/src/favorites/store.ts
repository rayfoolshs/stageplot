import { create } from "zustand";
import { toast } from "../ui/toast";
import { favoritesApi } from "./api";

type FavoritesState = {
  itemKeys: string[];
  loaded: boolean;
  load: () => Promise<void>;
  toggle: (itemKey: string) => Promise<void>;
  clear: () => void;
};

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  itemKeys: [],
  loaded: false,

  load: async () => {
    try {
      const { itemKeys } = await favoritesApi.list();
      set({ itemKeys, loaded: true });
    } catch {
      // Signed out or offline: stars simply stay empty.
      set({ itemKeys: [], loaded: true });
    }
  },

  toggle: async (itemKey) => {
    const previous = get().itemKeys;
    // Optimistic: stars should react instantly.
    const next = previous.includes(itemKey)
      ? previous.filter((key) => key !== itemKey)
      : [...previous, itemKey];
    set({ itemKeys: next });

    try {
      const { itemKeys } = await favoritesApi.toggle(itemKey);
      set({ itemKeys });
    } catch {
      set({ itemKeys: previous });
      toast("Couldn’t update favorites.", "error");
    }
  },

  clear: () => set({ itemKeys: [], loaded: false }),
}));
