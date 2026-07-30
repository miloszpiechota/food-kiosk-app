import {
  createHash,
  pbkdf2 as pbkdf2Callback,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import { Injectable } from '@nestjs/common';

const pbkdf2 = promisify(pbkdf2Callback);
const passwordAlgorithm = 'pbkdf2_sha512';
const passwordIterations = 310_000;
const passwordKeyLength = 64;

@Injectable()
export class AdminCryptoService {
  async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('base64url');
    const key = await pbkdf2(
      password,
      salt,
      passwordIterations,
      passwordKeyLength,
      'sha512',
    );

    return [
      passwordAlgorithm,
      passwordIterations.toString(),
      salt,
      key.toString('base64url'),
    ].join('$');
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const parts = hash.split('$');
    if (parts.length !== 4) {
      return false;
    }

    const [algorithm, iterationsRaw, salt, expectedRaw] = parts;
    const iterations = Number(iterationsRaw);
    if (
      algorithm !== passwordAlgorithm ||
      !Number.isSafeInteger(iterations) ||
      iterations < passwordIterations
    ) {
      return false;
    }

    const actual = await pbkdf2(
      password,
      salt,
      iterations,
      passwordKeyLength,
      'sha512',
    );
    const expected = Buffer.from(expectedRaw, 'base64url');

    return (
      actual.byteLength === expected.byteLength &&
      timingSafeEqual(actual, expected)
    );
  }

  createToken(): string {
    return randomBytes(32).toString('base64url');
  }

  createSessionToken(): {
    tokenId: string;
    rawToken: string;
    tokenHash: string;
  } {
    const tokenId = randomUUID();
    const tokenSecret = this.createToken();
    const rawToken = `${tokenId}.${tokenSecret}`;

    return {
      tokenId,
      rawToken,
      tokenHash: this.hashToken(rawToken),
    };
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
