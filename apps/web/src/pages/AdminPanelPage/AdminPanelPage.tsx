import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  AlertTriangle,
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

type AdminView = "login" | "shell";
type LoginMode = "email" | "qr";
type LoginStep = "credentials" | "two-factor";
type ShellView = "orders" | "menu" | "admins" | "restaurants" | "settings";
type Role = "SUPER_ADMIN" | "ADMIN";
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
  name: string;
  category: string;
  type: ProductType;
  priceCents: number;
  visible: boolean;
  imageUrl: string;
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

const initialMenuProducts: MenuProduct[] = [
  {
    id: "mp_classic_burger_meal",
    productId: "prod_classic_burger_meal",
    restaurantId: "central",
    name: "Classic Burger Meal",
    category: "Meals",
    type: "MEAL",
    priceCents: 4550,
    visible: true,
    imageUrl:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=96&h=96&fit=crop&auto=format",
  },
  {
    id: "mp_small_fries",
    productId: "prod_small_fries",
    restaurantId: "central",
    name: "Small Fries",
    category: "Sides",
    type: "ITEM",
    priceCents: 900,
    visible: true,
    imageUrl:
      "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=96&h=96&fit=crop&auto=format",
    requiredGroup: "Side",
    affectedMeals: 3,
  },
  {
    id: "mp_cola",
    productId: "prod_cola",
    restaurantId: "central",
    name: "Cola",
    category: "Drinks",
    type: "ITEM",
    priceCents: 800,
    visible: true,
    imageUrl:
      "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=96&h=96&fit=crop&auto=format",
  },
  {
    id: "mp_large_burger_meal",
    productId: "prod_large_burger_meal",
    restaurantId: "riverside",
    name: "Large Burger Meal",
    category: "Meals",
    type: "LARGE_MEAL",
    priceCents: 6890,
    visible: true,
    imageUrl:
      "https://images.unsplash.com/photo-1550547660-d9450f859349?w=96&h=96&fit=crop&auto=format",
  },
  {
    id: "mp_large_fries",
    productId: "prod_large_fries",
    restaurantId: "riverside",
    name: "Large Fries",
    category: "Sides",
    type: "ITEM",
    priceCents: 1200,
    visible: true,
    imageUrl:
      "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=96&h=96&fit=crop&auto=format",
    requiredGroup: "Side",
    affectedMeals: 2,
  },
  {
    id: "mp_chicken_wrap",
    productId: "prod_chicken_wrap",
    restaurantId: "airport",
    name: "Chicken Wrap",
    category: "Wraps",
    type: "ITEM",
    priceCents: 3200,
    visible: false,
    imageUrl:
      "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=96&h=96&fit=crop&auto=format",
  },
];

const adminUsers: AdminUser[] = [
  {
    id: "admin_001",
    email: "owner@kiosk-platform.dev",
    name: "Milosz Owner",
    role: "SUPER_ADMIN",
    restaurants: ["All restaurants"],
    twoFactorEnabled: true,
    status: "active",
    lastLoginAt: "2026-07-27T09:30:00.000Z",
  },
  {
    id: "admin_002",
    email: "manager@central.example",
    name: "Central Manager",
    role: "ADMIN",
    restaurants: ["Central Burger House"],
    twoFactorEnabled: true,
    status: "active",
    lastLoginAt: "2026-07-26T18:20:00.000Z",
  },
  {
    id: "admin_003",
    email: "worker@riverside.example",
    name: "Riverside Worker",
    role: "ADMIN",
    restaurants: ["Riverside Kiosk"],
    twoFactorEnabled: false,
    status: "pending",
    lastLoginAt: "Never",
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

export function AdminPanelPage({ onBackToKiosk }: AdminPanelPageProps) {
  const [view, setView] = useState<AdminView>("login");
  const [role] = useState<Role>("SUPER_ADMIN");

  if (view === "shell") {
    return (
      <AdminFrame>
        <AdminShell
          role={role}
          onBackToKiosk={onBackToKiosk}
          onLogout={() => setView("login")}
        />
      </AdminFrame>
    );
  }

  return (
    <AdminFrame>
      <AdminLogin
        onBackToKiosk={onBackToKiosk}
        onSignedIn={() => setView("shell")}
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
  onSignedIn: () => void;
}

function AdminLogin({
  onBackToKiosk,
  onSignedIn,
}: AdminLoginProps) {
  const [mode, setMode] = useState<LoginMode>("email");
  const [step, setStep] = useState<LoginStep>("credentials");
  const [qrState, setQrState] = useState<"waiting" | "approved" | "expired">(
    "waiting",
  );

  function handleCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStep("two-factor");
  }

  function handleTwoFactor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSignedIn();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <button
        type="button"
        onClick={onBackToKiosk}
        className={`absolute left-6 top-6 rounded-md border border-[var(--admin-border)] bg-[#111828] px-3 py-2 text-xs font-semibold text-[#9aaabb] transition hover:text-[#dde2ee] ${focusRing}`}
      >
        Back to kiosk
      </button>

      <section className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-[var(--admin-border)] bg-[#111828] shadow-2xl shadow-black/40 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="border-b border-[var(--admin-border)] bg-[#090d16] p-8 lg:border-b-0 lg:border-r">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-[#4f7ef7]">
              <Utensils aria-hidden="true" className="size-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold">KioskPlatform</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#6b7694]">
                Admin Console
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7694]">
              Secure operations
            </p>
            <h1 className="text-3xl font-semibold leading-tight text-white">
              Manage restaurants, orders, payments, and menu visibility.
            </h1>
            <p className="max-w-sm text-sm leading-6 text-[#9aaabb]">
              Frontend-only admin slice using the Figma panel style. Backend
              authentication and authorization endpoints are planned next.
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
          <div className="mb-6 grid grid-cols-2 rounded-md border border-[var(--admin-border)] bg-[#182030] p-1">
            <button
              type="button"
              onClick={() => setMode("email")}
              className={`rounded px-3 py-2 text-xs font-semibold transition ${
                mode === "email"
                  ? "bg-[#4f7ef7] text-white"
                  : "text-[#9aaabb] hover:text-white"
              }`}
            >
              Email + 2FA
            </button>
            <button
              type="button"
              onClick={() => setMode("qr")}
              className={`rounded px-3 py-2 text-xs font-semibold transition ${
                mode === "qr"
                  ? "bg-[#4f7ef7] text-white"
                  : "text-[#9aaabb] hover:text-white"
              }`}
            >
              QR login
            </button>
          </div>

          {mode === "email" && step === "credentials" ? (
            <form onSubmit={handleCredentials} className="space-y-5">
              <PanelHeading
                title="Sign in"
                text="Use your admin credentials. The next step requires an authenticator code."
              />
              <AdminField label="Email" icon={<User className="size-4" />}>
                <input
                  type="email"
                  autoComplete="username"
                  placeholder="owner@kiosk-platform.dev"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[#6b7694]"
                />
              </AdminField>
              <AdminField label="Password" icon={<Shield className="size-4" />}>
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Password"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[#6b7694]"
                />
              </AdminField>
              <button
                type="submit"
                className={`min-h-11 w-full rounded-md bg-[#4f7ef7] px-4 text-sm font-semibold text-white transition hover:bg-[#416de0] ${focusRing}`}
              >
                Continue
              </button>
              <p className="rounded-md border border-[var(--admin-border)] bg-[#0c0f1a] px-3 py-2 text-xs leading-5 text-[#9aaabb]">
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
              <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: 6 }, (_, index) => (
                  <input
                    key={index}
                    inputMode="numeric"
                    maxLength={1}
                    className="h-12 rounded-md border border-[var(--admin-border)] bg-[#182030] text-center text-lg font-semibold outline-none focus:border-[#4f7ef7]"
                    aria-label={`2FA digit ${index + 1}`}
                  />
                ))}
              </div>
              <button
                type="submit"
                className={`min-h-11 w-full rounded-md bg-[#4f7ef7] px-4 text-sm font-semibold text-white transition hover:bg-[#416de0] ${focusRing}`}
              >
                Verify and open admin panel
              </button>
            </form>
          ) : null}

          {mode === "qr" ? (
            <div className="space-y-5">
              <PanelHeading
                title="QR-assisted login"
                text="Scan with a trusted admin device. This is a frontend placeholder for the future challenge flow."
              />
              <div className="flex justify-center rounded-lg border border-[var(--admin-border)] bg-[#182030] p-6">
                <MockQr />
              </div>
              <div className="flex items-center justify-between rounded-md border border-[var(--admin-border)] bg-[#0c0f1a] px-3 py-2 text-xs text-[#9aaabb]">
                <span>
                  {qrState === "waiting"
                    ? "Waiting for trusted device approval"
                    : qrState === "approved"
                      ? "Challenge approved"
                      : "Challenge expired"}
                </span>
                <span>01:42</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(["waiting", "approved", "expired"] as const).map((state) => (
                  <button
                    key={state}
                    type="button"
                    onClick={() => setQrState(state)}
                    className={`rounded-md border border-[var(--admin-border)] px-3 py-2 text-xs font-semibold ${
                      qrState === state
                        ? "bg-[#1e2840] text-white"
                        : "text-[#9aaabb]"
                    }`}
                  >
                    {state}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={onSignedIn}
                disabled={qrState !== "approved"}
                className={`min-h-11 w-full rounded-md px-4 text-sm font-semibold transition ${
                  qrState === "approved"
                    ? "bg-[#4f7ef7] text-white hover:bg-[#416de0]"
                    : "cursor-not-allowed bg-[#182030] text-[#6b7694]"
                } ${focusRing}`}
              >
                Open admin panel
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

interface AdminShellProps {
  role: Role;
  onBackToKiosk: () => void;
  onLogout: () => void;
}

function AdminShell({ role, onBackToKiosk, onLogout }: AdminShellProps) {
  const [view, setView] = useState<ShellView>("orders");
  const [restaurantId, setRestaurantId] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-56 shrink-0 flex-col border-r border-[var(--admin-border)] bg-[#090d16]">
        <div className="border-b border-[var(--admin-border)] px-4 py-4">
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

        <div className="border-t border-[var(--admin-border)] p-3">
          <button
            type="button"
            onClick={onBackToKiosk}
            className="w-full rounded-md border border-[var(--admin-border)] px-3 py-2 text-left text-xs font-semibold text-[#9aaabb] transition hover:text-white"
          >
            Back to kiosk
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-[var(--admin-border)] bg-[#111828] px-4">
          <select
            value={restaurantId}
            onChange={(event) => setRestaurantId(event.target.value)}
            className="h-8 rounded border border-[var(--admin-border)] bg-[#182030] px-2 text-xs font-semibold text-[#dde2ee] outline-none"
            aria-label="Restaurant filter"
          >
            <option value="">All restaurants</option>
            {restaurants.map((restaurant) => (
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
              className="h-8 w-full rounded border border-[var(--admin-border)] bg-[#182030] pl-8 pr-3 text-xs outline-none placeholder:text-[#6b7694] focus:border-[#4f7ef7]"
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
                Milosz Owner
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
              restaurantId={restaurantId}
              globalSearch={globalSearch}
            />
          ) : null}
          {view === "admins" ? <AdminUsersView /> : null}
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

      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--admin-border)] bg-[#182030]/35 px-5 py-3">
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
          className="h-8 w-28 rounded border border-[var(--admin-border)] bg-[#182030] px-2 text-xs outline-none placeholder:text-[#6b7694]"
          placeholder="From"
        />
        <input
          className="h-8 w-28 rounded border border-[var(--admin-border)] bg-[#182030] px-2 text-xs outline-none placeholder:text-[#6b7694]"
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
              className="cursor-pointer border-b border-[var(--admin-border)] transition hover:bg-[#1e2840]"
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
                <tr key={item.id} className="border-b border-[var(--admin-border)]">
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
  restaurantId,
  globalSearch,
}: {
  restaurantId: string;
  globalSearch: string;
}) {
  const [products, setProducts] = useState(initialMenuProducts);
  const [visibility, setVisibility] = useState("");
  const [type, setType] = useState("");
  const [warningProduct, setWarningProduct] = useState<MenuProduct | null>(null);

  const filtered = products.filter((product) => {
    if (restaurantId && product.restaurantId !== restaurantId) return false;
    if (visibility === "visible" && !product.visible) return false;
    if (visibility === "hidden" && product.visible) return false;
    if (type && product.type !== type) return false;
    if (
      globalSearch &&
      !product.name.toLowerCase().includes(globalSearch.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  function toggleProduct(product: MenuProduct) {
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
    setProducts((current) =>
      current.map((item) =>
        item.id === warningProduct.id ? { ...item, visible: false } : item,
      ),
    );
    setWarningProduct(null);
  }

  return (
    <div className="flex min-h-full flex-col">
      <ViewHeader
        title="Menu Items"
        description={`${filtered.length} products in current view`}
      />
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--admin-border)] bg-[#182030]/35 px-5 py-3">
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
      </div>
      <DataTable columns={["Product", "Type", "Category", "Restaurant", "Price", "Visibility"]}>
        {filtered.map((product) => (
          <tr key={product.id} className="border-b border-[var(--admin-border)]">
            <Cell>
              <div className="flex items-center gap-3">
                <img
                  src={product.imageUrl}
                  alt=""
                  className="size-10 rounded object-cover"
                />
                <div>
                  <p className="font-semibold text-[#dde2ee]">{product.name}</p>
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
            <Cell muted>{restaurantName(product.restaurantId)}</Cell>
            <Cell mono>{formatPrice(product.priceCents)}</Cell>
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
              </div>
            </Cell>
          </tr>
        ))}
      </DataTable>

      {warningProduct ? (
        <Modal title="Visibility warning" onClose={() => setWarningProduct(null)}>
          <div className="space-y-4 p-5">
            <div className="flex gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-300">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Hiding this item affects meals
                </p>
                <p className="mt-1 text-sm leading-6 text-[#9aaabb]">
                  Hiding {warningProduct.name} will make{" "}
                  {warningProduct.affectedMeals} meals unavailable because the
                  required {warningProduct.requiredGroup} group will have no
                  visible option.
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

function AdminUsersView() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [users, setUsers] = useState(adminUsers);

  function handleInvite(invite: {
    email: string;
    password: string;
    restaurantId: string;
  }) {
    const restaurant = restaurantName(invite.restaurantId);
    setUsers((current) => [
      ...current,
      {
        id: `admin_${current.length + 1}`.padStart(9, "0"),
        email: invite.email,
        name: invite.email.split("@")[0] || "Invited admin",
        role: "ADMIN",
        restaurants: [restaurant],
        twoFactorEnabled: false,
        status: "pending",
        lastLoginAt: "Never",
      },
    ]);
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
          <tr key={admin.id} className="border-b border-[var(--admin-border)]">
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
            <Cell muted>{admin.lastLoginAt === "Never" ? "Never" : formatDateTime(admin.lastLoginAt)}</Cell>
          </tr>
        ))}
      </DataTable>
      {inviteOpen ? (
        <InviteModal
          onClose={() => setInviteOpen(false)}
          onInvite={handleInvite}
        />
      ) : null}
    </div>
  );
}

function InviteModal({
  onClose,
  onInvite,
}: {
  onClose: () => void;
  onInvite: (invite: {
    email: string;
    password: string;
    restaurantId: string;
  }) => void;
}) {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [restaurantId, setRestaurantId] = useState(restaurants[0]?.id ?? "");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onInvite({ email, password, restaurantId });
    setSent(true);
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
              Invitation sent to <strong>{email}</strong>. The new admin is now
              listed as pending until they complete 2FA and first login.
            </div>
            <div className="rounded-md border border-[var(--admin-border)] bg-[#0c0f1a] p-4 text-xs leading-5 text-[#9aaabb]">
              Frontend mock note: the password is collected here because the
              super admin currently prepares credentials. Backend should hash
              it and email only the invite link or onboarding instructions.
            </div>
            <div className="flex justify-end">
              <PrimaryButton type="button" onClick={onClose}>
                Close
              </PrimaryButton>
            </div>
          </div>
        ) : (
          <>
            <p className="rounded-md border border-[var(--admin-border)] bg-[#0c0f1a] px-3 py-2 text-xs leading-5 text-[#9aaabb]">
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
                minLength={8}
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
                    {restaurant.name}
                  </option>
                ))}
              </AdminSelect>
            </div>
            <div className="flex justify-end gap-2">
              <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
              <PrimaryButton type="submit">Send invitation</PrimaryButton>
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
      text="Admin settings will include session behavior, trusted devices, and 2FA recovery policy."
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
      <div className="max-w-md rounded-lg border border-[var(--admin-border)] bg-[#111828] p-8 text-center">
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
    <div className="flex min-h-16 items-center justify-between border-b border-[var(--admin-border)] px-5 py-3">
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
      <table className="w-full min-w-[760px] text-left">
        <thead className="bg-[#111828]">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className="border-b border-[var(--admin-border)] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b7694]"
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
      <div className="rounded-md border border-[var(--admin-border)]">
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
    <div className="grid grid-cols-[170px_1fr] gap-4 border-b border-[var(--admin-border)] px-4 py-2.5 last:border-b-0">
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
    <div className="flex overflow-hidden rounded border border-[var(--admin-border)]">
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
      <span className="flex h-11 items-center gap-2 rounded-md border border-[var(--admin-border)] bg-[#182030] px-3 text-[#9aaabb] focus-within:border-[#4f7ef7]">
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
      <div className="rounded-md border border-[var(--admin-border)] bg-[#182030] px-3 py-2 text-sm font-semibold text-[#dde2ee]">
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
      className="h-8 rounded border border-[var(--admin-border)] bg-[#182030] px-2 text-xs text-[#dde2ee] outline-none focus:border-[#4f7ef7]"
    >
      {children}
    </select>
  );
}

function PrimaryButton({
  type,
  onClick,
  children,
}: {
  type: "button" | "submit";
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`min-h-9 rounded-md bg-[#4f7ef7] px-3 text-xs font-semibold text-white transition hover:bg-[#416de0] ${focusRing}`}
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-9 rounded-md border border-[var(--admin-border)] px-3 text-xs font-semibold text-[#9aaabb] transition hover:text-white ${focusRing}`}
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
    neutral: "border-[var(--admin-border)] bg-[#182030] text-[#9aaabb]",
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
      <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-lg border border-[var(--admin-border)] bg-[#111828] shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-5 py-3">
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

function MockQr() {
  return (
    <div className="grid size-40 grid-cols-8 gap-1 rounded-md bg-[#0c0f1a] p-3">
      {Array.from({ length: 64 }, (_, index) => {
        const active =
          index % 3 === 0 ||
          index % 7 === 0 ||
          [0, 1, 6, 7, 8, 15, 48, 49, 56, 57].includes(index);
        return (
          <span
            key={index}
            className={`rounded-sm ${active ? "bg-[#dde2ee]" : "bg-[#182030]"}`}
          />
        );
      })}
    </div>
  );
}
