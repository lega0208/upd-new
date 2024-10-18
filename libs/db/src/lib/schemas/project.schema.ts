import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { model, Document, Types } from 'mongoose';
import type {
  AttachmentData,
  IPage,
  IProject,
  ITask,
  IUxTest,
} from '@dua-upd/types-common';

export type ProjectDocument = Project & Document;

@Schema()
export class Project implements IProject {
  @Prop({ type: Types.ObjectId, required: true })
  _id: Types.ObjectId = new Types.ObjectId();

  @Prop({ type: String, required: true, unique: true, index: true })
  title = '';

  @Prop({ type: [{ type: Types.ObjectId, ref: 'UxTest' }] })
  ux_tests?: Types.ObjectId[] | IUxTest[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Page' }] })
  pages?: Types.ObjectId[] | IPage[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Task' }] })
  tasks?: Types.ObjectId[] | ITask[];

  @Prop({ type: String })
  description?: string;

  @Prop({ type: Date, index: true })
  date?: Date;

  @Prop({ type: Number })
  success_rate?: number;

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
