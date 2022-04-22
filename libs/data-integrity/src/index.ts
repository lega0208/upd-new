export * from './lib/data-integrity.service';
export * from './lib/data-integrity.module';

import { NestFactory } from '@nestjs/core';
import { DataIntegrityModule } from './lib/data-integrity.module';
import { DataIntegrityService } from './lib/data-integrity.service';

async function bootstrap() {
  const app = await NestFactory.create(DataIntegrityModule);

  const dataIntegrityService = app.get<DataIntegrityService>(DataIntegrityService);

  console.log(`Running data integrity checks...`);

  await dataIntegrityService.findInvalidUrls('invalid-urls.csv');

  await app.close();
}

bootstrap().catch(e => {
  throw e;
});

