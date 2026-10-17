import { exportAll, importAll, MAX_IMPORT_BYTES } from "@/db/repository";

/** User-facing name; files remain JSON for portability (see repo docs). */
export const DATA_PACK_DISPLAY_NAME = "OnTrack data pack";

export const DATA_PACK_IMPORT_CONFIRM =
  "Import will replace all local data on this device (profile, scenarios, insights). Continue?";

export function dataPackDownloadFilename(
  isoDate = new Date().toISOString().slice(0, 10),
): string {
  return `ontrack-data-pack-${isoDate}.json`;
}

export async function downloadDataPack(): Promise<void> {
  const json = await exportAll();
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = dataPackDownloadFilename();
  a.click();
  URL.revokeObjectURL(url);
}

export async function importDataPackFile(file: File): Promise<void> {
  if (file.size > MAX_IMPORT_BYTES) {
    throw new Error(`File is too large (max ${MAX_IMPORT_BYTES / (1024 * 1024)} MB).`);
  }
  const text = await file.text();
  await importAll(text);
}
