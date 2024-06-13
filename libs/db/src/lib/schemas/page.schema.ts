import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, model, Types } from 'mongoose';
import type { IProject, ITask, IUxTest } from '@dua-upd/types-common';

export type PageDocument = Page & Document;

@Schema()
export class Page {
  @Prop({ type: Types.ObjectId, required: true })
  _id: Types.ObjectId = new Types.ObjectId();

  @Prop({ required: true, type: String, index: true, unique: true })
  url: string;

  @Prop({ required: true, type: String })
  title = '';

  @Prop({ type: String })
  airtable_id?: string;

  @Prop({ type: String })
  lang?: 'en' | 'fr';

  @Prop({ type: String })
  altLangHref?: string;

  @Prop({ type: String })
  redirect?: string;

  @Prop({ type: Boolean })
  is_404?: boolean;

  @Prop({ type: Object })
  metadata?: { [prop: string]: string | Date };
  
  @Prop({ type: String, index: true })
  owners?: string;

  @Prop({ type: String, index: true })
  sections?: string;

  @Prop({ type: Date })
  lastChecked?: Date;

  @Prop({ type: Date })
  lastModified?: Date;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Task' }] })
  tasks?: Types.ObjectId[] | ITask[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Project' }] })
  projects?: Types.ObjectId[] | IProject[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'UxTest' }] })
  ux_tests?: Types.ObjectId[] | IUxTest[];
}

export const PageSchema = SchemaFactory.createForClass(Page);

const pageModel = model(Page.name, PageSchema);

export function getPageModel() {
  return pageModel;
}
