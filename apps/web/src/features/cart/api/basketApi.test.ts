import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createCheckoutSession,
  createOrderSnapshot,
  removeBasketItem,
  updateBasketItemQuantity,
} from "./basketApi";

afterEach(() => {
  vi.restoreAllMocks();
});

function mockFetchJson(body: unknown) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

describe("basket API", () => {
  it("updates a basket item quantity and maps backend totals", async () => {
    const fetchMock = mockFetchJson({
      id: "basket-1",
      sessionId: "session-1",
      subtotalAmount: "53.00",
      items: [
        {
          id: "basket-item-1",
          menuProductId: "menu-product-1",
          productId: "product-1",
          productName: "Burger Meal",
          quantity: 2,
          unitPrice: "26.50",
          lineTotal: "53.00",
          configuration: { version: 1 },
        },
      ],
    });

    const basket = await updateBasketItemQuantity(
      "basket-1",
      "basket-item-1",
      2,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/kiosk/baskets/basket-1/items/basket-item-1",
      {
        method: "PATCH",
        body: JSON.stringify({ quantity: 2 }),
        headers: { "Content-Type": "application/json" },
      },
    );
    expect(basket.summary).toEqual({
      itemCount: 2,
      totalCents: 5300,
    });
    expect(basket.items[0]).toMatchObject({
      id: "basket-item-1",
      name: "Burger Meal",
      quantity: 2,
      unitPriceCents: 2650,
      lineTotalCents: 5300,
    });
  });

  it("removes a basket item and maps the returned basket state", async () => {
    const fetchMock = mockFetchJson({
      id: "basket-1",
      sessionId: "session-1",
      subtotalAmount: "0.00",
      items: [],
    });

    const basket = await removeBasketItem("basket-1", "basket-item-1");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/kiosk/baskets/basket-1/items/basket-item-1",
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      },
    );
    expect(basket.summary).toEqual({
      itemCount: 0,
      totalCents: 0,
    });
    expect(basket.items).toEqual([]);
  });

  it("creates an order snapshot before payment", async () => {
    const fetchMock = mockFetchJson({
      id: "order-1",
      orderNumber: "K-20260702-ABC123",
      status: "NEW",
      paymentStatus: "PENDING",
      subtotalAmount: "53.00",
      totalAmount: "53.00",
    });

    const order = await createOrderSnapshot("basket-1");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/kiosk/orders",
      {
        method: "POST",
        body: JSON.stringify({ basketId: "basket-1" }),
        headers: { "Content-Type": "application/json" },
      },
    );
    expect(order).toEqual({
      id: "order-1",
      orderNumber: "K-20260702-ABC123",
      paymentStatus: "PENDING",
      status: "NEW",
      subtotalCents: 5300,
      totalCents: 5300,
    });
  });

  it("creates a Stripe checkout session for an order", async () => {
    const fetchMock = mockFetchJson({
      orderId: "order-1",
      paymentId: "payment-1",
      checkoutSessionId: "cs_test_1",
      checkoutUrl: "https://checkout.stripe.com/pay/cs_test_1",
      paymentStatus: "AWAITING_PAYMENT_CONFIRMATION",
    });

    const checkoutSession = await createCheckoutSession("order-1");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/kiosk/orders/order-1/checkout-session",
      {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      },
    );
    expect(checkoutSession).toEqual({
      orderId: "order-1",
      paymentId: "payment-1",
      checkoutSessionId: "cs_test_1",
      checkoutUrl: "https://checkout.stripe.com/pay/cs_test_1",
      paymentStatus: "AWAITING_PAYMENT_CONFIRMATION",
    });
  });
});
