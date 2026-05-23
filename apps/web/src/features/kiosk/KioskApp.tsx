import { useMemo, useState } from "react";
import {
  Accessibility,
  Languages,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  UtensilsCrossed,
} from "lucide-react";
import {
  CATEGORIES,
  PRODUCTS,
  type Category,
  type CategoryId,
  type OrderMode,
  type Product,
  type Screen,
} from "./kiosk-data";
import {
  addProductToCart,
  formatCurrency,
  getCartSummary,
  getVisibleProducts,
  type CartItem,
} from "./kiosk-state";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40";

export function KioskApp() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [orderMode, setOrderMode] = useState<OrderMode>("dine-in");
  const [activeCategory, setActiveCategory] =
    useState<CategoryId>("popular");
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);

  const activeCategoryDetails =
    CATEGORIES.find((category) => category.id === activeCategory) ??
    CATEGORIES[0];

  const visibleProducts = useMemo(
    () => getVisibleProducts(PRODUCTS, activeCategory, searchTerm),
    [activeCategory, searchTerm],
  );

  const cartSummary = useMemo(() => getCartSummary(cart), [cart]);

  const handleOrderModeSelect = (mode: OrderMode) => {
    setOrderMode(mode);
    setScreen("menu");
  };

  const handleAddToCart = (product: Product) => {
    setCart((currentItems) => addProductToCart(currentItems, product));
  };

  if (screen === "welcome") {
    return <WelcomeScreen onSelectOrderMode={handleOrderModeSelect} />;
  }

  return (
    <MenuScreen
      activeCategory={activeCategory}
      activeCategoryDetails={activeCategoryDetails}
      cartSummary={cartSummary}
      orderMode={orderMode}
      products={visibleProducts}
      searchTerm={searchTerm}
      onAddToCart={handleAddToCart}
      onCategoryChange={setActiveCategory}
      onSearchChange={setSearchTerm}
    />
  );
}

interface WelcomeScreenProps {
  onSelectOrderMode: (mode: OrderMode) => void;
}

function WelcomeScreen({ onSelectOrderMode }: WelcomeScreenProps) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-6 py-10 text-foreground">
      <div className="pointer-events-none absolute -left-24 top-12 size-80 rounded-full bg-primary/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-20 bottom-10 size-96 rounded-full bg-secondary/20 blur-[120px]" />

      <UtilityButtons className="absolute right-6 top-6 sm:right-8 sm:top-8" />

      <section
        aria-labelledby="welcome-heading"
        className="relative z-10 w-full max-w-3xl space-y-12 text-center"
      >
        <div className="space-y-5">
          <p className="mx-auto w-fit rounded-full border border-border bg-card/70 px-5 py-2 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Self-order kiosk
          </p>
          <h1
            id="welcome-heading"
            className="text-6xl font-bold leading-tight text-foreground sm:text-7xl"
          >
            Welcome
          </h1>
          <p className="mx-auto max-w-xl text-2xl font-medium text-muted-foreground">
            Choose how you would like to order
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <OrderModeButton
            accent="primary"
            icon={<UtensilsCrossed aria-hidden="true" className="size-12" />}
            label="Dine in"
            onClick={() => onSelectOrderMode("dine-in")}
          />
          <OrderModeButton
            accent="secondary"
            icon={<ShoppingBag aria-hidden="true" className="size-12" />}
            label="Take out"
            onClick={() => onSelectOrderMode("take-out")}
          />
        </div>
      </section>
    </main>
  );
}

interface OrderModeButtonProps {
  accent: "primary" | "secondary";
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function OrderModeButton({
  accent,
  icon,
  label,
  onClick,
}: OrderModeButtonProps) {
  const accentClass =
    accent === "primary"
      ? "text-primary focus-visible:ring-primary/40"
      : "text-secondary focus-visible:ring-secondary/40";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group min-h-52 rounded-3xl border-2 border-border bg-card/80 p-8 text-left shadow-2xl shadow-black/20 transition hover:-translate-y-1 hover:border-current active:translate-y-0 ${accentClass} ${focusRing}`}
    >
      <span className="flex h-full flex-col items-center justify-center gap-5 text-center">
        <span className="flex size-24 items-center justify-center rounded-full bg-current/15">
          {icon}
        </span>
        <span className="text-3xl font-semibold text-foreground">{label}</span>
      </span>
    </button>
  );
}

interface MenuScreenProps {
  activeCategory: CategoryId;
  activeCategoryDetails: Category;
  cartSummary: { itemCount: number; totalCents: number };
  orderMode: OrderMode;
  products: Product[];
  searchTerm: string;
  onAddToCart: (product: Product) => void;
  onCategoryChange: (category: CategoryId) => void;
  onSearchChange: (value: string) => void;
}

function MenuScreen({
  activeCategory,
  activeCategoryDetails,
  cartSummary,
  orderMode,
  products,
  searchTerm,
  onAddToCart,
  onCategoryChange,
  onSearchChange,
}: MenuScreenProps) {
  return (
    <div className="flex min-h-dvh flex-col overflow-hidden bg-background text-foreground">
      <MenuHeader
        orderMode={orderMode}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
      />

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <CategoryNavigation
          activeCategory={activeCategory}
          onCategoryChange={onCategoryChange}
        />
        <ProductCatalog
          activeCategory={activeCategoryDetails}
          products={products}
          searchTerm={searchTerm}
          onAddToCart={onAddToCart}
        />
      </div>

      <CartBar summary={cartSummary} />
    </div>
  );
}

interface MenuHeaderProps {
  orderMode: OrderMode;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

function MenuHeader({
  orderMode,
  searchTerm,
  onSearchChange,
}: MenuHeaderProps) {
  const orderModeLabel = orderMode === "dine-in" ? "Dine in" : "Take out";

  return (
    <header className="grid gap-4 border-b border-border bg-card/80 px-4 py-4 backdrop-blur-sm sm:px-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">
      <div className="flex min-w-0 items-center gap-4">
        <div
          className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary"
          aria-hidden="true"
        >
          <UtensilsCrossed className="size-7 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold text-foreground">
            Menu
          </h1>
          <p className="text-base text-muted-foreground">{orderModeLabel}</p>
        </div>
      </div>

      <label className="relative block min-w-0 lg:mx-auto lg:w-full lg:max-w-2xl">
        <span className="sr-only">Search menu products</span>
        <Search
          aria-hidden="true"
          className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search menu..."
          className={`h-14 w-full rounded-2xl border border-border bg-input-background pl-12 pr-4 text-lg text-foreground outline-none placeholder:text-muted-foreground ${focusRing}`}
        />
      </label>

      <UtilityButtons className="justify-self-end" />
    </header>
  );
}

interface UtilityButtonsProps {
  className?: string;
}

function UtilityButtons({ className = "" }: UtilityButtonsProps) {
  return (
    <div className={`flex gap-3 ${className}`}>
      <IconButton label="Change language">
        <Languages aria-hidden="true" className="size-6" />
      </IconButton>
      <IconButton label="Accessibility options">
        <Accessibility aria-hidden="true" className="size-6" />
      </IconButton>
    </div>
  );
}

interface IconButtonProps {
  children: React.ReactNode;
  label: string;
}

function IconButton({ children, label }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`flex size-14 items-center justify-center rounded-2xl border border-border bg-card/80 text-muted-foreground transition hover:border-primary/60 hover:text-foreground active:scale-95 ${focusRing}`}
    >
      {children}
    </button>
  );
}

interface CategoryNavigationProps {
  activeCategory: CategoryId;
  onCategoryChange: (category: CategoryId) => void;
}

function CategoryNavigation({
  activeCategory,
  onCategoryChange,
}: CategoryNavigationProps) {
  return (
    <aside className="border-b border-border bg-sidebar md:w-60 md:shrink-0 md:border-b-0 md:border-r">
      <nav
        aria-label="Menu categories"
        className="flex gap-2 overflow-x-auto p-3 md:max-h-[calc(100dvh-10rem)] md:flex-col md:overflow-y-auto md:p-4"
      >
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
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

interface ProductCatalogProps {
  activeCategory: Category;
  products: Product[];
  searchTerm: string;
  onAddToCart: (product: Product) => void;
}

function ProductCatalog({
  activeCategory,
  products,
  searchTerm,
  onAddToCart,
}: ProductCatalogProps) {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto pb-32">
      <CategoryBanner category={activeCategory} />

      <section
        aria-labelledby="product-grid-heading"
        className="grid grid-cols-1 gap-5 p-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
      >
        <h2 id="product-grid-heading" className="sr-only">
          {activeCategory.label} products
        </h2>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
          />
        ))}
      </section>

      {products.length === 0 && (
        <EmptyProductsState
          categoryLabel={activeCategory.label}
          searchTerm={searchTerm}
        />
      )}
    </main>
  );
}

interface CategoryBannerProps {
  category: Category;
}

function CategoryBanner({ category }: CategoryBannerProps) {
  if (!category.banner) {
    return (
      <div className="border-b border-border px-4 py-6 sm:px-6">
        <h2 className="text-3xl font-bold text-foreground">{category.label}</h2>
        <p className="mt-1 text-base text-muted-foreground">
          Customer favorites and quick picks
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-44 overflow-hidden border-b border-border sm:h-52">
      <img
        src={category.banner}
        alt=""
        aria-hidden="true"
        className="size-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10" />
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
        <h2 className="text-4xl font-bold text-foreground">
          {category.label}
        </h2>
        {category.bannerTagline && (
          <p className="mt-1 text-base text-muted-foreground">
            {category.bannerTagline}
          </p>
        )}
      </div>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-border bg-card shadow-lg shadow-black/10 transition hover:border-primary/40">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="size-full object-cover transition duration-300 group-hover:scale-105"
        />
        {product.label && <ProductBadge label={product.label} />}
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
          <span className="shrink-0 text-2xl font-bold text-foreground">
            {formatCurrency(product.priceCents)}
          </span>
          <button
            type="button"
            onClick={() => onAddToCart(product)}
            aria-label={`Add ${product.name} to cart`}
            className={`flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground transition hover:bg-primary/90 active:scale-95 ${focusRing}`}
          >
            <Plus aria-hidden="true" className="size-7" />
          </button>
        </div>
      </div>
    </article>
  );
}

interface ProductBadgeProps {
  label: Product["label"];
}

function ProductBadge({ label }: ProductBadgeProps) {
  if (!label) {
    return null;
  }

  const className =
    label === "Popular"
      ? "bg-primary text-primary-foreground"
      : label === "New"
        ? "bg-secondary text-secondary-foreground"
        : "bg-emerald-600 text-white";

  return (
    <span
      className={`absolute right-3 top-3 rounded-full px-3 py-1 text-sm font-bold ${className}`}
    >
      {label}
    </span>
  );
}

interface EmptyProductsStateProps {
  categoryLabel: string;
  searchTerm: string;
}

function EmptyProductsState({
  categoryLabel,
  searchTerm,
}: EmptyProductsStateProps) {
  return (
    <div className="mx-4 mb-32 rounded-3xl border border-border bg-card p-8 text-center text-muted-foreground">
      <p className="text-xl font-semibold text-foreground">No products found</p>
      <p className="mt-2">
        {searchTerm.trim()
          ? `No ${categoryLabel.toLowerCase()} items match "${searchTerm}".`
          : `No ${categoryLabel.toLowerCase()} items are available yet.`}
      </p>
    </div>
  );
}

interface CartBarProps {
  summary: { itemCount: number; totalCents: number };
}

function CartBar({ summary }: CartBarProps) {
  const hasItems = summary.itemCount > 0;

  return (
    <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 px-4 py-3 backdrop-blur-lg">
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <IconButton label="Accessibility options">
            <Accessibility aria-hidden="true" className="size-6" />
          </IconButton>

          {hasItems ? (
            <div className="flex items-center gap-3">
              <div className="relative" aria-hidden="true">
                <ShoppingCart className="size-8 text-primary" />
                <span className="absolute -right-3 -top-3 flex size-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {summary.itemCount}
                </span>
              </div>
              <div>
                <p className="text-base text-muted-foreground">
                  {summary.itemCount}{" "}
                  {summary.itemCount === 1 ? "item" : "items"}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(summary.totalCents)}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-muted-foreground">
              <ShoppingCart aria-hidden="true" className="size-8" />
              <p className="text-lg">Your cart is empty</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
          <button
            type="button"
            disabled={!hasItems}
            aria-disabled={!hasItems}
            className={`min-h-14 rounded-2xl bg-muted px-6 text-base font-semibold text-foreground transition enabled:hover:bg-muted/80 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 ${focusRing}`}
          >
            View Order
          </button>
          <button
            type="button"
            disabled={!hasItems}
            aria-disabled={!hasItems}
            className={`min-h-14 rounded-2xl bg-gradient-to-r from-primary to-secondary px-8 text-base font-semibold text-white transition enabled:hover:shadow-xl enabled:hover:shadow-primary/25 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 ${focusRing}`}
          >
            Checkout
          </button>
        </div>
      </div>
    </footer>
  );
}
