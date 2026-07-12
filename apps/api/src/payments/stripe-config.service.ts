import { Injectable, ServiceUnavailableException } from '@nestjs/common';

@Injectable()
export class StripeConfigService {
  getSecretKey(): string {
    const key = this.readRequired('STRIPE_SECRET_KEY', 'STRIPE_NOT_CONFIGURED');
    if (!key.startsWith('sk_test_')) {
      throw new ServiceUnavailableException({
        code: 'STRIPE_TEST_KEY_REQUIRED',
        message: 'Stripe must be configured with a test secret key.',
      });
    }

    return key;
  }

  getWebhookSecret(): string {
    const secret = this.readRequired(
      'STRIPE_WEBHOOK_SECRET',
      'STRIPE_WEBHOOK_NOT_CONFIGURED',
    );
    if (!secret.startsWith('whsec_')) {
      throw new ServiceUnavailableException({
        code: 'STRIPE_WEBHOOK_SECRET_INVALID',
        message: 'Stripe webhook secret is not configured correctly.',
      });
    }

    return secret;
  }

  getFrontendUrl(): string {
    return process.env.FRONTEND_URL?.trim() || 'http://localhost:5173';
  }

  private readRequired(name: string, code: string): string {
    const value = process.env[name]?.trim();
    if (!value || value.includes('change_me')) {
      throw new ServiceUnavailableException({
        code,
        message: 'Stripe test credentials are not configured.',
      });
    }

    return value;
  }
}
