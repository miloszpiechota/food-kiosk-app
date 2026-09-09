import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadEnvironment } from './environment';

const originalDatabaseUrl = process.env.DATABASE_URL;
const originalStripeSecretKey = process.env.STRIPE_SECRET_KEY;
const originalStripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

function restoreEnvironmentVariable(
  name: 'DATABASE_URL' | 'STRIPE_SECRET_KEY' | 'STRIPE_WEBHOOK_SECRET',
  value: string | undefined,
): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

describe('loadEnvironment', () => {
  let temporaryDirectory: string;

  beforeEach(() => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), 'food-kiosk-env-'));
  });

  afterEach(() => {
    rmSync(temporaryDirectory, { recursive: true, force: true });
    restoreEnvironmentVariable('DATABASE_URL', originalDatabaseUrl);
    restoreEnvironmentVariable('STRIPE_SECRET_KEY', originalStripeSecretKey);
    restoreEnvironmentVariable(
      'STRIPE_WEBHOOK_SECRET',
      originalStripeWebhookSecret,
    );
  });

  it('continues loading files when the database URL is already configured', () => {
    const databaseEnv = join(temporaryDirectory, 'database.env');
    const stripeEnv = join(temporaryDirectory, 'stripe.env');
    writeFileSync(databaseEnv, 'DATABASE_URL=postgresql://localhost/test\n');
    writeFileSync(stripeEnv, 'STRIPE_SECRET_KEY=sk_test_from_root_env\n');
    process.env.DATABASE_URL = 'postgresql://localhost/inherited';
    const loadFile = jest.fn().mockReturnValue({});

    loadEnvironment([databaseEnv, stripeEnv], loadFile);

    expect(loadFile).toHaveBeenNthCalledWith(1, databaseEnv);
    expect(loadFile).toHaveBeenNthCalledWith(2, stripeEnv);
  });

  it('loads each existing candidate only once', () => {
    const stripeEnv = join(temporaryDirectory, 'stripe.env');
    writeFileSync(stripeEnv, 'STRIPE_SECRET_KEY=sk_test_from_file\n');
    const loadFile = jest.fn().mockReturnValue({});

    loadEnvironment([stripeEnv, stripeEnv], loadFile);

    expect(loadFile).toHaveBeenCalledTimes(1);
    expect(loadFile).toHaveBeenCalledWith(stripeEnv);
  });

  it('ignores missing candidate files', () => {
    const loadFile = jest.fn().mockReturnValue({});

    expect(() =>
      loadEnvironment([join(temporaryDirectory, 'missing.env')], loadFile),
    ).not.toThrow();
    expect(loadFile).not.toHaveBeenCalled();
  });

  it('replaces inherited placeholder Stripe values with valid file values', () => {
    const stripeEnv = join(temporaryDirectory, 'stripe.env');
    writeFileSync(
      stripeEnv,
      [
        'STRIPE_SECRET_KEY=sk_test_from_root_env',
        'STRIPE_WEBHOOK_SECRET=whsec_from_root_env',
      ].join('\n'),
    );
    process.env.STRIPE_SECRET_KEY = 'sk_test_change_me';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_your_secret';

    loadEnvironment([stripeEnv]);

    expect(process.env.STRIPE_SECRET_KEY).toBe('sk_test_from_root_env');
    expect(process.env.STRIPE_WEBHOOK_SECRET).toBe('whsec_from_root_env');
  });

  it('keeps valid inherited Stripe values over placeholder file values', () => {
    const stripeEnv = join(temporaryDirectory, 'stripe.env');
    writeFileSync(
      stripeEnv,
      [
        'STRIPE_SECRET_KEY=sk_test_change_me',
        'STRIPE_WEBHOOK_SECRET=whsec_your_secret',
      ].join('\n'),
    );
    process.env.STRIPE_SECRET_KEY = 'sk_test_from_shell';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_from_shell';

    loadEnvironment([stripeEnv]);

    expect(process.env.STRIPE_SECRET_KEY).toBe('sk_test_from_shell');
    expect(process.env.STRIPE_WEBHOOK_SECRET).toBe('whsec_from_shell');
  });
});
