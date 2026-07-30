import type { Product } from "../types/menu.types";
import { focusRing } from "../../../shared/components/IconButton";
import { Price } from "../../../shared/components/Price";

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
  function handlePress() {
    if (product.hasCustomizations) {
      onViewDetails(product);
      return;
    }

    onAddToCart(product);
  }

  return (
    <article className="group relative flex h-full min-h-100 flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-primary/10">
      <button
        type="button"
        onClick={handlePress}
        aria-label={
          product.hasCustomizations
            ? `Open details for ${product.name}`
            : `Add ${product.name} to order`
        }
        className={`absolute inset-0 z-10 rounded-3xl ${focusRing}`}
      />

      <div className="relative aspect-4/3 overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="size-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>

      <div className="flex min-h-48 shrink-0 flex-col gap-4 p-5">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-xl font-black leading-6 text-foreground">
            {product.name}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground">
            {product.description}
          </p>
        </div>

        {(product.kcal !== undefined || product.portionGrams !== undefined) && (
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            {product.kcal !== undefined && (
              <span className="rounded-full border border-border bg-card px-3 py-1">
                {product.kcal} kcal
              </span>
            )}
            {product.portionGrams !== undefined && (
              <span className="rounded-full border border-border bg-card px-3 py-1">
                {product.portionGrams} g
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-4">
          <Price
            cents={product.priceCents}
            className="shrink-0 text-3xl font-black text-foreground"
          />
        </div>
      </div>
    </article>
  );
}

