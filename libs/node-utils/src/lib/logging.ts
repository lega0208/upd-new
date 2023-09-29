import { existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { prettyJson } from '@dua-upd/utils-common';

const logDir = './logs';

export const writeLogFile = async (filename: string, data: unknown) => {
  try {
    if (!existsSync(logDir)) {
      await mkdir(logDir);
    }

    const filepath = `${logDir}/${filename}.json`;

    await writeFile(filepath, prettyJson(data), 'utf8');
  } catch (err) {
    console.error(err);
  }
}
