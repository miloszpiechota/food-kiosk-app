import type {
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  ProductType,
} from '@prisma/client';

export interface AdminOrderListQuery {
  restaurantId?: string;
  orderStatus?: string;
  paymentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface UpdateAdminOrderStatusRequest {
  status?: string;
}

export interface AdminOrderPaymentSummary {
  id: string;
  provider: PaymentProvider;
  providerSessionId: string;
  providerPaymentIntentId: string | null;
  status: PaymentStatus;
  amount: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrderSummary {
  id: string;
  orderNumber: string;
  restaurantId: string;
  restaurantName: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotalAmount: string;
  totalAmount: string;
  itemCount: number;
  payment: AdminOrderPaymentSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrderItemDetail {
  id: string;
  menuProductId: string | null;
  productId: string;
  productName: string;
  productType: ProductType;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
  configurationSnapshot: unknown;
}

export interface AdminOrderDetail extends AdminOrderSummary {
  items: AdminOrderItemDetail[];
}

export interface AdminOrderListResponse {
  orders: AdminOrderSummary[];
}

export interface AdminOrderDetailResponse {
  order: AdminOrderDetail;
}

export interface UpdateAdminOrderStatusResponse {
  order: AdminOrderDetail;
}
