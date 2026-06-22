export interface CreateBasketRequest {
  sessionId?: string;
}

export interface ModifierSelectionRequest {
  modifierOptionId: string;
  quantity: number;
}

export interface GroupOptionSelectionRequest {
  productGroupOptionId: string;
  quantity: number;
  modifierSelections?: ModifierSelectionRequest[];
}

export interface GroupSelectionRequest {
  productGroupId: string;
  options: GroupOptionSelectionRequest[];
}

export interface AddBasketItemRequest {
  menuProductId: string;
  quantity: number;
  groupSelections?: GroupSelectionRequest[];
  modifierSelections?: ModifierSelectionRequest[];
}

export interface BasketItemResponse {
  id: string;
  menuProductId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  configuration: unknown;
}

export interface BasketResponse {
  id: string;
  sessionId: string;
  status: string;
  subtotalAmount: string;
  items: BasketItemResponse[];
}

export interface MealConfigurationFieldError {
  path: string;
  code: string;
  message: string;
}
