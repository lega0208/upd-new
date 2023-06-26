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

    const latestDataDate: Date | null = (await this.feedbackModel
      .findOne({}, { date: 1 })
      .sort({ date: -1 }))?.date;
    
    const createdDateThreshold = dayjs(latestDataDate || '2020-01-01')
      .utc(false)
      .add(1, 'day') as DateType;
    
    const startDate = dayjs(endDate).subtract(14, 'days').startOf('day') as DateType;
    
    const dateRange = {
      start: createdDateThreshold < startDate ? startDate : createdDateThreshold,
      end: endDate,
    } as DateRange;

    const [craFeedbackData, liveFeedbackData] = await Promise.all([
      this.airtableClient.getFeedback(dateRange),
      this.airtableClient.getLiveFeedback(dateRange)
    ]);

    const feedbackData = [...craFeedbackData, ...liveFeedbackData].map((data) => ({
      _id: new Types.ObjectId(),
      ...data,
    }) as Feedback);
  
    if (feedbackData.length === 0) {
      this.logger.log('Feedback data already up-to-date.');
      return;
    }
  
    const existingUniqueIds = new Set<string>();
    const existingFeedbackData = await this.feedbackModel
      .find({ unique_id: { $in: feedbackData.map((data) => data.unique_id) } })
      .lean();
  
    existingFeedbackData.forEach((feedback) => {
      existingUniqueIds.add(feedback.unique_id);
    });
  
    const filteredFeedbackData = feedbackData
    .filter((data) => !existingUniqueIds.has(data.unique_id))
    .sort((current, next) => current.date.getTime() - next.date.getTime());

    if (filteredFeedbackData.length === 0) {
      this.logger.log('Feedback data already up-to-date.');
      return;
    }

    return await this.feedbackModel
      .insertMany(filteredFeedbackData)
      .then(() => this.logger.log(`Successfully updated ${filteredFeedbackData.length} Feedback data`));
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
