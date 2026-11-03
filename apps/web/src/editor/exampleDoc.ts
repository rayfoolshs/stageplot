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

  return doc;
}
