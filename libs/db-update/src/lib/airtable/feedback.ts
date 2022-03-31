import { connect, Types } from 'mongoose';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import { AirtableClient, DateRange, DateType } from '@cra-arc/external-data';
import {
  Feedback,
  getFeedbackModel,
  getDbConnectionString,
} from '@cra-arc/db';

dayjs.extend(utc);

export async function updateFeedbackData(endDate?: DateType) {
  await connect(getDbConnectionString());

  const feedbackModel = getFeedbackModel();

  const latestDataDate: Date =
    (await feedbackModel
      .findOne({}, { date: 1 })
      .sort({ date: -1 })
      .transform((doc) => doc.get('date')));

  const dateRange = {
    start: dayjs(latestDataDate || '2020-01-01').utc(false).add(1, 'day') as DateType,
    end: (endDate || dayjs().utc(true).subtract(1, 'day')) as DateType,
  } as DateRange;

  const airtableClient = new AirtableClient();

  const feedbackData = (await airtableClient.getFeedback(dateRange))
    .map((feedbackData) => ({
      _id: new Types.ObjectId(),
      ...feedbackData,
    }) as Feedback);

  return await feedbackModel.insertMany(feedbackData);
}
