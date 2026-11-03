import { useEffect } from "react";
import { Toolbar } from "./Toolbar";
import { LibraryPanel } from "./LibraryPanel";
import { Canvas } from "./Canvas";
import { InspectorPanel } from "./InspectorPanel";
import { InputList } from "./InputList";
import { initialDoc, saveDraft } from "../persistence";
import { useEditorStore } from "../store";
import { Splitter, useStoredSize } from "./Splitter";

export function Editor() {
  const theme = useEditorStore((s) => s.theme);

  // Panel layout — remembered between visits.
  const [libraryWidth, setLibraryWidth] = useStoredSize("stageplot:ui:library", 256, 180, 460);
  const [inspectorWidth, setInspectorWidth] = useStoredSize("stageplot:ui:inspector", 320, 220, 560);
  const [deskHeight, setDeskHeight] = useStoredSize("stageplot:ui:desk", 224, 120, 560);

  // Load the draft once on mount. The theme starts out already resolved in the
  // store — see `initialTheme`.
  useEffect(() => {
    useEditorStore.getState().setDoc(initialDoc());
  }, []);

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

  // Debounced autosave to localStorage whenever the document changes.
  useEffect(() => {
    let timer: number | undefined;
    const unsubscribe = useEditorStore.subscribe((state, prev) => {
      if (state.doc === prev.doc) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => saveDraft(state.doc), 500);
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
