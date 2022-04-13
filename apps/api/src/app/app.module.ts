import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PagesModule } from '../pages/pages.module';
import { OverallModule } from '../overall/overall.module';
import { TasksModule } from '../tasks/tasks.module';
import { ProjectsModule } from '../projects/projects.module';
import { set } from 'mongoose';
import { getDbConnectionString } from '@cra-arc/db';
import { MongooseModule } from '@nestjs/mongoose';

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
    set('debug', true);
  }
}
