import type { OrderMode } from "../../app/router";
import { OrderFooter } from "../../features/cart/components/OrderFooter";
import type { CartItem, CartSummary } from "../../features/cart/types/cart.types";
import { CategoryTabs } from "../../features/menu/components/CategoryTabs";
import { ProductGrid } from "../../features/menu/components/ProductGrid";
import type {
  CategoryId,
  FeaturedMenuContent,
  MenuCategory,
  Product,
} from "../../features/menu/types/menu.types";
import { Header } from "../../shared/layout/Header";
import { KioskShell } from "../../shared/layout/KioskShell";

interface MenuPageProps {
  activeCategory: CategoryId;
  activeCategoryDetails: MenuCategory;
  cartItems: CartItem[];
  cartSummary: CartSummary;
  categories: MenuCategory[];
  featuredContent: FeaturedMenuContent;
  orderMode: OrderMode;
  products: Product[];
  searchTerm: string;
  onAddToCart: (product: Product) => void;
  onCategoryChange: (category: CategoryId) => void;
  onOrderModeToggle: () => void;
  onSearchChange: (value: string) => void;
}

export function MenuPage({
  activeCategory,
  activeCategoryDetails,
  cartItems,
  cartSummary,
  categories,
  featuredContent,
  orderMode,
  products,
  searchTerm,
  onAddToCart,
  onCategoryChange,
  onOrderModeToggle,
  onSearchChange,
}: MenuPageProps) {
  return (
    <KioskShell className="flex flex-col">
      <Header
        orderMode={orderMode}
        searchTerm={searchTerm}
        onOrderModeToggle={onOrderModeToggle}
        onSearchChange={onSearchChange}
      />

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <CategoryTabs
          activeCategory={activeCategory}
          categories={categories}
          onCategoryChange={onCategoryChange}
        />
        <ProductGrid
          activeCategory={activeCategoryDetails}
          featuredContent={featuredContent}
          products={products}
          searchTerm={searchTerm}
          onAddToCart={onAddToCart}
        />
      </div>

      <OrderFooter items={cartItems} summary={cartSummary} />
    </KioskShell>
  );
}
