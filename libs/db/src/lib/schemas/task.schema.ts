import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { model, Document, Model, Types } from 'mongoose';
import { UxTest } from './ux-test.schema';
import { Page } from './page.schema';
import { Project } from './project.schema';

export type TaskDocument = Task & Document;

@Schema()
export class Task {
  @Prop({ required: true })
  _id: Types.ObjectId = new Types.ObjectId();

  @Prop({ required: true, unique: true, type: String, index: true })
  airtable_id = '';

  @Prop({ required: true, type: String })
  title = '';

  @Prop({ type: String })
  group = '';

  @Prop({ type: String })
  subgroup = '';

  @Prop({ type: String })
  topic = '';

  @Prop({ type: String })
  subtopic = '';

  @Prop({ type: [String] })
  user_type = [];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'UxTest' }] })
  ux_tests?: Types.ObjectId[] | UxTest[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Project' }] })
  projects?: Types.ObjectId[] | Project[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Page' }] })
  pages?: Types.ObjectId[] | Page[];
}

export const TaskSchema = SchemaFactory.createForClass(Task);

export const taskModel = model(Task.name, TaskSchema);

export function getTaskModel(): Model<Document<Task>> {
  return taskModel;
}
