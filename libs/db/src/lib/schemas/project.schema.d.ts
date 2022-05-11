/// <reference types="mongoose/types/pipelinestage" />
/// <reference types="mongoose/types/connection" />
/// <reference types="mongoose/types/cursor" />
/// <reference types="mongoose/types/document" />
/// <reference types="mongoose/types/error" />
/// <reference types="mongoose/types/mongooseoptions" />
/// <reference types="mongoose/types/schemaoptions" />
import { Document, Model, Types } from 'mongoose';
import { Page } from './page.schema';
import { UxTest } from './ux-test.schema';
import { Task } from './task.schema';
export declare type ProjectDocument = Project & Document;
export declare class Project {
    _id: Types.ObjectId;
    title: string;
    ux_tests?: Types.ObjectId[] | UxTest[];
    pages?: Types.ObjectId[] | Page[];
    tasks?: Types.ObjectId[] | Task[];
}
export declare const ProjectSchema: import("mongoose").Schema<Document<Project, any, any>, Model<Document<Project, any, any>, any, any, any>, {}, {}>;
export declare function getProjectModel(): Model<Document<Project>>;
