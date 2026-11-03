import { useCallback, useEffect, useState } from "react";
import { createEmptyDoc } from "@stageplot/shared";
import { useAuthStore } from "../auth/store";
import { AccountMenu } from "../auth/AccountMenu";
import { ridersApi, type RiderSummary } from "./api";
import { renderThumbnail } from "./thumbnail";

const LOGIN = `/login?next=${encodeURIComponent("/riders")}`;

export function MyRidersPage() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);

  const [riders, setRiders] = useState<RiderSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    if (useAuthStore.getState().status === "loading") void useAuthStore.getState().refresh();
  }, []);

  useEffect(() => {
    if (status === "ready" && !user) window.location.replace(LOGIN);
  }, [status, user]);

  const load = useCallback(async () => {
    try {
      const { riders } = await ridersApi.list();
      setRiders(riders);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your riders.");
    }
  }, []);

  useEffect(() => {
    if (status === "ready" && user) void load();
  }, [status, user, load]);

  async function createNew() {
    setCreating(true);
    setError(null);
    try {
      const doc = createEmptyDoc("Untitled rider");
      const { rider } = await ridersApi.create(doc, (await renderThumbnail(doc)) ?? undefined);
      window.location.assign(`/r/${rider.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create a rider.");
      setCreating(false);
    }
  }

  async function commitRename() {
    const id = renamingId;
    const name = renameValue.trim();
    setRenamingId(null);
    if (!id || !name) return;
    try {
      const { rider } = await ridersApi.update(id, { name });
      setRiders((prev) =>
        prev
          ? prev.map((r) =>
              r.id === id ? { ...r, name: rider.name, updatedAt: rider.updatedAt } : r,
            )
          : prev,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not rename that rider.");
    }
  }

  async function duplicate(rider: RiderSummary) {
    setBusyId(rider.id);
    setError(null);
    try {
      const full = await ridersApi.get(rider.id);
      const copy = {
        ...full.rider.doc,
        meta: { ...full.rider.doc.meta, name: `${rider.name} (copy)` },
      };
      const { rider: created } = await ridersApi.create(copy, (await renderThumbnail(copy)) ?? undefined);
      setRiders((prev) => (prev ? [created, ...prev] : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not duplicate that rider.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(rider: RiderSummary) {
    if (!confirm(`Delete “${rider.name}”? This can’t be undone.`)) return;
    setBusyId(rider.id);
    setError(null);
    try {
      await ridersApi.remove(rider.id);
      setRiders((prev) => (prev ? prev.filter((r) => r.id !== rider.id) : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete that rider.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-full bg-neutral-950 text-neutral-100">
      <header className="flex flex-wrap items-center gap-2 border-b border-neutral-800 bg-neutral-900 px-4 py-2">
        <a href="/" className="mr-2 text-sm font-semibold tracking-wide">
          StagePlot
        </a>
        <span className="text-sm text-neutral-500">My riders</span>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={createNew}
            disabled={creating}
            className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-500 disabled:cursor-wait disabled:opacity-60"
          >
            {creating ? "Creating…" : "+ New rider"}
          </button>
          <AccountMenu />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">Your riders</h1>
            <p className="text-xs text-neutral-500">
              Saved to your account. Open one to edit — changes autosave.
            </p>
          </div>
          <a href="/" className="text-xs text-neutral-400 hover:text-neutral-200">
            Local draft editor →
          </a>
        </div>

        {error && (
          <p role="alert" className="mb-4 rounded border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        {riders === null ? (
          <p className="py-16 text-center text-sm text-neutral-500">Loading…</p>
        ) : riders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-800 py-16 text-center">
            <p className="text-sm text-neutral-400">No riders yet.</p>
            <p className="mt-1 text-xs text-neutral-600">
              Create one, or save your local draft from the editor.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {riders.map((rider) => (
              <li
                key={rider.id}
                className="group overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900"
              >
                <a
                  href={`/r/${rider.id}`}
                  className="block aspect-[10/7] border-b border-neutral-800 bg-white"
                  title={`Open ${rider.name}`}
                >
                  {rider.thumbnail ? (
                    <img
                      src={rider.thumbnail}
                      alt=""
                      className="h-full w-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-xs text-neutral-400">
                      Empty stage
                    </span>
                  )}
                </a>

                <div className="space-y-2 p-3">
                  {renamingId === rider.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void commitRename();
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      aria-label="Rider name"
                      className="w-full rounded border border-sky-600 bg-neutral-950 px-2 py-1 text-sm text-neutral-100 focus:outline-none"
                    />
                  ) : (
                    <h2 className="flex items-center gap-2 text-sm font-medium text-neutral-100" title={rider.name}>
                      <span className="truncate">{rider.name}</span>
                      {rider.isPublic && (
                        <span className="shrink-0 rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-sky-300">
                          Shared
                        </span>
                      )}
                    </h2>
                  )}

                  <p className="text-[11px] text-neutral-500">
                    Updated {new Date(rider.updatedAt).toLocaleString()}
                  </p>

                  <div className="flex flex-wrap items-center gap-1 text-xs">
                    <a
                      href={`/r/${rider.id}`}
                      className="rounded bg-neutral-800 px-2 py-1 text-neutral-200 hover:bg-neutral-700"
                    >
                      Open
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setRenamingId(rider.id);
                        setRenameValue(rider.name);
                      }}
                      className="rounded px-2 py-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => void duplicate(rider)}
                      disabled={busyId === rider.id}
                      className="rounded px-2 py-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 disabled:opacity-50"
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(rider)}
                      disabled={busyId === rider.id}
                      className="ml-auto rounded px-2 py-1 text-neutral-500 hover:bg-red-950/60 hover:text-red-300 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
