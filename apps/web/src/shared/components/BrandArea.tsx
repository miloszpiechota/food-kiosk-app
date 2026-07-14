import { UtensilsCrossed } from "lucide-react";
import { focusRing } from "./IconButton";

interface BrandAreaProps {
  className?: string;
  compact?: boolean;
  onClick?: () => void;
}

export function BrandArea({
  className = "",
  compact = false,
  onClick,
}: BrandAreaProps) {
  const classNames = `brand-area flex w-fit items-center gap-4 rounded-3xl border border-border bg-card/80 p-4 text-left shadow-2xl shadow-black/20 backdrop-blur-sm ${
    onClick
      ? "transition hover:border-primary/60 hover:text-primary active:scale-95"
      : ""
  } ${onClick ? focusRing : ""} ${className}`;
  const content = (
    <>
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
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={classNames}
        aria-label="Back to welcome screen"
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={classNames} aria-label="Food Kiosk">
      {content}
    </div>
  );
}
