import { AdminCryptoService } from './admin-crypto.service';

describe('AdminCryptoService', () => {
  const service = new AdminCryptoService();

  it('hashes new passwords with scrypt', async () => {
    const hash = await service.hashPassword('VeryStrong1!');

    expect(hash).toMatch(/^scrypt\$/);
    await expect(service.verifyPassword('VeryStrong1!', hash)).resolves.toBe(
      true,
    );
    expect(service.needsPasswordRehash(hash)).toBe(false);
  });

  it('still verifies legacy PBKDF2 password hashes', async () => {
    const legacyHash = await service.hashLegacyPassword('VeryStrong1!');

    await expect(
      service.verifyPassword('VeryStrong1!', legacyHash),
    ).resolves.toBe(true);
    expect(service.needsPasswordRehash(legacyHash)).toBe(true);
  });

  it('rejects invalid passwords', async () => {
    const hash = await service.hashPassword('VeryStrong1!');

    await expect(service.verifyPassword('WrongPassword1!', hash)).resolves.toBe(
      false,
    );
  });
});
