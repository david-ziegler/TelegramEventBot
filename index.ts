import { config } from 'dotenv';

config();

import { bot } from './src/bot';
import { web } from './src/web';

web(bot);
