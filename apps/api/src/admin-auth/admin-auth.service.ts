import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AdminLoginChallengeType, AdminRole, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminCryptoService } from './admin-crypto.service';
import { AdminEmailService } from './admin-email.service';
import {
  normalizeEmail,
  normalizeRecoveryCode,
  validatePassword,
  validateSecondFactorCode,
  validateRestaurantIds,
  validateRole,
  validateToken,
  validateTotpCode,
} from './admin-auth.validation';
import type {
  AdminAuthenticatedSession,
  AdminSessionUser,
  AdminUserSummary,
  AuthenticatedAdminResponse,
  BootstrapSuperAdminRequest,
  BootstrapSuperAdminResponse,
  BootstrapStatusResponse,
  CancelBootstrapSetupRequest,
  CancelBootstrapSetupResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  InviteAdminUserRequest,
  InviteAdminUserResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  RegenerateRecoveryCodesRequest,
  RegenerateRecoveryCodesResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  SetupInviteRequest,
  SetupInviteResponse,
  VerifyBootstrapTwoFactorRequest,
  VerifyInviteTwoFactorRequest,
  VerifyTwoFactorRequest,
} from './admin-auth.types';
import { TotpService } from './totp.service';

const challengeTtlMs = 5 * 60 * 1000;
const inviteTtlMs = 7 * 24 * 60 * 60 * 1000;
const passwordResetTtlMs = 30 * 60 * 1000;
const sessionTtlMs = 8 * 60 * 60 * 1000;
const maxTotpAttempts = 5;
const authRateLimitWindowMs = 15 * 60 * 1000;
const maxLoginAttemptsPerWindow = 10;
const maxPasswordResetRequestsPerWindow = 5;
const maxPasswordFailuresBeforeLockout = 5;
const passwordLockoutMs = 15 * 60 * 1000;
const recoveryCodeCount = 8;

type AdminUserWithAccess = Prisma.AdminUserGetPayload<{
  include: {
    restaurantAccess: {
      include: {
        restaurant: true;
      };
    };
  };
}>;

type AdminLoginChallengeWithUser = Prisma.AdminLoginChallengeGetPayload<{
  include: {
    adminUser: true;
  };
}>;

type AdminInviteWithAccess = Prisma.AdminInviteGetPayload<{
  include: {
    access: true;
  };
}>;

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

@Injectable()
export class AdminAuthService {
  private readonly rateLimitBuckets = new Map<string, RateLimitBucket>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: AdminCryptoService,
    private readonly email: AdminEmailService,
    private readonly totp: TotpService,
  ) {}

  async bootstrapSuperAdmin(
    request: BootstrapSuperAdminRequest,
  ): Promise<BootstrapSuperAdminResponse> {
    await this.cleanupExpiredBootstrapSetups();

    const configuredToken = process.env.ADMIN_BOOTSTRAP_TOKEN?.trim();
    if (configuredToken && request.bootstrapToken !== configuredToken) {
      throw new ForbiddenException({
        code: 'ADMIN_BOOTSTRAP_FORBIDDEN',
        message: 'The bootstrap token is invalid.',
      });
    }

    const existingAdminCount = await this.prisma.adminUser.count();
    if (existingAdminCount > 0) {
      throw new ConflictException({
        code: 'ADMIN_BOOTSTRAP_CLOSED',
        message: 'A super admin can only be bootstrapped before admins exist.',
      });
    }

    const email = normalizeEmail(request.email);
    const password = validatePassword(request.password, email);
    const twoFactorSecret = this.totp.createSecret();
    const setupToken = this.crypto.createToken();
    const expiresAt = this.futureDate(challengeTtlMs);
    const passwordHash = await this.crypto.hashPassword(password);
    const user = await this.prisma.$transaction(async (transaction) => {
      const createdUser = await transaction.adminUser.create({
        data: {
          email,
          passwordHash,
          role: AdminRole.SUPER_ADMIN,
          twoFactorSecret,
          twoFactorEnabled: false,
          isActive: false,
        },
        include: this.userSummaryInclude(),
      });
      await transaction.adminLoginChallenge.create({
        data: {
          adminUserId: createdUser.id,
          tokenHash: this.crypto.hashToken(setupToken),
          challengeType: AdminLoginChallengeType.TOTP,
          expiresAt,
        },
      });

      return createdUser;
    });

    return {
      user: this.toUserSummary(user),
      setupToken,
      expiresAt: expiresAt.toISOString(),
      twoFactorSetup: {
        manualEntryKey: twoFactorSecret,
        provisioningUri: this.totp.createProvisioningUri({
          accountName: email,
          issuer: 'KioskPlatform',
          secret: twoFactorSecret,
        }),
      },
    };
  }

  async getBootstrapStatus(): Promise<BootstrapStatusResponse> {
    await this.cleanupExpiredBootstrapSetups();
    const existingAdminCount = await this.prisma.adminUser.count();

    return { canBootstrap: existingAdminCount === 0 };
  }

  async cancelBootstrapSetup(
    request: CancelBootstrapSetupRequest,
  ): Promise<CancelBootstrapSetupResponse> {
    const setupToken = validateToken(
      request.setupToken,
      'ADMIN_BOOTSTRAP_SETUP_TOKEN_INVALID',
      'A valid bootstrap setup token is required.',
    );
    const challenge = await this.prisma.adminLoginChallenge.findUnique({
      where: { tokenHash: this.crypto.hashToken(setupToken) },
      include: { adminUser: true },
    });

    if (!this.isPendingBootstrapChallenge(challenge)) {
      throw new BadRequestException({
        code: 'ADMIN_BOOTSTRAP_SETUP_TOKEN_INVALID',
        message: 'The bootstrap setup token is invalid or expired.',
      });
    }

    await this.prisma.adminUser.delete({
      where: { id: challenge.adminUserId },
    });

    return { canceled: true };
  }

  async verifyBootstrapTwoFactor(
    request: VerifyBootstrapTwoFactorRequest,
  ): Promise<AuthenticatedAdminResponse> {
    await this.cleanupExpiredBootstrapSetups();

    const setupToken = validateToken(
      request.setupToken,
      'ADMIN_BOOTSTRAP_SETUP_TOKEN_INVALID',
      'A valid bootstrap setup token is required.',
    );
    const code = validateTotpCode(request.code);
    const challenge = await this.prisma.adminLoginChallenge.findUnique({
      where: { tokenHash: this.crypto.hashToken(setupToken) },
      include: {
        adminUser: {
          include: {
            restaurantAccess: {
              include: {
                restaurant: true,
              },
            },
          },
        },
      },
    });

    if (!this.isPendingBootstrapChallenge(challenge)) {
      throw this.invalidChallenge();
    }

    const secret = challenge.adminUser.twoFactorSecret;
    if (!secret || !this.totp.verify(secret, code)) {
      await this.prisma.adminLoginChallenge.update({
        where: { id: challenge.id },
        data: { attemptCount: { increment: 1 } },
      });
      throw this.invalidChallenge();
    }

    const response = await this.prisma.$transaction(async (transaction) => {
      await transaction.adminLoginChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: new Date() },
      });
      const activatedUser = await transaction.adminUser.update({
        where: { id: challenge.adminUserId },
        data: {
          isActive: true,
          twoFactorEnabled: true,
        },
        include: this.userSummaryInclude(),
      });
      const recoveryCodes = await this.createRecoveryCodes(
        activatedUser.id,
        transaction,
      );
      const authenticated = await this.createAuthenticatedResponse(
        activatedUser,
        transaction,
      );

      return { ...authenticated, recoveryCodes };
    });

    await this.recordAudit({
      actorAdminUserId: response.user.id,
      action: 'ADMIN_BOOTSTRAP_COMPLETED',
      result: 'SUCCESS',
      targetType: 'ADMIN_USER',
      targetId: response.user.id,
    });

    return response;
  }

  async login(request: LoginRequest): Promise<LoginResponse> {
    const email = normalizeEmail(request.email);
    this.assertRateLimit(
      'login',
      email,
      maxLoginAttemptsPerWindow,
      authRateLimitWindowMs,
    );
    const password = this.readLoginPassword(request.password);
    const user = await this.prisma.adminUser.findUnique({
      where: { email },
      include: {
        restaurantAccess: {
          include: {
            restaurant: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      await this.registerLoginFailure(user ?? null, email);
      throw this.invalidCredentials();
    }

    if (this.isUserLocked(user)) {
      await this.recordAudit({
        actorAdminUserId: user.id,
        action: 'ADMIN_LOGIN_PASSWORD',
        result: 'LOCKED',
        targetType: 'ADMIN_USER',
        targetId: user.id,
      });
      throw this.invalidCredentials();
    }

    if (!(await this.crypto.verifyPassword(password, user.passwordHash))) {
      await this.registerLoginFailure(user, email);
      throw this.invalidCredentials();
    }

    if (this.crypto.needsPasswordRehash(user.passwordHash)) {
      await this.upgradePasswordHash(user.id, password);
    }
    await this.resetLoginFailures(user.id);

    if (user.twoFactorEnabled) {
      if (!user.twoFactorSecret) {
        throw new ForbiddenException({
          code: 'ADMIN_2FA_NOT_CONFIGURED',
          message: 'Two-factor authentication is required for this account.',
        });
      }

      const challengeToken = this.crypto.createToken();
      const expiresAt = this.futureDate(challengeTtlMs);
      await this.prisma.adminLoginChallenge.create({
        data: {
          adminUserId: user.id,
          tokenHash: this.crypto.hashToken(challengeToken),
          challengeType: AdminLoginChallengeType.TOTP,
          expiresAt,
        },
      });

      await this.recordAudit({
        actorAdminUserId: user.id,
        action: 'ADMIN_LOGIN_PASSWORD',
        result: 'MFA_REQUIRED',
        targetType: 'ADMIN_USER',
        targetId: user.id,
      });

      return {
        status: 'MFA_REQUIRED',
        challengeToken,
        expiresAt: expiresAt.toISOString(),
      };
    }

    const response = await this.createAuthenticatedResponse(user);
    await this.recordAudit({
      actorAdminUserId: user.id,
      action: 'ADMIN_LOGIN',
      result: 'SUCCESS',
      targetType: 'ADMIN_USER',
      targetId: user.id,
    });

    return response;
  }

  async verifyTwoFactor(
    request: VerifyTwoFactorRequest,
  ): Promise<AuthenticatedAdminResponse> {
    const challengeToken = validateToken(
      request.challengeToken,
      'ADMIN_CHALLENGE_INVALID',
      'A valid login challenge token is required.',
    );
    const code = validateSecondFactorCode(request.code);
    const challenge = await this.prisma.adminLoginChallenge.findUnique({
      where: { tokenHash: this.crypto.hashToken(challengeToken) },
      include: {
        adminUser: {
          include: {
            restaurantAccess: {
              include: {
                restaurant: true,
              },
            },
          },
        },
      },
    });

    if (
      !challenge ||
      challenge.challengeType !== AdminLoginChallengeType.TOTP ||
      challenge.consumedAt ||
      challenge.expiresAt <= new Date() ||
      !challenge.adminUser.isActive ||
      challenge.attemptCount >= maxTotpAttempts
    ) {
      throw this.invalidChallenge();
    }

    const secondFactor = await this.verifyLoginSecondFactor(
      challenge.adminUser,
      code,
    );
    if (!secondFactor.valid) {
      await this.prisma.adminLoginChallenge.update({
        where: { id: challenge.id },
        data: { attemptCount: { increment: 1 } },
      });
      await this.recordAudit({
        actorAdminUserId: challenge.adminUserId,
        action: 'ADMIN_LOGIN_2FA',
        result:
          challenge.attemptCount + 1 >= maxTotpAttempts ? 'LOCKED' : 'FAILED',
        targetType: 'ADMIN_USER',
        targetId: challenge.adminUserId,
      });
      throw this.invalidChallenge();
    }

    const user = challenge.adminUser;
    const response = await this.prisma.$transaction(async (transaction) => {
      await transaction.adminLoginChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: new Date() },
      });
      if (secondFactor.recoveryCodeId) {
        await transaction.adminRecoveryCode.update({
          where: { id: secondFactor.recoveryCodeId },
          data: { consumedAt: new Date() },
        });
      }

      return this.createAuthenticatedResponse(user, transaction);
    });

    await this.recordAudit({
      actorAdminUserId: user.id,
      action: secondFactor.recoveryCodeId
        ? 'ADMIN_LOGIN_RECOVERY_CODE'
        : 'ADMIN_LOGIN_2FA',
      result: 'SUCCESS',
      targetType: 'ADMIN_USER',
      targetId: user.id,
    });

    return response;
  }

  async setupInvite(request: SetupInviteRequest): Promise<SetupInviteResponse> {
    await this.cleanupExpiredInviteSetups();

    const inviteToken = validateToken(
      request.inviteToken,
      'ADMIN_INVITE_TOKEN_INVALID',
      'A valid invite token is required.',
    );
    const invite = await this.prisma.adminInvite.findUnique({
      where: { tokenHash: this.crypto.hashToken(inviteToken) },
      include: {
        access: true,
      },
    });

    if (!this.isUsableInvite(invite)) {
      throw new BadRequestException({
        code: 'ADMIN_INVITE_INVALID',
        message: 'The admin invite is invalid or expired.',
      });
    }

    const password = validatePassword(request.password, invite.email);
    const passwordHash = await this.crypto.hashPassword(password);
    const twoFactorSecret = this.totp.createSecret();
    const setupToken = this.crypto.createToken();
    const expiresAt = this.futureDate(challengeTtlMs);

    const user = await this.prisma.$transaction(async (transaction) => {
      const existingUser = await transaction.adminUser.findUnique({
        where: { email: invite.email },
      });
      if (existingUser?.isActive) {
        throw new ConflictException({
          code: 'ADMIN_EMAIL_ALREADY_EXISTS',
          message: 'An admin user with this email already exists.',
        });
      }
      if (existingUser) {
        await transaction.adminUser.delete({ where: { id: existingUser.id } });
      }

      const createdUser = await transaction.adminUser.create({
        data: {
          email: invite.email,
          passwordHash,
          role: invite.role,
          twoFactorSecret,
          twoFactorEnabled: false,
          isActive: false,
          restaurantAccess: {
            create: invite.access.map((access) => ({
              restaurantId: access.restaurantId,
            })),
          },
        },
        include: this.userSummaryInclude(),
      });
      await transaction.adminLoginChallenge.create({
        data: {
          adminUserId: createdUser.id,
          tokenHash: this.crypto.hashToken(setupToken),
          challengeType: AdminLoginChallengeType.TOTP,
          expiresAt,
        },
      });

      return createdUser;
    });

    await this.recordAudit({
      actorAdminUserId: user.id,
      action: 'ADMIN_INVITE_SETUP_STARTED',
      result: 'SUCCESS',
      targetType: 'ADMIN_INVITE',
      targetId: invite.id,
    });

    return {
      user: this.toUserSummary(user),
      setupToken,
      expiresAt: expiresAt.toISOString(),
      twoFactorSetup: {
        manualEntryKey: twoFactorSecret,
        provisioningUri: this.totp.createProvisioningUri({
          accountName: invite.email,
          issuer: 'KioskPlatform',
          secret: twoFactorSecret,
        }),
      },
    };
  }

  async verifyInviteTwoFactor(
    request: VerifyInviteTwoFactorRequest,
  ): Promise<AuthenticatedAdminResponse> {
    await this.cleanupExpiredInviteSetups();

    const setupToken = validateToken(
      request.setupToken,
      'ADMIN_INVITE_SETUP_TOKEN_INVALID',
      'A valid invite setup token is required.',
    );
    const code = validateTotpCode(request.code);
    const challenge = await this.prisma.adminLoginChallenge.findUnique({
      where: { tokenHash: this.crypto.hashToken(setupToken) },
      include: {
        adminUser: {
          include: {
            restaurantAccess: {
              include: {
                restaurant: true,
              },
            },
          },
        },
      },
    });

    if (!this.isPendingInviteChallenge(challenge)) {
      throw this.invalidChallenge();
    }

    const secret = challenge.adminUser.twoFactorSecret;
    if (!secret || !this.totp.verify(secret, code)) {
      await this.prisma.adminLoginChallenge.update({
        where: { id: challenge.id },
        data: { attemptCount: { increment: 1 } },
      });
      throw this.invalidChallenge();
    }

    const response = await this.prisma.$transaction(async (transaction) => {
      await transaction.adminLoginChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: new Date() },
      });
      const invite = await transaction.adminInvite.findFirst({
        where: {
          email: challenge.adminUser.email,
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (!invite) {
        throw new BadRequestException({
          code: 'ADMIN_INVITE_INVALID',
          message: 'The admin invite is invalid or expired.',
        });
      }
      await transaction.adminInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });
      const activatedUser = await transaction.adminUser.update({
        where: { id: challenge.adminUserId },
        data: {
          isActive: true,
          twoFactorEnabled: true,
        },
        include: this.userSummaryInclude(),
      });
      const recoveryCodes = await this.createRecoveryCodes(
        activatedUser.id,
        transaction,
      );
      const authenticated = await this.createAuthenticatedResponse(
        activatedUser,
        transaction,
      );

      return { ...authenticated, recoveryCodes };
    });

    await this.recordAudit({
      actorAdminUserId: response.user.id,
      action: 'ADMIN_INVITE_ACCEPTED',
      result: 'SUCCESS',
      targetType: 'ADMIN_USER',
      targetId: response.user.id,
    });

    return response;
  }

  async inviteAdminUser(
    actor: AdminAuthenticatedSession,
    request: InviteAdminUserRequest,
  ): Promise<InviteAdminUserResponse> {
    this.requireSuperAdmin(actor);

    const email = normalizeEmail(request.email);
    const role = validateRole(request.role);
    const restaurantIds = validateRestaurantIds(request.restaurantIds);

    if (role !== AdminRole.ADMIN) {
      throw new BadRequestException({
        code: 'ADMIN_INVITE_ROLE_INVALID',
        message: 'Only restaurant admin users can be invited from this flow.',
      });
    }

    if (restaurantIds.length === 0) {
      throw new BadRequestException({
        code: 'ADMIN_RESTAURANT_ACCESS_REQUIRED',
        message: 'Admin users need access to at least one restaurant.',
      });
    }

    await this.assertRestaurantsExist(restaurantIds);

    const inviteToken = this.crypto.createToken();
    const expiresAt = this.futureDate(inviteTtlMs);

    const created = await this.prisma.$transaction(async (transaction) => {
      const existingUser = await transaction.adminUser.findUnique({
        where: { email },
      });
      if (existingUser) {
        throw new ConflictException({
          code: 'ADMIN_EMAIL_ALREADY_EXISTS',
          message: 'An admin user with this email already exists.',
        });
      }

      const invite = await transaction.adminInvite.create({
        data: {
          email,
          role,
          restaurantId: restaurantIds[0] ?? null,
          tokenHash: this.crypto.hashToken(inviteToken),
          expiresAt,
          createdById: actor.user.id,
          access: {
            create: restaurantIds.map((restaurantId) => ({
              restaurantId,
            })),
          },
        },
      });

      return { invite };
    });

    const invitationUrl = this.createAdminUrl('inviteToken', inviteToken);
    const delivery = await this.email.sendInvite({
      email,
      invitationUrl,
      previewToken: inviteToken,
    });

    await this.recordAudit({
      actorAdminUserId: actor.user.id,
      action: 'ADMIN_INVITE_CREATED',
      result: 'SUCCESS',
      targetType: 'ADMIN_INVITE',
      targetId: created.invite.id,
      metadata: {
        email,
        role,
        restaurantIds,
      },
    });

    return {
      inviteId: created.invite.id,
      email,
      role,
      expiresAt: expiresAt.toISOString(),
      invitationUrl,
      delivery,
    };
  }

  async listAdminUsers(
    actor: AdminAuthenticatedSession,
  ): Promise<{ users: AdminUserSummary[] }> {
    this.requireSuperAdmin(actor);

    const users = await this.prisma.adminUser.findMany({
      orderBy: [{ role: 'asc' }, { email: 'asc' }],
      include: this.userSummaryInclude(),
    });

    return { users: users.map((user) => this.toUserSummary(user)) };
  }

  async listRestaurants(actor: AdminAuthenticatedSession): Promise<{
    restaurants: Array<{
      id: string;
      name: string;
      slug: string;
      isActive: boolean;
    }>;
  }> {
    const restaurants = await this.prisma.restaurant.findMany({
      where:
        actor.user.role === AdminRole.SUPER_ADMIN
          ? undefined
          : { id: { in: actor.user.restaurantIds } },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
      },
    });

    return { restaurants };
  }

  async forgotPassword(
    request: ForgotPasswordRequest,
  ): Promise<ForgotPasswordResponse> {
    const email = normalizeEmail(request.email);
    this.assertRateLimit(
      'forgot-password',
      email,
      maxPasswordResetRequestsPerWindow,
      authRateLimitWindowMs,
    );
    this.recordRateLimitHit('forgot-password', email, authRateLimitWindowMs);
    const user = await this.prisma.adminUser.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      await this.recordAudit({
        action: 'ADMIN_PASSWORD_RESET_REQUESTED',
        result: 'ACCEPTED',
        metadata: { email, existingUser: false },
      });
      return {
        accepted: true,
        delivery: { channel: 'console' },
      };
    }

    const resetToken = this.crypto.createToken();
    const expiresAt = this.futureDate(passwordResetTtlMs);
    await this.prisma.adminPasswordResetToken.create({
      data: {
        adminUserId: user.id,
        tokenHash: this.crypto.hashToken(resetToken),
        expiresAt,
      },
    });

    const delivery = await this.email.sendPasswordReset({
      email,
      resetUrl: this.createAdminUrl('resetToken', resetToken),
      previewToken: resetToken,
    });

    await this.recordAudit({
      actorAdminUserId: user.id,
      action: 'ADMIN_PASSWORD_RESET_REQUESTED',
      result: 'ACCEPTED',
      targetType: 'ADMIN_USER',
      targetId: user.id,
    });

    return { accepted: true, delivery };
  }

  async resetPassword(
    request: ResetPasswordRequest,
  ): Promise<ResetPasswordResponse> {
    const resetToken = validateToken(
      request.resetToken,
      'ADMIN_RESET_TOKEN_INVALID',
      'A valid password reset token is required.',
    );
    const reset = await this.prisma.adminPasswordResetToken.findUnique({
      where: { tokenHash: this.crypto.hashToken(resetToken) },
      include: { adminUser: true },
    });

    if (
      !reset ||
      reset.consumedAt ||
      reset.expiresAt <= new Date() ||
      !reset.adminUser.isActive
    ) {
      throw new BadRequestException({
        code: 'ADMIN_RESET_TOKEN_INVALID',
        message: 'The password reset token is invalid or expired.',
      });
    }

    const password = validatePassword(request.password, reset.adminUser.email);
    const passwordHash = await this.crypto.hashPassword(password);

    await this.prisma.$transaction(async (transaction) => {
      await transaction.adminUser.update({
        where: { id: reset.adminUserId },
        data: { passwordHash, failedLoginCount: 0, lockedUntil: null },
      });
      await transaction.adminPasswordResetToken.update({
        where: { id: reset.id },
        data: { consumedAt: new Date() },
      });
      await transaction.adminSession.updateMany({
        where: {
          adminUserId: reset.adminUserId,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    });

    await this.recordAudit({
      actorAdminUserId: reset.adminUserId,
      action: 'ADMIN_PASSWORD_RESET_COMPLETED',
      result: 'SUCCESS',
      targetType: 'ADMIN_USER',
      targetId: reset.adminUserId,
    });

    return { passwordReset: true };
  }

  async regenerateRecoveryCodes(
    actor: AdminAuthenticatedSession,
    request: RegenerateRecoveryCodesRequest,
  ): Promise<RegenerateRecoveryCodesResponse> {
    const password = this.readLoginPassword(request.password);
    const code = validateTotpCode(request.code);
    const user = await this.prisma.adminUser.findUnique({
      where: { id: actor.user.id },
      include: this.userSummaryInclude(),
    });

    if (
      !user ||
      !user.isActive ||
      !user.twoFactorSecret ||
      !(await this.crypto.verifyPassword(password, user.passwordHash)) ||
      !this.totp.verify(user.twoFactorSecret, code)
    ) {
      await this.recordAudit({
        actorAdminUserId: actor.user.id,
        action: 'ADMIN_RECOVERY_CODES_REGENERATE',
        result: 'FAILED',
        targetType: 'ADMIN_USER',
        targetId: actor.user.id,
      });
      throw new ForbiddenException({
        code: 'ADMIN_RECOVERY_CODES_FORBIDDEN',
        message: 'Password or two-factor code is invalid.',
      });
    }

    const recoveryCodes = await this.prisma.$transaction(
      async (transaction) => {
        await transaction.adminRecoveryCode.updateMany({
          where: {
            adminUserId: user.id,
            consumedAt: null,
          },
          data: { consumedAt: new Date() },
        });

        return this.createRecoveryCodes(user.id, transaction);
      },
    );

    await this.recordAudit({
      actorAdminUserId: user.id,
      action: 'ADMIN_RECOVERY_CODES_REGENERATE',
      result: 'SUCCESS',
      targetType: 'ADMIN_USER',
      targetId: user.id,
    });

    return { recoveryCodes };
  }

  async getSession(
    rawToken: string | undefined,
  ): Promise<AdminAuthenticatedSession | null> {
    if (!rawToken?.trim()) {
      return null;
    }

    const session = await this.prisma.adminSession.findUnique({
      where: { tokenHash: this.crypto.hashToken(rawToken.trim()) },
      include: {
        adminUser: {
          include: {
            restaurantAccess: {
              include: {
                restaurant: true,
              },
            },
          },
        },
      },
    });

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      !session.adminUser.isActive
    ) {
      return null;
    }

    return {
      sessionId: session.id,
      tokenId: session.tokenId,
      user: this.toSessionUser(session.adminUser),
      expiresAt: session.expiresAt,
    };
  }

  me(session: AdminAuthenticatedSession): { user: AdminSessionUser } {
    return { user: session.user };
  }

  async logout(session: AdminAuthenticatedSession): Promise<LogoutResponse> {
    await this.prisma.adminSession.update({
      where: { id: session.sessionId },
      data: { revokedAt: new Date() },
    });

    return { loggedOut: true };
  }

  private assertRateLimit(
    scope: string,
    key: string,
    maxAttempts: number,
    windowMs: number,
  ): void {
    const bucket = this.getRateLimitBucket(scope, key, windowMs);
    if (bucket.count >= maxAttempts) {
      throw new HttpException(
        {
          code: 'ADMIN_RATE_LIMITED',
          message: 'Too many admin requests. Try again later.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private recordRateLimitHit(
    scope: string,
    key: string,
    windowMs: number,
  ): void {
    const bucket = this.getRateLimitBucket(scope, key, windowMs);
    bucket.count += 1;
  }

  private getRateLimitBucket(
    scope: string,
    key: string,
    windowMs: number,
  ): RateLimitBucket {
    const now = Date.now();
    const bucketKey = `${scope}:${key}`;
    const existing = this.rateLimitBuckets.get(bucketKey);
    if (existing && existing.resetAt > now) {
      return existing;
    }

    const bucket = { count: 0, resetAt: now + windowMs };
    this.rateLimitBuckets.set(bucketKey, bucket);

    return bucket;
  }

  private async registerLoginFailure(
    user: { id: string; failedLoginCount?: number | null } | null,
    email: string,
  ): Promise<void> {
    this.recordRateLimitHit('login', email, authRateLimitWindowMs);
    if (!user) {
      await this.recordAudit({
        action: 'ADMIN_LOGIN_PASSWORD',
        result: 'FAILED',
        metadata: { email, existingUser: false },
      });
      return;
    }

    const failedLoginCount = (user.failedLoginCount ?? 0) + 1;
    const lockedUntil =
      failedLoginCount >= maxPasswordFailuresBeforeLockout
        ? this.futureDate(passwordLockoutMs)
        : null;
    await this.prisma.adminUser.update({
      where: { id: user.id },
      data: { failedLoginCount, lockedUntil },
    });
    await this.recordAudit({
      actorAdminUserId: user.id,
      action: 'ADMIN_LOGIN_PASSWORD',
      result: lockedUntil ? 'LOCKED' : 'FAILED',
      targetType: 'ADMIN_USER',
      targetId: user.id,
    });
  }

  private async resetLoginFailures(userId: string): Promise<void> {
    await this.prisma.adminUser.update({
      where: { id: userId },
      data: { failedLoginCount: 0, lockedUntil: null },
    });
  }

  private async upgradePasswordHash(
    adminUserId: string,
    password: string,
  ): Promise<void> {
    await this.prisma.adminUser.update({
      where: { id: adminUserId },
      data: { passwordHash: await this.crypto.hashPassword(password) },
    });
  }

  private isUserLocked(user: { lockedUntil?: Date | null }): boolean {
    return Boolean(user.lockedUntil && user.lockedUntil > new Date());
  }

  private async verifyLoginSecondFactor(
    user: { id: string; twoFactorSecret: string | null },
    code: string,
  ): Promise<{ valid: boolean; recoveryCodeId?: string }> {
    if (/^\d{6}$/.test(code) && user.twoFactorSecret) {
      return { valid: this.totp.verify(user.twoFactorSecret, code) };
    }

    const recoveryCode = normalizeRecoveryCode(code);
    const recovery = await this.prisma.adminRecoveryCode.findFirst({
      where: {
        adminUserId: user.id,
        codeHash: this.crypto.hashToken(recoveryCode),
        consumedAt: null,
      },
      select: { id: true },
    });

    return recovery
      ? { valid: true, recoveryCodeId: recovery.id }
      : { valid: false };
  }

  private async createRecoveryCodes(
    adminUserId: string,
    client: PrismaService | Prisma.TransactionClient,
  ): Promise<string[]> {
    const recoveryCodes = Array.from({ length: recoveryCodeCount }, () =>
      this.crypto.createRecoveryCode(),
    );
    await client.adminRecoveryCode.createMany({
      data: recoveryCodes.map((code) => ({
        adminUserId,
        codeHash: this.crypto.hashToken(normalizeRecoveryCode(code)),
      })),
    });

    return recoveryCodes;
  }

  private async createAuthenticatedResponse(
    user: AdminUserWithAccess,
    client: PrismaService | Prisma.TransactionClient = this.prisma,
  ): Promise<AuthenticatedAdminResponse> {
    const sessionToken = this.crypto.createSessionToken();
    const expiresAt = this.futureDate(sessionTtlMs);
    await client.adminSession.create({
      data: {
        adminUserId: user.id,
        tokenId: sessionToken.tokenId,
        tokenHash: sessionToken.tokenHash,
        expiresAt,
      },
    });
    await client.adminUser.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lastLoginAt: new Date(),
        lockedUntil: null,
      },
    });

    return {
      status: 'AUTHENTICATED',
      sessionToken: sessionToken.rawToken,
      expiresAt: expiresAt.toISOString(),
      user: this.toSessionUser(user),
    };
  }

  private async assertRestaurantsExist(restaurantIds: string[]): Promise<void> {
    if (restaurantIds.length === 0) {
      return;
    }

    const restaurants = await this.prisma.restaurant.findMany({
      where: { id: { in: restaurantIds } },
      select: { id: true },
    });
    if (restaurants.length !== restaurantIds.length) {
      throw new NotFoundException({
        code: 'ADMIN_RESTAURANT_NOT_FOUND',
        message: 'One or more restaurants were not found.',
      });
    }
  }

  private requireSuperAdmin(actor: AdminAuthenticatedSession): void {
    if (actor.user.role !== AdminRole.SUPER_ADMIN) {
      throw new ForbiddenException({
        code: 'ADMIN_SUPER_ADMIN_REQUIRED',
        message: 'Only a super admin can perform this action.',
      });
    }
  }

  private readLoginPassword(value: unknown): string {
    if (typeof value !== 'string' || value.length < 1 || value.length > 128) {
      throw this.invalidCredentials();
    }

    return value;
  }

  private invalidCredentials(): UnauthorizedException {
    return new UnauthorizedException({
      code: 'ADMIN_CREDENTIALS_INVALID',
      message: 'Invalid email or password.',
    });
  }

  private invalidChallenge(): UnauthorizedException {
    return new UnauthorizedException({
      code: 'ADMIN_2FA_INVALID',
      message: 'The 2FA challenge or code is invalid.',
    });
  }

  private isPendingBootstrapChallenge(
    challenge: AdminLoginChallengeWithUser | null,
  ): challenge is AdminLoginChallengeWithUser {
    return Boolean(
      challenge &&
      challenge.challengeType === AdminLoginChallengeType.TOTP &&
      !challenge.consumedAt &&
      challenge.expiresAt > new Date() &&
      challenge.attemptCount < maxTotpAttempts &&
      challenge.adminUser.role === AdminRole.SUPER_ADMIN &&
      !challenge.adminUser.isActive &&
      !challenge.adminUser.twoFactorEnabled,
    );
  }

  private isPendingInviteChallenge(
    challenge:
      | (AdminLoginChallengeWithUser & {
          adminUser: AdminLoginChallengeWithUser['adminUser'] & {
            restaurantAccess?: unknown[];
          };
        })
      | null,
  ): challenge is AdminLoginChallengeWithUser & {
    adminUser: AdminLoginChallengeWithUser['adminUser'] & {
      restaurantAccess: unknown[];
    };
  } {
    return Boolean(
      challenge &&
      challenge.challengeType === AdminLoginChallengeType.TOTP &&
      !challenge.consumedAt &&
      challenge.expiresAt > new Date() &&
      challenge.attemptCount < maxTotpAttempts &&
      challenge.adminUser.role === AdminRole.ADMIN &&
      !challenge.adminUser.isActive &&
      !challenge.adminUser.twoFactorEnabled,
    );
  }

  private isUsableInvite(
    invite: AdminInviteWithAccess | null,
  ): invite is AdminInviteWithAccess {
    return Boolean(
      invite &&
      !invite.acceptedAt &&
      invite.expiresAt > new Date() &&
      invite.role === AdminRole.ADMIN &&
      invite.access.length > 0,
    );
  }

  private async recordAudit(input: {
    actorAdminUserId?: string;
    action: string;
    result: string;
    targetType?: string;
    targetId?: string;
    metadata?: Prisma.InputJsonValue;
  }): Promise<void> {
    await this.prisma.adminAuditLog
      .create({
        data: {
          actorAdminUserId: input.actorAdminUserId,
          action: input.action,
          result: input.result,
          targetType: input.targetType,
          targetId: input.targetId,
          metadata: input.metadata ?? Prisma.JsonNull,
        },
      })
      .catch(() => undefined);
  }

  private async cleanupExpiredBootstrapSetups(): Promise<void> {
    const expiredChallenges = await this.prisma.adminLoginChallenge.findMany({
      where: {
        challengeType: AdminLoginChallengeType.TOTP,
        consumedAt: null,
        expiresAt: { lte: new Date() },
        adminUser: {
          role: AdminRole.SUPER_ADMIN,
          isActive: false,
          twoFactorEnabled: false,
        },
      },
      select: { adminUserId: true },
    });
    const adminUserIds = [
      ...new Set(expiredChallenges.map((challenge) => challenge.adminUserId)),
    ];

    if (adminUserIds.length === 0) {
      return;
    }

    await this.prisma.adminUser.deleteMany({
      where: {
        id: { in: adminUserIds },
        role: AdminRole.SUPER_ADMIN,
        isActive: false,
        twoFactorEnabled: false,
      },
    });
  }

  private async cleanupExpiredInviteSetups(): Promise<void> {
    const expiredChallenges = await this.prisma.adminLoginChallenge.findMany({
      where: {
        challengeType: AdminLoginChallengeType.TOTP,
        consumedAt: null,
        expiresAt: { lte: new Date() },
        adminUser: {
          role: AdminRole.ADMIN,
          isActive: false,
          twoFactorEnabled: false,
        },
      },
      select: { adminUserId: true },
    });
    const adminUserIds = [
      ...new Set(expiredChallenges.map((challenge) => challenge.adminUserId)),
    ];

    if (adminUserIds.length === 0) {
      return;
    }

    await this.prisma.adminUser.deleteMany({
      where: {
        id: { in: adminUserIds },
        role: AdminRole.ADMIN,
        isActive: false,
        twoFactorEnabled: false,
      },
    });
  }

  private createAdminUrl(paramName: string, token: string): string {
    const baseUrl = (
      process.env.ADMIN_PUBLIC_URL ??
      `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/admin-panel`
    ).replace(/\/+$/, '');
    const params = new URLSearchParams({ [paramName]: token });

    return `${baseUrl}?${params.toString()}`;
  }

  private futureDate(durationMs: number): Date {
    return new Date(Date.now() + durationMs);
  }

  private userSummaryInclude() {
    return {
      restaurantAccess: {
        include: {
          restaurant: true,
        },
      },
    } satisfies Prisma.AdminUserInclude;
  }

  private toSessionUser(user: AdminUserWithAccess): AdminSessionUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      restaurantIds: user.restaurantAccess.map((access) => access.restaurantId),
    };
  }

  private toUserSummary(user: AdminUserWithAccess): AdminUserSummary {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      twoFactorEnabled: user.twoFactorEnabled,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      restaurants: user.restaurantAccess.map((access) => ({
        id: access.restaurant.id,
        name: access.restaurant.name,
        slug: access.restaurant.slug,
      })),
    };
  }
}
