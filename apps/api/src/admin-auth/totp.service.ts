import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';

const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const totpPeriodSeconds = 30;
const totpDigits = 6;

@Injectable()
export class TotpService {
  createSecret(): string {
    return encodeBase32(randomBytes(20));
  }

  createProvisioningUri(input: {
    issuer: string;
    accountName: string;
    secret: string;
  }): string {
    const label = `${input.issuer}:${input.accountName}`;
    const params = new URLSearchParams({
      secret: input.secret,
      issuer: input.issuer,
      algorithm: 'SHA1',
      digits: String(totpDigits),
      period: String(totpPeriodSeconds),
    });

    return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
  }

  verify(secret: string, code: string, now = new Date()): boolean {
    const currentCounter = Math.floor(now.getTime() / 1000 / totpPeriodSeconds);

    for (const counter of [
      currentCounter - 1,
      currentCounter,
      currentCounter + 1,
    ]) {
      const expected = this.generateCode(secret, counter);
      if (safeCodeEquals(expected, code)) {
        return true;
      }
    }

    return false;
  }

  generateCode(secret: string, counter: number): string {
    const key = decodeBase32(secret);
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigUInt64BE(BigInt(counter));

    const digest = createHmac('sha1', key).update(counterBuffer).digest();
    const offset = digest[digest.length - 1] & 0x0f;
    const binary =
      ((digest[offset] & 0x7f) << 24) |
      ((digest[offset + 1] & 0xff) << 16) |
      ((digest[offset + 2] & 0xff) << 8) |
      (digest[offset + 3] & 0xff);

    return (binary % 10 ** totpDigits).toString().padStart(totpDigits, '0');
  }
}

function encodeBase32(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += base32Alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += base32Alphabet[(value << (5 - bits)) & 31];
  }

  return output;
}

function decodeBase32(secret: string): Buffer {
  const normalized = secret.replaceAll(/\s|=/g, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const char of normalized) {
    const index = base32Alphabet.indexOf(char);
    if (index === -1) {
      throw new Error('Invalid TOTP secret.');
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

function safeCodeEquals(expected: string, actual: string): boolean {
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);

  return (
    expectedBuffer.byteLength === actualBuffer.byteLength &&
    timingSafeEqual(expectedBuffer, actualBuffer)
  );
}
