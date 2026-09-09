import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { KioskBasketService } from './kiosk-basket.service';
import type {
  AddBasketItemRequest,
  BasketResponse,
  CreateBasketRequest,
  UpdateBasketItemQuantityRequest,
} from './kiosk-basket.types';

@Controller('api/v1/kiosk/baskets')
export class KioskBasketController {
  constructor(private readonly kioskBasketService: KioskBasketService) {}

  @Post()
  createBasket(
    @Body() request: CreateBasketRequest = {},
  ): Promise<BasketResponse> {
    return this.kioskBasketService.createBasket(request);
  }

  @Get(':basketId')
  getBasket(@Param('basketId') basketId: string): Promise<BasketResponse> {
    return this.kioskBasketService.getBasket(basketId);
  }

  @Post(':basketId/items')
  addItem(
    @Param('basketId') basketId: string,
    @Body() request: AddBasketItemRequest,
  ): Promise<BasketResponse> {
    return this.kioskBasketService.addItem(basketId, request);
  }

  @Patch(':basketId/items/:basketItemId')
  updateItemQuantity(
    @Param('basketId') basketId: string,
    @Param('basketItemId') basketItemId: string,
    @Body() request: UpdateBasketItemQuantityRequest,
  ): Promise<BasketResponse> {
    return this.kioskBasketService.updateItemQuantity(
      basketId,
      basketItemId,
      request,
    );
  }

  @Delete(':basketId/items/:basketItemId')
  removeItem(
    @Param('basketId') basketId: string,
    @Param('basketItemId') basketItemId: string,
  ): Promise<BasketResponse> {
    return this.kioskBasketService.removeItem(basketId, basketItemId);
  }
}
