import type { CartItem, CartSummary } from "../types/cart.types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export interface ModifierSelectionRequest {
  modifierOptionId: string;
  quantity: number;
}

export interface AddBasketItemRequest {
  menuProductId: string;
  quantity: number;
  groupSelections?: Array<{
    productGroupId: string;
    options: Array<{
      productGroupOptionId: string;
      quantity: number;
      modifierSelections?: ModifierSelectionRequest[];
    }>;
  }>;
  modifierSelections?: ModifierSelectionRequest[];
}

export interface OrderSnapshot {
  id: string;
  orderNumber: string;
  paymentStatus: string;
  status: string;
  subtotalCents: number;
  totalCents: number;
}

export interface CheckoutSession {
  orderId: string;
  paymentId: string;
  checkoutSessionId: string;
  checkoutUrl: string;
  paymentStatus: string;
}

interface BasketResponse {
  id: string;
  sessionId: string;
  subtotalAmount: string;
  items: Array<{
    id: string;
    menuProductId: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
    configuration: unknown;
  }>;
}

interface OrderResponse {
  id: string;
  orderNumber: string;
  paymentStatus: string;
  status: string;
  subtotalAmount: string;
  totalAmount: string;
}

interface CheckoutSessionResponse {
  orderId: string;
  paymentId: string;
  checkoutSessionId: string;
  checkoutUrl: string;
  paymentStatus: string;
}

export interface BasketState {
  id: string;
  sessionId: string;
  items: CartItem[];
  summary: CartSummary;
}

function toCents(value: string): number {
  return Math.round(Number(value) * 100);
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const body = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    const message =
      body &&
      typeof body === "object" &&
      "message" in body &&
      typeof body.message === "string"
        ? body.message
        : "The basket could not be updated.";
    throw new Error(message);
  }
  return body as T;
}

function mapBasket(basket: BasketResponse): BasketState {
  return {
    id: basket.id,
    sessionId: basket.sessionId,
    items: basket.items.map((item) => ({
      id: item.id,
      menuProductId: item.menuProductId,
      productId: item.productId,
      name: item.productName,
      quantity: item.quantity,
      unitPriceCents: toCents(item.unitPrice),
      lineTotalCents: toCents(item.lineTotal),
      configuration: item.configuration,
    })),
    summary: {
      itemCount: basket.items.reduce((total, item) => total + item.quantity, 0),
      totalCents: toCents(basket.subtotalAmount),
    },
  };
}

export async function createBasket(): Promise<BasketState> {
  return mapBasket(
    await request<BasketResponse>("/api/v1/kiosk/baskets", {
      method: "POST",
      body: JSON.stringify({}),
    }),
  );
}

export async function getBasket(basketId: string): Promise<BasketState> {
  return mapBasket(
    await request<BasketResponse>(`/api/v1/kiosk/baskets/${basketId}`, {
      method: "GET",
    }),
  );
}

export async function addBasketItem(
  basketId: string,
  item: AddBasketItemRequest,
): Promise<BasketState> {
  return mapBasket(
    await request<BasketResponse>(`/api/v1/kiosk/baskets/${basketId}/items`, {
      method: "POST",
      body: JSON.stringify(item),
    }),
  );
}

export async function updateBasketItemQuantity(
  basketId: string,
  basketItemId: string,
  quantity: number,
): Promise<BasketState> {
  return mapBasket(
    await request<BasketResponse>(
      `/api/v1/kiosk/baskets/${basketId}/items/${basketItemId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      },
    ),
  );
}

export async function removeBasketItem(
  basketId: string,
  basketItemId: string,
): Promise<BasketState> {
  return mapBasket(
    await request<BasketResponse>(
      `/api/v1/kiosk/baskets/${basketId}/items/${basketItemId}`,
      {
        method: "DELETE",
      },
    ),
  );
}

export async function createOrderSnapshot(
  basketId: string,
): Promise<OrderSnapshot> {
  const order = await request<OrderResponse>("/api/v1/kiosk/orders", {
    method: "POST",
    body: JSON.stringify({ basketId }),
  });

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    paymentStatus: order.paymentStatus,
    status: order.status,
    subtotalCents: toCents(order.subtotalAmount),
    totalCents: toCents(order.totalAmount),
  };
}

export async function getOrderSnapshot(
  orderId: string,
): Promise<OrderSnapshot> {
  const order = await request<OrderResponse>(
    `/api/v1/kiosk/orders/${orderId}`,
    {
      method: "GET",
    },
  );

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    paymentStatus: order.paymentStatus,
    status: order.status,
    subtotalCents: toCents(order.subtotalAmount),
    totalCents: toCents(order.totalAmount),
  };
}

export async function createCheckoutSession(
  orderId: string,
): Promise<CheckoutSession> {
  return request<CheckoutSessionResponse>(
    `/api/v1/kiosk/orders/${orderId}/checkout-session`,
    {
      method: "POST",
      body: JSON.stringify({}),
    },
  );
}
