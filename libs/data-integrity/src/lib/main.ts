import { NestFactory } from '@nestjs/core';
import { DataIntegrityModule } from './data-integrity.module';
import { DataIntegrityService } from './data-integrity.service';

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
