import { formatPrice } from "../lib/formatPrice";

interface PriceProps {
  cents: number;
  className?: string;
}

export function Price({ cents, className = "" }: PriceProps) {
  return <span className={className}>{formatPrice(cents)}</span>;
}
