export type CategoryId = string;

export type ProductLabel = "Popular" | "New" | "Vegetarian";
export type QuickFilterLabel = string;

export type CategoryIcon =
  | "bakery"
  | "cart"
  | "coffee"
  | "dessert"
  | "drink"
  | "meal"
  | "sparkles"
  | "sandwich"
  | "side";

export interface Product {
  id: string;
  menuProductId: string;
  productId: string;
  type: "ITEM" | "MEAL" | "LARGE_MEAL";
  name: string;
  description: string;
  priceCents: number;
  kcal?: number;
  portionGrams?: number;
  category: CategoryId;
  image: string;
  label: ProductLabel | null;
  hasCustomizations: boolean;
}

export interface MenuCategory {
  id: CategoryId;
  code: string;
  label: string;
  icon: CategoryIcon;
  banner?: string;
  bannerTagline?: string;
}

export interface ProductIngredient {
  id: string;
  ingredientId: string;
  code: string;
  name: string;
  defaultQuantity: number;
  isDefaultIncluded: boolean;
  isRemovable: boolean;
  removePriceAdjustment: string;
  allowExtra: boolean;
  extraUnitPrice: string;
  maxExtraQuantity: number;
  sortOrder: number;
}

export interface ModifierOption {
  id: string;
  ingredientId: string | null;
  productIngredientId: string | null;
  name: string | null;
  priceAdjustment: string;
  maxQuantity: number;
  sortOrder: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  actionType: "ADD" | "REMOVE";
  selectionType: "SINGLE" | "MULTIPLE";
  minSelections: number;
  maxSelections: number;
  allowQuantity: boolean;
  isRequired: boolean;
  sortOrder: number;
  options: ModifierOption[];
}

export interface ProductGroupOption {
  id: string;
  productId: string;
  type: string;
  name: string;
  imageUrl: string | null;
  priceAdjustment: string;
  isInitialSelection: boolean;
  sortOrder: number;
  ingredients: ProductIngredient[];
  modifierGroups: ModifierGroup[];
}

export interface ProductGroup {
  id: string;
  code: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  selectionMode: "SINGLE" | "MULTIPLE";
  isRequired: boolean;
  sortOrder: number;
  options: ProductGroupOption[];
}

export interface MealSizeVariant {
  menuProductId: string;
  productId: string;
  type: "MEAL" | "LARGE_MEAL";
  name: string;
  price: string;
  image: string;
}

export interface ProductDetail extends Product {
  groups: ProductGroup[];
  ingredients: ProductIngredient[];
  modifierGroups: ModifierGroup[];
  regularMeal: MealSizeVariant | null;
  largeMeal: MealSizeVariant | null;
}

export interface FeaturedBanner {
  id: string;
  title: string;
  description: string;
  image: string;
  tone: "primary" | "secondary";
}

export interface FeaturedMenuContent {
  heroBanner: FeaturedBanner;
  secondaryBanners: [FeaturedBanner, FeaturedBanner];
  quickFilters: QuickFilterLabel[];
  newProducts: Product[];
  recommendedProducts: Product[];
}
