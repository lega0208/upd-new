import { readFile } from 'node:fs/promises';
import type { AuthParams } from '@dua-upd/types-common';

export const getAACredsPool = async (): Promise<AuthParams[]> =>
  await readFile(
    process.env.AA_KEY_POOL_PATH || 'keys/aa_creds_pool.json',
    'utf8',
  ).then(JSON.parse);
