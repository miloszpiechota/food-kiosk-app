import { Module } from '@nestjs/common';
import { KioskBasketController } from './kiosk-basket.controller';
import { KioskBasketService } from './kiosk-basket.service';
import { MealConfigurationService } from './meal-configuration.service';

@Module({
  controllers: [KioskBasketController],
  providers: [KioskBasketService, MealConfigurationService],
})
export class KioskBasketModule {}
