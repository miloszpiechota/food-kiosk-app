import { CircleHelp, Languages, ShoppingBag, UtensilsCrossed } from "lucide-react";
import type { OrderMode } from "../../app/router";
import { AccessibilityButton } from "../../features/accessibility/components/AccessibilityButton";
import { BrandArea } from "../../shared/components/BrandArea";
import { focusRing, IconButton } from "../../shared/components/IconButton";
import { KioskShell } from "../../shared/layout/KioskShell";

interface WelcomePageProps {
  onSelectOrderMode: (mode: OrderMode) => void;
}

export function WelcomePage({ onSelectOrderMode }: WelcomePageProps) {
  return (
    <KioskShell className="relative flex items-center justify-center px-6 py-10">
      <div className="pointer-events-none absolute -left-24 top-12 size-80 rounded-full bg-primary/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-20 bottom-10 size-96 rounded-full bg-secondary/20 blur-[120px]" />

      <BrandArea className="absolute left-6 top-6 sm:left-8 sm:top-8" />

      <div className="absolute right-6 top-6 flex gap-3 sm:right-8 sm:top-8">
        <IconButton label="Change language" variant="utility">
          <Languages aria-hidden="true" className="size-6" />
        </IconButton>
      </div>

      <div className="absolute bottom-6 left-6 flex gap-3 sm:bottom-8 sm:left-8">
        <AccessibilityButton />
        <IconButton label="Need help" variant="utility">
          <CircleHelp aria-hidden="true" className="size-6" />
        </IconButton>
      </div>

      <section
        aria-labelledby="welcome-heading"
        className="relative z-10 w-full max-w-3xl space-y-12 text-center"
      >
        <div className="space-y-5">
          <p className="mx-auto w-fit rounded-full border border-border bg-card/70 px-5 py-2 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Self-order kiosk
          </p>
          <h1
            id="welcome-heading"
            className="text-6xl font-bold leading-tight text-foreground sm:text-7xl"
          >
            Welcome
          </h1>
          <p className="mx-auto max-w-xl text-2xl font-medium text-muted-foreground">
            Choose how you would like to order
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <OrderModeButton
            accent="primary"
            icon={<UtensilsCrossed aria-hidden="true" className="size-12" />}
            label="Dine in"
            onClick={() => onSelectOrderMode("dine-in")}
          />
          <OrderModeButton
            accent="secondary"
            icon={<ShoppingBag aria-hidden="true" className="size-12" />}
            label="Take out"
            onClick={() => onSelectOrderMode("take-out")}
          />
        </div>
      </section>
    </KioskShell>
  );
}

interface OrderModeButtonProps {
  accent: "primary" | "secondary";
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function OrderModeButton({
  accent,
  icon,
  label,
  onClick,
}: OrderModeButtonProps) {
  const accentClass =
    accent === "primary"
      ? "text-primary focus-visible:ring-primary/40"
      : "text-secondary focus-visible:ring-secondary/40";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group min-h-52 rounded-3xl border-2 border-border bg-card/80 p-8 text-left shadow-2xl shadow-black/20 transition hover:-translate-y-1 hover:border-current active:translate-y-0 ${accentClass} ${focusRing}`}
    >
      <span className="flex h-full flex-col items-center justify-center gap-5 text-center">
        <span className="flex size-24 items-center justify-center rounded-full bg-current/15">
          {icon}
        </span>
        <span className="text-3xl font-semibold text-foreground">{label}</span>
      </span>
    </button>
  );
}
