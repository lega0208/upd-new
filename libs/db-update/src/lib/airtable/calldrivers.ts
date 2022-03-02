import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { connect, Types } from 'mongoose';
import {
  CallDriver,
  getCallDriversModel,
  getDbConnectionString,
} from '@cra-arc/db';
import { AirtableClient, DateRange, DateType } from '@cra-arc/external-data';

dayjs.extend(utc);

export async function updateCalldriverData(endDate?: DateType) {
  await connect(getDbConnectionString());

  const calldriversModel = getCallDriversModel();

  const latestDataDate =
    (
      (await calldriversModel
        .findOne({})
        .sort({ date: -1 })
        .lean()) as CallDriver
    )?.date || '2021-01-01';

  const dateRange = {
    start: dayjs(latestDataDate).utc(false).add(1, 'day') as DateType,
    end: (endDate || dayjs().utc(true).subtract(1, 'day')) as DateType,
  } as DateRange;

  const airtableClient = new AirtableClient();

  const calldriversData: CallDriver[] = (
    await airtableClient.getCalldrivers(dateRange)
  ).map(
    (calldriverData) =>
      ({
        _id: new Types.ObjectId(),
        calls: 0,
        impact: 0,
        tpc_id: 999999,
        ...calldriverData,
      } as CallDriver)
  );

  return await calldriversModel.insertMany(calldriversData);
}
