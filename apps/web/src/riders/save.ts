import { useEditorStore } from "../editor/store";
import { ridersApi } from "./api";
import { renderThumbnail } from "./thumbnail";

let inFlight: Promise<void> | null = null;
let queued = false;

/**
 * Persist the bound rider. Saves are serialised: calling this while one is in
 * flight queues exactly one more pass, so the last edit always reaches the API
 * without piling up requests.
 */
export async function saveRiderNow(): Promise<void> {
  const { riderId } = useEditorStore.getState();
  if (!riderId) return;

  if (inFlight) {
    queued = true;
    return inFlight;
  }

  const run = (async () => {
    const { doc } = useEditorStore.getState();
    useEditorStore.getState().setSaveState("saving");
    try {
      const thumbnail = await renderThumbnail(doc);
      await ridersApi.update(riderId, { doc, thumbnail: thumbnail ?? undefined });
      useEditorStore.getState().setSaveState("saved");
    } catch {
      useEditorStore.getState().setSaveState("error");
    }
  })();

  inFlight = run;
  await run;
  inFlight = null;

  if (queued) {
    queued = false;
    await saveRiderNow();
  }
}

/** Promote the local draft to a new cloud rider and keep editing it. */
export async function saveToCloud(): Promise<void> {
  const { doc } = useEditorStore.getState();
  const thumbnail = await renderThumbnail(doc);
  const { rider } = await ridersApi.create(doc, thumbnail ?? undefined);

  const store = useEditorStore.getState();
  store.setRiderId(rider.id);
  store.setSaveState("saved");
  window.history.replaceState({}, "", `/r/${rider.id}`);
}
