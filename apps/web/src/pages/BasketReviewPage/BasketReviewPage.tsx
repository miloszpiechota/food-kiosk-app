import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Minus,
  Package,
  Pencil,
  Plus,
  Receipt,
  ShoppingCart,
  Trash2,
  Utensils,
} from "lucide-react";
import { useState } from "react";
import type { OrderMode } from "../../app/router";
import type {
  CheckoutSession,
  OrderSnapshot,
} from "../../features/cart/api/basketApi";
import {
  summarizeBasketConfiguration,
  type BasketConfigurationSummary,
  type ModifierSummary,
} from "../../features/cart/lib/configurationSummary";
import type {
  CartItem,
  CartSummary,
} from "../../features/cart/types/cart.types";
import { focusRing } from "../../shared/components/IconButton";
import { Price } from "../../shared/components/Price";
import { KioskShell } from "../../shared/layout/KioskShell";

interface BasketReviewPageProps {
  items: CartItem[];
  orderMode: OrderMode;
  summary: CartSummary;
  onBack: () => void;
  onCreateCheckoutSession: (orderId: string) => Promise<CheckoutSession>;
  onCreateOrderSnapshot: () => Promise<OrderSnapshot>;
  onOrderModeToggle: () => void;
  onRemoveItem: (basketItemId: string) => Promise<void>;
  onStartNewOrder: () => void;
  onUpdateItemQuantity: (
    basketItemId: string,
    quantity: number,
  ) => Promise<void>;
}

export function BasketReviewPage({
  items,
  orderMode,
  summary,
  onBack,
  onCreateCheckoutSession,
  onCreateOrderSnapshot,
  onOrderModeToggle,
  onRemoveItem,
  onStartNewOrder,
  onUpdateItemQuantity,
}: BasketReviewPageProps) {
  const [createdOrder, setCreatedOrder] = useState<OrderSnapshot | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const hasItems = items.length > 0;

  function handleModeSelection(nextMode: OrderMode) {
    if (nextMode !== orderMode) {
      onOrderModeToggle();
    }
  }

  function showEditMessage() {
    setInfoMessage(
      "Product Details edit mode is the next UI step for changing choices inside an existing configured item.",
    );
  }

  async function handleQuantityChange(item: CartItem, nextQuantity: number) {
    const actionId = `quantity:${item.id}`;
    setPendingAction(actionId);
    setError(null);
    setInfoMessage(null);
    try {
      if (nextQuantity < 1) {
        await onRemoveItem(item.id);
        return;
      }
      await onUpdateItemQuantity(item.id, nextQuantity);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The basket item could not be updated.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function handleRemove(item: CartItem) {
    const actionId = `remove:${item.id}`;
    setPendingAction(actionId);
    setError(null);
    setInfoMessage(null);
    try {
      await onRemoveItem(item.id);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The basket item could not be removed.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function handleContinueToPayment() {
    setPendingAction("checkout");
    setError(null);
    setInfoMessage(null);
    try {
      const order = createdOrder ?? (await onCreateOrderSnapshot());
      setCreatedOrder(order);
      const checkoutSession = await onCreateCheckoutSession(order.id);
      window.location.assign(checkoutSession.checkoutUrl);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Payment could not be started.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  if (createdOrder) {
    return (
      <KioskShell className="grid place-items-center p-6">
        <section className="w-full max-w-xl rounded-3xl border border-border bg-card p-8 text-center shadow-2xl shadow-black/20">
          <div className="mx-auto grid size-24 place-items-center rounded-full border-2 border-emerald-400/40 bg-emerald-500/15 text-emerald-300">
            <CheckCircle2 aria-hidden="true" className="size-12" />
          </div>
          <h1 className="mt-6 text-4xl font-black text-foreground">
            Order ready for payment
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Continue to Stripe Checkout to complete this test payment.
          </p>
          <p className="my-6 text-5xl font-black text-primary">
            {createdOrder.orderNumber}
          </p>
          <div className="rounded-2xl border border-border bg-background/50 p-5">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-black text-foreground">
                {createdOrder.status}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-muted-foreground">Payment</span>
              <span className="font-black text-foreground">
                {createdOrder.paymentStatus}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="text-lg font-black text-foreground">Total</span>
              <Price
                cents={createdOrder.totalCents}
                className="text-3xl font-black text-primary"
              />
            </div>
          </div>
          {error && (
            <p
              role="alert"
              className="mt-5 flex items-start gap-3 rounded-2xl border border-destructive/60 bg-destructive/10 p-4 text-left text-sm font-semibold text-destructive"
            >
              <AlertCircle aria-hidden="true" className="mt-0.5 size-5" />
              <span>{error}</span>
            </p>
          )}
          <button
            type="button"
            disabled={pendingAction === "checkout"}
            onClick={() => void handleContinueToPayment()}
            className={`mt-8 inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl border border-primary/60 bg-primary px-8 text-base font-black text-primary-foreground shadow-xl shadow-primary/20 transition enabled:hover:bg-primary/90 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
          >
            <CreditCard aria-hidden="true" className="size-5" />
            {pendingAction === "checkout"
              ? "Opening Stripe..."
              : "Continue to payment"}
          </button>
          <button
            type="button"
            onClick={onStartNewOrder}
            className={`mt-4 min-h-12 rounded-2xl px-6 text-sm font-black text-muted-foreground transition hover:text-foreground active:scale-95 ${focusRing}`}
          >
            Start new order
          </button>
        </section>
      </KioskShell>
    );
  }

  if (!hasItems) {
    return (
      <KioskShell className="flex flex-col">
        <ReviewHeader itemCount={0} title="Review order" onBack={onBack} />
        <main className="grid min-h-0 flex-1 place-items-center p-6">
          <section className="flex max-w-md flex-col items-center text-center">
            <div className="grid size-24 place-items-center rounded-3xl border border-border bg-card shadow-2xl shadow-black/10">
              <ShoppingCart
                aria-hidden="true"
                className="size-11 text-muted-foreground"
              />
            </div>
            <h1 className="mt-6 text-4xl font-black text-foreground">
              Your order is empty
            </h1>
            <p className="mt-3 text-lg leading-7 text-muted-foreground">
              Add items from the menu before reviewing your order.
            </p>
            <button
              type="button"
              onClick={onBack}
              className={`mt-8 flex min-h-14 items-center gap-2 rounded-2xl border border-primary/60 bg-primary px-6 text-base font-black text-primary-foreground shadow-xl shadow-primary/20 transition hover:bg-primary/90 active:scale-95 ${focusRing}`}
            >
              <ArrowLeft aria-hidden="true" className="size-5" />
              Back to menu
            </button>
          </section>
        </main>
      </KioskShell>
    );
  }

  return (
    <KioskShell className="flex h-dvh flex-col">
      <ReviewHeader
        itemCount={summary.itemCount}
        title="Review your order"
        onBack={onBack}
      />

      <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:pr-3">
          <OrderModeSelector
            orderMode={orderMode}
            onSelect={handleModeSelection}
          />

          {infoMessage && (
            <p
              role="status"
              className="mt-4 flex items-start gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-4 text-sm font-semibold text-primary"
            >
              <AlertCircle aria-hidden="true" className="mt-0.5 size-5" />
              <span>{infoMessage}</span>
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="mt-4 flex items-start gap-3 rounded-2xl border border-destructive/60 bg-destructive/10 p-4 text-sm font-semibold text-destructive"
            >
              <AlertCircle aria-hidden="true" className="mt-0.5 size-5" />
              <span>{error}</span>
            </p>
          )}

          <div className="mt-5 flex items-center justify-between gap-4">
            <h2 className="text-sm font-black uppercase tracking-[0.14em] text-muted-foreground">
              Your items
            </h2>
            <button
              type="button"
              onClick={onBack}
              className={`flex min-h-10 items-center gap-1.5 rounded-xl px-2 text-sm font-black text-primary transition hover:text-primary/80 active:scale-95 ${focusRing}`}
            >
              <Plus aria-hidden="true" className="size-4" />
              Add more
            </button>
          </div>

          <div className="mt-3 space-y-4">
            {items.map((item) => (
              <BasketLineItemCard
                key={item.id}
                item={item}
                isPending={
                  pendingAction === `quantity:${item.id}` ||
                  pendingAction === `remove:${item.id}`
                }
                onEdit={showEditMessage}
                onQuantityChange={(nextQuantity) =>
                  void handleQuantityChange(item, nextQuantity)
                }
                onRemove={() => void handleRemove(item)}
              />
            ))}
          </div>
        </section>

        <aside className="flex-none border-t border-border bg-card/50 lg:w-96 lg:border-l lg:border-t-0">
          <div className="flex h-full flex-col">
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
              <PriceBreakdown items={items} totalCents={summary.totalCents} />
              <OrderModeChip orderMode={orderMode} />
              <section className="rounded-3xl border border-border bg-background/50 p-5">
                <p className="text-sm font-black uppercase tracking-[0.14em] text-muted-foreground">
                  Before payment
                </p>
                <p className="mt-2 text-base leading-6 text-foreground">
                  The backend creates an immutable order snapshot, starts a
                  Stripe Checkout Session, and waits for webhook confirmation.
                </p>
              </section>
            </div>

            <div className="border-t border-border p-5">
              <button
                type="button"
                disabled={pendingAction === "checkout"}
                onClick={() => void handleContinueToPayment()}
                className={`flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl border border-primary/60 bg-primary px-6 text-lg font-black text-primary-foreground shadow-xl shadow-primary/25 transition enabled:hover:bg-primary/90 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
              >
                <CreditCard aria-hidden="true" className="size-6" />
                {pendingAction === "checkout"
                  ? "Opening Stripe..."
                  : "Continue to payment"}
              </button>
              <p className="mt-3 text-center text-sm text-muted-foreground">
                Payment is confirmed only after Stripe sends a verified webhook.
              </p>
            </div>
          </div>
        </aside>
      </main>
    </KioskShell>
  );
}

function ReviewHeader({
  itemCount,
  onBack,
  title,
}: {
  itemCount: number;
  onBack: () => void;
  title: string;
}) {
  return (
    <header className="flex flex-none items-center gap-4 border-b border-border bg-card/80 px-4 py-4 backdrop-blur-sm sm:px-6">
      <button
        type="button"
        onClick={onBack}
        className={`flex min-h-12 items-center gap-2 rounded-2xl border border-border bg-background/60 px-4 text-sm font-black text-foreground transition hover:border-primary/60 hover:text-primary active:scale-95 ${focusRing}`}
      >
        <ArrowLeft aria-hidden="true" className="size-5" />
        <span className="hidden sm:inline">Back to menu</span>
      </button>

      <div className="min-w-0">
        <h1 className="truncate text-2xl font-black text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="text-sm font-semibold text-muted-foreground">
          {itemCount} {itemCount === 1 ? "item" : "items"} ready for review
        </p>
      </div>
    </header>
  );
}

function OrderModeSelector({
  onSelect,
  orderMode,
}: {
  onSelect: (mode: OrderMode) => void;
  orderMode: OrderMode;
}) {
  const modes: Array<{
    icon: typeof Utensils;
    label: string;
    value: OrderMode;
  }> = [
    { icon: Utensils, label: "Dine in", value: "dine-in" },
    { icon: Package, label: "Take out", value: "take-out" },
  ];

  return (
    <section className="rounded-3xl border border-border bg-card p-4 shadow-xl shadow-black/10">
      <p className="text-sm font-black uppercase tracking-[0.14em] text-muted-foreground">
        How are you dining?
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const selected = orderMode === mode.value;
          return (
            <button
              key={mode.value}
              type="button"
              onClick={() => onSelect(mode.value)}
              aria-pressed={selected}
              className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border-2 p-3 transition active:scale-[0.98] ${
                selected
                  ? "border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10"
                  : "border-border bg-background/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              } ${focusRing}`}
            >
              <span
                className={`grid size-11 place-items-center rounded-full ${
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <span className="text-base font-black">{mode.label}</span>
              {selected && (
                <CheckCircle2 aria-hidden="true" className="size-4" />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function BasketLineItemCard({
  item,
  isPending,
  onEdit,
  onQuantityChange,
  onRemove,
}: {
  item: CartItem;
  isPending: boolean;
  onEdit: () => void;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}) {
  const configuration = summarizeBasketConfiguration(item.configuration);
  const hasConfiguration =
    configuration.groups.length > 0 || configuration.modifiers.length > 0;

  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-black/10">
      <div className="flex gap-4 p-4 sm:p-5">
        <div className="grid size-24 flex-none place-items-center rounded-2xl border border-border bg-background/60 text-primary">
          <ShoppingCart aria-hidden="true" className="size-9" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-xl font-black leading-6 text-foreground">
                {item.name}
              </h3>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">
                <Price cents={item.unitPriceCents} /> each
              </p>
            </div>
            <Price
              cents={item.lineTotalCents}
              className="shrink-0 text-2xl font-black text-foreground"
            />
          </div>

          {hasConfiguration ? (
            <ConfigurationDetails configuration={configuration} />
          ) : (
            <p className="mt-4 rounded-2xl border border-border bg-background/50 px-4 py-3 text-sm font-semibold text-muted-foreground">
              No extra choices for this item.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border px-4 py-3 sm:px-5">
        {hasConfiguration && (
          <button
            type="button"
            onClick={onEdit}
            className={`flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm font-black text-primary transition hover:text-primary/80 active:scale-95 ${focusRing}`}
          >
            <Pencil aria-hidden="true" className="size-4" />
            Edit
          </button>
        )}

        <div className="ml-auto flex items-center gap-1 rounded-2xl border border-border bg-background/60 p-1">
          <button
            type="button"
            disabled={isPending}
            onClick={() => onQuantityChange(item.quantity - 1)}
            aria-label={`Decrease ${item.name} quantity`}
            className={`grid size-9 place-items-center rounded-xl text-foreground transition enabled:hover:bg-muted enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
          >
            <Minus aria-hidden="true" className="size-4" />
          </button>
          <span
            aria-live="polite"
            className="grid min-w-10 place-items-center text-lg font-black text-foreground"
          >
            {item.quantity}
          </span>
          <button
            type="button"
            disabled={isPending || item.quantity >= 9}
            onClick={() => onQuantityChange(item.quantity + 1)}
            aria-label={`Increase ${item.name} quantity`}
            className={`grid size-9 place-items-center rounded-xl text-foreground transition enabled:hover:bg-muted enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
          >
            <Plus aria-hidden="true" className="size-4" />
          </button>
        </div>

        <button
          type="button"
          disabled={isPending}
          onClick={onRemove}
          aria-label={`Remove ${item.name}`}
          className={`grid size-10 place-items-center rounded-xl text-muted-foreground transition enabled:hover:bg-destructive/10 enabled:hover:text-destructive enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </button>
      </div>
    </article>
  );
}

function ConfigurationDetails({
  configuration,
}: {
  configuration: BasketConfigurationSummary;
}) {
  return (
    <div className="mt-4 space-y-3 rounded-2xl border border-border bg-background/50 p-4">
      {configuration.productType && (
        <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-[0.1em] text-primary">
          {configuration.productType.replace("_", " ")}
        </span>
      )}

      {configuration.groups.map((group) => (
        <div key={group.id} className="space-y-2">
          <div className="flex items-start justify-between gap-3 text-sm">
            <div>
              <p className="font-black text-foreground">{group.groupName}</p>
              <p className="mt-0.5 text-muted-foreground">
                {group.quantity > 1 ? `${group.quantity}x ` : ""}
                {group.optionName}
              </p>
            </div>
            {group.priceAdjustmentCents > 0 && (
              <Price
                cents={group.priceAdjustmentCents}
                className="shrink-0 text-sm font-black text-primary"
              />
            )}
          </div>
          <ModifierList modifiers={group.modifiers} />
        </div>
      ))}

      <ModifierList modifiers={configuration.modifiers} />
    </div>
  );
}

function ModifierList({ modifiers }: { modifiers: ModifierSummary[] }) {
  if (modifiers.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {modifiers.map((modifier) => {
        const isRemove = modifier.actionType === "REMOVE";
        return (
          <span
            key={modifier.id}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black ${
              isRemove
                ? "border-destructive/50 bg-destructive/10 text-red-100"
                : "border-emerald-400/50 bg-emerald-500/10 text-emerald-100"
            }`}
          >
            <span
              aria-hidden="true"
              className={`size-1.5 rounded-full ${
                isRemove ? "bg-destructive" : "bg-emerald-400"
              }`}
            />
            <span className={isRemove ? "line-through" : ""}>
              {isRemove ? `No ${modifier.name}` : modifier.name}
              {modifier.quantity > 1 ? ` x${modifier.quantity}` : ""}
            </span>
            {!isRemove && modifier.priceAdjustmentCents > 0 && (
              <Price cents={modifier.priceAdjustmentCents} />
            )}
          </span>
        );
      })}
    </div>
  );
}

function PriceBreakdown({
  items,
  totalCents,
}: {
  items: CartItem[];
  totalCents: number;
}) {
  return (
    <section className="rounded-3xl border border-border bg-background/50 p-5">
      <div className="flex items-center gap-2">
        <Receipt aria-hidden="true" className="size-5 text-primary" />
        <h2 className="text-sm font-black uppercase tracking-[0.14em] text-muted-foreground">
          Price breakdown
        </h2>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3"
          >
            <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
              {item.quantity > 1 && (
                <span className="mr-1 font-black text-foreground">
                  {item.quantity}x
                </span>
              )}
              {item.name}
            </p>
            <Price
              cents={item.lineTotalCents}
              className="text-sm font-black text-foreground"
            />
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2 border-t border-border pt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <Price cents={totalCents} className="font-black text-foreground" />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Tax and discounts</span>
          <span className="font-semibold text-muted-foreground">
            Not applied
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <span className="text-lg font-black text-foreground">Total</span>
        <Price
          cents={totalCents}
          className="text-3xl font-black text-primary"
        />
      </div>
    </section>
  );
}

function OrderModeChip({ orderMode }: { orderMode: OrderMode }) {
  const isDineIn = orderMode === "dine-in";
  const Icon = isDineIn ? Utensils : Package;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/50 p-4">
      <span className="grid size-11 place-items-center rounded-full bg-primary/15 text-primary">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <div>
        <p className="text-base font-black text-foreground">
          {isDineIn ? "Dine in" : "Take out"}
        </p>
        <p className="text-sm text-muted-foreground">
          {isDineIn ? "Enjoy at the restaurant" : "Collect at the counter"}
        </p>
      </div>
    </div>
  );
}
