export interface ActiveMenuResponse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  locale: string;
  defaultLocale: string;
  currencyCode: string;
}

export interface MenuCategorySummary {
  menuCategoryId: string;
  categoryId: string;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
}

export interface MenuCategoryListResponse {
  menuId: string;
  locale: string;
  categories: MenuCategorySummary[];
}

export interface MenuProductSummary {
  menuProductId: string;
  productId: string;
  type: string;
  sku: string;
  name: string;
  description: string | null;
  price: string;
  currencyCode: string;
  imageUrl: string | null;
  sortOrder: number;
}

export interface MenuCategoryProductsResponse {
  menuCategoryId: string;
  categoryId: string;
  locale: string;
  products: MenuProductSummary[];
}

export interface ProductGroupOptionResponse {
  id: string;
  productId: string;
  name: string;
  priceAdjustment: string;
  isDefault: boolean;
  sortOrder: number;
}

export interface ProductGroupResponse {
  id: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  selectionMode: string;
  isRequired: boolean;
  sortOrder: number;
  options: ProductGroupOptionResponse[];
}

export interface ProductIngredientResponse {
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

export interface ModifierOptionResponse {
  id: string;
  ingredientId: string | null;
  productIngredientId: string | null;
  name: string | null;
  priceAdjustment: string;
  maxQuantity: number;
  sortOrder: number;
}

export interface ModifierGroupResponse {
  id: string;
  name: string;
  actionType: string;
  selectionType: string;
  minSelections: number;
  maxSelections: number;
  allowQuantity: boolean;
  isRequired: boolean;
  sortOrder: number;
  options: ModifierOptionResponse[];
}

export interface MenuProductDetailResponse extends MenuProductSummary {
  menuId: string;
  menuCategoryId: string;
  categoryId: string;
  locale: string;
  isAvailable: boolean;
  groups: ProductGroupResponse[];
  ingredients: ProductIngredientResponse[];
  modifierGroups: ModifierGroupResponse[];
}
