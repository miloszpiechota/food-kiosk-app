export type CategoryId =
  | "featured"
  | "popular"
  | "meals"
  | "sandwiches"
  | "bakery"
  | "coffee"
  | "drinks"
  | "desserts"
  | "sides";

export type ProductLabel = "Popular" | "New" | "Vegetarian";
export type QuickFilterLabel =
  | "Plant Based"
  | "Gluten Free"
  | "Popular"
  | "New"
  | "No sugar";

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
  name: string;
  description: string;
  priceCents: number;
  kcal: number;
  portionGrams: number;
  category: CategoryId;
  image: string;
  label?: ProductLabel;
}

export interface MenuCategory {
  id: CategoryId;
  label: string;
  icon: CategoryIcon;
  banner?: string;
  bannerTagline?: string;
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
