import { useEffect, useMemo, useState } from "react";
import { filterMenuProducts, getCatalog } from "../api/menuApi";
import type {
  CategoryId,
  FeaturedMenuContent,
  MenuCategory,
  Product,
} from "../types/menu.types";

interface UseMenuOptions {
  activeCategory: CategoryId;
  searchTerm: string;
}

interface CatalogState {
  categories: MenuCategory[];
  featuredContent: FeaturedMenuContent | null;
  products: Product[];
}

export function useMenu({ activeCategory, searchTerm }: UseMenuOptions) {
  const [catalog, setCatalog] = useState<CatalogState>({
    categories: [],
    featuredContent: null,
    products: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void getCatalog()
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
              : "The menu could not be loaded.",
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
  }, []);

  const activeCategoryDetails =
    catalog.categories.find((category) => category.id === activeCategory) ??
    catalog.categories[0] ?? {
      id: "featured",
      code: "featured",
      label: "For You",
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
