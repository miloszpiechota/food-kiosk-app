import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

function loadEnvironment() {
  const candidates = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '../../.env'),
    resolve(process.cwd(), '../../packages/database/.env'),
    resolve(__dirname, '../../../.env'),
    resolve(__dirname, '../../../packages/database/.env'),
  ];

  for (const envFile of new Set(candidates)) {
    if (existsSync(envFile)) {
      process.loadEnvFile(envFile);
    }

    if (process.env.DATABASE_URL) {
      return;
    }
  }
}

async function bootstrap() {
  loadEnvironment();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  });
  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 4000);
}

void bootstrap();
