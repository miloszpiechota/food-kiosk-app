import { useEffect, useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import type { Product } from "../types/menu.types";
import { focusRing } from "../../../shared/components/IconButton";
import { Price } from "../../../shared/components/Price";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [isAddConfirmed, setIsAddConfirmed] = useState(false);
  const confirmationTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      window.clearTimeout(confirmationTimeoutRef.current);
    };
  }, []);

  function handleAddToCart() {
    onAddToCart(product);
    setIsAddConfirmed(true);
    window.clearTimeout(confirmationTimeoutRef.current);
    confirmationTimeoutRef.current = window.setTimeout(() => {
      setIsAddConfirmed(false);
    }, 700);
  }

  return (
    <article className="group overflow-hidden rounded-3xl border border-border bg-card shadow-lg shadow-black/10 transition hover:border-primary/40">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="size-full object-cover transition duration-300 group-hover:scale-105"
        />
        {product.label && (
          <span
            className={`absolute right-3 top-3 rounded-full px-3 py-1 text-sm font-bold ${
              product.label === "Popular"
                ? "bg-primary text-primary-foreground"
                : product.label === "New"
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-emerald-600 text-white"
            }`}
          >
            {product.label}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 border-b border-border bg-background/45 px-5 py-3 text-sm font-bold text-muted-foreground">
        <span className="rounded-full border border-border bg-card px-3 py-1">
          {product.kcal} kcal
        </span>
        <span className="rounded-full border border-border bg-card px-3 py-1">
          {product.portionGrams} g
        </span>
      </div>

      <div className="flex min-h-56 flex-col gap-4 p-5">
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-semibold leading-tight text-foreground">
            {product.name}
          </h3>
          <p className="mt-2 line-clamp-2 text-base text-muted-foreground">
            {product.description}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <Price
            cents={product.priceCents}
            className="shrink-0 text-2xl font-bold text-foreground"
          />
          <button
            type="button"
            onClick={handleAddToCart}
            aria-label={`Add ${product.name} to cart`}
            className={`relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary text-primary-foreground transition duration-200 hover:bg-primary/90 active:scale-95 ${
              isAddConfirmed ? "scale-105 shadow-lg shadow-primary/30" : ""
            } ${focusRing}`}
          >
            {isAddConfirmed && (
              <span
                aria-hidden="true"
                className="absolute inset-1 rounded-2xl bg-primary-foreground/20 animate-ping"
              />
            )}
            {isAddConfirmed ? (
              <Check aria-hidden="true" className="relative size-7" />
            ) : (
              <Plus aria-hidden="true" className="relative size-7" />
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
