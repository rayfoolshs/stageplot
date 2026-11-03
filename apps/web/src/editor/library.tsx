import type { ReactNode } from "react";
import type { LibraryCategory } from "@stageplot/shared";

/**
 * Our own stage-item artwork. Each Icon draws inside a 0..100 viewBox using
 * `currentColor`, and is scaled into the item's bounding box by the renderer.
 */
export type IconProps = { children?: never };
type Icon = () => ReactNode;

export type LibraryItem = {
  key: string;
  label: string;
  category: LibraryCategory;
  /** default size in stage units */
  w: number;
  h: number;
  Icon: Icon;
};

/* --- icons (simple, recognizable, ours) --------------------------------- */

const Drumset: Icon = () => (
  <g stroke="currentColor" strokeWidth={3} fill="none" strokeLinecap="round">
    <circle cx="34" cy="64" r="22" />
    <rect x="56" y="44" width="30" height="18" rx="5" />
    <rect x="14" y="30" width="28" height="16" rx="5" />
    <ellipse cx="82" cy="20" rx="13" ry="4" />
    <line x1="70" y1="24" x2="70" y2="40" />
  </g>
);

const Drum: Icon = () => (
  <g stroke="currentColor" strokeWidth={3} fill="none">
    <ellipse cx="50" cy="34" rx="30" ry="10" />
    <path d="M20 34 V66 A30 10 0 0 0 80 66 V34" />
  </g>
);

const Guitar: Icon = () => (
  <g stroke="currentColor" strokeWidth={3} fill="none" strokeLinecap="round">
    <path d="M40 60 a18 18 0 1 0 6 -24 l6 -22 l10 0 l6 -6" />
    <circle cx="44" cy="64" r="6" />
  </g>
);

const ElectricGuitar: Icon = () => (
  <g stroke="currentColor" strokeWidth={3} fill="none" strokeLinecap="round">
    <path d="M30 70 c-12 -6 -14 -22 -2 -28 c10 -5 22 2 26 12 l20 -34 l12 6" />
    <line x1="40" y1="52" x2="70" y2="16" />
  </g>
);

const Amp: Icon = () => (
  <g stroke="currentColor" strokeWidth={3} fill="none">
    <rect x="16" y="20" width="68" height="60" rx="6" />
    <line x1="26" y1="34" x2="74" y2="34" />
    <line x1="26" y1="44" x2="74" y2="44" />
    <circle cx="30" cy="66" r="4" />
    <circle cx="44" cy="66" r="4" />
  </g>
);

const Keyboard: Icon = () => (
  <g stroke="currentColor" strokeWidth={3} fill="none">
    <rect x="8" y="30" width="84" height="40" rx="4" />
    <line x1="26" y1="30" x2="26" y2="48" />
    <line x1="44" y1="30" x2="44" y2="48" />
    <line x1="62" y1="30" x2="62" y2="48" />
    <line x1="80" y1="30" x2="80" y2="48" />
    <line x1="8" y1="48" x2="92" y2="48" />
  </g>
);

const Violin: Icon = () => (
  <g stroke="currentColor" strokeWidth={3} fill="none" strokeLinecap="round">
    <path d="M38 62 c-10 0 -14 -10 -8 -18 c4 -6 12 -6 14 -14 l4 -18 l8 0 l6 6" />
    <line x1="46" y1="44" x2="70" y2="14" />
  </g>
);

const Sax: Icon = () => (
  <g stroke="currentColor" strokeWidth={3} fill="none" strokeLinecap="round">
    <path d="M46 14 v34 a18 18 0 0 0 36 0" />
    <path d="M70 58 c8 4 14 4 20 -2" />
    <circle cx="46" cy="12" r="6" />
  </g>
);

const TripodMic: Icon = () => (
  <g stroke="currentColor" strokeWidth={3} fill="none" strokeLinecap="round">
    <line x1="50" y1="30" x2="50" y2="76" />
    <line x1="50" y1="76" x2="34" y2="92" />
    <line x1="50" y1="76" x2="66" y2="92" />
    <line x1="50" y1="76" x2="50" y2="94" />
    <rect x="42" y="12" width="16" height="24" rx="8" />
  </g>
);

const HandMic: Icon = () => (
  <g stroke="currentColor" strokeWidth={3} fill="none" strokeLinecap="round">
    <rect x="36" y="14" width="28" height="40" rx="14" />
    <line x1="50" y1="54" x2="50" y2="90" />
  </g>
);

const Monitor: Icon = () => (
  <g stroke="currentColor" strokeWidth={3} fill="none" strokeLinejoin="round">
    <path d="M14 30 L86 30 L72 74 L28 74 Z" />
    <circle cx="50" cy="52" r="12" />
  </g>
);

const DiBox: Icon = () => (
  <g stroke="currentColor" strokeWidth={3} fill="none">
    <rect x="20" y="30" width="60" height="40" rx="6" />
    <circle cx="36" cy="50" r="6" />
    <line x1="56" y1="44" x2="70" y2="44" />
    <line x1="56" y1="56" x2="70" y2="56" />
  </g>
);

const Person: Icon = () => (
  <g stroke="currentColor" strokeWidth={3} fill="none" strokeLinecap="round">
    <circle cx="50" cy="28" r="14" />
    <path d="M30 90 v-16 a20 20 0 0 1 40 0 v16" />
  </g>
);

const Singer: Icon = () => (
  <g stroke="currentColor" strokeWidth={3} fill="none" strokeLinecap="round">
    <circle cx="44" cy="28" r="13" />
    <path d="M26 90 v-16 a18 18 0 0 1 36 0 v16" />
    <rect x="74" y="20" width="12" height="20" rx="6" />
    <line x1="80" y1="40" x2="80" y2="72" />
  </g>
);

const Truss: Icon = () => (
  <g stroke="currentColor" strokeWidth={3} fill="none" strokeLinecap="round">
    <line x1="6" y1="40" x2="94" y2="40" />
    <line x1="6" y1="60" x2="94" y2="60" />
    <path d="M6 40 L22 60 M22 40 L38 60 M38 40 L54 60 M54 40 L70 60 M70 40 L86 60" />
  </g>
);

const Riser: Icon = () => (
  <g stroke="currentColor" strokeWidth={3} fill="none">
    <rect x="10" y="30" width="80" height="40" rx="3" />
    <line x1="10" y1="46" x2="90" y2="46" />
  </g>
);

const Cymbal: Icon = () => (
  <g stroke="currentColor" strokeWidth={3} fill="none" strokeLinecap="round">
    <ellipse cx="50" cy="30" rx="34" ry="10" />
    <line x1="50" y1="40" x2="50" y2="88" />
    <line x1="50" y1="88" x2="34" y2="92" />
    <line x1="50" y1="88" x2="66" y2="92" />
  </g>
);

const IEM: Icon = () => (
  <g stroke="currentColor" strokeWidth={3} fill="none" strokeLinecap="round">
    <circle cx="38" cy="50" r="12" />
    <circle cx="66" cy="50" r="8" />
    <path d="M30 40 a16 16 0 0 0 0 20" />
  </g>
);

/* --- catalog ------------------------------------------------------------- */

export const LIBRARY_ITEMS: LibraryItem[] = [
  { key: "drumset", label: "Drumset (3 toms)", category: "Drums", w: 190, h: 150, Icon: Drumset },
  { key: "drum", label: "Drum / tom", category: "Drums", w: 90, h: 80, Icon: Drum },
  { key: "cymbal", label: "Cymbal", category: "Drums", w: 100, h: 70, Icon: Cymbal },
  { key: "amp", label: "Guitar amp", category: "Amps", w: 100, h: 100, Icon: Amp },
  { key: "bassamp", label: "Bass amp", category: "Amps", w: 110, h: 110, Icon: Amp },
  { key: "keyboard", label: "Keyboard", category: "Keys", w: 180, h: 70, Icon: Keyboard },
  { key: "guitar", label: "Acoustic guitar", category: "Guitars", w: 60, h: 140, Icon: Guitar },
  { key: "eguitar", label: "Electric guitar", category: "Guitars", w: 60, h: 140, Icon: ElectricGuitar },
  { key: "violin", label: "Violin / strings", category: "Strings", w: 60, h: 140, Icon: Violin },
  { key: "sax", label: "Sax / winds", category: "Winds", w: 80, h: 110, Icon: Sax },
  { key: "tripodmic", label: "Mic on tripod", category: "Mics", w: 70, h: 120, Icon: TripodMic },
  { key: "handmic", label: "Handheld mic", category: "Mics", w: 50, h: 110, Icon: HandMic },
  { key: "monitor", label: "Stage monitor", category: "Audio", w: 120, h: 80, Icon: Monitor },
  { key: "dibox", label: "DI box", category: "Audio", w: 70, h: 60, Icon: DiBox },
  { key: "iem", label: "In-ear pack", category: "Audio", w: 80, h: 70, Icon: IEM },
  { key: "person", label: "Musician", category: "People", w: 60, h: 110, Icon: Person },
  { key: "singer", label: "Singer", category: "People", w: 90, h: 110, Icon: Singer },
  { key: "truss", label: "Truss", category: "Stages", w: 220, h: 60, Icon: Truss },
  { key: "riser", label: "Riser", category: "Stages", w: 200, h: 120, Icon: Riser },
];

export const LIBRARY_BY_KEY: Record<string, LibraryItem> = Object.fromEntries(
  LIBRARY_ITEMS.map((item) => [item.key, item]),
);

export function getLibraryItem(key: string): LibraryItem | undefined {
  return LIBRARY_BY_KEY[key];
}
