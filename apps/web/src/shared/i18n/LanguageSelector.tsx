import { Check, Languages, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { focusRing } from "../components/IconButton";
import {
  languageOptions,
  type SupportedLocale,
  uiText,
} from "./locales";

interface LanguageSelectorProps {
  locale: SupportedLocale;
  onLocaleChange: (locale: SupportedLocale) => void;
}

export function LanguageSelector({
  locale,
  onLocaleChange,
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const headingId = useId();
  const text = uiText[locale].common;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const dialog = isOpen
    ? createPortal(
        <div
          className="fixed inset-0 z-[1000] grid place-items-center bg-background/75 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={headingId}
            className="flex max-h-[min(34rem,calc(100dvh-2rem))] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-border bg-card text-foreground shadow-2xl shadow-black/40"
          >
            <header className="flex items-center justify-between gap-4 border-b border-border p-5">
              <div>
                <h2 id={headingId} className="text-2xl font-black">
                  {text.changeLanguage}
                </h2>
                <p className="mt-1 text-sm font-semibold text-muted-foreground">
                  Select the language for this kiosk session.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setIsOpen(false)}
                className={`grid size-12 shrink-0 place-items-center rounded-2xl border border-border bg-background/60 text-foreground transition hover:border-primary/60 hover:text-primary active:scale-95 ${focusRing}`}
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </header>

            <div className="min-h-0 overflow-y-auto p-3">
              {languageOptions.map((option) => {
                const selected = option.locale === locale;
                return (
                  <button
                    key={option.locale}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      onLocaleChange(option.locale);
                      setIsOpen(false);
                    }}
                    className={`flex min-h-16 w-full items-center justify-between gap-4 rounded-2xl px-4 text-left text-lg font-black transition active:scale-[0.98] ${
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    } ${focusRing}`}
                  >
                    <span>{option.label}</span>
                    <span className="flex items-center gap-3 text-sm font-black opacity-90">
                      {option.shortLabel}
                      {selected && <Check aria-hidden="true" className="size-5" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={text.changeLanguage}
        onClick={() => setIsOpen((current) => !current)}
        className={`flex size-14 items-center justify-center rounded-2xl border border-red-400/70 bg-red-500/10 text-red-100 transition hover:border-red-300 hover:bg-red-500/15 hover:text-white active:scale-95 ${focusRing}`}
      >
        <Languages aria-hidden="true" className="size-5" />
      </button>
      {dialog}
    </>
  );
}
