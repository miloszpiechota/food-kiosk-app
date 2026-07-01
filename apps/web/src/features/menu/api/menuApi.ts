import type {
  CategoryIcon,
  FeaturedMenuContent,
  MenuCategory,
  Product,
  ProductDetail,
  ProductLabel,
} from "../types/menu.types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&h=700&fit=crop";

interface ActiveMenuResponse {
  id: string;
  currencyCode: string;
}

interface CategoryResponse {
  menuCategoryId: string;
  categoryId: string;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
}

interface CategoryListResponse {
  categories: CategoryResponse[];
}

interface ProductSummaryResponse {
  menuProductId: string;
  productId: string;
  type: Product["type"];
  name: string;
  description: string | null;
  label: ProductLabel | null;
  price: string;
  imageUrl: string | null;
  hasCustomizations: boolean;
}

interface CategoryProductsResponse {
  products: ProductSummaryResponse[];
}

interface MealSizeVariantResponse {
  menuProductId: string;
  productId: string;
  type: "MEAL" | "LARGE_MEAL";
  name: string;
  price: string;
  imageUrl: string | null;
}

interface CatalogBootstrap {
  categories: MenuCategory[];
  products: Product[];
  featuredContent: FeaturedMenuContent;
}

export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(
    message: string,
    status: number,
    details?: unknown,
  ) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const body = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    const message =
      body &&
      typeof body === "object" &&
      "message" in body &&
      typeof body.message === "string"
        ? body.message
        : "The server could not complete the request.";
    throw new ApiError(message, response.status, body);
  }

  return body as T;
}

function toCents(value: string): number {
  return Math.round(Number(value) * 100);
}

function resolveImage(imageUrl: string | null): string {
  if (!imageUrl) {
    return FALLBACK_IMAGE;
  }
  if (/^https?:\/\//.test(imageUrl)) {
    return imageUrl;
  }
  return FALLBACK_IMAGE;
}

function categoryIcon(code: string): CategoryIcon {
  const normalized = code.toLowerCase();
  if (normalized.includes("burger") || normalized.includes("sandwich")) {
    return "sandwich";
  }
  if (normalized.includes("drink")) return "drink";
  if (normalized.includes("coffee")) return "coffee";
  if (normalized.includes("dessert")) return "dessert";
  if (normalized.includes("bakery")) return "bakery";
  if (normalized.includes("side")) return "side";
  return "meal";
}

function mapProduct(
  product: ProductSummaryResponse,
  categoryId: string,
): Product {
  return {
    id: product.menuProductId,
    menuProductId: product.menuProductId,
    productId: product.productId,
    type: product.type,
    name: product.name,
    description: product.description ?? "",
    priceCents: toCents(product.price),
    category: categoryId,
    image: resolveImage(product.imageUrl),
    label: product.label,
    hasCustomizations: product.hasCustomizations,
  };
}

function mapMealSizeVariant(
  variant: MealSizeVariantResponse | null,
): ProductDetail["regularMeal"] {
  if (!variant) {
    return null;
  }

  return {
    menuProductId: variant.menuProductId,
    productId: variant.productId,
    type: variant.type,
    name: variant.name,
    price: variant.price,
    image: resolveImage(variant.imageUrl),
  };
}

export async function getCatalog(locale = "en"): Promise<CatalogBootstrap> {
  const activeMenu = await request<ActiveMenuResponse>(
    `/api/v1/kiosk/menus/active?locale=${encodeURIComponent(locale)}`,
  );
  const categoryList = await request<CategoryListResponse>(
    `/api/v1/kiosk/menus/${activeMenu.id}/categories?locale=${encodeURIComponent(locale)}`,
  );
  const categoryProducts = await Promise.all(
    categoryList.categories.map(async (category) => ({
      category,
      response: await request<CategoryProductsResponse>(
        `/api/v1/kiosk/menu-categories/${category.menuCategoryId}/products?locale=${encodeURIComponent(locale)}`,
      ),
    })),
  );

  const databaseCategories: MenuCategory[] = categoryProducts.map(
    ({ category }) => ({
      id: category.menuCategoryId,
      code: category.code,
      label: category.name,
      icon: categoryIcon(category.code),
      bannerTagline: category.description ?? undefined,
    }),
  );
  const products = categoryProducts.flatMap(({ category, response }) =>
    response.products.map((product) =>
      mapProduct(product, category.menuCategoryId),
    ),
  );
  const featuredProducts = products.filter(
    (product) => product.label === "New" || product.label === "Popular",
  );
  const featuredSource =
    featuredProducts.length > 0 ? featuredProducts : products;
  const categories: MenuCategory[] = [
    {
      id: "featured",
      code: "featured",
      label: "For You",
      icon: "sparkles",
    },
    ...databaseCategories,
  ];

  return {
    categories,
    products,
    featuredContent: {
      heroBanner: {
        id: "hero-fresh-picks",
        title: "Fresh picks for today",
        description:
          "Start with customer favorites, current meals, and lighter options.",
        image:
          "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1400&h=520&fit=crop",
        tone: "primary",
      },
      secondaryBanners: [
        {
          id: "plant-based",
          title: "Build your meal",
          description: "Choose each included item and customize supported options.",
          image:
            "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=700&h=360&fit=crop",
          tone: "primary",
        },
        {
          id: "meal-upgrades",
          title: "Make it large",
          description: "Linked large meals use their own sides, drinks, and pricing.",
          image:
            "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=700&h=360&fit=crop",
          tone: "secondary",
        },
      ],
      quickFilters: ["Plant Based", "Gluten Free", "Popular", "New", "No sugar"],
      newProducts: featuredSource.slice(0, 3),
      recommendedProducts: featuredSource.slice(3, 6).length
        ? featuredSource.slice(3, 6)
        : products.slice(0, 3),
    },
  };
}

export async function getProductDetail(
  product: Product,
  locale = "en",
): Promise<ProductDetail> {
  const detail = await request<
    Omit<ProductDetail, keyof Product | "regularMeal" | "largeMeal"> &
      ProductSummaryResponse & {
        regularMeal: MealSizeVariantResponse | null;
        largeMeal: MealSizeVariantResponse | null;
      }
  >(
    `/api/v1/kiosk/menu-products/${product.menuProductId}?locale=${encodeURIComponent(locale)}`,
  );

  return {
    ...product,
    menuProductId: detail.menuProductId,
    productId: detail.productId,
    type: detail.type,
    name: detail.name,
    description: detail.description ?? "",
    priceCents: toCents(detail.price),
    image: resolveImage(detail.imageUrl),
    label: detail.label,
    hasCustomizations: detail.hasCustomizations,
    groups: detail.groups,
    ingredients: detail.ingredients,
    modifierGroups: detail.modifierGroups,
    regularMeal: mapMealSizeVariant(detail.regularMeal),
    largeMeal: mapMealSizeVariant(detail.largeMeal),
  };
}

export function filterMenuProducts(
  products: readonly Product[],
  activeCategory: string,
  searchTerm: string,
): Product[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return products.filter((product) => {
    const matchesCategory =
      activeCategory === "featured"
        ? product.label === "New" ||
          product.label === "Popular" ||
          product.type === "MEAL"
        : product.category === activeCategory;

    return (
      matchesCategory &&
      (!normalizedSearch ||
        [product.name, product.description, product.label ?? ""].some((value) =>
          value.toLowerCase().includes(normalizedSearch),
        ))
    );
  });
}
