import { useEffect, useState } from "react";
import { parseStageDoc, type StageDoc } from "@stageplot/shared";
import { PrintSheet } from "./PrintSheet";
import "./print.css";

const PRINT_DOC_KEY = "stageplot:print-doc";
const DRAFT_KEY = "stageplot:draft:v1";

/**
 * Read-only rider at A4 size. Used two ways:
 *  - the export button opens it in a tab (browser print → save as PDF);
 *  - the API loads it in headless Chrome and prints it to a PDF blob.
 */
export function PrintPage() {
  const [doc, setDoc] = useState<StageDoc | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PRINT_DOC_KEY) ?? localStorage.getItem(DRAFT_KEY);
      if (!raw) throw new Error("no document");
      setDoc(parseStageDoc(JSON.parse(raw)));
    } catch {
      setError("No rider to print. Open the editor and try exporting again.");
    }
  }, []);

  // Signal readiness to the headless renderer once fonts have settled.
  useEffect(() => {
    if (!doc) return;
    let cancelled = false;
    const ready = () => {
      if (!cancelled) document.body.dataset.printReady = "1";
    };
    document.fonts?.ready.then(ready) ?? ready();
    const timer = window.setTimeout(ready, 1500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [doc]);

  return (
    <div className="print-page">
      <div className="print-toolbar">
        <span className="print-toolbar-title">{doc?.meta.name || "Rider"}</span>
        <button type="button" onClick={() => window.print()} disabled={!doc}>
          Print / Save as PDF
        </button>
        <button type="button" className="ghost" onClick={() => window.close()}>
          Close
        </button>
      </div>

      {error ? (
        <p className="print-error">{error}</p>
      ) : doc ? (
        <PrintSheet doc={doc} />
      ) : null}
    </div>
  );
}
