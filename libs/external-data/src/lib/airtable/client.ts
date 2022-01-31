import path from 'path';
import Airtable from 'airtable';
import { AirtableBase } from 'airtable/lib/airtable_base';

export function getATClient() {
  return new Airtable({ apiKey: process.env.AIRTABLE_API_KEY });
}

export type AirTableAPI = Airtable;
export type AirtableAPIBase = AirtableBase;
