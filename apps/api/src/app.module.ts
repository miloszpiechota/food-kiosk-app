import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KioskCatalogModule } from './kiosk-catalog/kiosk-catalog.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, KioskCatalogModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
