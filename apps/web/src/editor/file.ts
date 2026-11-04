import { parseStageDoc, type StageDoc } from "@stageplot/shared";

/** A wrapper so a bare `.json` is self-describing and version-checkable. */
export type RiderFile = {
  format: "stageplot.rider";
  version: number;
  exportedAt: string;
  doc: StageDoc;
};

const FORMAT = "stageplot.rider";

function safeFileName(name: string): string {
  const cleaned = (name || "rider")
    .replace(/[^\w\-. ]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return cleaned || "rider";
}

/** Download the document as a `.json` file the user can keep or email. */
export function downloadRiderFile(doc: StageDoc): void {
  const payload: RiderFile = {
    format: FORMAT,
    version: doc.version,
    exportedAt: new Date().toISOString(),
    doc,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeFileName(doc.meta.name)}.stageplot.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Read a rider from a user-selected file. Accepts both the wrapped format and a
 * bare StageDoc, and validates it before it can replace the open document.
 */
export async function readRiderFile(file: File): Promise<StageDoc> {
  const text = await file.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("That file isn’t valid JSON.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("That file doesn’t contain a rider.");
  }

  const wrapped = parsed as Partial<RiderFile>;
  const candidate = wrapped.format === FORMAT && wrapped.doc ? wrapped.doc : parsed;

  try {
    return parseStageDoc(candidate);
  } catch {
    throw new Error("That file doesn’t look like a StagePlot rider.");
  }
}
