import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AdminSessionGuard } from './admin-session.guard';
import type { AdminAuthenticatedSession } from './admin-auth.types';
import { CurrentAdmin } from './current-admin.decorator';
import { AdminMenuService } from './admin-menu.service';
import type {
  AdminMenuProductListResponse,
  UpdateAdminMenuVisibilityRequest,
  UpdateAdminMenuVisibilityResponse,
} from './admin-menu.types';

@Controller('api/v1/admin/menu-products')
@UseGuards(AdminSessionGuard)
export class AdminMenuController {
  constructor(private readonly adminMenuService: AdminMenuService) {}

  @Get()
  list(
    @CurrentAdmin() admin: AdminAuthenticatedSession,
  ): Promise<AdminMenuProductListResponse> {
    return this.adminMenuService.listMenuProducts(admin);
  }

  @Patch('visibility')
  @HttpCode(200)
  updateVisibility(
    @CurrentAdmin() admin: AdminAuthenticatedSession,
    @Body() request: UpdateAdminMenuVisibilityRequest,
  ): Promise<UpdateAdminMenuVisibilityResponse> {
    return this.adminMenuService.updateMenuProductVisibility(admin, request);
  }
}
