import { config } from 'dotenv';

config();

import { bot } from './src/stuff/start-bot';
import { web } from './src/stuff/start-express';

web(bot);
