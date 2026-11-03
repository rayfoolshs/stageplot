import { useEffect, useState } from "react";
import { PrintSheet } from "../print/PrintSheet";
import { downloadPdf } from "../lib/pdf";
import { shareApi, type SharedRider } from "./api";
import { appPath } from "../lib/appPath";
import "../print/print.css";

/** Public, read-only rider at /s/:token. No account needed. */
export function SharePage({ token }: { token: string }) {
  const [rider, setRider] = useState<SharedRider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    shareApi
      .get(token)
      .then(({ rider }) => {
        if (cancelled) return;
        setRider(rider);
        document.title = `${rider.name} — StagePlot`;
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "This link is no longer available.");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function download() {
    if (!rider) return;
    setBusy(true);
    const ok = await downloadPdf(rider.doc);
    setBusy(false);
    if (!ok) window.print();
  }

  return (
    <div className="print-page">
      <div className="print-toolbar">
        <span className="print-toolbar-title">{rider?.name ?? "Shared rider"}</span>
        {rider && (
          <>
            <button type="button" onClick={() => void download()} disabled={busy}>
              {busy ? "Preparing…" : "Download PDF"}
            </button>
            <button type="button" className="ghost" onClick={() => window.print()}>
              Print
            </button>
          </>
        )}
        <a href={appPath("/")} className="share-brand">
          StagePlot
        </a>
      </div>

      {error ? (
        <div className="share-error">
          <h1>Link unavailable</h1>
          <p>{error}</p>
          <a href={appPath("/")}>Go to StagePlot</a>
        </div>
      ) : rider ? (
        <PrintSheet doc={rider.doc} />
      ) : null}
    </div>
  );
}
