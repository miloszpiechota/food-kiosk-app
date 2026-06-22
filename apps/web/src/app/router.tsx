import { useMemo, useState } from "react";
import { WelcomePage } from "../pages/WelcomePage/WelcomePage";
import { MenuPage } from "../pages/MenuPage/MenuPage";
import { ProductDetailsPage } from "../pages/ProductDetailsPage/ProductDetailsPage";
import type { Product } from "../features/menu/types/menu.types";
import type { CartItem } from "../features/cart/types/cart.types";
import {
  addProductToCart,
  getCartSummary,
} from "../features/cart/store/cart.store";
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const menu = useMenu({ activeCategory, searchTerm });
  const cartSummary = useMemo(() => getCartSummary(cartItems), [cartItems]);

  const handleOrderModeSelect = (mode: OrderMode) => {
    setOrderMode(mode);
    setRoute("menu");
  };

  const handleAddToCart = (product: Product, quantity = 1) => {
    setCartItems((currentItems) =>
      addProductToCart(currentItems, product, quantity),
    );
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
        onAddToCart={handleAddToCart}
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
      orderMode={orderMode}
      products={menu.products}
      searchTerm={searchTerm}
      onAddToCart={handleAddToCart}
      onCategoryChange={setActiveCategory}
      onOrderModeToggle={handleOrderModeToggle}
      onProductDetailsOpen={handleProductDetailsOpen}
      onSearchChange={setSearchTerm}
    />
  );
}
