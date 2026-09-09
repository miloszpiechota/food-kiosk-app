import { type ReactNode } from "react";
import { CircleHelp, Shield, ShoppingBag, UtensilsCrossed } from "lucide-react";
import type { OrderMode } from "../../app/router";
import { AccessibilityButton } from "../../features/accessibility/components/AccessibilityButton";
import { BrandArea } from "../../shared/components/BrandArea";
import { focusRing, IconButton } from "../../shared/components/IconButton";
import { LanguageSelector } from "../../shared/i18n/LanguageSelector";
import type { SupportedLocale } from "../../shared/i18n/locales";
import { uiText } from "../../shared/i18n/locales";
import { KioskShell } from "../../shared/layout/KioskShell";

interface WelcomePageProps {
  locale: SupportedLocale;
  onAdminPanelOpen: () => void;
  onAccessibilityOpen: () => void;
  onLocaleChange: (locale: SupportedLocale) => void;
  onSelectOrderMode: (mode: OrderMode) => void;
}

export function WelcomePage({
  locale,
  onAdminPanelOpen,
  onAccessibilityOpen,
  onLocaleChange,
  onSelectOrderMode,
}: WelcomePageProps) {
  const text = uiText[locale];

  return (
    <KioskShell className="relative flex items-center justify-center px-6 py-10">
      <div className="pointer-events-none absolute -left-24 top-12 size-80 rounded-full bg-primary/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-20 bottom-10 size-96 rounded-full bg-secondary/20 blur-[120px]" />

      <BrandArea className="absolute left-6 top-6 sm:left-8 sm:top-8" />

      <div className="absolute right-6 top-6 flex gap-3 sm:right-8 sm:top-8">
        <LanguageSelector locale={locale} onLocaleChange={onLocaleChange} />
      </div>

      <div className="absolute bottom-6 left-6 flex gap-3 sm:bottom-8 sm:left-8">
        <AccessibilityButton
          label={text.common.accessibilityOptions}
          onClick={onAccessibilityOpen}
        />
        <IconButton label={text.common.needHelp} variant="utility">
          <CircleHelp aria-hidden="true" className="size-6" />
        </IconButton>
      </div>

      <button
        type="button"
        onClick={onAdminPanelOpen}
        aria-label="Go to admin panel"
        className={`absolute bottom-6 right-6 z-20 inline-flex min-h-14 items-center gap-3 rounded-2xl border border-border bg-card/85 px-5 py-3 text-base font-semibold text-foreground shadow-xl shadow-black/20 transition hover:border-primary hover:text-primary sm:bottom-8 sm:right-8 ${focusRing}`}
      >
        <Shield aria-hidden="true" className="size-5" />
        <span className="hidden sm:inline">Go to admin panel</span>
      </button>

      <section
        aria-labelledby="welcome-heading"
        className="relative z-10 w-full max-w-3xl space-y-12 text-center"
      >
        <div className="space-y-5">
          <p className="mx-auto w-fit rounded-full border border-border bg-card/70 px-5 py-2 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {text.welcome.eyebrow}
          </p>
          <h1
            id="welcome-heading"
            className="text-6xl font-bold leading-tight text-foreground sm:text-7xl"
          >
            {text.welcome.heading}
          </h1>
          <p className="mx-auto max-w-xl text-2xl font-medium text-muted-foreground">
            {text.welcome.subtitle}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <OrderModeButton
            accent="primary"
            icon={<UtensilsCrossed aria-hidden="true" className="size-12" />}
            label={text.orderMode.dineIn}
            onClick={() => onSelectOrderMode("dine-in")}
          />
          <OrderModeButton
            accent="secondary"
            icon={<ShoppingBag aria-hidden="true" className="size-12" />}
            label={text.orderMode.takeOut}
            onClick={() => onSelectOrderMode("take-out")}
          />
        </div>
      </section>
    </KioskShell>
  );
}

interface OrderModeButtonProps {
  accent: "primary" | "secondary";
  icon: ReactNode;
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
