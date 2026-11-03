import type { Orientation } from "@stageplot/shared";
import { getLibraryItem } from "../library";
import { useEditorStore } from "../store";
import { ChannelTable } from "./ChannelTable";

const field =
  "w-full rounded border border-neutral-800 bg-neutral-950 px-2 py-1 text-sm text-neutral-100 focus:border-sky-500 focus:outline-none";
const label = "text-[11px] uppercase tracking-wide text-neutral-500";

export function InspectorPanel() {
  const selection = useEditorStore((s) => s.selection);
  const item = useEditorStore((s) =>
    s.doc.items.find((i) => i.id === s.selection[0]),
  );
  const text = useEditorStore((s) =>
    s.doc.texts.find((t) => t.id === s.selection[0]),
  );
  const name = useEditorStore((s) => s.doc.meta.name);
  const orientation = useEditorStore((s) => s.doc.meta.orientation);
  const footer = useEditorStore((s) => s.doc.footer.text);

  const single = selection.length === 1;
  const lib = item ? getLibraryItem(item.itemKey) : undefined;

  return (
    <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-auto border-l border-neutral-800 bg-neutral-900 p-3">
      {single && (item || text) && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-neutral-300">
            {item ? lib?.label ?? "Item" : "Text"}
          </h2>

          {item && (
            <div className="grid grid-cols-2 gap-2">
              <NumberField
                label="X"
                value={item.x}
                onChange={(v) => useEditorStore.getState().updateItem(item.id, { x: v })}
              />
              <NumberField
                label="Y"
                value={item.y}
                onChange={(v) => useEditorStore.getState().updateItem(item.id, { y: v })}
              />
              <NumberField
                label="W"
                value={item.w}
                onChange={(v) => useEditorStore.getState().updateItem(item.id, { w: Math.max(12, v) })}
              />
              <NumberField
                label="H"
                value={item.h}
                onChange={(v) => useEditorStore.getState().updateItem(item.id, { h: Math.max(12, v) })}
              />
              <NumberField
                label="Rotation"
                value={item.rotation}
                onChange={(v) => useEditorStore.getState().updateItem(item.id, { rotation: v })}
              />
              <div className="flex items-end gap-3 pb-1">
                <label className="flex items-center gap-1 text-xs text-neutral-300">
                  <input
                    type="checkbox"
                    checked={item.flipX}
                    onChange={(e) =>
                      useEditorStore.getState().updateItem(item.id, { flipX: e.target.checked })
                    }
                  />
                  Flip H
                </label>
                <label className="flex items-center gap-1 text-xs text-neutral-300">
                  <input
                    type="checkbox"
                    checked={item.flipY}
                    onChange={(e) =>
                      useEditorStore.getState().updateItem(item.id, { flipY: e.target.checked })
                    }
                  />
                  Flip V
                </label>
              </div>
              <div className="col-span-2">
                <label className={label}>Label</label>
                <input
                  className={field}
                  value={item.label ?? ""}
                  placeholder="Optional caption"
                  onChange={(e) =>
                    useEditorStore.getState().updateItem(item.id, { label: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          {text && (
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <label className={label}>Text</label>
                <input
                  className={field}
                  value={text.text}
                  onChange={(e) =>
                    useEditorStore.getState().updateText(text.id, { text: e.target.value })
                  }
                />
              </div>
              <NumberField
                label="Font size"
                value={text.fontSize}
                onChange={(v) =>
                  useEditorStore.getState().updateText(text.id, { fontSize: Math.max(6, v) })
                }
              />
              <NumberField
                label="Rotation"
                value={text.rotation}
                onChange={(v) => useEditorStore.getState().updateText(text.id, { rotation: v })}
              />
              <NumberField
                label="X"
                value={text.x}
                onChange={(v) => useEditorStore.getState().updateText(text.id, { x: v })}
              />
              <NumberField
                label="Y"
                value={text.y}
                onChange={(v) => useEditorStore.getState().updateText(text.id, { y: v })}
              />
            </div>
          )}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-xs font-semibold text-neutral-300">Document</h2>
        <div>
          <label className={label}>Name</label>
          <input
            className={field}
            value={name}
            onChange={(e) => useEditorStore.getState().setMeta({ name: e.target.value })}
          />
        </div>
        <div>
          <label className={label}>Orientation</label>
          <select
            className={field}
            value={orientation}
            onChange={(e) =>
              useEditorStore.getState().setMeta({ orientation: e.target.value as Orientation })
            }
          >
            <option value="landscape">Landscape</option>
            <option value="portrait">Portrait</option>
          </select>
        </div>
        <div>
          <label className={label}>Footer / notes</label>
          <textarea
            className={`${field} h-24 resize-none`}
            value={footer}
            maxLength={2000}
            onChange={(e) => useEditorStore.getState().setFooter(e.target.value)}
          />
          <p className="mt-1 text-right text-[10px] text-neutral-600">
            {footer.length} / 2000
          </p>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-semibold text-neutral-300">Channel lists</h2>
        <ChannelTable kind="channels" title="Inputs" />
        <ChannelTable kind="outputs" title="Outputs (monitors / IEM)" />
      </section>
    </aside>
  );
}

function NumberField({
  label: text,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className={label}>{text}</label>
      <input
        type="number"
        className={field}
        value={Math.round(value)}
        onChange={(e) => {
          const parsed = Number(e.target.value);
          if (!Number.isNaN(parsed)) onChange(parsed);
        }}
      />
    </div>
  );
}
