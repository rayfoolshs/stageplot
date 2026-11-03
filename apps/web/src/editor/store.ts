import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import {
  createEmptyDoc,
  type ChannelRow,
  type StageDoc,
  type StageItem,
  type TextItem,
} from "@stageplot/shared";
import { getLibraryItem, type LibraryItem } from "./library";

export type ListKind = "channels" | "outputs";

let idCounter = 0;
export function newId(prefix = "el"): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
}

const HISTORY_LIMIT = 100;
// The document is plain JSON-serializable data, so a JSON deep-clone is both
// safe and works on immer draft proxies (structuredClone cannot clone drafts).
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function emptyChannel(number: number): ChannelRow {
  return {
    id: newId("ch"),
    number,
    source: "",
    mic: "",
    stand: "",
    phantom: "",
    notes: "",
  };
}

interface EditorState {
  doc: StageDoc;
  selection: string[];
  scale: number;
  showGrid: boolean;
  past: StageDoc[];
  future: StageDoc[];

  // history
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  // document
  setDoc: (doc: StageDoc) => void;
  setMeta: (patch: Partial<StageDoc["meta"]>) => void;
  setFooter: (text: string) => void;

  // stage items
  addItem: (item: LibraryItem, centerX: number, centerY: number) => void;
  addText: (x: number, y: number) => void;
  updateItem: (id: string, patch: Partial<StageItem>) => void;
  updateText: (id: string, patch: Partial<TextItem>) => void;
  removeSelected: () => void;
  duplicateSelected: () => void;
  moveSelected: (dx: number, dy: number) => void;
  flipSelected: (axis: "x" | "y") => void;
  rotateSelected: (deg: number) => void;
  layer: (op: "front" | "back" | "forward" | "backward") => void;

  // selection
  setSelection: (ids: string[]) => void;
  toggleSelection: (id: string, additive?: boolean) => void;
  clearSelection: () => void;

  // channel lists
  addChannel: (kind: ListKind) => void;
  updateChannel: (kind: ListKind, id: string, patch: Partial<ChannelRow>) => void;
  removeChannel: (kind: ListKind, id: string) => void;

  // view
  setScale: (scale: number) => void;
  toggleGrid: () => void;
}

export const useEditorStore = create<EditorState>()(
  immer((set, get) => ({
    doc: createEmptyDoc(),
    selection: [],
    scale: 1,
    showGrid: true,
    past: [],
    future: [],

    pushHistory: () =>
      set((state) => {
        state.past.push(clone(state.doc));
        if (state.past.length > HISTORY_LIMIT) state.past.shift();
        state.future = [];
      }),

    undo: () =>
      set((state) => {
        const previous = state.past.pop();
        if (!previous) return;
        state.future.push(clone(state.doc));
        state.doc = previous;
        state.selection = state.selection.filter((id) =>
          state.doc.items.some((i) => i.id === id) ||
          state.doc.texts.some((t) => t.id === id),
        );
      }),

    redo: () =>
      set((state) => {
        const next = state.future.pop();
        if (!next) return;
        state.past.push(clone(state.doc));
        state.doc = next;
      }),

    setDoc: (doc) =>
      set((state) => {
        state.doc = clone(doc);
        state.selection = [];
        state.past = [];
        state.future = [];
      }),

    setMeta: (patch) =>
      set((state) => {
        Object.assign(state.doc.meta, patch);
      }),

    setFooter: (text) =>
      set((state) => {
        state.doc.footer.text = text;
      }),

    addItem: (item, centerX, centerY) =>
      set((state) => {
        state.past.push(clone(state.doc));
        state.future = [];
        const el: StageItem = {
          id: newId("it"),
          itemKey: item.key,
          x: centerX - item.w / 2,
          y: centerY - item.h / 2,
          w: item.w,
          h: item.h,
          rotation: 0,
          flipX: false,
          flipY: false,
        };
        state.doc.items.push(el);
        state.selection = [el.id];
      }),

    addText: (x, y) =>
      set((state) => {
        state.past.push(clone(state.doc));
        state.future = [];
        const el: TextItem = {
          id: newId("tx"),
          x,
          y,
          text: "Text",
          fontSize: 24,
          rotation: 0,
        };
        state.doc.texts.push(el);
        state.selection = [el.id];
      }),

    updateItem: (id, patch) =>
      set((state) => {
        const el = state.doc.items.find((i) => i.id === id);
        if (el) Object.assign(el, patch);
      }),

    updateText: (id, patch) =>
      set((state) => {
        const el = state.doc.texts.find((t) => t.id === id);
        if (el) Object.assign(el, patch);
      }),

    removeSelected: () =>
      set((state) => {
        if (state.selection.length === 0) return;
        state.past.push(clone(state.doc));
        state.future = [];
        const sel = new Set(state.selection);
        state.doc.items = state.doc.items.filter((i) => !sel.has(i.id));
        state.doc.texts = state.doc.texts.filter((t) => !sel.has(t.id));
        state.selection = [];
      }),

    duplicateSelected: () =>
      set((state) => {
        if (state.selection.length === 0) return;
        state.past.push(clone(state.doc));
        state.future = [];
        const sel = state.selection;
        const newIds: string[] = [];
        const itemCopies = state.doc.items
          .filter((i) => sel.includes(i.id))
          .map((i) => {
            const copy = { ...i, id: newId("it"), x: i.x + 24, y: i.y + 24 };
            newIds.push(copy.id);
            return copy;
          });
        const textCopies = state.doc.texts
          .filter((t) => sel.includes(t.id))
          .map((t) => {
            const copy = { ...t, id: newId("tx"), x: t.x + 24, y: t.y + 24 };
            newIds.push(copy.id);
            return copy;
          });
        state.doc.items.push(...itemCopies);
        state.doc.texts.push(...textCopies);
        state.selection = newIds;
      }),

    moveSelected: (dx, dy) =>
      set((state) => {
        const sel = state.selection;
        if (sel.length === 0) return;
        for (const el of state.doc.items) {
          if (sel.includes(el.id)) {
            el.x += dx;
            el.y += dy;
          }
        }
        for (const el of state.doc.texts) {
          if (sel.includes(el.id)) {
            el.x += dx;
            el.y += dy;
          }
        }
      }),

    flipSelected: (axis) =>
      set((state) => {
        state.past.push(clone(state.doc));
        state.future = [];
        for (const el of state.doc.items) {
          if (state.selection.includes(el.id)) {
            if (axis === "x") el.flipX = !el.flipX;
            else el.flipY = !el.flipY;
          }
        }
      }),

    rotateSelected: (deg) =>
      set((state) => {
        state.past.push(clone(state.doc));
        state.future = [];
        for (const el of state.doc.items) {
          if (state.selection.includes(el.id)) el.rotation = (el.rotation + deg) % 360;
        }
        for (const el of state.doc.texts) {
          if (state.selection.includes(el.id)) el.rotation = (el.rotation + deg) % 360;
        }
      }),

    layer: (op) =>
      set((state) => {
        const sel = state.selection;
        if (sel.length === 0) return;
        state.past.push(clone(state.doc));
        state.future = [];
        const items = state.doc.items;
        const selected = items.filter((i) => sel.includes(i.id));
        const rest = items.filter((i) => !sel.includes(i.id));
        if (op === "front") {
          state.doc.items = [...rest, ...selected];
        } else if (op === "back") {
          state.doc.items = [...selected, ...rest];
        } else if (op === "forward") {
          for (let i = items.length - 2; i >= 0; i -= 1) {
            if (sel.includes(items[i].id) && !sel.includes(items[i + 1].id)) {
              [items[i], items[i + 1]] = [items[i + 1], items[i]];
            }
          }
        } else {
          for (let i = 1; i < items.length; i += 1) {
            if (sel.includes(items[i].id) && !sel.includes(items[i - 1].id)) {
              [items[i], items[i - 1]] = [items[i - 1], items[i]];
            }
          }
        }
      }),

    setSelection: (ids) =>
      set((state) => {
        state.selection = ids;
      }),

    toggleSelection: (id, additive = true) =>
      set((state) => {
        if (!additive) {
          state.selection = [id];
          return;
        }
        state.selection = state.selection.includes(id)
          ? state.selection.filter((s) => s !== id)
          : [...state.selection, id];
      }),

    clearSelection: () =>
      set((state) => {
        state.selection = [];
      }),

    addChannel: (kind) =>
      set((state) => {
        state.past.push(clone(state.doc));
        state.future = [];
        const list = state.doc[kind];
        list.push(emptyChannel(list.length + 1));
      }),

    updateChannel: (kind, id, patch) =>
      set((state) => {
        const row = state.doc[kind].find((c) => c.id === id);
        if (row) Object.assign(row, patch);
      }),

    removeChannel: (kind, id) =>
      set((state) => {
        state.past.push(clone(state.doc));
        state.future = [];
        state.doc[kind] = state.doc[kind]
          .filter((c) => c.id !== id)
          .map((c, index) => ({ ...c, number: index + 1 }));
      }),

    setScale: (scale) =>
      set((state) => {
        state.scale = Math.min(2.5, Math.max(0.3, scale));
      }),

    toggleGrid: () =>
      set((state) => {
        state.showGrid = !state.showGrid;
      }),
  })),
);

export function useSelectedItem(): StageItem | undefined {
  return useEditorStore((state) => {
    if (state.selection.length !== 1) return undefined;
    return state.doc.items.find((i) => i.id === state.selection[0]);
  });
}

export function useSelectedText(): TextItem | undefined {
  return useEditorStore((state) => {
    if (state.selection.length !== 1) return undefined;
    return state.doc.texts.find((t) => t.id === state.selection[0]);
  });
}

export { getLibraryItem };
