export const supportedLocales = ["en", "pl", "es"] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

export interface LanguageOption {
  label: string;
  locale: SupportedLocale;
  shortLabel: string;
}

export const defaultLocale: SupportedLocale = "en";

export const languageOptions: LanguageOption[] = [
  { locale: "en", label: "English", shortLabel: "EN" },
  { locale: "pl", label: "Polski", shortLabel: "PL" },
  { locale: "es", label: "Espanol", shortLabel: "ES" },
];

export function isSupportedLocale(value: string): value is SupportedLocale {
  return supportedLocales.includes(value as SupportedLocale);
}

export const uiText = {
  en: {
    common: {
      accessibilityOptions: "Accessibility options",
      changeLanguage: "Change language",
      needHelp: "Need help",
    },
    accessibility: {
      eyebrow: "Accessibility",
      title: "Adjust kiosk display",
      description:
        "Choose stronger contrast or larger text for this ordering session.",
      close: "Close accessibility options",
      highContrast: {
        label: "High contrast",
        description:
          "Uses stronger color separation and clearer borders for better readability.",
      },
      largeText: {
        label: "Large text",
        description:
          "Increases text size and touch target spacing across the kiosk.",
      },
    },
    welcome: {
      eyebrow: "Self-order kiosk",
      heading: "Welcome",
      subtitle: "Choose how you would like to order",
    },
    orderMode: {
      dineIn: "Dine in",
      takeOut: "Take out",
      currentMode: (mode: string) => `Order mode. Current mode is ${mode}.`,
      selected: (mode: string) => `${mode} selected`,
      changeTo: (mode: string) => `Change order mode to ${mode}`,
    },
    header: {
      searchLabel: "Search menu products",
      searchPlaceholder: "Search menu...",
    },
    menu: {
      featuredCategory: "For You",
      loading: "Loading menu...",
      noActiveMenu: "No active menu is available.",
      loadError: "The menu could not be loaded.",
      featuredContent: {
        heroBanner: {
          title: "Fresh picks for today",
          description:
            "Start with customer favorites, current meals, and lighter options.",
        },
        buildMeal: {
          title: "Build your meal",
          description: "Choose each included item and customize supported options.",
        },
        makeLarge: {
          title: "Make it large",
          description: "Linked large meals use their own sides, drinks, and pricing.",
        },
        quickFilters: ["Plant Based", "Gluten Free", "Popular", "New", "No sugar"],
      },
    },
  },
  pl: {
    common: {
      accessibilityOptions: "Opcje dostepnosci",
      changeLanguage: "Zmien jezyk",
      needHelp: "Pomoc",
    },
    accessibility: {
      eyebrow: "Dostepnosc",
      title: "Dostosuj wyswietlanie kiosku",
      description:
        "Wybierz mocniejszy kontrast lub wiekszy tekst na czas tego zamowienia.",
      close: "Zamknij opcje dostepnosci",
      highContrast: {
        label: "Wysoki kontrast",
        description:
          "Uzywa mocniejszego rozdzielenia kolorow i wyrazniejszych obramowan.",
      },
      largeText: {
        label: "Duzy tekst",
        description:
          "Zwieksza rozmiar tekstu i odstepy dla elementow dotykowych w kiosku.",
      },
    },
    welcome: {
      eyebrow: "Kiosk samoobslugowy",
      heading: "Witaj",
      subtitle: "Wybierz sposob zamowienia",
    },
    orderMode: {
      dineIn: "Na miejscu",
      takeOut: "Na wynos",
      currentMode: (mode: string) => `Tryb zamowienia. Aktualny tryb: ${mode}.`,
      selected: (mode: string) => `Wybrano: ${mode}`,
      changeTo: (mode: string) => `Zmien tryb zamowienia na ${mode}`,
    },
    header: {
      searchLabel: "Szukaj produktow w menu",
      searchPlaceholder: "Szukaj w menu...",
    },
    menu: {
      featuredCategory: "Dla Ciebie",
      loading: "Ladowanie menu...",
      noActiveMenu: "Brak aktywnego menu.",
      loadError: "Nie udalo sie zaladowac menu.",
      featuredContent: {
        heroBanner: {
          title: "Dzisiejsze propozycje",
          description: "Zacznij od ulubionych produktow, aktualnych zestawow i lzejszych opcji.",
        },
        buildMeal: {
          title: "Zbuduj zestaw",
          description: "Wybierz elementy zestawu i dostosuj dostepne opcje.",
        },
        makeLarge: {
          title: "Powieksz zestaw",
          description: "Wieksze zestawy maja wlasne dodatki, napoje i ceny.",
        },
        quickFilters: ["Roslinne", "Bez glutenu", "Popularne", "Nowosc", "Bez cukru"],
      },
    },
  },
  es: {
    common: {
      accessibilityOptions: "Opciones de accesibilidad",
      changeLanguage: "Cambiar idioma",
      needHelp: "Ayuda",
    },
    accessibility: {
      eyebrow: "Accesibilidad",
      title: "Ajustar pantalla del quiosco",
      description:
        "Elige mas contraste o texto mas grande para esta sesion de pedido.",
      close: "Cerrar opciones de accesibilidad",
      highContrast: {
        label: "Alto contraste",
        description:
          "Usa mayor separacion de colores y bordes mas claros para leer mejor.",
      },
      largeText: {
        label: "Texto grande",
        description:
          "Aumenta el tamano del texto y el espacio de los controles tactiles.",
      },
    },
    welcome: {
      eyebrow: "Quiosco de autoservicio",
      heading: "Bienvenido",
      subtitle: "Elige como quieres pedir",
    },
    orderMode: {
      dineIn: "Comer aqui",
      takeOut: "Para llevar",
      currentMode: (mode: string) => `Modo de pedido. Modo actual: ${mode}.`,
      selected: (mode: string) => `${mode} seleccionado`,
      changeTo: (mode: string) => `Cambiar modo de pedido a ${mode}`,
    },
    header: {
      searchLabel: "Buscar productos del menu",
      searchPlaceholder: "Buscar en el menu...",
    },
    menu: {
      featuredCategory: "Para ti",
      loading: "Cargando menu...",
      noActiveMenu: "No hay ningun menu activo disponible.",
      loadError: "No se pudo cargar el menu.",
      featuredContent: {
        heroBanner: {
          title: "Sugerencias para hoy",
          description:
            "Empieza con favoritos, menus actuales y opciones mas ligeras.",
        },
        buildMeal: {
          title: "Crea tu menu",
          description:
            "Elige cada elemento incluido y personaliza las opciones disponibles.",
        },
        makeLarge: {
          title: "Hazlo grande",
          description:
            "Los menus grandes usan sus propios acompanamientos, bebidas y precios.",
        },
        quickFilters: ["Vegetal", "Sin gluten", "Popular", "Nuevo", "Sin azucar"],
      },
    },
  },
} as const;
