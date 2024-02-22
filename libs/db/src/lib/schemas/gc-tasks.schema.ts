import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { model, Document, Types } from 'mongoose';
import { IGCTasks } from '@dua-upd/types-common';

export type GcTasksDocument = GcTasks & Document;

@Schema({ collection: 'gc_tasks' })
export class GcTasks implements IGCTasks {
  @Prop({ type: Types.ObjectId, required: true })
  _id: Types.ObjectId = new Types.ObjectId();

  @Prop({ type: Date, required: true, index: true })
  date: Date;

  @Prop({ type: String, required: true })
  time_stamp: string;

  @Prop({ type: String, required: true, index: true })
  url: string;

  @Prop({ type: String, required: true, index: true })
  language: string;

  @Prop({ type: String })
  device?: string;

  @Prop({ type: Boolean, required: true })
  screener: boolean;

  @Prop({ type: String, required: true })
  department: string;

  @Prop({ type: String, required: true })
  theme: string;

  @Prop({ type: String })
  theme_other?: string;

  @Prop({ type: String, index: true })
  grouping?: string;

  @Prop({ type: String, required: true, index: true })
  gc_task: string;

  @Prop({ type: String })
  gc_task_other?: string;

  @Prop({ type: String, required: true, index: true })
  satisfaction: string;

  @Prop({ type: String, required: true, index: true })
  ease: string;

  @Prop({ type: String, required: true, index: true })
  able_to_complete: string;

  @Prop({ type: String })
  what_would_improve?: string;

  @Prop({ type: String })
  what_would_improve_comment?: string;

  @Prop({ type: String })
  reason_not_complete?: string;

  @Prop({ type: String })
  reason_not_complete_comment?: string;

  @Prop({ type: String })
  sampling?: string;
}

export const GcTasksSchema = SchemaFactory.createForClass(GcTasks);

GcTasksSchema.index({date: 1, url: 1})
GcTasksSchema.index({date: 1, gc_task: 1})

export function getGCTasksModel() {
  return model(GcTasks.name, GcTasksSchema);
}
