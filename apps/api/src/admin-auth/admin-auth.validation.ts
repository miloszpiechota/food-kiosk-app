import { BadRequestException } from '@nestjs/common';
import { AdminRole } from '@prisma/client';

const emailPattern =
  /^[a-z0-9](?:[a-z0-9.!#$%&'*+/=?^_`{|}~-]{0,62}[a-z0-9])?@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const tokenPattern = /^[A-Za-z0-9_-]{32,256}$/;

export function normalizeEmail(value: unknown): string {
  if (typeof value !== 'string') {
    throw validationError('ADMIN_EMAIL_INVALID', 'A valid email is required.');
  }

  const email = value.trim().toLowerCase();
  if (
    email.length < 6 ||
    email.length > 254 ||
    email.includes('..') ||
    !emailPattern.test(email) ||
    !hasCompleteEmailDomain(email)
  ) {
    throw validationError('ADMIN_EMAIL_INVALID', 'A valid email is required.');
  }

  return email;
}

export function validatePassword(value: unknown, email?: string): string {
  if (typeof value !== 'string') {
    throw validationError(
      'ADMIN_PASSWORD_INVALID',
      'Password must meet the admin password policy.',
    );
  }

  const password = value;
  const localPart = email?.split('@')[0] ?? '';
  const hasRequiredLength = password.length >= 12 && password.length <= 128;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9\s]/.test(password);
  const hasControlChar = containsControlCharacter(password);
  const containsEmailPart =
    localPart.length >= 4 &&
    password.toLowerCase().includes(localPart.toLowerCase());

  if (
    !hasRequiredLength ||
    !hasUpper ||
    !hasLower ||
    !hasDigit ||
    !hasSymbol ||
    hasControlChar ||
    containsEmailPart
  ) {
    throw validationError(
      'ADMIN_PASSWORD_INVALID',
      'Password must be 12-128 characters and include uppercase, lowercase, number, and symbol characters.',
    );
  }

  return password;
}

export function validateTotpCode(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{6}$/.test(value.trim())) {
    throw validationError(
      'ADMIN_TOTP_INVALID',
      'A six-digit 2FA code is required.',
    );
  }

  return value.trim();
}

export function validateToken(
  value: unknown,
  code: string,
  message: string,
): string {
  if (typeof value !== 'string' || !tokenPattern.test(value.trim())) {
    throw validationError(code, message);
  }

  return value.trim();
}

export function validateRole(value: unknown): AdminRole {
  if (value === undefined || value === null || value === '') {
    return AdminRole.ADMIN;
  }
  if (value === AdminRole.ADMIN || value === AdminRole.SUPER_ADMIN) {
    return value;
  }

  throw validationError('ADMIN_ROLE_INVALID', 'Admin role is invalid.');
}

export function validateRestaurantIds(value: unknown): string[] {
  if (value === undefined || value === null) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw validationError(
      'ADMIN_RESTAURANTS_INVALID',
      'Restaurant ids must be an array.',
    );
  }

  const ids = value.map((item) => {
    if (typeof item !== 'string' || !uuidPattern.test(item.trim())) {
      throw validationError(
        'ADMIN_RESTAURANTS_INVALID',
        'Restaurant ids must be valid UUIDs.',
      );
    }

    return item.trim();
  });

  return [...new Set(ids)];
}

export function validationError(
  code: string,
  message: string,
): BadRequestException {
  return new BadRequestException({ code, message });
}

function containsControlCharacter(value: string): boolean {
  return [...value].some((char) => {
    const code = char.charCodeAt(0);

    return code <= 31 || code === 127;
  });
}

function hasCompleteEmailDomain(email: string): boolean {
  const domain = email.split('@')[1] ?? '';
  const labels = domain.split('.');
  const topLevelDomain = labels.at(-1) ?? '';

  return (
    labels.length >= 2 &&
    labels.every((label) => label.length > 0) &&
    /^[a-z]{2,63}$/i.test(topLevelDomain)
  );
}
