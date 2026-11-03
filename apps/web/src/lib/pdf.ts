import type { StageDoc } from "@stageplot/shared";

/**
 * Ask the API to render the rider and download it. Returns false when the
 * renderer isn't available, so callers can fall back to the browser's print
 * dialog instead.
 */
export async function downloadPdf(doc: StageDoc): Promise<boolean> {
  try {
    const response = await fetch("/api/render/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doc }),
    });
    if (!response.ok) return false;
    // A static host may answer a missing /api route with an HTML fallback;
    // don't save that as a .pdf.
    if (!(response.headers.get("content-type") ?? "").includes("application/pdf")) {
      return false;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(doc.meta.name || "stageplot").replace(/[^\w.-]+/g, "-")}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}
