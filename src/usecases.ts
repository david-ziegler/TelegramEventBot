/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import TelegramBot, { EditMessageTextOptions, Message, SendMessageOptions, User } from 'node-telegram-bot-api';
import { InlineKeyboard, InlineKeyboardButton, Row } from 'node-telegram-keyboard-wrapper';
import { createEventDescription, getEventTextWithAttendees, getFullNameString } from './core';
import { DB } from './db';
import { Action } from './models';

export async function createEvent(message: Message, i18n: any, db: DB, bot: TelegramBot) {
  const event_description = createEventDescription(message, i18n);
  deleteMessage(bot, message);
  const options: SendMessageOptions = {
    parse_mode: 'MarkdownV2',
    reply_markup: rsvpButtons(i18n.buttons.rsvp, i18n.buttons.cancel_rsvp).getMarkup(),
  };
  const created_message = await bot.sendMessage(message.chat.id, event_description, options);
  await db.insertEvent(created_message.chat.id, created_message.message_id, event_description);
}

function rsvpButtons(rsvp_label: string, cancel_label: string) {
  const buttons = new InlineKeyboard();
  buttons.push(
    new Row(new InlineKeyboardButton(rsvp_label, 'callback_data', Action.RSVP)),
    new Row(new InlineKeyboardButton(cancel_label, 'callback_data', Action.CANCEL_RSVP)),
  );
  return buttons;
}

function deleteMessage(bot: TelegramBot, message: Message): void {
  bot.deleteMessage(message.chat.id, message.message_id.toString());
}

export async function changeRSVPForUser(
  message: Message | undefined,
  query_id: string,
  user: User,
  query_data: string | undefined,
  i18n: any,
  db: DB,
  bot: TelegramBot,
) {
  if (message === undefined) {
    throw new Error(`Tried to change RSVP-status, but 'message'-object is undefined.`);
  }
  if (query_data === undefined) {
    throw new Error(`Tried to change RSVP-status, but 'data' is undefined. Expected: 'RSVP' or 'CANCEL_RSVP'`);
  }
  const rsvpedAlready = await db.didThisUserRsvpAlready(message.chat.id, message.message_id, user.id);
  const cancellingRSVP = (query_data === Action.CANCEL_RSVP);
  if (
    (cancellingRSVP && !rsvpedAlready) ||
    (!cancellingRSVP && rsvpedAlready)
  ) {
    bot.answerCallbackQuery(query_id, { text: '' });
    return;
  }
  const chat_id = message.chat.id;
  const { message_id } = message;
  const event = await db.getEvent(chat_id, message_id);
  if (event === undefined) {
    throw new Error(`Event could not be found in the database: chat_id=${chat_id}, message_id=${message_id}`);
  }
  if (!cancellingRSVP) {
    await db.rsvpToEvent(event.id, user.id, getFullNameString(user));
  } else {
    await db.removeRsvpFromEvent(event.id, user.id);
  }

  bot.answerCallbackQuery(query_id, { text: '' }).then(async () => {
    const attendees = await db.getAttendeesForEvent(chat_id, message_id);
    const eventTextWithAttendees = getEventTextWithAttendees(event.description, attendees, i18n.message_content.rsvps);
    const options: EditMessageTextOptions = {
      chat_id: message.chat.id,
      message_id: message.message_id,
      parse_mode: 'MarkdownV2',
      reply_markup: rsvpButtons(i18n.buttons.rsvp, i18n.buttons.cancel_rsvp).getMarkup(),
    };
    bot.editMessageText(eventTextWithAttendees, options);
  });
}

