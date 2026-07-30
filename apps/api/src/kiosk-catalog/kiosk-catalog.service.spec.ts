import { PrismaService } from '../prisma/prisma.service';
import { KioskCatalogService } from './kiosk-catalog.service';

describe('KioskCatalogService', () => {
  it('maps persisted product labels into menu product responses', async () => {
    const prisma = {
      menuCategory: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'menu-category-1',
          categoryId: 'category-1',
          menu: {
            restaurant: {
              currencyCode: 'PLN',
              defaultLocale: 'en',
            },
          },
          menuProducts: [
            {
              id: 'menu-product-1',
              productId: 'product-1',
              menuPrice: null,
              sortOrder: 1,
              product: {
                id: 'product-1',
                type: 'ITEM',
                sku: 'burger-classic',
                name: 'Classic Burger',
                description: 'Single beef burger.',
                label: 'POPULAR',
                basePrice: { toString: () => '18.90' },
                imageUrl:
                  'https://images.pexels.com/photos/19247565/pexels-photo-19247565.jpeg',
                translations: [],
                _count: {
                  productGroups: 0,
                  modifierGroups: 1,
                },
              },
            },
            {
              id: 'menu-product-2',
              productId: 'product-2',
              menuPrice: null,
              sortOrder: 2,
              product: {
                id: 'product-2',
                type: 'ITEM',
                sku: 'burger-cheese',
                name: 'Cheese Burger',
                description: 'Beef burger with cheese.',
                label: null,
                basePrice: { toString: () => '20.90' },
                imageUrl:
                  'https://images.pexels.com/photos/19247565/pexels-photo-19247565.jpeg',
                translations: [],
                _count: {
                  productGroups: 0,
                  modifierGroups: 0,
                },
              },
            },
          ],
        }),
      },
    };
    const service = new KioskCatalogService(prisma as unknown as PrismaService);

    const response = await service.getMenuCategoryProducts(
      'menu-category-1',
      'en',
    );

    expect(response.products.map((product) => product.label)).toEqual([
      'Popular',
      null,
    ]);
    expect(
      response.products.map((product) => product.hasCustomizations),
    ).toEqual([true, false]);
  });

  it('filters hidden menu products from meal option groups', async () => {
    const visibleOption = {
      id: 'option-visible',
      productId: 'visible-side',
      priceAdjustment: { toString: () => '0' },
      sortOrder: 1,
      product: {
        id: 'visible-side',
        type: 'ITEM',
        name: 'Visible Side',
        imageUrl: null,
        translations: [],
        productIngredients: [],
        modifierGroups: [],
      },
    };
    const hiddenOption = {
      id: 'option-hidden',
      productId: 'hidden-side',
      priceAdjustment: { toString: () => '0' },
      sortOrder: 2,
      product: {
        id: 'hidden-side',
        type: 'ITEM',
        name: 'Hidden Side',
        imageUrl: null,
        translations: [],
        productIngredients: [],
        modifierGroups: [],
      },
    };
    const drinkOption = {
      id: 'option-drink',
      productId: 'visible-drink',
      priceAdjustment: { toString: () => '0' },
      sortOrder: 1,
      product: {
        id: 'visible-drink',
        type: 'ITEM',
        name: 'Visible Drink',
        imageUrl: null,
        translations: [],
        productIngredients: [],
        modifierGroups: [],
      },
    };
    const prisma = {
      menuProduct: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'meal-menu-product',
          productId: 'meal-product',
          menuPrice: { toString: () => '27.90' },
          sortOrder: 1,
          menuCategoryId: 'menu-category-1',
          menuCategory: {
            menuId: 'menu-1',
            categoryId: 'category-1',
            menu: {
              restaurant: {
                currencyCode: 'PLN',
                defaultLocale: 'en',
              },
            },
          },
          product: {
            id: 'meal-product',
            type: 'MEAL',
            sku: 'meal',
            name: 'Meal',
            description: null,
            label: null,
            basePrice: { toString: () => '27.90' },
            imageUrl: null,
            isAvailable: true,
            translations: [],
            productGroups: [
              {
                id: 'group-1',
                minSelections: 1,
                maxSelections: 1,
                selectionMode: 'SINGLE',
                isRequired: true,
                sortOrder: 1,
                nameOverride: null,
                productGroupTemplate: {
                  code: 'side',
                  name: 'Side',
                  translations: [],
                },
                options: [visibleOption, hiddenOption],
              },
              {
                id: 'group-2',
                minSelections: 1,
                maxSelections: 1,
                selectionMode: 'SINGLE',
                isRequired: true,
                sortOrder: 2,
                nameOverride: null,
                productGroupTemplate: {
                  code: 'drink',
                  name: 'Drink',
                  translations: [],
                },
                options: [drinkOption],
              },
            ],
            productIngredients: [],
            modifierGroups: [],
            regularMeal: null,
            largeMealVariant: null,
          },
        }),
        findMany: jest
          .fn()
          .mockResolvedValue([
            { productId: 'visible-side' },
            { productId: 'visible-drink' },
          ]),
      },
    };
    const service = new KioskCatalogService(prisma as unknown as PrismaService);

    const response = await service.getMenuProductDetail(
      'meal-menu-product',
      'en',
    );

    expect(
      response.groups[0].options.map((option) => option.productId),
    ).toEqual(['visible-side']);
    expect(
      response.groups[1].options.map((option) => option.productId),
    ).toEqual(['visible-drink']);
  });

  it('hides meals from menu category lists when a required group has no visible option', async () => {
    const prisma = {
      menuCategory: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'menu-category-1',
          categoryId: 'category-1',
          menu: {
            restaurant: {
              currencyCode: 'PLN',
              defaultLocale: 'en',
            },
          },
          menuProducts: [
            {
              id: 'meal-menu-product',
              productId: 'meal-product',
              menuPrice: null,
              sortOrder: 1,
              product: {
                id: 'meal-product',
                type: 'MEAL',
                sku: 'meal',
                name: 'Meal',
                description: null,
                label: null,
                basePrice: { toString: () => '27.90' },
                imageUrl: null,
                translations: [],
                _count: {
                  productGroups: 2,
                  modifierGroups: 0,
                },
                productGroups: [
                  {
                    minSelections: 1,
                    maxSelections: 1,
                    selectionMode: 'SINGLE',
                    isRequired: true,
                    options: [{ productId: 'hidden-burger' }],
                  },
                  {
                    minSelections: 1,
                    maxSelections: 1,
                    selectionMode: 'SINGLE',
                    isRequired: true,
                    options: [{ productId: 'visible-drink' }],
                  },
                ],
              },
            },
            {
              id: 'drink-menu-product',
              productId: 'visible-drink',
              menuPrice: null,
              sortOrder: 2,
              product: {
                id: 'visible-drink',
                type: 'ITEM',
                sku: 'drink',
                name: 'Drink',
                description: null,
                label: null,
                basePrice: { toString: () => '8.00' },
                imageUrl: null,
                translations: [],
                _count: {
                  productGroups: 0,
                  modifierGroups: 0,
                },
              },
            },
          ],
        }),
      },
    };
    const service = new KioskCatalogService(prisma as unknown as PrismaService);

    const response = await service.getMenuCategoryProducts(
      'menu-category-1',
      'en',
    );

    expect(response.products.map((product) => product.productId)).toEqual([
      'visible-drink',
    ]);
  });
});
