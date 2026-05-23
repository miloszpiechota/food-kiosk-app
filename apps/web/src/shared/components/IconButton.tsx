import type { ReactNode } from "react";

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40";

interface IconButtonProps {
  children: ReactNode;
  className?: string;
  label: string;
  variant?: "default" | "utility";
}

export function IconButton({
  children,
  className = "",
  label,
  variant = "default",
}: IconButtonProps) {
  const variantClass =
    variant === "utility"
      ? "border-red-400/70 bg-red-500/10 text-red-100 hover:border-red-300 hover:bg-red-500/15 hover:text-white focus-visible:ring-red-400/40"
      : "border-border bg-card/80 text-muted-foreground hover:border-primary/60 hover:text-foreground";

  return (
    <button
      type="button"
      aria-label={label}
      className={`flex size-14 items-center justify-center rounded-2xl border transition active:scale-95 ${variantClass} ${focusRing} ${className}`}
    >
      {children}
    </button>
  );
}
