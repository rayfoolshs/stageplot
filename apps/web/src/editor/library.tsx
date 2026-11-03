import type { ReactNode } from "react";
import type { LibraryCategory } from "@stageplot/shared";

/**
 * Our own stage-item artwork, drawn top-down (or as a recognizable silhouette)
 * inside a 0..100 viewBox using `currentColor`, then scaled into the item's box.
 */
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

/** Shared stroke style for the line work. */
const S = {
  stroke: "currentColor",
  strokeWidth: 2.4,
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};
/** A soft surface fill so shapes read as objects, not just outlines. */
const FILL = { fill: "currentColor", fillOpacity: 0.12 } as const;
const SOLID = { fill: "currentColor", fillOpacity: 0.22 } as const;

/* --- drums --------------------------------------------------------------- */

const Drumset: Icon = () => (
  <g {...S}>
    {/* hi-hat */}
    <circle cx="15" cy="45" r="13" />
    <circle cx="15" cy="45" r="5" {...FILL} />
    {/* crash (left) */}
    <circle cx="27" cy="16" r="12" {...FILL} />
    {/* ride (right) */}
    <circle cx="67" cy="16" r="14" {...FILL} />
    {/* snare */}
    <circle cx="46" cy="34" r="12" {...FILL} />
    <circle cx="46" cy="34" r="8" />
    {/* kick */}
    <circle cx="46" cy="63" r="22" {...FILL} />
    <circle cx="46" cy="63" r="7" />
    <circle cx="46" cy="63" r="2.5" {...SOLID} />
    {/* rack + floor toms */}
    <circle cx="70" cy="45" r="10" {...FILL} />
    <circle cx="83" cy="62" r="10" {...FILL} />
  </g>
);

const Drum: Icon = () => (
  <g {...S}>
    <circle cx="50" cy="50" r="33" {...FILL} />
    <circle cx="50" cy="50" r="27" />
    {/* lugs */}
    <circle cx="50" cy="15" r="3" {...SOLID} stroke="none" />
    <circle cx="80" cy="35" r="3" {...SOLID} stroke="none" />
    <circle cx="80" cy="65" r="3" {...SOLID} stroke="none" />
    <circle cx="50" cy="85" r="3" {...SOLID} stroke="none" />
    <circle cx="20" cy="65" r="3" {...SOLID} stroke="none" />
    <circle cx="20" cy="35" r="3" {...SOLID} stroke="none" />
    <circle cx="50" cy="50" r="5" {...SOLID} />
  </g>
);

const Cymbal: Icon = () => (
  <g {...S}>
    <circle cx="50" cy="50" r="39" {...FILL} />
    <circle cx="50" cy="50" r="13" />
    <circle cx="50" cy="50" r="3.5" {...SOLID} />
  </g>
);

/* --- amps ---------------------------------------------------------------- */

const Amp: Icon = () => (
  <g {...S}>
    <rect x="16" y="26" width="68" height="58" rx="4" {...FILL} />
    {/* control panel */}
    <rect x="16" y="26" width="68" height="13" rx="4" />
    <circle cx="26" cy="32.5" r="2.6" {...SOLID} />
    <circle cx="36" cy="32.5" r="2.6" {...SOLID} />
    <circle cx="46" cy="32.5" r="2.6" {...SOLID} />
    {/* grille */}
    <rect x="22" y="45" width="56" height="33" rx="3" />
    <line x1="31" y1="45" x2="31" y2="78" />
    <line x1="50" y1="45" x2="50" y2="78" />
    <line x1="69" y1="45" x2="69" y2="78" />
    {/* handle */}
    <path d="M44 18 h12 a4 4 0 0 1 0 8 h-12 a4 4 0 0 1 0 -8 z" {...FILL} />
  </g>
);

const BassAmp: Icon = () => (
  <g {...S}>
    <rect x="12" y="20" width="76" height="66" rx="4" {...FILL} />
    <rect x="12" y="20" width="76" height="12" rx="4" />
    <circle cx="22" cy="26" r="2.6" {...SOLID} />
    <circle cx="32" cy="26" r="2.6" {...SOLID} />
    <circle cx="42" cy="26" r="2.6" {...SOLID} />
    <circle cx="32" cy="60" r="17" {...FILL} />
    <circle cx="32" cy="60" r="6" />
    <circle cx="68" cy="60" r="17" {...FILL} />
    <circle cx="68" cy="60" r="6" />
  </g>
);

/* --- keys ---------------------------------------------------------------- */

const Keyboard: Icon = () => (
  <g {...S}>
    <rect x="7" y="32" width="86" height="36" rx="3" {...FILL} />
    <line x1="7" y1="50" x2="93" y2="50" />
    {/* white-key separators */}
    <line x1="22" y1="50" x2="22" y2="68" />
    <line x1="37" y1="50" x2="37" y2="68" />
    <line x1="52" y1="50" x2="52" y2="68" />
    <line x1="67" y1="50" x2="67" y2="68" />
    <line x1="82" y1="50" x2="82" y2="68" />
    {/* black keys */}
    <rect x="16" y="32" width="7" height="13" {...SOLID} />
    <rect x="30" y="32" width="7" height="13" {...SOLID} />
    <rect x="52" y="32" width="7" height="13" {...SOLID} />
    <rect x="66" y="32" width="7" height="13" {...SOLID} />
    <rect x="80" y="32" width="7" height="13" {...SOLID} />
  </g>
);

/* --- guitars / strings --------------------------------------------------- */

const Guitar: Icon = () => (
  <g {...S}>
    <ellipse cx="50" cy="76" rx="23" ry="19" {...FILL} />
    <ellipse cx="50" cy="55" rx="16" ry="13" {...FILL} />
    <circle cx="50" cy="70" r="7" />
    <rect x="46" y="16" width="8" height="34" rx="2" />
    <rect x="43" y="5" width="14" height="12" rx="3" {...FILL} />
    <rect x="40" y="86" width="20" height="4" rx="1.5" />
  </g>
);

const ElectricGuitar: Icon = () => (
  <g {...S}>
    <path
      d="M50 60 C36 58 26 68 28 80 C30 91 43 93 50 89 C57 93 70 91 72 80 C74 68 64 58 50 60 Z"
      {...FILL}
    />
    <rect x="46" y="20" width="8" height="40" rx="2" />
    <rect x="44" y="10" width="12" height="12" rx="3" {...FILL} />
    <rect x="39" y="70" width="22" height="4" rx="1.5" />
    <rect x="39" y="78" width="22" height="4" rx="1.5" />
    <circle cx="34" cy="80" r="2.4" {...SOLID} />
    <circle cx="37" cy="72" r="2.4" {...SOLID} />
  </g>
);

const Violin: Icon = () => (
  <g {...S}>
    <ellipse cx="50" cy="80" rx="19" ry="15" {...FILL} />
    <path d="M31 70 Q50 62 69 70" />
    <ellipse cx="50" cy="60" rx="13" ry="11" {...FILL} />
    <path d="M40 74 q-3 4 0 8" />
    <path d="M60 74 q3 4 0 8" />
    <rect x="47" y="22" width="6" height="30" rx="2" />
    <circle cx="50" cy="17" r="5" {...FILL} />
  </g>
);

/* --- winds --------------------------------------------------------------- */

const Sax: Icon = () => (
  <g {...S}>
    <rect x="35" y="10" width="10" height="9" rx="3" {...FILL} />
    <path d="M40 19 V44" />
    <path d="M40 44 V54 Q40 72 60 72 Q80 72 80 54 V32" strokeWidth={9} />
    <ellipse cx="80" cy="24" rx="9" ry="13" {...FILL} />
    <circle cx="40" cy="34" r="2.4" {...SOLID} />
    <circle cx="40" cy="60" r="2.4" {...SOLID} />
    <circle cx="60" cy="72" r="2.4" {...SOLID} />
    <circle cx="80" cy="62" r="2.4" {...SOLID} />
  </g>
);

/* --- mics ---------------------------------------------------------------- */

const TripodMic: Icon = () => (
  <g {...S}>
    {/* tripod legs (top-down) */}
    <line x1="46" y1="58" x2="20" y2="82" />
    <line x1="46" y1="58" x2="78" y2="82" />
    <line x1="46" y1="58" x2="46" y2="20" />
    <circle cx="20" cy="82" r="3" />
    <circle cx="78" cy="82" r="3" />
    {/* boom */}
    <line x1="46" y1="58" x2="72" y2="34" />
    {/* mic capsule */}
    <rect x="66" y="24" width="12" height="16" rx="6" {...FILL} transform="rotate(35 72 32)" />
  </g>
);

const HandMic: Icon = () => (
  <g {...S}>
    <circle cx="50" cy="34" r="15" {...FILL} />
    <path d="M44 20 v28 M52 18 v32 M60 34 h-20" strokeWidth={1.4} />
    <path d="M40 46 q10 6 20 0 l-3 34 a7 7 0 0 1 -14 0 z" {...FILL} />
    <line x1="50" y1="58" x2="50" y2="80" />
  </g>
);

/* --- audio --------------------------------------------------------------- */

const Monitor: Icon = () => (
  <g {...S}>
    {/* wedge, top-down: wide at back, narrow at front */}
    <path d="M16 26 L84 26 L70 80 L30 80 Z" {...FILL} />
    <circle cx="50" cy="52" r="15" />
    <circle cx="50" cy="52" r="5" {...SOLID} />
    <path d="M24 34 h52" strokeWidth={1.4} />
  </g>
);

const DiBox: Icon = () => (
  <g {...S}>
    <rect x="20" y="34" width="60" height="34" rx="6" {...FILL} />
    <circle cx="36" cy="49" r="6" />
    <circle cx="52" cy="49" r="6" />
    <circle cx="66" cy="44" r="2.6" {...SOLID} />
    <rect x="30" y="64" width="10" height="5" rx="1.5" {...SOLID} />
    <rect x="60" y="64" width="10" height="5" rx="1.5" {...SOLID} />
  </g>
);

const IEM: Icon = () => (
  <g {...S}>
    <circle cx="34" cy="44" r="13" {...FILL} />
    <circle cx="34" cy="44" r="5" />
    <circle cx="64" cy="44" r="13" {...FILL} />
    <circle cx="64" cy="44" r="5" />
    <path d="M34 31 q0 -12 30 -12 q30 0 30 12" />
    <path d="M30 56 q-4 14 6 22" />
    <path d="M68 56 q4 14 -6 22" />
  </g>
);

/* --- people -------------------------------------------------------------- */

const Person: Icon = () => (
  <g {...S}>
    <circle cx="50" cy="32" r="14" {...FILL} />
    <path d="M24 88 C24 62 34 52 50 52 C66 52 76 62 76 88 Z" {...FILL} />
  </g>
);

const Singer: Icon = () => (
  <g {...S}>
    <circle cx="42" cy="32" r="13" {...FILL} />
    <path d="M18 88 C18 63 27 54 42 54 C57 54 66 63 66 88 Z" {...FILL} />
    {/* handheld mic raised */}
    <circle cx="78" cy="26" r="7" {...FILL} />
    <path d="M74 33 l-6 12" />
  </g>
);

/* --- stage / structure --------------------------------------------------- */

const Truss: Icon = () => (
  <g {...S}>
    <rect x="6" y="34" width="88" height="32" rx="3" {...FILL} />
    <line x1="6" y1="42" x2="94" y2="42" />
    <line x1="6" y1="58" x2="94" y2="58" />
    <path d="M6 42 L18 58 M18 42 L30 58 M30 42 L42 58 M42 42 L54 58 M54 42 L66 58 M66 42 L78 58 M78 42 L90 58" strokeWidth={1.6} />
  </g>
);

const Riser: Icon = () => (
  <g {...S}>
    <rect x="12" y="26" width="76" height="48" rx="3" {...FILL} />
    <rect x="18" y="32" width="64" height="36" rx="2" />
    <line x1="12" y1="68" x2="88" y2="68" strokeWidth={1.6} />
  </g>
);

/* --- catalog ------------------------------------------------------------- */

export const LIBRARY_ITEMS: LibraryItem[] = [
  { key: "drumset", label: "Drumset (3 toms)", category: "Drums", w: 190, h: 150, Icon: Drumset },
  { key: "drum", label: "Drum / tom", category: "Drums", w: 90, h: 90, Icon: Drum },
  { key: "cymbal", label: "Cymbal", category: "Drums", w: 100, h: 100, Icon: Cymbal },
  { key: "amp", label: "Guitar amp", category: "Amps", w: 100, h: 100, Icon: Amp },
  { key: "bassamp", label: "Bass amp", category: "Amps", w: 120, h: 110, Icon: BassAmp },
  { key: "keyboard", label: "Keyboard", category: "Keys", w: 190, h: 80, Icon: Keyboard },
  { key: "guitar", label: "Acoustic guitar", category: "Guitars", w: 70, h: 140, Icon: Guitar },
  { key: "eguitar", label: "Electric guitar", category: "Guitars", w: 70, h: 140, Icon: ElectricGuitar },
  { key: "violin", label: "Violin / strings", category: "Strings", w: 70, h: 140, Icon: Violin },
  { key: "sax", label: "Sax / winds", category: "Winds", w: 90, h: 120, Icon: Sax },
  { key: "tripodmic", label: "Mic on tripod", category: "Mics", w: 80, h: 130, Icon: TripodMic },
  { key: "handmic", label: "Handheld mic", category: "Mics", w: 60, h: 120, Icon: HandMic },
  { key: "monitor", label: "Stage monitor", category: "Audio", w: 130, h: 90, Icon: Monitor },
  { key: "dibox", label: "DI box", category: "Audio", w: 80, h: 70, Icon: DiBox },
  { key: "iem", label: "In-ear monitors", category: "Audio", w: 100, h: 80, Icon: IEM },
  { key: "person", label: "Musician", category: "People", w: 60, h: 110, Icon: Person },
  { key: "singer", label: "Singer", category: "People", w: 90, h: 110, Icon: Singer },
  { key: "truss", label: "Truss", category: "Stages", w: 220, h: 70, Icon: Truss },
  { key: "riser", label: "Riser", category: "Stages", w: 200, h: 130, Icon: Riser },
];

export const LIBRARY_BY_KEY: Record<string, LibraryItem> = Object.fromEntries(
  LIBRARY_ITEMS.map((item) => [item.key, item]),
);

export function getLibraryItem(key: string): LibraryItem | undefined {
  return LIBRARY_BY_KEY[key];
}
