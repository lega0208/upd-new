import { CacheModule, Module } from '@nestjs/common';
import { PagesService } from './pages.service';
import { PagesController } from './pages.controller';
import { DbModule } from '@cra-arc/db';

@Module({
  imports: [CacheModule.register({ ttl: 12 * 60 * 60 }), DbModule],
  controllers: [PagesController],
  providers: [PagesService],
})
export class PagesModule {}
