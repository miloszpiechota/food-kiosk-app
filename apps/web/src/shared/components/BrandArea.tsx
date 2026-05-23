import { UtensilsCrossed } from "lucide-react";

interface BrandAreaProps {
  className?: string;
  compact?: boolean;
}

export function BrandArea({ className = "", compact = false }: BrandAreaProps) {
  return (
    <div
      className={`flex w-fit items-center gap-4 rounded-3xl border border-border bg-card/80 p-4 shadow-2xl shadow-black/20 backdrop-blur-sm ${className}`}
      aria-label="Food Kiosk"
    >
      <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary">
        <UtensilsCrossed aria-hidden="true" className="size-8 text-white" />
      </div>
      <div className="text-left">
        <p className="text-2xl font-bold leading-tight text-foreground">
          Food Kiosk
        </p>
        {!compact && (
          <p className="text-base text-muted-foreground">Self-order station</p>
        )}
      </div>
    </div>
  );
}
