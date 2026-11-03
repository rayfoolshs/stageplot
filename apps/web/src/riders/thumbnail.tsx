import type { StageDoc } from "@stageplot/shared";

/**
 * A small standalone SVG of the plot, as a data URL. Reuses the print artwork,
 * so list thumbnails always match what will be exported.
 *
 * Both the React server renderer and the print sheet are dynamically imported:
 * they are only needed when a rider is saved, not to boot the editor.
 */
export async function renderThumbnail(doc: StageDoc): Promise<string | null> {
  try {
    const [{ renderToStaticMarkup }, { StageSvg }] = await Promise.all([
      import("react-dom/server"),
      import("../print/PrintSheet"),
    ]);
    const markup = renderToStaticMarkup(<StageSvg doc={doc} />);
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  } catch {
    return null;
  }
}
