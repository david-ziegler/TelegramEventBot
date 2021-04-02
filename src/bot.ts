
import { CallbackQuery, EditMessageTextOptions, Message, SendMessageOptions, User } from 'node-telegram-bot-api';
import { InlineKeyboard, InlineKeyboardButton, Row } from 'node-telegram-keyboard-wrapper';
import { addEventAuthor, createEventIDFromMessage, getEventTextWithAttendees, getFullNameString, removeBotCommand, sanitize, shortenDescriptionIfTooLong } from './bot-util';
import { i18n } from './i18n';
import { bot, db } from './stuff/start-bot';

const ACTIONS = {
  RSVP: 'RSVP',
  CANCEL_RSVP: 'CANCEL_RSVP',
};

export const rsvpButtons = new InlineKeyboard();
rsvpButtons.push(
  new Row(new InlineKeyboardButton(i18n.buttons.rsvp, 'callback_data', ACTIONS.RSVP)),
  new Row(new InlineKeyboardButton(i18n.buttons.cancel_rsvp, 'callback_data', ACTIONS.CANCEL_RSVP)),
);

bot.onText(/^\/(E|e)vent.*/, (msg: Message) => {
  createEvent(msg);
});

function createEvent(msg: Message): void {
  const event_description = removeBotCommand(msg.text);
  const event_description_valid_length = shortenDescriptionIfTooLong(
    event_description,
  );
  const event_description_with_author = addEventAuthor(event_description_valid_length, msg.from);

  const sanitized_event_description_with_author = sanitize(event_description_with_author);
  deleteMessage(msg);
  const options: SendMessageOptions = {
    parse_mode: 'MarkdownV2',
    reply_markup: rsvpButtons.getMarkup(),
  };
  bot.sendMessage(msg.chat.id, sanitized_event_description_with_author, options)
    .then(async (created_msg: Message) => {
      const event_id = createEventIDFromMessage(created_msg);
      await db.insertEvent(
        event_id,
        created_msg.chat.id.toString(),
        created_msg.message_id.toString(),
        sanitized_event_description_with_author,
      );
    });
}

function deleteMessage(msg: Message): void {
  bot.deleteMessage(msg.chat.id, msg.message_id.toString());
}

bot.on('callback_query', (query: CallbackQuery) => {
  if (query.data === ACTIONS.RSVP) {
    changeRSVPForUser(query.from, query.message, query.id, false);
  } else {
    changeRSVPForUser(query.from, query.message, query.id, true);
  }
});

async function changeRSVPForUser(user: User, msg: Message, queryID: string, cancellingRSVP: boolean) {
  const user_id = user.id.toString();
  const event_id = createEventIDFromMessage(msg);
  const event = await db.getEvent(event_id);

  const rsvpedAlready = await didThisUserRsvpAlready(event_id, user_id);
  if (
    (cancellingRSVP && !rsvpedAlready) ||
    (!cancellingRSVP && rsvpedAlready)
  ) {
    bot.answerCallbackQuery(queryID, { text: '' });
    return;
  }

  if (!cancellingRSVP) {
    await db.rsvpToEvent(event_id, user_id, getFullNameString(user));
  } else {
    await db.removeRsvpFromEvent(event_id, user_id);
  }

  bot.answerCallbackQuery(queryID, { text: '' }).then(async () => {
    const attendees = await db.getAttendeesByEventID(event_id);
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

export async function didThisUserRsvpAlready(event_id: string, user_id: string): Promise<boolean> {
  const events_attended_to = await db.getAttendeesByEventIDAndUserID(event_id, user_id);
  return events_attended_to.length > 0;
}