/// <reference types="mongoose/types/pipelinestage" />
/// <reference types="mongoose/types/connection" />
/// <reference types="mongoose/types/cursor" />
/// <reference types="mongoose/types/document" />
/// <reference types="mongoose/types/error" />
/// <reference types="mongoose/types/mongooseoptions" />
/// <reference types="mongoose/types/schemaoptions" />
import { Document, Model, Types } from 'mongoose';
export declare type CallDriverDocument = CallDriver & Document;
export declare class CallDriver {
    _id: Types.ObjectId;
    airtable_id: string;
    date: Date;
    enquiry_line: string;
    topic?: string;
    subtopic?: string;
    sub_subtopic?: string;
    tpc_id: number;
    impact: number;
    calls: number;
}
export declare const CallDriverSchema: import("mongoose").Schema<Document<CallDriver, any, any>, Model<Document<CallDriver, any, any>, any, any, any>, {}, {}>;
export declare function getCallDriversModel(): Model<Document<CallDriver>>;
