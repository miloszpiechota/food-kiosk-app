import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminSessionGuard } from './admin-session.guard';
import type { AdminAuthenticatedSession } from './admin-auth.types';
import { CurrentAdmin } from './current-admin.decorator';
import { AdminOrderService } from './admin-order.service';
import type {
  AdminOrderDetailResponse,
  AdminOrderListQuery,
  AdminOrderListResponse,
  UpdateAdminOrderStatusRequest,
  UpdateAdminOrderStatusResponse,
} from './admin-order.types';

@Controller('api/v1/admin/orders')
@UseGuards(AdminSessionGuard)
export class AdminOrderController {
  constructor(private readonly adminOrderService: AdminOrderService) {}

  @Get()
  list(
    @CurrentAdmin() admin: AdminAuthenticatedSession,
    @Query() query: AdminOrderListQuery,
  ): Promise<AdminOrderListResponse> {
    return this.adminOrderService.listOrders(admin, query);
  }

  @Get(':orderId')
  detail(
    @CurrentAdmin() admin: AdminAuthenticatedSession,
    @Param('orderId') orderId: string,
  ): Promise<AdminOrderDetailResponse> {
    return this.adminOrderService.getOrder(admin, orderId);
  }

  @Patch(':orderId/status')
  @HttpCode(200)
  updateStatus(
    @CurrentAdmin() admin: AdminAuthenticatedSession,
    @Param('orderId') orderId: string,
    @Body() request: UpdateAdminOrderStatusRequest,
  ): Promise<UpdateAdminOrderStatusResponse> {
    return this.adminOrderService.updateOrderStatus(admin, orderId, request);
  }
}
