import {
  createHash,
  pbkdf2 as pbkdf2Callback,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import { Injectable } from '@nestjs/common';

const pbkdf2 = promisify(pbkdf2Callback);
const passwordAlgorithm = 'scrypt';
const legacyPasswordAlgorithm = 'pbkdf2_sha512';
const passwordIterations = 310_000;
const passwordKeyLength = 64;
const scryptCost = 32_768;
const scryptBlockSize = 8;
const scryptParallelization = 1;
const scryptMaxMemory = 64 * 1024 * 1024;

function deriveScryptKey(
  password: string,
  salt: string,
  keyLength: number,
  options: {
    N: number;
    r: number;
    p: number;
    maxmem: number;
  },
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });
}

@Injectable()
export class AdminCryptoService {
  async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('base64url');
    const key = await deriveScryptKey(password, salt, passwordKeyLength, {
      N: scryptCost,
      r: scryptBlockSize,
      p: scryptParallelization,
      maxmem: scryptMaxMemory,
    });

    return [
      passwordAlgorithm,
      scryptCost.toString(),
      scryptBlockSize.toString(),
      scryptParallelization.toString(),
      salt,
      key.toString('base64url'),
    ].join('$');
  }

  async hashLegacyPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('base64url');
    const key = await pbkdf2(
      password,
      salt,
      passwordIterations,
      passwordKeyLength,
      'sha512',
    );

    return [
      legacyPasswordAlgorithm,
      passwordIterations.toString(),
      salt,
      key.toString('base64url'),
    ].join('$');
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    if (hash.startsWith(`${passwordAlgorithm}$`)) {
      return this.verifyScryptPassword(password, hash);
    }

    return this.verifyLegacyPassword(password, hash);
  }

  needsPasswordRehash(hash: string): boolean {
    return !hash.startsWith(`${passwordAlgorithm}$`);
  }

  private async verifyScryptPassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    const parts = hash.split('$');
    if (parts.length !== 6) {
      return false;
    }

    const [
      algorithm,
      costRaw,
      blockSizeRaw,
      parallelizationRaw,
      salt,
      expectedRaw,
    ] = parts;
    const cost = Number(costRaw);
    const blockSize = Number(blockSizeRaw);
    const parallelization = Number(parallelizationRaw);
    if (
      algorithm !== passwordAlgorithm ||
      !Number.isSafeInteger(cost) ||
      !Number.isSafeInteger(blockSize) ||
      !Number.isSafeInteger(parallelization) ||
      cost < scryptCost ||
      blockSize !== scryptBlockSize ||
      parallelization !== scryptParallelization
    ) {
      return false;
    }

    const actual = await deriveScryptKey(password, salt, passwordKeyLength, {
      N: cost,
      r: blockSize,
      p: parallelization,
      maxmem: scryptMaxMemory,
    });
    const expected = Buffer.from(expectedRaw, 'base64url');

    return (
      actual.byteLength === expected.byteLength &&
      timingSafeEqual(actual, expected)
    );
  }

  private async verifyLegacyPassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    const parts = hash.split('$');
    if (parts.length !== 4) {
      return false;
    }

    const [algorithm, iterationsRaw, salt, expectedRaw] = parts;
    const iterations = Number(iterationsRaw);
    if (
      algorithm !== legacyPasswordAlgorithm ||
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

  createRecoveryCode(): string {
    const raw = randomBytes(6).toString('hex').toUpperCase();

    return raw.match(/.{1,4}/g)?.join('-') ?? raw;
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
