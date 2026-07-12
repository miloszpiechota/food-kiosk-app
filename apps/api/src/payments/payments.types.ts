export interface CheckoutSessionResponse {
  orderId: string;
  paymentId: string;
  checkoutSessionId: string;
  checkoutUrl: string;
  paymentStatus: string;
}

export interface StripeWebhookResponse {
  received: true;
  eventId: string;
  eventType: string;
  paymentStatus?: string;
}
