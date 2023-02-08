import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { model, Document, Types } from 'mongoose';
import { Page } from './page.schema';
import { UxTest } from './ux-test.schema';
import { Task } from './task.schema';
import { AttachmentData, IProject } from '@dua-upd/types-common';

export type ProjectDocument = Project & Document;

@Schema()
export class Project implements IProject {
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

  @Prop({ type: String })
  description?: string;

  @Prop({
    type: [
      {
        id: String,
        url: String,
        filename: String,
        size: Number,
        storage_url: String,
      },
    ],
  })
  attachments?: AttachmentData[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

export function getProjectModel() {
  return model(Project.name, ProjectSchema);
}
