import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { UpdateService} from '../update-service/update.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
  ],
  providers: [UpdateService],
})
export class AppModule {}
