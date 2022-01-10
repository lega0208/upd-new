import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PagesService } from './pages.service';
import { PagesController } from './pages.controller';
import { PageSchema, Page } from '@cra-arc/db';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Page.name, schema: PageSchema },
    ])
  ],
  controllers: [PagesController],
  providers: [PagesService],
})
export class PagesModule {}
