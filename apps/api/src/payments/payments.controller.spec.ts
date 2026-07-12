import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import {
  KioskPaymentsController,
  StripeWebhookController,
} from './payments.controller';
import { PaymentsService } from './payments.service';

describe('KioskPaymentsController', () => {
  let controller: KioskPaymentsController;
  let service: jest.Mocked<Pick<PaymentsService, 'createCheckoutSession'>>;

  beforeEach(async () => {
    service = {
      createCheckoutSession: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [KioskPaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get(KioskPaymentsController);
  });

  it('creates a checkout session for an order', async () => {
    const response = {
      orderId: 'order-1',
      paymentId: 'payment-1',
      checkoutSessionId: 'cs_test_1',
      checkoutUrl: 'https://checkout.stripe.com/pay/cs_test_1',
      paymentStatus: 'AWAITING_PAYMENT_CONFIRMATION',
    };
    service.createCheckoutSession.mockResolvedValue(response);

    await expect(controller.createCheckoutSession('order-1')).resolves.toBe(
      response,
    );
    expect(service.createCheckoutSession).toHaveBeenCalledWith('order-1');
  });
});

describe('StripeWebhookController', () => {
  let controller: StripeWebhookController;
  let service: jest.Mocked<Pick<PaymentsService, 'handleStripeWebhook'>>;

  beforeEach(async () => {
    service = {
      handleStripeWebhook: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StripeWebhookController],
      providers: [
        {
          provide: PaymentsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get(StripeWebhookController);
  });

  it('passes the raw body and Stripe signature to the service', async () => {
    const rawBody = Buffer.from('{"id":"evt_1"}');
    const response = {
      received: true as const,
      eventId: 'evt_1',
      eventType: 'checkout.session.completed',
      paymentStatus: 'PAID',
    };
    service.handleStripeWebhook.mockResolvedValue(response);

    await expect(
      controller.handleStripeWebhook(
        { rawBody } as RawBodyRequest<Request>,
        'stripe-signature',
      ),
    ).resolves.toBe(response);
    expect(service.handleStripeWebhook).toHaveBeenCalledWith(
      rawBody,
      'stripe-signature',
    );
  });

  it('rejects webhook requests without the raw body needed for verification', () => {
    expect(() =>
      controller.handleStripeWebhook(
        {} as RawBodyRequest<Request>,
        'signature',
      ),
    ).toThrow(BadRequestException);
    expect(service.handleStripeWebhook).not.toHaveBeenCalled();
  });
});
