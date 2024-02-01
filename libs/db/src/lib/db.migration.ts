/*
 * For persisting stages of migrations/updates, to be able to resume
 *  after failure, retry, rollback, etc.
 */
import { model, Schema, Types } from 'mongoose';

export type MigrationState<T = unknown> = MigrationStage & {
  _id: Types.ObjectId;
  stages: MigrationStage[];
  contextData?: T;
}

export type MigrationStage<T = unknown> = {
  name: string;
  contextData?: T;
  status: 'pending' | 'running' | 'failed' | 'completed';
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

export const migrationStateSchema = new Schema<MigrationState>({
  name: { type: String, required: true },
  status: { type: String, required: true },
  startedAt: { type: Date, required: true },
  completedAt: { type: Date },
  error: { type: String },
  stages: [
    {
      name: { type: String, required: true },
      status: { type: String, required: true },
      startedAt: { type: Date, required: true },
      completedAt: { type: Date },
      error: { type: String },
    },
  ],
});

export const migrationModel = model<MigrationState>(
  'MigrationState',
  migrationStateSchema
);
