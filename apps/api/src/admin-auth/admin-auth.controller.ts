import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AdminAuthService } from './admin-auth.service';
import { AdminSessionGuard } from './admin-session.guard';
import type {
  AdminAuthenticatedSession,
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
import { CurrentAdmin } from './current-admin.decorator';
import { SuperAdminGuard } from './super-admin.guard';

@Controller('api/v1/admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Get('bootstrap-status')
  getBootstrapStatus(): Promise<BootstrapStatusResponse> {
    return this.adminAuthService.getBootstrapStatus();
  }

  @Post('bootstrap-super-admin')
  @HttpCode(201)
  bootstrapSuperAdmin(
    @Body() request: BootstrapSuperAdminRequest,
  ): Promise<BootstrapSuperAdminResponse> {
    return this.adminAuthService.bootstrapSuperAdmin(request);
  }

  @Post('verify-bootstrap-2fa')
  @HttpCode(200)
  async verifyBootstrapTwoFactor(
    @Body() request: VerifyBootstrapTwoFactorRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponse> {
    const result =
      await this.adminAuthService.verifyBootstrapTwoFactor(request);
    this.setSessionCookie(response, result.sessionToken, result.expiresAt);

    return result;
  }

  @Post('cancel-bootstrap-setup')
  @HttpCode(200)
  cancelBootstrapSetup(
    @Body() request: CancelBootstrapSetupRequest,
  ): Promise<CancelBootstrapSetupResponse> {
    return this.adminAuthService.cancelBootstrapSetup(request);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() request: LoginRequest): Promise<LoginResponse> {
    return this.adminAuthService.login(request);
  }

  @Post('verify-2fa')
  @HttpCode(200)
  async verifyTwoFactor(
    @Body() request: VerifyTwoFactorRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponse> {
    const result = await this.adminAuthService.verifyTwoFactor(request);
    this.setSessionCookie(response, result.sessionToken, result.expiresAt);

    return result;
  }

  @Post('setup-invite')
  @HttpCode(200)
  setupInvite(
    @Body() request: SetupInviteRequest,
  ): Promise<SetupInviteResponse> {
    return this.adminAuthService.setupInvite(request);
  }

  @Post('verify-invite-2fa')
  @HttpCode(200)
  async verifyInviteTwoFactor(
    @Body() request: VerifyInviteTwoFactorRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponse> {
    const result = await this.adminAuthService.verifyInviteTwoFactor(request);
    this.setSessionCookie(response, result.sessionToken, result.expiresAt);

    return result;
  }

  @Post('forgot-password')
  @HttpCode(202)
  forgotPassword(
    @Body() request: ForgotPasswordRequest,
  ): Promise<ForgotPasswordResponse> {
    return this.adminAuthService.forgotPassword(request);
  }

  @Post('reset-password')
  @HttpCode(200)
  resetPassword(
    @Body() request: ResetPasswordRequest,
  ): Promise<ResetPasswordResponse> {
    return this.adminAuthService.resetPassword(request);
  }

  @Post('recovery-codes/regenerate')
  @HttpCode(200)
  @UseGuards(AdminSessionGuard)
  regenerateRecoveryCodes(
    @CurrentAdmin() admin: AdminAuthenticatedSession,
    @Body() request: RegenerateRecoveryCodesRequest,
  ): Promise<RegenerateRecoveryCodesResponse> {
    return this.adminAuthService.regenerateRecoveryCodes(admin, request);
  }

  @Get('me')
  @UseGuards(AdminSessionGuard)
  me(@CurrentAdmin() admin: AdminAuthenticatedSession) {
    return this.adminAuthService.me(admin);
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(AdminSessionGuard)
  async logout(
    @CurrentAdmin() admin: AdminAuthenticatedSession,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LogoutResponse> {
    const result = await this.adminAuthService.logout(admin);
    response.clearCookie('admin_session', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    return result;
  }

  private setSessionCookie(
    response: Response,
    sessionToken: string,
    expiresAt: string,
  ): void {
    response.cookie('admin_session', sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: new Date(expiresAt),
    });
  }
}

@Controller('api/v1/admin/users')
@UseGuards(AdminSessionGuard, SuperAdminGuard)
export class AdminUsersController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Get()
  list(@CurrentAdmin() admin: AdminAuthenticatedSession) {
    return this.adminAuthService.listAdminUsers(admin);
  }

  @Post('invite')
  @HttpCode(201)
  invite(
    @CurrentAdmin() admin: AdminAuthenticatedSession,
    @Body() request: InviteAdminUserRequest,
  ): Promise<InviteAdminUserResponse> {
    return this.adminAuthService.inviteAdminUser(admin, request);
  }
}

@Controller('api/v1/admin/restaurants')
@UseGuards(AdminSessionGuard)
export class AdminRestaurantsController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Get()
  list(@CurrentAdmin() admin: AdminAuthenticatedSession) {
    return this.adminAuthService.listRestaurants(admin);
  }
}
