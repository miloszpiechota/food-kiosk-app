import { describe, expect, it } from "vitest";
import { PRODUCTS } from "./kiosk-data";
import {
  addProductToCart,
  formatCurrency,
  getCartSummary,
  getVisibleProducts,
} from "./kiosk-state";

describe("kiosk cart state", () => {
  it("adds a product as a new cart item", () => {
    const cart = addProductToCart([], PRODUCTS[0]);

    expect(cart).toHaveLength(1);
    expect(cart[0]).toMatchObject({
      id: PRODUCTS[0].id,
      quantity: 1,
    });
  });

  it("increments quantity when the same product is added again", () => {
    const firstCart = addProductToCart([], PRODUCTS[0]);
    const secondCart = addProductToCart(firstCart, PRODUCTS[0]);

    expect(secondCart).toHaveLength(1);
    expect(secondCart[0].quantity).toBe(2);
  });

  it("summarizes cart item count and total in cents", () => {
    const cart = addProductToCart(
      addProductToCart([], PRODUCTS[0]),
      PRODUCTS[2],
    );

    expect(getCartSummary(cart)).toEqual({
      itemCount: 2,
      totalCents: PRODUCTS[0].priceCents + PRODUCTS[2].priceCents,
    });
  });
});

describe("kiosk product filtering", () => {
  it("shows popular products for the popular category", () => {
    const products = getVisibleProducts(PRODUCTS, "popular", "");

    expect(products.length).toBeGreaterThan(0);
    expect(products.every((product) => product.label === "Popular")).toBe(true);
  });

  it("filters products by active category and search term", () => {
    const products = getVisibleProducts(PRODUCTS, "coffee", "latte");

    expect(products.map((product) => product.name)).toEqual(["Latte"]);
  });

  it("formats cents as display currency", () => {
    expect(formatCurrency(1299)).toBe("$12.99");
  });
});
