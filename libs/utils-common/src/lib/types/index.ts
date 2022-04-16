/*
 * Type utilities
 */
import { Types } from 'mongoose';

/**
 * Returns an interface with only the properties of the given type
 */
export type PickByType<T, Value> = {
  [P in keyof T as T[P] extends Value | undefined ? P : never]: T[P]
}

export type WithObjectId<T> = T & { _id: Types.ObjectId };

export type OmitId<T> = Omit<T, '_id'>;
