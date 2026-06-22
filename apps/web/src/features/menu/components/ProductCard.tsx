import { useEffect, useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import type { Product } from "../types/menu.types";
import { focusRing } from "../../../shared/components/IconButton";
import { Price } from "../../../shared/components/Price";
import { ProductLabelBadge } from "./ProductLabelBadge";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

export function ProductCard({
  product,
  onAddToCart,
  onViewDetails,
}: ProductCardProps) {
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
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-lg shadow-black/10 transition hover:border-primary/40">
      <button
        type="button"
        onClick={() => onViewDetails(product)}
        aria-label={`View details for ${product.name}`}
        className={`absolute inset-0 z-10 rounded-3xl ${focusRing}`}
      />

      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="size-full object-cover transition duration-300 group-hover:scale-105"
        />
        {product.label && (
          <ProductLabelBadge
            label={product.label}
            className="absolute right-3 top-3"
          />
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

      <div className="flex h-40 shrink-0 flex-col p-5">
        <div className="min-w-0">
          <h3 className="line-clamp-2 min-h-12 text-xl font-semibold leading-6 text-foreground">
            {product.name}
          </h3>
        </div>

        <div className="mt-auto flex items-center justify-between gap-4">
          <Price
            cents={product.priceCents}
            className="shrink-0 text-2xl font-bold text-foreground"
          />
          <button
            type="button"
            onClick={handleAddToCart}
            aria-label={`Add ${product.name} to cart`}
            className={`relative z-20 flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary text-primary-foreground transition duration-200 hover:bg-primary/90 active:scale-95 ${
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
