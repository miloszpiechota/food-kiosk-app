import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  PaymentProvider,
  PaymentStatus,
  Prisma,
} from '../../../../node_modules/@prisma/client/.prisma/client';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import {
  CheckoutSessionResponse,
  StripeWebhookResponse,
} from './payments.types';
import { StripeClientFactory } from './stripe-client.factory';
import { StripeConfigService } from './stripe-config.service';

type OrderForCheckout = Prisma.OrderGetPayload<{
  include: {
    items: true;
    payment: true;
    restaurant: true;
  };
}>;

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeClientFactory: StripeClientFactory,
    private readonly stripeConfig: StripeConfigService,
  ) {}

  async createCheckoutSession(
    orderId: string,
  ): Promise<CheckoutSessionResponse> {
    if (!orderId?.trim()) {
      throw new BadRequestException('orderId is required.');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payment: true,
        restaurant: true,
      },
    });

    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        message: 'The order was not found.',
      });
    }
    this.validateOrderForCheckout(order);

    const stripe = this.stripeClientFactory.create();
    const currency = order.restaurant.currencyCode.toLowerCase();
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: order.id,
      success_url: this.createReturnUrl('success', order.id, true),
      cancel_url: this.createReturnUrl('cancelled', order.id, false),
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
      payment_intent_data: {
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
        },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: this.toMinorUnits(order.totalAmount),
            product_data: {
              name: `Kiosk order ${order.orderNumber}`,
            },
          },
        },
      ],
    });

    if (!checkoutSession.url) {
      throw new BadGatewayException({
        code: 'STRIPE_CHECKOUT_URL_MISSING',
        message: 'Stripe did not return a checkout URL.',
      });
    }

    const payment = await this.prisma.$transaction(async (transaction) => {
      const updatedPayment = await transaction.payment.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          provider: PaymentProvider.STRIPE,
          providerSessionId: checkoutSession.id,
          providerPaymentIntentId: this.getStripeId(
            checkoutSession.payment_intent,
          ),
          status: PaymentStatus.AWAITING_PAYMENT_CONFIRMATION,
          amount: order.totalAmount,
          currency,
        },
        update: {
          providerSessionId: checkoutSession.id,
          providerPaymentIntentId: this.getStripeId(
            checkoutSession.payment_intent,
          ),
          status: PaymentStatus.AWAITING_PAYMENT_CONFIRMATION,
          amount: order.totalAmount,
          currency,
        },
      });

      await transaction.order.update({
        where: { id: order.id },
        data: { paymentStatus: PaymentStatus.AWAITING_PAYMENT_CONFIRMATION },
      });

      return updatedPayment;
    });

    return {
      orderId: order.id,
      paymentId: payment.id,
      checkoutSessionId: checkoutSession.id,
      checkoutUrl: checkoutSession.url,
      paymentStatus: PaymentStatus.AWAITING_PAYMENT_CONFIRMATION,
    };
  }

  async handleStripeWebhook(
    payload: Buffer,
    signature: string | undefined,
  ): Promise<StripeWebhookResponse> {
    if (!signature) {
      throw new BadRequestException({
        code: 'STRIPE_SIGNATURE_MISSING',
        message: 'Stripe signature header is required.',
      });
    }

    const stripe = this.stripeClientFactory.create();
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        this.stripeConfig.getWebhookSecret(),
      );
    } catch {
      throw new BadRequestException({
        code: 'STRIPE_SIGNATURE_INVALID',
        message: 'Invalid Stripe webhook signature.',
      });
    }

    const paymentStatus = this.resolvePaymentStatus(event);
    if (paymentStatus) {
      const session = this.getCheckoutSession(event);
      if (session) {
        await this.applyCheckoutSessionStatus(session, paymentStatus);
      }
    }

    return {
      received: true,
      eventId: event.id,
      eventType: event.type,
      paymentStatus,
    };
  }

  private validateOrderForCheckout(order: OrderForCheckout): void {
    if (order.items.length === 0) {
      throw new UnprocessableEntityException({
        code: 'ORDER_EMPTY',
        message: 'The order has no items to pay for.',
      });
    }
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new UnprocessableEntityException({
        code: 'ORDER_ALREADY_PAID',
        message: 'This order has already been paid.',
      });
    }
    this.toMinorUnits(order.totalAmount);
  }

  private toMinorUnits(amount: Prisma.Decimal): number {
    const minorAmount = amount.mul(100);
    const numericAmount = minorAmount.toNumber();
    if (
      !minorAmount.isInteger() ||
      !Number.isSafeInteger(numericAmount) ||
      numericAmount < 1
    ) {
      throw new UnprocessableEntityException({
        code: 'INVALID_ORDER_AMOUNT',
        message: 'The order total cannot be paid.',
      });
    }

    return numericAmount;
  }

  private createReturnUrl(
    status: 'success' | 'cancelled',
    orderId: string,
    includeSessionId: boolean,
  ): string {
    const baseUrl = this.stripeConfig.getFrontendUrl().replace(/\/+$/, '');
    const params = new URLSearchParams({
      checkout: status,
      orderId,
    });
    const sessionSuffix = includeSessionId
      ? '&session_id={CHECKOUT_SESSION_ID}'
      : '';

    return `${baseUrl}/?${params.toString()}${sessionSuffix}`;
  }

  private resolvePaymentStatus(event: Stripe.Event): PaymentStatus | undefined {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = this.getCheckoutSession(event);
        return session?.payment_status === 'paid'
          ? PaymentStatus.PAID
          : PaymentStatus.AWAITING_PAYMENT_CONFIRMATION;
      }
      case 'checkout.session.async_payment_succeeded':
        return PaymentStatus.PAID;
      case 'checkout.session.async_payment_failed':
        return PaymentStatus.FAILED;
      case 'checkout.session.expired':
        return PaymentStatus.CANCELLED;
      default:
        return undefined;
    }
  }

  private getCheckoutSession(
    event: Stripe.Event,
  ): Stripe.Checkout.Session | null {
    const object = event.data.object as { object?: string };
    if (object.object !== 'checkout.session') {
      return null;
    }

    return event.data.object as Stripe.Checkout.Session;
  }

  private async applyCheckoutSessionStatus(
    session: Stripe.Checkout.Session,
    status: PaymentStatus,
  ): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const payment = await transaction.payment.findUnique({
        where: { providerSessionId: session.id },
        include: { order: true },
      });

      if (!payment) {
        return;
      }
      if (
        payment.status === PaymentStatus.PAID &&
        status !== PaymentStatus.PAID
      ) {
        return;
      }

      await transaction.payment.update({
        where: { id: payment.id },
        data: {
          status,
          providerPaymentIntentId: this.getStripeId(session.payment_intent),
        },
      });
      await transaction.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: status },
      });
    });
  }

  private getStripeId(value: string | { id: string } | null): string | null {
    if (!value) {
      return null;
    }
    if (typeof value === 'string') {
      return value;
    }

    return value.id;
  }
}
