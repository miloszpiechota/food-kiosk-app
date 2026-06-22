import { Body, Controller, Param, Post } from '@nestjs/common';
import { KioskBasketService } from './kiosk-basket.service';
import type {
  AddBasketItemRequest,
  BasketResponse,
  CreateBasketRequest,
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

  @Post(':basketId/items')
  addItem(
    @Param('basketId') basketId: string,
    @Body() request: AddBasketItemRequest,
  ): Promise<BasketResponse> {
    return this.kioskBasketService.addItem(basketId, request);
  }
}
