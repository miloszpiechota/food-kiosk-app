import { ServiceUnavailableException } from '@nestjs/common';
import { StripeConfigService } from './stripe-config.service';

const ORIGINAL_ENV = process.env;

describe('StripeConfigService', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('returns configured Stripe test credentials', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_valid';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_valid';
    process.env.FRONTEND_URL = 'http://localhost:5173';

    const service = new StripeConfigService();

    expect(service.getSecretKey()).toBe('sk_test_valid');
    expect(service.getWebhookSecret()).toBe('whsec_valid');
    expect(service.getFrontendUrl()).toBe('http://localhost:5173');
  });

  it('rejects missing placeholder or non-test Stripe secret keys', () => {
    const service = new StripeConfigService();

    delete process.env.STRIPE_SECRET_KEY;
    expect(() => service.getSecretKey()).toThrow(ServiceUnavailableException);

    process.env.STRIPE_SECRET_KEY = 'sk_test_change_me';
    expect(() => service.getSecretKey()).toThrow(ServiceUnavailableException);

    process.env.STRIPE_SECRET_KEY = 'sk_live_not_allowed';
    expect(() => service.getSecretKey()).toThrow(ServiceUnavailableException);
  });

  it('rejects missing placeholder or malformed webhook secrets', () => {
    const service = new StripeConfigService();

    delete process.env.STRIPE_WEBHOOK_SECRET;
    expect(() => service.getWebhookSecret()).toThrow(
      ServiceUnavailableException,
    );

    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_change_me';
    expect(() => service.getWebhookSecret()).toThrow(
      ServiceUnavailableException,
    );

    process.env.STRIPE_WEBHOOK_SECRET = 'not_a_webhook_secret';
    expect(() => service.getWebhookSecret()).toThrow(
      ServiceUnavailableException,
    );
  });

  it('uses the local web app URL by default', () => {
    delete process.env.FRONTEND_URL;

    expect(new StripeConfigService().getFrontendUrl()).toBe(
      'http://localhost:5173',
    );
  });
});
