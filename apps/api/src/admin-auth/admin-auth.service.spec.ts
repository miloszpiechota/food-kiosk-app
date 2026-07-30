/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { AdminLoginChallengeType, AdminRole } from '@prisma/client';
import { AdminAuthService } from './admin-auth.service';
import { AdminCryptoService } from './admin-crypto.service';
import { AdminEmailService } from './admin-email.service';
import type { AdminAuthenticatedSession } from './admin-auth.types';
import { TotpService } from './totp.service';

function createPrismaMock() {
  const prisma = {
    adminUser: {
      count: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    adminLoginChallenge: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    adminInvite: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    adminPasswordResetToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    adminSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    restaurant: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(
      (callback: (transaction: unknown) => Promise<unknown>) =>
        callback(prisma),
    ),
  };

  return prisma;
}

function createEmailMock(): jest.Mocked<
  Pick<AdminEmailService, 'sendInvite' | 'sendPasswordReset'>
> {
  return {
    sendInvite: jest.fn((input) =>
      Promise.resolve({
        channel: 'console' as const,
        previewToken: input.previewToken,
      }),
    ),
    sendPasswordReset: jest.fn((input) =>
      Promise.resolve({
        channel: 'console' as const,
        previewToken: input.previewToken,
      }),
    ),
  };
}

function createAdminUser(input: {
  email: string;
  passwordHash: string;
  twoFactorSecret?: string;
  isActive?: boolean;
  role?: AdminRole;
}) {
  return {
    id: 'admin-user-1',
    email: input.email,
    passwordHash: input.passwordHash,
    role: input.role ?? AdminRole.ADMIN,
    twoFactorSecret: input.twoFactorSecret ?? 'JBSWY3DPEHPK3PXP',
    twoFactorEnabled: true,
    isActive: input.isActive ?? true,
    lastLoginAt: null,
    createdAt: new Date('2026-07-29T08:00:00.000Z'),
    updatedAt: new Date('2026-07-29T08:00:00.000Z'),
    restaurantAccess: [
      {
        restaurantId: '11111111-1111-4111-8111-111111111111',
        restaurant: {
          id: '11111111-1111-4111-8111-111111111111',
          name: 'Demo Restaurant',
          slug: 'demo',
        },
      },
    ],
  };
}

function createSuperAdminSession(): AdminAuthenticatedSession {
  return {
    sessionId: 'session-1',
    tokenId: '22222222-2222-4222-8222-222222222222',
    expiresAt: new Date(Date.now() + 60_000),
    user: {
      id: 'super-admin-1',
      email: 'owner@example.com',
      role: AdminRole.SUPER_ADMIN,
      restaurantIds: [],
    },
  };
}

function createService() {
  const prisma = createPrismaMock();
  const crypto = new AdminCryptoService();
  const email = createEmailMock();
  const totp = new TotpService();
  const service = new AdminAuthService(
    prisma,
    crypto,
    email as unknown as AdminEmailService,
    totp,
  );
  prisma.adminLoginChallenge.findMany.mockResolvedValue([]);
  prisma.adminUser.deleteMany.mockResolvedValue({ count: 0 });

  return { crypto, email, prisma, service, totp };
}

describe('AdminAuthService', () => {
  it('reports whether first admin bootstrap is available', async () => {
    const { prisma, service } = createService();
    prisma.adminUser.count.mockResolvedValue(0);

    await expect(service.getBootstrapStatus()).resolves.toEqual({
      canBootstrap: true,
    });

    prisma.adminUser.count.mockResolvedValue(1);

    await expect(service.getBootstrapStatus()).resolves.toEqual({
      canBootstrap: false,
    });
  });

  it('bootstraps only the first super admin as pending 2FA setup', async () => {
    const { prisma, service } = createService();
    prisma.adminUser.count.mockResolvedValue(0);
    prisma.adminUser.create.mockImplementation((input) =>
      Promise.resolve({
        ...createAdminUser({
          email: input.data.email,
          passwordHash: input.data.passwordHash,
          role: AdminRole.SUPER_ADMIN,
        }),
        role: input.data.role,
        twoFactorSecret: input.data.twoFactorSecret,
        twoFactorEnabled: input.data.twoFactorEnabled,
        isActive: input.data.isActive,
      }),
    );
    prisma.adminLoginChallenge.create.mockResolvedValue({});

    const response = await service.bootstrapSuperAdmin({
      email: 'Owner@Example.com',
      password: 'VeryStrong1!',
    });

    expect(prisma.adminUser.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'owner@example.com',
          role: AdminRole.SUPER_ADMIN,
          twoFactorEnabled: false,
          isActive: false,
        }),
      }),
    );
    expect(prisma.adminLoginChallenge.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        adminUserId: 'admin-user-1',
        challengeType: AdminLoginChallengeType.TOTP,
      }),
    });
    expect(response.user.role).toBe(AdminRole.SUPER_ADMIN);
    expect(response.setupToken).toBeTruthy();
    expect(response.twoFactorSetup.manualEntryKey).toMatch(/^[A-Z2-7]+$/);
    expect(response.twoFactorSetup.provisioningUri).toContain(
      'otpauth://totp/',
    );
  });

  it('activates the bootstrapped super admin after setup 2FA verification', async () => {
    const { crypto, prisma, service, totp } = createService();
    const setupToken = crypto.createToken();
    const twoFactorSecret = totp.createSecret();
    const code = totp.generateCode(
      twoFactorSecret,
      Math.floor(Date.now() / 1000 / 30),
    );
    const adminUser = createAdminUser({
      email: 'owner@example.com',
      passwordHash: await crypto.hashPassword('VeryStrong1!'),
      role: AdminRole.SUPER_ADMIN,
      twoFactorSecret,
      isActive: false,
    });
    adminUser.twoFactorEnabled = false;
    prisma.adminLoginChallenge.findUnique.mockResolvedValue({
      id: 'challenge-1',
      adminUserId: adminUser.id,
      tokenHash: crypto.hashToken(setupToken),
      challengeType: AdminLoginChallengeType.TOTP,
      attemptCount: 0,
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: null,
      createdAt: new Date(),
      adminUser,
    });
    prisma.adminLoginChallenge.update.mockResolvedValue({});
    prisma.adminUser.update.mockResolvedValue({
      ...adminUser,
      isActive: true,
      twoFactorEnabled: true,
    });
    prisma.adminSession.create.mockResolvedValue({});

    const response = await service.verifyBootstrapTwoFactor({
      setupToken,
      code,
    });

    expect(response.status).toBe('AUTHENTICATED');
    expect(prisma.adminUser.update).toHaveBeenCalledWith({
      where: { id: adminUser.id },
      data: {
        isActive: true,
        twoFactorEnabled: true,
      },
      include: expect.any(Object),
    });
  });

  it('cancels an unfinished bootstrap setup', async () => {
    const { crypto, prisma, service } = createService();
    const setupToken = crypto.createToken();
    const adminUser = createAdminUser({
      email: 'owner@example.com',
      passwordHash: await crypto.hashPassword('VeryStrong1!'),
      role: AdminRole.SUPER_ADMIN,
      isActive: false,
    });
    adminUser.twoFactorEnabled = false;
    prisma.adminLoginChallenge.findUnique.mockResolvedValue({
      id: 'challenge-1',
      adminUserId: adminUser.id,
      tokenHash: crypto.hashToken(setupToken),
      challengeType: AdminLoginChallengeType.TOTP,
      attemptCount: 0,
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: null,
      createdAt: new Date(),
      adminUser,
    });
    prisma.adminUser.delete.mockResolvedValue({});

    await expect(service.cancelBootstrapSetup({ setupToken })).resolves.toEqual(
      { canceled: true },
    );
    expect(prisma.adminUser.delete).toHaveBeenCalledWith({
      where: { id: adminUser.id },
    });
  });

  it('rejects bootstrap when an admin already exists', async () => {
    const { prisma, service } = createService();
    prisma.adminUser.count.mockResolvedValue(1);

    await expect(
      service.bootstrapSuperAdmin({
        email: 'owner@example.com',
        password: 'VeryStrong1!',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects incomplete email domains before creating an admin', async () => {
    const { prisma, service } = createService();
    prisma.adminUser.count.mockResolvedValue(0);

    await expect(
      service.bootstrapSuperAdmin({
        email: 'owner@example.l',
        password: 'VeryStrong1!',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.adminUser.create).not.toHaveBeenCalled();
  });

  it('returns an MFA challenge after a valid email and password login', async () => {
    const { crypto, prisma, service } = createService();
    const passwordHash = await crypto.hashPassword('VeryStrong1!');
    prisma.adminUser.findUnique.mockResolvedValue(
      createAdminUser({
        email: 'admin@example.com',
        passwordHash,
      }),
    );

    const response = await service.login({
      email: 'Admin@Example.com',
      password: 'VeryStrong1!',
    });

    expect(prisma.adminLoginChallenge.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        adminUserId: 'admin-user-1',
        challengeType: AdminLoginChallengeType.TOTP,
      }),
    });
    expect(response.status).toBe('MFA_REQUIRED');
  });

  it('does not reveal whether login failed because email or password is wrong', async () => {
    const { prisma, service } = createService();
    prisma.adminUser.findUnique.mockResolvedValue(null);

    await expect(
      service.login({
        email: 'missing@example.com',
        password: 'AnyPassword1!',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('verifies TOTP and stores only a hashed session token', async () => {
    const { crypto, prisma, service, totp } = createService();
    const challengeToken = crypto.createToken();
    const twoFactorSecret = totp.createSecret();
    const code = totp.generateCode(
      twoFactorSecret,
      Math.floor(Date.now() / 1000 / 30),
    );
    const adminUser = createAdminUser({
      email: 'admin@example.com',
      passwordHash: await crypto.hashPassword('VeryStrong1!'),
      twoFactorSecret,
    });
    prisma.adminLoginChallenge.findUnique.mockResolvedValue({
      id: 'challenge-1',
      adminUserId: adminUser.id,
      tokenHash: crypto.hashToken(challengeToken),
      challengeType: AdminLoginChallengeType.TOTP,
      attemptCount: 0,
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: null,
      createdAt: new Date(),
      adminUser,
    });
    prisma.adminSession.create.mockResolvedValue({});
    prisma.adminUser.update.mockResolvedValue({});
    prisma.adminLoginChallenge.update.mockResolvedValue({});

    const response = await service.verifyTwoFactor({
      challengeToken,
      code,
    });

    expect(response.status).toBe('AUTHENTICATED');
    expect(prisma.adminLoginChallenge.update).toHaveBeenCalledWith({
      where: { id: 'challenge-1' },
      data: { consumedAt: expect.any(Date) },
    });
    expect(prisma.adminSession.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        adminUserId: adminUser.id,
        tokenId: expect.any(String),
        tokenHash: expect.not.stringContaining(response.sessionToken),
      }),
    });
  });

  it('creates inactive invited users with restaurant access and a confirmation token', async () => {
    const { email, prisma, service } = createService();
    const restaurantId = '11111111-1111-4111-8111-111111111111';
    prisma.restaurant.findMany.mockResolvedValue([{ id: restaurantId }]);
    prisma.adminUser.findUnique.mockResolvedValue(null);
    prisma.adminUser.create.mockResolvedValue({
      id: 'new-admin-1',
      email: 'worker@example.com',
      role: AdminRole.ADMIN,
    });
    prisma.adminInvite.create.mockResolvedValue({
      id: 'invite-1',
      email: 'worker@example.com',
      role: AdminRole.ADMIN,
    });

    const response = await service.inviteAdminUser(createSuperAdminSession(), {
      email: 'Worker@Example.com',
      password: 'StrongPass1!',
      role: AdminRole.ADMIN,
      restaurantIds: [restaurantId],
    });

    expect(prisma.adminUser.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'worker@example.com',
        role: AdminRole.ADMIN,
        isActive: false,
        twoFactorEnabled: true,
        restaurantAccess: {
          create: [{ restaurantId }],
        },
      }),
    });
    expect(prisma.adminInvite.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        createdById: 'super-admin-1',
        restaurantId,
      }),
    });
    expect(email.sendInvite).toHaveBeenCalled();
    expect(response.delivery.previewToken).toBeDefined();
  });

  it('lists only assigned restaurants for ordinary admins', async () => {
    const { prisma, service } = createService();
    const adminSession = {
      ...createSuperAdminSession(),
      user: {
        id: 'admin-user-1',
        email: 'worker@example.com',
        role: AdminRole.ADMIN,
        restaurantIds: ['11111111-1111-4111-8111-111111111111'],
      },
    };
    prisma.restaurant.findMany.mockResolvedValue([
      {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Demo Restaurant',
        slug: 'demo',
        isActive: true,
      },
    ]);

    const response = await service.listRestaurants(adminSession);

    expect(prisma.restaurant.findMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: ['11111111-1111-4111-8111-111111111111'],
        },
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
      },
    });
    expect(response.restaurants).toHaveLength(1);
  });

  it('does not create a reset token for unknown forgot-password emails', async () => {
    const { prisma, service } = createService();
    prisma.adminUser.findUnique.mockResolvedValue(null);

    const response = await service.forgotPassword({
      email: 'missing@example.com',
    });

    expect(response).toEqual({
      accepted: true,
      delivery: { channel: 'console' },
    });
    expect(prisma.adminPasswordResetToken.create).not.toHaveBeenCalled();
  });
});
