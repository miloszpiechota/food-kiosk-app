import { describe, expect, it } from "vitest";
import type { CartItem } from "../types/cart.types";
import { getCartSummary } from "./cart.store";

describe("cart store", () => {
  it("summarizes backend basket items", () => {
    const items: CartItem[] = [
      {
        id: "item-1",
        menuProductId: "menu-product-1",
        productId: "product-1",
        name: "Burger Meal",
        quantity: 2,
        unitPriceCents: 2400,
        lineTotalCents: 4800,
        configuration: {},
      },
      {
        id: "item-2",
        menuProductId: "menu-product-2",
        productId: "product-2",
        name: "Cola",
        quantity: 1,
        unitPriceCents: 500,
        lineTotalCents: 500,
        configuration: {},
      },
    ];

    expect(getCartSummary(items)).toEqual({
      itemCount: 3,
      totalCents: 5300,
    });
  });
});
