export interface CartItem {
  id: string;
  menuProductId: string;
  productId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  configuration: unknown;
}

export interface CartSummary {
  itemCount: number;
  totalCents: number;
}
