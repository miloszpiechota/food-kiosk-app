export interface AdminMenuProductSummary {
  menuProductId: string;
  productId: string;
  restaurantId: string;
  restaurantName: string;
  categoryName: string;
  type: string;
  sku: string;
  name: string;
  price: string;
  currencyCode: string;
  imageUrl: string | null;
  isVisible: boolean;
  forcedHiddenReason: string | null;
}

export interface AdminMenuProductListResponse {
  products: AdminMenuProductSummary[];
}

export interface AdminMenuVisibilityChange {
  menuProductId?: string;
  isVisible?: boolean;
}

export interface UpdateAdminMenuVisibilityRequest {
  changes?: AdminMenuVisibilityChange[];
}

export interface UpdateAdminMenuVisibilityResponse {
  products: AdminMenuProductSummary[];
  updatedCount: number;
  forcedHiddenMenuProductIds: string[];
}
