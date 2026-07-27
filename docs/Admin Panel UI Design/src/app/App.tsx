import React, { useState, useEffect, type ReactNode } from "react";
import {
  Search, LogOut, Settings, Building2, Users, X, AlertTriangle,
  Clock, QrCode, ArrowLeft, Shield, Smartphone, Copy,
  ChevronDown, RefreshCw, User, Package, CreditCard,
  ShoppingCart, Loader2, CheckCircle2, MoreHorizontal,
  Check, ChevronRight, Utensils, Hash, SlidersHorizontal,
} from "lucide-react";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

type AppView = "login" | "invite" | "shell";
type ShellView = "orders" | "menu" | "admins" | "restaurants" | "settings";
type Role = "SUPER_ADMIN" | "ADMIN";
type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled";
type PaymentStatus = "unpaid" | "paid" | "failed" | "refunded";
type LoginMode = "email" | "qr";
type QRPhase = "waiting" | "approved" | "expired";
type TableState = "idle" | "loading" | "error" | "empty";
type ProductType = "meal" | "side" | "drink" | "dessert";

interface Restaurant { id: string; name: string; location: string; }
interface OrderItem {
  id: string; productId: string; menuProductId: string;
  name: string; type: string; unitPrice: number;
  quantity: number; lineTotal: number; config?: string;
}
interface Payment {
  id: string; provider: string; sessionId: string;
  intentId: string; amount: number; currency: string;
}
interface Order {
  id: string; orderNumber: string; restaurantId: string;
  createdAt: string; itemCount: number; orderStatus: OrderStatus;
  paymentStatus: PaymentStatus; total: number; subtotal: number;
  paymentProvider: string; items: OrderItem[]; payment: Payment;
}
interface Product {
  id: string; restaurantId: string; name: string;
  type: ProductType; category: string; price: number;
  visible: boolean; imageId: string;
  requiredGroup?: string; affectedMeals?: number;
}
interface AdminUser {
  id: string; email: string; name: string; role: Role;
  restaurantIds: string[]; lastActive: string; status: "active" | "pending";
}

// ─────────────────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────────────────

const RESTAURANTS: Restaurant[] = [
  { id: "r1", name: "Burger Palace", location: "Terminal A · Gate 12" },
  { id: "r2", name: "Sushi Zen", location: "Terminal B · Gate 7" },
  { id: "r3", name: "Pizza Corner", location: "Terminal A · Gate 5" },
  { id: "r4", name: "Taco Fiesta", location: "Terminal C · Gate 3" },
];

function mkPay(id: string, amount: number): Payment {
  const slug = id.replace(/[^a-z0-9]/gi, "").slice(0, 16);
  return { id, provider: "Stripe", sessionId: `cs_live_${slug}a1B2c3D4`, intentId: `pi_3${slug}Ab`, amount, currency: "GBP" };
}

const MOCK_ORDERS: Order[] = [
  {
    id: "ord_8821_xk2m3n4o5p6q7r8", orderNumber: "ORD-20240127-8821",
    restaurantId: "r1", createdAt: "2024-01-27T14:32:08Z", itemCount: 3,
    orderStatus: "completed", paymentStatus: "paid", total: 2897, subtotal: 2615,
    paymentProvider: "Stripe", payment: mkPay("pay_8821_xk2m3n4", 2897),
    items: [
      { id: "itm_8821_1", productId: "prod_001", menuProductId: "mp_001", name: "Classic Burger", type: "meal", unitPrice: 1299, quantity: 1, lineTotal: 1299, config: "No pickles · Extra cheese" },
      { id: "itm_8821_2", productId: "prod_002", menuProductId: "mp_002", name: "Small Fries", type: "side", unitPrice: 399, quantity: 2, lineTotal: 798 },
      { id: "itm_8821_3", productId: "prod_003", menuProductId: "mp_003", name: "Cola", type: "drink", unitPrice: 299, quantity: 1, lineTotal: 299, config: "Regular ice" },
    ],
  },
  {
    id: "ord_8820_jk1m2n3o4p5q6r7", orderNumber: "ORD-20240127-8820",
    restaurantId: "r2", createdAt: "2024-01-27T14:18:41Z", itemCount: 2,
    orderStatus: "preparing", paymentStatus: "paid", total: 3198, subtotal: 2898,
    paymentProvider: "Stripe", payment: mkPay("pay_8820_jk1m2n3", 3198),
    items: [
      { id: "itm_8820_1", productId: "prod_004", menuProductId: "mp_004", name: "Salmon Nigiri (8pc)", type: "meal", unitPrice: 2199, quantity: 1, lineTotal: 2199, config: "Extra wasabi" },
      { id: "itm_8820_2", productId: "prod_005", menuProductId: "mp_005", name: "Miso Soup", type: "side", unitPrice: 699, quantity: 1, lineTotal: 699 },
    ],
  },
  {
    id: "ord_8819_hj0l1m2n3o4p5q6", orderNumber: "ORD-20240127-8819",
    restaurantId: "r3", createdAt: "2024-01-27T13:55:22Z", itemCount: 4,
    orderStatus: "pending", paymentStatus: "unpaid", total: 4196, subtotal: 3796,
    paymentProvider: "Stripe", payment: mkPay("pay_8819_hj0l1m2", 0),
    items: [
      { id: "itm_8819_1", productId: "prod_006", menuProductId: "mp_006", name: "Margherita 12\"", type: "meal", unitPrice: 1499, quantity: 2, lineTotal: 2998, config: "Thin crust" },
      { id: "itm_8819_2", productId: "prod_007", menuProductId: "mp_007", name: "Garlic Bread", type: "side", unitPrice: 499, quantity: 1, lineTotal: 499 },
      { id: "itm_8819_3", productId: "prod_008", menuProductId: "mp_008", name: "Diet Cola", type: "drink", unitPrice: 299, quantity: 1, lineTotal: 299, config: "No ice" },
    ],
  },
  {
    id: "ord_8818_gj9k0l1m2n3o4p5", orderNumber: "ORD-20240127-8818",
    restaurantId: "r1", createdAt: "2024-01-27T13:21:09Z", itemCount: 2,
    orderStatus: "cancelled", paymentStatus: "refunded", total: 1798, subtotal: 1598,
    paymentProvider: "Stripe", payment: mkPay("pay_8818_gj9k0l1", 0),
    items: [
      { id: "itm_8818_1", productId: "prod_009", menuProductId: "mp_009", name: "Double Cheeseburger", type: "meal", unitPrice: 1499, quantity: 1, lineTotal: 1499, config: "No onions" },
      { id: "itm_8818_2", productId: "prod_010", menuProductId: "mp_010", name: "Onion Rings", type: "side", unitPrice: 449, quantity: 1, lineTotal: 449 },
    ],
  },
  {
    id: "ord_8817_fi8j9k0l1m2n3o4", orderNumber: "ORD-20240127-8817",
    restaurantId: "r4", createdAt: "2024-01-27T12:48:33Z", itemCount: 3,
    orderStatus: "ready", paymentStatus: "paid", total: 2547, subtotal: 2297,
    paymentProvider: "Stripe", payment: mkPay("pay_8817_fi8j9k0", 2547),
    items: [
      { id: "itm_8817_1", productId: "prod_011", menuProductId: "mp_011", name: "Beef Taco Set (3pc)", type: "meal", unitPrice: 1499, quantity: 1, lineTotal: 1499 },
      { id: "itm_8817_2", productId: "prod_012", menuProductId: "mp_012", name: "Nachos", type: "side", unitPrice: 599, quantity: 1, lineTotal: 599 },
      { id: "itm_8817_3", productId: "prod_013", menuProductId: "mp_013", name: "Horchata", type: "drink", unitPrice: 399, quantity: 1, lineTotal: 399, config: "Iced" },
    ],
  },
  {
    id: "ord_8816_eh7i8j9k0l1m2n3", orderNumber: "ORD-20240127-8816",
    restaurantId: "r2", createdAt: "2024-01-27T12:04:17Z", itemCount: 5,
    orderStatus: "completed", paymentStatus: "paid", total: 5294, subtotal: 4794,
    paymentProvider: "Stripe", payment: mkPay("pay_8816_eh7i8j9", 5294),
    items: [
      { id: "itm_8816_1", productId: "prod_014", menuProductId: "mp_014", name: "Chirashi Bowl", type: "meal", unitPrice: 2499, quantity: 1, lineTotal: 2499 },
      { id: "itm_8816_2", productId: "prod_015", menuProductId: "mp_015", name: "Edamame", type: "side", unitPrice: 499, quantity: 2, lineTotal: 998 },
      { id: "itm_8816_3", productId: "prod_003", menuProductId: "mp_003", name: "Green Tea", type: "drink", unitPrice: 299, quantity: 2, lineTotal: 598 },
    ],
  },
  {
    id: "ord_8815_dg6h7i8j9k0l1m2", orderNumber: "ORD-20240127-8815",
    restaurantId: "r1", createdAt: "2024-01-27T11:32:55Z", itemCount: 1,
    orderStatus: "completed", paymentStatus: "failed", total: 1299, subtotal: 1299,
    paymentProvider: "Stripe", payment: mkPay("pay_8815_dg6h7i8", 1299),
    items: [
      { id: "itm_8815_1", productId: "prod_001", menuProductId: "mp_001", name: "Classic Burger", type: "meal", unitPrice: 1299, quantity: 1, lineTotal: 1299 },
    ],
  },
  {
    id: "ord_8814_cf5g6h7i8j9k0l1", orderNumber: "ORD-20240126-8814",
    restaurantId: "r3", createdAt: "2024-01-26T20:17:44Z", itemCount: 3,
    orderStatus: "completed", paymentStatus: "paid", total: 3497, subtotal: 3197,
    paymentProvider: "Stripe", payment: mkPay("pay_8814_cf5g6h7", 3497),
    items: [
      { id: "itm_8814_1", productId: "prod_006", menuProductId: "mp_006", name: "Pepperoni 12\"", type: "meal", unitPrice: 1699, quantity: 1, lineTotal: 1699 },
      { id: "itm_8814_2", productId: "prod_007", menuProductId: "mp_007", name: "Garlic Bread", type: "side", unitPrice: 499, quantity: 1, lineTotal: 499 },
      { id: "itm_8814_3", productId: "prod_008", menuProductId: "mp_008", name: "Sparkling Water", type: "drink", unitPrice: 299, quantity: 2, lineTotal: 598 },
    ],
  },
];

const INITIAL_PRODUCTS: Product[] = [
  { id: "prod_001", restaurantId: "r1", name: "Classic Burger", type: "meal", category: "Burgers", price: 1299, visible: true, imageId: "1568901346375-23c9450c58cd" },
  { id: "prod_009", restaurantId: "r1", name: "Double Cheeseburger", type: "meal", category: "Burgers", price: 1499, visible: true, imageId: "1568901346375-23c9450c58cd" },
  { id: "prod_002", restaurantId: "r1", name: "Small Fries", type: "side", category: "Sides", price: 399, visible: true, imageId: "1573080496219-bb080dd4f877", requiredGroup: "Side", affectedMeals: 3 },
  { id: "prod_010", restaurantId: "r1", name: "Onion Rings", type: "side", category: "Sides", price: 449, visible: true, imageId: "1580735048575-e13d6c25dcaa" },
  { id: "prod_003", restaurantId: "r1", name: "Cola", type: "drink", category: "Drinks", price: 299, visible: true, imageId: "1554866585-cd94860890b7" },
  { id: "prod_004", restaurantId: "r2", name: "Salmon Nigiri (8pc)", type: "meal", category: "Nigiri", price: 2199, visible: true, imageId: "1617196034183-421b4040ed20" },
  { id: "prod_014", restaurantId: "r2", name: "Chirashi Bowl", type: "meal", category: "Bowls", price: 2499, visible: true, imageId: "1617196034183-421b4040ed20" },
  { id: "prod_005", restaurantId: "r2", name: "Miso Soup", type: "side", category: "Sides", price: 699, visible: true, imageId: "1547592166-23ac45744acd", requiredGroup: "Soup", affectedMeals: 2 },
  { id: "prod_015", restaurantId: "r2", name: "Edamame", type: "side", category: "Sides", price: 499, visible: false, imageId: "1512621776951-a57141f2eefd" },
  { id: "prod_006", restaurantId: "r3", name: "Margherita 12\"", type: "meal", category: "Pizzas", price: 1499, visible: true, imageId: "1565299624946-b28f40a0ae38" },
  { id: "prod_020", restaurantId: "r3", name: "Pepperoni 12\"", type: "meal", category: "Pizzas", price: 1699, visible: true, imageId: "1565299624946-b28f40a0ae38" },
  { id: "prod_007", restaurantId: "r3", name: "Garlic Bread", type: "side", category: "Sides", price: 499, visible: true, imageId: "1548365328-7b8b10c57b8c", requiredGroup: "Side", affectedMeals: 4 },
  { id: "prod_008", restaurantId: "r3", name: "Cola / Sparkling", type: "drink", category: "Drinks", price: 299, visible: true, imageId: "1554866585-cd94860890b7" },
  { id: "prod_011", restaurantId: "r4", name: "Beef Taco Set (3pc)", type: "meal", category: "Tacos", price: 1499, visible: true, imageId: "1565299585323-38d6b0865b47" },
  { id: "prod_012", restaurantId: "r4", name: "Nachos", type: "side", category: "Sides", price: 599, visible: true, imageId: "1585109649139-366815a130cc" },
  { id: "prod_013", restaurantId: "r4", name: "Horchata", type: "drink", category: "Drinks", price: 399, visible: true, imageId: "1554866585-cd94860890b7" },
];

const MOCK_ADMINS: AdminUser[] = [
  { id: "u1", email: "j.smith@kioskplatform.io", name: "James Smith", role: "SUPER_ADMIN", restaurantIds: [], lastActive: "2024-01-27T15:42:00Z", status: "active" },
  { id: "u2", email: "s.chen@kioskplatform.io", name: "Sarah Chen", role: "ADMIN", restaurantIds: ["r1", "r2"], lastActive: "2024-01-27T12:11:00Z", status: "active" },
  { id: "u3", email: "m.okonkwo@partner.com", name: "Michael Okonkwo", role: "ADMIN", restaurantIds: ["r3"], lastActive: "2024-01-26T18:30:00Z", status: "active" },
  { id: "u4", email: "l.garcia@partner.com", name: "Luis Garcia", role: "ADMIN", restaurantIds: ["r4"], lastActive: "2024-01-25T09:22:00Z", status: "pending" },
  { id: "u5", email: "r.patel@kioskplatform.io", name: "Riya Patel", role: "SUPER_ADMIN", restaurantIds: [], lastActive: "2024-01-27T10:05:00Z", status: "active" },
];

// ─────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────

function fmtGBP(pence: number) { return `£${(pence / 100).toFixed(2)}`; }
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
function fmtDateTime(iso: string) { return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }
function getRestaurantName(id: string) { return RESTAURANTS.find(r => r.id === id)?.name ?? "—"; }

// ─────────────────────────────────────────────────────────
// MockQR
// ─────────────────────────────────────────────────────────

function MockQR({ size = 160, bg = "#182030", fg = "#dde2ee" }: { size?: number; bg?: string; fg?: string }) {
  const N = 21;
  const c = size / N;
  const rects: React.ReactElement[] = [];

  function addFinder(r0: number, c0: number) {
    for (let r = r0; r < r0 + 7; r++) {
      for (let cc = c0; cc < c0 + 7; cc++) {
        const dr = r - r0, dc = cc - c0;
        const isRing = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const isCore = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        if (isRing || isCore) rects.push(<rect key={`f${r}-${cc}`} x={cc * c} y={r * c} width={c} height={c} fill={fg} />);
      }
    }
  }

  addFinder(0, 0); addFinder(0, 14); addFinder(14, 0);

  for (let i = 8; i <= 12; i++) {
    if (i % 2 === 0) {
      rects.push(<rect key={`th${i}`} x={i * c} y={6 * c} width={c} height={c} fill={fg} />);
      rects.push(<rect key={`tv${i}`} x={6 * c} y={i * c} width={c} height={c} fill={fg} />);
    }
  }

  const skip = (r: number, cc: number) =>
    (r <= 8 && cc <= 8) || (r <= 8 && cc >= 13) || (r >= 13 && cc <= 8) ||
    (r === 6 && cc >= 6 && cc <= 14) || (cc === 6 && r >= 6 && r <= 14);

  for (let r = 0; r < N; r++) {
    for (let cc = 0; cc < N; cc++) {
      if (skip(r, cc)) continue;
      const h = ((r * 31 + cc * 17) * 7 + r * cc * 3) % 100;
      if (h > 44) rects.push(<rect key={`d${r}-${cc}`} x={cc * c} y={r * c} width={c} height={c} fill={fg} />);
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <rect width={size} height={size} fill={bg} />
      {rects}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────
// UI Primitives
// ─────────────────────────────────────────────────────────

type BadgeVariant = "success" | "warning" | "error" | "neutral" | "info" | "purple";

function Badge({ variant, children }: { variant: BadgeVariant; children: ReactNode }) {
  const cls: Record<BadgeVariant, string> = {
    success: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/25",
    warning: "bg-amber-500/15 text-amber-400 ring-amber-500/25",
    error: "bg-red-500/15 text-red-400 ring-red-500/25",
    neutral: "bg-white/5 text-slate-300 ring-white/10",
    info: "bg-blue-500/15 text-blue-400 ring-blue-500/25",
    purple: "bg-purple-500/15 text-purple-400 ring-purple-500/25",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium font-mono ring-1 ${cls[variant]}`}>
      {children}
    </span>
  );
}

const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; variant: BadgeVariant }> = {
  pending: { label: "Pending", variant: "warning" },
  preparing: { label: "Preparing", variant: "info" },
  ready: { label: "Ready", variant: "purple" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "error" },
};

const PAYMENT_STATUS_MAP: Record<PaymentStatus, { label: string; variant: BadgeVariant }> = {
  unpaid: { label: "Unpaid", variant: "neutral" },
  paid: { label: "Paid", variant: "success" },
  failed: { label: "Failed", variant: "error" },
  refunded: { label: "Refunded", variant: "warning" },
};

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, variant } = ORDER_STATUS_MAP[status];
  return <Badge variant={variant}>{label}</Badge>;
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { label, variant } = PAYMENT_STATUS_MAP[status];
  return <Badge variant={variant}>{label}</Badge>;
}

function Modal({ open, onClose, title, children, size = "md" }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; size?: "sm" | "md" | "lg";
}) {
  if (!open) return null;
  const w = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-3xl" }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-16">
      <div className="fixed inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-card border border-border rounded-lg shadow-2xl w-full ${w} mb-8`}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <X size={14} className="text-muted-foreground" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono = false }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start gap-4 py-1.5 border-b border-border/40 last:border-0">
      <span className="text-[11px] text-muted-foreground w-36 shrink-0 pt-px">{label}</span>
      <span className={`text-[11px] text-foreground flex-1 break-all ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-5 pt-4 pb-2">
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{children}</span>
    </div>
  );
}

function Sel({ value, onChange, children, className = "" }: {
  value: string; onChange: (v: string) => void; children: ReactNode; className?: string;
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={`bg-input-background border border-border text-foreground text-xs rounded px-2.5 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}>
      {children}
    </select>
  );
}

function Inp({ value, onChange, placeholder, className = "", type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string; type?: string;
}) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className={`bg-input-background border border-border text-foreground text-xs rounded px-2.5 py-1.5 placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
    />
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer ${checked ? "bg-primary" : "bg-switch-background"}`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${checked ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}

// ─────────────────────────────────────────────────────────
// LoginPage
// ─────────────────────────────────────────────────────────

function LoginPage({ onLogin, onGoToInvite }: { onLogin: (role: Role) => void; onGoToInvite: () => void }) {
  const [mode, setMode] = useState<LoginMode>("email");
  const [step, setStep] = useState<"credentials" | "2fa">("credentials");
  const [email, setEmail] = useState("j.smith@kioskplatform.io");
  const [password, setPassword] = useState("••••••••••••");
  const [code, setCode] = useState("");
  const [qrPhase, setQrPhase] = useState<QRPhase>("waiting");
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (mode !== "qr" || qrPhase !== "waiting" || countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [mode, qrPhase, countdown]);

  useEffect(() => {
    if (countdown === 0 && qrPhase === "waiting") setQrPhase("expired");
  }, [countdown, qrPhase]);

  function resetQR() { setQrPhase("waiting"); setCountdown(30); }
  function simulateApproval() { setQrPhase("approved"); setTimeout(() => onLogin("SUPER_ADMIN"), 1400); }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <Utensils size={15} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground leading-tight">KioskPlatform</div>
            <div className="text-[10px] text-muted-foreground tracking-wide uppercase">Admin Console</div>
          </div>
        </div>

        {/* Mode tabs */}
        <div className="flex bg-secondary rounded-md p-0.5 mb-6 border border-border">
          {(["email", "qr"] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setStep("credentials"); }}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded transition-colors font-medium ${mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {m === "email" ? <User size={12} /> : <QrCode size={12} />}
              {m === "email" ? "Email + 2FA" : "QR Login"}
            </button>
          ))}
        </div>

        {mode === "email" ? (
          <div className="space-y-4">
            {step === "credentials" ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Email address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full bg-input-background border border-border text-foreground text-sm rounded-md px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full bg-input-background border border-border text-foreground text-sm rounded-md px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <button onClick={() => setStep("2fa")}
                  className="w-full bg-primary text-primary-foreground text-sm font-medium rounded-md py-2 hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Continue
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setStep("credentials")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft size={12} /> Back
                </button>
                <div className="text-center py-2">
                  <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-3">
                    <Shield size={18} className="text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Two-factor authentication</p>
                  <p className="text-xs text-muted-foreground mt-1">Enter the 6-digit code from your authenticator app</p>
                </div>
                <input
                  type="text" inputMode="numeric" maxLength={6} value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000 000"
                  className="w-full bg-input-background border border-border text-foreground text-center text-2xl font-mono tracking-[0.5em] rounded-md px-3 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:tracking-normal placeholder:text-muted-foreground"
                />
                <div className="space-y-2 pt-1">
                  <button onClick={() => onLogin("SUPER_ADMIN")}
                    className="w-full bg-primary text-primary-foreground text-sm font-medium rounded-md py-2 hover:opacity-90 transition-opacity"
                  >
                    Sign in as SUPER_ADMIN
                  </button>
                  <button onClick={() => onLogin("ADMIN")}
                    className="w-full bg-secondary border border-border text-foreground text-sm font-medium rounded-md py-2 hover:bg-accent transition-colors"
                  >
                    Sign in as ADMIN
                  </button>
                </div>
                <p className="text-center text-[11px] text-muted-foreground">Demo: either button enters the shell</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-secondary border border-border rounded-lg p-5 flex flex-col items-center gap-4">
              {qrPhase === "waiting" && (
                <>
                  <div className="relative p-3 bg-card rounded-lg border border-border">
                    <MockQR size={160} bg="#182030" fg="#dde2ee" />
                    {countdown <= 10 && (
                      <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm rounded px-2 py-0.5">
                        <span className="text-xs font-mono font-bold text-amber-400">{countdown}s</span>
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-foreground">Scan with trusted admin device</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Code expires in {countdown}s</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Loader2 size={12} className="animate-spin text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">Waiting for scan…</span>
                  </div>
                  <button onClick={simulateApproval} className="text-[11px] text-primary hover:underline">
                    Demo: simulate device approval →
                  </button>
                </>
              )}
              {qrPhase === "approved" && (
                <div className="flex flex-col items-center gap-3 py-8">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center">
                    <CheckCircle2 size={24} className="text-emerald-400" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Access approved</p>
                  <p className="text-xs text-muted-foreground">Signing you in…</p>
                </div>
              )}
              {qrPhase === "expired" && (
                <div className="flex flex-col items-center gap-3 py-6">
                  <div className="w-12 h-12 rounded-full bg-amber-500/15 flex items-center justify-center">
                    <Clock size={24} className="text-amber-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">QR code expired</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Generate a new code to try again</p>
                  </div>
                  <button onClick={resetQR} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                    <RefreshCw size={12} /> Generate new code
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => setMode("email")} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
              Fallback to email login
            </button>
          </div>
        )}

        {/* Demo shortcuts */}
        <div className="mt-8 pt-5 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center mb-2.5 uppercase tracking-wider">Jump to demo</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button onClick={() => onLogin("SUPER_ADMIN")}
              className="text-xs border border-border rounded-md py-1.5 text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
            >
              SUPER_ADMIN
            </button>
            <button onClick={() => onLogin("ADMIN")}
              className="text-xs border border-border rounded-md py-1.5 text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
            >
              ADMIN
            </button>
          </div>
          <button onClick={onGoToInvite}
            className="w-full text-xs border border-border rounded-md py-1.5 text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
          >
            Invite acceptance flow →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// InvitePage
// ─────────────────────────────────────────────────────────

function InvitePage({ onComplete, onBack }: { onComplete: () => void; onBack: () => void }) {
  type IStep = "password" | "authenticator" | "verify";
  const STEPS: IStep[] = ["password", "authenticator", "verify"];
  const [step, setStep] = useState<IStep>("password");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [copied, setCopied] = useState(false);
  const MANUAL_KEY = "JBSWY3DPEHPK3PXP";
  const DISPLAY_KEY = "JBSW Y3DP EHPK 3PXP";
  const pwMatch = password.length >= 8 && password === confirm;
  const stepIdx = STEPS.indexOf(step);

  function copyKey() {
    navigator.clipboard.writeText(MANUAL_KEY).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft size={12} /> Back to login
        </button>

        {/* Step progress */}
        <div className="flex items-center mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-all ${s === step ? "bg-primary text-primary-foreground scale-110" : stepIdx > i ? "bg-emerald-500 text-white" : "bg-secondary text-muted-foreground"}`}>
                {stepIdx > i ? <Check size={12} /> : i + 1}
              </div>
              {i < 2 && <div className={`flex-1 h-px mx-2 transition-colors ${stepIdx > i ? "bg-emerald-500/50" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        {step === "password" && (
          <div className="space-y-4">
            <div>
              <h1 className="text-base font-semibold text-foreground">Create your password</h1>
              <p className="text-xs text-muted-foreground mt-0.5">You were invited to KioskPlatform as an administrator.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Email address</label>
              <input type="email" value="s.taylor@newpartner.com" readOnly
                className="w-full bg-secondary/60 border border-border text-muted-foreground text-sm rounded-md px-3 py-2 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">New password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters"
                className="w-full bg-input-background border border-border text-foreground text-sm rounded-md px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Confirm password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat password"
                className={`w-full bg-input-background text-foreground text-sm rounded-md px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground border ${confirm && !pwMatch ? "border-red-500/60" : "border-border"}`}
              />
              {confirm && !pwMatch && <p className="text-[11px] text-red-400 mt-1">Passwords do not match</p>}
            </div>
            <button onClick={() => pwMatch && setStep("authenticator")} disabled={!pwMatch}
              className="w-full bg-primary text-primary-foreground text-sm font-medium rounded-md py-2 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Set password
            </button>
          </div>
        )}

        {step === "authenticator" && (
          <div className="space-y-4">
            <div>
              <h1 className="text-base font-semibold text-foreground">Set up authenticator</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Scan this QR code with Google Authenticator or Authy.</p>
            </div>
            <div className="bg-secondary border border-border rounded-lg p-4 flex flex-col items-center gap-3">
              <div className="p-2.5 bg-white rounded-lg">
                <MockQR size={144} bg="#ffffff" fg="#0c0f1a" />
              </div>
              <div className="text-center space-y-0.5">
                <p className="text-[11px] text-muted-foreground">Account: <span className="text-foreground font-mono">s.taylor@newpartner.com</span></p>
                <p className="text-[11px] text-muted-foreground">Issuer: <span className="text-foreground">KioskPlatform</span></p>
              </div>
            </div>
            <button onClick={() => setShowKey(!showKey)} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
              <Hash size={12} />
              {showKey ? "Hide" : "Can"}{showKey ? "" : "'t scan? Show"} manual entry key
            </button>
            {showKey && (
              <div className="bg-secondary border border-border rounded-md p-3 flex items-center justify-between gap-3">
                <code className="text-xs font-mono text-foreground tracking-wider">{DISPLAY_KEY}</code>
                <button onClick={copyKey} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                </button>
              </div>
            )}
            <button onClick={() => setStep("verify")}
              className="w-full bg-primary text-primary-foreground text-sm font-medium rounded-md py-2 hover:opacity-90 transition-opacity"
            >
              {"I've added the account"}
            </button>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-4">
            <div>
              <h1 className="text-base font-semibold text-foreground">Verify your code</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Enter the 6-digit code shown in your authenticator app.</p>
            </div>
            <div className="flex flex-col items-center py-3 gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                <Smartphone size={18} className="text-primary" />
              </div>
              <input
                type="text" inputMode="numeric" maxLength={6} value={verifyCode}
                onChange={e => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000 000"
                className="w-full bg-input-background border border-border text-foreground text-center text-2xl font-mono tracking-[0.5em] rounded-md px-3 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:tracking-normal placeholder:text-muted-foreground"
              />
            </div>
            <button onClick={onComplete}
              className="w-full bg-primary text-primary-foreground text-sm font-medium rounded-md py-2 hover:opacity-90 transition-opacity"
            >
              Activate account
            </button>
            <button onClick={() => setStep("authenticator")} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────

const NAV_ITEMS: { id: ShellView; label: string; icon: ReactNode; superOnly?: boolean }[] = [
  { id: "orders", label: "Orders", icon: <ShoppingCart size={14} /> },
  { id: "menu", label: "Menu Items", icon: <Package size={14} /> },
  { id: "admins", label: "Admin Users", icon: <Users size={14} />, superOnly: true },
  { id: "restaurants", label: "Restaurants", icon: <Building2 size={14} />, superOnly: true },
  { id: "settings", label: "Settings", icon: <Settings size={14} /> },
];

function Sidebar({ view, onView, role }: { view: ShellView; onView: (v: ShellView) => void; role: Role }) {
  return (
    <aside className="w-52 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
      <div className="px-4 py-3.5 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center shrink-0">
            <Utensils size={12} className="text-white" />
          </div>
          <div>
            <div className="text-xs font-semibold text-sidebar-foreground leading-tight">KioskPlatform</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Admin Console</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 py-2.5 px-2">
        {NAV_ITEMS.filter(n => !n.superOnly || role === "SUPER_ADMIN").map(n => (
          <button key={n.id} onClick={() => onView(n.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors mb-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring ${
              view === n.id
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            }`}
          >
            <span className={view === n.id ? "text-sidebar-primary" : ""}>{n.icon}</span>
            {n.label}
            {view === n.id && <span className="ml-auto w-1 h-1 rounded-full bg-sidebar-primary" />}
          </button>
        ))}
      </nav>
      <div className="px-3 py-3 border-t border-sidebar-border">
        <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">v2.14.0</p>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────
// TopBar
// ─────────────────────────────────────────────────────────

function TopBar({ role, selectedRestaurant, onRestaurant, onLogout, onSearch }: {
  role: Role; selectedRestaurant: string; onRestaurant: (id: string) => void; onLogout: () => void; onSearch: (q: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [showUser, setShowUser] = useState(false);
  const [showRest, setShowRest] = useState(false);

  const restName = selectedRestaurant ? (RESTAURANTS.find(r => r.id === selectedRestaurant)?.name ?? "All restaurants") : "All restaurants";

  return (
    <header className="h-11 bg-card border-b border-border flex items-center px-4 gap-3 shrink-0">
      {/* Restaurant selector */}
      <div className="relative">
        <button onClick={() => setShowRest(!showRest)}
          className="flex items-center gap-1.5 text-xs font-medium text-foreground bg-secondary border border-border rounded px-2.5 py-1.5 hover:bg-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Building2 size={11} className="text-muted-foreground" />
          <span className="max-w-28 truncate">{restName}</span>
          <ChevronDown size={11} className="text-muted-foreground" />
        </button>
        {showRest && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowRest(false)} />
            <div className="absolute top-full mt-1 left-0 z-20 bg-popover border border-border rounded-md shadow-2xl py-1 w-52">
              <button onClick={() => { onRestaurant(""); setShowRest(false); }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors ${!selectedRestaurant ? "text-primary" : "text-foreground"}`}
              >
                All restaurants
              </button>
              <div className="h-px bg-border mx-2 my-1" />
              {RESTAURANTS.map(r => (
                <button key={r.id} onClick={() => { onRestaurant(r.id); setShowRest(false); }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors ${selectedRestaurant === r.id ? "text-primary" : "text-foreground"}`}
                >
                  <div>{r.name}</div>
                  <div className="text-[10px] text-muted-foreground">{r.location}</div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Global search */}
      <div className="relative max-w-xs w-full">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input type="text" value={search}
          onChange={e => { setSearch(e.target.value); onSearch(e.target.value); }}
          placeholder="Search orders, menu items…"
          className="w-full bg-input-background border border-border text-foreground text-xs rounded pl-7 pr-3 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex-1" />

      <Badge variant={role === "SUPER_ADMIN" ? "purple" : "info"}>{role}</Badge>

      {/* User menu */}
      <div className="relative">
        <button onClick={() => setShowUser(!showUser)}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1"
        >
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
            <User size={11} className="text-primary" />
          </div>
          <span className="text-foreground font-medium">James Smith</span>
          <ChevronDown size={11} />
        </button>
        {showUser && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowUser(false)} />
            <div className="absolute top-full mt-1 right-0 z-20 bg-popover border border-border rounded-md shadow-2xl py-1 w-44">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-xs font-semibold text-foreground">James Smith</p>
                <p className="text-[10px] text-muted-foreground">j.smith@kioskplatform.io</p>
              </div>
              <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <Settings size={11} /> Account settings
              </button>
              <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                <LogOut size={11} /> Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────
// Order Detail Modal
// ─────────────────────────────────────────────────────────

function OrderDetailModal({ order, onClose }: { order: Order | null; onClose: () => void }) {
  if (!order) return null;
  return (
    <Modal open title={`Order ${order.orderNumber}`} onClose={onClose} size="lg">
      <SectionLabel>Order</SectionLabel>
      <div className="px-5 pb-1">
        <DetailRow label="Order ID" value={order.id} mono />
        <DetailRow label="Order Number" value={order.orderNumber} mono />
        <DetailRow label="Restaurant" value={getRestaurantName(order.restaurantId)} />
        <DetailRow label="Created" value={fmtDateTime(order.createdAt)} />
        <DetailRow label="Order Status" value={<OrderStatusBadge status={order.orderStatus} />} />
        <DetailRow label="Payment Status" value={<PaymentStatusBadge status={order.paymentStatus} />} />
        <DetailRow label="Subtotal" value={fmtGBP(order.subtotal)} />
        <DetailRow label="Total" value={<span className="font-semibold">{fmtGBP(order.total)}</span>} />
      </div>

      <SectionLabel>Payment</SectionLabel>
      <div className="px-5 pb-1">
        <DetailRow label="Payment ID" value={order.payment.id} mono />
        <DetailRow label="Provider" value={
          <span className="flex items-center gap-1.5">
            <CreditCard size={11} className="text-muted-foreground" /> {order.payment.provider}
          </span>
        } />
        <DetailRow label="Session ID" value={order.payment.sessionId} mono />
        <DetailRow label="Payment Intent" value={order.payment.intentId} mono />
        <DetailRow label="Amount" value={fmtGBP(order.payment.amount)} />
        <DetailRow label="Currency" value={order.payment.currency} mono />
      </div>

      <SectionLabel>Items ({order.items.length})</SectionLabel>
      <div className="overflow-x-auto pb-5 px-5">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr>
              {["Item ID", "Product ID", "Menu Product ID", "Name", "Type", "Unit", "Qty", "Total", "Configuration"].map(h => (
                <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wide pb-2 pr-4 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {order.items.map(item => (
              <tr key={item.id} className="border-t border-border/40">
                <td className="py-2 pr-4 font-mono text-[10px] text-muted-foreground whitespace-nowrap">{item.id}</td>
                <td className="py-2 pr-4 font-mono text-[10px] text-muted-foreground whitespace-nowrap">{item.productId}</td>
                <td className="py-2 pr-4 font-mono text-[10px] text-muted-foreground whitespace-nowrap">{item.menuProductId}</td>
                <td className="py-2 pr-4 text-xs text-foreground whitespace-nowrap">{item.name}</td>
                <td className="py-2 pr-4"><Badge variant="neutral">{item.type}</Badge></td>
                <td className="py-2 pr-4 text-xs text-foreground font-mono">{fmtGBP(item.unitPrice)}</td>
                <td className="py-2 pr-4 text-xs text-foreground text-center">{item.quantity}</td>
                <td className="py-2 pr-4 text-xs font-semibold text-foreground font-mono">{fmtGBP(item.lineTotal)}</td>
                <td className="py-2 text-[11px] text-muted-foreground">{item.config ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────
// Orders View
// ─────────────────────────────────────────────────────────

interface OFilters { restaurant: string; orderStatus: string; paymentStatus: string; search: string; dateFrom: string; dateTo: string; }

function OrdersView({ role, globalSearch, selectedRestaurant }: { role: Role; globalSearch: string; selectedRestaurant: string }) {
  const [filters, setFilters] = useState<OFilters>({ restaurant: selectedRestaurant, orderStatus: "", paymentStatus: "", search: globalSearch, dateFrom: "", dateTo: "" });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [tableState, setTableState] = useState<TableState>("idle");

  useEffect(() => { setFilters(f => ({ ...f, restaurant: selectedRestaurant, search: globalSearch })); }, [selectedRestaurant, globalSearch]);

  const filtered = MOCK_ORDERS.filter(o => {
    if (filters.restaurant && o.restaurantId !== filters.restaurant) return false;
    if (filters.orderStatus && o.orderStatus !== filters.orderStatus) return false;
    if (filters.paymentStatus && o.paymentStatus !== filters.paymentStatus) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const inOrder = o.orderNumber.toLowerCase().includes(q);
      const inItems = o.items.some(i => i.name.toLowerCase().includes(q));
      if (!inOrder && !inItems) return false;
    }
    return true;
  });

  const setF = (k: keyof OFilters, v: string) => setFilters(f => ({ ...f, [k]: v }));
  const hasFilter = filters.restaurant || filters.orderStatus || filters.paymentStatus || filters.search;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-3.5 border-b border-border flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Orders</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">{filtered.length} of {MOCK_ORDERS.length} orders</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider mr-1">Demo state:</span>
          <div className="flex items-center gap-0.5 border border-border rounded overflow-hidden">
            {(["idle", "loading", "error", "empty"] as const).map(s => (
              <button key={s} onClick={() => setTableState(s)}
                className={`text-[10px] px-2.5 py-1 transition-colors border-r border-border last:border-0 ${tableState === s ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="px-6 py-2.5 border-b border-border flex flex-wrap items-center gap-2 shrink-0 bg-secondary/20">
        <SlidersHorizontal size={12} className="text-muted-foreground shrink-0" />
        {role === "SUPER_ADMIN" && (
          <Sel value={filters.restaurant} onChange={v => setF("restaurant", v)}>
            <option value="">All restaurants</option>
            {RESTAURANTS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Sel>
        )}
        <Sel value={filters.orderStatus} onChange={v => setF("orderStatus", v)}>
          <option value="">Any order status</option>
          {(["pending", "preparing", "ready", "completed", "cancelled"] as const).map(s => (
            <option key={s} value={s}>{ORDER_STATUS_MAP[s].label}</option>
          ))}
        </Sel>
        <Sel value={filters.paymentStatus} onChange={v => setF("paymentStatus", v)}>
          <option value="">Any payment status</option>
          {(["unpaid", "paid", "failed", "refunded"] as const).map(s => (
            <option key={s} value={s}>{PAYMENT_STATUS_MAP[s].label}</option>
          ))}
        </Sel>
        <Inp value={filters.dateFrom} onChange={v => setF("dateFrom", v)} placeholder="From" className="w-24" />
        <Inp value={filters.dateTo} onChange={v => setF("dateTo", v)} placeholder="To" className="w-24" />
        <div className="relative">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Inp value={filters.search} onChange={v => setF("search", v)} placeholder="Order # or item name…" className="pl-7 w-44" />
        </div>
        {hasFilter && (
          <button onClick={() => setFilters({ restaurant: "", orderStatus: "", paymentStatus: "", search: "", dateFrom: "", dateTo: "" })}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={11} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {tableState === "loading" && (
          <div className="flex items-center justify-center h-64 gap-3">
            <Loader2 size={18} className="animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading orders…</span>
          </div>
        )}
        {tableState === "error" && (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Failed to load orders</p>
              <p className="text-xs text-muted-foreground mt-1">Check your connection and try again</p>
            </div>
            <button className="flex items-center gap-1.5 text-xs text-primary hover:underline">
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}
        {tableState === "empty" && (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <ShoppingCart size={18} className="text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">No orders found</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or date range</p>
            </div>
          </div>
        )}
        {tableState === "idle" && (
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-card">
              <tr>
                {["Order #", "Restaurant", "Created", "Items", "Order Status", "Payment", "Total", "Provider", ""].map(h => (
                  <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-4 py-2.5 border-b border-border whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-sm text-muted-foreground">No orders match the current filters</td>
                </tr>
              ) : filtered.map((o, i) => (
                <tr key={o.id} onClick={() => setSelectedOrder(o)}
                  className={`cursor-pointer border-b border-border/40 hover:bg-accent/50 transition-colors group ${i % 2 === 1 ? "bg-secondary/10" : ""}`}
                >
                  <td className="px-4 py-2.5 font-mono text-xs text-foreground whitespace-nowrap">{o.orderNumber}</td>
                  <td className="px-4 py-2.5 text-xs text-foreground whitespace-nowrap">{getRestaurantName(o.restaurantId)}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{fmtDateTime(o.createdAt)}</td>
                  <td className="px-4 py-2.5 text-xs text-foreground text-center">{o.itemCount}</td>
                  <td className="px-4 py-2.5"><OrderStatusBadge status={o.orderStatus} /></td>
                  <td className="px-4 py-2.5"><PaymentStatusBadge status={o.paymentStatus} /></td>
                  <td className="px-4 py-2.5 text-xs font-semibold text-foreground font-mono whitespace-nowrap">{fmtGBP(o.total)}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{o.paymentProvider}</td>
                  <td className="px-4 py-2.5">
                    <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Menu View
// ─────────────────────────────────────────────────────────

interface MFilters { restaurant: string; category: string; type: string; visibility: string; search: string; }

function MenuView({ role, selectedRestaurant }: { role: Role; selectedRestaurant: string }) {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [filters, setFilters] = useState<MFilters>({ restaurant: selectedRestaurant, category: "", type: "", visibility: "", search: "" });
  const [pending, setPending] = useState<Product | null>(null);

  useEffect(() => { setFilters(f => ({ ...f, restaurant: selectedRestaurant })); }, [selectedRestaurant]);

  const categories = [...new Set(products.map(p => p.category))];

  const filtered = products.filter(p => {
    if (filters.restaurant && p.restaurantId !== filters.restaurant) return false;
    if (filters.category && p.category !== filters.category) return false;
    if (filters.type && p.type !== filters.type) return false;
    if (filters.visibility === "visible" && !p.visible) return false;
    if (filters.visibility === "hidden" && p.visible) return false;
    if (filters.search && !p.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const setF = (k: keyof MFilters, v: string) => setFilters(f => ({ ...f, [k]: v }));

  function handleToggle(product: Product) {
    if (product.visible && product.affectedMeals && product.affectedMeals > 0) {
      setPending(product);
    } else {
      setProducts(ps => ps.map(p => p.id === product.id ? { ...p, visible: !p.visible } : p));
    }
  }

  function confirmHide() {
    if (!pending) return;
    setProducts(ps => ps.map(p => p.id === pending.id ? { ...p, visible: false } : p));
    setPending(null);
  }

  const hidden = filtered.filter(p => !p.visible).length;

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3.5 border-b border-border flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Menu Items</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {filtered.length} items
            {hidden > 0 && <> · <span className="text-amber-400">{hidden} hidden</span></>}
          </p>
        </div>
      </div>

      <div className="px-6 py-2.5 border-b border-border flex flex-wrap items-center gap-2 shrink-0 bg-secondary/20">
        <SlidersHorizontal size={12} className="text-muted-foreground shrink-0" />
        {role === "SUPER_ADMIN" && (
          <Sel value={filters.restaurant} onChange={v => setF("restaurant", v)}>
            <option value="">All restaurants</option>
            {RESTAURANTS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Sel>
        )}
        <Sel value={filters.category} onChange={v => setF("category", v)}>
          <option value="">Any category</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </Sel>
        <Sel value={filters.type} onChange={v => setF("type", v)}>
          <option value="">Any type</option>
          {(["meal", "side", "drink", "dessert"] as const).map(t => (
            <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>
          ))}
        </Sel>
        <Sel value={filters.visibility} onChange={v => setF("visibility", v)}>
          <option value="">Any visibility</option>
          <option value="visible">Visible only</option>
          <option value="hidden">Hidden only</option>
        </Sel>
        <div className="relative">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Inp value={filters.search} onChange={v => setF("search", v)} placeholder="Search products…" className="pl-7 w-44" />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-card">
            <tr>
              {["Product", "Type", "Category", "Restaurant", "Price", "Visibility"].map(h => (
                <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-4 py-2.5 border-b border-border whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-16 text-sm text-muted-foreground">No products match the current filters</td></tr>
            ) : filtered.map((p, i) => (
              <tr key={p.id} className={`border-b border-border/40 ${i % 2 === 1 ? "bg-secondary/10" : ""} ${!p.visible ? "opacity-60" : ""}`}>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded overflow-hidden bg-secondary shrink-0">
                      <img
                        src={`https://images.unsplash.com/photo-${p.imageId}?w=72&h=72&fit=crop&auto=format`}
                        alt={p.name} className="w-full h-full object-cover" loading="lazy"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{p.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5"><Badge variant="neutral">{p.type}</Badge></td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{p.category}</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{getRestaurantName(p.restaurantId)}</td>
                <td className="px-4 py-2.5 text-xs font-mono text-foreground">{fmtGBP(p.price)}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Toggle checked={p.visible} onChange={() => handleToggle(p)} />
                    <span className={`text-[11px] font-medium ${p.visible ? "text-emerald-400" : "text-muted-foreground"}`}>
                      {p.visible ? "Visible" : "Hidden"}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Visibility warning modal */}
      <Modal open={!!pending} onClose={() => setPending(null)} title="Visibility warning" size="sm">
        <div className="p-5 space-y-4">
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
              <AlertTriangle size={16} className="text-amber-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Hiding this item affects active meals</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Hiding <strong className="text-foreground">{pending?.name}</strong> will make{" "}
                <strong className="text-foreground">{pending?.affectedMeals} meal{pending?.affectedMeals !== 1 ? "s" : ""}</strong> unavailable
                because the required <strong className="text-foreground">{pending?.requiredGroup}</strong> group
                will have no visible option.
              </p>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => setPending(null)}
              className="flex-1 border border-border text-xs font-medium text-foreground rounded-md py-2 hover:bg-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Cancel
            </button>
            <button onClick={confirmHide}
              className="flex-1 bg-amber-500 text-white text-xs font-semibold rounded-md py-2 hover:bg-amber-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Hide anyway
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Admin Users View
// ─────────────────────────────────────────────────────────

function AdminsView() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3.5 border-b border-border flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Admin Users</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">{MOCK_ADMINS.length} administrators</p>
        </div>
        <button className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md px-3 py-1.5 hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <User size={12} /> Invite admin
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-card">
            <tr>
              {["Name", "Email", "Role", "Restaurants", "Last active", "Status", ""].map(h => (
                <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-4 py-2.5 border-b border-border whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_ADMINS.map((u, i) => (
              <tr key={u.id} className={`border-b border-border/40 ${i % 2 === 1 ? "bg-secondary/10" : ""}`}>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <User size={11} className="text-primary" />
                    </div>
                    <span className="text-xs font-medium text-foreground whitespace-nowrap">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">{u.email}</td>
                <td className="px-4 py-2.5"><Badge variant={u.role === "SUPER_ADMIN" ? "purple" : "info"}>{u.role}</Badge></td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">
                  {u.restaurantIds.length === 0
                    ? <span className="text-muted-foreground/40 italic">All</span>
                    : u.restaurantIds.map(id => getRestaurantName(id)).join(", ")}
                </td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{fmtDate(u.lastActive)}</td>
                <td className="px-4 py-2.5"><Badge variant={u.status === "active" ? "success" : "warning"}>{u.status}</Badge></td>
                <td className="px-4 py-2.5">
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <MoreHorizontal size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Restaurants View
// ─────────────────────────────────────────────────────────

function RestaurantsView() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3.5 border-b border-border flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Restaurants</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">{RESTAURANTS.length} active locations</p>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-card">
            <tr>
              {["ID", "Name", "Location", "Admins", "Products", ""].map(h => (
                <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-4 py-2.5 border-b border-border whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RESTAURANTS.map((r, i) => {
              const admins = MOCK_ADMINS.filter(a => a.restaurantIds.includes(r.id)).length;
              const products = INITIAL_PRODUCTS.filter(p => p.restaurantId === r.id).length;
              return (
                <tr key={r.id} className={`border-b border-border/40 ${i % 2 === 1 ? "bg-secondary/10" : ""}`}>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-muted-foreground">{r.id}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-primary/15 flex items-center justify-center shrink-0">
                        <Utensils size={11} className="text-primary" />
                      </div>
                      <span className="text-xs font-medium text-foreground whitespace-nowrap">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{r.location}</td>
                  <td className="px-4 py-2.5 text-xs text-foreground">{admins}</td>
                  <td className="px-4 py-2.5 text-xs text-foreground">{products}</td>
                  <td className="px-4 py-2.5">
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <MoreHorizontal size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Settings View
// ─────────────────────────────────────────────────────────

function SettingsView({ role }: { role: Role }) {
  const items = [
    { label: "Account", desc: "Email address, password, and session management", superOnly: false },
    { label: "Two-factor authentication", desc: "Manage authenticator app and backup codes", superOnly: false },
    { label: "Notifications", desc: "Alert preferences for order events and status changes", superOnly: false },
    { label: "API Access", desc: "Manage API keys and webhook endpoint configuration", superOnly: true },
    { label: "Audit Log", desc: "View admin actions, logins, and security events", superOnly: true },
    { label: "Platform billing", desc: "Subscription details and invoice history", superOnly: true },
  ].filter(s => !s.superOnly || role === "SUPER_ADMIN");

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-sm font-semibold text-foreground mb-5">Settings</h1>
      <div className="space-y-1.5">
        {items.map(s => (
          <button key={s.label}
            className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-md hover:bg-accent transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div>
              <p className="text-xs font-medium text-foreground">{s.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{s.desc}</p>
            </div>
            <ChevronRight size={14} className="text-muted-foreground shrink-0 ml-3" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Admin Shell
// ─────────────────────────────────────────────────────────

function AdminShell({ role, onLogout }: { role: Role; onLogout: () => void }) {
  const [view, setView] = useState<ShellView>("orders");
  const [selectedRestaurant, setSelectedRestaurant] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar view={view} onView={setView} role={role} />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar
          role={role}
          selectedRestaurant={selectedRestaurant}
          onRestaurant={setSelectedRestaurant}
          onLogout={onLogout}
          onSearch={setGlobalSearch}
        />
        <main className="flex-1 overflow-hidden">
          {view === "orders" && <OrdersView role={role} globalSearch={globalSearch} selectedRestaurant={selectedRestaurant} />}
          {view === "menu" && <MenuView role={role} selectedRestaurant={selectedRestaurant} />}
          {view === "admins" && role === "SUPER_ADMIN" && <AdminsView />}
          {view === "restaurants" && role === "SUPER_ADMIN" && <RestaurantsView />}
          {view === "settings" && <SettingsView role={role} />}
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────

export default function App() {
  const [appView, setAppView] = useState<AppView>("login");
  const [role, setRole] = useState<Role>("SUPER_ADMIN");

  function handleLogin(r: Role) {
    setRole(r);
    setAppView("shell");
  }

  return (
    <div className="size-full">
      {appView === "login" && (
        <LoginPage onLogin={handleLogin} onGoToInvite={() => setAppView("invite")} />
      )}
      {appView === "invite" && (
        <InvitePage onComplete={() => handleLogin("ADMIN")} onBack={() => setAppView("login")} />
      )}
      {appView === "shell" && (
        <AdminShell role={role} onLogout={() => setAppView("login")} />
      )}
    </div>
  );
}
