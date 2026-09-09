import { Module } from '@nestjs/common';
import {
  KioskPaymentsController,
  StripeWebhookController,
} from './payments.controller';
import { PaymentsService } from './payments.service';
import { StripeClientFactory } from './stripe-client.factory';
import { StripeConfigService } from './stripe-config.service';

@Module({
  controllers: [KioskPaymentsController, StripeWebhookController],
  providers: [PaymentsService, StripeClientFactory, StripeConfigService],
})
export class PaymentsModule {}
