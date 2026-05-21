import { Controller, Get, Param, Query } from '@nestjs/common';
import { KioskCatalogService } from './kiosk-catalog.service';
import {
  ActiveMenuResponse,
  MenuCategoryListResponse,
  MenuCategoryProductsResponse,
  MenuProductDetailResponse,
} from './kiosk-catalog.types';

@Controller('api/v1/kiosk')
export class KioskCatalogController {
  constructor(private readonly kioskCatalogService: KioskCatalogService) {}

  @Get('menus/active')
  getActiveMenu(@Query('locale') locale?: string): Promise<ActiveMenuResponse> {
    return this.kioskCatalogService.getActiveMenu(locale);
  }

  @Get('menus/:menuId/categories')
  getMenuCategories(
    @Param('menuId') menuId: string,
    @Query('locale') locale?: string,
  ): Promise<MenuCategoryListResponse> {
    return this.kioskCatalogService.getMenuCategories(menuId, locale);
  }

  @Get('menu-categories/:menuCategoryId/products')
  getMenuCategoryProducts(
    @Param('menuCategoryId') menuCategoryId: string,
    @Query('locale') locale?: string,
  ): Promise<MenuCategoryProductsResponse> {
    return this.kioskCatalogService.getMenuCategoryProducts(
      menuCategoryId,
      locale,
    );
  }

  @Get('menu-products/:menuProductId')
  getMenuProductDetail(
    @Param('menuProductId') menuProductId: string,
    @Query('locale') locale?: string,
  ): Promise<MenuProductDetailResponse> {
    return this.kioskCatalogService.getMenuProductDetail(menuProductId, locale);
  }
}
