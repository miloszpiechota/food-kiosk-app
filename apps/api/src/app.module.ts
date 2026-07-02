import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KioskBasketModule } from './kiosk-basket/kiosk-basket.module';
import { KioskCatalogModule } from './kiosk-catalog/kiosk-catalog.module';
import { KioskOrderModule } from './kiosk-order/kiosk-order.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    KioskCatalogModule,
    KioskBasketModule,
    KioskOrderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
