import {
  Cake,
  Coffee,
  IceCream,
  Sandwich,
  ShoppingCart,
  Soup,
  UtensilsCrossed,
  Wine,
  type LucideIcon,
} from "lucide-react";

export type OrderMode = "dine-in" | "take-out";
export type Screen = "welcome" | "menu";

export type CategoryId =
  | "popular"
  | "meals"
  | "sandwiches"
  | "bakery"
  | "coffee"
  | "drinks"
  | "desserts"
  | "sides";

export type ProductLabel = "Popular" | "New" | "Vegetarian";

export interface Product {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  category: CategoryId;
  image: string;
  label?: ProductLabel;
}

export interface Category {
  id: CategoryId;
  label: string;
  icon: LucideIcon;
  banner?: string;
  bannerTagline?: string;
}

export const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Classic Burger Meal",
    description: "Beef patty, lettuce, tomato, cheese with fries",
    priceCents: 1299,
    category: "meals",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop",
    label: "Popular",
  },
  {
    id: "2",
    name: "Grilled Chicken Sandwich",
    description: "Grilled chicken breast with fresh vegetables",
    priceCents: 999,
    category: "sandwiches",
    image:
      "https://images.unsplash.com/photo-1619740455993-8c891b3c69ca?w=400&h=400&fit=crop",
  },
  {
    id: "3",
    name: "Cappuccino",
    description: "Rich espresso with steamed milk foam",
    priceCents: 499,
    category: "coffee",
    image:
      "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=400&fit=crop",
    label: "Popular",
  },
  {
    id: "4",
    name: "Chocolate Croissant",
    description: "Buttery pastry with dark chocolate filling",
    priceCents: 399,
    category: "bakery",
    image:
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=400&fit=crop",
    label: "New",
  },
  {
    id: "5",
    name: "Fresh Orange Juice",
    description: "100% freshly squeezed orange juice",
    priceCents: 599,
    category: "drinks",
    image:
      "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop",
  },
  {
    id: "6",
    name: "Tiramisu",
    description: "Classic Italian coffee-flavored dessert",
    priceCents: 699,
    category: "desserts",
    image:
      "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=400&fit=crop",
    label: "Popular",
  },
  {
    id: "7",
    name: "French Fries",
    description: "Crispy golden fries with sea salt",
    priceCents: 399,
    category: "sides",
    image:
      "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop",
  },
  {
    id: "8",
    name: "Caesar Salad",
    description: "Romaine lettuce, parmesan, croutons, caesar dressing",
    priceCents: 899,
    category: "meals",
    image:
      "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=400&fit=crop",
    label: "Vegetarian",
  },
  {
    id: "9",
    name: "Latte",
    description: "Espresso with steamed milk",
    priceCents: 449,
    category: "coffee",
    image:
      "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop",
  },
  {
    id: "10",
    name: "Blueberry Muffin",
    description: "Moist muffin loaded with fresh blueberries",
    priceCents: 349,
    category: "bakery",
    image:
      "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400&h=400&fit=crop",
  },
  {
    id: "11",
    name: "Iced Tea",
    description: "Refreshing iced tea with lemon",
    priceCents: 299,
    category: "drinks",
    image:
      "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop",
  },
  {
    id: "12",
    name: "Ice Cream Sundae",
    description: "Vanilla ice cream with chocolate sauce and nuts",
    priceCents: 549,
    category: "desserts",
    image:
      "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=400&fit=crop",
  },
];

export const CATEGORIES: Category[] = [
  { id: "popular", label: "Popular", icon: ShoppingCart },
  {
    id: "meals",
    label: "Meals",
    icon: Soup,
    banner:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1400&h=400&fit=crop",
    bannerTagline: "Hearty plates crafted fresh every day",
  },
  {
    id: "sandwiches",
    label: "Sandwiches",
    icon: Sandwich,
    banner:
      "https://images.unsplash.com/photo-1481070414801-51fd732d7184?w=1400&h=400&fit=crop",
    bannerTagline: "Stacked, toasted, and ready to go",
  },
  {
    id: "bakery",
    label: "Bakery",
    icon: Cake,
    banner:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1400&h=400&fit=crop",
    bannerTagline: "Baked fresh every morning",
  },
  {
    id: "coffee",
    label: "Coffee",
    icon: Coffee,
    banner:
      "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1400&h=400&fit=crop",
    bannerTagline: "Your perfect cup awaits",
  },
  { id: "drinks", label: "Drinks", icon: Wine },
  {
    id: "desserts",
    label: "Desserts",
    icon: IceCream,
    banner:
      "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=1400&h=400&fit=crop",
    bannerTagline: "Sweet endings worth every bite",
  },
  { id: "sides", label: "Sides", icon: UtensilsCrossed },
];
