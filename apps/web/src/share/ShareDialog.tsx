import { useEffect, useState } from "react";
import { useEditorStore } from "../editor/store";
import { shareApi } from "./api";
import { toast } from "../ui/toast";

/** Owner-side control for the public read-only link. */
export function ShareDialog({ onClose }: { onClose: () => void }) {
  const riderId = useEditorStore((s) => s.riderId);
  const token = useEditorStore((s) => s.shareToken);
  const setToken = useEditorStore((s) => s.setShareToken);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const url = token ? `${window.location.origin}/s/${token}` : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function create() {
    if (!riderId) return;
    setBusy(true);
    setError(null);
    try {
      const { shareToken } = await shareApi.create(riderId);
      setToken(shareToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create a link.");
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    if (!riderId) return;
    if (!confirm("Revoke this link? Anyone using it will lose access immediately.")) return;
    setBusy(true);
    setError(null);
    try {
      await shareApi.revoke(riderId);
      setToken(null);
      setCopied(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not revoke the link.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("Share link copied.", "success");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Copy failed — select the link and copy it manually.");
      toast("Couldn’t copy the link — select it and copy manually.", "error");
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md space-y-3 rounded-lg border border-neutral-700 bg-neutral-900 p-4 text-neutral-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h2 id="share-title" className="text-sm font-semibold">
            Share this rider
          </h2>
          <p className="mt-1 text-xs text-neutral-400">
            Anyone with the link can view it read-only. Revoking the link cuts off access
            immediately.
          </p>
        </div>

        {error && (
          <p role="alert" className="rounded border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        )}

        {url ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                readOnly
                value={url}
                aria-label="Share link"
                onFocus={(e) => e.currentTarget.select()}
                className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-xs text-neutral-200 focus:border-sky-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => void copy()}
                className="shrink-0 rounded bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-500"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-xs text-sky-400 hover:text-sky-300"
            >
              Open the public view ↗
            </a>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void create()}
            disabled={busy || !riderId}
            className="w-full rounded bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? "Creating…" : "Create share link"}
          </button>
        )}

        <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
          {url ? (
            <button
              type="button"
              onClick={() => void revoke()}
              disabled={busy}
              className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
            >
              Revoke link
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-neutral-800 px-3 py-1.5 text-xs text-neutral-200 hover:bg-neutral-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
