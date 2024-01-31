import Airtable from 'airtable';
import { AirtableBase } from 'airtable/lib/airtable_base';

export function getATClient(token: string = process.env.AIRTABLE_TOKEN) {
  try {

    return new Airtable({ apiKey: token });
  } catch (err) {
    console.error('env: ', process.env.AIRTABLE_TOKEN);
    console.error(err);
  }
}

export type AirTableAPI = Airtable;
export type AirtableAPIBase = AirtableBase;
