/// <reference types="mongoose/types/pipelinestage" />
/// <reference types="mongoose/types/connection" />
/// <reference types="mongoose/types/cursor" />
/// <reference types="mongoose/types/document" />
/// <reference types="mongoose/types/error" />
/// <reference types="mongoose/types/mongooseoptions" />
/// <reference types="mongoose/types/schemaoptions" />
import { Document, Model, Types } from 'mongoose';
import { Task } from './task.schema';
import { Project } from './project.schema';
import { UxTest } from './ux-test.schema';
export declare type PageDocument = Page & Document;
export declare class Page {
    _id: Types.ObjectId;
    url: string;
    all_urls: string[];
    title: string;
    airtable_id?: string;
    aa_item_id?: string;
    lastChecked?: Date;
    lastModified?: Date;
    tasks?: Types.ObjectId[] | Task[];
    projects?: Types.ObjectId[] | Project[];
    ux_tests?: Types.ObjectId[] | UxTest[];
    url_status?: number;
}
export declare const PageSchema: import("mongoose").Schema<Document<Page, any, any>, Model<Document<Page, any, any>, any, any, any>, {}, {}>;
export declare function getPageModel(): Model<Document<Page>>;
