import { create } from "zustand";

export type ToastKind = "info" | "success" | "error";

export type Toast = { id: number; message: string; kind: ToastKind };

type ToastState = {
  toasts: Toast[];
  push: (message: string, kind?: ToastKind) => void;
  dismiss: (id: number) => void;
};

const LIFETIME = 4_500;
let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  push: (message, kind = "info") => {
    const id = nextId++;
    set((state) => ({ toasts: [...state.toasts, { id, message, kind }] }));
    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
    }, LIFETIME);
  },

  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));

/** Fire-and-forget helper for non-component code (stores, save loop). */
export function toast(message: string, kind: ToastKind = "info"): void {
  useToastStore.getState().push(message, kind);
}
