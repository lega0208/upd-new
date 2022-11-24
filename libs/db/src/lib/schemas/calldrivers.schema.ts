import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { model, Document, Model, Types } from 'mongoose';
import type { CallsByTopic, TopCalldriverTopics } from './types';

export type CallDriverDocument = CallDriver & Document;

@Schema()
export class CallDriver {
  @Prop({ type: Types.ObjectId, required: true })
  _id: Types.ObjectId = new Types.ObjectId();

  @Prop({ type: String, required: true, unique: true })
  airtable_id = '';

  @Prop({ type: Date, required: true, index: true })
  date = new Date(0);

  @Prop({ type: String, required: true, index: true })
  enquiry_line = '';

  @Prop({ type: String })
  topic?: string;

  @Prop({ type: String })
  subtopic?: string;

  @Prop({ type: String })
  sub_subtopic?: string;

  @Prop({ type: Number, index: true })
  tpc_id = 999999; // Some records don't have a tpc_id, so they will default to this value

  @Prop({ type: Number })
  impact = 0;

  @Prop({ type: Number })
  calls = 0;
}

export const CallDriverSchema = SchemaFactory.createForClass(CallDriver);

CallDriverSchema.index({ date: 1, tpc_id: 1 });

export function getCallDriversModel() {
  return model(CallDriver.name, CallDriverSchema);
}

CallDriverSchema.statics['getCallsByTopicFromIds'] = async function (
  documentIds: Types.ObjectId[]
): Promise<CallsByTopic[]> {
  return this.aggregate()
    .match({
      _id: { $in: documentIds },
    })
    .project({
      _id: 0,
      tpc_id: 1,
      topic: 1,
      subtopic: 1,
      sub_subtopic: 1,
      calls: 1,
    })
    .group({
      _id: '$tpc_id',
      topic: { $first: '$topic' },
      subtopic: { $first: '$subtopic' },
      sub_subtopic: { $first: '$sub_subtopic' },
      calls: { $sum: '$calls' },
    })
    .project({
      _id: 0,
      tpc_id: '$_id',
      topic: 1,
      subtopic: 1,
      sub_subtopic: 1,
      calls: 1,
    })
    .exec();
};

CallDriverSchema.statics['getCallsByEnquiryLineFromIds'] = async function (
  documentIds: Types.ObjectId[]
): Promise<{ enquiry_line: string; calls: number }[]> {
  return this.aggregate()
    .match({
      _id: { $in: documentIds },
    })
    .project({
      _id: 0,
      enquiry_line: 1,
      calls: 1,
    })
    .group({
      _id: '$enquiry_line',
      calls: { $sum: '$calls' },
    })
    .project({
      _id: 0,
      calls: 1,
      enquiry_line: '$_id',
    })
    .sort({ enquiry_line: 'asc' })
    .exec();
};

CallDriverSchema.statics['getTopicsWithPercentChange'] = async function (
  dateRange: string,
  comparisonDateRange: string,
  tpcIds?: number[]
) {
  const [currentData, previousData] = await Promise.all(
    [dateRange, comparisonDateRange].map((dateRange) => {
      const [startDate, endDate] = dateRange.split('/').map((d) => new Date(d));

      const tpcIdsQuery = tpcIds?.length ? { tpc_id: { $in: tpcIds } } : {};

      return this.aggregate<TopCalldriverTopics>()
        .sort({ date: 1, tpc_id: 1 })
        .match({ date: { $gte: startDate, $lte: endDate }, ...tpcIdsQuery })
        .group({
          _id: '$tpc_id',
          topic: { $first: '$topic' },
          subtopic: { $first: '$subtopic' },
          sub_subtopic: { $first: '$sub_subtopic' },
          calls: { $sum: '$calls' },
        })
        .project({
          _id: 0,
          tpc_id: '$_id',
          topic: 1,
          subtopic: 1,
          sub_subtopic: 1,
          calls: 1,
        })
        .exec() as Promise<TopCalldriverTopics[]>;
    })
  );

  const currentDataMap = new Map(
    currentData.map((topicData) => [topicData.tpc_id, topicData])
  );
  const previousDataMap = new Map(
    previousData.map((topicData) => [topicData.tpc_id, topicData])
  );

  return [...currentDataMap.keys()]
    .map((tpcId) => {
      const currentData = currentDataMap.get(tpcId);
      const previousData = previousDataMap.get(tpcId);

      return {
        ...currentData,
        change: !previousData?.calls
          ? 'Infinity'
          : (currentData?.calls ?? 0 - previousData.calls) / previousData.calls,
      };
    })
    .sort((a, b) => (b.calls ?? 0) - (a.calls ?? 0));
};

export interface CallDriverModel extends Model<CallDriver> {
  getCallsByTopicFromIds(
    documentIds: Types.ObjectId[]
  ): Promise<CallsByTopic[]>;
  getCallsByEnquiryLineFromIds(
    documentIds: Types.ObjectId[]
  ): Promise<{ enquiry_line: string; calls: number }[]>;
  getTopicsWithPercentChange(
    dateRange: string,
    comparisonDateRange: string,
    tpcIds?: number[]
  ): Promise<TopCalldriverTopics[]>;
}
