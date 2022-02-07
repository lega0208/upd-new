import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { OverallService } from './overall.service';
import { OverallController } from './overall.controller';
import { Overall, OverallSchema } from '@cra-arc/db';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Overall.name, schema: OverallSchema }]),
  ],
  controllers: [OverallController],
  providers: [OverallService],
})
export class OverallModule {}
