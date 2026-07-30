import type { AdminRole } from '@prisma/client';

export interface BootstrapSuperAdminRequest {
  email?: string;
  password?: string;
  bootstrapToken?: string;
}

export interface BootstrapStatusResponse {
  canBootstrap: boolean;
}

export interface LoginRequest {
  email?: string;
  password?: string;
}

export interface VerifyTwoFactorRequest {
  challengeToken?: string;
  code?: string;
}

export interface VerifyBootstrapTwoFactorRequest {
  setupToken?: string;
  code?: string;
}

export interface CancelBootstrapSetupRequest {
  setupToken?: string;
}

export interface ForgotPasswordRequest {
  email?: string;
}

export interface ResetPasswordRequest {
  resetToken?: string;
  password?: string;
}

export interface ConfirmInviteRequest {
  inviteToken?: string;
}

export interface InviteAdminUserRequest {
  email?: string;
  password?: string;
  role?: AdminRole;
  restaurantIds?: string[];
}

export interface AdminUserSummary {
  id: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  restaurants: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export interface AdminSessionUser {
  id: string;
  email: string;
  role: AdminRole;
  restaurantIds: string[];
}

export interface AdminAuthenticatedSession {
  sessionId: string;
  tokenId: string;
  user: AdminSessionUser;
  expiresAt: Date;
}

export interface AuthenticatedAdminResponse {
  status: 'AUTHENTICATED';
  sessionToken: string;
  expiresAt: string;
  user: AdminSessionUser;
}

export interface MfaRequiredResponse {
  status: 'MFA_REQUIRED';
  challengeToken: string;
  expiresAt: string;
}

export type LoginResponse = AuthenticatedAdminResponse | MfaRequiredResponse;

export interface BootstrapSuperAdminResponse {
  user: AdminUserSummary;
  setupToken: string;
  expiresAt: string;
  twoFactorSetup: {
    manualEntryKey: string;
    provisioningUri: string;
  };
}

export interface CancelBootstrapSetupResponse {
  canceled: true;
}

export interface InviteAdminUserResponse {
  inviteId: string;
  email: string;
  role: AdminRole;
  expiresAt: string;
  invitationUrl: string;
  twoFactorSetup: {
    manualEntryKey: string;
  };
  delivery: {
    channel: 'console';
    previewToken?: string;
  };
}

export interface ConfirmInviteResponse {
  user: AdminUserSummary;
}

export interface ForgotPasswordResponse {
  accepted: true;
  delivery: {
    channel: 'console';
    previewToken?: string;
  };
}

export interface ResetPasswordResponse {
  passwordReset: true;
}

export interface LogoutResponse {
  loggedOut: true;
}

export interface AdminRestaurantSummary {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}
