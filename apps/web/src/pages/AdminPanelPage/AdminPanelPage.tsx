import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import QRCode from "qrcode";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  ChevronRight,
  Copy,
  CreditCard,
  ImageIcon,
  Loader2,
  LogOut,
  Package,
  Plus,
  Search,
  Settings,
  Shield,
  ShoppingCart,
  SlidersHorizontal,
  Trash2,
  User,
  Users,
  Utensils,
  X,
} from "lucide-react";
import { focusRing } from "../../shared/components/IconButton";
import { summarizeBasketConfiguration } from "../../features/cart/lib/configurationSummary";
import {
  bootstrapSuperAdmin,
  cancelAdminBootstrapSetup,
  forgotAdminPassword,
  getAdminBootstrapStatus,
  getAdminOrder,
  inviteAdminUser,
  listAdminOrders,
  listAdminMenuProducts,
  listAdminRestaurants,
  listAdminUsers,
  loginAdmin,
  logoutAdmin,
  regenerateAdminRecoveryCodes,
  resetAdminPassword,
  saveAdminMenuVisibility,
  setupAdminInvite,
  updateAdminOrderStatus,
  verifyAdminInviteTwoFactor,
  verifyBootstrapTwoFactor,
  verifyAdminTwoFactor,
  type AdminOrderDetail,
  type AdminOrderStatus,
  type AdminMenuProductSummary,
  type AdminOrderSummary,
  type AdminPaymentStatus,
  type AdminRestaurantSummary,
  type AdminRole,
  type AdminSessionUser,
  type AdminUserSummary,
  type AuthenticatedAdminResponse,
  type InviteAdminUserResponse,
} from "../../features/admin/api/adminApi";

type AdminView = "login" | "shell";
type LoginMode = "email" | "setup" | "reset" | "invite" | "recovery";
type LoginStep = "credentials" | "two-factor";
type SetupStep = "account" | "two-factor";
type ShellView = "orders" | "menu" | "admins" | "restaurants" | "settings";
type Role = AdminRole;
type OrderStatus = AdminOrderStatus;
type PaymentStatus = AdminPaymentStatus;
type ProductType = "ITEM" | "MEAL" | "LARGE_MEAL";
type TableState = "ready" | "loading" | "error" | "empty";

const canUseTemporaryAdminBypass =
  import.meta.env.DEV && import.meta.env.VITE_ENABLE_ADMIN_BYPASS === "true";

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
  provider: "STRIPE";
  sessionId: string;
  intentId: string | null;
  amountCents: number;
  currency: string;
}

interface Order {
  id: string;
  orderNumber: string;
  restaurantId: string;
  restaurantName?: string;
  createdAt: string;
  updatedAt: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotalCents: number;
  totalCents: number;
  items: OrderItem[];
  itemCount?: number;
  payment: Payment | null;
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

type MenuItemsTab = "list" | "builder";
type MenuBuilderStepId =
  | "basic"
  | "item"
  | "groups"
  | "modifiers"
  | "large"
  | "pricing"
  | "review";
type SelectionMode = "SINGLE" | "MULTIPLE";
type ModifierType = "REMOVE" | "ADD" | "EXTRA";
type AvailabilityMode = "ALWAYS" | "SCHEDULED";

interface MenuBuilderGroupOption {
  id: string;
  linkedProductId: string;
  displayName: string;
  priceAdjustmentCents: number;
  isDefault: boolean;
  isAvailable: boolean;
  sortOrder: number;
}

interface MenuBuilderGroup {
  id: string;
  name: string;
  isRequired: boolean;
  selectionMode: SelectionMode;
  minSelections: number;
  maxSelections: number;
  sortOrder: number;
  isAvailable: boolean;
  options: MenuBuilderGroupOption[];
}

interface MenuBuilderModifierOption {
  id: string;
  name: string;
  priceAdjustmentCents: number;
  maxQuantity: number;
  isAvailable: boolean;
  sortOrder: number;
}

interface MenuBuilderModifierGroup {
  id: string;
  name: string;
  type: ModifierType;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  allowQuantity: boolean;
  options: MenuBuilderModifierOption[];
}

interface MenuBuilderDraft {
  productType: ProductType;
  restaurantId: string;
  menuName: string;
  category: string;
  name: string;
  sku: string;
  description: string;
  imageUrl: string;
  basePriceCents: number;
  currencyCode: string;
  visible: boolean;
  availabilityMode: AvailabilityMode;
  availableFrom: string;
  availableTo: string;
  includedIngredients: string;
  removableIngredients: string;
  addonsNotes: string;
  allergenLabels: string;
  nutritionNotes: string;
  groups: MenuBuilderGroup[];
  modifiers: MenuBuilderModifierGroup[];
  regularMealId: string;
  largeBasePriceCents: number;
  largeSurchargeNotes: string;
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

const adminPreviewRestaurants: AdminRestaurantSummary[] = restaurants.map(
  (restaurant) => ({
    id: restaurant.id,
    name: restaurant.name,
    slug: restaurant.id,
    isActive: true,
  }),
);

const adminPreviewMenuProducts: MenuProduct[] = [
  {
    id: "mp_classic_burger_meal",
    productId: "prod_classic_burger_meal",
    restaurantId: "central",
    restaurantName: "Central Burger House",
    name: "Classic Burger Meal",
    category: "Meals",
    type: "MEAL",
    priceCents: 4550,
    currencyCode: "PLN",
    visible: true,
    imageUrl:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=96&h=96&fit=crop&auto=format",
  },
  {
    id: "mp_classic_burger",
    productId: "prod_classic_burger",
    restaurantId: "central",
    restaurantName: "Central Burger House",
    name: "Classic Burger",
    category: "Burgers",
    type: "ITEM",
    priceCents: 2990,
    currencyCode: "PLN",
    visible: true,
    imageUrl:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=96&h=96&fit=crop&auto=format",
    affectedMeals: 1,
  },
  {
    id: "mp_small_fries",
    productId: "prod_small_fries",
    restaurantId: "central",
    restaurantName: "Central Burger House",
    name: "Small Fries",
    category: "Sides",
    type: "ITEM",
    priceCents: 900,
    currencyCode: "PLN",
    visible: true,
    imageUrl:
      "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=96&h=96&fit=crop&auto=format",
  },
  {
    id: "mp_cola",
    productId: "prod_cola",
    restaurantId: "central",
    restaurantName: "Central Burger House",
    name: "Cola",
    category: "Drinks",
    type: "ITEM",
    priceCents: 800,
    currencyCode: "PLN",
    visible: true,
    imageUrl:
      "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=96&h=96&fit=crop&auto=format",
  },
  {
    id: "mp_large_burger_meal",
    productId: "prod_large_burger_meal",
    restaurantId: "riverside",
    restaurantName: "Riverside Kiosk",
    name: "Large Burger Meal",
    category: "Meals",
    type: "LARGE_MEAL",
    priceCents: 6890,
    currencyCode: "PLN",
    visible: true,
    imageUrl:
      "https://images.unsplash.com/photo-1550547660-d9450f859349?w=96&h=96&fit=crop&auto=format",
  },
];

const adminPreviewUsers: AdminUser[] = [
  {
    id: "temporary-super-admin",
    email: "temporary.admin@example.com",
    name: "Temporary Admin",
    role: "SUPER_ADMIN",
    restaurants: ["All restaurants"],
    twoFactorEnabled: true,
    status: "active",
    lastLoginAt: "Temporary session",
  },
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
      provider: "STRIPE",
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
      provider: "STRIPE",
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
      provider: "STRIPE",
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

const menuBuilderDraftStorageKey = "admin-menu-builder-draft";

const menuBuilderSteps: Array<{
  id: MenuBuilderStepId;
  label: string;
  appliesTo: ProductType[];
}> = [
  { id: "basic", label: "Basic Info", appliesTo: ["ITEM", "MEAL", "LARGE_MEAL"] },
  { id: "item", label: "Item Details", appliesTo: ["ITEM"] },
  { id: "groups", label: "Meal Groups", appliesTo: ["MEAL", "LARGE_MEAL"] },
  {
    id: "modifiers",
    label: "Modifiers",
    appliesTo: ["ITEM", "MEAL", "LARGE_MEAL"],
  },
  { id: "large", label: "Large Meal", appliesTo: ["LARGE_MEAL"] },
  {
    id: "pricing",
    label: "Pricing Review",
    appliesTo: ["ITEM", "MEAL", "LARGE_MEAL"],
  },
  {
    id: "review",
    label: "Review",
    appliesTo: ["ITEM", "MEAL", "LARGE_MEAL"],
  },
];

const adminInputClass =
  "min-h-9 w-full rounded-md border border-(--admin-border) bg-[#182030] px-3 text-xs text-[#dde2ee] outline-none placeholder:text-[#6b7694] focus:border-[#4f7ef7]";
const adminTextareaClass =
  "min-h-20 w-full rounded-md border border-(--admin-border) bg-[#182030] px-3 py-2 text-xs leading-5 text-[#dde2ee] outline-none placeholder:text-[#6b7694] focus:border-[#4f7ef7]";

function formatPrice(cents: number): string {
  return `${(cents / 100).toFixed(2)} PLN`;
}

function formatCurrencyPrice(cents: number, currencyCode: string): string {
  return `${(cents / 100).toFixed(2)} ${currencyCode || "PLN"}`;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function toDateFilterIso(value: string, boundary: "start" | "end"): string {
  if (!value) return "";

  const date = new Date(`${value}T00:00:00`);
  if (boundary === "end") {
    date.setHours(23, 59, 59, 999);
  }

  return date.toISOString();
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

function mapAdminOrderSummary(order: AdminOrderSummary): Order {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    restaurantId: order.restaurantId,
    restaurantName: order.restaurantName,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    subtotalCents: toCents(order.subtotalAmount),
    totalCents: toCents(order.totalAmount),
    items: [],
    itemCount: order.itemCount,
    payment: order.payment
      ? {
          id: order.payment.id,
          provider: order.payment.provider,
          sessionId: order.payment.providerSessionId,
          intentId: order.payment.providerPaymentIntentId,
          amountCents: toCents(order.payment.amount),
          currency: order.payment.currency,
        }
      : null,
  };
}

function mapAdminOrderDetail(order: AdminOrderDetail): Order {
  return {
    ...mapAdminOrderSummary(order),
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      menuProductId: item.menuProductId ?? "",
      name: item.productName,
      type: item.productType,
      unitPriceCents: toCents(item.unitPrice),
      quantity: item.quantity,
      lineTotalCents: toCents(item.lineTotal),
      configuration: formatConfigurationSnapshot(item.configurationSnapshot),
    })),
  };
}

function formatConfigurationSnapshot(snapshot: unknown): string {
  const summary = summarizeBasketConfiguration(snapshot);
  const parts = [
    ...summary.groups.map(
      (group) => `${group.groupName}: ${group.optionName}`,
    ),
    ...summary.modifiers.map((modifier) =>
      modifier.actionType === "REMOVE"
        ? `Removed ${modifier.name}`
        : `${modifier.name} x${modifier.quantity}`,
    ),
  ];

  if (parts.length > 0) {
    return parts.join("; ");
  }

  if (!snapshot) {
    return "No configuration";
  }

  return JSON.stringify(snapshot);
}

function applyPreviewMealVisibilityRules(products: MenuProduct[]): MenuProduct[] {
  const classicBurger = products.find(
    (product) => product.productId === "prod_classic_burger",
  );
  const shouldHideClassicMeal = !classicBurger?.visible;

  return products.map((product) => {
    if (product.productId !== "prod_classic_burger_meal") {
      return { ...product };
    }

    if (shouldHideClassicMeal) {
      return {
        ...product,
        visible: false,
        forcedHiddenReason:
          "This meal has no visible option in at least one required group.",
      };
    }

    return {
      ...product,
      forcedHiddenReason: null,
    };
  });
}

function toCents(value: string): number {
  return Math.round(Number(value) * 100);
}

function centsToInputValue(cents: number): string {
  return (cents / 100).toFixed(2);
}

function inputValueToCents(value: string): number {
  const amount = Number(value.replace(",", "."));

  if (!Number.isFinite(amount)) {
    return 0;
  }

  return Math.max(0, Math.round(amount * 100));
}

function menuBuilderId(prefix: string): string {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return `${prefix}_${randomPart}`;
}

function createMenuBuilderDraft(defaultRestaurantId = ""): MenuBuilderDraft {
  return {
    productType: "ITEM",
    restaurantId: defaultRestaurantId,
    menuName: "Default menu",
    category: "",
    name: "",
    sku: "",
    description: "",
    imageUrl: "",
    basePriceCents: 0,
    currencyCode: "PLN",
    visible: true,
    availabilityMode: "ALWAYS",
    availableFrom: "",
    availableTo: "",
    includedIngredients: "",
    removableIngredients: "",
    addonsNotes: "",
    allergenLabels: "",
    nutritionNotes: "",
    groups: [],
    modifiers: [],
    regularMealId: "",
    largeBasePriceCents: 0,
    largeSurchargeNotes: "",
  };
}

function readMenuBuilderDraft(defaultRestaurantId = ""): MenuBuilderDraft {
  if (typeof window === "undefined") {
    return createMenuBuilderDraft(defaultRestaurantId);
  }

  try {
    const rawDraft = window.localStorage.getItem(menuBuilderDraftStorageKey);

    if (!rawDraft) {
      return createMenuBuilderDraft(defaultRestaurantId);
    }

    const parsed = JSON.parse(rawDraft) as Partial<MenuBuilderDraft>;
    const productType: ProductType =
      parsed.productType === "MEAL" || parsed.productType === "LARGE_MEAL"
        ? parsed.productType
        : "ITEM";

    return {
      ...createMenuBuilderDraft(defaultRestaurantId),
      ...parsed,
      productType,
      restaurantId: parsed.restaurantId ?? defaultRestaurantId,
      groups: Array.isArray(parsed.groups) ? parsed.groups : [],
      modifiers: Array.isArray(parsed.modifiers) ? parsed.modifiers : [],
    };
  } catch {
    return createMenuBuilderDraft(defaultRestaurantId);
  }
}

function writeMenuBuilderDraft(draft: MenuBuilderDraft): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(menuBuilderDraftStorageKey, JSON.stringify(draft));
}

function validateMenuBuilderDraft(draft: MenuBuilderDraft): string[] {
  const errors: string[] = [];

  if (!draft.restaurantId) errors.push("Restaurant is required.");
  if (!draft.menuName.trim()) errors.push("Menu is required.");
  if (!draft.category.trim()) errors.push("Category is required.");
  if (!draft.name.trim()) errors.push("Product name is required.");
  if (!draft.sku.trim()) errors.push("SKU/code is required.");
  if (draft.basePriceCents <= 0) errors.push("Base price must be greater than 0.");
  if (!draft.currencyCode.trim()) errors.push("Currency is required.");
  if (
    draft.availabilityMode === "SCHEDULED" &&
    (!draft.availableFrom || !draft.availableTo)
  ) {
    errors.push("Scheduled availability requires start and end dates.");
  }

  if (draft.productType !== "ITEM") {
    if (draft.groups.length === 0) {
      errors.push("Meal products need at least one required group.");
    }

    draft.groups.forEach((group) => {
      if (!group.name.trim()) {
        errors.push("Every meal group needs a name.");
      }
      if (group.minSelections > group.maxSelections) {
        errors.push(`${group.name || "Meal group"} has min selections above max.`);
      }
      if (
        group.selectionMode === "SINGLE" &&
        group.options.filter((option) => option.isDefault).length > 1
      ) {
        errors.push(`${group.name || "Meal group"} can have only one default option.`);
      }
      if (
        group.isRequired &&
        group.isAvailable &&
        group.options.filter((option) => option.isAvailable).length === 0
      ) {
        errors.push(`${group.name || "Required group"} has no available options.`);
      }
    });
  }

  if (draft.productType === "LARGE_MEAL" && !draft.regularMealId) {
    errors.push("Large meal needs a linked regular meal.");
  }

  draft.modifiers.forEach((modifier) => {
    if (!modifier.name.trim()) {
      errors.push("Every modifier group needs a name.");
    }
    if (modifier.minSelections > modifier.maxSelections) {
      errors.push(`${modifier.name || "Modifier group"} has min selections above max.`);
    }
  });

  return errors;
}

function menuBuilderWarnings(draft: MenuBuilderDraft): string[] {
  const warnings: string[] = [];

  draft.groups.forEach((group) => {
    const availableOptions = group.options.filter((option) => option.isAvailable);

    if (!group.isAvailable && group.isRequired) {
      warnings.push(`${group.name || "Required group"} is unavailable.`);
    }
    if (group.isRequired && availableOptions.length < group.minSelections) {
      warnings.push(`${group.name || "Required group"} may make the meal unorderable.`);
    }
  });

  return warnings;
}

function calculateMenuBuilderPricing(draft: MenuBuilderDraft): {
  baseCents: number;
  defaultCents: number;
  minCents: number;
  maxCents: number;
  groupSurchargeCents: number;
  addonSurchargeCents: number;
} {
  const baseCents =
    draft.productType === "LARGE_MEAL" && draft.largeBasePriceCents > 0
      ? draft.largeBasePriceCents
      : draft.basePriceCents;
  const defaultGroupSurcharges = draft.groups.reduce(
    (sum, group) =>
      sum +
      group.options
        .filter((option) => option.isDefault && option.isAvailable)
        .reduce((optionSum, option) => optionSum + option.priceAdjustmentCents, 0),
    0,
  );
  const minGroupSurcharges = draft.groups.reduce((sum, group) => {
    const prices = group.options
      .filter((option) => option.isAvailable)
      .map((option) => option.priceAdjustmentCents)
      .sort((left, right) => left - right);

    return (
      sum +
      prices
        .slice(0, Math.max(0, group.minSelections))
        .reduce((optionSum, price) => optionSum + price, 0)
    );
  }, 0);
  const maxGroupSurcharges = draft.groups.reduce((sum, group) => {
    const prices = group.options
      .filter((option) => option.isAvailable)
      .map((option) => option.priceAdjustmentCents)
      .sort((left, right) => right - left);

    return (
      sum +
      prices
        .slice(0, Math.max(0, group.maxSelections))
        .reduce((optionSum, price) => optionSum + price, 0)
    );
  }, 0);
  const addonSurchargeCents = draft.modifiers.reduce(
    (sum, modifier) =>
      sum +
      modifier.options
        .filter((option) => option.isAvailable && option.priceAdjustmentCents > 0)
        .slice(0, Math.max(0, modifier.maxSelections))
        .reduce((optionSum, option) => optionSum + option.priceAdjustmentCents, 0),
    0,
  );

  return {
    baseCents,
    defaultCents: baseCents + defaultGroupSurcharges,
    minCents: baseCents + minGroupSurcharges,
    maxCents: baseCents + maxGroupSurcharges + addonSurchargeCents,
    groupSurchargeCents: defaultGroupSurcharges,
    addonSurchargeCents,
  };
}

function menuBuilderProductFromDraft(
  draft: MenuBuilderDraft,
  adminRestaurants: AdminRestaurantSummary[],
): MenuProduct {
  const productId = `prod_${draft.sku.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
  const menuProductId = `mp_${draft.sku.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
  const restaurant = adminRestaurants.find((item) => item.id === draft.restaurantId);

  return {
    id: menuProductId,
    productId,
    restaurantId: draft.restaurantId,
    restaurantName: restaurant?.name ?? "Selected restaurant",
    name: draft.name.trim(),
    category: draft.category.trim(),
    type: draft.productType,
    priceCents: calculateMenuBuilderPricing(draft).defaultCents,
    currencyCode: draft.currencyCode.trim().toUpperCase(),
    visible: draft.visible,
    imageUrl:
      draft.imageUrl.trim() ||
      "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg",
  };
}

function draftFromMenuProduct(product: MenuProduct): MenuBuilderDraft {
  return {
    ...createMenuBuilderDraft(product.restaurantId),
    productType: product.type,
    restaurantId: product.restaurantId,
    category: product.category,
    name: `${product.name} copy`,
    sku: `${product.productId.replace(/^prod_/, "")}_copy`,
    imageUrl: product.imageUrl,
    basePriceCents: product.priceCents,
    currencyCode: product.currencyCode,
    visible: product.visible,
    largeBasePriceCents:
      product.type === "LARGE_MEAL" ? product.priceCents : 0,
  };
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
  const [isTemporaryBypass, setIsTemporaryBypass] = useState(false);

  function handleSignedIn(response: AuthenticatedAdminResponse) {
    setSessionToken(response.sessionToken);
    setAdminUser(response.user);
    setIsTemporaryBypass(false);
    setView("shell");
  }

  function handleTemporaryAdminBypass() {
    setSessionToken("temporary-admin-bypass");
    setAdminUser({
      id: "temporary-super-admin",
      email: "temporary.admin@example.com",
      role: "SUPER_ADMIN",
      restaurantIds: restaurants.map((restaurant) => restaurant.id),
    });
    setIsTemporaryBypass(true);
    setView("shell");
  }

  async function handleLogout() {
    if (sessionToken && !isTemporaryBypass) {
      await logoutAdmin(sessionToken).catch(() => undefined);
    }
    setSessionToken("");
    setAdminUser(null);
    setIsTemporaryBypass(false);
    setView("login");
  }

  if (view === "shell" && adminUser) {
    return (
      <AdminFrame>
        <AdminShell
          sessionToken={sessionToken}
          user={adminUser}
          isTemporaryBypass={isTemporaryBypass}
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
        onTemporaryAdminBypass={
          canUseTemporaryAdminBypass ? handleTemporaryAdminBypass : undefined
        }
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
  onTemporaryAdminBypass?: () => void;
}

function AdminLogin({
  onBackToKiosk,
  onSignedIn,
  onTemporaryAdminBypass,
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
  const [inviteStep, setInviteStep] = useState<SetupStep>("account");
  const [invitePassword, setInvitePassword] = useState("");
  const [invitePasswordRepeat, setInvitePasswordRepeat] = useState("");
  const [inviteSecret, setInviteSecret] = useState("");
  const [inviteSetupToken, setInviteSetupToken] = useState("");
  const [inviteProvisioningUri, setInviteProvisioningUri] = useState("");
  const [inviteQrCodeUrl, setInviteQrCodeUrl] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [pendingAuthResponse, setPendingAuthResponse] =
    useState<AuthenticatedAdminResponse | null>(null);
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
    if (!inviteProvisioningUri) {
      return undefined;
    }

    let isCurrent = true;

    void Promise.resolve()
      .then(() =>
        QRCode.toDataURL(inviteProvisioningUri, {
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
          setInviteQrCodeUrl(qrCodeUrl);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setInviteQrCodeUrl("");
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [inviteProvisioningUri]);

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
      completeAuthenticatedSetup(response);
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

  async function handleInviteSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAdminAction(async () => {
      if (invitePassword !== invitePasswordRepeat) {
        throw new Error("Passwords must match.");
      }
      const response = await setupAdminInvite({
        inviteToken,
        password: invitePassword,
      });
      setInviteSecret(response.twoFactorSetup.manualEntryKey);
      setInviteSetupToken(response.setupToken);
      setInviteProvisioningUri(response.twoFactorSetup.provisioningUri);
      setInviteQrCodeUrl("");
      setInviteCode("");
      setInviteStep("two-factor");
      setStatusMessage(
        "Password saved. Scan the QR code and verify 2FA to activate the account.",
      );
    });
  }

  async function handleInviteTwoFactor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAdminAction(async () => {
      const response = await verifyAdminInviteTwoFactor({
        setupToken: inviteSetupToken,
        code: inviteCode,
      });
      completeAuthenticatedSetup(response);
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

  function completeAuthenticatedSetup(response: AuthenticatedAdminResponse) {
    if (response.recoveryCodes?.length) {
      setPendingAuthResponse(response);
      setRecoveryCodes(response.recoveryCodes);
      setMode("recovery");
      setStatusMessage("Save these recovery codes before opening the admin panel.");
      return;
    }

    onSignedIn(response);
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
          {onTemporaryAdminBypass ? (
            <button
              type="button"
              onClick={onTemporaryAdminBypass}
              className={`mb-5 flex min-h-11 w-full items-center justify-center rounded-md border border-amber-400/30 bg-amber-400/10 px-4 text-sm font-semibold text-amber-200 transition hover:bg-amber-400/15 hover:text-amber-100 ${focusRing}`}
            >
              Temporary: open admin panel without login
            </button>
          ) : null}

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
                text="Enter the six-digit code from your authenticator app or a recovery code."
              />
              <AdminField label="2FA code" icon={<Shield className="size-4" />}>
                <input
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.toUpperCase().slice(0, 14))
                  }
                  inputMode="text"
                  autoComplete="one-time-code"
                  required
                  placeholder="123456 or A1B2-C3D4-E5F6"
                  className="w-full bg-transparent text-sm font-semibold tracking-widest outline-none placeholder:text-[#6b7694]"
                  aria-label="Two-factor authentication code or recovery code"
                />
              </AdminField>
              <button
                type="submit"
                disabled={busy || code.length < 6}
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

          {mode === "recovery" && pendingAuthResponse ? (
            <div className="space-y-5">
              <PanelHeading
                title="Save recovery codes"
                text="Each code can be used once if the authenticator app is unavailable."
              />
              <div className="grid gap-2 rounded-md border border-(--admin-border) bg-[#0c0f1a] p-4 sm:grid-cols-2">
                {recoveryCodes.map((recoveryCode) => (
                  <code
                    key={recoveryCode}
                    className="rounded border border-(--admin-border) bg-[#182030] px-3 py-2 text-xs font-semibold text-[#dde2ee]"
                  >
                    {recoveryCode}
                  </code>
                ))}
              </div>
              <p className="text-xs leading-5 text-[#9aaabb]">
                These codes are shown only once. Store them outside the kiosk
                device before continuing.
              </p>
              <button
                type="button"
                onClick={() => onSignedIn(pendingAuthResponse)}
                className={`min-h-11 w-full rounded-md bg-[#4f7ef7] px-4 text-sm font-semibold text-white transition hover:bg-[#416de0] ${focusRing}`}
              >
                I saved the codes, open admin panel
              </button>
            </div>
          ) : null}

          {mode === "invite" ? (
            <div className="space-y-5">
              {inviteStep === "account" ? (
                <>
                  <PanelHeading
                    title="Accept admin invite"
                    text="Choose your password first. The next step activates mandatory 2FA."
                  />
                  <form onSubmit={handleInviteSetup} className="space-y-4">
                    <AdminReadonly label="Invite token from URL" value={inviteToken} />
                    <AdminField
                      label="Password"
                      icon={<Shield className="size-4" />}
                    >
                      <input
                        value={invitePassword}
                        onChange={(event) => setInvitePassword(event.target.value)}
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
                        value={invitePasswordRepeat}
                        onChange={(event) =>
                          setInvitePasswordRepeat(event.target.value)
                        }
                        type="password"
                        required
                        minLength={12}
                        placeholder="Repeat password"
                        className="w-full bg-transparent text-sm outline-none placeholder:text-[#6b7694]"
                      />
                    </AdminField>
                    <button
                      type="submit"
                      disabled={busy}
                      className={`min-h-11 w-full rounded-md bg-[#4f7ef7] px-4 text-sm font-semibold text-white transition hover:bg-[#416de0] ${focusRing}`}
                    >
                      {busy ? "Saving..." : "Continue to 2FA setup"}
                    </button>
                    <SecondaryButton onClick={() => setMode("email")}>
                      Back to sign in
                    </SecondaryButton>
                  </form>
                </>
              ) : null}

              {inviteStep === "two-factor" ? (
                <form onSubmit={handleInviteTwoFactor} className="space-y-5">
                  <PanelHeading
                    title="Set up 2FA"
                    text="Scan the QR code in your authenticator app, then enter the six-digit code from that app."
                  />
                  <div className="grid gap-4 rounded-md border border-(--admin-border) bg-[#0c0f1a] p-4 sm:grid-cols-[160px_1fr]">
                    <div className="flex size-40 items-center justify-center rounded-md bg-white p-2">
                      {inviteQrCodeUrl ? (
                        <img
                          src={inviteQrCodeUrl}
                          alt="QR code for invite two-factor setup"
                          className="size-full"
                        />
                      ) : (
                        <Loader2
                          aria-hidden="true"
                          className="size-6 animate-spin text-[#4f7ef7]"
                        />
                      )}
                    </div>
                    <p className="text-xs leading-5 text-[#9aaabb]">
                      If scanning is unavailable, add the account manually with
                      the setup key below.
                    </p>
                  </div>
                  <AdminReadonly label="Manual setup key" value={inviteSecret} />
                  <AdminField
                    label="Enter the 6-digit 2FA code from your authenticator app"
                    icon={<Shield className="size-4" />}
                  >
                    <input
                      value={inviteCode}
                      onChange={(event) =>
                        setInviteCode(
                          event.target.value.replace(/\D/g, "").slice(0, 6),
                        )
                      }
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="\d{6}"
                      required
                      placeholder="123456"
                      className="w-full bg-transparent text-sm font-semibold tracking-widest outline-none placeholder:text-[#6b7694]"
                      aria-label="Six-digit invite two-factor authentication code"
                    />
                  </AdminField>
                  <button
                    type="submit"
                    disabled={busy || inviteCode.length !== 6 || !inviteSetupToken}
                    className={`min-h-11 w-full rounded-md bg-[#4f7ef7] px-4 text-sm font-semibold text-white transition hover:bg-[#416de0] ${focusRing}`}
                  >
                    {busy ? "Verifying..." : "Verify 2FA and activate account"}
                  </button>
                </form>
              ) : null}
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
  isTemporaryBypass: boolean;
  onBackToKiosk: () => void;
  onLogout: () => void;
}

function AdminShell({
  sessionToken,
  user,
  isTemporaryBypass,
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
    if (isTemporaryBypass) {
      void Promise.resolve().then(() => {
        setShellRestaurants(adminPreviewRestaurants);
      });
      return;
    }

    void Promise.resolve().then(async () => {
      try {
        const response = await listAdminRestaurants(sessionToken);
        setShellRestaurants(response.restaurants);
      } catch {
        setShellRestaurants([]);
      }
    });
  }, [isTemporaryBypass, sessionToken]);

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
              {isTemporaryBypass ? "TEMP_ADMIN" : role}
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
              sessionToken={sessionToken}
              restaurantId={restaurantId}
              globalSearch={globalSearch}
              isTemporaryBypass={isTemporaryBypass}
            />
          ) : null}
          {view === "menu" ? (
            <MenuItemsView
              sessionToken={sessionToken}
              restaurants={shellRestaurants}
              restaurantId={restaurantId}
              globalSearch={globalSearch}
              isTemporaryBypass={isTemporaryBypass}
            />
          ) : null}
          {view === "admins" ? (
            <AdminUsersView
              sessionToken={sessionToken}
              isTemporaryBypass={isTemporaryBypass}
            />
          ) : null}
          {view === "restaurants" ? <RestaurantsView /> : null}
          {view === "settings" ? (
            <SettingsView
              sessionToken={sessionToken}
              isTemporaryBypass={isTemporaryBypass}
            />
          ) : null}
        </section>
      </div>
    </div>
  );
}

function OrdersView({
  sessionToken,
  restaurantId,
  globalSearch,
  isTemporaryBypass,
}: {
  sessionToken: string;
  restaurantId: string;
  globalSearch: string;
  isTemporaryBypass: boolean;
}) {
  const [orderStatus, setOrderStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [orderRows, setOrderRows] = useState<Order[]>([]);
  const [tableState, setTableState] = useState<TableState>("loading");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState("");

  const loadOrders = useCallback(async () => {
    setTableState("loading");
    setErrorMessage("");
    if (isTemporaryBypass) {
      setOrderRows(orders);
      setTableState(orders.length > 0 ? "ready" : "empty");
      return;
    }

    try {
      const response = await listAdminOrders(sessionToken, {
        restaurantId,
        orderStatus,
        paymentStatus,
        dateFrom: toDateFilterIso(dateFrom, "start"),
        dateTo: toDateFilterIso(dateTo, "end"),
        search: globalSearch,
      });
      const nextOrders = response.orders.map(mapAdminOrderSummary);
      setOrderRows(nextOrders);
      setTableState(nextOrders.length > 0 ? "ready" : "empty");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not load admin orders.",
      );
      setTableState("error");
    }
  }, [
    dateFrom,
    dateTo,
    globalSearch,
    isTemporaryBypass,
    orderStatus,
    paymentStatus,
    restaurantId,
    sessionToken,
  ]);

  useEffect(() => {
    void Promise.resolve().then(loadOrders);
  }, [loadOrders]);

  const filtered = useMemo(
    () =>
      orderRows.filter((order) => {
        const q = globalSearch.toLowerCase();
        if (restaurantId && order.restaurantId !== restaurantId) return false;
        if (orderStatus && order.orderStatus !== orderStatus) return false;
        if (paymentStatus && order.paymentStatus !== paymentStatus) return false;
        if (dateFrom && order.createdAt < toDateFilterIso(dateFrom, "start")) {
          return false;
        }
        if (dateTo && order.createdAt > toDateFilterIso(dateTo, "end")) {
          return false;
        }
        if (
          isTemporaryBypass &&
          q &&
          !order.orderNumber.toLowerCase().includes(q) &&
          !order.items.some((item) => item.name.toLowerCase().includes(q))
        ) {
          return false;
        }
        return true;
      }),
    [
      dateFrom,
      dateTo,
      globalSearch,
      isTemporaryBypass,
      orderRows,
      orderStatus,
      paymentStatus,
      restaurantId,
    ],
  );

  async function openOrderDetail(order: Order) {
    setErrorMessage("");
    if (isTemporaryBypass) {
      setSelectedOrder(order);
      return;
    }

    try {
      const response = await getAdminOrder(sessionToken, order.id);
      setSelectedOrder(mapAdminOrderDetail(response.order));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not load order detail.",
      );
    }
  }

  async function handleOrderStatusChange(orderId: string, status: OrderStatus) {
    setUpdatingOrderId(orderId);
    setErrorMessage("");
    setStatusMessage("");
    if (isTemporaryBypass) {
      setOrderRows((current) =>
        current.map((order) =>
          order.id === orderId ? { ...order, orderStatus: status } : order,
        ),
      );
      setSelectedOrder((current) =>
        current?.id === orderId ? { ...current, orderStatus: status } : current,
      );
      setStatusMessage("Temporary preview order status updated locally.");
      setUpdatingOrderId("");
      return;
    }

    try {
      const response = await updateAdminOrderStatus(sessionToken, orderId, status);
      const updatedOrder = mapAdminOrderDetail(response.order);
      setOrderRows((current) =>
        current.map((order) =>
          order.id === orderId
            ? {
                ...mapAdminOrderSummary(response.order),
                items: order.items,
              }
            : order,
        ),
      );
      setSelectedOrder(updatedOrder);
      setStatusMessage("Order status updated.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not update order status.",
      );
    } finally {
      setUpdatingOrderId("");
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <ViewHeader
        title="Orders"
        description={`${filtered.length} of ${orderRows.length} orders`}
        action={
          <DemoStateControls value={tableState} onChange={setTableState} />
        }
      />
      {errorMessage ? <AdminAlert tone="error">{errorMessage}</AdminAlert> : null}
      {statusMessage ? (
        <AdminAlert tone="success">{statusMessage}</AdminAlert>
      ) : null}

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
          value={dateFrom}
          onChange={(event) => setDateFrom(event.target.value)}
          type="date"
          className="h-8 w-28 rounded border border-(--admin-border) bg-[#182030] px-2 text-xs outline-none placeholder:text-[#6b7694]"
          placeholder="From"
          aria-label="Filter orders from date"
        />
        <input
          value={dateTo}
          onChange={(event) => setDateTo(event.target.value)}
          type="date"
          className="h-8 w-28 rounded border border-(--admin-border) bg-[#182030] px-2 text-xs outline-none placeholder:text-[#6b7694]"
          placeholder="To"
          aria-label="Filter orders to date"
        />
        {(orderStatus || paymentStatus || dateFrom || dateTo) && (
          <button
            type="button"
            onClick={() => {
              setOrderStatus("");
              setPaymentStatus("");
              setDateFrom("");
              setDateTo("");
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
              onClick={() => void openOrderDetail(order)}
              className="cursor-pointer border-b border-(--admin-border) transition hover:bg-[#1e2840]"
            >
              <Cell mono>{order.orderNumber}</Cell>
              <Cell>{order.restaurantName ?? restaurantName(order.restaurantId)}</Cell>
              <Cell muted>{formatDateTime(order.createdAt)}</Cell>
              <Cell>{order.itemCount ?? order.items.length}</Cell>
              <Cell>
                <OrderStatusBadge status={order.orderStatus} />
              </Cell>
              <Cell>
                <PaymentStatusBadge status={order.paymentStatus} />
              </Cell>
              <Cell strong mono>
                {formatPrice(order.totalCents)}
              </Cell>
              <Cell muted>{order.payment?.provider ?? "No payment"}</Cell>
              <Cell>
                <ChevronRight className="size-4 text-[#6b7694]" />
              </Cell>
            </tr>
          ))}
        </DataTable>
      </StatePanel>

      {selectedOrder ? (
        <OrderDetailModal
          key={`${selectedOrder.id}:${selectedOrder.orderStatus}`}
          order={selectedOrder}
          updating={updatingOrderId === selectedOrder.id}
          onStatusChange={handleOrderStatusChange}
          onClose={() => setSelectedOrder(null)}
        />
      ) : null}
    </div>
  );
}

function OrderDetailModal({
  order,
  updating,
  onStatusChange,
  onClose,
}: {
  order: Order;
  updating: boolean;
  onStatusChange: (orderId: string, status: OrderStatus) => Promise<void>;
  onClose: () => void;
}) {
  const [nextStatus, setNextStatus] = useState<OrderStatus>(order.orderStatus);

  return (
    <Modal title={`Order ${order.orderNumber}`} onClose={onClose}>
      <div className="grid gap-5 p-5">
        <DetailSection title="Order">
          <Detail label="Order ID" value={order.id} mono />
          <Detail label="Order Number" value={order.orderNumber} mono />
          <Detail
            label="Restaurant"
            value={order.restaurantName ?? restaurantName(order.restaurantId)}
          />
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
          <Detail
            label="Update Status"
            value={
              <div className="flex flex-wrap items-center gap-2">
                <AdminSelect
                  value={nextStatus}
                  onChange={(value) => setNextStatus(value as OrderStatus)}
                >
                  {Object.entries(orderStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </AdminSelect>
                <PrimaryButton
                  type="button"
                  disabled={updating || nextStatus === order.orderStatus}
                  onClick={() => void onStatusChange(order.id, nextStatus)}
                >
                  {updating ? "Saving..." : "Save status"}
                </PrimaryButton>
              </div>
            }
          />
        </DetailSection>

        <DetailSection title="Payment">
          {order.payment ? (
            <>
              <Detail label="Payment ID" value={order.payment.id} mono />
              <Detail label="Provider" value={order.payment.provider} />
              <Detail
                label="Provider Session ID"
                value={order.payment.sessionId}
                mono
              />
              <Detail
                label="Payment Intent ID"
                value={order.payment.intentId ?? "Not available"}
                mono
              />
              <Detail label="Amount" value={formatPrice(order.payment.amountCents)} />
              <Detail label="Currency" value={order.payment.currency} mono />
            </>
          ) : (
            <Detail label="Payment" value="No payment record yet" />
          )}
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
  isTemporaryBypass,
}: {
  sessionToken: string;
  restaurants: AdminRestaurantSummary[];
  restaurantId: string;
  globalSearch: string;
  isTemporaryBypass: boolean;
}) {
  const [products, setProducts] = useState<MenuProduct[]>([]);
  const [savedProducts, setSavedProducts] = useState<MenuProduct[]>([]);
  const [activeTab, setActiveTab] = useState<MenuItemsTab>("list");
  const [visibility, setVisibility] = useState("");
  const [type, setType] = useState("");
  const [builderDraft, setBuilderDraft] = useState<MenuBuilderDraft>(() =>
    readMenuBuilderDraft(restaurants[0]?.id ?? ""),
  );
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
    if (isTemporaryBypass) {
      const nextProducts = adminPreviewMenuProducts.map((product) => ({
        ...product,
      }));
      setProducts(nextProducts);
      setSavedProducts(nextProducts);
      setTableState("ready");
      return;
    }

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
  }, [isTemporaryBypass, sessionToken]);

  useEffect(() => {
    void Promise.resolve().then(loadProducts);
  }, [loadProducts]);

  useEffect(() => {
    writeMenuBuilderDraft(builderDraft);
  }, [builderDraft]);

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
    if (isTemporaryBypass) {
      const nextProducts = applyPreviewMealVisibilityRules(products);
      setProducts(nextProducts);
      setSavedProducts(nextProducts.map((product) => ({ ...product })));
      setStatusMessage("Temporary preview changes saved locally.");
      setSaving(false);
      return;
    }

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

  function saveBuilderDraft() {
    writeMenuBuilderDraft(builderDraft);
    setStatusMessage("Draft saved.");
    setErrorMessage("");
  }

  function publishBuilderDraft() {
    const validationErrors = validateMenuBuilderDraft(builderDraft);

    setStatusMessage("");
    if (validationErrors.length > 0) {
      setErrorMessage(validationErrors.join(" "));
      return;
    }

    if (!isTemporaryBypass) {
      setErrorMessage("Menu publishing endpoint is not connected yet.");
      return;
    }

    const nextProduct = menuBuilderProductFromDraft(builderDraft, restaurants);
    setProducts((current) => [nextProduct, ...current]);
    setSavedProducts((current) => [nextProduct, ...current]);
    setBuilderDraft(createMenuBuilderDraft(restaurants[0]?.id ?? ""));
    setActiveTab("list");
    setErrorMessage("");
    setStatusMessage("Temporary preview product published locally.");
  }

  return (
    <div className="flex min-h-full flex-col">
      <ViewHeader
        title="Menu Items"
        description={
          activeTab === "list"
            ? `${filtered.length} products in current view`
            : "Create products, meals, groups, modifiers, and pricing drafts"
        }
        action={
          <div className="flex items-center gap-2 rounded-md border border-(--admin-border) bg-[#111828] p-1">
            <MenuTabButton
              active={activeTab === "list"}
              onClick={() => setActiveTab("list")}
            >
              Menu list
            </MenuTabButton>
            <MenuTabButton
              active={activeTab === "builder"}
              onClick={() => {
                setBuilderDraft((current) =>
                  current.restaurantId
                    ? current
                    : { ...current, restaurantId: restaurants[0]?.id ?? "" },
                );
                setActiveTab("builder");
              }}
            >
              Add product
            </MenuTabButton>
          </div>
        }
      />
      {errorMessage ? <AdminAlert tone="error">{errorMessage}</AdminAlert> : null}
      {statusMessage ? (
        <AdminAlert tone="success">{statusMessage}</AdminAlert>
      ) : null}

      {activeTab === "list" ? (
        <>
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
                "Actions",
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
                    {restaurants.find(
                      (restaurant) => restaurant.id === product.restaurantId,
                    )?.name ?? product.restaurantName}
                  </Cell>
                  <Cell mono>
                    {formatCurrencyPrice(product.priceCents, product.currencyCode)}
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
                  <Cell>
                    <div className="flex gap-2">
                      <SmallActionButton
                        icon={<Copy className="size-3.5" />}
                        label="Duplicate"
                        onClick={() => {
                          setBuilderDraft(draftFromMenuProduct(product));
                          setActiveTab("builder");
                        }}
                      />
                      <SmallActionButton
                        icon={<ChevronRight className="size-3.5" />}
                        label="Edit"
                        onClick={() => {
                          setBuilderDraft(draftFromMenuProduct(product));
                          setActiveTab("builder");
                        }}
                      />
                    </div>
                  </Cell>
                </tr>
              ))}
            </DataTable>
          </StatePanel>
        </>
      ) : (
        <AdminMenuBuilder
          draft={builderDraft}
          onDraftChange={setBuilderDraft}
          products={products}
          restaurants={restaurants}
          onSaveDraft={saveBuilderDraft}
          onPublish={publishBuilderDraft}
        />
      )}

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

function AdminMenuBuilder({
  draft,
  onDraftChange,
  products,
  restaurants,
  onSaveDraft,
  onPublish,
}: {
  draft: MenuBuilderDraft;
  onDraftChange: Dispatch<SetStateAction<MenuBuilderDraft>>;
  products: MenuProduct[];
  restaurants: AdminRestaurantSummary[];
  onSaveDraft: () => void;
  onPublish: () => void;
}) {
  const [stepId, setStepId] = useState<MenuBuilderStepId>("basic");
  const steps = menuBuilderSteps.filter((step) =>
    step.appliesTo.includes(draft.productType),
  );
  const selectedStep = steps.find((step) => step.id === stepId) ?? steps[0];
  const activeStep = selectedStep;
  const activeStepIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === activeStep?.id),
  );
  const validationErrors = validateMenuBuilderDraft(draft);
  const warnings = menuBuilderWarnings(draft);
  const pricing = calculateMenuBuilderPricing(draft);
  const selectableItems = products.filter((product) => product.type === "ITEM");
  const mealProducts = products.filter((product) => product.type === "MEAL");

  function updateDraft(patch: Partial<MenuBuilderDraft>) {
    onDraftChange((current) => ({ ...current, ...patch }));
  }

  function goToOffset(offset: number) {
    const nextStep = steps[activeStepIndex + offset];

    if (nextStep) {
      setStepId(nextStep.id);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid flex-1 grid-cols-1 gap-0 xl:grid-cols-[220px_1fr_320px]">
        <aside className="border-b border-(--admin-border) bg-[#0c0f1a] p-4 xl:border-b-0 xl:border-r">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {steps.map((step, index) => (
              <button
                key={step.id}
                type="button"
                onClick={() => setStepId(step.id)}
                className={`flex items-center justify-between rounded-md border px-3 py-2 text-left text-xs font-semibold transition ${
                  activeStep?.id === step.id
                    ? "border-[#4f7ef7] bg-[#182030] text-white"
                    : "border-(--admin-border) text-[#9aaabb] hover:text-white"
                } ${focusRing}`}
              >
                <span>{step.label}</span>
                <span className="font-mono text-[10px] text-[#6b7694]">
                  {index + 1}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <main className="min-w-0 space-y-4 p-5">
          {validationErrors.length > 0 ? (
            <div className="rounded-md border border-amber-500/25 bg-amber-500/10 p-3 text-xs leading-5 text-amber-200">
              <p className="font-semibold">Validation summary</p>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                {validationErrors.slice(0, 5).map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {activeStep?.id === "basic" ? (
            <BuilderBasicStep
              draft={draft}
              restaurants={restaurants}
              onChange={updateDraft}
            />
          ) : null}
          {activeStep?.id === "item" ? (
            <BuilderItemStep draft={draft} onChange={updateDraft} />
          ) : null}
          {activeStep?.id === "groups" ? (
            <BuilderGroupsStep
              draft={draft}
              products={selectableItems}
              onDraftChange={onDraftChange}
            />
          ) : null}
          {activeStep?.id === "modifiers" ? (
            <BuilderModifiersStep draft={draft} onDraftChange={onDraftChange} />
          ) : null}
          {activeStep?.id === "large" ? (
            <BuilderLargeMealStep
              draft={draft}
              mealProducts={mealProducts}
              onChange={updateDraft}
            />
          ) : null}
          {activeStep?.id === "pricing" ? (
            <BuilderPricingStep pricing={pricing} draft={draft} />
          ) : null}
          {activeStep?.id === "review" ? (
            <BuilderReviewStep
              draft={draft}
              pricing={pricing}
              warnings={warnings}
            />
          ) : null}
        </main>

        <aside className="border-t border-(--admin-border) bg-[#0c0f1a] p-4 xl:border-l xl:border-t-0">
          <BuilderPreview
            draft={draft}
            pricing={pricing}
            warnings={warnings}
            restaurantName={
              restaurants.find((restaurant) => restaurant.id === draft.restaurantId)
                ?.name ?? "Restaurant"
            }
          />
        </aside>
      </div>

      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-(--admin-border) bg-[#111828]/95 px-5 py-3 backdrop-blur">
        <div className="text-xs text-[#6b7694]">
          Step {activeStepIndex + 1} of {steps.length}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SecondaryButton
            onClick={() => goToOffset(-1)}
            disabled={activeStepIndex === 0}
          >
            Back
          </SecondaryButton>
          <SecondaryButton onClick={onSaveDraft}>Save draft</SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={() => goToOffset(1)}
            disabled={activeStepIndex === steps.length - 1}
          >
            Continue
          </PrimaryButton>
          <PrimaryButton
            type="button"
            onClick={onPublish}
            disabled={validationErrors.length > 0}
          >
            Publish
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

function BuilderBasicStep({
  draft,
  restaurants,
  onChange,
}: {
  draft: MenuBuilderDraft;
  restaurants: AdminRestaurantSummary[];
  onChange: (patch: Partial<MenuBuilderDraft>) => void;
}) {
  return (
    <BuilderSection title="Basic Info">
      <div className="grid gap-4 lg:grid-cols-2">
        <BuilderField label="Product type">
          <select
            value={draft.productType}
            onChange={(event) =>
              onChange({ productType: event.target.value as ProductType })
            }
            className={adminInputClass}
          >
            <option value="ITEM">Item</option>
            <option value="MEAL">Meal</option>
            <option value="LARGE_MEAL">Large meal</option>
          </select>
        </BuilderField>
        <BuilderField label="Restaurant" error={!draft.restaurantId ? "Required" : ""}>
          <select
            value={draft.restaurantId}
            onChange={(event) => onChange({ restaurantId: event.target.value })}
            className={adminInputClass}
          >
            <option value="">Select restaurant</option>
            {restaurants.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
          </select>
        </BuilderField>
        <BuilderField label="Menu" error={!draft.menuName.trim() ? "Required" : ""}>
          <input
            value={draft.menuName}
            onChange={(event) => onChange({ menuName: event.target.value })}
            className={adminInputClass}
            placeholder="Default menu"
          />
        </BuilderField>
        <BuilderField label="Category" error={!draft.category.trim() ? "Required" : ""}>
          <input
            value={draft.category}
            onChange={(event) => onChange({ category: event.target.value })}
            className={adminInputClass}
            placeholder="Burgers, Sides, Drinks"
          />
        </BuilderField>
        <BuilderField label="Product name" error={!draft.name.trim() ? "Required" : ""}>
          <input
            value={draft.name}
            onChange={(event) => onChange({ name: event.target.value })}
            className={adminInputClass}
            placeholder="Classic Burger"
          />
        </BuilderField>
        <BuilderField label="SKU/code" error={!draft.sku.trim() ? "Required" : ""}>
          <input
            value={draft.sku}
            onChange={(event) => onChange({ sku: event.target.value })}
            className={adminInputClass}
            placeholder="classic_burger"
          />
        </BuilderField>
        <BuilderField
          label="Base price"
          error={draft.basePriceCents <= 0 ? "Must be greater than 0" : ""}
        >
          <input
            value={centsToInputValue(draft.basePriceCents)}
            onChange={(event) =>
              onChange({ basePriceCents: inputValueToCents(event.target.value) })
            }
            inputMode="decimal"
            className={adminInputClass}
            placeholder="29.90"
          />
        </BuilderField>
        <BuilderField label="Currency" error={!draft.currencyCode ? "Required" : ""}>
          <input
            value={draft.currencyCode}
            onChange={(event) =>
              onChange({ currencyCode: event.target.value.toUpperCase().slice(0, 3) })
            }
            className={adminInputClass}
            placeholder="PLN"
          />
        </BuilderField>
      </div>

      <BuilderField label="Description">
        <textarea
          value={draft.description}
          onChange={(event) => onChange({ description: event.target.value })}
          className={adminTextareaClass}
          placeholder="Short customer-facing description"
        />
      </BuilderField>

      <BuilderField label="Image URL">
        <div className="flex items-center gap-2">
          <ImageIcon className="size-4 text-[#6b7694]" />
          <input
            value={draft.imageUrl}
            onChange={(event) => onChange({ imageUrl: event.target.value })}
            className={adminInputClass}
            placeholder="https://..."
          />
        </div>
      </BuilderField>

      <div className="grid gap-4 lg:grid-cols-2">
        <ToggleField
          label="Visibility"
          checked={draft.visible}
          checkedLabel="Visible"
          uncheckedLabel="Hidden"
          onChange={(visible) => onChange({ visible })}
        />
        <BuilderField label="Availability">
          <select
            value={draft.availabilityMode}
            onChange={(event) =>
              onChange({ availabilityMode: event.target.value as AvailabilityMode })
            }
            className={adminInputClass}
          >
            <option value="ALWAYS">Always available</option>
            <option value="SCHEDULED">Scheduled</option>
          </select>
        </BuilderField>
      </div>

      {draft.availabilityMode === "SCHEDULED" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <BuilderField label="Available from">
            <input
              value={draft.availableFrom}
              onChange={(event) => onChange({ availableFrom: event.target.value })}
              type="datetime-local"
              className={adminInputClass}
            />
          </BuilderField>
          <BuilderField label="Available to">
            <input
              value={draft.availableTo}
              onChange={(event) => onChange({ availableTo: event.target.value })}
              type="datetime-local"
              className={adminInputClass}
            />
          </BuilderField>
        </div>
      ) : null}
    </BuilderSection>
  );
}

function BuilderItemStep({
  draft,
  onChange,
}: {
  draft: MenuBuilderDraft;
  onChange: (patch: Partial<MenuBuilderDraft>) => void;
}) {
  return (
    <BuilderSection title="Simple Item Details">
      <div className="grid gap-4 lg:grid-cols-2">
        <BuilderField label="Included ingredients">
          <textarea
            value={draft.includedIngredients}
            onChange={(event) =>
              onChange({ includedIngredients: event.target.value })
            }
            className={adminTextareaClass}
            placeholder="Bun, beef patty, cheddar"
          />
        </BuilderField>
        <BuilderField label="Removable ingredients">
          <textarea
            value={draft.removableIngredients}
            onChange={(event) =>
              onChange({ removableIngredients: event.target.value })
            }
            className={adminTextareaClass}
            placeholder="Pickles, onion, tomato"
          />
        </BuilderField>
        <BuilderField label="Add-ons with prices">
          <textarea
            value={draft.addonsNotes}
            onChange={(event) => onChange({ addonsNotes: event.target.value })}
            className={adminTextareaClass}
            placeholder="Cheese +2.00, bacon +4.00"
          />
        </BuilderField>
        <BuilderField label="Allergens">
          <textarea
            value={draft.allergenLabels}
            onChange={(event) => onChange({ allergenLabels: event.target.value })}
            className={adminTextareaClass}
            placeholder="Gluten, milk, sesame"
          />
        </BuilderField>
      </div>
      <BuilderField label="Nutrition notes">
        <textarea
          value={draft.nutritionNotes}
          onChange={(event) => onChange({ nutritionNotes: event.target.value })}
          className={adminTextareaClass}
          placeholder="Optional"
        />
      </BuilderField>
    </BuilderSection>
  );
}

function BuilderGroupsStep({
  draft,
  products,
  onDraftChange,
}: {
  draft: MenuBuilderDraft;
  products: MenuProduct[];
  onDraftChange: Dispatch<SetStateAction<MenuBuilderDraft>>;
}) {
  function updateGroup(groupId: string, patch: Partial<MenuBuilderGroup>) {
    onDraftChange((current) => ({
      ...current,
      groups: current.groups.map((group) =>
        group.id === groupId ? { ...group, ...patch } : group,
      ),
    }));
  }

  function updateOption(
    groupId: string,
    optionId: string,
    patch: Partial<MenuBuilderGroupOption>,
  ) {
    onDraftChange((current) => ({
      ...current,
      groups: current.groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              options: group.options.map((option) =>
                option.id === optionId ? { ...option, ...patch } : option,
              ),
            }
          : group,
      ),
    }));
  }

  function addGroup() {
    onDraftChange((current) => ({
      ...current,
      groups: [
        ...current.groups,
        {
          id: menuBuilderId("group"),
          name: "",
          isRequired: true,
          selectionMode: "SINGLE",
          minSelections: 1,
          maxSelections: 1,
          sortOrder: current.groups.length + 1,
          isAvailable: true,
          options: [],
        },
      ],
    }));
  }

  function addOption(groupId: string) {
    onDraftChange((current) => ({
      ...current,
      groups: current.groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              options: [
                ...group.options,
                {
                  id: menuBuilderId("option"),
                  linkedProductId: "",
                  displayName: "",
                  priceAdjustmentCents: 0,
                  isDefault: group.options.length === 0,
                  isAvailable: true,
                  sortOrder: group.options.length + 1,
                },
              ],
            }
          : group,
      ),
    }));
  }

  function removeGroup(groupId: string) {
    onDraftChange((current) => ({
      ...current,
      groups: current.groups.filter((group) => group.id !== groupId),
    }));
  }

  function removeOption(groupId: string, optionId: string) {
    onDraftChange((current) => ({
      ...current,
      groups: current.groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              options: group.options.filter((option) => option.id !== optionId),
            }
          : group,
      ),
    }));
  }

  function moveGroup(groupId: string, direction: -1 | 1) {
    onDraftChange((current) => {
      const index = current.groups.findIndex((group) => group.id === groupId);
      const nextIndex = index + direction;

      if (index < 0 || nextIndex < 0 || nextIndex >= current.groups.length) {
        return current;
      }

      const groups = [...current.groups];
      const [group] = groups.splice(index, 1);
      groups.splice(nextIndex, 0, group);

      return {
        ...current,
        groups: groups.map((item, itemIndex) => ({
          ...item,
          sortOrder: itemIndex + 1,
        })),
      };
    });
  }

  return (
    <BuilderSection
      title="Meal Groups"
      action={
        <PrimaryButton type="button" onClick={addGroup}>
          <span className="inline-flex items-center gap-1">
            <Plus className="size-3.5" />
            Add group
          </span>
        </PrimaryButton>
      }
    >
      {draft.groups.length === 0 ? (
        <EmptyBuilderState label="Add first group" onClick={addGroup} />
      ) : null}
      <div className="space-y-3">
        {draft.groups.map((group) => (
          <div
            key={group.id}
            className="rounded-md border border-(--admin-border) bg-[#0c0f1a] p-4"
          >
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => moveGroup(group.id, -1)}
                className={`rounded border border-(--admin-border) px-2 py-1 text-xs text-[#9aaabb] hover:text-white ${focusRing}`}
              >
                Up
              </button>
              <button
                type="button"
                onClick={() => moveGroup(group.id, 1)}
                className={`rounded border border-(--admin-border) px-2 py-1 text-xs text-[#9aaabb] hover:text-white ${focusRing}`}
              >
                Down
              </button>
              <button
                type="button"
                onClick={() => removeGroup(group.id)}
                className={`ml-auto rounded border border-red-500/30 px-2 py-1 text-xs text-red-200 hover:bg-red-500/10 ${focusRing}`}
              >
                <Trash2 className="inline size-3.5" /> Remove
              </button>
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
              <BuilderField label="Group name" error={!group.name ? "Required" : ""}>
                <input
                  value={group.name}
                  onChange={(event) =>
                    updateGroup(group.id, { name: event.target.value })
                  }
                  className={adminInputClass}
                  placeholder="Burger, Side, Drink"
                />
              </BuilderField>
              <BuilderField label="Selection mode">
                <select
                  value={group.selectionMode}
                  onChange={(event) =>
                    updateGroup(group.id, {
                      selectionMode: event.target.value as SelectionMode,
                    })
                  }
                  className={adminInputClass}
                >
                  <option value="SINGLE">Single choice</option>
                  <option value="MULTIPLE">Multiple choice</option>
                </select>
              </BuilderField>
              <ToggleField
                label="Group availability"
                checked={group.isAvailable}
                checkedLabel="Available"
                uncheckedLabel="Unavailable"
                onChange={(isAvailable) => updateGroup(group.id, { isAvailable })}
              />
              <NumberBuilderField
                label="Min selections"
                value={group.minSelections}
                onChange={(minSelections) => updateGroup(group.id, { minSelections })}
              />
              <NumberBuilderField
                label="Max selections"
                value={group.maxSelections}
                onChange={(maxSelections) => updateGroup(group.id, { maxSelections })}
              />
              <ToggleField
                label="Required group"
                checked={group.isRequired}
                checkedLabel="Required"
                uncheckedLabel="Optional"
                onChange={(isRequired) => updateGroup(group.id, { isRequired })}
              />
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[#9aaabb]">Options</p>
                <SecondaryButton onClick={() => addOption(group.id)}>
                  Add option
                </SecondaryButton>
              </div>
              {group.options.length === 0 ? (
                <EmptyBuilderState
                  label="Add first option"
                  onClick={() => addOption(group.id)}
                />
              ) : null}
              {group.options.map((option) => (
                <div
                  key={option.id}
                  className="grid gap-2 rounded border border-(--admin-border) bg-[#111828] p-3 lg:grid-cols-[1.3fr_1fr_110px_95px_95px_40px]"
                >
                  <select
                    value={option.linkedProductId}
                    onChange={(event) => {
                      const linked = products.find(
                        (product) => product.id === event.target.value,
                      );
                      updateOption(group.id, option.id, {
                        linkedProductId: event.target.value,
                        displayName: linked?.name ?? option.displayName,
                      });
                    }}
                    className={adminInputClass}
                    aria-label="Linked product option"
                  >
                    <option value="">Linked product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                  <input
                    value={option.displayName}
                    onChange={(event) =>
                      updateOption(group.id, option.id, {
                        displayName: event.target.value,
                      })
                    }
                    className={adminInputClass}
                    placeholder="Display name"
                    aria-label="Option display name"
                  />
                  <input
                    value={centsToInputValue(option.priceAdjustmentCents)}
                    onChange={(event) =>
                      updateOption(group.id, option.id, {
                        priceAdjustmentCents: inputValueToCents(event.target.value),
                      })
                    }
                    inputMode="decimal"
                    className={adminInputClass}
                    aria-label="Option price adjustment"
                  />
                  <TogglePill
                    checked={option.isDefault}
                    label="Default"
                    onChange={(isDefault) =>
                      updateOption(group.id, option.id, { isDefault })
                    }
                  />
                  <TogglePill
                    checked={option.isAvailable}
                    label="Available"
                    onChange={(isAvailable) =>
                      updateOption(group.id, option.id, { isAvailable })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(group.id, option.id)}
                    className={`rounded border border-(--admin-border) text-[#9aaabb] hover:text-white ${focusRing}`}
                    aria-label="Remove option"
                  >
                    <Trash2 className="mx-auto size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </BuilderSection>
  );
}

function BuilderModifiersStep({
  draft,
  onDraftChange,
}: {
  draft: MenuBuilderDraft;
  onDraftChange: Dispatch<SetStateAction<MenuBuilderDraft>>;
}) {
  function addModifier() {
    onDraftChange((current) => ({
      ...current,
      modifiers: [
        ...current.modifiers,
        {
          id: menuBuilderId("modifier"),
          name: "",
          type: "ADD",
          isRequired: false,
          minSelections: 0,
          maxSelections: 3,
          allowQuantity: true,
          options: [],
        },
      ],
    }));
  }

  function updateModifier(
    modifierId: string,
    patch: Partial<MenuBuilderModifierGroup>,
  ) {
    onDraftChange((current) => ({
      ...current,
      modifiers: current.modifiers.map((modifier) =>
        modifier.id === modifierId ? { ...modifier, ...patch } : modifier,
      ),
    }));
  }

  function addModifierOption(modifierId: string) {
    onDraftChange((current) => ({
      ...current,
      modifiers: current.modifiers.map((modifier) =>
        modifier.id === modifierId
          ? {
              ...modifier,
              options: [
                ...modifier.options,
                {
                  id: menuBuilderId("modifier_option"),
                  name: "",
                  priceAdjustmentCents: 0,
                  maxQuantity: 1,
                  isAvailable: true,
                  sortOrder: modifier.options.length + 1,
                },
              ],
            }
          : modifier,
      ),
    }));
  }

  function updateModifierOption(
    modifierId: string,
    optionId: string,
    patch: Partial<MenuBuilderModifierOption>,
  ) {
    onDraftChange((current) => ({
      ...current,
      modifiers: current.modifiers.map((modifier) =>
        modifier.id === modifierId
          ? {
              ...modifier,
              options: modifier.options.map((option) =>
                option.id === optionId ? { ...option, ...patch } : option,
              ),
            }
          : modifier,
      ),
    }));
  }

  function removeModifier(modifierId: string) {
    onDraftChange((current) => ({
      ...current,
      modifiers: current.modifiers.filter(
        (modifier) => modifier.id !== modifierId,
      ),
    }));
  }

  function removeModifierOption(modifierId: string, optionId: string) {
    onDraftChange((current) => ({
      ...current,
      modifiers: current.modifiers.map((modifier) =>
        modifier.id === modifierId
          ? {
              ...modifier,
              options: modifier.options.filter((option) => option.id !== optionId),
            }
          : modifier,
      ),
    }));
  }

  return (
    <BuilderSection
      title="Modifiers And Add-ons"
      action={
        <PrimaryButton type="button" onClick={addModifier}>
          <span className="inline-flex items-center gap-1">
            <Plus className="size-3.5" />
            Add modifier
          </span>
        </PrimaryButton>
      }
    >
      {draft.modifiers.length === 0 ? (
        <EmptyBuilderState label="Add first modifier" onClick={addModifier} />
      ) : null}
      <div className="space-y-3">
        {draft.modifiers.map((modifier) => (
          <div
            key={modifier.id}
            className="rounded-md border border-(--admin-border) bg-[#0c0f1a] p-4"
          >
            <div className="grid gap-3 lg:grid-cols-3">
              <BuilderField
                label="Group name"
                error={!modifier.name ? "Required" : ""}
              >
                <input
                  value={modifier.name}
                  onChange={(event) =>
                    updateModifier(modifier.id, { name: event.target.value })
                  }
                  className={adminInputClass}
                  placeholder="Sauces, extras, removals"
                />
              </BuilderField>
              <BuilderField label="Type">
                <select
                  value={modifier.type}
                  onChange={(event) =>
                    updateModifier(modifier.id, {
                      type: event.target.value as ModifierType,
                    })
                  }
                  className={adminInputClass}
                >
                  <option value="REMOVE">Remove ingredient</option>
                  <option value="ADD">Add ingredient</option>
                  <option value="EXTRA">Extra quantity</option>
                </select>
              </BuilderField>
              <ToggleField
                label="Required"
                checked={modifier.isRequired}
                checkedLabel="Required"
                uncheckedLabel="Optional"
                onChange={(isRequired) =>
                  updateModifier(modifier.id, { isRequired })
                }
              />
              <NumberBuilderField
                label="Min selections"
                value={modifier.minSelections}
                onChange={(minSelections) =>
                  updateModifier(modifier.id, { minSelections })
                }
              />
              <NumberBuilderField
                label="Max selections"
                value={modifier.maxSelections}
                onChange={(maxSelections) =>
                  updateModifier(modifier.id, { maxSelections })
                }
              />
              <ToggleField
                label="Quantity"
                checked={modifier.allowQuantity}
                checkedLabel="Allowed"
                uncheckedLabel="Single"
                onChange={(allowQuantity) =>
                  updateModifier(modifier.id, { allowQuantity })
                }
              />
            </div>
            <div className="mt-4 flex justify-between gap-2">
              <SecondaryButton onClick={() => addModifierOption(modifier.id)}>
                Add option
              </SecondaryButton>
              <button
                type="button"
                onClick={() => removeModifier(modifier.id)}
                className={`rounded border border-red-500/30 px-2 py-1 text-xs text-red-200 hover:bg-red-500/10 ${focusRing}`}
              >
                Remove group
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {modifier.options.map((option) => (
                <div
                  key={option.id}
                  className="grid gap-2 rounded border border-(--admin-border) bg-[#111828] p-3 lg:grid-cols-[1fr_110px_110px_95px_40px]"
                >
                  <input
                    value={option.name}
                    onChange={(event) =>
                      updateModifierOption(modifier.id, option.id, {
                        name: event.target.value,
                      })
                    }
                    className={adminInputClass}
                    placeholder="Option name"
                    aria-label="Modifier option name"
                  />
                  <input
                    value={centsToInputValue(option.priceAdjustmentCents)}
                    onChange={(event) =>
                      updateModifierOption(modifier.id, option.id, {
                        priceAdjustmentCents: inputValueToCents(event.target.value),
                      })
                    }
                    inputMode="decimal"
                    className={adminInputClass}
                    aria-label="Modifier option price"
                  />
                  <input
                    value={option.maxQuantity}
                    onChange={(event) =>
                      updateModifierOption(modifier.id, option.id, {
                        maxQuantity: Number(event.target.value),
                      })
                    }
                    type="number"
                    min={1}
                    className={adminInputClass}
                    aria-label="Max quantity per option"
                  />
                  <TogglePill
                    checked={option.isAvailable}
                    label="Available"
                    onChange={(isAvailable) =>
                      updateModifierOption(modifier.id, option.id, {
                        isAvailable,
                      })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => removeModifierOption(modifier.id, option.id)}
                    className={`rounded border border-(--admin-border) text-[#9aaabb] hover:text-white ${focusRing}`}
                    aria-label="Remove modifier option"
                  >
                    <Trash2 className="mx-auto size-3.5" />
                  </button>
                </div>
              ))}
              {modifier.options.length === 0 ? (
                <EmptyBuilderState
                  label="Add first option"
                  onClick={() => addModifierOption(modifier.id)}
                />
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </BuilderSection>
  );
}

function BuilderLargeMealStep({
  draft,
  mealProducts,
  onChange,
}: {
  draft: MenuBuilderDraft;
  mealProducts: MenuProduct[];
  onChange: (patch: Partial<MenuBuilderDraft>) => void;
}) {
  return (
    <BuilderSection title="Large Meal Link">
      <div className="grid gap-4 lg:grid-cols-2">
        <BuilderField
          label="Regular meal version"
          error={!draft.regularMealId ? "Required" : ""}
        >
          <select
            value={draft.regularMealId}
            onChange={(event) => onChange({ regularMealId: event.target.value })}
            className={adminInputClass}
          >
            <option value="">Select regular meal</option>
            {mealProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </BuilderField>
        <BuilderField label="Large-specific base price">
          <input
            value={centsToInputValue(draft.largeBasePriceCents)}
            onChange={(event) =>
              onChange({
                largeBasePriceCents: inputValueToCents(event.target.value),
              })
            }
            inputMode="decimal"
            className={adminInputClass}
            placeholder="39.90"
          />
        </BuilderField>
      </div>
      <BuilderField label="Large-specific surcharges">
        <textarea
          value={draft.largeSurchargeNotes}
          onChange={(event) => onChange({ largeSurchargeNotes: event.target.value })}
          className={adminTextareaClass}
          placeholder="Large fries +3.00, large drink +2.00"
        />
      </BuilderField>
    </BuilderSection>
  );
}

function BuilderPricingStep({
  pricing,
  draft,
}: {
  pricing: ReturnType<typeof calculateMenuBuilderPricing>;
  draft: MenuBuilderDraft;
}) {
  return (
    <BuilderSection title="Pricing Review">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <PriceBox
          label="Base price"
          value={pricing.baseCents}
          currencyCode={draft.currencyCode}
        />
        <PriceBox
          label="Default configuration"
          value={pricing.defaultCents}
          currencyCode={draft.currencyCode}
        />
        <PriceBox
          label="Min possible"
          value={pricing.minCents}
          currencyCode={draft.currencyCode}
        />
        <PriceBox
          label="Max possible"
          value={pricing.maxCents}
          currencyCode={draft.currencyCode}
        />
        <PriceBox
          label="Group surcharges"
          value={pricing.groupSurchargeCents}
          currencyCode={draft.currencyCode}
        />
        <PriceBox
          label="Add-on surcharges"
          value={pricing.addonSurchargeCents}
          currencyCode={draft.currencyCode}
        />
      </div>
      <div className="rounded-md border border-(--admin-border) bg-[#0c0f1a] p-4 text-xs leading-5 text-[#9aaabb]">
        Customer price preview uses {draft.currencyCode || "PLN"} and starts at{" "}
        <span className="font-semibold text-white">
          {formatCurrencyPrice(pricing.defaultCents, draft.currencyCode)}
        </span>
        .
      </div>
    </BuilderSection>
  );
}

function BuilderReviewStep({
  draft,
  pricing,
  warnings,
}: {
  draft: MenuBuilderDraft;
  pricing: ReturnType<typeof calculateMenuBuilderPricing>;
  warnings: string[];
}) {
  return (
    <BuilderSection title="Review And Publish">
      <div className="grid gap-4 lg:grid-cols-2">
        <DetailSection title="Product">
          <Detail label="Name" value={draft.name || "Not set"} />
          <Detail label="Type" value={<Badge tone="neutral">{draft.productType}</Badge>} />
          <Detail label="Menu" value={draft.menuName || "Not set"} />
          <Detail label="Category" value={draft.category || "Not set"} />
          <Detail label="Visibility" value={draft.visible ? "Visible" : "Hidden"} />
          <Detail
            label="Price"
            value={formatCurrencyPrice(pricing.defaultCents, draft.currencyCode)}
            strong
          />
        </DetailSection>
        <DetailSection title="Configuration">
          <Detail label="Groups" value={draft.groups.length} />
          <Detail label="Modifiers" value={draft.modifiers.length} />
          <Detail
            label="Availability"
            value={
              draft.availabilityMode === "ALWAYS" ? "Always available" : "Scheduled"
            }
          />
          <Detail label="Warnings" value={warnings.length} />
        </DetailSection>
      </div>
    </BuilderSection>
  );
}

function BuilderPreview({
  draft,
  pricing,
  warnings,
  restaurantName,
}: {
  draft: MenuBuilderDraft;
  pricing: ReturnType<typeof calculateMenuBuilderPricing>;
  warnings: string[];
  restaurantName: string;
}) {
  return (
    <div className="sticky top-4 space-y-4">
      <div className="rounded-md border border-(--admin-border) bg-[#111828] p-3">
        <div className="aspect-[4/3] overflow-hidden rounded bg-[#182030]">
          {draft.imageUrl ? (
            <img
              src={draft.imageUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-[#6b7694]">
              <ImageIcon className="size-8" />
            </div>
          )}
        </div>
        <div className="mt-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-white">
                {draft.name || "Product name"}
              </p>
              <p className="text-xs text-[#6b7694]">{restaurantName}</p>
            </div>
            <Badge tone={draft.visible ? "green" : "neutral"}>
              {draft.visible ? "Visible" : "Hidden"}
            </Badge>
          </div>
          <p className="line-clamp-3 min-h-10 text-xs leading-5 text-[#9aaabb]">
            {draft.description || "Description preview"}
          </p>
          <div className="flex items-center justify-between border-t border-(--admin-border) pt-3">
            <span className="text-xs text-[#6b7694]">From</span>
            <span className="font-mono text-sm font-semibold text-white">
              {formatCurrencyPrice(pricing.defaultCents, draft.currencyCode)}
            </span>
          </div>
        </div>
      </div>

      <DetailSection title="Price Summary">
        <Detail
          label="Base"
          value={formatCurrencyPrice(pricing.baseCents, draft.currencyCode)}
          mono
        />
        <Detail
          label="Default"
          value={formatCurrencyPrice(pricing.defaultCents, draft.currencyCode)}
          mono
          strong
        />
        <Detail
          label="Min"
          value={formatCurrencyPrice(pricing.minCents, draft.currencyCode)}
          mono
        />
        <Detail
          label="Max"
          value={formatCurrencyPrice(pricing.maxCents, draft.currencyCode)}
          mono
        />
      </DetailSection>

      {warnings.length > 0 ? (
        <div className="rounded-md border border-amber-500/25 bg-amber-500/10 p-3 text-xs leading-5 text-amber-200">
          {warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function BuilderSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex min-h-9 items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function BuilderField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[#9aaabb]">{label}</span>
        {error ? <span className="text-[10px] text-red-200">{error}</span> : null}
      </span>
      {children}
    </label>
  );
}

function NumberBuilderField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <BuilderField label={label}>
      <input
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        type="number"
        min={0}
        className={adminInputClass}
      />
    </BuilderField>
  );
}

function ToggleField({
  label,
  checked,
  checkedLabel,
  uncheckedLabel,
  onChange,
}: {
  label: string;
  checked: boolean;
  checkedLabel: string;
  uncheckedLabel: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-[#9aaabb]">{label}</p>
      <TogglePill
        checked={checked}
        label={checked ? checkedLabel : uncheckedLabel}
        onChange={onChange}
      />
    </div>
  );
}

function TogglePill({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex min-h-9 items-center justify-center rounded-md border px-3 text-xs font-semibold transition ${
        checked
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
          : "border-(--admin-border) bg-[#182030] text-[#9aaabb]"
      } ${focusRing}`}
    >
      {label}
    </button>
  );
}

function EmptyBuilderState({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-20 w-full items-center justify-center gap-2 rounded-md border border-dashed border-(--admin-border) bg-[#111828] text-xs font-semibold text-[#9aaabb] transition hover:text-white ${focusRing}`}
    >
      <Plus className="size-4" />
      {label}
    </button>
  );
}

function PriceBox({
  label,
  value,
  currencyCode = "PLN",
}: {
  label: string;
  value: number;
  currencyCode?: string;
}) {
  return (
    <div className="rounded-md border border-(--admin-border) bg-[#0c0f1a] p-4">
      <p className="text-xs text-[#6b7694]">{label}</p>
      <p className="mt-1 font-mono text-sm font-semibold text-white">
        {formatCurrencyPrice(value, currencyCode)}
      </p>
    </div>
  );
}

function MenuTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-8 rounded px-3 text-xs font-semibold transition ${
        active ? "bg-[#4f7ef7] text-white" : "text-[#9aaabb] hover:text-white"
      } ${focusRing}`}
    >
      {children}
    </button>
  );
}

function SmallActionButton({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-8 items-center gap-1 rounded border border-(--admin-border) px-2 text-xs font-semibold text-[#9aaabb] transition hover:text-white ${focusRing}`}
    >
      {icon}
      {label}
    </button>
  );
}

function AdminUsersView({
  sessionToken,
  isTemporaryBypass,
}: {
  sessionToken: string;
  isTemporaryBypass: boolean;
}) {
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
    if (isTemporaryBypass) {
      setUsers(adminPreviewUsers);
      setAdminRestaurants(adminPreviewRestaurants);
      setTableState("ready");
      return;
    }

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
  }, [isTemporaryBypass, sessionToken]);

  useEffect(() => {
    void Promise.resolve().then(loadAdminData);
  }, [loadAdminData]);

  async function handleInvite(invite: {
    email: string;
    restaurantId: string;
  }): Promise<InviteAdminUserResponse> {
    if (isTemporaryBypass) {
      const restaurant = adminPreviewRestaurants.find(
        (item) => item.id === invite.restaurantId,
      );
      const previewUser: AdminUser = {
        id: `temporary-admin-${users.length + 1}`,
        email: invite.email,
        name: invite.email.split("@")[0] || "Invited admin",
        role: "ADMIN",
        restaurants: [restaurant?.name ?? "Preview restaurant"],
        twoFactorEnabled: true,
        status: "pending",
        lastLoginAt: "Never",
      };
      setUsers((current) => [...current, previewUser]);

      return {
        inviteId: previewUser.id,
        email: previewUser.email,
        role: "ADMIN",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        invitationUrl: "temporary-preview-invite",
        delivery: {
          channel: "console",
          previewToken: "temporary-preview-token",
        },
      };
    }

    const response = await inviteAdminUser(sessionToken, {
      email: invite.email,
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
    restaurantId: string;
  }) => Promise<InviteAdminUserResponse>;
}) {
  const [sent, setSent] = useState<InviteAdminUserResponse | null>(null);
  const [email, setEmail] = useState("");
  const [restaurantId, setRestaurantId] = useState(restaurants[0]?.id ?? "");
  const [errorMessage, setErrorMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErrorMessage("");
    try {
      setSent(await onInvite({ email, restaurantId }));
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
              pending until they choose a password and complete 2FA setup.
            </div>
            <AdminReadonly label="Invitation URL" value={sent.invitationUrl} />
            {sent.delivery.previewToken ? (
              <AdminReadonly label="Dev invite token" value={sent.delivery.previewToken} />
            ) : null}
            {sent.delivery.providerMessageId ? (
              <AdminReadonly
                label="Email provider message ID"
                value={sent.delivery.providerMessageId}
              />
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
              Super admin sends an invite only. The worker chooses their own
              password and enrolls 2FA before the account becomes active.
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

function SettingsView({
  sessionToken,
  isTemporaryBypass,
}: {
  sessionToken: string;
  isTemporaryBypass: boolean;
}) {
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleRegenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErrorMessage("");
    setStatusMessage("");
    try {
      if (isTemporaryBypass) {
        throw new Error("Recovery codes require a real admin session.");
      }
      const response = await regenerateAdminRecoveryCodes(sessionToken, {
        password,
        code,
      });
      setRecoveryCodes(response.recoveryCodes);
      setPassword("");
      setCode("");
      setStatusMessage(
        "Recovery codes regenerated. Store them before leaving this page.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not regenerate recovery codes.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <ViewHeader
        title="Settings"
        description="Manage account security settings for the current admin session."
      />
      <div className="grid max-w-3xl gap-5 p-5">
        {errorMessage ? <AdminAlert tone="error">{errorMessage}</AdminAlert> : null}
        {statusMessage ? (
          <AdminAlert tone="success">{statusMessage}</AdminAlert>
        ) : null}

        <section className="grid gap-4 rounded-md border border-(--admin-border) bg-[#111828] p-5">
          <PanelHeading
            title="2FA recovery codes"
            text="Generate a fresh set when old codes may be lost or exposed."
          />
          <form onSubmit={handleRegenerate} className="grid gap-4">
            <AdminField
              label="Current password"
              icon={<Shield className="size-4" />}
            >
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
            <AdminField
              label="Current 6-digit 2FA code"
              icon={<Shield className="size-4" />}
            >
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
              />
            </AdminField>
            <div className="flex justify-end">
              <PrimaryButton
                type="submit"
                disabled={busy || code.length !== 6 || !password}
              >
                {busy ? "Regenerating..." : "Regenerate recovery codes"}
              </PrimaryButton>
            </div>
          </form>
        </section>

        {recoveryCodes.length > 0 ? (
          <section className="grid gap-3 rounded-md border border-amber-400/25 bg-amber-400/10 p-5">
            <h2 className="text-sm font-semibold text-white">
              Save these codes now
            </h2>
            <p className="text-xs leading-5 text-[#9aaabb]">
              Existing unused recovery codes were disabled. These new codes are
              shown only once.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {recoveryCodes.map((recoveryCode) => (
                <code
                  key={recoveryCode}
                  className="rounded border border-(--admin-border) bg-[#182030] px-3 py-2 text-xs font-semibold text-[#dde2ee]"
                >
                  {recoveryCode}
                </code>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
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




