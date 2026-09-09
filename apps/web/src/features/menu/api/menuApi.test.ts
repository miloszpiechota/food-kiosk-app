import { afterEach, describe, expect, it, vi } from "vitest";
import type { Product } from "../types/menu.types";
import { filterMenuProducts, getCatalog } from "./menuApi";

const products: Product[] = [
  {
    id: "menu-product-1",
    menuProductId: "menu-product-1",
    productId: "product-1",
    type: "MEAL",
    name: "Burger Meal",
    description: "Burger, side, and drink",
    priceCents: 2000,
    category: "category-meals",
    image: "image",
    label: "Popular",
    hasCustomizations: true,
  },
  {
    id: "menu-product-2",
    menuProductId: "menu-product-2",
    productId: "product-2",
    type: "ITEM",
    name: "Cola",
    description: "Cold drink",
    priceCents: 500,
    category: "category-drinks",
    image: "image",
    label: null,
    hasCustomizations: false,
  },
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("menu API", () => {
  it("filters backend products by category and search term", () => {
    expect(
      filterMenuProducts(products, "category-drinks", "cold").map(
        (product) => product.name,
      ),
    ).toEqual(["Cola"]);
  });

  it("includes meals and highlighted products on the featured surface", () => {
    expect(
      filterMenuProducts(products, "featured", "").map(
        (product) => product.name,
      ),
    ).toEqual(["Burger Meal"]);
  });

  it("loads active menu, categories, and category products", async () => {
    const responses = [
      { id: "menu-1", currencyCode: "PLN" },
      {
        categories: [
          {
            menuCategoryId: "category-meals",
            categoryId: "category-1",
            code: "meals",
            name: "Meals",
            description: null,
            sortOrder: 1,
          },
        ],
      },
      {
        products: [
          {
            menuProductId: "menu-product-1",
            productId: "product-1",
            type: "MEAL",
            name: "Burger Meal",
            description: "Choose your meal",
            label: "Popular",
            price: "20.00",
            imageUrl: null,
            hasCustomizations: true,
          },
        ],
      },
    ];
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      const body = responses.shift();
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const catalog = await getCatalog("pl");

    expect(catalog.categories[0].id).toBe("featured");
    expect(catalog.categories[0].label).toBe("Dla Ciebie");
    expect(catalog.categories[1]).toMatchObject({
      id: "category-meals",
      label: "Meals",
    });
    expect(catalog.products[0]).toMatchObject({
      menuProductId: "menu-product-1",
      priceCents: 2000,
    });
    expect(catalog.featuredContent.heroBanner.title).toBe(
      "Dzisiejsze propozycje",
    );
  });

  it("passes the selected locale to catalog endpoints", async () => {
    const requestedUrls: string[] = [];
    const responses = [
      { id: "menu-1", currencyCode: "PLN" },
      { categories: [] },
    ];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      requestedUrls.push(String(input));
      const body = responses.shift();
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    await getCatalog("pl");

    expect(requestedUrls).toEqual([
      "http://localhost:4000/api/v1/kiosk/menus/active?locale=pl",
      "http://localhost:4000/api/v1/kiosk/menus/menu-1/categories?locale=pl",
    ]);
  });
});
