import { useMemo, useState } from "react";
import { LIBRARY_CATEGORIES } from "@stageplot/shared";
import { LIBRARY_ITEMS, type LibraryItem } from "../library";

export function LibraryPanel({ width = 256 }: { width?: number }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LIBRARY_ITEMS.filter((item) => {
      if (activeCategory !== "All" && item.category !== activeCategory) return false;
      if (q && !item.label.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, activeCategory]);

  return (
    <aside
      className="flex shrink-0 flex-col border-r border-neutral-800 bg-neutral-900"
      style={{ width }}
    >
      <div className="border-b border-neutral-800 p-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search items…"
          className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-sky-500 focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-1 border-b border-neutral-800 p-2">
        <CategoryChip
          label="All"
          active={activeCategory === "All"}
          onClick={() => setActiveCategory("All")}
        />
        {LIBRARY_CATEGORIES.map((category) => (
          <CategoryChip
            key={category}
            label={category}
            active={activeCategory === category}
            onClick={() => setActiveCategory(category)}
          />
        ))}
      </div>

      <div className="flex-1 overflow-auto p-2">
        <div className="grid grid-cols-2 gap-2">
          {filtered.map((item) => (
            <LibraryTile key={item.key} item={item} />
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="p-4 text-center text-sm text-neutral-500">No items match.</p>
        )}
      </div>

      <p className="border-t border-neutral-800 p-3 text-xs text-neutral-500">
        Drag an item onto the stage.
      </p>
    </aside>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-2.5 py-0.5 text-xs transition ${
        active
          ? "bg-sky-500 text-white"
          : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
      }`}
    >
      {label}
    </button>
  );
}

function LibraryTile({ item }: { item: LibraryItem }) {
  const { Icon } = item;
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/x-stageplot-item", item.key);
        e.dataTransfer.effectAllowed = "copy";
      }}
      title={item.label}
      className="flex cursor-grab flex-col items-center gap-1 rounded-md border border-neutral-800 bg-neutral-950 p-2 hover:border-sky-600 active:cursor-grabbing"
    >
      <svg viewBox="0 0 100 100" className="h-12 w-12 text-neutral-300">
        <Icon />
      </svg>
      <span className="line-clamp-2 text-center text-[10px] leading-tight text-neutral-400">
        {item.label}
      </span>
    </div>
  );
}
