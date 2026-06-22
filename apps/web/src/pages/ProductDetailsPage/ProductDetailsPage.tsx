import { ArrowLeft, Minus, Plus, ShoppingCart } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { OrderMode } from "../../app/router";
import { OrderFooter } from "../../features/cart/components/OrderFooter";
import type { CartItem, CartSummary } from "../../features/cart/types/cart.types";
import { ProductLabelBadge } from "../../features/menu/components/ProductLabelBadge";
import type { Product } from "../../features/menu/types/menu.types";
import { focusRing } from "../../shared/components/IconButton";
import { Price } from "../../shared/components/Price";
import { Header } from "../../shared/layout/Header";
import { KioskShell } from "../../shared/layout/KioskShell";

interface ProductDetailsPageProps {
  cartItems: CartItem[];
  cartSummary: CartSummary;
  orderMode: OrderMode;
  product: Product;
  searchTerm: string;
  onAddToCart: (product: Product, quantity: number) => void;
  onBack: () => void;
  onOrderModeToggle: () => void;
  onSearchChange: (value: string) => void;
}

export function ProductDetailsPage({
  cartItems,
  cartSummary,
  orderMode,
  product,
  searchTerm,
  onAddToCart,
  onBack,
  onOrderModeToggle,
  onSearchChange,
}: ProductDetailsPageProps) {
  const [quantity, setQuantity] = useState(1);
  const totalCents = product.priceCents * quantity;

  function decreaseQuantity() {
    setQuantity((currentQuantity) => Math.max(1, currentQuantity - 1));
  }

  function increaseQuantity() {
    setQuantity((currentQuantity) => Math.min(9, currentQuantity + 1));
  }

  function handleAddToOrder() {
    onAddToCart(product, quantity);
    onBack();
  }

  return (
    <KioskShell className="flex flex-col">
      <Header
        orderMode={orderMode}
        searchTerm={searchTerm}
        onOrderModeToggle={onOrderModeToggle}
        onSearchChange={onSearchChange}
      />

      <main className="min-h-0 flex-1 overflow-y-auto pb-48">
        <div className="mx-auto grid max-w-screen-2xl gap-6 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_minmax(24rem,0.8fr)]">
          <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-black/20">
            <div className="relative min-h-[28rem] bg-muted">
              <img
                src={product.image}
                alt={product.name}
                className="absolute inset-0 size-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/20" />
              <button
                type="button"
                onClick={onBack}
                className={`absolute left-5 top-5 flex min-h-14 items-center gap-3 rounded-2xl border border-border bg-card/90 px-5 text-base font-bold text-foreground backdrop-blur transition hover:border-primary/60 hover:text-primary active:scale-95 ${focusRing}`}
              >
                <ArrowLeft aria-hidden="true" className="size-5" />
                Back
              </button>
              {product.label && (
                <ProductLabelBadge
                  label={product.label}
                  className="absolute right-5 top-5"
                />
              )}
            </div>
          </section>

          <section
            aria-labelledby="product-details-heading"
            className="flex flex-col gap-6 rounded-3xl border border-border bg-card p-6 shadow-2xl shadow-black/10"
          >
            <div>
              <p className="mb-3 w-fit rounded-full border border-secondary/50 bg-secondary/15 px-4 py-2 text-sm font-bold uppercase tracking-[0.14em] text-secondary">
                Product details
              </p>
              <h1
                id="product-details-heading"
                className="text-5xl font-bold leading-tight text-foreground"
              >
                {product.name}
              </h1>
              <p className="mt-4 text-xl leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <ProductFact label="Price">
                <Price cents={product.priceCents} />
              </ProductFact>
              <ProductFact label="Energy">{product.kcal} kcal</ProductFact>
              <ProductFact label="Portion">{product.portionGrams} g</ProductFact>
            </div>

            <div className="rounded-3xl border border-border bg-background/50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Quantity
                  </h2>
                  <p className="mt-1 text-base text-muted-foreground">
                    Choose how many to add to your order.
                  </p>
                </div>

                <div className="flex items-center rounded-3xl border border-border bg-card p-2">
                  <button
                    type="button"
                    onClick={decreaseQuantity}
                    aria-label="Decrease quantity"
                    className={`flex size-14 items-center justify-center rounded-2xl text-foreground transition hover:bg-muted active:scale-95 ${focusRing}`}
                  >
                    <Minus aria-hidden="true" className="size-6" />
                  </button>
                  <span
                    className="grid min-w-16 place-items-center text-3xl font-black text-foreground"
                    aria-live="polite"
                  >
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={increaseQuantity}
                    aria-label="Increase quantity"
                    className={`flex size-14 items-center justify-center rounded-2xl text-foreground transition hover:bg-muted active:scale-95 ${focusRing}`}
                  >
                    <Plus aria-hidden="true" className="size-6" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-auto grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
              <div>
                <p className="text-base font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Total
                </p>
                <Price
                  cents={totalCents}
                  className="text-4xl font-black text-foreground"
                />
              </div>
              <button
                type="button"
                onClick={handleAddToOrder}
                className={`flex min-h-20 items-center justify-center gap-3 rounded-3xl border border-primary/60 bg-primary px-8 text-xl font-black text-primary-foreground shadow-xl shadow-primary/25 transition hover:bg-primary/90 active:scale-95 ${focusRing}`}
              >
                <ShoppingCart aria-hidden="true" className="size-7" />
                Add to order
              </button>
            </div>
          </section>
        </div>
      </main>

      <OrderFooter items={cartItems} summary={cartSummary} />
    </KioskShell>
  );
}

interface ProductFactProps {
  children: ReactNode;
  label: string;
}

function ProductFact({ children, label }: ProductFactProps) {
  return (
    <div className="rounded-2xl border border-border bg-background/50 p-4">
      <p className="text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-foreground">{children}</p>
    </div>
  );
}
