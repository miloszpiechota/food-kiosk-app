import { useMemo } from "react";
import {
  filterMenuProducts,
  getFeaturedMenuContent,
  getMenuCategories,
  getMenuProducts,
} from "../api/menuApi";
import type { CategoryId } from "../types/menu.types";

interface UseMenuOptions {
  activeCategory: CategoryId;
  searchTerm: string;
}

export function useMenu({ activeCategory, searchTerm }: UseMenuOptions) {
  const categories = getMenuCategories();

  const activeCategoryDetails =
    categories.find((category) => category.id === activeCategory) ??
    categories[0];

  const products = useMemo(
    () => filterMenuProducts(getMenuProducts(), activeCategory, searchTerm),
    [activeCategory, searchTerm],
  );

  return {
    activeCategoryDetails,
    categories,
    featuredContent: getFeaturedMenuContent(),
    products,
  };
}
