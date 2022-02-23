import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UxTest } from './ux-test.schema';
import { Page } from './page.schema';
import { Project } from './project.schema';

export type TaskDocument = Task & Document;

@Schema()
export class Task {
  @Prop({ required: true, unique: true })
  _id: Types.ObjectId = new Types.ObjectId('');

  @Prop({ required: true, unique: true })
  airtable_id: string;

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

  @Prop({ type: String })
  user_type = '';

  @Prop({ type: [{ type: Types.ObjectId, ref: 'UxTest' }] })
  ux_tests?: UxTest[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Project' }] })
  projects?: Project[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Page' }] })
  pages?: Page[];
}

export const TaskSchema = SchemaFactory.createForClass(Task);
