import {
  Cake,
  Coffee,
  IceCream,
  Sandwich,
  ShoppingCart,
  Soup,
  Sparkles,
  UtensilsCrossed,
  Wine,
  type LucideIcon,
} from "lucide-react";
import type { CategoryId, CategoryIcon, MenuCategory } from "../types/menu.types";
import { focusRing } from "../../../shared/components/IconButton";

const categoryIcons: Record<CategoryIcon, LucideIcon> = {
  bakery: Cake,
  cart: ShoppingCart,
  coffee: Coffee,
  dessert: IceCream,
  drink: Wine,
  meal: Soup,
  sparkles: Sparkles,
  sandwich: Sandwich,
  side: UtensilsCrossed,
};

interface CategoryTabsProps {
  activeCategory: CategoryId;
  categories: MenuCategory[];
  onCategoryChange: (category: CategoryId) => void;
}

export function CategoryTabs({
  activeCategory,
  categories,
  onCategoryChange,
}: CategoryTabsProps) {
  return (
    <aside className="min-h-0 border-b border-border bg-sidebar md:w-60 md:shrink-0 md:border-b-0 md:border-r">
      <nav
        aria-label="Menu categories"
        className="flex gap-2 overflow-x-auto p-3 md:h-full md:flex-col md:overflow-y-auto md:p-4"
      >
        {categories.map((category) => {
          const Icon = categoryIcons[category.icon];
          const isActive = activeCategory === category.id;

          return (
            <button
              key={category.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => onCategoryChange(category.id)}
              className={`flex min-h-16 min-w-36 items-center gap-3 rounded-2xl px-4 text-left transition md:w-full md:min-w-0 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80"
              } ${focusRing}`}
            >
              <Icon aria-hidden="true" className="size-5 shrink-0" />
              <span className="font-semibold">{category.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
