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

/* --- more drums ---------------------------------------------------------- */

const HiHat: Icon = () => (
  <g {...S}>
    <circle cx="50" cy="50" r="35" {...FILL} />
    <circle cx="50" cy="50" r="29" />
    <circle cx="50" cy="50" r="5" {...SOLID} />
  </g>
);

const KickDrum: Icon = () => (
  <g {...S}>
    <circle cx="50" cy="42" r="30" {...FILL} />
    <circle cx="50" cy="42" r="24" />
    <circle cx="50" cy="42" r="6" {...SOLID} />
    <rect x="41" y="72" width="18" height="18" rx="4" {...FILL} />
  </g>
);

const Congas: Icon = () => (
  <g {...S}>
    <circle cx="33" cy="40" r="17" {...FILL} />
    <circle cx="33" cy="40" r="12" />
    <circle cx="67" cy="48" r="15" {...FILL} />
    <circle cx="67" cy="48" r="10" />
    <circle cx="40" cy="74" r="12" {...FILL} />
    <circle cx="40" cy="74" r="7" />
  </g>
);

const Cajon: Icon = () => (
  <g {...S}>
    <rect x="26" y="18" width="48" height="66" rx="5" {...FILL} />
    <line x1="26" y1="34" x2="74" y2="34" />
    <circle cx="50" cy="54" r="11" />
    <circle cx="50" cy="28" r="2.4" {...SOLID} />
  </g>
);

/* --- more amps ----------------------------------------------------------- */

const AmpHead: Icon = () => (
  <g {...S}>
    <rect x="8" y="32" width="84" height="36" rx="5" {...FILL} />
    <circle cx="24" cy="50" r="4" />
    <circle cx="38" cy="50" r="4" />
    <circle cx="52" cy="50" r="4" />
    <circle cx="66" cy="50" r="4" />
    <rect x="74" y="44" width="11" height="12" rx="2" {...SOLID} />
  </g>
);

/* --- more keys ----------------------------------------------------------- */

const Piano: Icon = () => (
  <g {...S}>
    <rect x="16" y="20" width="68" height="60" rx="4" {...FILL} />
    <line x1="16" y1="34" x2="84" y2="34" />
    <rect x="20" y="58" width="60" height="18" rx="2" />
    <rect x="26" y="58" width="5" height="8" {...SOLID} />
    <rect x="36" y="58" width="5" height="8" {...SOLID} />
    <rect x="50" y="58" width="5" height="8" {...SOLID} />
    <rect x="60" y="58" width="5" height="8" {...SOLID} />
    <rect x="72" y="58" width="5" height="8" {...SOLID} />
  </g>
);

const Synth: Icon = () => (
  <g {...S}>
    <rect x="8" y="26" width="84" height="48" rx="4" {...FILL} />
    <line x1="8" y1="44" x2="92" y2="44" />
    <circle cx="20" cy="35" r="3" {...SOLID} />
    <circle cx="34" cy="35" r="3" {...SOLID} />
    <circle cx="48" cy="35" r="3" {...SOLID} />
    <circle cx="62" cy="35" r="3" {...SOLID} />
    <circle cx="76" cy="35" r="3" {...SOLID} />
    <line x1="25" y1="44" x2="25" y2="74" />
    <line x1="42" y1="44" x2="42" y2="74" />
    <line x1="59" y1="44" x2="59" y2="74" />
    <line x1="76" y1="44" x2="76" y2="74" />
  </g>
);

/* --- more guitars / strings ---------------------------------------------- */

const BassGuitar: Icon = () => (
  <g {...S}>
    <path
      d="M50 56 C36 54 26 64 28 76 C30 87 43 89 50 85 C57 89 70 87 72 76 C74 64 64 54 50 56 Z"
      {...FILL}
    />
    <rect x="46" y="14" width="8" height="44" rx="2" />
    <rect x="42" y="4" width="16" height="12" rx="3" {...FILL} />
    <circle cx="44" cy="20" r="2.4" {...SOLID} />
    <circle cx="56" cy="20" r="2.4" {...SOLID} />
    <rect x="40" y="66" width="20" height="4" rx="1.5" />
    <rect x="40" y="74" width="20" height="4" rx="1.5" />
  </g>
);

const Cello: Icon = () => (
  <g {...S}>
    <ellipse cx="50" cy="82" rx="17" ry="13" {...FILL} />
    <ellipse cx="50" cy="60" rx="11" ry="8" {...FILL} />
    <path d="M42 74 q-3 4 0 7" />
    <path d="M58 74 q3 4 0 7" />
    <rect x="47" y="22" width="6" height="32" rx="2" />
    <circle cx="50" cy="17" r="5" {...FILL} />
    <line x1="50" y1="98" x2="50" y2="92" />
  </g>
);

/* --- more winds ---------------------------------------------------------- */

const Trumpet: Icon = () => (
  <g {...S}>
    <rect x="14" y="46" width="22" height="8" rx="3" {...FILL} />
    <rect x="34" y="42" width="34" height="16" rx="4" {...FILL} />
    <rect x="40" y="32" width="6" height="14" rx="2" />
    <rect x="49" y="30" width="6" height="16" rx="2" />
    <rect x="58" y="32" width="6" height="14" rx="2" />
    <path d="M68 38 C86 33 94 40 94 50 C94 60 86 67 68 62 Z" {...FILL} />
  </g>
);

const Trombone: Icon = () => (
  <g {...S}>
    <rect x="10" y="40" width="60" height="6" rx="3" {...FILL} />
    <rect x="10" y="54" width="60" height="6" rx="3" {...FILL} />
    <rect x="20" y="44" width="12" height="12" rx="4" />
    <path d="M70 34 C88 28 98 38 98 50 C98 62 88 72 70 66 Z" {...FILL} />
  </g>
);

/* --- more mics ----------------------------------------------------------- */

const DrumClip: Icon = () => (
  <g {...S}>
    <rect x="40" y="24" width="16" height="26" rx="7" {...FILL} />
    <circle cx="48" cy="32" r="6" />
    <path d="M40 48 q-12 8 -6 22" />
    <path d="M56 48 q12 8 6 22" />
    <line x1="48" y1="58" x2="48" y2="86" />
  </g>
);

const OverheadMic: Icon = () => (
  <g {...S}>
    <circle cx="10" cy="64" r="5" {...FILL} />
    <line x1="14" y1="64" x2="62" y2="64" />
    <line x1="62" y1="64" x2="78" y2="42" />
    <rect x="72" y="28" width="14" height="18" rx="7" {...FILL} transform="rotate(40 79 37)" />
  </g>
);

const WirelessMic: Icon = () => (
  <g {...S}>
    <circle cx="38" cy="36" r="14" {...FILL} />
    <path d="M31 22 v28 M45 20 v32 M24 36 h28" strokeWidth={1.4} />
    <path d="M29 47 q9 6 18 0 l-3 30 a6 6 0 0 1 -12 0 z" {...FILL} />
    <path d="M62 28 q10 10 0 20" />
    <path d="M72 22 q16 16 0 32" />
  </g>
);

/* --- more audio ---------------------------------------------------------- */

const Subwoofer: Icon = () => (
  <g {...S}>
    <rect x="13" y="20" width="74" height="64" rx="5" {...FILL} />
    <circle cx="50" cy="52" r="22" {...FILL} />
    <circle cx="50" cy="52" r="8" />
    <rect x="24" y="28" width="12" height="6" rx="2" {...SOLID} />
  </g>
);

const PaSpeaker: Icon = () => (
  <g {...S}>
    <rect x="26" y="12" width="48" height="48" rx="5" {...FILL} />
    <circle cx="50" cy="30" r="11" />
    <circle cx="50" cy="48" r="8" />
    <line x1="50" y1="60" x2="50" y2="80" />
    <line x1="50" y1="80" x2="34" y2="94" />
    <line x1="50" y1="80" x2="66" y2="94" />
  </g>
);

const Mixer: Icon = () => (
  <g {...S}>
    <rect x="8" y="26" width="84" height="52" rx="4" {...FILL} />
    <circle cx="20" cy="36" r="3" {...SOLID} />
    <circle cx="32" cy="36" r="3" {...SOLID} />
    <circle cx="44" cy="36" r="3" {...SOLID} />
    <circle cx="56" cy="36" r="3" {...SOLID} />
    <circle cx="68" cy="36" r="3" {...SOLID} />
    <line x1="20" y1="46" x2="20" y2="68" />
    <line x1="32" y1="46" x2="32" y2="68" />
    <line x1="44" y1="46" x2="44" y2="68" />
    <line x1="56" y1="46" x2="56" y2="68" />
    <line x1="68" y1="46" x2="68" y2="68" />
    <rect x="76" y="34" width="12" height="34" rx="2" {...FILL} />
  </g>
);

const Headphones: Icon = () => (
  <g {...S}>
    <path d="M22 60 v-10 a28 28 0 0 1 56 0 v10" />
    <rect x="14" y="56" width="15" height="24" rx="7" {...FILL} />
    <rect x="71" y="56" width="15" height="24" rx="7" {...FILL} />
  </g>
);

/* --- more people --------------------------------------------------------- */

const Dj: Icon = () => (
  <g {...S}>
    <circle cx="50" cy="36" r="13" {...FILL} />
    <path d="M26 88 C26 64 36 54 50 54 C64 54 74 64 74 88 Z" {...FILL} />
    <path d="M30 32 v-3 a20 20 0 0 1 40 0 v3" />
    <rect x="24" y="28" width="10" height="16" rx="5" {...FILL} />
    <rect x="66" y="28" width="10" height="16" rx="5" {...FILL} />
  </g>
);

/* --- more stage ---------------------------------------------------------- */

const Stairs: Icon = () => (
  <g {...S}>
    <rect x="26" y="14" width="48" height="72" rx="3" {...FILL} />
    <line x1="26" y1="28" x2="74" y2="28" />
    <line x1="26" y1="42" x2="74" y2="42" />
    <line x1="26" y1="56" x2="74" y2="56" />
    <line x1="26" y1="70" x2="74" y2="70" />
  </g>
);

const Barricade: Icon = () => (
  <g {...S}>
    <line x1="8" y1="38" x2="92" y2="38" />
    <line x1="8" y1="62" x2="92" y2="62" />
    <line x1="14" y1="34" x2="14" y2="66" />
    <line x1="30" y1="34" x2="30" y2="66" />
    <line x1="46" y1="34" x2="46" y2="66" />
    <line x1="62" y1="34" x2="62" y2="66" />
    <line x1="78" y1="34" x2="78" y2="66" />
    <line x1="92" y1="34" x2="92" y2="66" />
  </g>
);

const Backdrop: Icon = () => (
  <g {...S}>
    <rect x="6" y="28" width="88" height="44" rx="2" {...FILL} />
    <path d="M20 28 q4 22 0 44" />
    <path d="M36 28 q4 22 0 44" />
    <path d="M52 28 q4 22 0 44" />
    <path d="M68 28 q4 22 0 44" />
    <path d="M84 28 q4 22 0 44" />
  </g>
);

/* --- lighting ------------------------------------------------------------ */

const ParCan: Icon = () => (
  <g {...S}>
    <path d="M36 50 L64 50 L80 92 L20 92 Z" {...SOLID} stroke="none" />
    <circle cx="50" cy="36" r="18" {...FILL} />
    <circle cx="50" cy="36" r="9" />
    <path d="M32 36 a18 18 0 0 0 36 0" />
  </g>
);

const MovingHead: Icon = () => (
  <g {...S}>
    <path d="M38 46 L62 46 L78 92 L22 92 Z" {...SOLID} stroke="none" />
    <circle cx="50" cy="40" r="16" {...FILL} />
    <circle cx="50" cy="40" r="7" />
    <path d="M34 40 a16 16 0 0 0 32 0" />
  </g>
);

/* --- video --------------------------------------------------------------- */

/** A single flat panel, front-on: bezel, screen, faint panel seams and a mount. */
const LedTv: Icon = () => (
  <g {...S}>
    <rect x="3" y="26" width="94" height="54" rx="3" {...FILL} />
    <rect x="8" y="31" width="84" height="44" rx="1.5" />
    <path
      d="M8 45.7 h84 M8 60.3 h84 M29 31 v44 M50 31 v44 M71 31 v44"
      strokeWidth={0.9}
      opacity={0.5}
    />
    {/* wall mount / stand */}
    <path d="M43 80 v7 M57 80 v7" />
    <rect x="33" y="87" width="34" height="6" rx="2" {...SOLID} />
  </g>
);

/** A tiled video wall: several panels joined into one large surface. */
const VideoWall: Icon = () => (
  <g {...S}>
    <rect x="2" y="16" width="96" height="62" rx="2" {...FILL} />
    {/* panel seams: 3 x 3 tiles */}
    <path d="M2 36.7 h96 M2 57.3 h96 M34 16 v62 M66 16 v62" strokeWidth={1.6} />
    {/* frame mount */}
    <rect x="26" y="82" width="48" height="6" rx="2" {...SOLID} />
    <path d="M36 78 v4 M64 78 v4" />
  </g>
);

/* --- desks & racks ------------------------------------------------------- */

/** A digital mixing console, top-down: colour screen, encoder row, fader bank. */
const X32Console: Icon = () => (
  <g {...S}>
    <rect x="2" y="28" width="96" height="54" rx="4" {...FILL} />
    {/* colour screen */}
    <rect x="8" y="33" width="22" height="15" rx="2" />
    <path d="M11.5 40.5 h15" strokeWidth={0.9} opacity={0.5} />
    {/* encoder row */}
    {[38, 46, 54, 62, 70, 78, 86].map((x) => (
      <circle key={`k${x}`} cx={x} cy={40} r="2.6" {...SOLID} stroke="none" />
    ))}
    {/* fader bank */}
    {[12, 21, 30, 39, 48, 57, 66, 75, 84, 92].map((x, i) => (
      <g key={`f${x}`}>
        <line x1={x} y1="56" x2={x} y2="76" strokeWidth={1.6} opacity={0.6} />
        <rect
          x={x - 2.6}
          y={60 + (i % 3) * 4.5}
          width="5.2"
          height="3.4"
          rx="1"
          {...SOLID}
          stroke="none"
        />
      </g>
    ))}
  </g>
);

/** Digital snake / I/O / DI rack: stacked 1U panels with XLR and jack sockets. */
const DigitalSnake: Icon = () => (
  <g {...S}>
    <rect x="5" y="12" width="90" height="76" rx="3" {...FILL} />
    <rect x="10" y="17" width="80" height="20" rx="2" />
    <rect x="10" y="40" width="80" height="20" rx="2" />
    <rect x="10" y="63" width="80" height="20" rx="2" />
    {/* unit 1 — mini display + XLR fan-out */}
    <rect x="14" y="22" width="14" height="10" rx="1.5" />
    {[34, 43, 52, 61, 70, 79].map((x) => (
      <g key={`a${x}`}>
        <circle cx={x} cy="27" r="3.2" />
        <circle cx={x} cy="27" r="1.2" {...SOLID} stroke="none" />
      </g>
    ))}
    {/* unit 2 — XLR inputs */}
    {[15, 24, 33, 42, 51, 60, 69, 78, 87].map((x) => (
      <circle key={`b${x}`} cx={x} cy="50" r="3.2" />
    ))}
    {/* unit 3 — DI jack sockets + status LEDs */}
    {[18, 30, 42, 54].map((x) => (
      <g key={`c${x}`}>
        <circle cx={x} cy="73" r="3.8" />
        <circle cx={x} cy="73" r="1.3" {...SOLID} stroke="none" />
      </g>
    ))}
    {[66, 72, 78, 84].map((x) => (
      <circle key={`d${x}`} cx={x} cy="73" r="1.6" {...SOLID} stroke="none" />
    ))}
  </g>
);

/* --- power --------------------------------------------------------------- */

/** A wall outlet plate: two vertical pins and an earth slot. */
const PowerOutlet: Icon = () => (
  <g {...S}>
    <rect x="16" y="16" width="68" height="68" rx="10" {...FILL} />
    <rect x="34" y="30" width="8" height="22" rx="2" {...SOLID} stroke="none" />
    <rect x="58" y="30" width="8" height="22" rx="2" {...SOLID} stroke="none" />
    <rect x="38" y="62" width="24" height="8" rx="2" {...SOLID} stroke="none" />
    <circle cx="25" cy="25" r="2.4" />
    <circle cx="75" cy="75" r="2.4" />
  </g>
);

/** A distro box: one feed in, several outlets out. */
const PowerDistro: Icon = () => (
  <g {...S}>
    <rect x="12" y="24" width="76" height="52" rx="6" {...FILL} />
    {[30, 50, 70].map((x) => (
      <g key={x}>
        <circle cx={x} cy="50" r="9" />
        <rect x={x - 2} y="44" width="4" height="12" rx="1.5" {...SOLID} stroke="none" />
      </g>
    ))}
  </g>
);

/* --- catalog ------------------------------------------------------------- */

export const LIBRARY_ITEMS: LibraryItem[] = [
  // drums
  { key: "drumset", label: "Drumset (3 toms)", category: "Drums", w: 190, h: 150, Icon: Drumset },
  { key: "hihat", label: "Hi-hat", category: "Drums", w: 100, h: 100, Icon: HiHat },
  { key: "kickdrum", label: "Kick drum", category: "Drums", w: 110, h: 110, Icon: KickDrum },
  { key: "drum", label: "Tom", category: "Drums", w: 90, h: 90, Icon: Drum },
  { key: "cymbal", label: "Cymbal", category: "Drums", w: 100, h: 100, Icon: Cymbal },
  { key: "congas", label: "Congas / percussion", category: "Drums", w: 110, h: 100, Icon: Congas },
  { key: "cajon", label: "Cajon", category: "Drums", w: 80, h: 100, Icon: Cajon },
  // amps
  { key: "amp", label: "Guitar amp", category: "Amps", w: 100, h: 100, Icon: Amp },
  { key: "bassamp", label: "Bass amp", category: "Amps", w: 120, h: 110, Icon: BassAmp },
  { key: "amphead", label: "Amp head", category: "Amps", w: 120, h: 80, Icon: AmpHead },
  // keys
  { key: "keyboard", label: "Keyboard", category: "Keys", w: 190, h: 80, Icon: Keyboard },
  { key: "piano", label: "Piano (upright)", category: "Keys", w: 150, h: 140, Icon: Piano },
  { key: "synth", label: "Synth", category: "Keys", w: 190, h: 90, Icon: Synth },
  // guitars
  { key: "guitar", label: "Acoustic guitar", category: "Guitars", w: 70, h: 140, Icon: Guitar },
  { key: "eguitar", label: "Electric guitar", category: "Guitars", w: 70, h: 140, Icon: ElectricGuitar },
  { key: "bassguitar", label: "Bass guitar", category: "Guitars", w: 70, h: 150, Icon: BassGuitar },
  // strings
  { key: "violin", label: "Violin", category: "Strings", w: 70, h: 140, Icon: Violin },
  { key: "cello", label: "Cello", category: "Strings", w: 70, h: 150, Icon: Cello },
  // winds
  { key: "sax", label: "Saxophone", category: "Winds", w: 90, h: 120, Icon: Sax },
  { key: "trumpet", label: "Trumpet", category: "Winds", w: 130, h: 90, Icon: Trumpet },
  { key: "trombone", label: "Trombone", category: "Winds", w: 150, h: 90, Icon: Trombone },
  // mics
  { key: "tripodmic", label: "Mic on tripod", category: "Mics", w: 80, h: 130, Icon: TripodMic },
  { key: "handmic", label: "Handheld mic", category: "Mics", w: 60, h: 120, Icon: HandMic },
  { key: "drumclip", label: "Drum clip mic", category: "Mics", w: 60, h: 100, Icon: DrumClip },
  { key: "overheadmic", label: "Overhead mic", category: "Mics", w: 100, h: 90, Icon: OverheadMic },
  { key: "wirelessmic", label: "Wireless mic", category: "Mics", w: 90, h: 110, Icon: WirelessMic },
  // audio
  { key: "monitor", label: "Stage monitor", category: "Audio", w: 130, h: 90, Icon: Monitor },
  { key: "subwoofer", label: "Subwoofer", category: "Audio", w: 130, h: 110, Icon: Subwoofer },
  { key: "paspeaker", label: "PA speaker", category: "Audio", w: 90, h: 130, Icon: PaSpeaker },
  { key: "dibox", label: "DI box", category: "Audio", w: 80, h: 70, Icon: DiBox },
  { key: "iem", label: "In-ear monitors", category: "Audio", w: 100, h: 80, Icon: IEM },
  { key: "headphones", label: "Headphones", category: "Audio", w: 110, h: 110, Icon: Headphones },
  { key: "mixer", label: "Mixer / console", category: "Audio", w: 200, h: 120, Icon: Mixer },
  { key: "x32", label: "X32 Console", category: "Audio", w: 220, h: 150, Icon: X32Console },
  { key: "digitalsnake", label: "Digital Snake / IO / DI Boxes", category: "Audio", w: 150, h: 150, Icon: DigitalSnake },
  // power
  { key: "poweroutlet", label: "Power outlet", category: "Power", w: 80, h: 80, Icon: PowerOutlet },
  { key: "powerdistro", label: "Power distro", category: "Power", w: 120, h: 90, Icon: PowerDistro },
  // people
  { key: "person", label: "Musician", category: "People", w: 60, h: 110, Icon: Person },
  { key: "singer", label: "Singer", category: "People", w: 90, h: 110, Icon: Singer },
  { key: "dj", label: "DJ", category: "People", w: 80, h: 110, Icon: Dj },
  // stages
  { key: "truss", label: "Truss", category: "Stages", w: 220, h: 70, Icon: Truss },
  { key: "riser", label: "Riser", category: "Stages", w: 200, h: 130, Icon: Riser },
  { key: "stairs", label: "Stairs", category: "Stages", w: 90, h: 130, Icon: Stairs },
  { key: "barricade", label: "Barricade", category: "Stages", w: 220, h: 70, Icon: Barricade },
  { key: "backdrop", label: "Backdrop / curtain", category: "Stages", w: 240, h: 110, Icon: Backdrop },
  // lighting
  { key: "parcan", label: "Par can", category: "Lighting", w: 120, h: 120, Icon: ParCan },
  { key: "movinghead", label: "Moving head", category: "Lighting", w: 120, h: 120, Icon: MovingHead },
  // video
  { key: "ledtv", label: "LED TV panel (large)", category: "Video", w: 320, h: 180, Icon: LedTv },
  { key: "ledtvsmall", label: "LED TV panel (small)", category: "Video", w: 160, h: 90, Icon: LedTv },
  { key: "videowall", label: "LED video wall", category: "Video", w: 480, h: 300, Icon: VideoWall },
];

export const LIBRARY_BY_KEY: Record<string, LibraryItem> = Object.fromEntries(
  LIBRARY_ITEMS.map((item) => [item.key, item]),
);

export function getLibraryItem(key: string): LibraryItem | undefined {
  return LIBRARY_BY_KEY[key];
}
