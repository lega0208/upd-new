import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DataIntegrityService } from '@cra-arc/data-integrity';

import { AppModule } from './app/app.module';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const dataIntegrityService = app.get<DataIntegrityService>(DataIntegrityService);

  console.log(`Running data integrity checks...`);

  const gscPageResults = await dataIntegrityService.fillMissingGscPageMetrics();
  const gscOverallResults = await dataIntegrityService.fillMissingGscOverallMetrics();

  console.log(gscPageResults);
  console.log(gscOverallResults);

  await app.close();
}

bootstrap().catch(e => {
  throw e;
});
