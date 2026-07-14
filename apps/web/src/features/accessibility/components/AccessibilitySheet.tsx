import { ALargeSmall, Contrast, X } from "lucide-react";
import { useEffect, useId } from "react";
import { focusRing } from "../../../shared/components/IconButton";
import type { SupportedLocale } from "../../../shared/i18n/locales";
import { uiText } from "../../../shared/i18n/locales";
import type { AccessibilitySettings } from "../accessibility.types";

interface AccessibilitySheetProps {
  isOpen: boolean;
  locale: SupportedLocale;
  settings: AccessibilitySettings;
  onClose: () => void;
  onSettingsChange: (settings: AccessibilitySettings) => void;
}

export function AccessibilitySheet({
  isOpen,
  locale,
  onClose,
  onSettingsChange,
  settings,
}: AccessibilitySheetProps) {
  const headingId = useId();
  const text = uiText[locale].accessibility;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  function updateSetting(key: keyof AccessibilitySettings, value: boolean) {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-background/75 p-3 backdrop-blur-sm sm:p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="mx-auto flex max-h-[min(32rem,calc(100dvh-1.5rem))] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-border bg-card text-foreground shadow-2xl shadow-black/40 sm:rounded-3xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.14em] text-primary">
              {text.eyebrow}
            </p>
            <h2 id={headingId} className="mt-1 text-3xl font-black">
              {text.title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-muted-foreground">
              {text.description}
            </p>
          </div>
          <button
            type="button"
            aria-label={text.close}
            onClick={onClose}
            className={`grid size-12 shrink-0 place-items-center rounded-2xl border border-border bg-background/60 text-foreground transition hover:border-primary/60 hover:text-primary active:scale-95 ${focusRing}`}
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </header>

        <div className="min-h-0 space-y-3 overflow-y-auto p-4">
          <SettingSwitch
            checked={settings.highContrast}
            description={text.highContrast.description}
            icon={Contrast}
            label={text.highContrast.label}
            onChange={(checked) => updateSetting("highContrast", checked)}
          />
          <SettingSwitch
            checked={settings.largeText}
            description={text.largeText.description}
            icon={ALargeSmall}
            label={text.largeText.label}
            onChange={(checked) => updateSetting("largeText", checked)}
          />
        </div>
      </section>
    </div>
  );
}

interface SettingSwitchProps {
  checked: boolean;
  description: string;
  icon: typeof Contrast;
  label: string;
  onChange: (checked: boolean) => void;
}

function SettingSwitch({
  checked,
  description,
  icon: Icon,
  label,
  onChange,
}: SettingSwitchProps) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className={`flex min-h-24 w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition active:scale-[0.99] ${
        checked
          ? "border-primary bg-primary/15 text-foreground"
          : "border-border bg-background/60 text-foreground hover:border-primary/50"
      } ${focusRing}`}
    >
      <span
        className={`grid size-14 shrink-0 place-items-center rounded-2xl ${
          checked ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
        }`}
      >
        <Icon aria-hidden="true" className="size-7" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xl font-black">{label}</span>
        <span className="mt-1 block text-sm font-semibold leading-6 text-muted-foreground">
          {description}
        </span>
      </span>
      <span
        aria-hidden="true"
        className={`flex h-8 w-14 shrink-0 items-center rounded-full border p-1 transition ${
          checked
            ? "justify-end border-primary bg-primary"
            : "justify-start border-border bg-muted"
        }`}
      >
        <span className="size-5 rounded-full bg-white shadow" />
      </span>
    </button>
  );
}
