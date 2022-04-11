import { Module } from '@nestjs/common';
import { PagesModule } from '../pages/pages.module';
import { OverallModule } from '../overall/overall.module';
import { TasksModule } from '../tasks/tasks.module';
import { ProjectsModule } from '../projects/projects.module';
import { MongooseModule } from '@nestjs/mongoose';
import { getDbConnectionString } from '@cra-arc/db';

@Module({
  imports: [
    MongooseModule.forRoot(getDbConnectionString()),
    PagesModule,
    OverallModule,
    TasksModule,
    ProjectsModule,
  ],
  providers: [],
})
export class AppModule {}
