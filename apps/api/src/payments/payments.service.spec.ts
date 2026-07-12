import {
  BadRequestException,
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
import { PaymentsService } from './payments.service';
import { StripeClientFactory } from './stripe-client.factory';
import { StripeConfigService } from './stripe-config.service';

const decimal = (value: string) => new Prisma.Decimal(value);

interface TransactionMock {
  order: {
    update: jest.Mock;
  };
  payment: {
    findUnique: jest.Mock;
    update: jest.Mock;
    upsert: jest.Mock;
  };
}

function createTransactionMock(): TransactionMock {
  return {
    order: {
      update: jest.fn(),
    },
    payment: {
      findUnique: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
  };
}

function createStripeMock() {
  return {
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  };
}

function createPrismaMock(transaction = createTransactionMock()) {
  return {
    order: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(
      (callback: (transaction: TransactionMock) => Promise<unknown>) =>
        callback(transaction),
    ),
  };
}

function createOrderRecord(input?: {
  paymentStatus?: PaymentStatus;
  totalAmount?: string;
}) {
  return {
    id: 'order-1',
    orderNumber: 'K-20260702-ABC123',
    paymentStatus: input?.paymentStatus ?? PaymentStatus.PENDING,
    totalAmount: decimal(input?.totalAmount ?? '53.00'),
    restaurant: {
      currencyCode: 'PLN',
    },
    payment: null,
    items: [
      {
        id: 'order-item-1',
        createdAt: new Date('2026-07-02T12:00:00.000Z'),
      },
    ],
  };
}

function createService() {
  const transaction = createTransactionMock();
  const prisma = createPrismaMock(transaction);
  const stripe = createStripeMock();
  const stripeClientFactory = {
    create: jest.fn(() => stripe as unknown as Stripe),
  };
  const stripeConfig = {
    getFrontendUrl: jest.fn(() => 'http://localhost:5173'),
    getWebhookSecret: jest.fn(() => 'whsec_test'),
  };

  return {
    prisma,
    service: new PaymentsService(
      prisma as unknown as PrismaService,
      stripeClientFactory as unknown as StripeClientFactory,
      stripeConfig as unknown as StripeConfigService,
    ),
    stripe,
    stripeClientFactory,
    stripeConfig,
    transaction,
  };
}

function getSingleMockArg<T>(mock: jest.Mock): T {
  expect(mock).toHaveBeenCalledTimes(1);
  const calls = mock.mock.calls as unknown as [[T]];
  return calls[0][0];
}

describe('PaymentsService', () => {
  it('creates a Stripe Checkout Session and persists the payment state', async () => {
    const { prisma, service, stripe, transaction } = createService();
    const order = createOrderRecord();
    prisma.order.findUnique.mockResolvedValue(order);
    stripe.checkout.sessions.create.mockResolvedValue({
      id: 'cs_test_1',
      url: 'https://checkout.stripe.com/pay/cs_test_1',
      payment_intent: null,
    });
    transaction.payment.upsert.mockResolvedValue({
      id: 'payment-1',
      orderId: 'order-1',
      status: PaymentStatus.AWAITING_PAYMENT_CONFIRMATION,
    });

    const response = await service.createCheckoutSession('order-1');
    const sessionCreateCall =
      getSingleMockArg<Stripe.Checkout.SessionCreateParams>(
        stripe.checkout.sessions.create,
      );
    const paymentUpsertCall = getSingleMockArg<{
      create: {
        amount: Prisma.Decimal;
        currency: string;
        orderId: string;
        provider: PaymentProvider;
        providerSessionId: string;
        status: PaymentStatus;
      };
      update: {
        amount: Prisma.Decimal;
        currency: string;
        providerSessionId: string;
        status: PaymentStatus;
      };
      where: { orderId: string };
    }>(transaction.payment.upsert);

    expect(sessionCreateCall.mode).toBe('payment');
    expect(sessionCreateCall.client_reference_id).toBe('order-1');
    expect(sessionCreateCall.success_url).toContain('checkout=success');
    expect(sessionCreateCall.cancel_url).toContain('checkout=cancelled');
    expect(sessionCreateCall.metadata).toMatchObject({
      orderId: 'order-1',
      orderNumber: 'K-20260702-ABC123',
    });
    expect(sessionCreateCall.line_items?.[0]).toMatchObject({
      quantity: 1,
      price_data: {
        currency: 'pln',
        unit_amount: 5300,
        product_data: {
          name: 'Kiosk order K-20260702-ABC123',
        },
      },
    });
    expect(paymentUpsertCall.where).toEqual({ orderId: 'order-1' });
    expect(paymentUpsertCall.create).toMatchObject({
      orderId: 'order-1',
      provider: PaymentProvider.STRIPE,
      providerSessionId: 'cs_test_1',
      status: PaymentStatus.AWAITING_PAYMENT_CONFIRMATION,
      currency: 'pln',
    });
    expect(paymentUpsertCall.create.amount.toString()).toBe('53');
    expect(transaction.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { paymentStatus: PaymentStatus.AWAITING_PAYMENT_CONFIRMATION },
    });
    expect(response).toEqual({
      orderId: 'order-1',
      paymentId: 'payment-1',
      checkoutSessionId: 'cs_test_1',
      checkoutUrl: 'https://checkout.stripe.com/pay/cs_test_1',
      paymentStatus: PaymentStatus.AWAITING_PAYMENT_CONFIRMATION,
    });
  });

  it('does not create a checkout session for an already paid order', async () => {
    const { prisma, service, stripe } = createService();
    prisma.order.findUnique.mockResolvedValue(
      createOrderRecord({ paymentStatus: PaymentStatus.PAID }),
    );

    await expect(
      service.createCheckoutSession('order-1'),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it('rejects checkout creation when the order does not exist', async () => {
    const { prisma, service, stripe } = createService();
    prisma.order.findUnique.mockResolvedValue(null);

    await expect(
      service.createCheckoutSession('order-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it('rejects checkout creation for empty or invalid amount orders', async () => {
    const { prisma, service, stripe } = createService();
    prisma.order.findUnique.mockResolvedValue({
      ...createOrderRecord({ totalAmount: '0.00' }),
      items: [],
    });

    await expect(
      service.createCheckoutSession('order-1'),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();

    prisma.order.findUnique.mockResolvedValue(
      createOrderRecord({ totalAmount: '0.00' }),
    );

    await expect(
      service.createCheckoutSession('order-1'),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it('updates payment and order status from a verified checkout webhook', async () => {
    const { service, stripe, stripeConfig, transaction } = createService();
    stripe.webhooks.constructEvent.mockReturnValue({
      id: 'evt_1',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_1',
          object: 'checkout.session',
          payment_intent: 'pi_1',
          payment_status: 'paid',
        },
      },
    });
    transaction.payment.findUnique.mockResolvedValue({
      id: 'payment-1',
      orderId: 'order-1',
      status: PaymentStatus.AWAITING_PAYMENT_CONFIRMATION,
      order: {
        id: 'order-1',
        paymentStatus: PaymentStatus.AWAITING_PAYMENT_CONFIRMATION,
      },
    });

    const response = await service.handleStripeWebhook(
      Buffer.from('{}'),
      'signature',
    );

    expect(stripe.webhooks.constructEvent).toHaveBeenCalledWith(
      Buffer.from('{}'),
      'signature',
      'whsec_test',
    );
    expect(stripeConfig.getWebhookSecret).toHaveBeenCalledTimes(1);
    expect(transaction.payment.update).toHaveBeenCalledWith({
      where: { id: 'payment-1' },
      data: {
        status: PaymentStatus.PAID,
        providerPaymentIntentId: 'pi_1',
      },
    });
    expect(transaction.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { paymentStatus: PaymentStatus.PAID },
    });
    expect(response).toEqual({
      received: true,
      eventId: 'evt_1',
      eventType: 'checkout.session.completed',
      paymentStatus: PaymentStatus.PAID,
    });
  });

  it('does not downgrade a paid order from a late non-paid webhook', async () => {
    const { service, stripe, transaction } = createService();
    stripe.webhooks.constructEvent.mockReturnValue({
      id: 'evt_2',
      type: 'checkout.session.expired',
      data: {
        object: {
          id: 'cs_test_1',
          object: 'checkout.session',
          payment_intent: 'pi_1',
        },
      },
    });
    transaction.payment.findUnique.mockResolvedValue({
      id: 'payment-1',
      orderId: 'order-1',
      status: PaymentStatus.PAID,
      order: {
        id: 'order-1',
        paymentStatus: PaymentStatus.PAID,
      },
    });

    await expect(
      service.handleStripeWebhook(Buffer.from('{}'), 'signature'),
    ).resolves.toMatchObject({
      paymentStatus: PaymentStatus.CANCELLED,
    });
    expect(transaction.payment.update).not.toHaveBeenCalled();
    expect(transaction.order.update).not.toHaveBeenCalled();
  });

  it('rejects webhooks with invalid Stripe signatures', async () => {
    const { service, stripe, transaction } = createService();
    stripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('invalid signature');
    });

    await expect(
      service.handleStripeWebhook(Buffer.from('{}'), 'signature'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(transaction.payment.update).not.toHaveBeenCalled();
    expect(transaction.order.update).not.toHaveBeenCalled();
  });

  it('rejects webhooks without a Stripe signature header', async () => {
    const { service, stripe, transaction } = createService();

    await expect(
      service.handleStripeWebhook(Buffer.from('{}'), undefined),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(stripe.webhooks.constructEvent).not.toHaveBeenCalled();
    expect(transaction.payment.update).not.toHaveBeenCalled();
    expect(transaction.order.update).not.toHaveBeenCalled();
  });

  it('acknowledges unrelated verified events without changing payment state', async () => {
    const { service, stripe, transaction } = createService();
    stripe.webhooks.constructEvent.mockReturnValue({
      id: 'evt_unrelated',
      type: 'payment_intent.created',
      data: {
        object: {
          id: 'pi_1',
          object: 'payment_intent',
        },
      },
    });

    await expect(
      service.handleStripeWebhook(Buffer.from('{}'), 'signature'),
    ).resolves.toEqual({
      received: true,
      eventId: 'evt_unrelated',
      eventType: 'payment_intent.created',
      paymentStatus: undefined,
    });
    expect(transaction.payment.findUnique).not.toHaveBeenCalled();
    expect(transaction.payment.update).not.toHaveBeenCalled();
    expect(transaction.order.update).not.toHaveBeenCalled();
  });
});
