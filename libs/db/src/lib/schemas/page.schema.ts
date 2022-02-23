import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Task } from './task.schema';
import { Project } from './project.schema';
import { UxTest } from './ux-test.schema';

export type PageDocument = Page & Document;

@Schema()
export class Page {
  @Prop({ required: true })
  _id: Types.ObjectId = new Types.ObjectId('');

  @Prop({ required: true, type: String })
  url = '';

  @Prop({ type: [String] })
  all_urls: string[] = [];

  @Prop({ required: true, type: String })
  title = '';

  @Prop({ type: String, unique: true })
  airtable_id = '';

  @Prop({ type: Date })
  lastChecked = new Date(0);

  @Prop({ type: Date })
  lastModified = new Date(0);

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Task' }] })
  tasks?: Task[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Project' }] })
  projects?: Project[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'UxTest' }] })
  ux_tests?: UxTest[];
}

export const PageSchema = SchemaFactory.createForClass(Page);
