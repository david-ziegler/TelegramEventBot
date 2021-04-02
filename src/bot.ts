
import TelegramBot, { CallbackQuery, EditMessageTextOptions, Message, SendMessageOptions, User } from 'node-telegram-bot-api';
import { InlineKeyboard, InlineKeyboardButton, Row } from 'node-telegram-keyboard-wrapper';
import packageInfo from '../package.json';
import { addEventAuthor, deleteMessage, getEventTextWithAttendees, getFullNameString, removeBotCommand, sanitize, shortenDescriptionIfTooLong } from './bot-util';
import { DB } from './db';
import { i18n } from './i18n';

const db = new DB();

const ACTIONS = {
  RSVP: 'RSVP',
  CANCEL_RSVP: 'CANCEL_RSVP',
};

const { NODE_ENV, DEV_BOT_TOKEN, PROD_BOT_TOKEN } = process.env;
if (DEV_BOT_TOKEN === undefined || PROD_BOT_TOKEN === undefined) {
  throw new Error('Environment variable "DEV_BOT_TOKEN" or "PROD_BOT_TOKEN" is not set.');
}
const production_mode = Boolean(NODE_ENV === 'production');
const bot_token = production_mode ? PROD_BOT_TOKEN : DEV_BOT_TOKEN;

export const bot = new TelegramBot(bot_token, { polling: true });
console.log(`Bot server started in the ${NODE_ENV} mode. Version ${packageInfo.version}`);

export const rsvpButtons = new InlineKeyboard();
rsvpButtons.push(
  new Row(new InlineKeyboardButton(i18n.buttons.rsvp, 'callback_data', ACTIONS.RSVP)),
  new Row(new InlineKeyboardButton(i18n.buttons.cancel_rsvp, 'callback_data', ACTIONS.CANCEL_RSVP)),
);

bot.onText(/^\/(E|e)vent.*/, async (msg: Message) => {
  await createEvent(msg);
});

async function createEvent(msg: Message): Promise<void> {
  if (msg.text === undefined || msg.from === undefined) {
    throw new Error(`Tried to create an event with an empty message-text. Message: ${msg}`);
  }
  const event_description = removeBotCommand(msg.text);
  const event_description_valid_length = shortenDescriptionIfTooLong(event_description);
  const event_description_with_author = addEventAuthor(event_description_valid_length, msg.from);
  const sanitized_event_description_with_author = sanitize(event_description_with_author);
  deleteMessage(bot, msg);
  const options: SendMessageOptions = {
    parse_mode: 'MarkdownV2',
    reply_markup: rsvpButtons.getMarkup(),
  };
  const created_msg = await bot.sendMessage(msg.chat.id, sanitized_event_description_with_author, options);
  await db.insertEvent(created_msg.chat.id, created_msg.message_id, sanitized_event_description_with_author);
}

bot.on('callback_query', (query: CallbackQuery) => {
  if (query.message === undefined) {
    throw new Error(`Tried to change RSVP-status, but query doesn't have a message object. Query: ${query}`);
  }
  if (query.data === ACTIONS.RSVP) {
    changeRSVPForUser(query.from, query.message, query.id, false);
  } else {
    changeRSVPForUser(query.from, query.message, query.id, true);
  }
});

async function changeRSVPForUser(user: User, msg: Message, queryID: string, cancellingRSVP: boolean) {
  const rsvpedAlready = await db.didThisUserRsvpAlready(msg.chat.id, msg.message_id, user.id);
  if (
    (cancellingRSVP && !rsvpedAlready) ||
    (!cancellingRSVP && rsvpedAlready)
  ) {
    bot.answerCallbackQuery(queryID, { text: '' });
    return;
  }
  const chat_id = msg.chat.id;
  const { message_id } = msg;
  const event = await db.getEvent(chat_id, message_id);
  if (event === undefined) {
    throw new Error(`Event could not be found in the database: chat_id=${chat_id}, message_id=${message_id}`);
  }
  if (!cancellingRSVP) {
    await db.rsvpToEvent(event.id, user.id, getFullNameString(user));
  } else {
    await db.removeRsvpFromEvent(event.id, user.id);
  }

  bot.answerCallbackQuery(queryID, { text: '' }).then(async () => {
    const attendees = await db.getAttendeesForEvent(chat_id, message_id);
    const eventTextWithAttendees = getEventTextWithAttendees(event.description, attendees);
    const options: EditMessageTextOptions = {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      parse_mode: 'MarkdownV2',
      reply_markup: rsvpButtons.getMarkup(),
    };
    bot.editMessageText(eventTextWithAttendees, options);
  });
}
