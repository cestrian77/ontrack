import { useRef } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DATA_PACK_DISPLAY_NAME,
  DATA_PACK_IMPORT_CONFIRM,
  downloadDataPack,
  importDataPackFile,
} from "@/lib/dataPack";
import { MAX_IMPORT_BYTES } from "@/db/repository";

type DataPackControlsProps = {
  size?: "default" | "sm" | "lg";
  variant?: "default" | "outline";
  onImported?: () => void;
};

export function DataPackControls({
  size = "default",
  variant = "outline",
  onImported,
}: DataPackControlsProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const onImport = async (file: File) => {
    if (file.size > MAX_IMPORT_BYTES) {
      alert(`File is too large (max ${MAX_IMPORT_BYTES / (1024 * 1024)} MB).`);
      return;
    }
    if (!confirm(DATA_PACK_IMPORT_CONFIRM)) return;
    try {
      await importDataPackFile(file);
      if (onImported) onImported();
      else location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Import failed.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <>
      <Button
        type="button"
        size={size}
        variant={variant}
        onClick={() => void downloadDataPack()}
      >
        <Download className="h-4 w-4" />
        Download {DATA_PACK_DISPLAY_NAME}
      </Button>
      <input
        type="file"
        accept="application/json,.json"
        ref={fileRef}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onImport(f);
        }}
      />
      <Button type="button" size={size} variant={variant} onClick={() => fileRef.current?.click()}>
        <Upload className="h-4 w-4" />
        Restore {DATA_PACK_DISPLAY_NAME}
      </Button>
    </>
  );
}
