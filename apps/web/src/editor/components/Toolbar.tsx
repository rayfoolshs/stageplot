import { useState } from "react";
import { createEmptyDoc } from "@stageplot/shared";
import { useEditorStore } from "../store";
import { clearDraft } from "../persistence";
import { downloadPdf } from "../../lib/pdf";

const PRINT_DOC_KEY = "stageplot:print-doc";

/** Open the read-only print view in a new tab (browser print → save as PDF). */
function openPrintView() {
  localStorage.setItem(PRINT_DOC_KEY, JSON.stringify(useEditorStore.getState().doc));
  window.open("/print", "_blank");
}

async function exportPdf() {
  const doc = useEditorStore.getState().doc;
  const ok = await downloadPdf(doc);
  // No API (or no Chrome on the server): fall back to the browser's own
  // "save as PDF" from the print view.
  if (!ok) openPrintView();
}

function ToolButton({
  label,
  title,
  onClick,
  disabled,
  active,
}: {
  label: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md px-2.5 py-1.5 text-sm transition ${
        active
          ? "bg-sky-500 text-white"
          : "bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {label}
    </button>
  );
}

const Divider = () => <span className="mx-1 h-5 w-px bg-neutral-800" />;

export function Toolbar() {
  const scale = useEditorStore((s) => s.scale);
  const showGrid = useEditorStore((s) => s.showGrid);
  const showLabels = useEditorStore((s) => s.showLabels);
  const tool = useEditorStore((s) => s.tool);
  const theme = useEditorStore((s) => s.theme);
  const selection = useEditorStore((s) => s.selection);
  const [exporting, setExporting] = useState(false);
  const canUndo = useEditorStore((s) => s.past.length > 0);
  const canRedo = useEditorStore((s) => s.future.length > 0);
  const hasSelection = selection.length > 0;

  const store = useEditorStore;

  return (
    <header className="flex flex-wrap items-center gap-1 border-b border-neutral-800 bg-neutral-900 px-3 py-2">
      <span className="mr-2 text-sm font-semibold tracking-wide">StagePlot</span>

      <ToolButton label="↶" title="Undo (Ctrl+Z)" onClick={() => store.getState().undo()} disabled={!canUndo} />
      <ToolButton label="↷" title="Redo (Ctrl+Shift+Z)" onClick={() => store.getState().redo()} disabled={!canRedo} />

      <Divider />

      <ToolButton label="Select" title="Select / move" active={tool === "select"} onClick={() => store.getState().setTool("select")} />
      <ToolButton label="Rect" title="Draw a rectangle" active={tool === "rect"} onClick={() => store.getState().setTool("rect")} />
      <ToolButton label="Circle" title="Draw a circle / ellipse" active={tool === "ellipse"} onClick={() => store.getState().setTool("ellipse")} />
      <ToolButton label="Polygon" title="Draw a polygon — click points, Enter or double-click to finish" active={tool === "polygon"} onClick={() => store.getState().setTool("polygon")} />

      <Divider />

      <ToolButton label="⟲ 15°" title="Rotate -15°" onClick={() => store.getState().rotateSelected(-15)} disabled={!hasSelection} />
      <ToolButton label="⟳ 15°" title="Rotate +15°" onClick={() => store.getState().rotateSelected(15)} disabled={!hasSelection} />
      <ToolButton label="Flip H" title="Flip horizontally" onClick={() => store.getState().flipSelected("x")} disabled={!hasSelection} />
      <ToolButton label="Flip V" title="Flip vertically" onClick={() => store.getState().flipSelected("y")} disabled={!hasSelection} />

      <Divider />

      <ToolButton label="Front" title="Bring to front" onClick={() => store.getState().layer("front")} disabled={!hasSelection} />
      <ToolButton label="Fwd" title="Bring forward" onClick={() => store.getState().layer("forward")} disabled={!hasSelection} />
      <ToolButton label="Back" title="Send backward" onClick={() => store.getState().layer("backward")} disabled={!hasSelection} />
      <ToolButton label="Bottom" title="Send to back" onClick={() => store.getState().layer("back")} disabled={!hasSelection} />

      <Divider />

      <ToolButton label="Duplicate" title="Duplicate (Ctrl+D)" onClick={() => store.getState().duplicateSelected()} disabled={!hasSelection} />
      <ToolButton label="Delete" title="Delete (Del)" onClick={() => store.getState().removeSelected()} disabled={!hasSelection} />
      <ToolButton
        label="Add text"
        title="Add a text label"
        onClick={() => {
          const s = store.getState();
          s.addText(40, 40);
        }}
      />

      <Divider />

      <ToolButton label="−" title="Zoom out" onClick={() => store.getState().setScale(scale - 0.1)} />
      <span className="w-12 text-center text-xs text-neutral-400">{Math.round(scale * 100)}%</span>
      <ToolButton label="+" title="Zoom in" onClick={() => store.getState().setScale(scale + 0.1)} />
      <ToolButton label="Grid" title="Toggle grid" active={showGrid} onClick={() => store.getState().toggleGrid()} />
      <ToolButton label="Labels" title="Show / hide item labels" active={showLabels} onClick={() => store.getState().toggleLabels()} />

      <div className="ml-auto flex items-center gap-1">
        <ToolButton
          label={theme === "dark" ? "☾" : "☀"}
          title={theme === "dark" ? "Dark mode — switch to light" : "Light mode — switch to dark"}
          onClick={() => store.getState().toggleTheme()}
        />
        <ToolButton
          label="New"
          title="Start a new rider"
          onClick={() => {
            if (!confirm("Start a new rider? Unsaved changes are lost.")) return;
            clearDraft();
            store.getState().setDoc(createEmptyDoc());
          }}
        />
        <button
          type="button"
          title="Download this rider as a PDF"
          disabled={exporting}
          onClick={async () => {
            setExporting(true);
            try {
              await exportPdf();
            } finally {
              setExporting(false);
            }
          }}
          className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-500 disabled:cursor-wait disabled:opacity-60"
        >
          {exporting ? "Rendering…" : "Export PDF"}
        </button>
      </div>
    </header>
  );
}
