import type { ReactNode } from "react";

interface BottomActionBarProps {
  children: ReactNode;
}

export function BottomActionBar({ children }: BottomActionBarProps) {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 px-4 py-10 backdrop-blur-lg">
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {children}
      </div>
    </footer>
  );
}
