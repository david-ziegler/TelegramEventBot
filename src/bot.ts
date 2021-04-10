
import TelegramBot, { CallbackQuery, Message } from 'node-telegram-bot-api';
import packageInfo from '../package.json';
import { DB } from './db';
import { i18n } from './stuff/i18n';
import { ENV } from './stuff/environment-variables';
import { changeRSVPForUser, createEvent } from './usecases';

const db = new DB();

export const bot = new TelegramBot(ENV.BOT_TOKEN, { polling: true });
console.log(`Bot server started. Version ${packageInfo.version}. Production mode: ${ENV.PRODUCTION_MODE}`);

bot.onText(/^\/(E|e)vent.*/, async (message: Message) => {
  await createEvent(message, i18n, db, bot);
});

bot.on('callback_query', (query: CallbackQuery) => {
  changeRSVPForUser(query.message, query.id, query.from, query.data, i18n, db, bot);
});

