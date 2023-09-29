import * as dotenv from 'dotenv';
import { join } from 'path';

const dotenvPath = join(__dirname, '../../../../.env');
dotenv.config({ path: dotenvPath });
process.env.DOTENV_CONFIG_PATH = dotenvPath;

