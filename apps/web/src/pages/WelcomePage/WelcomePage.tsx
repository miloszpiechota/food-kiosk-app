import { useState, type FormEvent, type ReactNode } from "react";
import {
  CircleHelp,
  LockKeyhole,
  Shield,
  ShoppingBag,
  User,
  UtensilsCrossed,
  X,
} from "lucide-react";
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
  onAccessibilityOpen: () => void;
  onLocaleChange: (locale: SupportedLocale) => void;
  onSelectOrderMode: (mode: OrderMode) => void;
}

export function WelcomePage({
  locale,
  onAccessibilityOpen,
  onLocaleChange,
  onSelectOrderMode,
}: WelcomePageProps) {
  const text = uiText[locale];
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

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
        onClick={() => setIsAdminLoginOpen(true)}
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

      {isAdminLoginOpen ? (
        <AdminLoginOverlay onClose={() => setIsAdminLoginOpen(false)} />
      ) : null}
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

interface AdminLoginOverlayProps {
  onClose: () => void;
}

function AdminLoginOverlay({ onClose }: AdminLoginOverlayProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Admin login is frontend-only for now. Backend auth comes next.");
  }

  return (
    <div
      aria-labelledby="admin-login-heading"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 px-6 py-8 backdrop-blur-xl"
      role="dialog"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close admin login"
        className={`absolute right-6 top-6 inline-flex size-12 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-primary hover:text-primary sm:right-8 sm:top-8 ${focusRing}`}
      >
        <X aria-hidden="true" className="size-6" />
      </button>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-7 rounded-3xl border border-border bg-card/95 p-8 shadow-2xl shadow-black/30"
      >
        <div className="space-y-3 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Shield aria-hidden="true" className="size-8" />
          </div>
          <div className="space-y-2">
            <h2
              id="admin-login-heading"
              className="text-3xl font-bold text-foreground"
            >
              Admin panel
            </h2>
            <p className="text-base font-medium text-muted-foreground">
              Sign in to manage kiosk orders.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-muted-foreground">
              Email
            </span>
            <span className="flex min-h-14 items-center gap-3 rounded-2xl border border-border bg-background/70 px-4 text-foreground focus-within:border-primary">
              <User aria-hidden="true" className="size-5 text-muted-foreground" />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                autoComplete="username"
                className="min-w-0 flex-1 bg-transparent text-lg font-semibold outline-none placeholder:text-muted-foreground"
                placeholder="admin@example.com"
              />
            </span>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-muted-foreground">
              Password
            </span>
            <span className="flex min-h-14 items-center gap-3 rounded-2xl border border-border bg-background/70 px-4 text-foreground focus-within:border-primary">
              <LockKeyhole
                aria-hidden="true"
                className="size-5 text-muted-foreground"
              />
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete="current-password"
                className="min-w-0 flex-1 bg-transparent text-lg font-semibold outline-none placeholder:text-muted-foreground"
                placeholder="Password"
              />
            </span>
          </label>
        </div>

        {message ? (
          <p className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
            {message}
          </p>
        ) : null}

        <button
          type="submit"
          className={`min-h-14 w-full rounded-2xl bg-primary px-6 py-3 text-lg font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90 ${focusRing}`}
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
