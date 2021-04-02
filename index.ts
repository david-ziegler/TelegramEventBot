import { config } from 'dotenv';

config();

import { bot } from './src/bot';
import { web } from './src/stuff/start-express';

web(bot);
