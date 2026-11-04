import type { PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ShapeItem, StageItem, TextItem } from "@stageplot/shared";
import { getLibraryItem } from "../library";
import { routeCable } from "../routing";
import { useEditorStore } from "../store";

const MIN_SIZE = 12;
const SHAPE_STROKE = "var(--canvas-shape)";
const SHAPE_STROKE_SELECTED = "var(--canvas-shape-selected)";
const SHAPE_FILL = "rgba(167,139,250,0.18)";

/** Drop focus from an inspector field so keyboard shortcuts act on the canvas. */
function blurActiveField() {
  const el = document.activeElement as HTMLElement | null;
  if (
    el &&
    (el.tagName === "INPUT" ||
      el.tagName === "TEXTAREA" ||
      el.tagName === "SELECT" ||
      el.isContentEditable)
  ) {
    el.blur();
  }
}

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

function normalizeBox(
  a: { x: number; y: number },
  b: { x: number; y: number },
) {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(a.x - b.x),
    h: Math.abs(a.y - b.y),
  };
}

type Box = { x: number; y: number; w: number; h: number };

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Stage units per grid square (matches the 25px CSS cells at 100% zoom). */
const GRID_STEP = 25;

export function Canvas() {
  const doc = useEditorStore((s) => s.doc);
  const scale = useEditorStore((s) => s.scale);
  const showGrid = useEditorStore((s) => s.showGrid);
  const showLabels = useEditorStore((s) => s.showLabels);
  const selection = useEditorStore((s) => s.selection);
  const tool = useEditorStore((s) => s.tool);
  const stageRef = useRef<HTMLDivElement>(null);

  const [draftRect, setDraftRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [marquee, setMarquee] = useState<Box | null>(null);
  const [polyPoints, setPolyPoints] = useState<{ x: number; y: number }[]>([]);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  // Mirror of polyPoints for logic — never run side effects inside a state updater.
  const polyRef = useRef<{ x: number; y: number }[]>([]);
  const updatePoly = useCallback((next: { x: number; y: number }[]) => {
    polyRef.current = next;
    setPolyPoints(next);
  }, []);

  const [powerPoints, setPowerPoints] = useState<{ x: number; y: number }[]>([]);
  const powerRef = useRef<{ x: number; y: number }[]>([]);
  const updatePower = useCallback((next: { x: number; y: number }[]) => {
    powerRef.current = next;
    setPowerPoints(next);
  }, []);

  const toStage = useCallback(
    (clientX: number, clientY: number) => {
      const rect = stageRef.current!.getBoundingClientRect();
      return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale };
    },
    [scale],
  );

  const finishPolygon = useCallback(() => {
    const pts = polyRef.current;
    if (pts.length >= 3) useEditorStore.getState().addPolygon(pts);
    polyRef.current = [];
    setPolyPoints([]);
    useEditorStore.getState().setTool("select");
  }, []);

  const cancelPolygon = useCallback(() => {
    polyRef.current = [];
    setPolyPoints([]);
    useEditorStore.getState().setTool("select");
  }, []);

  const finishCable = useCallback(() => {
    const pts = powerRef.current;
    if (pts.length >= 2) useEditorStore.getState().addCable(pts.flatMap((p) => [p.x, p.y]));
    powerRef.current = [];
    setPowerPoints([]);
    useEditorStore.getState().setTool("select");
  }, []);

  const cancelCable = useCallback(() => {
    powerRef.current = [];
    setPowerPoints([]);
    useEditorStore.getState().setTool("select");
  }, []);

  // Reset drafts when leaving the matching tool.
  useEffect(() => {
    if (tool !== "polygon") {
      polyRef.current = [];
      setPolyPoints([]);
    }
    if (tool !== "power") {
      powerRef.current = [];
      setPowerPoints([]);
    }
  }, [tool]);

  // Enter finishes, Escape cancels, while drawing.
  useEffect(() => {
    if (tool !== "polygon" && tool !== "power") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (tool === "polygon") finishPolygon();
        else finishCable();
      } else if (e.key === "Escape") {
        if (tool === "polygon") cancelPolygon();
        else cancelCable();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tool, finishPolygon, cancelPolygon, finishCable, cancelCable]);

  const { width, height } = doc.stage;
  const cell = 25 * scale;
  const interactive = tool === "select";

  // Boxes the cable router must steer around.
  const obstacles = useMemo<Box[]>(() => {
    const list: Box[] = [];
    for (const i of doc.items) list.push({ x: i.x, y: i.y, w: i.w, h: i.h });
    for (const s of doc.shapes) list.push({ x: s.x, y: s.y, w: s.w, h: s.h });
    return list;
  }, [doc.items, doc.shapes]);

  // Routes re-solve whenever the stage or the anchors change, so a cable moves
  // itself out of the way of anything new dropped on top of it.
  const cableRoutes = useMemo(
    () =>
      doc.cables.map((c) => ({
        id: c.id,
        color: c.color,
        anchors: c.anchors,
        points: routeCable(c.anchors, obstacles, width, height),
      })),
    [doc.cables, obstacles, width, height],
  );

  const onStagePointerDown = (e: ReactPointerEvent) => {
    blurActiveField();
    if (tool === "select") {
      // Only the empty stage starts a marquee; item drags stop propagation.
      if (e.target !== e.currentTarget) return;

      const additive = e.shiftKey;
      const start = toStage(e.clientX, e.clientY);
      let current = start;
      let moved = false;
      setMarquee({ ...start, w: 0, h: 0 });

      const move = (ev: PointerEvent) => {
        current = toStage(ev.clientX, ev.clientY);
        const box = normalizeBox(start, current);
        if (box.w > 2 || box.h > 2) moved = true;
        setMarquee(box);
      };

      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        setMarquee(null);

        const box = normalizeBox(start, current);
        const store = useEditorStore.getState();
        if (!moved || (box.w < 4 && box.h < 4)) {
          if (!additive) store.clearSelection();
          return;
        }

        const hits = new Set<string>();
        for (const item of store.doc.items) if (overlaps(box, item)) hits.add(item.id);
        for (const shape of store.doc.shapes) if (overlaps(box, shape)) hits.add(shape.id);
        for (const text of store.doc.texts) {
          // Text has no measured box; estimate from the glyph size.
          const w = Math.max(text.fontSize, text.text.length * text.fontSize * 0.55);
          if (overlaps(box, { x: text.x, y: text.y, w, h: text.fontSize * 1.25 })) {
            hits.add(text.id);
          }
        }

        const ids = [...hits];
        store.setSelection(additive ? [...new Set([...store.selection, ...ids])] : ids);
      };

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      return;
    }
    if (tool === "polygon") {
      const p = toStage(e.clientX, e.clientY);
      const prev = polyRef.current;
      if (
        prev.length >= 3 &&
        Math.hypot(p.x - prev[0].x, p.y - prev[0].y) * scale < 12
      ) {
        finishPolygon();
        return;
      }
      updatePoly([...prev, p]);
      return;
    }
    if (tool === "power") {
      const p = toStage(e.clientX, e.clientY);
      updatePower([...powerRef.current, p]);
      return;
    }
    // rect / ellipse: drag out a box
    const start = toStage(e.clientX, e.clientY);
    let cur = start;
    setDraftRect(normalizeBox(start, cur));
    const move = (ev: PointerEvent) => {
      cur = toStage(ev.clientX, ev.clientY);
      setDraftRect(normalizeBox(start, cur));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const box = normalizeBox(start, cur);
      if (box.w > 4 && box.h > 4) {
        useEditorStore.getState().addShapeFromDrag(tool, box.x, box.y, box.w, box.h);
      }
      setDraftRect(null);
      useEditorStore.getState().setTool("select");
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div className="h-full w-full overflow-auto bg-neutral-950 p-8">
      <div
        ref={stageRef}
        data-stage
        onPointerDown={onStagePointerDown}
        onPointerMove={(e) => {
          if (tool === "polygon" || tool === "power") setHover(toStage(e.clientX, e.clientY));
        }}
        onDoubleClick={() => {
          if (tool === "polygon") finishPolygon();
          else if (tool === "power") finishCable();
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
          cursor: interactive ? "default" : "crosshair",
          backgroundImage: showGrid
            ? "linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)"
            : undefined,
          backgroundSize: showGrid ? `${cell}px ${cell}px` : undefined,
        }}
      >
        {doc.stage.background && (
          <img
            src={doc.stage.background}
            alt="Background layout"
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
            style={{ opacity: doc.stage.backgroundOpacity ?? 1 }}
          />
        )}
        <div className="pointer-events-none absolute inset-0">
          {doc.shapes.map((shape) => (
            <ShapeNode
              key={shape.id}
              shape={shape}
              scale={scale}
              selected={selection.includes(shape.id)}
              enabled={interactive}
              toStage={toStage}
            />
          ))}
          {/* Power cables: routed around the gear, drawn underneath it. */}
          <svg
            className="absolute inset-0"
            width={width * scale}
            height={height * scale}
            viewBox={`0 0 ${width} ${height}`}
            style={{ overflow: "visible", pointerEvents: "none" }}
          >
            {cableRoutes.map((route) => {
              const pts = route.points.join(" ");
              const isSel = selection.includes(route.id);
              return (
                <g key={route.id}>
                  <polyline
                    points={pts}
                    fill="none"
                    stroke={route.color}
                    strokeWidth={isSel ? 6 : 4}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    opacity={isSel ? 1 : 0.85}
                  />
                  <polyline
                    points={pts}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={16}
                    style={{ pointerEvents: interactive ? "stroke" : "none", cursor: "pointer" }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      useEditorStore.getState().setSelection([route.id]);
                    }}
                  />
                  {Array.from({ length: route.anchors.length / 2 }).map((_, i) => (
                    <circle
                      key={i}
                      cx={route.anchors[i * 2]}
                      cy={route.anchors[i * 2 + 1]}
                      r={3.5}
                      fill={route.color}
                    />
                  ))}
                </g>
              );
            })}
          </svg>
          {doc.items.map((item) => (
            <StageItemNode
              key={item.id}
              item={item}
              scale={scale}
              selected={selection.includes(item.id)}
              enabled={interactive}
            />
          ))}
          {doc.texts.map((text) => (
            <TextNode
              key={text.id}
              text={text}
              scale={scale}
              selected={selection.includes(text.id)}
              enabled={interactive}
            />
          ))}
          {showLabels &&
            doc.items.map((item) => {
              if (!item.label) return null;
              return (
                <div
                  key={`label-${item.id}`}
                  className="absolute -translate-x-1/2 text-center"
                  style={{
                    left: (item.x + item.w / 2) * scale,
                    top: (item.y + item.h) * scale + 2,
                    fontSize: Math.max(8, 12 * scale),
                    color: selection.includes(item.id)
                      ? "var(--canvas-item-selected)"
                      : "var(--canvas-label)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span className="rounded bg-neutral-900/75 px-1 leading-tight">{item.label}</span>
                </div>
              );
            })}
          {showLabels &&
            doc.shapes.map((shape) => {
              if (!shape.label) return null;
              return (
                <div
                  key={`slabel-${shape.id}`}
                  className="absolute -translate-x-1/2 text-center"
                  style={{
                    left: (shape.x + shape.w / 2) * scale,
                    top: (shape.y + shape.h) * scale + 2,
                    fontSize: Math.max(8, 12 * scale),
                    color: selection.includes(shape.id)
                      ? "var(--canvas-shape-selected)"
                      : "var(--canvas-label)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span className="rounded bg-neutral-900/75 px-1 leading-tight">{shape.label}</span>
                </div>
              );
            })}
        </div>

        {/* empty stage hint */}
        {interactive &&
          doc.items.length === 0 &&
          doc.texts.length === 0 &&
          doc.shapes.length === 0 &&
          !marquee && (
            <div className="pointer-events-none absolute inset-0 flex items-start justify-start p-4">
              <p className="rounded-md border border-dashed border-neutral-700 px-4 py-2 text-sm text-neutral-500">
                Drag items from the library onto the stage
              </p>
            </div>
          )}

        {/* marquee selection */}
        {marquee && (
          <div
            className="pointer-events-none absolute border border-sky-400 bg-sky-400/10"
            style={{
              left: marquee.x * scale,
              top: marquee.y * scale,
              width: marquee.w * scale,
              height: marquee.h * scale,
            }}
          />
        )}

        {/* draft previews */}
        {draftRect && (
          <div
            className="pointer-events-none absolute border-2 border-dashed border-violet-400"
            style={{
              left: draftRect.x * scale,
              top: draftRect.y * scale,
              width: draftRect.w * scale,
              height: draftRect.h * scale,
              borderRadius: tool === "ellipse" ? "50%" : 0,
            }}
          />
        )}
        {tool === "power" && powerPoints.length > 0 && (
          <svg
            className="pointer-events-none absolute inset-0"
            width={width * scale}
            height={height * scale}
            viewBox={`0 0 ${width} ${height}`}
            style={{ overflow: "visible" }}
          >
            <polyline
              points={routeCable(
                [
                  ...powerPoints.flatMap((p) => [p.x, p.y]),
                  ...(hover ? [hover.x, hover.y] : []),
                ],
                obstacles,
                width,
                height,
              ).join(" ")}
              fill="none"
              stroke="#dc2626"
              strokeWidth={4}
              strokeDasharray="7 5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {powerPoints.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={4} fill="#dc2626" />
            ))}
          </svg>
        )}
        {tool === "polygon" && polyPoints.length > 0 && (
          <svg
            className="pointer-events-none absolute inset-0"
            width={width * scale}
            height={height * scale}
            viewBox={`0 0 ${width} ${height}`}
          >
            <polyline
              points={[
                ...polyPoints.map((p) => `${p.x},${p.y}`),
                ...(hover ? [`${hover.x},${hover.y}`] : []),
              ].join(" ")}
              fill="rgba(167,139,250,0.12)"
              stroke="var(--canvas-shape)"
              strokeWidth={2}
              strokeDasharray="6 4"
            />
            {polyPoints.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={4} fill="var(--canvas-shape-selected)" />
            ))}
          </svg>
        )}
      </div>
    </div>
  );
}

/* --- shape ----------------------------------------------------------------- */

function ShapeNode({
  shape,
  scale,
  selected,
  enabled,
  toStage,
}: {
  shape: ShapeItem;
  scale: number;
  selected: boolean;
  enabled: boolean;
  toStage: (clientX: number, clientY: number) => { x: number; y: number };
}) {
  const startMove = (e: ReactPointerEvent) => {
    blurActiveField();
    const store = useEditorStore.getState();
    if (e.shiftKey) store.toggleSelection(shape.id, true);
    else if (!store.selection.includes(shape.id)) store.setSelection([shape.id]);
    store.pushHistory();
    const ids = useEditorStore.getState().selection;
    const start = new Map<string, { x: number; y: number }>();
    for (const el of useEditorStore.getState().doc.shapes) {
      if (ids.includes(el.id)) start.set(el.id, { x: el.x, y: el.y });
    }
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
        if (s.doc.shapes.some((sh) => sh.id === id)) s.updateShape(id, patch);
        else if (s.doc.items.some((i) => i.id === id)) s.updateItem(id, patch);
        else s.updateText(id, patch);
      }
    });
  };

  const stroke = selected ? SHAPE_STROKE_SELECTED : SHAPE_STROKE;
  const fill = shape.fill ? SHAPE_FILL : "none";

  const polyAttr = useMemo(() => {
    const pts = shape.points ?? [];
    const out: string[] = [];
    for (let i = 0; i < pts.length; i += 2) {
      out.push(`${pts[i] * shape.w},${pts[i + 1] * shape.h}`);
    }
    return out.join(" ");
  }, [shape.points, shape.w, shape.h]);

  // vertex handles live in unrotated local space
  const cx = shape.x + shape.w / 2;
  const cy = shape.y + shape.h / 2;
  const rad = (shape.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const moveVertex = (index: number, e: ReactPointerEvent) => {
    const store = useEditorStore.getState();
    store.pushHistory();
    beginPointerDrag(e, (_dx, _dy, clientX, clientY) => {
      const p = toStage(clientX, clientY);
      const ddx = p.x - cx;
      const ddy = p.y - cy;
      // rotate pointer back into local space
      const lx = cx + ddx * cos + ddy * sin;
      const ly = cy - ddx * sin + ddy * cos;
      const nx = Math.min(1, Math.max(0, (lx - shape.x) / shape.w));
      const ny = Math.min(1, Math.max(0, (ly - shape.y) / shape.h));
      const pts = [...(shape.points ?? [])];
      pts[index * 2] = nx;
      pts[index * 2 + 1] = ny;
      useEditorStore.getState().updateShape(shape.id, { points: pts });
    });
  };

  return (
    <div
      className={selected ? "absolute outline outline-2 outline-violet-400" : "absolute"}
      style={{
        left: shape.x * scale,
        top: shape.y * scale,
        width: shape.w * scale,
        height: shape.h * scale,
        transform: `rotate(${shape.rotation}deg)`,
        transformOrigin: "center",
        pointerEvents: enabled ? "auto" : "none",
      }}
    >
      <svg
        viewBox={`0 0 ${shape.w} ${shape.h}`}
        width="100%"
        height="100%"
        style={{ overflow: "visible", pointerEvents: "none" }}
      >
        {shape.kind === "rect" && (
          <rect
            x={0}
            y={0}
            width={shape.w}
            height={shape.h}
            fill={fill}
            stroke={stroke}
            strokeWidth={3}
            style={{ pointerEvents: "all", cursor: "move" }}
            onPointerDown={startMove}
          />
        )}
        {shape.kind === "ellipse" && (
          <ellipse
            cx={shape.w / 2}
            cy={shape.h / 2}
            rx={shape.w / 2}
            ry={shape.h / 2}
            fill={fill}
            stroke={stroke}
            strokeWidth={3}
            style={{ pointerEvents: "all", cursor: "move" }}
            onPointerDown={startMove}
          />
        )}
        {shape.kind === "polygon" && (
          <polygon
            points={polyAttr}
            fill={fill}
            stroke={stroke}
            strokeWidth={3}
            style={{ pointerEvents: "all", cursor: "move" }}
            onPointerDown={startMove}
          />
        )}
      </svg>

      {selected && enabled && (
        <>
          <button
            type="button"
            aria-label="Rotate shape"
            onPointerDown={(e) => {
              const store = useEditorStore.getState();
              store.pushHistory();
              const startRotation = shape.rotation;
              const rect = (e.currentTarget as HTMLElement)
                .closest("[data-stage]")!
                .getBoundingClientRect();
              const ccx = rect.left + cx * scale;
              const ccy = rect.top + cy * scale;
              const startAngle = (Math.atan2(e.clientY - ccy, e.clientX - ccx) * 180) / Math.PI;
              beginPointerDrag(e, (_dx, _dy, clientX, clientY) => {
                const angle = (Math.atan2(clientY - ccy, clientX - ccx) * 180) / Math.PI;
                useEditorStore.getState().updateShape(shape.id, {
                  rotation: startRotation + (angle - startAngle),
                });
              });
            }}
            style={{ pointerEvents: "auto" }}
            className="absolute -top-7 left-1/2 h-4 w-4 -translate-x-1/2 cursor-grab rounded-full border border-violet-300 bg-violet-500/80"
          />
          <button
            type="button"
            aria-label="Resize shape"
            onPointerDown={(e) => {
              const store = useEditorStore.getState();
              store.pushHistory();
              const startW = shape.w;
              const startH = shape.h;
              beginPointerDrag(e, (dx, dy) => {
                useEditorStore.getState().updateShape(shape.id, {
                  w: Math.max(MIN_SIZE, startW + dx / scale),
                  h: Math.max(MIN_SIZE, startH + dy / scale),
                });
              });
            }}
            style={{ pointerEvents: "auto" }}
            className="absolute -bottom-2 -right-2 h-4 w-4 cursor-nwse-resize rounded-sm border border-violet-300 bg-violet-500/80"
          />
        </>
      )}

      {selected && enabled && shape.kind === "polygon" && shape.points && (
        <svg
          className="absolute inset-0"
          width={shape.w * scale}
          height={shape.h * scale}
          style={{ overflow: "visible", pointerEvents: "none" }}
        >
          {Array.from({ length: shape.points.length / 2 }).map((_, i) => {
            const lx = shape.points![i * 2] * shape.w;
            const ly = shape.points![i * 2 + 1] * shape.h;
            const ddx = lx - shape.w / 2;
            const ddy = ly - shape.h / 2;
            const rx = shape.w / 2 + ddx * cos - ddy * sin;
            const ry = shape.h / 2 + ddx * sin + ddy * cos;
            return (
              <circle
                key={i}
                cx={rx * scale}
                cy={ry * scale}
                r={6}
                fill="var(--canvas-shape-selected)"
                stroke="#312e81"
                strokeWidth={1.5}
                style={{ pointerEvents: "all", cursor: "pointer" }}
                onPointerDown={(e) => moveVertex(i, e)}
              />
            );
          })}
        </svg>
      )}
    </div>
  );
}

/* --- library item ---------------------------------------------------------- */

function StageItemNode({
  item,
  scale,
  selected,
  enabled,
}: {
  item: StageItem;
  scale: number;
  selected: boolean;
  enabled: boolean;
}) {
  const lib = getLibraryItem(item.itemKey);

  const startMove = (e: ReactPointerEvent) => {
    blurActiveField();
    const store = useEditorStore.getState();
    // Magnetic grid: positions snap to 25-unit cells when the grid is on.
    // Hold Alt for free placement.
    const snapEnabled = !e.altKey && store.showGrid;
    const snap = (value: number) =>
      snapEnabled ? Math.round(value / GRID_STEP) * GRID_STEP : value;
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
    for (const el of useEditorStore.getState().doc.shapes) {
      if (ids.includes(el.id)) start.set(el.id, { x: el.x, y: el.y });
    }
    beginPointerDrag(e, (dx, dy) => {
      const s = useEditorStore.getState();
      for (const [id, pos] of start) {
        const patch = { x: snap(pos.x + dx / scale), y: snap(pos.y + dy / scale) };
        if (s.doc.items.some((i) => i.id === id)) s.updateItem(id, patch);
        else if (s.doc.texts.some((t) => t.id === id)) s.updateText(id, patch);
        else s.updateShape(id, patch);
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
        color: selected ? "var(--canvas-item-selected)" : "var(--canvas-item)",
        pointerEvents: enabled ? "auto" : "none",
      }}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <Icon />
      </svg>
      {selected && enabled && (
        <SelectionHandles
          onResize={(e) => {
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
          onRotate={(e) => {
            const store = useEditorStore.getState();
            store.pushHistory();
            const startRotation = item.rotation;
            const rect = (e.currentTarget as HTMLElement)
              .closest("[data-stage]")!
              .getBoundingClientRect();
            const cx = rect.left + (item.x + item.w / 2) * scale;
            const cy = rect.top + (item.y + item.h / 2) * scale;
            const startAngle = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
            beginPointerDrag(e, (_dx, _dy, clientX, clientY) => {
              const angle = (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI;
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
  enabled,
}: {
  text: TextItem;
  scale: number;
  selected: boolean;
  enabled: boolean;
}) {
  const startMove = (e: ReactPointerEvent) => {
    blurActiveField();
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
        color: selected ? "var(--canvas-item-selected)" : "var(--canvas-text)",
        whiteSpace: "nowrap",
        pointerEvents: enabled ? "auto" : "none",
      }}
    >
      {text.text || "Text"}
    </div>
  );
}

function SelectionHandles({
  onResize,
  onRotate,
}: {
  onResize: (e: ReactPointerEvent) => void;
  onRotate: (e: ReactPointerEvent) => void;
}) {
  return (
    <>
      <button
        type="button"
        aria-label="Rotate"
        onPointerDown={onRotate}
        style={{ pointerEvents: "auto" }}
        className="absolute -top-7 left-1/2 h-4 w-4 -translate-x-1/2 cursor-grab rounded-full border border-sky-300 bg-sky-500/80"
      />
      <button
        type="button"
        aria-label="Resize"
        onPointerDown={onResize}
        style={{ pointerEvents: "auto" }}
        className="absolute -bottom-2 -right-2 h-4 w-4 cursor-nwse-resize rounded-sm border border-sky-300 bg-sky-500/80"
      />
    </>
  );
}
