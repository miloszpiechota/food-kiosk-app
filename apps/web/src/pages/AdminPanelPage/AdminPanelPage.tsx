import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import QRCode from "qrcode";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  ChevronRight,
  CreditCard,
  Loader2,
  LogOut,
  Package,
  Search,
  Settings,
  Shield,
  ShoppingCart,
  SlidersHorizontal,
  User,
  Users,
  Utensils,
  X,
} from "lucide-react";
import { focusRing } from "../../shared/components/IconButton";
import {
  bootstrapSuperAdmin,
  cancelAdminBootstrapSetup,
  confirmAdminInvite,
  forgotAdminPassword,
  getAdminBootstrapStatus,
  inviteAdminUser,
  listAdminMenuProducts,
  listAdminRestaurants,
  listAdminUsers,
  loginAdmin,
  logoutAdmin,
  resetAdminPassword,
  saveAdminMenuVisibility,
  verifyBootstrapTwoFactor,
  verifyAdminTwoFactor,
  type AdminMenuProductSummary,
  type AdminRestaurantSummary,
  type AdminRole,
  type AdminSessionUser,
  type AdminUserSummary,
  type AuthenticatedAdminResponse,
  type InviteAdminUserResponse,
} from "../../features/admin/api/adminApi";

type AdminView = "login" | "shell";
type LoginMode = "email" | "setup" | "reset" | "invite";
type LoginStep = "credentials" | "two-factor";
type SetupStep = "account" | "two-factor";
type ShellView = "orders" | "menu" | "admins" | "restaurants" | "settings";
type Role = AdminRole;
type OrderStatus = "NEW" | "IN_PROGRESS" | "READY" | "COMPLETED" | "CANCELLED";
type PaymentStatus =
  | "PENDING"
  | "AWAITING_PAYMENT_CONFIRMATION"
  | "PAID"
  | "FAILED"
  | "CANCELLED";
type ProductType = "ITEM" | "MEAL" | "LARGE_MEAL";
type TableState = "ready" | "loading" | "error" | "empty";

interface AdminPanelPageProps {
  onBackToKiosk: () => void;
}

interface Restaurant {
  id: string;
  name: string;
  location: string;
}

interface OrderItem {
  id: string;
  productId: string;
  menuProductId: string;
  name: string;
  type: ProductType;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  configuration: string;
}

interface Payment {
  id: string;
  provider: "Stripe";
  sessionId: string;
  intentId: string;
  amountCents: number;
  currency: "PLN";
}

interface Order {
  id: string;
  orderNumber: string;
  restaurantId: string;
  createdAt: string;
  updatedAt: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotalCents: number;
  totalCents: number;
  items: OrderItem[];
  payment: Payment;
}

interface MenuProduct {
  id: string;
  productId: string;
  restaurantId: string;
  restaurantName: string;
  name: string;
  category: string;
  type: ProductType;
  priceCents: number;
  currencyCode: string;
  visible: boolean;
  imageUrl: string;
  forcedHiddenReason?: string | null;
  requiredGroup?: string;
  affectedMeals?: number;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  restaurants: string[];
  twoFactorEnabled: boolean;
  status: "active" | "pending";
  lastLoginAt: string;
}

const restaurants: Restaurant[] = [
  { id: "central", name: "Central Burger House", location: "Warsaw Central" },
  { id: "riverside", name: "Riverside Kiosk", location: "Vistula Walk" },
  { id: "airport", name: "Airport Express", location: "Terminal A" },
];

const orders: Order[] = [
  {
    id: "ord_01J7C8K4Z2Y9QW5E1",
    orderNumber: "K-20260727-A13F9B",
    restaurantId: "central",
    createdAt: "2026-07-27T12:18:00.000Z",
    updatedAt: "2026-07-27T12:22:00.000Z",
    orderStatus: "IN_PROGRESS",
    paymentStatus: "PAID",
    subtotalCents: 5350,
    totalCents: 5350,
    payment: {
      id: "pay_01J7C8K4",
      provider: "Stripe",
      sessionId: "cs_test_a13f9b",
      intentId: "pi_3A13F9B",
      amountCents: 5350,
      currency: "PLN",
    },
    items: [
      {
        id: "item_001",
        productId: "prod_classic_burger_meal",
        menuProductId: "mp_classic_burger_meal",
        name: "Classic Burger Meal",
        type: "MEAL",
        unitPriceCents: 4550,
        quantity: 1,
        lineTotalCents: 4550,
        configuration:
          "Burger: Classic Burger; Side: Small Fries; Drink: Cola; Extra cheese x2; Removed pickles",
      },
      {
        id: "item_002",
        productId: "prod_cola",
        menuProductId: "mp_cola",
        name: "Cola",
        type: "ITEM",
        unitPriceCents: 800,
        quantity: 1,
        lineTotalCents: 800,
        configuration: "No ice",
      },
    ],
  },
  {
    id: "ord_01J7C8MV3C1AZ0G2",
    orderNumber: "K-20260727-B82C1D",
    restaurantId: "riverside",
    createdAt: "2026-07-27T11:46:00.000Z",
    updatedAt: "2026-07-27T11:51:00.000Z",
    orderStatus: "READY",
    paymentStatus: "AWAITING_PAYMENT_CONFIRMATION",
    subtotalCents: 6890,
    totalCents: 6890,
    payment: {
      id: "pay_01J7C8MV",
      provider: "Stripe",
      sessionId: "cs_test_b82c1d",
      intentId: "pi_3B82C1D",
      amountCents: 6890,
      currency: "PLN",
    },
    items: [
      {
        id: "item_003",
        productId: "prod_large_burger_meal",
        menuProductId: "mp_large_burger_meal",
        name: "Large Burger Meal",
        type: "LARGE_MEAL",
        unitPriceCents: 6890,
        quantity: 1,
        lineTotalCents: 6890,
        configuration:
          "Burger: Double Burger; Side: Large Fries; Drink: Lemonade",
      },
    ],
  },
  {
    id: "ord_01J7C8Q9TK6BD3A4",
    orderNumber: "K-20260727-C77D2E",
    restaurantId: "airport",
    createdAt: "2026-07-27T10:03:00.000Z",
    updatedAt: "2026-07-27T10:03:00.000Z",
    orderStatus: "NEW",
    paymentStatus: "FAILED",
    subtotalCents: 3200,
    totalCents: 3200,
    payment: {
      id: "pay_01J7C8Q9",
      provider: "Stripe",
      sessionId: "cs_test_c77d2e",
      intentId: "pi_3C77D2E",
      amountCents: 3200,
      currency: "PLN",
    },
    items: [
      {
        id: "item_004",
        productId: "prod_chicken_wrap",
        menuProductId: "mp_chicken_wrap",
        name: "Chicken Wrap",
        type: "ITEM",
        unitPriceCents: 3200,
        quantity: 1,
        lineTotalCents: 3200,
        configuration: "Extra sauce",
      },
    ],
  },
];

const orderStatusLabels: Record<OrderStatus, string> = {
  NEW: "New",
  IN_PROGRESS: "In progress",
  READY: "Ready",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  AWAITING_PAYMENT_CONFIRMATION: "Awaiting confirmation",
  PAID: "Paid",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

function formatPrice(cents: number): string {
  return `${(cents / 100).toFixed(2)} PLN`;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function restaurantName(restaurantId: string): string {
  return (
    restaurants.find((restaurant) => restaurant.id === restaurantId)?.name ??
    "Unknown restaurant"
  );
}

function mapAdminUser(user: AdminUserSummary): AdminUser {
  return {
    id: user.id,
    email: user.email,
    name: user.email.split("@")[0] || "Admin user",
    role: user.role,
    restaurants:
      user.role === "SUPER_ADMIN" && user.restaurants.length === 0
        ? ["All restaurants"]
        : user.restaurants.map((restaurant) => restaurant.name),
    twoFactorEnabled: user.twoFactorEnabled,
    status: user.isActive ? "active" : "pending",
    lastLoginAt: user.lastLoginAt ?? "Never",
  };
}

function mapAdminMenuProduct(product: AdminMenuProductSummary): MenuProduct {
  return {
    id: product.menuProductId,
    productId: product.productId,
    restaurantId: product.restaurantId,
    restaurantName: product.restaurantName,
    name: product.name,
    category: product.categoryName,
    type: product.type,
    priceCents: toCents(product.price),
    currencyCode: product.currencyCode,
    visible: product.isVisible,
    imageUrl:
      product.imageUrl ??
      "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg",
    forcedHiddenReason: product.forcedHiddenReason,
  };
}

function toCents(value: string): number {
  return Math.round(Number(value) * 100);
}

function validateAdminEmailDomain(value: string): void {
  const domain = value.trim().split("@")[1] ?? "";
  const labels = domain.split(".");
  const topLevelDomain = labels.at(-1) ?? "";
  const hasCompleteDomain =
    labels.length >= 2 &&
    labels.every((label) => label.length > 0) &&
    /^[a-z]{2,63}$/i.test(topLevelDomain);

  if (!hasCompleteDomain) {
    throw new Error("Enter an email with a complete domain, for example owner@example.com.");
  }
}

export function AdminPanelPage({ onBackToKiosk }: AdminPanelPageProps) {
  const [view, setView] = useState<AdminView>("login");
  const [sessionToken, setSessionToken] = useState("");
  const [adminUser, setAdminUser] = useState<AdminSessionUser | null>(null);

  function handleSignedIn(response: AuthenticatedAdminResponse) {
    setSessionToken(response.sessionToken);
    setAdminUser(response.user);
    setView("shell");
  }

  async function handleLogout() {
    if (sessionToken) {
      await logoutAdmin(sessionToken).catch(() => undefined);
    }
    setSessionToken("");
    setAdminUser(null);
    setView("login");
  }

  if (view === "shell" && adminUser) {
    return (
      <AdminFrame>
        <AdminShell
          sessionToken={sessionToken}
          user={adminUser}
          onBackToKiosk={onBackToKiosk}
          onLogout={handleLogout}
        />
      </AdminFrame>
    );
  }

  return (
    <AdminFrame>
      <AdminLogin
        onBackToKiosk={onBackToKiosk}
        onSignedIn={handleSignedIn}
      />
    </AdminFrame>
  );
}

function AdminFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0c0f1a] text-[#dde2ee] [--admin-border:rgba(255,255,255,0.07)] [--admin-card:#111828] [--admin-muted:#6b7694] [--admin-primary:#4f7ef7]">
      {children}
    </div>
  );
}

interface AdminLoginProps {
  onBackToKiosk: () => void;
  onSignedIn: (response: AuthenticatedAdminResponse) => void;
}

function AdminLogin({
  onBackToKiosk,
  onSignedIn,
}: AdminLoginProps) {
  const urlSearchParams = useMemo(
    () => new URLSearchParams(window.location.search),
    [],
  );
  const initialInviteToken = urlSearchParams.get("inviteToken") ?? "";
  const initialResetToken = urlSearchParams.get("resetToken") ?? "";
  const [mode, setMode] = useState<LoginMode>(
    initialResetToken ? "reset" : initialInviteToken ? "invite" : "email",
  );
  const [step, setStep] = useState<LoginStep>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [canBootstrap, setCanBootstrap] = useState(false);
  const [setupStep, setSetupStep] = useState<SetupStep>("account");
  const [setupEmail, setSetupEmail] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [setupPasswordRepeat, setSetupPasswordRepeat] = useState("");
  const [bootstrapToken, setBootstrapToken] = useState("");
  const [setupSecret, setSetupSecret] = useState("");
  const [setupToken, setSetupToken] = useState("");
  const [setupProvisioningUri, setSetupProvisioningUri] = useState("");
  const [setupQrCodeUrl, setSetupQrCodeUrl] = useState("");
  const [setupCode, setSetupCode] = useState("");
  const inviteToken = initialInviteToken;
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState(initialResetToken);
  const [resetPassword, setResetPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    void Promise.resolve()
      .then(getAdminBootstrapStatus)
      .then((response) => {
        if (!isCurrent) {
          return;
        }

        setCanBootstrap(response.canBootstrap);
        if (response.canBootstrap && !initialInviteToken && !initialResetToken) {
          setMode("setup");
        }
      })
      .catch(() => undefined);

    return () => {
      isCurrent = false;
    };
  }, [initialInviteToken, initialResetToken]);

  useEffect(() => {
    if (!setupProvisioningUri) {
      return undefined;
    }

    let isCurrent = true;

    void Promise.resolve()
      .then(() =>
        QRCode.toDataURL(setupProvisioningUri, {
          margin: 2,
          scale: 6,
          color: {
            dark: "#0c0f1a",
            light: "#ffffff",
          },
        }),
      )
      .then((qrCodeUrl) => {
        if (isCurrent) {
          setSetupQrCodeUrl(qrCodeUrl);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setSetupQrCodeUrl("");
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [setupProvisioningUri]);

  useEffect(() => {
    if (!setupToken || setupStep !== "two-factor") {
      return undefined;
    }

    function cancelOnPageLeave() {
      void cancelAdminBootstrapSetup(setupToken, { keepalive: true }).catch(
        () => undefined,
      );
    }

    window.addEventListener("pagehide", cancelOnPageLeave);

    return () => {
      window.removeEventListener("pagehide", cancelOnPageLeave);
    };
  }, [setupStep, setupToken]);

  async function handleCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAdminAction(async () => {
      validateAdminEmailDomain(email);
      const response = await loginAdmin({ email, password });
      if (response.status === "MFA_REQUIRED") {
        setChallengeToken(response.challengeToken);
        setStep("two-factor");
        setStatusMessage("Password accepted. Enter your 2FA code.");
        return;
      }

      onSignedIn(response);
    });
  }

  async function handleTwoFactor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAdminAction(async () => {
      const response = await verifyAdminTwoFactor({
        challengeToken,
        code,
      });
      onSignedIn(response);
    });
  }

  async function handleBootstrap(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAdminAction(async () => {
      validateAdminEmailDomain(setupEmail);
      if (setupPassword !== setupPasswordRepeat) {
        throw new Error("Passwords must match.");
      }
      const response = await bootstrapSuperAdmin({
        email: setupEmail,
        password: setupPassword,
        bootstrapToken: bootstrapToken || undefined,
      });
      setSetupSecret(response.twoFactorSetup.manualEntryKey);
      setSetupToken(response.setupToken);
      setSetupProvisioningUri(response.twoFactorSetup.provisioningUri);
      setSetupQrCodeUrl("");
      setSetupCode("");
      setSetupStep("two-factor");
      setStatusMessage(
        "Super admin account created. Scan the QR code in your authenticator app.",
      );
    });
  }

  async function handleBootstrapTwoFactor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAdminAction(async () => {
      const response = await verifyBootstrapTwoFactor({
        setupToken,
        code: setupCode,
      });
      onSignedIn(response);
    });
  }

  async function handleCancelBootstrapSetup() {
    await runAdminAction(async () => {
      if (setupToken) {
        await cancelAdminBootstrapSetup(setupToken);
      }
      resetBootstrapSetup();
      setCanBootstrap(true);
      setStatusMessage("Super admin setup canceled. Start again when ready.");
    });
  }

  async function handleConfirmInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAdminAction(async () => {
      await confirmAdminInvite(inviteToken);
      setStatusMessage("Invite confirmed. You can now sign in with 2FA.");
      setMode("email");
    });
  }

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAdminAction(async () => {
      validateAdminEmailDomain(resetEmail);
      const response = await forgotAdminPassword(resetEmail);
      if (response.delivery.previewToken) {
        setResetToken(response.delivery.previewToken);
      }
      setStatusMessage(
        "If this email exists, a password reset message has been sent.",
      );
    });
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAdminAction(async () => {
      await resetAdminPassword({
        resetToken,
        password: resetPassword,
      });
      setStatusMessage("Password reset. Sign in with the new password.");
      setMode("email");
    });
  }

  async function runAdminAction(action: () => Promise<void>) {
    setBusy(true);
    setErrorMessage("");
    setStatusMessage("");
    try {
      await action();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Admin request failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  function returnToCredentials() {
    setStep("credentials");
    setCode("");
    setChallengeToken("");
    setStatusMessage("");
    setErrorMessage("");
  }

  function openPasswordReset() {
    setMode("reset");
    setStep("credentials");
    setResetEmail(email);
    setStatusMessage("");
    setErrorMessage("");
  }

  function resetBootstrapSetup() {
    setSetupStep("account");
    setSetupEmail("");
    setSetupPassword("");
    setSetupPasswordRepeat("");
    setBootstrapToken("");
    setSetupSecret("");
    setSetupToken("");
    setSetupProvisioningUri("");
    setSetupQrCodeUrl("");
    setSetupCode("");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-(--admin-border) bg-[#111828] shadow-2xl shadow-black/40 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="border-b border-(--admin-border) bg-[#090d16] p-8 lg:border-b-0 lg:border-r">
          <div className="mb-10 flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#4f7ef7]">
                <Utensils aria-hidden="true" className="size-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">KioskPlatform</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#6b7694]">
                  Admin Console
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onBackToKiosk}
              className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md border border-(--admin-border) bg-[#111828] px-3 text-xs font-semibold text-[#dde2ee] transition hover:bg-[#182030] hover:text-white ${focusRing}`}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to the kiosk
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7694]">
              Secure operations
            </p>
            <h1 className="text-3xl font-semibold leading-tight text-white">
              Manage restaurants, orders, payments, and menu visibility.
            </h1>
            <p className="max-w-sm text-sm leading-6 text-[#9aaabb]">
              Backend-backed admin auth for email, password, required 2FA,
              first super-admin setup, invites, and password reset.
            </p>
          </div>

          <div className="mt-10 grid gap-3 text-xs text-[#9aaabb]">
            <InfoLine icon={<Shield className="size-4" />} text="Mandatory 2FA" />
            <InfoLine
              icon={<Building2 className="size-4" />}
              text="Multi-restaurant access"
            />
            <InfoLine
              icon={<CreditCard className="size-4" />}
              text="Payment status stays separate"
            />
          </div>
        </div>

        <div className="p-8">
          {errorMessage ? <AdminAlert tone="error">{errorMessage}</AdminAlert> : null}
          {statusMessage ? (
            <AdminAlert tone="success">{statusMessage}</AdminAlert>
          ) : null}

          {mode === "email" && step === "credentials" ? (
            <form onSubmit={handleCredentials} className="space-y-5">
              <PanelHeading
                title="Sign in"
                text="Use your admin credentials. The next step requires an authenticator code."
              />
              <AdminField label="Email" icon={<User className="size-4" />}>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  autoComplete="username"
                  required
                  placeholder="owner@example.com"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[#6b7694]"
                />
              </AdminField>
              <AdminField label="Password" icon={<Shield className="size-4" />}>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="Password"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[#6b7694]"
                />
              </AdminField>
              <div className="-mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={openPasswordReset}
                  className={`rounded px-1 py-1 text-xs font-semibold text-[#8fb0ff] transition hover:text-white ${focusRing}`}
                >
                  Forgot password?
                </button>
              </div>
              <button
                type="submit"
                disabled={busy}
                className={`min-h-11 w-full rounded-md bg-[#4f7ef7] px-4 text-sm font-semibold text-white transition hover:bg-[#416de0] ${focusRing}`}
              >
                {busy ? "Checking..." : "Continue"}
              </button>
              <p className="rounded-md border border-(--admin-border) bg-[#0c0f1a] px-3 py-2 text-xs leading-5 text-[#9aaabb]">
                New admin users must be invited by a super admin. Invite
                acceptance is not available from the public login panel.
              </p>
            </form>
          ) : null}

          {mode === "email" && step === "two-factor" ? (
            <form onSubmit={handleTwoFactor} className="space-y-5">
              <PanelHeading
                title="Two-factor verification"
                text="Enter the six-digit code from your authenticator app."
              />
              <AdminField label="2FA code" icon={<Shield className="size-4" />}>
                <input
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="\d{6}"
                  required
                  placeholder="123456"
                  className="w-full bg-transparent text-sm font-semibold tracking-widest outline-none placeholder:text-[#6b7694]"
                  aria-label="Six-digit two-factor authentication code"
                />
              </AdminField>
              <button
                type="submit"
                disabled={busy || code.length !== 6}
                className={`min-h-11 w-full rounded-md bg-[#4f7ef7] px-4 text-sm font-semibold text-white transition hover:bg-[#416de0] ${focusRing}`}
              >
                {busy ? "Verifying..." : "Verify and open admin panel"}
              </button>
              <SecondaryButton onClick={returnToCredentials}>
                Back to email and password
              </SecondaryButton>
            </form>
          ) : null}

          {mode === "setup" && (canBootstrap || setupSecret) ? (
            <div className="space-y-5">
              {setupStep === "account" ? (
                <>
                  <PanelHeading
                    title="Create first super admin"
                    text="Use this only on a fresh database before any admin users exist."
                  />
                  <form onSubmit={handleBootstrap} className="space-y-4">
                    <AdminField label="Email" icon={<User className="size-4" />}>
                      <input
                        value={setupEmail}
                        onChange={(event) => setSetupEmail(event.target.value)}
                        type="email"
                        required
                        placeholder="owner@example.com"
                        className="w-full bg-transparent text-sm outline-none placeholder:text-[#6b7694]"
                      />
                    </AdminField>
                    <AdminField label="Password" icon={<Shield className="size-4" />}>
                      <input
                        value={setupPassword}
                        onChange={(event) => setSetupPassword(event.target.value)}
                        type="password"
                        required
                        minLength={12}
                        placeholder="At least 12 characters"
                        className="w-full bg-transparent text-sm outline-none placeholder:text-[#6b7694]"
                      />
                    </AdminField>
                    <AdminField
                      label="Repeat password"
                      icon={<Shield className="size-4" />}
                    >
                      <input
                        value={setupPasswordRepeat}
                        onChange={(event) =>
                          setSetupPasswordRepeat(event.target.value)
                        }
                        type="password"
                        required
                        minLength={12}
                        placeholder="Repeat password"
                        className="w-full bg-transparent text-sm outline-none placeholder:text-[#6b7694]"
                      />
                    </AdminField>
                    <AdminField
                      label="Bootstrap token"
                      icon={<Shield className="size-4" />}
                    >
                      <input
                        value={bootstrapToken}
                        onChange={(event) => setBootstrapToken(event.target.value)}
                        type="password"
                        placeholder="Optional, only if ADMIN_BOOTSTRAP_TOKEN is set"
                        className="w-full bg-transparent text-sm outline-none placeholder:text-[#6b7694]"
                      />
                    </AdminField>
                    <button
                      type="submit"
                      disabled={busy}
                      className={`min-h-11 w-full rounded-md bg-[#4f7ef7] px-4 text-sm font-semibold text-white transition hover:bg-[#416de0] ${focusRing}`}
                    >
                      {busy ? "Creating..." : "Create super admin"}
                    </button>
                  </form>
                </>
              ) : null}

              {setupStep === "two-factor" ? (
                <form onSubmit={handleBootstrapTwoFactor} className="space-y-5">
                  <PanelHeading
                    title="Set up 2FA"
                    text="Scan the QR code in your authenticator app, then enter the six-digit code from that app."
                  />
                  <div className="grid gap-4 rounded-md border border-(--admin-border) bg-[#0c0f1a] p-4 sm:grid-cols-[160px_1fr]">
                    <div className="flex size-40 items-center justify-center rounded-md bg-white p-2">
                      {setupQrCodeUrl ? (
                        <img
                          src={setupQrCodeUrl}
                          alt="QR code for Google Authenticator setup"
                          className="size-full"
                        />
                      ) : (
                        <Loader2
                          aria-hidden="true"
                          className="size-6 animate-spin text-[#4f7ef7]"
                        />
                      )}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-white">
                          Scan with Google Authenticator
                        </p>
                        <p className="mt-1 text-xs leading-5 text-[#9aaabb]">
                          If scanning is not available, add the account manually
                          with the key below.
                        </p>
                      </div>
                    </div>
                  </div>
                  <AdminReadonly
                    label="Manual setup key"
                    value={setupSecret}
                  />
                  <AdminField
                    label="Enter the 6-digit 2FA code from your authenticator app"
                    icon={<Shield className="size-4" />}
                  >
                    <input
                      value={setupCode}
                      onChange={(event) =>
                        setSetupCode(
                          event.target.value.replace(/\D/g, "").slice(0, 6),
                        )
                      }
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="\d{6}"
                      required
                      placeholder="123456"
                      className="w-full bg-transparent text-sm font-semibold tracking-widest outline-none placeholder:text-[#6b7694]"
                      aria-label="Six-digit setup two-factor authentication code"
                    />
                  </AdminField>
                  <button
                    type="submit"
                    disabled={busy || setupCode.length !== 6 || !setupToken}
                    className={`min-h-11 w-full rounded-md bg-[#4f7ef7] px-4 text-sm font-semibold text-white transition hover:bg-[#416de0] ${focusRing}`}
                  >
                    {busy ? "Verifying..." : "Verify 2FA and finish setup"}
                  </button>
                  <SecondaryButton onClick={handleCancelBootstrapSetup}>
                    Cancel setup and start again
                  </SecondaryButton>
                </form>
              ) : null}
            </div>
          ) : null}

          {mode === "invite" ? (
            <div className="space-y-5">
              <PanelHeading
                title="Accept admin invite"
                text="Confirm the invite from your email before signing in with your admin credentials."
              />
              <form onSubmit={handleConfirmInvite} className="space-y-4">
                <AdminReadonly label="Invite token from URL" value={inviteToken} />
                <button
                  type="submit"
                  disabled={busy}
                  className={`min-h-11 w-full rounded-md bg-[#4f7ef7] px-4 text-sm font-semibold text-white transition hover:bg-[#416de0] ${focusRing}`}
                >
                  {busy ? "Confirming..." : "Confirm invite"}
                </button>
                <SecondaryButton onClick={() => setMode("email")}>
                  Back to sign in
                </SecondaryButton>
              </form>
            </div>
          ) : null}

          {mode === "reset" ? (
            <div className="space-y-5">
              <PanelHeading
                title="Password reset"
                text="Request a reset email, then set a new password with the token."
              />
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <AdminField label="Email" icon={<User className="size-4" />}>
                  <input
                    value={resetEmail}
                    onChange={(event) => setResetEmail(event.target.value)}
                    type="email"
                    required
                    placeholder="admin@example.com"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-[#6b7694]"
                  />
                </AdminField>
                <button
                  type="submit"
                  disabled={busy}
                  className={`min-h-11 w-full rounded-md bg-[#4f7ef7] px-4 text-sm font-semibold text-white transition hover:bg-[#416de0] ${focusRing}`}
                >
                  Send reset email
                </button>
              </form>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <AdminField label="Reset token" icon={<Shield className="size-4" />}>
                  <input
                    value={resetToken}
                    onChange={(event) => setResetToken(event.target.value)}
                    required
                    placeholder="Paste reset token"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-[#6b7694]"
                  />
                </AdminField>
                <AdminField label="New password" icon={<Shield className="size-4" />}>
                  <input
                    value={resetPassword}
                    onChange={(event) => setResetPassword(event.target.value)}
                    type="password"
                    required
                    minLength={12}
                    placeholder="At least 12 characters"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-[#6b7694]"
                  />
                </AdminField>
                <button
                  type="submit"
                  disabled={busy}
                  className={`min-h-11 w-full rounded-md border border-(--admin-border) px-4 text-sm font-semibold text-[#dde2ee] transition hover:bg-[#182030] ${focusRing}`}
                >
                  Reset password
                </button>
              </form>
              <SecondaryButton onClick={() => setMode("email")}>
                Back to sign in
              </SecondaryButton>
            </div>
          ) : null}

        </div>
      </section>
    </main>
  );
}

interface AdminShellProps {
  sessionToken: string;
  user: AdminSessionUser;
  onBackToKiosk: () => void;
  onLogout: () => void;
}

function AdminShell({
  sessionToken,
  user,
  onBackToKiosk,
  onLogout,
}: AdminShellProps) {
  const [view, setView] = useState<ShellView>("orders");
  const [restaurantId, setRestaurantId] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [shellRestaurants, setShellRestaurants] = useState<
    AdminRestaurantSummary[]
  >([]);
  const role = user.role;
  const restaurantOptions =
    shellRestaurants.length > 0
      ? shellRestaurants.map((restaurant) => ({
          id: restaurant.id,
          name: restaurant.name,
        }))
      : restaurants;

  useEffect(() => {
    void Promise.resolve().then(async () => {
      const response = await listAdminRestaurants(sessionToken);
      setShellRestaurants(response.restaurants);
    });
  }, [sessionToken]);

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-56 shrink-0 flex-col border-r border-(--admin-border) bg-[#090d16]">
        <div className="border-b border-(--admin-border) px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded bg-[#4f7ef7]">
              <Utensils className="size-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold">KioskPlatform</p>
              <p className="text-[9px] uppercase tracking-[0.18em] text-[#6b7694]">
                Admin Console
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-3">
          <NavButton
            active={view === "orders"}
            icon={<ShoppingCart className="size-4" />}
            label="Orders"
            onClick={() => setView("orders")}
          />
          <NavButton
            active={view === "menu"}
            icon={<Package className="size-4" />}
            label="Menu Items"
            onClick={() => setView("menu")}
          />
          {role === "SUPER_ADMIN" ? (
            <>
              <NavButton
                active={view === "admins"}
                icon={<Users className="size-4" />}
                label="Admin Users"
                onClick={() => setView("admins")}
              />
              <NavButton
                active={view === "restaurants"}
                icon={<Building2 className="size-4" />}
                label="Restaurants"
                onClick={() => setView("restaurants")}
              />
            </>
          ) : null}
          <NavButton
            active={view === "settings"}
            icon={<Settings className="size-4" />}
            label="Settings"
            onClick={() => setView("settings")}
          />
        </nav>

        <div className="border-t border-(--admin-border) p-3">
          <button
            type="button"
            onClick={onBackToKiosk}
            className="w-full rounded-md border border-(--admin-border) px-3 py-2 text-left text-xs font-semibold text-[#9aaabb] transition hover:text-white"
          >
            Back to kiosk
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-(--admin-border) bg-[#111828] px-4">
          <select
            value={restaurantId}
            onChange={(event) => setRestaurantId(event.target.value)}
            className="h-8 rounded border border-(--admin-border) bg-[#182030] px-2 text-xs font-semibold text-[#dde2ee] outline-none"
            aria-label="Restaurant filter"
          >
            <option value="">All restaurants</option>
            {restaurantOptions.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
          </select>

          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-[#6b7694]" />
            <input
              value={globalSearch}
              onChange={(event) => setGlobalSearch(event.target.value)}
              placeholder="Search orders, menu items..."
              className="h-8 w-full rounded border border-(--admin-border) bg-[#182030] pl-8 pr-3 text-xs outline-none placeholder:text-[#6b7694] focus:border-[#4f7ef7]"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Badge tone={role === "SUPER_ADMIN" ? "purple" : "blue"}>
              {role}
            </Badge>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex size-7 items-center justify-center rounded-full bg-[#4f7ef7]/20 text-[#8fb0ff]">
                <User className="size-4" />
              </span>
              <span className="hidden font-semibold sm:inline">
                {user.email}
              </span>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="rounded p-2 text-[#9aaabb] transition hover:bg-[#182030] hover:text-white"
              aria-label="Log out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </header>

        <section className="min-h-0 flex-1 overflow-auto">
          {view === "orders" ? (
            <OrdersView
              restaurantId={restaurantId}
              globalSearch={globalSearch}
            />
          ) : null}
          {view === "menu" ? (
            <MenuItemsView
              sessionToken={sessionToken}
              restaurants={shellRestaurants}
              restaurantId={restaurantId}
              globalSearch={globalSearch}
            />
          ) : null}
          {view === "admins" ? (
            <AdminUsersView sessionToken={sessionToken} />
          ) : null}
          {view === "restaurants" ? <RestaurantsView /> : null}
          {view === "settings" ? <SettingsView /> : null}
        </section>
      </div>
    </div>
  );
}

function OrdersView({
  restaurantId,
  globalSearch,
}: {
  restaurantId: string;
  globalSearch: string;
}) {
  const [orderStatus, setOrderStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [tableState, setTableState] = useState<TableState>("ready");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filtered = useMemo(
    () =>
      orders.filter((order) => {
        const q = globalSearch.toLowerCase();
        if (restaurantId && order.restaurantId !== restaurantId) return false;
        if (orderStatus && order.orderStatus !== orderStatus) return false;
        if (paymentStatus && order.paymentStatus !== paymentStatus) return false;
        if (
          q &&
          !order.orderNumber.toLowerCase().includes(q) &&
          !order.items.some((item) => item.name.toLowerCase().includes(q))
        ) {
          return false;
        }
        return true;
      }),
    [globalSearch, orderStatus, paymentStatus, restaurantId],
  );

  return (
    <div className="flex min-h-full flex-col">
      <ViewHeader
        title="Orders"
        description={`${filtered.length} of ${orders.length} orders`}
        action={
          <DemoStateControls value={tableState} onChange={setTableState} />
        }
      />

      <div className="flex flex-wrap items-center gap-2 border-b border-(--admin-border) bg-[#182030]/35 px-5 py-3">
        <SlidersHorizontal className="size-4 text-[#6b7694]" />
        <AdminSelect value={orderStatus} onChange={setOrderStatus}>
          <option value="">Any order status</option>
          {Object.entries(orderStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </AdminSelect>
        <AdminSelect value={paymentStatus} onChange={setPaymentStatus}>
          <option value="">Any payment status</option>
          {Object.entries(paymentStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </AdminSelect>
        <input
          className="h-8 w-28 rounded border border-(--admin-border) bg-[#182030] px-2 text-xs outline-none placeholder:text-[#6b7694]"
          placeholder="From"
        />
        <input
          className="h-8 w-28 rounded border border-(--admin-border) bg-[#182030] px-2 text-xs outline-none placeholder:text-[#6b7694]"
          placeholder="To"
        />
        {(orderStatus || paymentStatus) && (
          <button
            type="button"
            onClick={() => {
              setOrderStatus("");
              setPaymentStatus("");
            }}
            className="text-xs font-semibold text-[#9aaabb] hover:text-white"
          >
            Clear filters
          </button>
        )}
      </div>

      <StatePanel state={tableState} emptyLabel="No orders found">
        <DataTable
          columns={[
            "Order #",
            "Restaurant",
            "Created",
            "Items",
            "Order Status",
            "Payment",
            "Total",
            "Provider",
            "",
          ]}
        >
          {filtered.map((order) => (
            <tr
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="cursor-pointer border-b border-(--admin-border) transition hover:bg-[#1e2840]"
            >
              <Cell mono>{order.orderNumber}</Cell>
              <Cell>{restaurantName(order.restaurantId)}</Cell>
              <Cell muted>{formatDateTime(order.createdAt)}</Cell>
              <Cell>{order.items.length}</Cell>
              <Cell>
                <OrderStatusBadge status={order.orderStatus} />
              </Cell>
              <Cell>
                <PaymentStatusBadge status={order.paymentStatus} />
              </Cell>
              <Cell strong mono>
                {formatPrice(order.totalCents)}
              </Cell>
              <Cell muted>{order.payment.provider}</Cell>
              <Cell>
                <ChevronRight className="size-4 text-[#6b7694]" />
              </Cell>
            </tr>
          ))}
        </DataTable>
      </StatePanel>

      {selectedOrder ? (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      ) : null}
    </div>
  );
}

function OrderDetailModal({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  return (
    <Modal title={`Order ${order.orderNumber}`} onClose={onClose}>
      <div className="grid gap-5 p-5">
        <DetailSection title="Order">
          <Detail label="Order ID" value={order.id} mono />
          <Detail label="Order Number" value={order.orderNumber} mono />
          <Detail label="Restaurant" value={restaurantName(order.restaurantId)} />
          <Detail label="Created" value={formatDateTime(order.createdAt)} />
          <Detail label="Updated" value={formatDateTime(order.updatedAt)} />
          <Detail
            label="Order Status"
            value={<OrderStatusBadge status={order.orderStatus} />}
          />
          <Detail
            label="Payment Status"
            value={<PaymentStatusBadge status={order.paymentStatus} />}
          />
          <Detail label="Subtotal" value={formatPrice(order.subtotalCents)} />
          <Detail label="Total" value={formatPrice(order.totalCents)} strong />
        </DetailSection>

        <DetailSection title="Payment">
          <Detail label="Payment ID" value={order.payment.id} mono />
          <Detail label="Provider" value={order.payment.provider} />
          <Detail label="Provider Session ID" value={order.payment.sessionId} mono />
          <Detail
            label="Payment Intent ID"
            value={order.payment.intentId}
            mono
          />
          <Detail label="Amount" value={formatPrice(order.payment.amountCents)} />
          <Detail label="Currency" value={order.payment.currency} mono />
        </DetailSection>

        <DetailSection title={`Items (${order.items.length})`}>
          <div className="overflow-x-auto">
            <DataTable
              columns={[
                "Item ID",
                "Product ID",
                "Menu Product ID",
                "Name",
                "Type",
                "Unit",
                "Qty",
                "Line Total",
                "Configuration",
              ]}
            >
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-(--admin-border)">
                  <Cell mono muted>{item.id}</Cell>
                  <Cell mono muted>{item.productId}</Cell>
                  <Cell mono muted>{item.menuProductId}</Cell>
                  <Cell>{item.name}</Cell>
                  <Cell>
                    <Badge tone="neutral">{item.type}</Badge>
                  </Cell>
                  <Cell mono>{formatPrice(item.unitPriceCents)}</Cell>
                  <Cell>{item.quantity}</Cell>
                  <Cell mono strong>{formatPrice(item.lineTotalCents)}</Cell>
                  <Cell muted>{item.configuration}</Cell>
                </tr>
              ))}
            </DataTable>
          </div>
        </DetailSection>
      </div>
    </Modal>
  );
}

function MenuItemsView({
  sessionToken,
  restaurants,
  restaurantId,
  globalSearch,
}: {
  sessionToken: string;
  restaurants: AdminRestaurantSummary[];
  restaurantId: string;
  globalSearch: string;
}) {
  const [products, setProducts] = useState<MenuProduct[]>([]);
  const [savedProducts, setSavedProducts] = useState<MenuProduct[]>([]);
  const [visibility, setVisibility] = useState("");
  const [type, setType] = useState("");
  const [tableState, setTableState] = useState<TableState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [warningProduct, setWarningProduct] = useState<MenuProduct | null>(null);
  const savedVisibilityById = useMemo(
    () => new Map(savedProducts.map((product) => [product.id, product.visible])),
    [savedProducts],
  );
  const dirtyProductIds = useMemo(
    () =>
      new Set(
        products
          .filter((product) => {
            const savedVisibility = savedVisibilityById.get(product.id);

            return (
              savedVisibility !== undefined &&
              savedVisibility !== product.visible
            );
          })
          .map((product) => product.id),
      ),
    [products, savedVisibilityById],
  );
  const dirtyChanges = products.filter((product) =>
    dirtyProductIds.has(product.id),
  );

  const loadProducts = useCallback(async () => {
    setTableState("loading");
    setErrorMessage("");
    try {
      const response = await listAdminMenuProducts(sessionToken);
      const nextProducts = response.products.map(mapAdminMenuProduct);
      setProducts(nextProducts);
      setSavedProducts(nextProducts);
      setTableState(nextProducts.length > 0 ? "ready" : "empty");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not load menu items.",
      );
      setTableState("error");
    }
  }, [sessionToken]);

  useEffect(() => {
    void Promise.resolve().then(loadProducts);
  }, [loadProducts]);

  const filtered = products.filter((product) => {
    const q = globalSearch.toLowerCase();
    const isDirty = dirtyProductIds.has(product.id);
    if (restaurantId && product.restaurantId !== restaurantId) return false;
    if (visibility === "visible" && !product.visible && !isDirty) return false;
    if (visibility === "hidden" && product.visible && !isDirty) return false;
    if (type && product.type !== type) return false;
    if (
      q &&
      !product.name.toLowerCase().includes(q) &&
      !product.productId.toLowerCase().includes(q)
    ) {
      return false;
    }
    return true;
  });

  function toggleProduct(product: MenuProduct) {
    setStatusMessage("");
    setErrorMessage("");
    if (product.visible && product.affectedMeals) {
      setWarningProduct(product);
      return;
    }
    setProducts((current) =>
      current.map((item) =>
        item.id === product.id ? { ...item, visible: !item.visible } : item,
      ),
    );
  }

  function confirmHide() {
    if (!warningProduct) return;
    setStatusMessage("");
    setErrorMessage("");
    setProducts((current) =>
      current.map((item) =>
        item.id === warningProduct.id ? { ...item, visible: false } : item,
      ),
    );
    setWarningProduct(null);
  }

  async function saveVisibilityChanges() {
    if (dirtyChanges.length === 0) {
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setStatusMessage("");
    try {
      const response = await saveAdminMenuVisibility(
        sessionToken,
        dirtyChanges.map((product) => ({
          menuProductId: product.id,
          isVisible: product.visible,
        })),
      );
      const nextProducts = response.products.map(mapAdminMenuProduct);
      setProducts(nextProducts);
      setSavedProducts(nextProducts);
      setTableState(nextProducts.length > 0 ? "ready" : "empty");
      setStatusMessage(
        response.forcedHiddenMenuProductIds.length > 0
          ? `Saved ${response.updatedCount} changes. ${response.forcedHiddenMenuProductIds.length} meals were hidden because required groups have no visible options.`
          : `Saved ${response.updatedCount} visibility changes.`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not save menu visibility changes.",
      );
    } finally {
      setSaving(false);
    }
  }

  function resetVisibilityChanges() {
    setProducts(savedProducts.map((product) => ({ ...product })));
    setStatusMessage("");
    setErrorMessage("");
  }

  return (
    <div className="flex min-h-full flex-col">
      <ViewHeader
        title="Menu Items"
        description={`${filtered.length} products in current view`}
      />
      {errorMessage ? <AdminAlert tone="error">{errorMessage}</AdminAlert> : null}
      {statusMessage ? (
        <AdminAlert tone="success">{statusMessage}</AdminAlert>
      ) : null}
      <div className="flex flex-wrap items-center gap-2 border-b border-(--admin-border) bg-[#182030]/35 px-5 py-3">
        <SlidersHorizontal className="size-4 text-[#6b7694]" />
        <AdminSelect value={type} onChange={setType}>
          <option value="">Any type</option>
          <option value="ITEM">Item</option>
          <option value="MEAL">Meal</option>
          <option value="LARGE_MEAL">Large meal</option>
        </AdminSelect>
        <AdminSelect value={visibility} onChange={setVisibility}>
          <option value="">Any visibility</option>
          <option value="visible">Visible</option>
          <option value="hidden">Hidden</option>
        </AdminSelect>
        <div className="ml-auto flex items-center gap-2">
          {dirtyChanges.length > 0 ? (
            <span className="text-xs font-semibold text-amber-300">
              {dirtyChanges.length} unsaved
            </span>
          ) : (
            <span className="text-xs text-[#6b7694]">No unsaved changes</span>
          )}
          <SecondaryButton
            onClick={resetVisibilityChanges}
            disabled={dirtyChanges.length === 0 || saving}
          >
            Reset
          </SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={saveVisibilityChanges}
            disabled={saving || dirtyChanges.length === 0}
          >
            {saving ? "Saving..." : "Save changes"}
          </PrimaryButton>
        </div>
      </div>
      <StatePanel state={tableState} emptyLabel="No menu items found">
        <DataTable
          columns={[
            "Product",
            "Type",
            "Category",
            "Restaurant",
            "Price",
            "Visibility",
          ]}
        >
          {filtered.map((product) => (
            <tr key={product.id} className="border-b border-(--admin-border)">
              <Cell>
                <div className="flex items-center gap-3">
                  <img
                    src={product.imageUrl}
                    alt=""
                    className="size-10 rounded object-cover"
                  />
                  <div>
                    <p className="font-semibold text-[#dde2ee]">
                      {product.name}
                    </p>
                    <p className="font-mono text-[10px] text-[#6b7694]">
                      {product.productId}
                    </p>
                  </div>
                </div>
              </Cell>
              <Cell>
                <Badge tone="neutral">{product.type}</Badge>
              </Cell>
              <Cell muted>{product.category}</Cell>
              <Cell muted>
                {restaurants.find((restaurant) => restaurant.id === product.restaurantId)
                  ?.name ?? product.restaurantName}
              </Cell>
              <Cell mono>
                {formatPrice(product.priceCents)} {product.currencyCode}
              </Cell>
              <Cell>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleProduct(product)}
                    className={`relative h-5 w-9 rounded-full transition ${
                      product.visible ? "bg-emerald-500" : "bg-[#2d3a5c]"
                    }`}
                    aria-label={`Toggle ${product.name} visibility`}
                  >
                    <span
                      className={`absolute top-0.5 size-4 rounded-full bg-white transition ${
                        product.visible ? "left-4" : "left-0.5"
                      }`}
                    />
                  </button>
                  <span
                    className={`text-xs font-semibold ${
                      product.visible ? "text-emerald-300" : "text-[#6b7694]"
                    }`}
                  >
                    {product.visible ? "Visible" : "Hidden"}
                  </span>
                  {product.forcedHiddenReason ? (
                    <Badge tone="amber">Meal auto-hidden</Badge>
                  ) : null}
                  {dirtyProductIds.has(product.id) ? (
                    <Badge tone="amber">Unsaved</Badge>
                  ) : null}
                </div>
              </Cell>
            </tr>
          ))}
        </DataTable>
      </StatePanel>

      {warningProduct ? (
        <Modal title="Visibility warning" onClose={() => setWarningProduct(null)}>
          <div className="space-y-4 p-5">
            <div className="flex gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-300">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Hiding this item can affect meals
                </p>
                <p className="mt-1 text-sm leading-6 text-[#9aaabb]">
                  If a required meal group has no visible options after saving,
                  the backend will hide that meal from the kiosk menu.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <SecondaryButton onClick={() => setWarningProduct(null)}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="button" onClick={confirmHide}>
                Hide product
              </PrimaryButton>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function AdminUsersView({ sessionToken }: { sessionToken: string }) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [adminRestaurants, setAdminRestaurants] = useState<
    AdminRestaurantSummary[]
  >([]);
  const [tableState, setTableState] = useState<TableState>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const loadAdminData = useCallback(async () => {
    setTableState("loading");
    setErrorMessage("");
    try {
      const [userResponse, restaurantResponse] = await Promise.all([
        listAdminUsers(sessionToken),
        listAdminRestaurants(sessionToken),
      ]);
      setUsers(userResponse.users.map(mapAdminUser));
      setAdminRestaurants(restaurantResponse.restaurants);
      setTableState(userResponse.users.length > 0 ? "ready" : "empty");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not load admin users.",
      );
      setTableState("error");
    }
  }, [sessionToken]);

  useEffect(() => {
    void Promise.resolve().then(loadAdminData);
  }, [loadAdminData]);

  async function handleInvite(invite: {
    email: string;
    password: string;
    restaurantId: string;
  }): Promise<InviteAdminUserResponse> {
    const response = await inviteAdminUser(sessionToken, {
      email: invite.email,
      password: invite.password,
      restaurantIds: [invite.restaurantId],
    });
    await loadAdminData();

    return response;
  }

  return (
    <div>
      <ViewHeader
        title="Admin Users"
        description="Only super admins can invite workers and manage restaurant access."
        action={
          <PrimaryButton type="button" onClick={() => setInviteOpen(true)}>
            Send invite
          </PrimaryButton>
        }
      />
      {errorMessage ? <AdminAlert tone="error">{errorMessage}</AdminAlert> : null}
      <StatePanel state={tableState} emptyLabel="No admin users found">
        <DataTable
          columns={[
            "Name",
            "Email",
            "Role",
            "Restaurants",
            "2FA",
            "Activity",
            "Status",
            "Last login",
          ]}
        >
          {users.map((admin) => (
            <tr key={admin.id} className="border-b border-(--admin-border)">
              <Cell>{admin.name}</Cell>
              <Cell mono muted>{admin.email}</Cell>
              <Cell>
                <Badge tone={admin.role === "SUPER_ADMIN" ? "purple" : "blue"}>
                  {admin.role}
                </Badge>
              </Cell>
              <Cell muted>{admin.restaurants.join(", ")}</Cell>
              <Cell>
                <Badge tone={admin.twoFactorEnabled ? "green" : "amber"}>
                  {admin.twoFactorEnabled ? "Enabled" : "Pending"}
                </Badge>
              </Cell>
              <Cell>
                <Badge tone={admin.status === "active" ? "green" : "amber"}>
                  {admin.status === "active" ? "Active user" : "Invitation sent"}
                </Badge>
              </Cell>
              <Cell>
                <Badge tone={admin.status === "active" ? "green" : "amber"}>
                  {admin.status}
                </Badge>
              </Cell>
              <Cell muted>
                {admin.lastLoginAt === "Never"
                  ? "Never"
                  : formatDateTime(admin.lastLoginAt)}
              </Cell>
            </tr>
          ))}
        </DataTable>
      </StatePanel>
      {inviteOpen ? (
        <InviteModal
          restaurants={adminRestaurants}
          onClose={() => setInviteOpen(false)}
          onInvite={handleInvite}
        />
      ) : null}
    </div>
  );
}

function InviteModal({
  restaurants,
  onClose,
  onInvite,
}: {
  restaurants: AdminRestaurantSummary[];
  onClose: () => void;
  onInvite: (invite: {
    email: string;
    password: string;
    restaurantId: string;
  }) => Promise<InviteAdminUserResponse>;
}) {
  const [sent, setSent] = useState<InviteAdminUserResponse | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [restaurantId, setRestaurantId] = useState(restaurants[0]?.id ?? "");
  const [errorMessage, setErrorMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErrorMessage("");
    try {
      setSent(await onInvite({ email, password, restaurantId }));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not send invite.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Invite new admin user" onClose={onClose}>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 p-5"
      >
        {sent ? (
          <div className="space-y-4">
            <div className="rounded-md border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-200">
              Invitation sent to <strong>{sent.email}</strong>. The new admin is
              pending until they confirm the invite and complete 2FA login.
            </div>
            <AdminReadonly label="Invitation URL" value={sent.invitationUrl} />
            <AdminReadonly
              label="Google Authenticator manual key"
              value={sent.twoFactorSetup.manualEntryKey}
            />
            {sent.delivery.previewToken ? (
              <AdminReadonly label="Dev invite token" value={sent.delivery.previewToken} />
            ) : null}
            <div className="flex justify-end">
              <PrimaryButton type="button" onClick={onClose}>
                Close
              </PrimaryButton>
            </div>
          </div>
        ) : (
          <>
            {errorMessage ? (
              <AdminAlert tone="error">{errorMessage}</AdminAlert>
            ) : null}
            <p className="rounded-md border border-(--admin-border) bg-[#0c0f1a] px-3 py-2 text-xs leading-5 text-[#9aaabb]">
              Super admin creates the worker account, sets initial credentials,
              and sends the invite. The user becomes active only after 2FA
              setup and first successful login.
            </p>
            <AdminField label="Email" icon={<User className="size-4" />}>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                required
                placeholder="worker@restaurant.example"
                className="w-full bg-transparent text-sm outline-none placeholder:text-[#6b7694]"
              />
            </AdminField>
            <AdminField label="Initial password" icon={<Shield className="size-4" />}>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                required
                minLength={12}
                placeholder="Temporary password"
                className="w-full bg-transparent text-sm outline-none placeholder:text-[#6b7694]"
              />
            </AdminField>
            <AdminReadonly label="Role" value="ADMIN" />
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#9aaabb]">
                Restaurant access
              </p>
              <AdminSelect value={restaurantId} onChange={setRestaurantId}>
                {restaurants.map((restaurant) => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name} ({restaurant.slug})
                  </option>
                ))}
              </AdminSelect>
            </div>
            <div className="flex justify-end gap-2">
              <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
              <PrimaryButton type="submit" disabled={busy || !restaurantId}>
                {busy ? "Sending..." : "Send invitation"}
              </PrimaryButton>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}

function RestaurantsView() {
  return (
    <PlaceholderView
      icon={<Building2 className="size-6" />}
      title="Restaurants"
      text="Restaurant management is planned for the next backend slice. Current admin mocks use three sample restaurants."
    />
  );
}

function SettingsView() {
  return (
    <PlaceholderView
      icon={<Settings className="size-6" />}
      title="Settings"
      text="Admin settings will include session behavior and 2FA recovery policy."
    />
  );
}

function PlaceholderView({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex min-h-full items-center justify-center p-8">
      <div className="max-w-md rounded-lg border border-(--admin-border) bg-[#111828] p-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-[#182030] text-[#9aaabb]">
          {icon}
        </div>
        <h1 className="text-base font-semibold text-white">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[#9aaabb]">{text}</p>
      </div>
    </div>
  );
}

function ViewHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-16 items-center justify-between border-b border-(--admin-border) px-5 py-3">
      <div>
        <h1 className="text-sm font-semibold text-white">{title}</h1>
        <p className="mt-0.5 text-xs text-[#6b7694]">{description}</p>
      </div>
      {action}
    </div>
  );
}

function DataTable({
  columns,
  children,
}: {
  columns: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-190 text-left">
        <thead className="bg-[#111828]">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className="border-b border-(--admin-border) px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b7694]"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Cell({
  children,
  mono,
  muted,
  strong,
}: {
  children: ReactNode;
  mono?: boolean;
  muted?: boolean;
  strong?: boolean;
}) {
  return (
    <td
      className={`px-4 py-3 text-xs ${mono ? "font-mono" : ""} ${
        muted ? "text-[#9aaabb]" : "text-[#dde2ee]"
      } ${strong ? "font-semibold" : ""}`}
    >
      {children}
    </td>
  );
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6b7694]">
        {title}
      </h2>
      <div className="rounded-md border border-(--admin-border)">
        {children}
      </div>
    </section>
  );
}

function Detail({
  label,
  value,
  mono,
  strong,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
  strong?: boolean;
}) {
  return (
    <div className="grid grid-cols-[170px_1fr] gap-4 border-b border-(--admin-border) px-4 py-2.5 last:border-b-0">
      <dt className="text-xs text-[#6b7694]">{label}</dt>
      <dd className={`text-xs text-[#dde2ee] ${mono ? "font-mono" : ""} ${strong ? "font-semibold" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

function StatePanel({
  state,
  emptyLabel,
  children,
}: {
  state: TableState;
  emptyLabel: string;
  children: ReactNode;
}) {
  if (state === "loading") {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-[#9aaabb]">
        <Loader2 className="size-5 animate-spin" />
        Loading data...
      </div>
    );
  }
  if (state === "error") {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-sm text-[#9aaabb]">
        <AlertTriangle className="size-8 text-amber-300" />
        Failed to load data.
      </div>
    );
  }
  if (state === "empty") {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-sm text-[#9aaabb]">
        <ShoppingCart className="size-8" />
        {emptyLabel}
      </div>
    );
  }
  return <>{children}</>;
}

function DemoStateControls({
  value,
  onChange,
}: {
  value: TableState;
  onChange: (value: TableState) => void;
}) {
  return (
    <div className="flex overflow-hidden rounded border border-(--admin-border)">
      {(["ready", "loading", "error", "empty"] as const).map((state) => (
        <button
          key={state}
          type="button"
          onClick={() => onChange(state)}
          className={`px-2.5 py-1 text-[10px] font-semibold ${
            value === state ? "bg-[#1e2840] text-white" : "text-[#6b7694]"
          }`}
        >
          {state}
        </button>
      ))}
    </div>
  );
}

function PanelHeading({ title, text }: { title: string; text: string }) {
  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="text-sm leading-6 text-[#9aaabb]">{text}</p>
    </div>
  );
}

function AdminAlert({
  tone,
  children,
}: {
  tone: "success" | "error";
  children: ReactNode;
}) {
  const classes =
    tone === "success"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
      : "border-red-500/25 bg-red-500/10 text-red-200";

  return (
    <div className={`mb-4 rounded-md border px-3 py-2 text-xs leading-5 ${classes}`}>
      {children}
    </div>
  );
}

function AdminField({
  label,
  icon,
  children,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold text-[#9aaabb]">{label}</span>
      <span className="flex h-11 items-center gap-2 rounded-md border border-(--admin-border) bg-[#182030] px-3 text-[#9aaabb] focus-within:border-[#4f7ef7]">
        {icon}
        {children}
      </span>
    </label>
  );
}

function AdminReadonly({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-[#9aaabb]">{label}</p>
      <div className="rounded-md border border-(--admin-border) bg-[#182030] px-3 py-2 text-sm font-semibold text-[#dde2ee]">
        {value}
      </div>
    </div>
  );
}

function AdminSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-8 rounded border border-(--admin-border) bg-[#182030] px-2 text-xs text-[#dde2ee] outline-none focus:border-[#4f7ef7]"
    >
      {children}
    </select>
  );
}

function PrimaryButton({
  type,
  onClick,
  disabled,
  children,
}: {
  type: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`min-h-9 rounded-md px-3 text-xs font-semibold transition ${
        disabled
          ? "cursor-not-allowed bg-[#2d3a5c] text-[#6b7694]"
          : "bg-[#4f7ef7] text-white hover:bg-[#416de0]"
      } ${focusRing}`}
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-h-9 rounded-md border border-(--admin-border) px-3 text-xs font-semibold transition ${
        disabled
          ? "cursor-not-allowed text-[#4f5872]"
          : "text-[#9aaabb] hover:text-white"
      } ${focusRing}`}
    >
      {children}
    </button>
  );
}

function NavButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition ${
        active
          ? "bg-[#182030] text-white"
          : "text-[#9aaabb] hover:bg-[#182030]/60 hover:text-white"
      }`}
    >
      <span className={active ? "text-[#4f7ef7]" : ""}>{icon}</span>
      {label}
    </button>
  );
}

function InfoLine({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[#4f7ef7]">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "green" | "amber" | "red" | "blue" | "purple" | "neutral";
  children: ReactNode;
}) {
  const classes = {
    green: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    amber: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    red: "border-red-500/25 bg-red-500/10 text-red-300",
    blue: "border-sky-500/25 bg-sky-500/10 text-sky-300",
    purple: "border-violet-500/25 bg-violet-500/10 text-violet-300",
    neutral: "border-(--admin-border) bg-[#182030] text-[#9aaabb]",
  } satisfies Record<string, string>;

  return (
    <span
      className={`inline-flex min-h-6 items-center rounded border px-2 text-[10px] font-semibold ${classes[tone]}`}
    >
      {children}
    </span>
  );
}

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const tone: Record<OrderStatus, Parameters<typeof Badge>[0]["tone"]> = {
    NEW: "blue",
    IN_PROGRESS: "amber",
    READY: "green",
    COMPLETED: "neutral",
    CANCELLED: "red",
  };
  return <Badge tone={tone[status]}>{orderStatusLabels[status]}</Badge>;
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const tone: Record<PaymentStatus, Parameters<typeof Badge>[0]["tone"]> = {
    PENDING: "neutral",
    AWAITING_PAYMENT_CONFIRMATION: "amber",
    PAID: "green",
    FAILED: "red",
    CANCELLED: "red",
  };
  return <Badge tone={tone[status]}>{paymentStatusLabels[status]}</Badge>;
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
    >
      <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-lg border border-(--admin-border) bg-[#111828] shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between border-b border-(--admin-border) px-5 py-3">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[#9aaabb] hover:bg-[#182030] hover:text-white"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}




