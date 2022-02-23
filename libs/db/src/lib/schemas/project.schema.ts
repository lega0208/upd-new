import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Page } from './page.schema';
import { UxTest } from './ux-test.schema';
import { Task } from './task.schema';

export type ProjectDocument = Project & Document;

@Schema()
export class Project {
  @Prop({ required: true, unique: true })
  _id: Types.ObjectId = new Types.ObjectId('');

  @Prop({ required: true, unique: true })
  title = '';

  @Prop({ type: [{ type: Types.ObjectId, ref: 'UxTest' }] })
  ux_tests?: UxTest[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Page' }] })
  pages?: Page[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Project' }] })
  tasks?: Task[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
