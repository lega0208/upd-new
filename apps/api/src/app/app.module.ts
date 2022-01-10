import { Module } from '@nestjs/common';
import { DbModule } from '@cra-arc/db'
import { PagesModule } from '../pages/pages.module';
import { OverallModule } from '../overall/overall.module';

@Module({
  imports: [
    DbModule,
    PagesModule,
    OverallModule,
  ],
  providers: [],
})
export class AppModule {}
