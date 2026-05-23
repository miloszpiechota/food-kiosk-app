import type { Product } from "../../menu/types/menu.types";
import type { CartItem, CartSummary } from "../types/cart.types";

export function addProductToCart(
  currentItems: readonly CartItem[],
  product: Product,
): CartItem[] {
  const existingItem = currentItems.find((item) => item.id === product.id);

  if (!existingItem) {
    return [...currentItems, { ...product, quantity: 1 }];
  }

  return currentItems.map((item) =>
    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
  );
}

export function getCartSummary(items: readonly CartItem[]): CartSummary {
  return items.reduce<CartSummary>(
    (summary, item) => ({
      itemCount: summary.itemCount + item.quantity,
      totalCents: summary.totalCents + item.priceCents * item.quantity,
    }),
    { itemCount: 0, totalCents: 0 },
  );
}
