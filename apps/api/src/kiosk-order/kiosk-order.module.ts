import { Module } from '@nestjs/common';
import { KioskOrderController } from './kiosk-order.controller';
import { KioskOrderService } from './kiosk-order.service';

@Module({
  controllers: [KioskOrderController],
  providers: [KioskOrderService],
})
export class KioskOrderModule {}
