import { ConsoleLogger, Inject, Injectable } from '@nestjs/common';
import { AirtableClient, DateRange } from '@dua-upd/external-data';
import { InjectModel } from '@nestjs/mongoose';
import { CallDriver, type CallDriverModel, Task } from '@dua-upd/db';
import { Model, Types } from 'mongoose';
import dayjs from 'dayjs';
import chalk from 'chalk';
import { Retry } from '@dua-upd/utils-common';
import type { DateType } from '@dua-upd/external-data';

@Injectable()
export class CalldriversService {
  constructor(
    @Inject(AirtableClient.name) private airtableClient: AirtableClient,
    private logger: ConsoleLogger,
    @InjectModel(CallDriver.name, 'defaultConnection')
    private calldriverModel: CallDriverModel,
    @InjectModel(Task.name, 'defaultConnection')
    private taskModel: Model<Task>,
  ) {}

  @Retry(4, 1000)
  async updateCalldrivers(endDate?: DateType) {
    this.logger.log('Updating calldrivers...');

    const latestDataDate =
      (
        (await this.calldriverModel
          .findOne({})
          .sort({ date: -1 })
          .lean()) as CallDriver
      )?.date || '2021-01-01';

    const dateRange = {
      start: dayjs(latestDataDate).utc(false).add(1, 'day') as DateType,
      end: (endDate || dayjs().utc(true).subtract(1, 'day')) as DateType,
    } as DateRange;

    try {
      const calldriversData: CallDriver[] = (
        await this.airtableClient.getCalldrivers(dateRange)
      ).map(
        (calldriverData) =>
          ({
            _id: new Types.ObjectId(),
            calls: 0,
            impact: 0,
            tpc_id: 999999,
            ...calldriverData,
          }) as CallDriver,
      );

      if (calldriversData.length === 0) {
        this.logger.log('Calldrivers already up-to-date.');

        this.logger.log('Syncing Calldrivers references...');

        await this.calldriverModel.syncTaskReferences(this.taskModel);

        this.logger.log('Successfully synced Calldrivers references.');

        return;
      }

      await this.calldriverModel.insertMany(calldriversData);

      this.logger.log(
        `Successfully inserted ${calldriversData.length} Calldriver documents.`,
      );

      this.logger.log('Syncing Calldrivers references...');

      await this.calldriverModel.syncTaskReferences(this.taskModel);

      this.logger.log('Successfully synced Calldrivers references.');
    } catch (err) {
      console.error(chalk.redBright(err));
    }
  }
}
