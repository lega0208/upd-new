import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { model, Document, Model, Types } from 'mongoose';
import { Page } from './page.schema';
import { UxTest } from './ux-test.schema';
import { Task } from './task.schema';

export type ProjectDocument = Project & Document;

@Schema()
export class Project {
  @Prop({ type: Types.ObjectId, required: true })
  _id: Types.ObjectId = new Types.ObjectId();

  @Prop({ type: String, required: true, unique: true, index: true })
  title = '';

  @Prop({ type: [{ type: Types.ObjectId, ref: 'UxTest' }] })
  ux_tests?: Types.ObjectId[] | UxTest[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Page' }] })
  pages?: Types.ObjectId[] | Page[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Task' }] })
  tasks?: Types.ObjectId[] | Task[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

export function getProjectModel() {
  return model(Project.name, ProjectSchema);
}
