import { describe, expect, it } from "vitest";
import {
  filterMenuProducts,
  getFeaturedMenuContent,
  getMenuCategories,
  getMenuProducts,
} from "./menuApi";

describe("menu api helpers", () => {
  it("prepends a frontend-owned featured category", () => {
    const categories = getMenuCategories();

    expect(categories[0]).toMatchObject({
      id: "featured",
      label: "For You",
    });
  });

  it("provides featured menu landing content", () => {
    const content = getFeaturedMenuContent();

    expect(content.secondaryBanners).toHaveLength(2);
    expect(content.quickFilters).toContain("Plant Based");
    expect(content.newProducts).toHaveLength(3);
    expect(content.recommendedProducts).toHaveLength(3);
  });

  it("shows new and popular products for the featured category search surface", () => {
    const products = filterMenuProducts(getMenuProducts(), "featured", "");

    expect(products.length).toBeGreaterThan(0);
    expect(
      products.every(
        (product) => product.label === "Popular" || product.label === "New",
      ),
    ).toBe(true);
  });

  it("shows popular products for the popular category", () => {
    const products = filterMenuProducts(getMenuProducts(), "popular", "");

    expect(products.length).toBeGreaterThan(0);
    expect(products.every((product) => product.label === "Popular")).toBe(true);
  });

  it("filters products by active category and search term", () => {
    const products = filterMenuProducts(getMenuProducts(), "coffee", "espresso");

    expect(products.map((product) => product.name)).toEqual([
      "Cappuccino",
      "Latte",
    ]);
  });
});
