/// <reference types="mongoose/types/pipelinestage" />
/// <reference types="mongoose/types/connection" />
/// <reference types="mongoose/types/cursor" />
/// <reference types="mongoose/types/document" />
/// <reference types="mongoose/types/error" />
/// <reference types="mongoose/types/mongooseoptions" />
/// <reference types="mongoose/types/schemaoptions" />
import { Document, Model, Types } from 'mongoose';
export declare type FeedbackDocument = Feedback & Document;
export declare class Feedback {
    _id: Types.ObjectId;
    airtable_id: string;
    unique_id: string;
    url: string;
    date: Date;
    created_time: Date;
    time_received: string;
    tags?: string[];
    status?: string;
    whats_wrong?: string;
    main_section?: string;
    theme?: string;
}
export declare const FeedbackSchema: import("mongoose").Schema<Document<Feedback, any, any>, Model<Document<Feedback, any, any>, any, any, any>, {}, {}>;
export declare const feedbackModel: Model<Document<Feedback, any, any>, {}, {}, {}>;
export declare function getFeedbackModel(): Model<Document<Feedback>>;
