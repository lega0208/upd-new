import { exit } from 'node:process';
import { CommandFactory } from 'nest-commander';

import { AppModule } from './app/app.module';

async function bootstrap() {
  await CommandFactory.run(AppModule, ['warn', 'error']);
  exit();
}

bootstrap().catch((e) => {
  throw e;
});


