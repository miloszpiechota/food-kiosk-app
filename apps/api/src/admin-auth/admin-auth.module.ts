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
  ],
  providers: [
    AdminAuthService,
    AdminCryptoService,
    AdminEmailService,
    AdminMenuService,
    AdminSessionGuard,
    SuperAdminGuard,
    TotpService,
  ],
})
export class AdminAuthModule {}
