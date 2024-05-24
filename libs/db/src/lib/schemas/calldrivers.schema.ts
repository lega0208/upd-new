import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { model, Document, Model, Types } from 'mongoose';
import type {
  CallsByTasks,
  CallsByTopic,
  ICallDriver,
  TopCalldriverTopics,
} from '@dua-upd/types-common';
import { percentChange } from '@dua-upd/utils-common';

export type CallDriverDocument = CallDriver & Document;

@Schema()
export class CallDriver implements ICallDriver {
  @Prop({ type: Types.ObjectId, required: true })
  _id: Types.ObjectId = new Types.ObjectId();

  @Prop({ type: String })
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

  @Prop({ type: [String] })
  tasks?: string[];

  @Prop({ type: Number, index: true })
  tpc_id = 999999; // Some records don't have a tpc_id, so they will default to this value

  @Prop({ type: Number })
  impact = 0;

  @Prop({ type: Number })
  calls = 0;

  @Prop({ type: Number })
  selfserve_yes?: number;

  @Prop({ type: Number })
  selfserve_no?: number;

  @Prop({ type: Number })
  selfserve_na?: number;
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
      enquiry_line: 1,
      topic: 1,
      subtopic: 1,
      sub_subtopic: 1,
      calls: 1,
    })
    .lookup ({
      from: 'tasks',
      localField: 'tpc_id',
      foreignField: 'tpc_ids',
      as: 'task',
    })
    .group({
      _id: '$tpc_id',
      topic: { $first: '$topic' },
      enquiry_line: { $first: '$enquiry_line' },
      subtopic: { $first: '$subtopic' },
      sub_subtopic: { $first: '$sub_subtopic' },
      tasks: { $first: '$task.title' },
      calls: { $sum: '$calls' },
    })
    .project({
      _id: 0,
      tpc_id: '$_id',
      topic: 1,
      enquiry_line: 1,
      subtopic: 1,
      sub_subtopic: 1,
      tasks:1,
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

CallDriverSchema.statics['getCallsByTpcId'] = async function (
  dateRange: string,
  tpcIds: number[]
): Promise<CallsByTasks[]> {
  const [startDate, endDate] = dateRange.split('/').map((d) => new Date(d));

  return this.aggregate()
    .match({
      date: { $gte: startDate, $lte: endDate },
      tpc_id: { $in: tpcIds },
    })
    .group({
      _id: '$tpc_id',
      calls: { $sum: '$calls' },
    })
    .project({
      _id: 0,
      calls: 1,
    })
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

      const ab = this.aggregate<TopCalldriverTopics>()
        .sort({ date: 1, tpc_id: 1 })
        .match({ date: { $gte: startDate, $lte: endDate }, ...tpcIdsQuery })
        
        .lookup ({
            from: 'tasks',
            localField: 'tpc_id',
            foreignField: 'tpc_ids',
            as: 'task',
          })

        .unwind('$task')
      
        .group({
          _id: '$tpc_id',
          enquiry_line: { $first: '$enquiry_line' },
          topic: { $first: '$topic' },
          subtopic: { $first: '$subtopic' },
          sub_subtopic: { $first: '$sub_subtopic' },
          tasks: { $first: '$tasks.title' },
          calls: { $sum: '$calls' },
        })
        .project({
          _id: 0,
          enquiry_line: 1,
          tpc_id: '$_id',
          topic: 1,
          subtopic: 1,
          sub_subtopic: 1,
          tasks:1,
          calls: 1,
        })
        .exec() as Promise<TopCalldriverTopics[]>;
        console.log(ab)
        return ab;
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
          ? null
          : percentChange(currentData.calls, previousData.calls),
      };
    })
    .sort((a, b) => (b.calls ?? 0) - (a.calls ?? 0));
};

CallDriverSchema.statics['getCallsByTaskFromIds'] = async function (
  dateRange: string,
  documentIds: number[]
): Promise<CallsByTasks[]> {
  const [startDate, endDate] = dateRange.split('/').map((d) => new Date(d));

  return this.aggregate([
    {
      $match: {
        tpc_id: { $in: documentIds },
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $lookup: {
        from: 'tasks',
        localField: 'tpc_id',
        foreignField: 'tpc_ids',
        as: 'task',
      },
    },
    {
      $unwind: '$task',
    },
    {
      $group: {
        _id: '$task._id',
        title: { $first: '$task.title' },
        calls: { $sum: '$calls' },
      },
    },
    {
      $project: {
        _id: 0,
        title: 1,
        calls: 1,
      },
    },
  ]).exec();
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
  getCallsByTpcId(dateRange: string, tpcIds: number[]): Promise<CallsByTasks[]>;
  getCallsByTaskFromIds(
    dateRange: string,
    documentIds: number[]
  ): Promise<CallsByTasks[]>;
}
