import { Module } from '@nestjs/common';
import { set } from 'mongoose';
import { PagesModule } from '../pages/pages.module';
import { OverallModule } from '../overall/overall.module';
import { TasksModule } from '../tasks/tasks.module';
import { ProjectsModule } from '../projects/projects.module';
import { environment } from '../environments/environment';

@Module({
  imports: [
    PagesModule,
    OverallModule,
    TasksModule,
    ProjectsModule,
  ],
  providers: [],
})
export class AppModule {
  constructor() {
    !environment.production && set('debug', true);
  }
}
