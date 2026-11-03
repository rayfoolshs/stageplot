import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

/**
 * A draggable divider. `orientation` describes the divider itself: a vertical
 * divider sits between side-by-side panels and resizes their width; a
 * horizontal one sits above/below a panel and resizes its height.
 *
 * `invert` flips the direction, for panels anchored on the right or bottom
 * edge where dragging toward the panel should make it bigger.
 */
export function Splitter({
  orientation,
  value,
  onChange,
  min = 160,
  max = 720,
  invert = false,
  reset,
  label,
}: {
  orientation: "vertical" | "horizontal";
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  invert?: boolean;
  /** Size restored on double-click. */
  reset?: number;
  label: string;
}) {
  const [dragging, setDragging] = useState(false);
  const startPos = useRef(0);
  const startValue = useRef(0);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    startPos.current = orientation === "vertical" ? e.clientX : e.clientY;
    startValue.current = value;
    setDragging(true);

    const move = (ev: PointerEvent) => {
      const pos = orientation === "vertical" ? ev.clientX : ev.clientY;
      const delta = pos - startPos.current;
      const next = startValue.current + (invert ? -delta : delta);
      onChange(Math.min(max, Math.max(min, next)));
    };
    const stop = () => {
      setDragging(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = orientation === "vertical" ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
  };

  const vertical = orientation === "vertical";

  return (
    <div
      role="separator"
      aria-orientation={vertical ? "vertical" : "horizontal"}
      aria-label={label}
      title={`${label} — drag to resize${reset !== undefined ? ", double-click to reset" : ""}`}
      onPointerDown={onPointerDown}
      onDoubleClick={() => {
        if (reset !== undefined) onChange(reset);
      }}
      className={`${
        vertical ? "w-1 cursor-col-resize" : "h-1 cursor-row-resize"
      } shrink-0 transition-colors ${
        dragging ? "bg-sky-500" : "bg-neutral-800 hover:bg-sky-500/60"
      }`}
      style={{ touchAction: "none" }}
    />
  );
}

/**
 * Panel size kept in localStorage so the workspace layout survives a reload.
 * Sizes are clamped on read, in case a stored value no longer fits.
 */
export function useStoredSize(
  key: string,
  initial: number,
  min: number,
  max: number,
): [number, (next: number) => void] {
  const [size, setSize] = useState(() => {
    try {
      const stored = Number(localStorage.getItem(key));
      if (Number.isFinite(stored) && stored >= min) return Math.min(max, stored);
    } catch {
      /* storage unavailable — use the default */
    }
    return initial;
  });

  const update = useCallback(
    (next: number) => {
      const clamped = Math.min(max, Math.max(min, Math.round(next)));
      setSize(clamped);
      try {
        localStorage.setItem(key, String(clamped));
      } catch {
        /* the size just won't persist */
      }
    },
    [key, min, max],
  );

  return [size, update];
}
