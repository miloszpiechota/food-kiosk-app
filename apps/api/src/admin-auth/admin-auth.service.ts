import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
  validatePassword,
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
  ConfirmInviteRequest,
  ConfirmInviteResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  InviteAdminUserRequest,
  InviteAdminUserResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  VerifyBootstrapTwoFactorRequest,
  VerifyTwoFactorRequest,
} from './admin-auth.types';
import { TotpService } from './totp.service';

const challengeTtlMs = 5 * 60 * 1000;
const inviteTtlMs = 7 * 24 * 60 * 60 * 1000;
const passwordResetTtlMs = 30 * 60 * 1000;
const sessionTtlMs = 8 * 60 * 60 * 1000;
const maxTotpAttempts = 5;

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

@Injectable()
export class AdminAuthService {
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

    return this.prisma.$transaction(async (transaction) => {
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

      return this.createAuthenticatedResponse(activatedUser, transaction);
    });
  }

  async login(request: LoginRequest): Promise<LoginResponse> {
    const email = normalizeEmail(request.email);
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

    if (
      !user ||
      !user.isActive ||
      !(await this.crypto.verifyPassword(password, user.passwordHash))
    ) {
      throw this.invalidCredentials();
    }

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

      return {
        status: 'MFA_REQUIRED',
        challengeToken,
        expiresAt: expiresAt.toISOString(),
      };
    }

    return this.createAuthenticatedResponse(user);
  }

  async verifyTwoFactor(
    request: VerifyTwoFactorRequest,
  ): Promise<AuthenticatedAdminResponse> {
    const challengeToken = validateToken(
      request.challengeToken,
      'ADMIN_CHALLENGE_INVALID',
      'A valid login challenge token is required.',
    );
    const code = validateTotpCode(request.code);
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

    const secret = challenge.adminUser.twoFactorSecret;
    if (!secret || !this.totp.verify(secret, code)) {
      await this.prisma.adminLoginChallenge.update({
        where: { id: challenge.id },
        data: { attemptCount: { increment: 1 } },
      });
      throw this.invalidChallenge();
    }

    const user = challenge.adminUser;
    const response = await this.prisma.$transaction(async (transaction) => {
      await transaction.adminLoginChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: new Date() },
      });

      return this.createAuthenticatedResponse(user, transaction);
    });

    return response;
  }

  async confirmInvite(
    request: ConfirmInviteRequest,
  ): Promise<ConfirmInviteResponse> {
    const inviteToken = validateToken(
      request.inviteToken,
      'ADMIN_INVITE_TOKEN_INVALID',
      'A valid invite token is required.',
    );
    const invite = await this.prisma.adminInvite.findUnique({
      where: { tokenHash: this.crypto.hashToken(inviteToken) },
    });

    if (!invite || invite.acceptedAt || invite.expiresAt <= new Date()) {
      throw new BadRequestException({
        code: 'ADMIN_INVITE_INVALID',
        message: 'The admin invite is invalid or expired.',
      });
    }

    const user = await this.prisma.$transaction(async (transaction) => {
      await transaction.adminInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });

      return transaction.adminUser.update({
        where: { email: invite.email },
        data: { isActive: true },
        include: this.userSummaryInclude(),
      });
    });

    return { user: this.toUserSummary(user) };
  }

  async inviteAdminUser(
    actor: AdminAuthenticatedSession,
    request: InviteAdminUserRequest,
  ): Promise<InviteAdminUserResponse> {
    this.requireSuperAdmin(actor);

    const email = normalizeEmail(request.email);
    const password = validatePassword(request.password, email);
    const role = validateRole(request.role);
    const restaurantIds = validateRestaurantIds(request.restaurantIds);

    if (role === AdminRole.ADMIN && restaurantIds.length === 0) {
      throw new BadRequestException({
        code: 'ADMIN_RESTAURANT_ACCESS_REQUIRED',
        message: 'Admin users need access to at least one restaurant.',
      });
    }

    await this.assertRestaurantsExist(restaurantIds);

    const inviteToken = this.crypto.createToken();
    const twoFactorSecret = this.totp.createSecret();
    const expiresAt = this.futureDate(inviteTtlMs);
    const passwordHash = await this.crypto.hashPassword(password);

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

      const user = await transaction.adminUser.create({
        data: {
          email,
          passwordHash,
          role,
          twoFactorSecret,
          twoFactorEnabled: true,
          isActive: false,
          restaurantAccess: {
            create: restaurantIds.map((restaurantId) => ({
              restaurantId,
            })),
          },
        },
      });
      const invite = await transaction.adminInvite.create({
        data: {
          email,
          role,
          restaurantId: restaurantIds[0] ?? null,
          tokenHash: this.crypto.hashToken(inviteToken),
          expiresAt,
          createdById: actor.user.id,
        },
      });

      return { invite, user };
    });

    const invitationUrl = this.createAdminUrl('inviteToken', inviteToken);
    const delivery = await this.email.sendInvite({
      email,
      invitationUrl,
      manualTotpSecret: twoFactorSecret,
      previewToken: inviteToken,
    });

    return {
      inviteId: created.invite.id,
      email: created.user.email,
      role: created.user.role,
      expiresAt: expiresAt.toISOString(),
      invitationUrl,
      twoFactorSetup: {
        manualEntryKey: twoFactorSecret,
      },
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
    const user = await this.prisma.adminUser.findUnique({ where: { email } });

    if (!user || !user.isActive) {
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
        data: { passwordHash },
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

    return { passwordReset: true };
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
      data: { lastLoginAt: new Date() },
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
