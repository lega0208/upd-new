import Airtable from 'airtable';
import { AirtableBase } from 'airtable/lib/airtable_base';

export function getATClient(apiKey: string = process.env.AIRTABLE_API_KEY) {
  return new Airtable({ apiKey });
}

export type AirTableAPI = Airtable;
export type AirtableAPIBase = AirtableBase;
