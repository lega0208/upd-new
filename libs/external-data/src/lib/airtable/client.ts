import Airtable from 'airtable';
import { AirtableBase } from 'airtable/lib/airtable_base';

export function getATClient(apiKey: string = process.env.AIRTABLE_API_KEY) {
  try {

    return new Airtable({ apiKey });
  } catch (err) {
    console.error('env: ', process.env.AIRTABLE_API_KEY);
    console.error(err);
  }
}

export type AirTableAPI = Airtable;
export type AirtableAPIBase = AirtableBase;
