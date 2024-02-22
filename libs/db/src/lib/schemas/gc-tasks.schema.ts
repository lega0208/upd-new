import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { model, Document, Types } from 'mongoose';
import { IGCTasks } from '@dua-upd/types-common';

export type GcTasksDocument = GcTasks & Document;

@Schema({ collection: 'gc_tasks' })
export class GcTasks implements IGCTasks {
  @Prop({ type: Types.ObjectId, required: true })
  _id: Types.ObjectId = new Types.ObjectId();

  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({ type: String, required: true })
  timeStamp: string;

  @Prop({ type: String, required: true })
  surveyReferrerUrl: string;

  @Prop({ type: String, required: true })
  language: string;

  @Prop({ type: String })
  device?: string;

  @Prop({ type: String, required: true })
  screener: string;

  @Prop({ type: String, required: true })
  department: string;

  @Prop({ type: String, required: true })
  theme: string;

  @Prop({ type: String })
  themeOther?: string;

  @Prop({ type: String })
  grouping?: string;

  @Prop({ type: String, required: true })
  task: string;

  @Prop({ type: String })
  taskOther?: string;

  @Prop({ type: String, required: true })
  taskSatisfaction: string;

  @Prop({ type: String, required: true })
  taskEase: string;

  @Prop({ type: String, required: true })
  taskCompletion: string;

  @Prop({ type: String })
  taskImprove?: string;

  @Prop({ type: String })
  taskImproveComment?: string;

  @Prop({ type: String })
  taskWhyNot?: string;

  @Prop({ type: String })
  taskWhyNotComment?: string;

  @Prop({ type: String })
  sampling?: string;
}

export const GcTasksSchema = SchemaFactory.createForClass(GcTasks);

export function getGCTasksModel() {
  return model(GcTasks.name, GcTasksSchema);
}
