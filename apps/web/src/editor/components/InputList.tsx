import type { ChannelRow } from "@stageplot/shared";
import { useEditorStore } from "../store";

const cell =
  "w-full rounded border border-neutral-800 bg-neutral-950 px-2 py-1 text-sm text-neutral-100 focus:border-sky-500 focus:outline-none";

type Field = "source" | "person" | "inputType" | "mic" | "monitor" | "dca" | "notes";
const INPUT_TYPES = ["Mic", "DI", "Line", "Wireless"];

export function InputList() {
  const rows = useEditorStore((s) => s.doc.channels);
  const update = useEditorStore((s) => s.updateChannel);

  const columns: { key: Field; label: string; className: string }[] = [
    { key: "source", label: "Instrument", className: "min-w-[9rem]" },
    { key: "person", label: "Person", className: "min-w-[7rem]" },
    { key: "inputType", label: "Input type", className: "min-w-[7rem]" },
    { key: "mic", label: "Microphone", className: "min-w-[9rem]" },
    { key: "monitor", label: "Monitor FB", className: "min-w-[7rem]" },
    { key: "dca", label: "DCA / Subgroup", className: "min-w-[7rem]" },
    { key: "notes", label: "Notes", className: "min-w-[8rem]" },
  ];

  return (
    <section className="flex h-56 shrink-0 flex-col border-t border-neutral-800 bg-neutral-900">
      <div className="flex items-center justify-between border-b border-neutral-800 px-3 py-1.5">
        <h2 className="text-xs font-semibold tracking-wide text-neutral-300">
          Mixing desk — input list
          <span className="ml-2 font-normal text-neutral-500">{rows.length} channels</span>
        </h2>
        <button
          type="button"
          onClick={() => useEditorStore.getState().addChannel("channels")}
          className="rounded bg-neutral-800 px-2.5 py-1 text-xs text-neutral-200 hover:bg-neutral-700"
        >
          + Add channel
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {rows.length === 0 ? (
          <p className="p-3 text-xs text-neutral-500">
            No channels yet. Add one, or describe the desk here.
          </p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-neutral-900 text-left text-[11px] uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="w-12 px-2 py-1.5 font-medium">Ch</th>
                {columns.map((c) => (
                  <th key={c.key} className={`px-2 py-1.5 font-medium ${c.className}`}>
                    {c.label}
                  </th>
                ))}
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-neutral-800/60">
                  <td className="px-2 py-1 text-center font-medium text-neutral-400">
                    {row.number}
                  </td>
                  {columns.map((c) => (
                    <td key={c.key} className="px-1 py-1">
                      {c.key === "inputType" ? (
                        <select
                          className={cell}
                          value={row.inputType}
                          onChange={(e) =>
                            update("channels", row.id, { inputType: e.target.value })
                          }
                        >
                          <option value="">—</option>
                          {INPUT_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className={cell}
                          value={row[c.key]}
                          onChange={(e) =>
                            update("channels", row.id, { [c.key]: e.target.value } as Partial<ChannelRow>)
                          }
                        />
                      )}
                    </td>
                  ))}
                  <td className="px-1 text-center">
                    <button
                      type="button"
                      title="Remove channel"
                      onClick={() => useEditorStore.getState().removeChannel("channels", row.id)}
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
    </section>
  );
}
