import { Languages, Search } from "lucide-react";
import type { OrderMode } from "../../app/router";
import { BrandArea } from "../components/BrandArea";
import { focusRing, IconButton } from "../components/IconButton";

interface HeaderProps {
  orderMode: OrderMode;
  searchTerm: string;
  onOrderModeToggle: () => void;
  onSearchChange: (value: string) => void;
}

export function Header({
  orderMode,
  searchTerm,
  onOrderModeToggle,
  onSearchChange,
}: HeaderProps) {
  const orderModeLabel = orderMode === "dine-in" ? "Dine in" : "Take out";
  const orderModes: Array<{ value: OrderMode; label: string }> = [
    { value: "dine-in", label: "Dine in" },
    { value: "take-out", label: "Take out" },
  ];

  function handleOrderModeSelection(selectedMode: OrderMode) {
    if (selectedMode !== orderMode) {
      onOrderModeToggle();
    }
  }

  return (
    <header className="grid gap-4 border-b border-border bg-card/80 px-4 py-4 backdrop-blur-sm sm:px-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">
      <div className="flex min-w-0 items-center gap-4">
        <BrandArea className="p-0 shadow-none" compact />
        <div
          className="flex min-w-0 items-center rounded-3xl border border-border bg-card/80 p-1.5 shadow-2xl shadow-black/10"
          role="group"
          aria-label={`Order mode. Current mode is ${orderModeLabel}.`}
        >
          {orderModes.map((mode) => {
            const isSelected = mode.value === orderMode;
            const selectedClasses =
              mode.value === "dine-in"
                ? "border-primary/60 bg-primary text-background shadow-lg shadow-primary/20"
                : "border-secondary/70 bg-secondary text-background shadow-lg shadow-secondary/20";

            return (
              <button
                key={mode.value}
                type="button"
                onClick={() => handleOrderModeSelection(mode.value)}
                aria-pressed={isSelected}
                aria-label={
                  isSelected
                    ? `${mode.label} selected`
                    : `Change order mode to ${mode.label}`
                }
                className={`min-h-12 min-w-28 rounded-2xl border px-5 text-base font-black transition active:scale-95 ${
                  isSelected
                    ? selectedClasses
                    : "border-transparent bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                } ${focusRing}`}
              >
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>

      <label className="relative block min-w-0 lg:mx-auto lg:w-full lg:max-w-2xl">
        <span className="sr-only">Search menu products</span>
        <Search
          aria-hidden="true"
          className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search menu..."
          className={`h-14 w-full rounded-2xl border border-border bg-input-background pl-12 pr-4 text-lg text-foreground outline-none placeholder:text-muted-foreground ${focusRing}`}
        />
      </label>

      <div className="flex gap-3 justify-self-end">
        <IconButton label="Change language" variant="utility">
          <Languages aria-hidden="true" className="size-6" />
        </IconButton>
      </div>
    </header>
  );
}
