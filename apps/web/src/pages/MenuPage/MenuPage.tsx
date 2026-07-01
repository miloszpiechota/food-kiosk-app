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
  actionError: string | null;
  cartItems: CartItem[];
  cartSummary: CartSummary;
  categories: MenuCategory[];
  error: string | null;
  featuredContent: FeaturedMenuContent | null;
  isLoading: boolean;
  orderMode: OrderMode;
  products: Product[];
  searchTerm: string;
  onAddToCart: (product: Product) => void;
  onCategoryChange: (category: CategoryId) => void;
  onOrderModeToggle: () => void;
  onProductDetailsOpen: (product: Product) => void;
  onSearchChange: (value: string) => void;
}

export function MenuPage({
  activeCategory,
  activeCategoryDetails,
  actionError,
  cartItems,
  cartSummary,
  categories,
  error,
  featuredContent,
  isLoading,
  orderMode,
  products,
  searchTerm,
  onAddToCart,
  onCategoryChange,
  onOrderModeToggle,
  onProductDetailsOpen,
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
        <div className="relative flex min-h-0 flex-1">
          {actionError && (
            <p
              role="alert"
              className="absolute inset-x-4 top-4 z-30 rounded-2xl border border-destructive/60 bg-card p-4 font-semibold text-destructive shadow-xl"
            >
              {actionError}
            </p>
          )}
          {isLoading ? (
            <MenuStatus message="Loading menu…" />
          ) : error ? (
            <MenuStatus message={error} />
          ) : featuredContent ? (
            <ProductGrid
              activeCategory={activeCategoryDetails}
              featuredContent={featuredContent}
              products={products}
              searchTerm={searchTerm}
              onAddToCart={onAddToCart}
              onViewProductDetails={onProductDetailsOpen}
            />
          ) : (
            <MenuStatus message="No active menu is available." />
          )}
        </div>
      </div>

      <OrderFooter items={cartItems} summary={cartSummary} />
    </KioskShell>
  );
}

function MenuStatus({ message }: { message: string }) {
  return (
    <main className="grid min-h-0 flex-1 place-items-center p-8">
      <p className="rounded-3xl border border-border bg-card p-8 text-xl text-foreground">
        {message}
      </p>
    </main>
  );
}
