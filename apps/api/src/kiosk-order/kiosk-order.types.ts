export interface CreateOrderRequest {
  basketId: string;
}

export interface OrderItemResponse {
  id: string;
  menuProductId: string | null;
  productId: string;
  productName: string;
  productType: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  configuration: unknown;
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotalAmount: string;
  totalAmount: string;
  items: OrderItemResponse[];
}
