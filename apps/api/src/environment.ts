import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';

type EnvironmentValues = Record<string, string | undefined>;
type EnvironmentFileLoader = (envFile: string) => EnvironmentValues;

const stripePrefixes: Partial<Record<string, string>> = {
  STRIPE_SECRET_KEY: 'sk_test_',
  STRIPE_WEBHOOK_SECRET: 'whsec_',
};

function getEnvironmentCandidates(): string[] {
  return [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '../../.env'),
    resolve(process.cwd(), '../../packages/database/.env'),
    resolve(__dirname, '../../../.env'),
    resolve(__dirname, '../../../packages/database/.env'),
  ];
}

export function loadEnvironment(
  candidates: readonly string[] = getEnvironmentCandidates(),
  loadFile: EnvironmentFileLoader = loadEnvironmentFile,
): void {
  for (const envFile of new Set(candidates)) {
    if (existsSync(envFile)) {
      applyEnvironment(loadFile(envFile));
    }
  }
}

function loadEnvironmentFile(envFile: string): EnvironmentValues {
  return parseEnv(readFileSync(envFile, 'utf8'));
}

function applyEnvironment(values: EnvironmentValues): void {
  for (const [name, rawValue] of Object.entries(values)) {
    if (rawValue === undefined) {
      continue;
    }

    const value = rawValue.trim();
    if (value && shouldSetEnvironmentValue(name, value)) {
      process.env[name] = value;
    }
  }
}

function shouldSetEnvironmentValue(name: string, nextValue: string): boolean {
  const currentValue = process.env[name]?.trim();
  if (!currentValue) {
    return true;
  }

  const expectedPrefix = stripePrefixes[name];
  if (!expectedPrefix) {
    return false;
  }

  return (
    (!currentValue.startsWith(expectedPrefix) ||
      isPlaceholderValue(currentValue)) &&
    nextValue.startsWith(expectedPrefix)
  );
}

function isPlaceholderValue(value: string): boolean {
  return value.includes('change_me') || value.includes('your_');
}
