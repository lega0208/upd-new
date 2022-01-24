import path from 'path';
import { auth, searchconsole_v1 } from '@googleapis/searchconsole';

const authClient = new auth.GoogleAuth({
  scopes: [
    'https://www.googleapis.com/auth/webmasters',
    'https://www.googleapis.com/auth/webmasters.readonly',
  ],
});

export function getGscClient() {
  return new searchconsole_v1.Searchconsole({ auth: authClient });
}

export type Searchconsole = searchconsole_v1.Searchconsole;
