import { BarChart3 } from "lucide-react";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <div
      className={
        className ??
        "grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-asset-pension to-asset-property shadow-sm"
      }
    >
      <BarChart3 className="h-4 w-4 text-white" strokeWidth={2.5} />
    </div>
  );
}
