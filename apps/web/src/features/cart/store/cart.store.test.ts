import { describe, expect, it } from "vitest";
import { getMenuProducts } from "../../menu/api/menuApi";
import { addProductToCart, getCartSummary } from "./cart.store";

const products = getMenuProducts();

describe("cart store", () => {
  it("adds a product as a new cart item", () => {
    const cart = addProductToCart([], products[0]);

    expect(cart).toHaveLength(1);
    expect(cart[0]).toMatchObject({
      id: products[0].id,
      quantity: 1,
    });
  });

  it("increments quantity when the same product is added again", () => {
    const firstCart = addProductToCart([], products[0]);
    const secondCart = addProductToCart(firstCart, products[0]);

    expect(secondCart).toHaveLength(1);
    expect(secondCart[0].quantity).toBe(2);
  });

  it("summarizes cart item count and total in cents", () => {
    const cart = addProductToCart(addProductToCart([], products[0]), products[2]);

    expect(getCartSummary(cart)).toEqual({
      itemCount: 2,
      totalCents: products[0].priceCents + products[2].priceCents,
    });
  });
});
