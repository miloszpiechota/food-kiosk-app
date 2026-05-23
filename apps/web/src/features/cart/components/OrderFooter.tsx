import { ShoppingCart } from "lucide-react";
import { AccessibilityButton } from "../../accessibility/components/AccessibilityButton";
import type { CartItem, CartSummary } from "../types/cart.types";
import { Price } from "../../../shared/components/Price";
import { focusRing } from "../../../shared/components/IconButton";
import { BottomActionBar } from "../../../shared/layout/BottomActionBar";

interface OrderFooterProps {
  items: CartItem[];
  summary: CartSummary;
}

export function OrderFooter({ items, summary }: OrderFooterProps) {
  const hasItems = summary.itemCount > 0;
  const previewItems = items.slice(-2).reverse();
  const remainingItemCount = Math.max(summary.itemCount - 2, 0);

  return (
    <BottomActionBar>
      <div className="flex shrink-0 items-center">
        <AccessibilityButton />
      </div>

      <div className="ml-auto flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex min-w-0 items-center gap-4 rounded-3xl border border-border bg-background/60 p-3 sm:w-[32rem]">
          <div
            className={`flex size-14 shrink-0 items-center justify-center rounded-2xl ${
              hasItems ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
            }`}
            aria-hidden="true"
          >
            <ShoppingCart className="size-7" />
          </div>

          {hasItems ? (
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="text-lg font-bold text-foreground">
                  Your order
                </p>
                <p className="text-base text-muted-foreground">
                  {summary.itemCount} {summary.itemCount === 1 ? "item" : "items"}
                </p>
              </div>
              <div className="mt-1 flex min-w-0 flex-wrap gap-2">
                {previewItems.map((item) => (
                  <span
                    key={item.id}
                    className="max-w-56 truncate rounded-full border border-border bg-card px-3 py-1 text-sm font-semibold text-foreground"
                  >
                    {item.quantity}x {item.name}
                  </span>
                ))}
                {remainingItemCount > 0 && (
                  <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                    +{remainingItemCount} more
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold text-foreground">
                Start your order
              </p>
              <p className="text-base text-muted-foreground">
                Add an item to review your cart and checkout.
              </p>
            </div>
          )}
        </div>

        <div className="grid shrink-0 gap-3">
          <button
            type="button"
            disabled={!hasItems}
            aria-disabled={!hasItems}
            className={`flex min-h-16 min-w-56 flex-col items-center justify-center rounded-2xl border border-secondary/70 bg-secondary px-8 text-background shadow-xl shadow-secondary/20 transition enabled:hover:bg-secondary/90 enabled:hover:shadow-secondary/30 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:shadow-none ${focusRing}`}
          >
            <span className="text-sm font-black uppercase tracking-[0.12em]">
              Checkout
            </span>
            <Price cents={summary.totalCents} className="text-2xl font-black" />
          </button>
        </div>
      </div>
    </BottomActionBar>
  );
}
