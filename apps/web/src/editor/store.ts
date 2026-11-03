import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import {
  createEmptyDoc,
  type ChannelRow,
  type ShapeItem,
  type ShapeKind,
  type StageDoc,
  type StageItem,
  type TextItem,
} from "@stageplot/shared";
import { getLibraryItem, type LibraryItem } from "./library";

export type ListKind = "channels" | "outputs";
export type DrawTool = "select" | ShapeKind;
export type Theme = "dark" | "light";

let idCounter = 0;
export function newId(prefix = "el"): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
}

/**
 * The theme to start with: the last explicit choice, otherwise light. Resolved
 * once at store creation so the initial render already has the right value (an
 * effect that corrects it later would flash and, worse, persist the wrong theme
 * on the way through). The versioned key lets older auto-saved values — which
 * could be dark from the OS default — be ignored.
 */
export function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem("stageplot:theme:v2");
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* storage unavailable — fall through to the default */
  }
  return "light";
}

/**
 * Items that stand for a monitor mix and therefore own a row in the desk's
 * output list. Adding one auto-names it "Monitor N" and links the two so the
 * caption on the plot and the desk row stay in sync.
 */
const MONITOR_ITEM_KEYS = new Set(["monitor"]);

/** Highest `Monitor N` number already on the plot (0 when there are none). */
function lastMonitorNumber(items: readonly StageItem[]): number {
  let highest = 0;
  for (const item of items) {
    if (!MONITOR_ITEM_KEYS.has(item.itemKey)) continue;
    const match = /^Monitor (\d+)$/.exec(item.label ?? "");
    if (match) highest = Math.max(highest, Number(match[1]));
  }
  return highest;
}

/** Keep channel `Monitor FB` choices pointing at the renamed monitor. */
function renameMonitorRefs(doc: StageDoc, from: string, to: string): void {
  if (!from || from === to) return;
  for (const row of doc.channels) {
    if (row.monitor === from) row.monitor = to;
  }
}

/** Name `item` as the next monitor and append its matching desk row. */
function attachMonitorRow(doc: StageDoc, item: StageItem, number: number): void {
  const label = `Monitor ${number}`;
  const row = emptyChannel(doc.outputs.length + 1);
  row.source = label;
  row.notes = "Stage monitor";
  doc.outputs.push(row);
  item.label = label;
  item.outputId = row.id;
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
    person: "",
    mic: "",
    inputType: "",
    stand: "",
    phantom: "",
    monitor: "",
    dca: "",
    notes: "",
  };
}

export type SaveState = "idle" | "saving" | "saved" | "error";

interface EditorState {
  doc: StageDoc;
  /** Cloud rider id when this document is bound to the API; null = local draft. */
  riderId: string | null;
  /** Public share token for the bound rider, when one exists. */
  shareToken: string | null;
  saveState: SaveState;
  selection: string[];
  scale: number;
  showGrid: boolean;
  showLabels: boolean;
  tool: DrawTool;
  theme: Theme;
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
  clearStage: () => void;
  clearDocument: () => void;
  setRiderId: (id: string | null) => void;
  setShareToken: (token: string | null) => void;
  setSaveState: (state: SaveState) => void;

  // stage items
  addItem: (item: LibraryItem, centerX: number, centerY: number) => void;
  addText: (x: number, y: number) => void;
  addShapeFromDrag: (kind: ShapeKind, x: number, y: number, w: number, h: number) => void;
  addPolygon: (points: { x: number; y: number }[]) => void;
  updateItem: (id: string, patch: Partial<StageItem>) => void;
  updateText: (id: string, patch: Partial<TextItem>) => void;
  updateShape: (id: string, patch: Partial<ShapeItem>) => void;
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
  toggleLabels: () => void;
  setTool: (tool: DrawTool) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useEditorStore = create<EditorState>()(
  immer((set, get) => ({
    doc: createEmptyDoc(),
    riderId: null,
    shareToken: null,
    saveState: "idle",
    selection: [],
    scale: 1,
    showGrid: true,
    showLabels: true,
    tool: "select",
    theme: initialTheme(),
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
          state.doc.texts.some((t) => t.id === id) ||
          state.doc.shapes.some((sh) => sh.id === id),
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

    clearStage: () =>
      set((state) => {
        state.past.push(clone(state.doc));
        if (state.past.length > HISTORY_LIMIT) state.past.shift();
        state.future = [];
        state.doc.items = [];
        state.doc.texts = [];
        state.doc.shapes = [];
        state.doc.arrows = [];
        state.selection = [];
      }),

    clearDocument: () =>
      set((state) => {
        state.past.push(clone(state.doc));
        if (state.past.length > HISTORY_LIMIT) state.past.shift();
        state.future = [];
        state.doc = createEmptyDoc();
        state.selection = [];
      }),

    setRiderId: (id) =>
      set((state) => {
        state.riderId = id;
      }),

    setShareToken: (token) =>
      set((state) => {
        state.shareToken = token;
      }),

    setSaveState: (saveState) =>
      set((state) => {
        state.saveState = saveState;
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
          label: item.label,
        };
        if (MONITOR_ITEM_KEYS.has(item.key)) {
          attachMonitorRow(state.doc, el, lastMonitorNumber(state.doc.items) + 1);
        }
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
        if (!el) return;
        const previousLabel = el.label ?? "";
        Object.assign(el, patch);
        // A renamed monitor keeps its desk row and its channel refs in step.
        if (el.outputId && patch.label !== undefined) {
          const row = state.doc.outputs.find((o) => o.id === el.outputId);
          if (row) row.source = patch.label;
          renameMonitorRefs(state.doc, previousLabel, patch.label);
        }
      }),

    updateText: (id, patch) =>
      set((state) => {
        const el = state.doc.texts.find((t) => t.id === id);
        if (el) Object.assign(el, patch);
      }),

    updateShape: (id, patch) =>
      set((state) => {
        const el = state.doc.shapes.find((sh) => sh.id === id);
        if (el) Object.assign(el, patch);
      }),

    addShapeFromDrag: (kind, x, y, w, h) =>
      set((state) => {
        state.past.push(clone(state.doc));
        state.future = [];
        const el: ShapeItem = {
          id: newId("sh"),
          kind,
          x,
          y,
          w,
          h,
          rotation: 0,
          fill: kind === "rect",
        };
        state.doc.shapes.push(el);
        state.selection = [el.id];
      }),

    addPolygon: (points) =>
      set((state) => {
        if (points.length < 3) return;
        state.past.push(clone(state.doc));
        state.future = [];
        const xs = points.map((p) => p.x);
        const ys = points.map((p) => p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const w = Math.max(1, Math.max(...xs) - minX);
        const h = Math.max(1, Math.max(...ys) - minY);
        const flat: number[] = [];
        for (const p of points) {
          flat.push((p.x - minX) / w, (p.y - minY) / h);
        }
        const el: ShapeItem = {
          id: newId("sh"),
          kind: "polygon",
          x: minX,
          y: minY,
          w,
          h,
          rotation: 0,
          points: flat,
          fill: false,
        };
        state.doc.shapes.push(el);
        state.selection = [el.id];
      }),

    removeSelected: () =>
      set((state) => {
        if (state.selection.length === 0) return;
        state.past.push(clone(state.doc));
        state.future = [];
        const sel = new Set(state.selection);
        // Deleting a monitor also drops its desk row.
        const orphanRows = new Set(
          state.doc.items
            .filter((i) => sel.has(i.id) && i.outputId)
            .map((i) => i.outputId as string),
        );
        state.doc.items = state.doc.items.filter((i) => !sel.has(i.id));
        state.doc.texts = state.doc.texts.filter((t) => !sel.has(t.id));
        state.doc.shapes = state.doc.shapes.filter((sh) => !sel.has(sh.id));
        if (orphanRows.size > 0) {
          state.doc.outputs = state.doc.outputs
            .filter((o) => !orphanRows.has(o.id))
            .map((o, index) => ({ ...o, number: index + 1 }));
        }
        state.selection = [];
      }),

    duplicateSelected: () =>
      set((state) => {
        if (state.selection.length === 0) return;
        state.past.push(clone(state.doc));
        state.future = [];
        const sel = state.selection;
        const newIds: string[] = [];
        let nextMonitor = lastMonitorNumber(state.doc.items) + 1;
        const itemCopies = state.doc.items
          .filter((i) => sel.includes(i.id))
          .map((i) => {
            const copy: StageItem = { ...i, id: newId("it"), x: i.x + 24, y: i.y + 24 };
            // A copied monitor is a new mix: number it and add its own row.
            if (MONITOR_ITEM_KEYS.has(i.itemKey)) {
              attachMonitorRow(state.doc, copy, nextMonitor);
              nextMonitor += 1;
            }
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
        const shapeCopies = state.doc.shapes
          .filter((sh) => sel.includes(sh.id))
          .map((sh) => {
            const copy = { ...sh, id: newId("sh"), x: sh.x + 24, y: sh.y + 24 };
            newIds.push(copy.id);
            return copy;
          });
        state.doc.items.push(...itemCopies);
        state.doc.texts.push(...textCopies);
        state.doc.shapes.push(...shapeCopies);
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
        for (const el of state.doc.shapes) {
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
        for (const el of state.doc.shapes) {
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
        if (!row) return;
        const previousSource = row.source;
        Object.assign(row, patch);
        // Renaming a monitor row retitles its item on the plot and any channel
        // that already feeds it.
        if (kind === "outputs" && patch.source !== undefined) {
          const linked = state.doc.items.find((i) => i.outputId === id);
          if (linked) linked.label = patch.source;
          renameMonitorRefs(state.doc, previousSource, patch.source);
        }
      }),

    removeChannel: (kind, id) =>
      set((state) => {
        state.past.push(clone(state.doc));
        state.future = [];
        state.doc[kind] = state.doc[kind]
          .filter((c) => c.id !== id)
          .map((c, index) => ({ ...c, number: index + 1 }));
        // The item stays on the plot, it just no longer has a desk row.
        if (kind === "outputs") {
          for (const item of state.doc.items) {
            if (item.outputId === id) item.outputId = undefined;
          }
        }
      }),

    setScale: (scale) =>
      set((state) => {
        state.scale = Math.min(2.5, Math.max(0.3, scale));
      }),

    toggleGrid: () =>
      set((state) => {
        state.showGrid = !state.showGrid;
      }),

    toggleLabels: () =>
      set((state) => {
        state.showLabels = !state.showLabels;
      }),

    setTool: (tool) =>
      set((state) => {
        state.tool = tool;
      }),

    setTheme: (theme) =>
      set((state) => {
        state.theme = theme;
      }),

    toggleTheme: () =>
      set((state) => {
        state.theme = state.theme === "dark" ? "light" : "dark";
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

export function useSelectedShape(): ShapeItem | undefined {
  return useEditorStore((state) => {
    if (state.selection.length !== 1) return undefined;
    return state.doc.shapes.find((sh) => sh.id === state.selection[0]);
  });
}

export { getLibraryItem };
