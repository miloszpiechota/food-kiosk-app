import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import {
  AdminAuthController,
  AdminRestaurantsController,
  AdminUsersController,
} from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminCryptoService } from './admin-crypto.service';
import { AdminEmailService } from './admin-email.service';
import { AdminMenuController } from './admin-menu.controller';
import { AdminMenuService } from './admin-menu.service';
import { AdminOrderController } from './admin-order.controller';
import { AdminOrderService } from './admin-order.service';
import { AdminSessionGuard } from './admin-session.guard';
import { SuperAdminGuard } from './super-admin.guard';
import { TotpService } from './totp.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    AdminAuthController,
    AdminUsersController,
    AdminRestaurantsController,
    AdminMenuController,
    AdminOrderController,
  ],
  providers: [
    AdminAuthService,
    AdminCryptoService,
    AdminEmailService,
    AdminMenuService,
    AdminOrderService,
    AdminSessionGuard,
    SuperAdminGuard,
    TotpService,
  ],
})
export class AdminAuthModule {}
