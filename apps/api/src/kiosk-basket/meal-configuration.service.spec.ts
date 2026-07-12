import { UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AddBasketItemRequest } from './kiosk-basket.types';
import type { ConfigurableMenuProduct } from './meal-configuration.query';
import { MealConfigurationService } from './meal-configuration.service';

const decimal = (value: string) => new Prisma.Decimal(value);

function createMenuProduct(): ConfigurableMenuProduct {
  return {
    id: 'menu-product-meal',
    menuCategoryId: 'menu-category-meals',
    productId: 'meal-product',
    menuPrice: decimal('20.00'),
    sortOrder: 1,
    isVisible: true,
    createdAt: new Date('2026-06-22T00:00:00.000Z'),
    updatedAt: new Date('2026-06-22T00:00:00.000Z'),
    product: {
      id: 'meal-product',
      restaurantId: 'restaurant-1',
      type: 'MEAL',
      sku: 'meal-test',
      name: 'Test Meal',
      description: null,
      label: null,
      regularMealId: null,
      basePrice: decimal('20.00'),
      imageUrl: null,
      isAvailable: true,
      isStandaloneOrderable: true,
      canBeMealOption: false,
      sortOrder: 1,
      createdAt: new Date('2026-06-22T00:00:00.000Z'),
      updatedAt: new Date('2026-06-22T00:00:00.000Z'),
      modifierGroups: [],
      productGroups: [
        createGroup({
          id: 'group-main',
          code: 'meal-main',
          optionId: 'option-burger',
          optionProductId: 'burger-product',
          optionName: 'Burger',
          priceAdjustment: '0.00',
          modifier: {
            groupId: 'modifier-add',
            optionId: 'modifier-bacon',
            priceAdjustment: '2.50',
          },
        }),
        createGroup({
          id: 'group-side',
          code: 'meal-side',
          optionId: 'option-premium-fries',
          optionProductId: 'fries-product',
          optionName: 'Premium Fries',
          priceAdjustment: '4.00',
        }),
      ],
    },
  };
}

function createStandaloneMenuProduct(input?: {
  menuPrice?: string | null;
  modifierPriceAdjustment?: string;
}): ConfigurableMenuProduct {
  const modifierPriceAdjustment = input?.modifierPriceAdjustment ?? '2.50';

  return {
    id: 'menu-product-item',
    menuCategoryId: 'menu-category-burgers',
    productId: 'item-product',
    menuPrice:
      input?.menuPrice === null ? null : decimal(input?.menuPrice ?? '12.00'),
    sortOrder: 1,
    isVisible: true,
    createdAt: new Date('2026-06-22T00:00:00.000Z'),
    updatedAt: new Date('2026-06-22T00:00:00.000Z'),
    product: {
      id: 'item-product',
      restaurantId: 'restaurant-1',
      type: 'ITEM',
      sku: 'item-test',
      name: 'Test Burger',
      description: null,
      label: null,
      regularMealId: null,
      basePrice: decimal('11.00'),
      imageUrl: null,
      isAvailable: true,
      isStandaloneOrderable: true,
      canBeMealOption: true,
      sortOrder: 1,
      createdAt: new Date('2026-06-22T00:00:00.000Z'),
      updatedAt: new Date('2026-06-22T00:00:00.000Z'),
      productGroups: [],
      modifierGroups: [
        {
          id: 'modifier-item-add',
          productId: 'item-product',
          name: 'Add extras',
          actionType: 'ADD',
          selectionType: 'MULTIPLE',
          minSelections: 0,
          maxSelections: 3,
          allowQuantity: true,
          sortOrder: 1,
          isRequired: false,
          options: [
            {
              id: 'modifier-extra-cheese',
              modifierGroupId: 'modifier-item-add',
              ingredientId: 'ingredient-cheese',
              productIngredientId: null,
              priceAdjustment: decimal(modifierPriceAdjustment),
              maxQuantity: 3,
              sortOrder: 1,
              isAvailable: true,
              ingredient: {
                id: 'ingredient-cheese',
                code: 'cheese',
                name: 'Cheese',
                description: null,
                isActive: true,
                createdAt: new Date('2026-06-22T00:00:00.000Z'),
                updatedAt: new Date('2026-06-22T00:00:00.000Z'),
              },
              productIngredient: null,
            },
          ],
        },
      ],
    },
  };
}

function createGroup(input: {
  id: string;
  code: string;
  optionId: string;
  optionProductId: string;
  optionName: string;
  priceAdjustment: string;
  modifier?: {
    groupId: string;
    optionId: string;
    priceAdjustment: string;
  };
}): ConfigurableMenuProduct['product']['productGroups'][number] {
  const modifierGroups = input.modifier
    ? [
        {
          id: input.modifier.groupId,
          productId: input.optionProductId,
          name: 'Add extras',
          actionType: 'ADD' as const,
          selectionType: 'MULTIPLE' as const,
          minSelections: 0,
          maxSelections: 3,
          allowQuantity: true,
          sortOrder: 1,
          isRequired: false,
          options: [
            {
              id: input.modifier.optionId,
              modifierGroupId: input.modifier.groupId,
              ingredientId: 'ingredient-bacon',
              productIngredientId: null,
              priceAdjustment: decimal(input.modifier.priceAdjustment),
              maxQuantity: 2,
              sortOrder: 1,
              isAvailable: true,
              ingredient: {
                id: 'ingredient-bacon',
                code: 'bacon',
                name: 'Bacon',
                description: null,
                isActive: true,
                createdAt: new Date('2026-06-22T00:00:00.000Z'),
                updatedAt: new Date('2026-06-22T00:00:00.000Z'),
              },
              productIngredient: null,
            },
          ],
        },
      ]
    : [];

  return {
    id: input.id,
    productId: 'meal-product',
    productGroupTemplateId: `${input.id}-template`,
    nameOverride: null,
    minSelections: 1,
    maxSelections: 1,
    selectionMode: 'SINGLE',
    sortOrder: 1,
    isRequired: true,
    productGroupTemplate: {
      id: `${input.id}-template`,
      code: input.code,
      name: input.code,
      defaultMinSelections: 1,
      defaultMaxSelections: 1,
      defaultSelectionMode: 'SINGLE',
      isActive: true,
      createdAt: new Date('2026-06-22T00:00:00.000Z'),
      updatedAt: new Date('2026-06-22T00:00:00.000Z'),
    },
    options: [
      {
        id: input.optionId,
        productGroupId: input.id,
        productId: input.optionProductId,
        priceAdjustment: decimal(input.priceAdjustment),
        sortOrder: 1,
        isAvailable: true,
        product: {
          id: input.optionProductId,
          restaurantId: 'restaurant-1',
          type: 'ITEM',
          sku: input.optionProductId,
          name: input.optionName,
          description: null,
          label: null,
          regularMealId: null,
          basePrice: decimal('10.00'),
          imageUrl: null,
          isAvailable: true,
          isStandaloneOrderable: true,
          canBeMealOption: true,
          sortOrder: 1,
          createdAt: new Date('2026-06-22T00:00:00.000Z'),
          updatedAt: new Date('2026-06-22T00:00:00.000Z'),
          modifierGroups,
        },
      },
    ],
  };
}

function createRequest(): AddBasketItemRequest {
  return {
    menuProductId: 'menu-product-meal',
    quantity: 1,
    groupSelections: [
      {
        productGroupId: 'group-main',
        options: [
          {
            productGroupOptionId: 'option-burger',
            quantity: 1,
            modifierSelections: [
              {
                modifierOptionId: 'modifier-bacon',
                quantity: 1,
              },
            ],
          },
        ],
      },
      {
        productGroupId: 'group-side',
        options: [
          {
            productGroupOptionId: 'option-premium-fries',
            quantity: 1,
          },
        ],
      },
    ],
  };
}

function expectFieldError(
  action: () => void,
  expectedCode: string,
): UnprocessableEntityException {
  let error: unknown;
  try {
    action();
  } catch (caught) {
    error = caught;
  }

  expect(error).toBeInstanceOf(UnprocessableEntityException);
  const exception = error as UnprocessableEntityException;
  const response = exception.getResponse() as {
    fieldErrors?: Array<{ code: string }>;
  };
  expect(response.fieldErrors).toEqual(
    expect.arrayContaining([expect.objectContaining({ code: expectedCode })]),
  );
  return exception;
}

describe('MealConfigurationService', () => {
  const service = new MealConfigurationService();

  it('calculates meal-specific surcharges and nested item modifiers', () => {
    const result = service.evaluate(createMenuProduct(), createRequest());

    expect(result.unitPrice.toString()).toBe('26.5');
    expect(result.snapshot).toMatchObject({
      version: 1,
      productType: 'MEAL',
      basePrice: '20',
      configuredUnitPrice: '26.5',
    });
  });

  it('rejects a meal with a missing required group selection', () => {
    const request = createRequest();
    request.groupSelections = request.groupSelections?.slice(0, 1);

    expectFieldError(
      () => service.evaluate(createMenuProduct(), request),
      'ONE_SELECTION_REQUIRED',
    );
  });

  it('rejects meal options that do not belong to the submitted group', () => {
    const request = createRequest();
    request.groupSelections?.[0]?.options.splice(0, 1, {
      productGroupOptionId: 'option-from-another-group',
      quantity: 1,
    });

    expectFieldError(
      () => service.evaluate(createMenuProduct(), request),
      'OPTION_NOT_IN_GROUP',
    );
  });

  it('rejects duplicate meal-group submissions', () => {
    const request = createRequest();
    request.groupSelections?.push({ ...(request.groupSelections[0] ?? {}) });

    expectFieldError(
      () => service.evaluate(createMenuProduct(), request),
      'DUPLICATE_GROUP',
    );
  });

  it('rejects duplicate nested modifier submissions', () => {
    const request = createRequest();
    const modifierSelections =
      request.groupSelections?.[0]?.options[0]?.modifierSelections ?? [];
    modifierSelections.push({
      modifierOptionId: 'modifier-bacon',
      quantity: 1,
    });

    expectFieldError(
      () => service.evaluate(createMenuProduct(), request),
      'DUPLICATE_MODIFIER',
    );
  });

  it('rejects nested modifier quantities above the allowed maximum', () => {
    const request = createRequest();
    const modifier =
      request.groupSelections?.[0]?.options[0]?.modifierSelections?.[0];
    if (modifier) {
      modifier.quantity = 3;
    }

    expectFieldError(
      () => service.evaluate(createMenuProduct(), request),
      'MODIFIER_QUANTITY_EXCEEDED',
    );
  });

  it('calculates standalone item modifiers from menu price', () => {
    const result = service.evaluate(createStandaloneMenuProduct(), {
      menuProductId: 'menu-product-item',
      quantity: 1,
      modifierSelections: [
        {
          modifierOptionId: 'modifier-extra-cheese',
          quantity: 2,
        },
      ],
    });

    expect(result.unitPrice.toString()).toBe('17');
    expect(result.snapshot).toMatchObject({
      productType: 'ITEM',
      basePrice: '12',
      configuredUnitPrice: '17',
      modifiers: [
        expect.objectContaining({
          modifierOptionId: 'modifier-extra-cheese',
          quantity: 2,
          priceAdjustment: '2.5',
        }),
      ],
    });
  });

  it('rejects meal-group selections for standalone items', () => {
    expectFieldError(
      () =>
        service.evaluate(createStandaloneMenuProduct(), {
          menuProductId: 'menu-product-item',
          quantity: 1,
          groupSelections: createRequest().groupSelections,
        }),
      'GROUPS_NOT_ALLOWED',
    );
  });

  it('rejects configurations that would create a negative final price', () => {
    let error: unknown;
    try {
      service.evaluate(
        createStandaloneMenuProduct({
          menuPrice: '1.00',
          modifierPriceAdjustment: '-2.00',
        }),
        {
          menuProductId: 'menu-product-item',
          quantity: 1,
          modifierSelections: [
            {
              modifierOptionId: 'modifier-extra-cheese',
              quantity: 1,
            },
          ],
        },
      );
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(UnprocessableEntityException);
    expect((error as UnprocessableEntityException).getResponse()).toMatchObject(
      {
        code: 'INVALID_CONFIGURED_PRICE',
      },
    );
  });

  it('creates the same fingerprint regardless of submitted group order', () => {
    const request = createRequest();
    const reversedRequest = {
      ...request,
      groupSelections: [...(request.groupSelections ?? [])].reverse(),
    };

    const first = service.evaluate(createMenuProduct(), request);
    const second = service.evaluate(createMenuProduct(), reversedRequest);

    expect(first.fingerprint).toBe(second.fingerprint);
  });
});
