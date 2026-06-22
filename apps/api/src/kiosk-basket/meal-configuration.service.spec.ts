import { UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '../../../../node_modules/@prisma/client/.prisma/client';
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

    expect(() => service.evaluate(createMenuProduct(), request)).toThrow(
      UnprocessableEntityException,
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
