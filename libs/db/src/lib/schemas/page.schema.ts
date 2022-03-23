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

  @Prop({ required: true, type: String })
  url = '';

  @Prop({ type: [String] })
  all_urls: string[] = [];

  @Prop({ required: true, type: String })
  title = '';

  @Prop({ unique: true, type: String })
  airtable_id?: string;

  @Prop({ type: String })
  aa_item_id?: string;

  @Prop({ type: Date })
  lastChecked = new Date(0);

  @Prop({ type: Date })
  lastModified = new Date(0);

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

export function getPageModel(): Model<Document<Page>> {
  return pageModel;
}
