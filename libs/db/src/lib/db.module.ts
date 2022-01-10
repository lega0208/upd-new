import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { getDbConnectionString } from './db.connection';

@Module({
  imports: [
    MongooseModule.forRoot(getDbConnectionString()),

  ],
  providers: [],
  exports: [],
})
export class DbModule {}
