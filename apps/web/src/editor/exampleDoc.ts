import {
  createEmptyDoc,
  type ChannelRow,
  type StageDoc,
  type StageItem,
} from "@stageplot/shared";
import { getLibraryItem } from "./library";

/**
 * A ready-made example stage plan shown to anyone who opens the editor without
 * an existing draft (and when they press "New"). It is a small 5-piece band so
 * the plot, the monitor/output list and the mixing-desk input list all make
 * sense together.
 */

let seq = 0;
const id = (prefix: string) => `${prefix}_ex${(seq += 1)}`;

function itemAt(key: string, cx: number, cy: number, label?: string): StageItem {
  const lib = getLibraryItem(key);
  const w = lib?.w ?? 100;
  const h = lib?.h ?? 100;
  return {
    id: id("it"),
    itemKey: key,
    x: cx - w / 2,
    y: cy - h / 2,
    w,
    h,
    rotation: 0,
    flipX: false,
    flipY: false,
    label: label ?? lib?.label,
  };
}

function channel(number: number, patch: Partial<ChannelRow>): ChannelRow {
  return {
    id: id("ch"),
    number,
    source: "",
    person: "",
    mic: "",
    inputType: "",
    stand: "",
    phantom: "",
    monitor: "",
    dca: "",
    notes: "",
    ...patch,
  };
}

/**
 * A light top-down venue plan. Used as the example's background layer so new
 * users can see what the feature does (and trace over something realistic).
 */
const VENUE_PLAN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" font-family="sans-serif">
  <rect width="1000" height="700" fill="#f8fafc"/>
  <g stroke="#e2e8f0" stroke-width="1">
    <path d="M100 0V700 M200 0V700 M300 0V700 M400 0V700 M500 0V700 M600 0V700 M700 0V700 M800 0V700 M900 0V700"/>
    <path d="M0 100H1000 M0 200H1000 M0 300H1000 M0 400H1000 M0 500H1000 M0 600H1000"/>
  </g>
  <rect x="18" y="18" width="964" height="664" rx="12" fill="none" stroke="#cbd5e1" stroke-width="3"/>
  <rect x="60" y="40" width="880" height="580" rx="8" fill="#eef2f7" stroke="#cbd5e1" stroke-width="2"/>
  <text x="500" y="86" text-anchor="middle" font-size="30" letter-spacing="8" fill="#94a3b8">STAGE</text>
  <line x1="500" y1="40" x2="500" y2="620" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="10 8"/>
  <rect x="60" y="632" width="880" height="44" rx="6" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="2"/>
  <text x="300" y="661" text-anchor="middle" font-size="22" letter-spacing="6" fill="#94a3b8">AUDIENCE</text>
  <text x="720" y="661" text-anchor="middle" font-size="20" letter-spacing="4" fill="#94a3b8">FOH</text>
  <text x="74" y="661" font-size="14" fill="#94a3b8">LOAD-IN</text>
  <text x="926" y="661" text-anchor="end" font-size="14" fill="#94a3b8">POWER</text>
</svg>`;

export function createExampleDoc(): StageDoc {
  const doc = createEmptyDoc("Example stage plan — 5-piece band");
  doc.meta.orientation = "landscape";

  // --- monitor outputs (these back the wedge items on the plot) ------------
  const mon1 = channel(1, { source: "Monitor 1", notes: "Stage monitor — drummer" });
  const mon2 = channel(2, { source: "Monitor 2", notes: "Stage monitor — stage right" });
  const mon3 = channel(3, { source: "Monitor 3", notes: "Stage monitor — centre" });
  doc.outputs = [mon1, mon2, mon3];

  // --- stage plot (z-order: backdrop behind, then backline, then fronts) ---
  doc.items = [
    itemAt("backdrop", 500, 70),
    itemAt("drumset", 500, 235),
    itemAt("bassamp", 150, 210),
    itemAt("amp", 855, 200),
    itemAt("keyboard", 815, 470),
    itemAt("tripodmic", 505, 350, "Lead Vocal"),
    // monitor items, linked to their desk rows so renaming stays in sync
    { ...itemAt("monitor", 230, 560, "Monitor 1"), outputId: mon1.id },
    { ...itemAt("monitor", 770, 560, "Monitor 2"), outputId: mon2.id },
    { ...itemAt("monitor", 505, 545, "Monitor 3"), outputId: mon3.id },
  ];

  // --- mixing-desk input list ---------------------------------------------
  doc.channels = [
    channel(1, { source: "Kick", mic: "Beta 91", inputType: "Mic", monitor: "Monitor 1", dca: "Drums" }),
    channel(2, { source: "Snare", mic: "SM57", inputType: "Mic", monitor: "Monitor 1", dca: "Drums" }),
    channel(3, { source: "Hi-hat", mic: "KM184", inputType: "Mic", monitor: "Monitor 1", dca: "Drums" }),
    channel(4, { source: "Bass", mic: "DI", inputType: "DI", monitor: "Monitor 2", dca: "Rhythm" }),
    channel(5, { source: "Guitar", mic: "SM57", inputType: "Mic", monitor: "Monitor 2", dca: "Rhythm" }),
    channel(6, { source: "Keys L", mic: "DI", inputType: "DI", monitor: "Monitor 3", dca: "Keys" }),
    channel(7, { source: "Keys R", mic: "DI", inputType: "DI", monitor: "Monitor 3", dca: "Keys" }),
    channel(8, { source: "Lead Vocal", mic: "SM58", inputType: "Mic", monitor: "Monitor 3", dca: "Vocals" }),
  ];

  doc.footer.text =
    "Example rider — edit freely. Monitors: 3 wedges. Please provide 8 mic stands " +
    "and 2 DI boxes. Soundcheck 16:00.";

  // Placeholder background: a venue plan under the gear (fade it with the
  // Opacity slider in the inspector).
  doc.stage.background = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(VENUE_PLAN_SVG)}`;
  doc.stage.backgroundOpacity = 0.45;

  return doc;
}
