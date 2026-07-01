import type { CartItem, CartSummary } from "../types/cart.types";

export function getCartSummary(items: readonly CartItem[]): CartSummary {
  return items.reduce<CartSummary>(
    (summary, item) => ({
      itemCount: summary.itemCount + item.quantity,
      totalCents: summary.totalCents + item.lineTotalCents,
    }),
    { itemCount: 0, totalCents: 0 },
  );
}
