import { ConsoleLogger, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import { AirtableClient } from '@dua-upd/external-data';
import type { DateRange, DateType } from '@dua-upd/external-data';
import { Feedback } from '@dua-upd/db';
import type { FeedbackDocument } from '@dua-upd/db';

dayjs.extend(utc);

@Injectable()
export class FeedbackService {
  constructor(
    @Inject(AirtableClient.name) private airtableClient: AirtableClient,
    private logger: ConsoleLogger,
    @InjectModel(Feedback.name, 'defaultConnection')
    private feedbackModel: Model<FeedbackDocument>
  ) {}

  async updateFeedbackData(endDate?: DateType) {
    this.logger.log('Updating Feedback data');

    const latestDataDate: Date | null = await this.feedbackModel
      .findOne({}, { date: 1 })
      .sort({ date: -1 })
      .transform((doc) => doc?.get('date'));

    const dateRange = {
      start: dayjs(latestDataDate || '2020-01-01')
        .utc(false)
        .add(1, 'day') as DateType,
      end: (endDate || dayjs().utc(true).subtract(1, 'day')) as DateType,
    } as DateRange;

    const feedbackData = (await this.airtableClient.getFeedback(dateRange))
      .map(
        (feedbackData) =>
          ({
            _id: new Types.ObjectId(),
            ...feedbackData,
          } as Feedback)
      )
      .sort((current, next) => current.date.getTime() - next.date.getTime());

    if (feedbackData.length === 0) {
      this.logger.log('Feedback data already up-to-date.');
      return;
    }

    return await this.feedbackModel
      .insertMany(feedbackData)
      .then(() => this.logger.log('Successfully updated Feedback data'));
  }

  async repopulateFeedback() {
    this.logger.log(
      'Repopulating Feedback data... This may take several minutes.'
    );

    await this.feedbackModel.deleteMany({});

    await this.updateFeedbackData();

    this.logger.log('Finished repopulating Feedback data.');
  }
}
