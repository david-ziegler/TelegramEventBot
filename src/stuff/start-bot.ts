
import packageInfo from '../../package.json';
import TelegramBot from 'node-telegram-bot-api';

const { NODE_ENV, DEV_BOT_TOKEN, PROD_BOT_TOKEN } = process.env;
if (DEV_BOT_TOKEN === undefined || PROD_BOT_TOKEN === undefined) {
  throw new Error('Environment variable "DEV_BOT_TOKEN" or "PROD_BOT_TOKEN" is not set.');
}
const production_mode = Boolean(NODE_ENV === 'production');
const bot_token = production_mode ? PROD_BOT_TOKEN : DEV_BOT_TOKEN;

export const bot = new TelegramBot(bot_token, { polling: true });
console.log(`Bot server started in the ${NODE_ENV} mode. Version ${packageInfo.version}`);
