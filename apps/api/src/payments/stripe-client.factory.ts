import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { StripeConfigService } from './stripe-config.service';

@Injectable()
export class StripeClientFactory {
  constructor(private readonly stripeConfig: StripeConfigService) {}

  create(): Stripe {
    return new Stripe(this.stripeConfig.getSecretKey());
  }
}
