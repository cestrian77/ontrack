import * as htmlToImage from "html-to-image";

function basename(): string {
  return `ontrack-dashboard-${new Date().toISOString().slice(0, 10)}`;
}

/** Rasterise a DOM subtree as a PNG data URL (for download or native share). */
export async function captureDashboardPng(node: HTMLElement): Promise<string> {
  return htmlToImage.toPng(node, {
    cacheBust: true,
    pixelRatio: Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 2 : 2),
  });
}

/** Save snapshot as a file download (PWA / web). Native iOS uses SwiftUI `ImageRenderer` + share sheet. */
export async function saveDashboardSnapshot(dataUrl: string): Promise<void> {
  const base = basename();
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `${base}.png`;
  a.click();
}
