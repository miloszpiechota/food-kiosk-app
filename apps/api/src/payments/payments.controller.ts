import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { PaymentsService } from './payments.service';
import {
  CheckoutSessionResponse,
  StripeWebhookResponse,
} from './payments.types';

@Controller('api/v1/kiosk/orders')
export class KioskPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post(':orderId/checkout-session')
  createCheckoutSession(
    @Param('orderId') orderId: string,
  ): Promise<CheckoutSessionResponse> {
    return this.paymentsService.createCheckoutSession(orderId);
  }
}

@Controller('api/v1/webhooks/stripe')
export class StripeWebhookController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @HttpCode(200)
  handleStripeWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ): Promise<StripeWebhookResponse> {
    if (!request.rawBody) {
      throw new BadRequestException({
        code: 'STRIPE_RAW_BODY_MISSING',
        message: 'Stripe webhook raw body is required.',
      });
    }

    return this.paymentsService.handleStripeWebhook(request.rawBody, signature);
  }
}
