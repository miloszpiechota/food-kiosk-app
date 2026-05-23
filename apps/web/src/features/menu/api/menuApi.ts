import type {
  CategoryId,
  FeaturedMenuContent,
  MenuCategory,
  Product,
} from "../types/menu.types";

const MENU_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Classic Burger Meal",
    description: "Beef patty, lettuce, tomato, cheese with fries",
    priceCents: 1299,
    kcal: 920,
    portionGrams: 430,
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
    kcal: 540,
    portionGrams: 280,
    category: "sandwiches",
    image:
      "https://images.unsplash.com/photo-1619740455993-8c891b3c69ca?w=400&h=400&fit=crop",
  },
  {
    id: "3",
    name: "Cappuccino",
    description: "Rich espresso with steamed milk foam",
    priceCents: 499,
    kcal: 120,
    portionGrams: 220,
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
    kcal: 340,
    portionGrams: 95,
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
    kcal: 160,
    portionGrams: 300,
    category: "drinks",
    image:
      "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop",
  },
  {
    id: "6",
    name: "Tiramisu",
    description: "Classic Italian coffee-flavored dessert",
    priceCents: 699,
    kcal: 410,
    portionGrams: 160,
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
    kcal: 390,
    portionGrams: 150,
    category: "sides",
    image:
      "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop",
  },
  {
    id: "8",
    name: "Caesar Salad",
    description: "Romaine lettuce, parmesan, croutons, caesar dressing",
    priceCents: 899,
    kcal: 460,
    portionGrams: 310,
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
    kcal: 150,
    portionGrams: 240,
    category: "coffee",
    image:
      "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop",
  },
  {
    id: "10",
    name: "Blueberry Muffin",
    description: "Moist muffin loaded with fresh blueberries",
    priceCents: 349,
    kcal: 360,
    portionGrams: 115,
    category: "bakery",
    image:
      "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400&h=400&fit=crop",
  },
  {
    id: "11",
    name: "Iced Tea",
    description: "Refreshing iced tea with lemon",
    priceCents: 299,
    kcal: 90,
    portionGrams: 330,
    category: "drinks",
    image:
      "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop",
  },
  {
    id: "12",
    name: "Ice Cream Sundae",
    description: "Vanilla ice cream with chocolate sauce and nuts",
    priceCents: 549,
    kcal: 480,
    portionGrams: 210,
    category: "desserts",
    image:
      "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=400&fit=crop",
  },
  {
    id: "13",
    name: "Green Power Bowl",
    description: "Grains, roasted vegetables, avocado, herbs, and lemon dressing",
    priceCents: 1099,
    kcal: 620,
    portionGrams: 360,
    category: "meals",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop",
    label: "New",
  },
  {
    id: "14",
    name: "Strawberry Matcha Latte",
    description: "Layered matcha, strawberry puree, and chilled oat milk",
    priceCents: 579,
    kcal: 210,
    portionGrams: 320,
    category: "coffee",
    image:
      "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400&h=400&fit=crop",
    label: "New",
  },
  {
    id: "15",
    name: "Lemon Poppy Cake",
    description: "Soft citrus cake slice with light glaze and poppy seeds",
    priceCents: 499,
    kcal: 390,
    portionGrams: 120,
    category: "bakery",
    image:
      "https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=400&h=400&fit=crop",
    label: "New",
  },
];

const MENU_CATEGORIES: MenuCategory[] = [
  { id: "featured", label: "For You", icon: "sparkles" },
  { id: "popular", label: "Popular", icon: "cart" },
  {
    id: "meals",
    label: "Meals",
    icon: "meal",
    banner:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1400&h=400&fit=crop",
    bannerTagline: "Hearty plates crafted fresh every day",
  },
  {
    id: "sandwiches",
    label: "Sandwiches",
    icon: "sandwich",
    banner:
      "https://images.unsplash.com/photo-1481070414801-51fd732d7184?w=1400&h=400&fit=crop",
    bannerTagline: "Stacked, toasted, and ready to go",
  },
  {
    id: "bakery",
    label: "Bakery",
    icon: "bakery",
    banner:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1400&h=400&fit=crop",
    bannerTagline: "Baked fresh every morning",
  },
  {
    id: "coffee",
    label: "Coffee",
    icon: "coffee",
    banner:
      "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1400&h=400&fit=crop",
    bannerTagline: "Your perfect cup awaits",
  },
  { id: "drinks", label: "Drinks", icon: "drink" },
  {
    id: "desserts",
    label: "Desserts",
    icon: "dessert",
    banner:
      "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=1400&h=400&fit=crop",
    bannerTagline: "Sweet endings worth every bite",
  },
  { id: "sides", label: "Sides", icon: "side" },
];

const FEATURED_MENU_CONTENT: FeaturedMenuContent = {
  heroBanner: {
    id: "hero-fresh-picks",
    title: "Fresh picks for today",
    description: "Start with customer favorites, limited specials, and lighter options.",
    image:
      "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1400&h=520&fit=crop",
    tone: "primary",
  },
  secondaryBanners: [
    {
      id: "plant-based",
      title: "Plant based choices",
      description: "Colorful bowls, salads, and meat-free comfort food.",
      image:
        "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=700&h=360&fit=crop",
      tone: "primary",
    },
    {
      id: "sweet-break",
      title: "Something sweet",
      description: "Bakery treats, desserts, and coffee pairings.",
      image:
        "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=700&h=360&fit=crop",
      tone: "secondary",
    },
  ],
  quickFilters: ["Plant Based", "Gluten Free", "Popular", "New", "No sugar"],
  newProducts: [MENU_PRODUCTS[12], MENU_PRODUCTS[13], MENU_PRODUCTS[14]],
  recommendedProducts: [MENU_PRODUCTS[0], MENU_PRODUCTS[2], MENU_PRODUCTS[5]],
};

export function getMenuCategories(): MenuCategory[] {
  return MENU_CATEGORIES;
}

export function getMenuProducts(): Product[] {
  return MENU_PRODUCTS;
}

export function getFeaturedMenuContent(): FeaturedMenuContent {
  return FEATURED_MENU_CONTENT;
}

export function filterMenuProducts(
  products: readonly Product[],
  activeCategory: CategoryId,
  searchTerm: string,
): Product[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return products.filter((product) => {
    const matchesCategory =
      activeCategory === "featured"
        ? product.label === "New" || product.label === "Popular"
        : activeCategory === "popular"
        ? product.label === "Popular"
        : product.category === activeCategory;

    if (!matchesCategory) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    return [product.name, product.description, product.label ?? ""].some(
      (value) => value.toLowerCase().includes(normalizedSearch),
    );
  });
}
