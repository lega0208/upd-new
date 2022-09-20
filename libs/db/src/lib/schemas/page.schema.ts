import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  Document,
  model,
  Model,
  Types,
} from 'mongoose';
import { Task } from './task.schema';
import { Project } from './project.schema';
import { UxTest } from './ux-test.schema';

export type PageDocument = Page & Document;

@Schema()
export class Page {
  @Prop({ required: true })
  _id: Types.ObjectId = new Types.ObjectId();

  @Prop({ required: true, type: String, index: true })
  url = '';

  @Prop({ type: [String], index: true })
  all_urls: string[] = [];

  @Prop({ required: true, type: String })
  title = '';

  @Prop({ type: String })
  airtable_id?: string;

  @Prop({ type: String })
  itemid_url?: string;

  @Prop({ type: String })
  itemid_activitymap?: string;

  @Prop({ type: String })
  itemid_internalsearch?: string;

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

const pageModel = model(Page.name, PageSchema);

export function getPageModel() {
  return pageModel;
}
