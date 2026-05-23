import type { CategoryId, Product } from "./kiosk-data";

export interface CartItem extends Product {
  quantity: number;
}

export interface CartSummary {
  itemCount: number;
  totalCents: number;
}

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

export function getVisibleProducts(
  products: readonly Product[],
  activeCategory: CategoryId,
  searchTerm: string,
): Product[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return products.filter((product) => {
    const matchesCategory =
      activeCategory === "popular"
        ? product.label === "Popular"
        : product.category === activeCategory;

    if (!matchesCategory) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    return [product.name, product.description, product.label ?? ""].some(
      (value) => value.toLowerCase().includes(normalizedSearch),
    );
  });
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
