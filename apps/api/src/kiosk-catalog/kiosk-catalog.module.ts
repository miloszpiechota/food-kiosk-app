import { Module } from '@nestjs/common';
import { KioskCatalogController } from './kiosk-catalog.controller';
import { KioskCatalogService } from './kiosk-catalog.service';

@Module({
  controllers: [KioskCatalogController],
  providers: [KioskCatalogService],
})
export class KioskCatalogModule {}
