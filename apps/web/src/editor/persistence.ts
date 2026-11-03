import { parseStageDoc, type StageDoc } from "@stageplot/shared";
import { createExampleDoc } from "./exampleDoc";

const STORAGE_KEY = "stageplot:draft:v1";

export function loadDraft(): StageDoc | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parseStageDoc(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveDraft(doc: StageDoc): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
  } catch {
    // storage full / unavailable — non-fatal for the draft.
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function initialDoc(): StageDoc {
  // No saved draft yet: open the example layout so the editor isn't empty.
  return loadDraft() ?? createExampleDoc();
}
