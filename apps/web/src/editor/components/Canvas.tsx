import type { PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useRef } from "react";
import type { StageItem, TextItem } from "@stageplot/shared";
import { getLibraryItem } from "../library";
import { useEditorStore } from "../store";

const MIN_SIZE = 12;

/** Attach window-level pointer listeners for the duration of a drag. */
function beginPointerDrag(
  event: ReactPointerEvent,
  onMove: (dx: number, dy: number, clientX: number, clientY: number) => void,
) {
  event.preventDefault();
  event.stopPropagation();
  const startX = event.clientX;
  const startY = event.clientY;
  const move = (e: PointerEvent) =>
    onMove(e.clientX - startX, e.clientY - startY, e.clientX, e.clientY);
  const up = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
}

export function Canvas() {
  const doc = useEditorStore((s) => s.doc);
  const scale = useEditorStore((s) => s.scale);
  const showGrid = useEditorStore((s) => s.showGrid);
  const selection = useEditorStore((s) => s.selection);
  const stageRef = useRef<HTMLDivElement>(null);

  const toStage = useCallback(
    (clientX: number, clientY: number) => {
      const rect = stageRef.current!.getBoundingClientRect();
      return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale };
    },
    [scale],
  );

  const { width, height } = doc.stage;
  const cell = 25 * scale;

  return (
    <div className="h-full w-full overflow-auto bg-neutral-950 p-8">
      <div
        ref={stageRef}
        data-stage
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) useEditorStore.getState().clearSelection();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDrop={(e) => {
          e.preventDefault();
          const key = e.dataTransfer.getData("application/x-stageplot-item");
          const item = key ? getLibraryItem(key) : undefined;
          if (!item) return;
          const { x, y } = toStage(e.clientX, e.clientY);
          useEditorStore.getState().addItem(item, x, y);
        }}
        className="relative mx-auto shrink-0 border border-neutral-700 bg-neutral-900 shadow-2xl"
        style={{
          width: width * scale,
          height: height * scale,
          backgroundImage: showGrid
            ? "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)"
            : undefined,
          backgroundSize: showGrid ? `${cell}px ${cell}px` : undefined,
        }}
      >
        {doc.items.map((item) => (
          <StageItemNode
            key={item.id}
            item={item}
            scale={scale}
            selected={selection.includes(item.id)}
          />
        ))}
        {doc.texts.map((text) => (
          <TextNode
            key={text.id}
            text={text}
            scale={scale}
            selected={selection.includes(text.id)}
          />
        ))}
      </div>
    </div>
  );
}

function StageItemNode({
  item,
  scale,
  selected,
}: {
  item: StageItem;
  scale: number;
  selected: boolean;
}) {
  const lib = getLibraryItem(item.itemKey);

  const startMove = (e: ReactPointerEvent) => {
    const store = useEditorStore.getState();
    if (e.shiftKey) {
      store.toggleSelection(item.id, true);
    } else if (!store.selection.includes(item.id)) {
      store.setSelection([item.id]);
    }
    store.pushHistory();
    const ids = useEditorStore.getState().selection;
    const start = new Map<string, { x: number; y: number }>();
    for (const el of useEditorStore.getState().doc.items) {
      if (ids.includes(el.id)) start.set(el.id, { x: el.x, y: el.y });
    }
    for (const el of useEditorStore.getState().doc.texts) {
      if (ids.includes(el.id)) start.set(el.id, { x: el.x, y: el.y });
    }
    beginPointerDrag(e, (dx, dy) => {
      const s = useEditorStore.getState();
      for (const [id, pos] of start) {
        const patch = { x: pos.x + dx / scale, y: pos.y + dy / scale };
        if (s.doc.items.some((i) => i.id === id)) s.updateItem(id, patch);
        else s.updateText(id, patch);
      }
    });
  };

  if (!lib) return null;
  const { Icon } = lib;

  return (
    <div
      onPointerDown={startMove}
      className={`absolute no-select cursor-move ${
        selected ? "outline outline-2 outline-sky-400" : ""
      }`}
      style={{
        left: item.x * scale,
        top: item.y * scale,
        width: item.w * scale,
        height: item.h * scale,
        transform: `rotate(${item.rotation}deg) scaleX(${item.flipX ? -1 : 1}) scaleY(${
          item.flipY ? -1 : 1
        })`,
        transformOrigin: "center",
        color: selected ? "#7dd3fc" : "#cbd5e1",
      }}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <Icon />
      </svg>
      {selected && (
        <SelectionHandles
          item={item}
          scale={scale}
          onResize={(__e: ReactPointerEvent) => {
            const e = __e;
            const store = useEditorStore.getState();
            store.pushHistory();
            const startW = item.w;
            const startH = item.h;
            beginPointerDrag(e, (dx, dy) => {
              useEditorStore.getState().updateItem(item.id, {
                w: Math.max(MIN_SIZE, startW + dx / scale),
                h: Math.max(MIN_SIZE, startH + dy / scale),
              });
            });
          }}
          onRotate={(__e: ReactPointerEvent) => {
            const e = __e;
            const store = useEditorStore.getState();
            store.pushHistory();
            const startRotation = item.rotation;
            const rect = (e.currentTarget as HTMLElement)
              .closest("[data-stage]")!
              .getBoundingClientRect();
            const cx = rect.left + (item.x + item.w / 2) * scale;
            const cy = rect.top + (item.y + item.h / 2) * scale;
            const startAngle =
              (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
            beginPointerDrag(e, (_dx, _dy, clientX, clientY) => {
              const angle =
                (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI;
              useEditorStore
                .getState()
                .updateItem(item.id, { rotation: startRotation + (angle - startAngle) });
            });
          }}
        />
      )}
    </div>
  );
}

function TextNode({
  text,
  scale,
  selected,
}: {
  text: TextItem;
  scale: number;
  selected: boolean;
}) {
  const startMove = (e: ReactPointerEvent) => {
    const store = useEditorStore.getState();
    if (e.shiftKey) store.toggleSelection(text.id, true);
    else if (!store.selection.includes(text.id)) store.setSelection([text.id]);
    store.pushHistory();
    const startX = text.x;
    const startY = text.y;
    beginPointerDrag(e, (dx, dy) => {
      useEditorStore.getState().updateText(text.id, {
        x: startX + dx / scale,
        y: startY + dy / scale,
      });
    });
  };

  return (
    <div
      onPointerDown={startMove}
      className={`absolute no-select cursor-move ${
        selected ? "outline outline-2 outline-sky-400" : ""
      }`}
      style={{
        left: text.x * scale,
        top: text.y * scale,
        fontSize: text.fontSize * scale,
        transform: `rotate(${text.rotation}deg)`,
        transformOrigin: "center",
        color: selected ? "#7dd3fc" : "#e2e8f0",
        whiteSpace: "nowrap",
      }}
    >
      {text.text || "Text"}
    </div>
  );
}

function SelectionHandles({
  item,
  scale,
  onResize,
  onRotate,
}: {
  item: StageItem;
  scale: number;
  onResize: (e: ReactPointerEvent) => void;
  onRotate: (e: ReactPointerEvent) => void;
}) {
  void scale;
  void item;
  return (
    <>
      <button
        type="button"
        aria-label="Rotate"
        onPointerDown={onRotate}
        className="absolute -top-7 left-1/2 h-4 w-4 -translate-x-1/2 cursor-grab rounded-full border border-sky-300 bg-sky-500/80"
      />
      <button
        type="button"
        aria-label="Resize"
        onPointerDown={onResize}
        className="absolute -bottom-2 -right-2 h-4 w-4 cursor-nwse-resize rounded-sm border border-sky-300 bg-sky-500/80"
      />
    </>
  );
}
