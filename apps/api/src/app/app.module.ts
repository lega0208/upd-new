import { Module } from '@nestjs/common';
import { DbModule } from '@cra-arc/db';
import { PagesModule } from '../pages/pages.module';
import { OverallModule } from '../overall/overall.module';
import { TasksModule } from '../tasks/tasks.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [
    DbModule,
    PagesModule,
    OverallModule,
    TasksModule,
    ProjectsModule,
  ],
  providers: [],
})
export class AppModule {}
