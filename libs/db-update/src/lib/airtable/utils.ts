import { Types } from 'mongoose';
import { PageData } from '@dua-upd/external-data';
import { UxApiDataType, UxDataType } from './types';

export function assertObjectId(
  value: UxDataType[] | Types.ObjectId[]
): asserts value is Types.ObjectId[] {
  for (const item of value) {
    if (!(item instanceof Types.ObjectId)) {
      throw new Error('Not an ObjectId');
    }
  }
}

export function assertHasUrl(value: UxApiDataType[]): asserts value is PageData[] {
  if (!value.every((doc) => 'url' in doc)) {
    throw new Error('No URL');
  }
}
