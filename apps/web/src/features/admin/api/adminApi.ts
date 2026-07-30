const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export type AdminRole = "SUPER_ADMIN" | "ADMIN";

export interface AdminSessionUser {
  id: string;
  email: string;
  role: AdminRole;
  restaurantIds: string[];
}

export interface AuthenticatedAdminResponse {
  status: "AUTHENTICATED";
  sessionToken: string;
  expiresAt: string;
  user: AdminSessionUser;
}

export interface MfaRequiredResponse {
  status: "MFA_REQUIRED";
  challengeToken: string;
  expiresAt: string;
}

export type LoginResponse = AuthenticatedAdminResponse | MfaRequiredResponse;

export interface AdminRestaurantSummary {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
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

export interface BootstrapSuperAdminResponse {
  user: AdminUserSummary;
  setupToken: string;
  expiresAt: string;
  twoFactorSetup: {
    manualEntryKey: string;
    provisioningUri: string;
  };
}

export interface BootstrapStatusResponse {
  canBootstrap: boolean;
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
    channel: "console";
    previewToken?: string;
  };
}

export interface AdminMenuProductSummary {
  menuProductId: string;
  productId: string;
  restaurantId: string;
  restaurantName: string;
  categoryName: string;
  type: "ITEM" | "MEAL" | "LARGE_MEAL";
  sku: string;
  name: string;
  price: string;
  currencyCode: string;
  imageUrl: string | null;
  isVisible: boolean;
  forcedHiddenReason: string | null;
}

export async function bootstrapSuperAdmin(input: {
  email: string;
  password: string;
  bootstrapToken?: string;
}): Promise<BootstrapSuperAdminResponse> {
  return request<BootstrapSuperAdminResponse>("/api/v1/admin/auth/bootstrap-super-admin", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getAdminBootstrapStatus(): Promise<BootstrapStatusResponse> {
  return request<BootstrapStatusResponse>("/api/v1/admin/auth/bootstrap-status", {
    method: "GET",
  });
}

export async function verifyBootstrapTwoFactor(input: {
  setupToken: string;
  code: string;
}): Promise<AuthenticatedAdminResponse> {
  return request<AuthenticatedAdminResponse>("/api/v1/admin/auth/verify-bootstrap-2fa", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function cancelAdminBootstrapSetup(
  setupToken: string,
  options: { keepalive?: boolean } = {},
): Promise<{ canceled: true }> {
  return request<{ canceled: true }>("/api/v1/admin/auth/cancel-bootstrap-setup", {
    method: "POST",
    body: JSON.stringify({ setupToken }),
    keepalive: options.keepalive,
  });
}

export async function loginAdmin(input: {
  email: string;
  password: string;
}): Promise<LoginResponse> {
  return request<LoginResponse>("/api/v1/admin/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function verifyAdminTwoFactor(input: {
  challengeToken: string;
  code: string;
}): Promise<AuthenticatedAdminResponse> {
  return request<AuthenticatedAdminResponse>("/api/v1/admin/auth/verify-2fa", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function confirmAdminInvite(inviteToken: string): Promise<{
  user: AdminUserSummary;
}> {
  return request<{ user: AdminUserSummary }>("/api/v1/admin/auth/confirm-invite", {
    method: "POST",
    body: JSON.stringify({ inviteToken }),
  });
}

export async function forgotAdminPassword(email: string): Promise<{
  accepted: true;
  delivery: {
    channel: "console";
    previewToken?: string;
  };
}> {
  return request("/api/v1/admin/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetAdminPassword(input: {
  resetToken: string;
  password: string;
}): Promise<{ passwordReset: true }> {
  return request("/api/v1/admin/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function listAdminUsers(sessionToken: string): Promise<{
  users: AdminUserSummary[];
}> {
  return request("/api/v1/admin/users", {
    method: "GET",
    token: sessionToken,
  });
}

export async function inviteAdminUser(
  sessionToken: string,
  input: {
    email: string;
    password: string;
    restaurantIds: string[];
  },
): Promise<InviteAdminUserResponse> {
  return request<InviteAdminUserResponse>("/api/v1/admin/users/invite", {
    method: "POST",
    token: sessionToken,
    body: JSON.stringify({
      ...input,
      role: "ADMIN",
    }),
  });
}

export async function listAdminRestaurants(sessionToken: string): Promise<{
  restaurants: AdminRestaurantSummary[];
}> {
  return request("/api/v1/admin/restaurants", {
    method: "GET",
    token: sessionToken,
  });
}

export async function listAdminMenuProducts(sessionToken: string): Promise<{
  products: AdminMenuProductSummary[];
}> {
  return request("/api/v1/admin/menu-products", {
    method: "GET",
    token: sessionToken,
  });
}

export async function saveAdminMenuVisibility(
  sessionToken: string,
  changes: Array<{
    menuProductId: string;
    isVisible: boolean;
  }>,
): Promise<{
  products: AdminMenuProductSummary[];
  updatedCount: number;
  forcedHiddenMenuProductIds: string[];
}> {
  return request("/api/v1/admin/menu-products/visibility", {
    method: "PATCH",
    token: sessionToken,
    body: JSON.stringify({ changes }),
  });
}

export async function logoutAdmin(sessionToken: string): Promise<void> {
  await request("/api/v1/admin/auth/logout", {
    method: "POST",
    token: sessionToken,
    body: JSON.stringify({}),
  });
}

async function request<T>(
  path: string,
  init: RequestInit & { token?: string },
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
      ...init.headers,
    },
  });
  const body = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new Error(resolveErrorMessage(body));
  }

  return body as T;
}

function resolveErrorMessage(body: unknown): string {
  if (
    body &&
    typeof body === "object" &&
    "message" in body &&
    typeof body.message === "string"
  ) {
    return body.message;
  }

  return "Admin request failed.";
}
