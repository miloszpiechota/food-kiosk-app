import { useMemo, useState } from "react";
import { WelcomePage } from "../pages/WelcomePage/WelcomePage";
import { MenuPage } from "../pages/MenuPage/MenuPage";
import type { Product } from "../features/menu/types/menu.types";
import type { CartItem } from "../features/cart/types/cart.types";
import {
  addProductToCart,
  getCartSummary,
} from "../features/cart/store/cart.store";
import { useMenu } from "../features/menu/hooks/useMenu";
import type { CategoryId } from "../features/menu/types/menu.types";

type AppRoute = "welcome" | "menu";
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

  const menu = useMenu({ activeCategory, searchTerm });
  const cartSummary = useMemo(() => getCartSummary(cartItems), [cartItems]);

  const handleOrderModeSelect = (mode: OrderMode) => {
    setOrderMode(mode);
    setRoute("menu");
  };

  const handleAddToCart = (product: Product) => {
    setCartItems((currentItems) => addProductToCart(currentItems, product));
  };

  const handleOrderModeToggle = () => {
    setOrderMode((currentMode) => getOppositeOrderMode(currentMode));
  };

  if (route === "welcome") {
    return <WelcomePage onSelectOrderMode={handleOrderModeSelect} />;
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
      onSearchChange={setSearchTerm}
    />
  );
}
