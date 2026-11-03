import type { ChannelRow } from "@stageplot/shared";
import { useEditorStore, type ListKind } from "../store";

const cellInput =
  "w-full rounded border border-neutral-800 bg-neutral-950 px-1.5 py-1 text-xs text-neutral-100 focus:border-sky-500 focus:outline-none";

export function ChannelTable({ kind, title }: { kind: ListKind; title: string }) {
  const rows = useEditorStore((s) => s.doc[kind]);
  const isInput = kind === "channels";

  return (
    <div className="rounded-md border border-neutral-800">
      <div className="flex items-center justify-between border-b border-neutral-800 px-2 py-1.5">
        <span className="text-xs font-semibold text-neutral-300">{title}</span>
        <button
          type="button"
          onClick={() => useEditorStore.getState().addChannel(kind)}
          className="rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-200 hover:bg-neutral-700"
        >
          + Add
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="p-2 text-xs text-neutral-500">No rows yet.</p>
      ) : (
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="text-left text-neutral-500">
              <th className="w-8 px-1 py-1 font-medium">#</th>
              <th className="px-1 py-1 font-medium">Source</th>
              {isInput && <th className="px-1 py-1 font-medium">Mic</th>}
              {isInput && <th className="px-1 py-1 font-medium">Stand</th>}
              {isInput && <th className="w-10 px-1 py-1 font-medium">48V</th>}
              <th className="px-1 py-1 font-medium">Notes</th>
              <th className="w-6" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row: ChannelRow) => (
              <tr key={row.id} className="border-t border-neutral-900">
                <td className="px-1 py-0.5 text-center text-neutral-500">{row.number}</td>
                <td className="px-0.5 py-0.5">
                  <input
                    className={cellInput}
                    value={row.source}
                    onChange={(e) =>
                      useEditorStore.getState().updateChannel(kind, row.id, { source: e.target.value })
                    }
                  />
                </td>
                {isInput && (
                  <td className="px-0.5 py-0.5">
                    <input
                      className={cellInput}
                      value={row.mic}
                      onChange={(e) =>
                        useEditorStore.getState().updateChannel(kind, row.id, { mic: e.target.value })
                      }
                    />
                  </td>
                )}
                {isInput && (
                  <td className="px-0.5 py-0.5">
                    <input
                      className={cellInput}
                      value={row.stand}
                      onChange={(e) =>
                        useEditorStore.getState().updateChannel(kind, row.id, { stand: e.target.value })
                      }
                    />
                  </td>
                )}
                {isInput && (
                  <td className="px-0.5 py-0.5">
                    <input
                      className={cellInput}
                      value={row.phantom}
                      onChange={(e) =>
                        useEditorStore.getState().updateChannel(kind, row.id, { phantom: e.target.value })
                      }
                    />
                  </td>
                )}
                <td className="px-0.5 py-0.5">
                  <input
                    className={cellInput}
                    value={row.notes}
                    onChange={(e) =>
                      useEditorStore.getState().updateChannel(kind, row.id, { notes: e.target.value })
                    }
                  />
                </td>
                <td className="px-1 text-center">
                  <button
                    type="button"
                    title="Remove row"
                    onClick={() => useEditorStore.getState().removeChannel(kind, row.id)}
                    className="text-neutral-500 hover:text-red-400"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
