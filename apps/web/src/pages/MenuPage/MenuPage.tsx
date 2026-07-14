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
import type { SupportedLocale } from "../../shared/i18n/locales";
import { uiText } from "../../shared/i18n/locales";
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
  locale: SupportedLocale;
  orderMode: OrderMode;
  products: Product[];
  searchTerm: string;
  onAddToCart: (product: Product) => void;
  onAccessibilityOpen: () => void;
  onBackToWelcome: () => void;
  onCategoryChange: (category: CategoryId) => void;
  onLocaleChange: (locale: SupportedLocale) => void;
  onOrderModeToggle: () => void;
  onProductDetailsOpen: (product: Product) => void;
  onReviewOrder: () => void;
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
  locale,
  orderMode,
  products,
  searchTerm,
  onAddToCart,
  onAccessibilityOpen,
  onBackToWelcome,
  onCategoryChange,
  onLocaleChange,
  onOrderModeToggle,
  onProductDetailsOpen,
  onReviewOrder,
  onSearchChange,
}: MenuPageProps) {
  const text = uiText[locale].menu;

  return (
    <KioskShell className="flex flex-col">
      <Header
        locale={locale}
        orderMode={orderMode}
        searchTerm={searchTerm}
        onBrandClick={onBackToWelcome}
        onLocaleChange={onLocaleChange}
        onOrderModeToggle={onOrderModeToggle}
        onSearchChange={onSearchChange}
      />

      <div className="kiosk-main-layout flex min-h-0 flex-1 flex-col md:flex-row">
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
            <MenuStatus message={text.loading} />
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
            <MenuStatus message={text.noActiveMenu} />
          )}
        </div>
      </div>

      <OrderFooter
        items={cartItems}
        onAccessibilityOpen={onAccessibilityOpen}
        summary={cartSummary}
        onReviewOrder={onReviewOrder}
      />
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
