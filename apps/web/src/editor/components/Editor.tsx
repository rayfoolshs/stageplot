import { useEffect } from "react";
import { Toolbar } from "./Toolbar";
import { LibraryPanel } from "./LibraryPanel";
import { Canvas } from "./Canvas";
import { InspectorPanel } from "./InspectorPanel";
import { initialDoc, saveDraft } from "../persistence";
import { useEditorStore } from "../store";

export function Editor() {
  const theme = useEditorStore((s) => s.theme);

  // Load the draft once on mount.
  useEffect(() => {
    useEditorStore.getState().setDoc(initialDoc());
    const savedTheme = localStorage.getItem("stageplot:theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      useEditorStore.getState().setTheme(savedTheme);
    }
  }, []);

  // Apply + persist the theme.
  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    localStorage.setItem("stageplot:theme", theme);
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
        <LibraryPanel />
        <div className="min-w-0 flex-1">
          <Canvas />
        </div>
        <InspectorPanel />
      </div>
    </div>
  );
}
