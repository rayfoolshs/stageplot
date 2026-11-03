import { useEffect, useRef, useState } from "react";
import { Toolbar } from "./Toolbar";
import { LibraryPanel } from "./LibraryPanel";
import { Canvas } from "./Canvas";
import { InspectorPanel } from "./InspectorPanel";
import { InputList } from "./InputList";
import { initialDoc, saveDraft } from "../persistence";
import { useEditorStore } from "../store";
import { Splitter, useStoredSize } from "./Splitter";
import { ridersApi } from "../../riders/api";
import { saveRiderNow } from "../../riders/save";
import { ApiError } from "../../lib/http";

export function Editor({ riderId }: { riderId?: string }) {
  const theme = useEditorStore((s) => s.theme);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Hydrating a doc must not trigger an autosave of what we just loaded.
  const skipNextSave = useRef(false);

  // Panel layout — remembered between visits.
  const [libraryWidth, setLibraryWidth] = useStoredSize("stageplot:ui:library", 256, 180, 460);
  const [inspectorWidth, setInspectorWidth] = useStoredSize("stageplot:ui:inspector", 320, 220, 560);
  const [deskHeight, setDeskHeight] = useStoredSize("stageplot:ui:desk", 224, 120, 560);

  // Load the rider (or the local draft) once on mount. The theme starts out
  // already resolved in the store — see `initialTheme`.
  useEffect(() => {
    const store = useEditorStore.getState();

    if (!riderId) {
      skipNextSave.current = true;
      store.setDoc(initialDoc());
      store.setRiderId(null);
      store.setSaveState("idle");
      return;
    }

    let cancelled = false;
    void ridersApi
      .get(riderId)
      .then(({ rider }) => {
        if (cancelled) return;
        skipNextSave.current = true;
        store.setDoc(rider.doc);
        store.setRiderId(rider.id);
        store.setSaveState("saved");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          window.location.replace(`/login?next=${encodeURIComponent(`/r/${riderId}`)}`);
          return;
        }
        setLoadError(err instanceof Error ? err.message : "Could not load this rider.");
      });

    return () => {
      cancelled = true;
    };
  }, [riderId]);

  // Apply + persist the theme.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("light", theme === "light");
    root.style.colorScheme = theme;
    try {
      localStorage.setItem("stageplot:theme", theme);
    } catch {
      /* private mode / storage disabled: the theme just won't persist */
    }
  }, [theme]);

  // Debounced autosave: cloud riders go to the API, local drafts to localStorage.
  useEffect(() => {
    let timer: number | undefined;
    const unsubscribe = useEditorStore.subscribe((state, prev) => {
      if (state.doc === prev.doc) return;
      if (skipNextSave.current) {
        skipNextSave.current = false;
        return;
      }
      window.clearTimeout(timer);

      if (state.riderId) {
        state.setSaveState("saving");
        timer = window.setTimeout(() => void saveRiderNow(), 1000);
      } else {
        timer = window.setTimeout(() => saveDraft(state.doc), 500);
      }
    });
    return () => {
      unsubscribe();
      window.clearTimeout(timer);
    };
  }, []);

  // Global keyboard shortcuts (ignored while typing in a field).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      const s = useEditorStore.getState();
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (mod && key === "z") {
        e.preventDefault();
        if (e.shiftKey) s.redo();
        else s.undo();
        return;
      }
      if (mod && key === "y") {
        e.preventDefault();
        s.redo();
        return;
      }
      if (mod && key === "d") {
        e.preventDefault();
        s.duplicateSelected();
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        s.removeSelected();
        return;
      }
      if (e.key === "Escape") {
        s.clearSelection();
        return;
      }
      if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        s.pushHistory();
        s.moveSelected(dx, dy);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center bg-neutral-950 p-6">
        <div className="max-w-sm space-y-3 text-center">
          <h1 className="text-base font-semibold text-neutral-100">Couldn’t open this rider</h1>
          <p className="text-sm text-neutral-400">{loadError}</p>
          <a
            href="/riders"
            className="inline-block rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            Back to My riders
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Toolbar />
      <div className="flex min-h-0 flex-1">
        <LibraryPanel width={libraryWidth} />
        <Splitter
          orientation="vertical"
          label="Resize item library"
          value={libraryWidth}
          onChange={setLibraryWidth}
          min={180}
          max={460}
          reset={256}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            <Canvas />
          </div>
          <Splitter
            orientation="horizontal"
            label="Resize mixing desk"
            value={deskHeight}
            onChange={setDeskHeight}
            min={120}
            max={560}
            invert
            reset={224}
          />
          <InputList height={deskHeight} />
        </div>
        <Splitter
          orientation="vertical"
          label="Resize inspector"
          value={inspectorWidth}
          onChange={setInspectorWidth}
          min={220}
          max={560}
          invert
          reset={320}
        />
        <InspectorPanel width={inspectorWidth} />
      </div>
    </div>
  );
}
