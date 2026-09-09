import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Home,
  ReceiptText,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { OrderSnapshot } from "../../features/cart/api/basketApi";
import { focusRing } from "../../shared/components/IconButton";
import { Price } from "../../shared/components/Price";
import { KioskShell } from "../../shared/layout/KioskShell";

export type CheckoutReturnStatus = "success" | "cancelled" | "unknown";

interface PaymentResultPageProps {
  checkoutStatus: CheckoutReturnStatus;
  orderId: string;
  onGetOrder: (orderId: string) => Promise<OrderSnapshot>;
  onStartNewOrder: () => void;
}

type ResultTone = "success" | "warning" | "error" | "pending";

const terminalPaymentStatuses = new Set(["PAID", "FAILED", "CANCELLED"]);

export function PaymentResultPage({
  checkoutStatus,
  orderId,
  onGetOrder,
  onStartNewOrder,
}: PaymentResultPageProps) {
  const [order, setOrder] = useState<OrderSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(30);

  useEffect(() => {
    let isMounted = true;

    async function refreshOrder() {
      try {
        const latestOrder = await onGetOrder(orderId);
        if (!isMounted) return;
        setOrder(latestOrder);
        setError(null);
      } catch (reason) {
        if (!isMounted) return;
        setError(
          reason instanceof Error
            ? reason.message
            : "The payment status could not be loaded.",
        );
      }
    }

    void refreshOrder();
    const intervalId = window.setInterval(() => {
      if (!order || !terminalPaymentStatuses.has(order.paymentStatus)) {
        void refreshOrder();
      }
    }, 2500);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [onGetOrder, order, orderId]);

  useEffect(() => {
    const deadline = Date.now() + 30000;
    const intervalId = window.setInterval(() => {
      setSecondsRemaining(
        Math.max(0, Math.ceil((deadline - Date.now()) / 1000)),
      );
    }, 1000);
    const timeoutId = window.setTimeout(onStartNewOrder, 30000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [onStartNewOrder]);

  const result = getPaymentResultState(checkoutStatus, order, error);
  const Icon = result.icon;

  return (
    <KioskShell className="grid min-h-dvh place-items-center p-6">
      <main className="w-full max-w-2xl rounded-3xl border border-border bg-card p-8 text-center shadow-2xl shadow-black/20">
        <div
          className={`mx-auto grid size-24 place-items-center rounded-full border-2 ${result.iconClassName}`}
        >
          <Icon aria-hidden="true" className="size-12" />
        </div>

        <h1 className="mt-6 text-4xl font-black text-foreground">
          {result.title}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-lg leading-7 text-muted-foreground">
          {result.message}
        </p>

        <section className="mt-7 rounded-3xl border border-border bg-background/50 p-5 text-left">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <span className="grid size-11 place-items-center rounded-full bg-primary/15 text-primary">
              <ReceiptText aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.14em] text-muted-foreground">
                Order
              </p>
              <p className="text-xl font-black text-foreground">
                {order?.orderNumber ?? "Loading..."}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <StatusTile label="Payment" value={order?.paymentStatus ?? "..."} />
            <StatusTile label="Order" value={order?.status ?? "..."} />
            <StatusTile
              label="Total"
              value={
                order ? (
                  <Price cents={order.totalCents} className="font-black" />
                ) : (
                  "..."
                )
              }
            />
          </div>
        </section>

        {result.tone === "pending" && (
          <p
            role="status"
            className="mt-5 rounded-2xl border border-primary/40 bg-primary/10 p-4 text-sm font-semibold text-primary"
          >
            Waiting for the verified Stripe webhook before confirming payment.
          </p>
        )}

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={onStartNewOrder}
            className={`inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl border border-primary/60 bg-primary px-8 text-base font-black text-primary-foreground shadow-xl shadow-primary/20 transition hover:bg-primary/90 active:scale-95 ${focusRing}`}
          >
            <Home aria-hidden="true" className="size-5" />
            Start new order
          </button>
          <p className="text-sm font-semibold text-muted-foreground">
            Returning to the start screen in {secondsRemaining}s
          </p>
        </div>
      </main>
    </KioskShell>
  );
}

function StatusTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 break-words text-lg font-black text-foreground">
        {value}
      </p>
    </div>
  );
}

function getPaymentResultState(
  checkoutStatus: CheckoutReturnStatus,
  order: OrderSnapshot | null,
  error: string | null,
): {
  icon: typeof CheckCircle2;
  iconClassName: string;
  message: string;
  title: string;
  tone: ResultTone;
} {
  if (order?.paymentStatus === "PAID") {
    return {
      icon: CheckCircle2,
      iconClassName: "border-emerald-400/40 bg-emerald-500/15 text-emerald-300",
      title: "Order accepted",
      message:
        "Your payment is confirmed and the restaurant has received your order.",
      tone: "success",
    };
  }

  if (order?.paymentStatus === "FAILED") {
    return {
      icon: XCircle,
      iconClassName: "border-destructive/60 bg-destructive/10 text-destructive",
      title: "Payment failed",
      message:
        "The payment was not completed. No paid order was confirmed for this attempt.",
      tone: "error",
    };
  }

  if (order?.paymentStatus === "CANCELLED" || checkoutStatus === "cancelled") {
    return {
      icon: XCircle,
      iconClassName: "border-amber-400/50 bg-amber-500/10 text-amber-300",
      title: "Payment cancelled",
      message: "The checkout was cancelled. Your order was not marked as paid.",
      tone: "warning",
    };
  }

  if (error) {
    return {
      icon: AlertCircle,
      iconClassName: "border-destructive/60 bg-destructive/10 text-destructive",
      title: "Payment status unavailable",
      message: error,
      tone: "error",
    };
  }

  return {
    icon: Clock3,
    iconClassName: "border-primary/40 bg-primary/10 text-primary",
    title: "Confirming payment",
    message:
      "Stripe redirected back to the kiosk. The backend is still waiting for verified payment confirmation.",
    tone: "pending",
  };
}
