import { useEffect, useMemo, useState } from "react";
import { filterMenuProducts, getCatalog } from "../api/menuApi";
import type {
  CategoryId,
  FeaturedMenuContent,
  MenuCategory,
  Product,
} from "../types/menu.types";
import type { SupportedLocale } from "../../../shared/i18n/locales";
import { uiText } from "../../../shared/i18n/locales";

interface UseMenuOptions {
  activeCategory: CategoryId;
  locale: SupportedLocale;
  searchTerm: string;
}

interface CatalogState {
  categories: MenuCategory[];
  featuredContent: FeaturedMenuContent | null;
  products: Product[];
}

export function useMenu({ activeCategory, locale, searchTerm }: UseMenuOptions) {
  const [catalog, setCatalog] = useState<CatalogState>({
    categories: [],
    featuredContent: null,
    products: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void getCatalog(locale)
      .then((result) => {
        if (!cancelled) {
          setCatalog(result);
          setError(null);
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(
            reason instanceof Error
              ? reason.message
              : uiText[locale].menu.loadError,
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [locale]);

  const activeCategoryDetails =
    catalog.categories.find((category) => category.id === activeCategory) ??
    catalog.categories[0] ?? {
      id: "featured",
      code: "featured",
      label: uiText[locale].menu.featuredCategory,
      icon: "sparkles" as const,
    };

  const products = useMemo(
    () =>
      filterMenuProducts(catalog.products, activeCategory, searchTerm),
    [activeCategory, catalog.products, searchTerm],
  );

  return {
    activeCategoryDetails,
    categories: catalog.categories,
    error,
    featuredContent: catalog.featuredContent,
    isLoading,
    products,
  };
}
