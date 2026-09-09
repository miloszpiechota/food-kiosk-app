import type { ReactNode } from "react";

interface KioskShellProps {
  children: ReactNode;
  className?: string;
}

export function KioskShell({ children, className = "" }: KioskShellProps) {
  return (
    <div
      className={`kiosk-shell min-h-dvh overflow-hidden bg-background text-foreground ${className}`}
    >
      {children}
    </div>
  );
}
