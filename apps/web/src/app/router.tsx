import { useRef, useState } from "react";
import { WelcomePage } from "../pages/WelcomePage/WelcomePage";
import { MenuPage } from "../pages/MenuPage/MenuPage";
import { ProductDetailsPage } from "../pages/ProductDetailsPage/ProductDetailsPage";
import type { Product } from "../features/menu/types/menu.types";
import type { CartItem } from "../features/cart/types/cart.types";
import {
  addBasketItem,
  createBasket,
  type AddBasketItemRequest,
} from "../features/cart/api/basketApi";
import { useMenu } from "../features/menu/hooks/useMenu";
import type { CategoryId } from "../features/menu/types/menu.types";

type AppRoute = "welcome" | "menu" | "product-details";
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
        onSearchChange={setSearchTerm}
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
      onSearchChange={setSearchTerm}
    />
  );
}
