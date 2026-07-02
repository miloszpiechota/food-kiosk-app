import { useRef, useState } from "react";
import { WelcomePage } from "../pages/WelcomePage/WelcomePage";
import { MenuPage } from "../pages/MenuPage/MenuPage";
import { ProductDetailsPage } from "../pages/ProductDetailsPage/ProductDetailsPage";
import { BasketReviewPage } from "../pages/BasketReviewPage/BasketReviewPage";
import type { Product } from "../features/menu/types/menu.types";
import type { CartItem } from "../features/cart/types/cart.types";
import {
  addBasketItem,
  createOrderSnapshot,
  createBasket,
  removeBasketItem,
  updateBasketItemQuantity,
  type AddBasketItemRequest,
  type OrderSnapshot,
} from "../features/cart/api/basketApi";
import { useMenu } from "../features/menu/hooks/useMenu";
import type { CategoryId } from "../features/menu/types/menu.types";

type AppRoute = "welcome" | "menu" | "product-details" | "basket-review";
export type OrderMode = "dine-in" | "take-out";

function getOppositeOrderMode(orderMode: OrderMode): OrderMode {
  return orderMode === "dine-in" ? "take-out" : "dine-in";
}

export function AppRouter() {
  const [route, setRoute] = useState<AppRoute>("welcome");
  const [orderMode, setOrderMode] = useState<OrderMode>("dine-in");
  const [activeCategory, setActiveCategory] =
    useState<CategoryId>("featured");
  const [searchTerm, setSearchTerm] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartSummary, setCartSummary] = useState({
    itemCount: 0,
    totalCents: 0,
  });
  const [basketError, setBasketError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const basketIdRef = useRef<string | null>(null);

  const menu = useMenu({ activeCategory, searchTerm });

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

  const handleStartNewOrder = () => {
    basketIdRef.current = null;
    setCartItems([]);
    setCartSummary({
      itemCount: 0,
      totalCents: 0,
    });
    setSelectedProduct(null);
    setBasketError(null);
    setRoute("menu");
  };

  if (route === "welcome") {
    return <WelcomePage onSelectOrderMode={handleOrderModeSelect} />;
  }

  if (route === "product-details" && selectedProduct) {
    return (
      <ProductDetailsPage
        cartItems={cartItems}
        cartSummary={cartSummary}
        orderMode={orderMode}
        product={selectedProduct}
        searchTerm={searchTerm}
        onAddToCart={handleAddRequest}
        onBack={handleProductDetailsClose}
        onOrderModeToggle={handleOrderModeToggle}
        onReviewOrder={handleReviewOrderOpen}
        onSearchChange={setSearchTerm}
      />
    );
  }

  if (route === "basket-review") {
    return (
      <BasketReviewPage
        items={cartItems}
        orderMode={orderMode}
        summary={cartSummary}
        onBack={handleReviewOrderClose}
        onCreateOrderSnapshot={handleCreateOrderSnapshot}
        onOrderModeToggle={handleOrderModeToggle}
        onRemoveItem={handleRemoveBasketItem}
        onStartNewOrder={handleStartNewOrder}
        onUpdateItemQuantity={handleUpdateBasketItemQuantity}
      />
    );
  }

  return (
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
      orderMode={orderMode}
      products={menu.products}
      searchTerm={searchTerm}
      onAddToCart={handleQuickAdd}
      onCategoryChange={setActiveCategory}
      onOrderModeToggle={handleOrderModeToggle}
      onProductDetailsOpen={handleProductDetailsOpen}
      onReviewOrder={handleReviewOrderOpen}
      onSearchChange={setSearchTerm}
    />
  );
}
