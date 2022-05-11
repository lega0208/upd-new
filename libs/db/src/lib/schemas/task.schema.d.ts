/// <reference types="mongoose/types/pipelinestage" />
/// <reference types="mongoose/types/connection" />
/// <reference types="mongoose/types/cursor" />
/// <reference types="mongoose/types/document" />
/// <reference types="mongoose/types/error" />
/// <reference types="mongoose/types/mongooseoptions" />
/// <reference types="mongoose/types/schemaoptions" />
import { Document, Model, Types } from 'mongoose';
import { UxTest } from './ux-test.schema';
import { Page } from './page.schema';
import { Project } from './project.schema';
export declare type TaskDocument = Task & Document;
export declare class Task {
    _id: Types.ObjectId;
    airtable_id: string;
    title: string;
    group: string;
    subgroup: string;
    topic: string;
    subtopic: string;
    user_type: string[];
    ux_tests?: Types.ObjectId[] | UxTest[];
    projects?: Types.ObjectId[] | Project[];
    pages?: Types.ObjectId[] | Page[];
    tpc_ids: number[];
}
export declare const TaskSchema: import("mongoose").Schema<Document<Task, any, any>, Model<Document<Task, any, any>, any, any, any>, {}, {}>;
export declare const taskModel: Model<Document<Task, any, any>, {}, {}, {}>;
export declare function getTaskModel(): Model<Document<Task>>;
