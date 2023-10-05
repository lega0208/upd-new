import { Module } from '@nestjs/common';
import { set } from 'mongoose';
import { PagesModule } from '../pages/pages.module';
import { OverallModule } from '../overall/overall.module';
import { TasksModule } from '../tasks/tasks.module';
import { ProjectsModule } from '../projects/projects.module';
import { environment } from '../environments/environment';
import { DbModule } from '@dua-upd/db';
import { InternalSearchModule } from '../internal-search/internal-search.module';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [
    DbModule.forRoot(environment.production),
    PagesModule,
    OverallModule,
    TasksModule,
    ProjectsModule,
    InternalSearchModule,
    ReportsModule,
  ],
  providers: [],
})
export class AppModule {
  constructor() {
    !environment.production && set('debug', false);
  }
}
