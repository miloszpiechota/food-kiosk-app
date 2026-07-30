/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { AdminRole, ProductType } from '@prisma/client';
import type { AdminAuthenticatedSession } from './admin-auth.types';
import { AdminMenuService } from './admin-menu.service';

function createPrismaMock() {
  const prisma = {
    menuProduct: {
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(
      (callback: (transaction: unknown) => Promise<unknown>) =>
        callback(prisma),
    ),
  };

  return prisma;
}

function createSession(): AdminAuthenticatedSession {
  return {
    sessionId: 'session-1',
    tokenId: '11111111-1111-4111-8111-111111111111',
    expiresAt: new Date(Date.now() + 60_000),
    user: {
      id: 'admin-1',
      email: 'owner@example.com',
      role: AdminRole.SUPER_ADMIN,
      restaurantIds: [],
    },
  };
}

function createMenuProduct(input: {
  id: string;
  productId: string;
  type: ProductType;
  isVisible: boolean;
  groupOptionProductIds?: string[];
}) {
  const restaurant = {
    id: 'restaurant-1',
    name: 'Demo Restaurant',
    slug: 'demo',
    defaultLocale: 'en',
    currencyCode: 'PLN',
  };

  return {
    id: input.id,
    productId: input.productId,
    menuPrice: { toString: () => '10.00' },
    sortOrder: 1,
    isVisible: input.isVisible,
    createdAt: new Date('2026-07-29T08:00:00.000Z'),
    menuCategoryId: 'category-1',
    menuCategory: {
      menuId: 'menu-1',
      category: {
        name: 'Meals',
      },
      menu: {
        restaurant,
      },
    },
    product: {
      id: input.productId,
      type: input.type,
      sku: input.productId,
      name: input.productId,
      basePrice: { toString: () => '10.00' },
      imageUrl: null,
      isAvailable: true,
      translations: [],
      productGroups:
        input.groupOptionProductIds === undefined
          ? []
          : [
              {
                isRequired: true,
                minSelections: 1,
                options: input.groupOptionProductIds.map((productId) => ({
                  productId,
                  isAvailable: true,
                  product: {
                    isAvailable: true,
                    menuProducts: [],
                  },
                })),
              },
            ],
    },
  };
}

describe('AdminMenuService', () => {
  it('forces meals hidden when a required group has no visible option after save', async () => {
    const prisma = createPrismaMock();
    const service = new AdminMenuService(prisma);
    const friesAfterSave = createMenuProduct({
      id: 'fries-menu-product',
      productId: 'fries-product',
      type: ProductType.ITEM,
      isVisible: false,
    });
    const mealAfterSave = createMenuProduct({
      id: 'meal-menu-product',
      productId: 'meal-product',
      type: ProductType.MEAL,
      isVisible: true,
      groupOptionProductIds: ['fries-product'],
    });
    prisma.menuProduct.findMany
      .mockResolvedValueOnce([
        {
          id: 'fries-menu-product',
          menuCategory: {
            menu: {
              restaurantId: 'restaurant-1',
            },
          },
        },
      ])
      .mockResolvedValueOnce([friesAfterSave, mealAfterSave])
      .mockResolvedValueOnce([
        friesAfterSave,
        {
          ...mealAfterSave,
          isVisible: false,
        },
      ]);

    const response = await service.updateMenuProductVisibility(
      createSession(),
      {
        changes: [
          {
            menuProductId: 'fries-menu-product',
            isVisible: false,
          },
        ],
      },
    );

    expect(prisma.menuProduct.update).toHaveBeenCalledWith({
      where: { id: 'fries-menu-product' },
      data: { isVisible: false },
    });
    expect(prisma.menuProduct.updateMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['meal-menu-product'] },
        isVisible: true,
      },
      data: {
        isVisible: false,
      },
    });
    expect(response.forcedHiddenMenuProductIds).toEqual(['meal-menu-product']);
  });
});
