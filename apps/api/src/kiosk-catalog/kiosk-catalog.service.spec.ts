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
                imageUrl: '/seed/classic-burger.jpg',
                translations: [],
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
                imageUrl: '/seed/cheese-burger.jpg',
                translations: [],
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
  });
});
