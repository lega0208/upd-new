import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DataIntegrityService } from '@cra-arc/data-integrity';

import { AppModule } from './app/app.module';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const dataIntegrityService = app.get<DataIntegrityService>(DataIntegrityService);

  console.log(`Running data integrity checks...`);

  const results = await dataIntegrityService.fillMissingGscOverallMetrics();

  console.log(results);

  await app.close();
}

bootstrap().catch(e => {
  throw e;
});
