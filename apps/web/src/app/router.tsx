import { useEffect, useRef, useState, type ReactNode } from "react";
import { WelcomePage } from "../pages/WelcomePage/WelcomePage";
import { MenuPage } from "../pages/MenuPage/MenuPage";
import { ProductDetailsPage } from "../pages/ProductDetailsPage/ProductDetailsPage";
import { BasketReviewPage } from "../pages/BasketReviewPage/BasketReviewPage";
import {
  PaymentResultPage,
  type CheckoutReturnStatus,
} from "../pages/PaymentResultPage/PaymentResultPage";
import {
  defaultLocale,
  type SupportedLocale,
} from "../shared/i18n/locales";
import { AccessibilitySheet } from "../features/accessibility/components/AccessibilitySheet";
import {
  defaultAccessibilitySettings,
  type AccessibilitySettings,
} from "../features/accessibility/accessibility.types";
import type { Product } from "../features/menu/types/menu.types";
import type { CartItem } from "../features/cart/types/cart.types";
import {
  addBasketItem,
  createOrderSnapshot,
  createCheckoutSession,
  createBasket,
  getOrderSnapshot,
  removeBasketItem,
  updateBasketItemQuantity,
  type AddBasketItemRequest,
  type CheckoutSession,
  type OrderSnapshot,
} from "../features/cart/api/basketApi";
import { useMenu } from "../features/menu/hooks/useMenu";
import type { CategoryId } from "../features/menu/types/menu.types";

type AppRoute =
  | "welcome"
  | "menu"
  | "product-details"
  | "basket-review"
  | "payment-result";
export type OrderMode = "dine-in" | "take-out";

interface PaymentReturnState {
  checkoutStatus: CheckoutReturnStatus;
  orderId: string;
}

function getOppositeOrderMode(orderMode: OrderMode): OrderMode {
  return orderMode === "dine-in" ? "take-out" : "dine-in";
}

function readPaymentReturnState(): PaymentReturnState | null {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("orderId");
  const checkoutStatus = params.get("checkout");

  if (!orderId) {
    return null;
  }

  return {
    orderId,
    checkoutStatus:
      checkoutStatus === "success" || checkoutStatus === "cancelled"
        ? checkoutStatus
        : "unknown",
  };
}

function clearPaymentReturnUrl() {
  window.history.replaceState(null, "", window.location.pathname || "/");
}

export function AppRouter() {
  const [paymentReturnState, setPaymentReturnState] =
    useState<PaymentReturnState | null>(readPaymentReturnState);
  const [route, setRoute] = useState<AppRoute>(
    paymentReturnState ? "payment-result" : "welcome",
  );
  const [orderMode, setOrderMode] = useState<OrderMode>("dine-in");
  const [locale, setLocale] = useState<SupportedLocale>(defaultLocale);
  const [accessibilitySettings, setAccessibilitySettings] =
    useState<AccessibilitySettings>(defaultAccessibilitySettings);
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryId>("featured");
  const [searchTerm, setSearchTerm] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartSummary, setCartSummary] = useState({
    itemCount: 0,
    totalCents: 0,
  });
  const [basketError, setBasketError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const basketIdRef = useRef<string | null>(null);

  const menu = useMenu({ activeCategory, locale, searchTerm });
  const accessibilityClassName = [
    accessibilitySettings.highContrast ? "a11y-high-contrast" : "",
    accessibilitySettings.largeText ? "a11y-large-text" : "",
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("a11y-high-contrast", accessibilitySettings.highContrast);
    root.classList.toggle("a11y-large-text", accessibilitySettings.largeText);

    return () => {
      root.classList.remove(
        "a11y-high-contrast",
        "a11y-large-text",
      );
    };
  }, [accessibilitySettings]);

  function renderWithAccessibility(page: ReactNode) {
    return (
      <div className={accessibilityClassName}>
        {page}
        <AccessibilitySheet
          isOpen={isAccessibilityOpen}
          locale={locale}
          settings={accessibilitySettings}
          onClose={() => setIsAccessibilityOpen(false)}
          onSettingsChange={setAccessibilitySettings}
        />
      </div>
    );
  }

  const handleOrderModeSelect = (mode: OrderMode) => {
    setOrderMode(mode);
    setRoute("menu");
  };

  const ensureBasket = async () => {
    if (basketIdRef.current) {
      return basketIdRef.current;
    }
    const basket = await createBasket();
    basketIdRef.current = basket.id;
    setCartItems(basket.items);
    setCartSummary(basket.summary);
    return basket.id;
  };

  const handleAddRequest = async (request: AddBasketItemRequest) => {
    try {
      const basketId = await ensureBasket();
      const basket = await addBasketItem(basketId, request);
      setCartItems(basket.items);
      setCartSummary(basket.summary);
      setBasketError(null);
    } catch (reason) {
      const message =
        reason instanceof Error
          ? reason.message
          : "The item could not be added.";
      setBasketError(message);
      throw reason;
    }
  };

  const handleQuickAdd = (product: Product) => {
    if (product.hasCustomizations) {
      handleProductDetailsOpen(product);
      return;
    }
    void handleAddRequest({
      menuProductId: product.menuProductId,
      quantity: 1,
    });
  };

  const handleOrderModeToggle = () => {
    setOrderMode((currentMode) => getOppositeOrderMode(currentMode));
  };

  const handleProductDetailsOpen = (product: Product) => {
    setSelectedProduct(product);
    setRoute("product-details");
  };

  const handleProductDetailsClose = () => {
    setRoute("menu");
  };

  const handleReviewOrderOpen = () => {
    setRoute("basket-review");
  };

  const handleReviewOrderClose = () => {
    setRoute("menu");
  };

  const handleBackToWelcome = () => {
    setSelectedProduct(null);
    setSearchTerm("");
    setActiveCategory("featured");
    setRoute("welcome");
  };

  const handleUpdateBasketItemQuantity = async (
    basketItemId: string,
    quantity: number,
  ) => {
    if (!basketIdRef.current) {
      throw new Error("The active basket was not found.");
    }

    const basket = await updateBasketItemQuantity(
      basketIdRef.current,
      basketItemId,
      quantity,
    );
    setCartItems(basket.items);
    setCartSummary(basket.summary);
  };

  const handleRemoveBasketItem = async (basketItemId: string) => {
    if (!basketIdRef.current) {
      throw new Error("The active basket was not found.");
    }

    const basket = await removeBasketItem(basketIdRef.current, basketItemId);
    setCartItems(basket.items);
    setCartSummary(basket.summary);
  };

  const handleCreateOrderSnapshot = async (): Promise<OrderSnapshot> => {
    if (!basketIdRef.current) {
      throw new Error("The active basket was not found.");
    }

    const order = await createOrderSnapshot(basketIdRef.current);
    basketIdRef.current = null;
    return order;
  };

  const handleCreateCheckoutSession = (
    orderId: string,
  ): Promise<CheckoutSession> => createCheckoutSession(orderId);

  const handleStartNewOrder = () => {
    basketIdRef.current = null;
    setCartItems([]);
    setCartSummary({
      itemCount: 0,
      totalCents: 0,
    });
    setSelectedProduct(null);
    setBasketError(null);
    setSearchTerm("");
    setLocale(defaultLocale);
    setActiveCategory("featured");
    setPaymentReturnState(null);
    clearPaymentReturnUrl();
    setRoute("welcome");
  };

  if (route === "payment-result" && paymentReturnState) {
    return renderWithAccessibility(
      <PaymentResultPage
        checkoutStatus={paymentReturnState.checkoutStatus}
        orderId={paymentReturnState.orderId}
        onGetOrder={getOrderSnapshot}
        onStartNewOrder={handleStartNewOrder}
      />,
    );
  }

  if (route === "welcome") {
    return renderWithAccessibility(
      <WelcomePage
        locale={locale}
        onAccessibilityOpen={() => setIsAccessibilityOpen(true)}
        onLocaleChange={setLocale}
        onSelectOrderMode={handleOrderModeSelect}
      />,
    );
  }

  if (route === "product-details" && selectedProduct) {
    return renderWithAccessibility(
      <ProductDetailsPage
        cartItems={cartItems}
        cartSummary={cartSummary}
        locale={locale}
        orderMode={orderMode}
        product={selectedProduct}
        searchTerm={searchTerm}
        onAddToCart={handleAddRequest}
        onAccessibilityOpen={() => setIsAccessibilityOpen(true)}
        onBack={handleProductDetailsClose}
        onBackToWelcome={handleBackToWelcome}
        onLocaleChange={setLocale}
        onOrderModeToggle={handleOrderModeToggle}
        onReviewOrder={handleReviewOrderOpen}
        onSearchChange={setSearchTerm}
      />,
    );
  }

  if (route === "basket-review") {
    return renderWithAccessibility(
      <BasketReviewPage
        items={cartItems}
        orderMode={orderMode}
        summary={cartSummary}
        onBack={handleReviewOrderClose}
        onCreateCheckoutSession={handleCreateCheckoutSession}
        onCreateOrderSnapshot={handleCreateOrderSnapshot}
        onOrderModeToggle={handleOrderModeToggle}
        onRemoveItem={handleRemoveBasketItem}
        onStartNewOrder={handleStartNewOrder}
        onUpdateItemQuantity={handleUpdateBasketItemQuantity}
      />,
    );
  }

  return renderWithAccessibility(
    <MenuPage
      activeCategory={activeCategory}
      activeCategoryDetails={menu.activeCategoryDetails}
      cartItems={cartItems}
      cartSummary={cartSummary}
      categories={menu.categories}
      featuredContent={menu.featuredContent}
      actionError={basketError}
      error={menu.error}
      isLoading={menu.isLoading}
      locale={locale}
      orderMode={orderMode}
      products={menu.products}
      searchTerm={searchTerm}
      onAddToCart={handleQuickAdd}
      onAccessibilityOpen={() => setIsAccessibilityOpen(true)}
      onBackToWelcome={handleBackToWelcome}
      onCategoryChange={setActiveCategory}
      onLocaleChange={setLocale}
      onOrderModeToggle={handleOrderModeToggle}
      onProductDetailsOpen={handleProductDetailsOpen}
      onReviewOrder={handleReviewOrderOpen}
      onSearchChange={setSearchTerm}
    />,
  );
}
