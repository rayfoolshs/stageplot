import { useEffect, useRef, useState } from "react";
import { Toolbar } from "./Toolbar";
import { LibraryPanel } from "./LibraryPanel";
import { Canvas } from "./Canvas";
import { InspectorPanel } from "./InspectorPanel";
import { InputList } from "./InputList";
import type { StageDoc } from "@stageplot/shared";
import { initialDoc, saveDraft } from "../persistence";
import { useEditorStore } from "../store";
import { Splitter, useStoredSize } from "./Splitter";
import { ridersApi } from "../../riders/api";
import { saveRiderNow } from "../../riders/save";
import { ApiError } from "../../lib/http";
import { appPath } from "../../lib/appPath";

export function Editor({ riderId }: { riderId?: string }) {
  const theme = useEditorStore((s) => s.theme);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Hydrating a doc must not trigger an autosave of what we just loaded.
  // The object we just loaded: autosave ignores exactly that value, but any
  // subsequent edit (a new object) saves. A boolean flag was consumed by the
  // first user edit instead of the load, so the first change after opening a
  // document was never persisted.
  const loadedDoc = useRef<StageDoc | null>(null);

  // Panel layout — remembered between visits.
  const [libraryWidth, setLibraryWidth] = useStoredSize("stageplot:ui:library", 256, 180, 460);
  const [inspectorWidth, setInspectorWidth] = useStoredSize("stageplot:ui:inspector", 320, 220, 560);
  const [deskHeight, setDeskHeight] = useStoredSize("stageplot:ui:desk", 224, 120, 560);

  // Load the rider (or the local draft) once on mount. The theme starts out
  // already resolved in the store — see `initialTheme`.
  useEffect(() => {
    const store = useEditorStore.getState();

    if (!riderId) {
      const doc = initialDoc();
      loadedDoc.current = doc;
      store.setDoc(doc);
      store.setRiderId(null);
      store.setShareToken(null);
      store.setSaveState("idle");
      return;
    }

    let cancelled = false;
    void ridersApi
      .get(riderId)
      .then(({ rider }) => {
        if (cancelled) return;
        loadedDoc.current = rider.doc;
        store.setDoc(rider.doc);
        store.setRiderId(rider.id);
        store.setShareToken(rider.shareToken ?? null);
        store.setSaveState("saved");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          window.location.replace(appPath(`/login?next=${encodeURIComponent(`/r/${riderId}`)}`));
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
      localStorage.setItem("stageplot:theme:v2", theme);
    } catch {
      /* private mode / storage disabled: the theme just won't persist */
    }
  }, [theme]);

  // Debounced autosave: cloud riders go to the API, local drafts to localStorage.
  useEffect(() => {
    let timer: number | undefined;
    const unsubscribe = useEditorStore.subscribe((state, prev) => {
      if (state.doc === prev.doc) return;
      if (state.doc === loadedDoc.current) return;
      window.clearTimeout(timer);
      state.setDirty(true);

      if (state.riderId) {
        state.setSaveState("saving");
        timer = window.setTimeout(() => {
          void saveRiderNow().then(() => useEditorStore.getState().setDirty(false));
        }, 1000);
      } else {
        timer = window.setTimeout(() => {
          saveDraft(state.doc);
          useEditorStore.getState().setDirty(false);
        }, 500);
      }
    });
    return () => {
      unsubscribe();
      window.clearTimeout(timer);
    };
  }, []);

  // Warn before leaving with unsaved work — a failed cloud save, or a local
  // write that hasn't landed yet.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      const s = useEditorStore.getState();
      if (s.dirty || s.saveState === "error") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
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
            href={appPath("/riders")}
            className="inline-block rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            Back to My riders
          </a>
        </div>
      </div>
    );
  }

  return (
    // The editor is desktop-first: below this width the page scrolls rather
    // than crushing the canvas. Secondary pages are responsive on their own.
    <div className="flex h-full min-w-[1100px] flex-col">
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
