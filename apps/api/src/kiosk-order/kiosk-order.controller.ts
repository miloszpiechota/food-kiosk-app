import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { KioskOrderService } from './kiosk-order.service';
import type { CreateOrderRequest, OrderResponse } from './kiosk-order.types';

@Controller('api/v1/kiosk/orders')
export class KioskOrderController {
  constructor(private readonly kioskOrderService: KioskOrderService) {}

  @Post()
  createOrder(@Body() request: CreateOrderRequest): Promise<OrderResponse> {
    return this.kioskOrderService.createOrder(request);
  }

  @Get(':orderId')
  getOrder(@Param('orderId') orderId: string): Promise<OrderResponse> {
    return this.kioskOrderService.getOrder(orderId);
  }
}
