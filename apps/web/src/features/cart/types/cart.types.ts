import type { Product } from "../../menu/types/menu.types";

export interface CartItem extends Product {
  quantity: number;
}

export interface CartSummary {
  itemCount: number;
  totalCents: number;
}
