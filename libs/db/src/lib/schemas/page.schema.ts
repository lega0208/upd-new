import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Task } from './task.schema';
import { Project } from './project.schema';
import { UxTest } from './ux-test.schema';
import { registerDiscriminator } from './collection.schema';

export type PageDocument = Page & Document;

@Schema({ autoIndex: false })
export class Page {
  @Prop({ required: true })
  _id: Types.ObjectId = new Types.ObjectId();

  @Prop({ required: true, type: String, index: true })
  url = '';

  @Prop({ type: [String], index: true })
  all_urls: string[] = [];

  @Prop({ required: true, type: String })
  title = '';

  @Prop({ unique: true, type: String })
  airtable_id?: string;

  @Prop({ type: String })
  aa_item_id?: string;

  @Prop({ type: Date })
  lastChecked?: Date;

  @Prop({ type: Date })
  lastModified?: Date;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Task' }] })
  tasks?: Types.ObjectId[] | Task[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Project' }] })
  projects?: Types.ObjectId[] | Project[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'UxTest' }] })
  ux_tests?: Types.ObjectId[] | UxTest[];

  @Prop({ type: Number })
  url_status?: number;
}

export const PageSchema = SchemaFactory.createForClass(Page);

export const PageConfig = {
  name: Page.name,
  schema: PageSchema,
}

export function getPageModel() {
  return registerDiscriminator(PageConfig);
}

