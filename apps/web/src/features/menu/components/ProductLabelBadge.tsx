import type { ProductLabel } from "../types/menu.types";

interface ProductLabelBadgeProps {
  className?: string;
  label: ProductLabel;
}

const labelVariantClasses: Record<ProductLabel, string> = {
  Popular: "product-label--popular",
  New: "product-label--new",
  Vegetarian: "product-label--vegetarian",
};

export function ProductLabelBadge({
  className = "",
  label,
}: ProductLabelBadgeProps) {
  return (
    <span
      className={`product-label ${labelVariantClasses[label]} ${className}`}
    >
      {label}
    </span>
  );
}
