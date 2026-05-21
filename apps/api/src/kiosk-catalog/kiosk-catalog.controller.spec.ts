import { Test, TestingModule } from '@nestjs/testing';
import { KioskCatalogController } from './kiosk-catalog.controller';
import { KioskCatalogService } from './kiosk-catalog.service';

describe('KioskCatalogController', () => {
  let controller: KioskCatalogController;
  let service: jest.Mocked<
    Pick<
      KioskCatalogService,
      | 'getActiveMenu'
      | 'getMenuCategories'
      | 'getMenuCategoryProducts'
      | 'getMenuProductDetail'
    >
  >;

  beforeEach(async () => {
    service = {
      getActiveMenu: jest.fn(),
      getMenuCategories: jest.fn(),
      getMenuCategoryProducts: jest.fn(),
      getMenuProductDetail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [KioskCatalogController],
      providers: [
        {
          provide: KioskCatalogService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<KioskCatalogController>(KioskCatalogController);
  });

  it('gets the active menu with an optional locale', async () => {
    const response = {
      id: 'menu-1',
      code: 'main',
      name: 'Menu glowne',
      description: null,
      locale: 'pl',
      defaultLocale: 'en',
      currencyCode: 'PLN',
    };
    service.getActiveMenu.mockResolvedValue(response);

    await expect(controller.getActiveMenu('pl')).resolves.toBe(response);

    expect(service.getActiveMenu).toHaveBeenCalledWith('pl');
  });

  it('gets visible menu categories', async () => {
    const response = {
      menuId: 'menu-1',
      locale: 'en',
      categories: [],
    };
    service.getMenuCategories.mockResolvedValue(response);

    await expect(
      controller.getMenuCategories('menu-1', undefined),
    ).resolves.toBe(response);

    expect(service.getMenuCategories).toHaveBeenCalledWith('menu-1', undefined);
  });

  it('gets products for a visible menu category', async () => {
    const response = {
      menuCategoryId: 'menu-category-1',
      categoryId: 'category-1',
      locale: 'en',
      products: [],
    };
    service.getMenuCategoryProducts.mockResolvedValue(response);

    await expect(
      controller.getMenuCategoryProducts('menu-category-1', 'en'),
    ).resolves.toBe(response);

    expect(service.getMenuCategoryProducts).toHaveBeenCalledWith(
      'menu-category-1',
      'en',
    );
  });

  it('gets menu product detail', async () => {
    const response = {
      menuProductId: 'menu-product-1',
      productId: 'product-1',
      menuId: 'menu-1',
      menuCategoryId: 'menu-category-1',
      categoryId: 'category-1',
      type: 'ITEM',
      sku: 'burger',
      name: 'Burger',
      description: null,
      price: '12.00',
      currencyCode: 'PLN',
      imageUrl: null,
      sortOrder: 1,
      locale: 'en',
      isAvailable: true,
      groups: [],
      ingredients: [],
      modifierGroups: [],
    };
    service.getMenuProductDetail.mockResolvedValue(response);

    await expect(
      controller.getMenuProductDetail('menu-product-1', 'en'),
    ).resolves.toBe(response);

    expect(service.getMenuProductDetail).toHaveBeenCalledWith(
      'menu-product-1',
      'en',
    );
  });
});
