import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { createExampleDoc } from "../exampleDoc";
import { downloadRiderFile, readRiderFile } from "../file";
import { BRAND } from "../../brand";
import { useEditorStore } from "../store";
import { clearDraft } from "../persistence";
import { AccountMenu } from "../../auth/AccountMenu";
import { useAuthStore } from "../../auth/store";
import { saveToCloud } from "../../riders/save";
import { downloadPdf } from "../../lib/pdf";
import { ShareDialog } from "../../share/ShareDialog";
import { appPath } from "../../lib/appPath";
import { toast } from "../../ui/toast";

const PRINT_DOC_KEY = "stageplot:print-doc";

/** Open the read-only print view in a new tab (browser print → save as PDF). */
function openPrintView() {
  localStorage.setItem(PRINT_DOC_KEY, JSON.stringify(useEditorStore.getState().doc));
  window.open(appPath("/print"), "_blank");
}

function openPrintViewWithNotice() {
  toast("PDF service unavailable — opening the print view instead.");
  openPrintView();
}

const STATIC_DEMO = import.meta.env.VITE_STATIC_DEMO === "1";

async function exportPdf() {
  const doc = useEditorStore.getState().doc;
  // The Pages build has no render API; open the print view inside the click so
  // the browser still treats it as a user gesture (popup blockers).
  if (STATIC_DEMO) {
    openPrintView();
    return;
  }
  const ok = await downloadPdf(doc);
  // No API (or no Chrome on the server): fall back to the browser's own
  // "save as PDF" from the print view.
  if (!ok) openPrintViewWithNotice();
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
  const riderId = useEditorStore((s) => s.riderId);
  const saveState = useEditorStore((s) => s.saveState);
  const user = useAuthStore((s) => s.user);
  const [exporting, setExporting] = useState(false);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [fileOpen, setFileOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleOpenFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const doc = await readRiderFile(file);
      const s = useEditorStore.getState();
      s.setDoc(doc);
      s.setRiderId(null);
      s.setShareToken(null);
      s.setSaveState("idle");
      s.clearSelection();
      window.history.replaceState({}, "", appPath("/"));
      toast("Rider opened.", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not open that file.", "error");
    }
  }
  const canUndo = useEditorStore((s) => s.past.length > 0);
  const canRedo = useEditorStore((s) => s.future.length > 0);
  const hasSelection = selection.length > 0;

  const store = useEditorStore;

  return (
    <header className="flex flex-wrap items-center gap-1 border-b border-neutral-800 bg-neutral-900 px-3 py-2">
      <a
        href={BRAND.url}
        target="_blank"
        rel="noreferrer"
        title={BRAND.urlLabel}
        className="mr-2 text-sm font-semibold tracking-wide"
      >
        {BRAND.name} <span className="font-normal text-neutral-500">by {BRAND.author}</span>
      </a>

      <ToolButton label="↶" title="Undo (Ctrl+Z)" onClick={() => store.getState().undo()} disabled={!canUndo} />
      <ToolButton label="↷" title="Redo (Ctrl+Shift+Z)" onClick={() => store.getState().redo()} disabled={!canRedo} />

      <Divider />

      <ToolButton label="Select" title="Select / move" active={tool === "select"} onClick={() => store.getState().setTool("select")} />
      <ToolButton label="Rect" title="Draw a rectangle" active={tool === "rect"} onClick={() => store.getState().setTool("rect")} />
      <ToolButton label="Circle" title="Draw a circle / ellipse" active={tool === "ellipse"} onClick={() => store.getState().setTool("ellipse")} />
      <ToolButton label="Polygon" title="Draw a polygon — click points, Enter or double-click to finish" active={tool === "polygon"} onClick={() => store.getState().setTool("polygon")} />
      <ToolButton
        label="Power"
        title="Draw a red power run that routes around items — click points, Enter or double-click to finish"
        active={tool === "power"}
        onClick={() => store.getState().setTool("power")}
      />

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
        {user && (
          <a
            href={appPath("/riders")}
            className="rounded-md bg-neutral-800 px-2.5 py-1.5 text-sm text-neutral-200 hover:bg-neutral-700"
          >
            My riders
          </a>
        )}

        {user && !riderId && (
          <button
            type="button"
            title={
              cloudError
                ? cloudError
                : "Save this rider to your account (autosaves afterwards)"
            }
            disabled={cloudBusy}
            onClick={async () => {
              setCloudBusy(true);
              setCloudError(null);
              try {
                await saveToCloud();
                toast("Saved to your account. Changes now autosave.", "success");
              } catch (err) {
                const message =
                  err instanceof Error ? err.message : "Could not save to the cloud.";
                setCloudError(message);
                toast(message, "error");
              } finally {
                setCloudBusy(false);
              }
            }}
            className={`rounded-md px-2.5 py-1.5 text-sm ${
              cloudError
                ? "bg-red-900/60 text-red-200"
                : "bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
            } disabled:cursor-wait disabled:opacity-60`}
          >
            {cloudBusy ? "Saving…" : cloudError ? "Save failed" : "Save to cloud"}
          </button>
        )}

        {riderId && (
          <span
            title={saveState === "error" ? "Autosave failed — your latest edits aren’t saved" : "Cloud autosave"}
            className={`px-1 text-xs ${
              saveState === "error" ? "text-red-400" : "text-neutral-500"
            }`}
          >
            {saveState === "saving"
              ? "Saving…"
              : saveState === "error"
                ? "Save failed"
                : "Saved"}
          </span>
        )}

        {riderId && user && (
          <button
            type="button"
            title="Create or manage a public read-only link"
            onClick={() => setShareOpen(true)}
            className="rounded-md bg-neutral-800 px-2.5 py-1.5 text-sm text-neutral-200 hover:bg-neutral-700"
          >
            Share
          </button>
        )}

        <AccountMenu />
        <ToolButton
          label={theme === "dark" ? "☾" : "☀"}
          title={theme === "dark" ? "Dark mode — switch to light" : "Light mode — switch to dark"}
          onClick={() => store.getState().toggleTheme()}
        />
        <div className="relative">
          <ToolButton
            label="File"
            title="Save this rider to a file, or open one"
            active={fileOpen}
            onClick={() => setFileOpen((open) => !open)}
          />
          {fileOpen && (
            <div className="absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-md border border-neutral-700 bg-neutral-900 py-1 shadow-lg">
              <button
                type="button"
                className="block w-full px-3 py-1.5 text-left text-sm text-neutral-200 hover:bg-neutral-800"
                onClick={() => {
                  setFileOpen(false);
                  downloadRiderFile(store.getState().doc);
                  toast("Rider saved to your downloads.", "success");
                }}
              >
                Save to file…
              </button>
              <button
                type="button"
                className="block w-full px-3 py-1.5 text-left text-sm text-neutral-200 hover:bg-neutral-800"
                onClick={() => {
                  setFileOpen(false);
                  fileInputRef.current?.click();
                }}
              >
                Open from file…
              </button>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleOpenFile}
        />
        <div className="relative">
          <ToolButton
            label="Clear"
            title="Clear the stage or the whole document"
            active={clearOpen}
            onClick={() => setClearOpen((open) => !open)}
          />
          {clearOpen && (
            <div className="absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-md border border-neutral-700 bg-neutral-900 py-1 shadow-lg">
              <button
                type="button"
                className="block w-full px-3 py-1.5 text-left text-sm text-neutral-200 hover:bg-neutral-800"
                onClick={() => {
                  setClearOpen(false);
                  if (
                    !confirm(
                      "Clear the stage? All items, text and shapes will be removed. The input list, outputs and notes are kept. (Undo with Ctrl+Z.)",
                    )
                  )
                    return;
                  store.getState().clearStage();
                }}
              >
                Clear stage only
              </button>
              <button
                type="button"
                className="block w-full px-3 py-1.5 text-left text-sm text-red-300 hover:bg-neutral-800"
                onClick={() => {
                  setClearOpen(false);
                  if (
                    !confirm(
                      "Clear the whole document? The stage, input list, outputs and notes will all be removed. (Undo with Ctrl+Z.)",
                    )
                  )
                    return;
                  store.getState().clearDocument();
                  store.getState().setRiderId(null);
                  store.getState().setShareToken(null);
                  store.getState().setSaveState("idle");
                  window.history.replaceState({}, "", appPath("/"));
                }}
              >
                Clear everything
              </button>
            </div>
          )}
        </div>
        <ToolButton
          label="New"
          title="Start a new rider from the example layout"
          onClick={() => {
            if (!confirm("Start a new rider? Unsaved changes are lost.")) return;
            clearDraft();
            store.getState().setDoc(createExampleDoc());
            store.getState().setRiderId(null);
            store.getState().setShareToken(null);
            store.getState().setSaveState("idle");
            window.history.replaceState({}, "", appPath("/"));
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
          {exporting ? "Rendering…" : STATIC_DEMO ? "Print / Save PDF" : "Export PDF"}
        </button>
      </div>

      {shareOpen && <ShareDialog onClose={() => setShareOpen(false)} />}
    </header>
  );
}
