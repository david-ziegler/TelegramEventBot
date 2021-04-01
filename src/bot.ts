import * as Bot from 'node-telegram-bot-api';
import { InlineKeyboard, InlineKeyboardButton, Row } from 'node-telegram-keyboard-wrapper';
import { i18n } from './i18n';
import { DB } from './db';
import { sanitize } from './util';
import * as packageInfo from '../package.json';

const { NODE_ENV, DEV_BOT_TOKEN, PROD_BOT_TOKEN } = process.env;

const ACTIONS = {
  RSVP: 'RSVP',
  CANCEL_RSVP: 'CANCEL_RSVP',
};

const db = new DB();
db.initializeDB().then(() => console.log('Initialized DB'));

export let bot;
if (NODE_ENV === 'development') {
  bot = new Bot(DEV_BOT_TOKEN, { polling: true });
} else {
  bot = new Bot(PROD_BOT_TOKEN, { polling: true });
}
console.log(`Bot server started in the ${NODE_ENV} mode. Version ${packageInfo.version}`);

const rsvpButtons = new InlineKeyboard();
rsvpButtons.push(
  new Row(new InlineKeyboardButton(i18n.buttons.rsvp, 'callback_data', ACTIONS.RSVP)),
  new Row(new InlineKeyboardButton(i18n.buttons.cancel_rsvp, 'callback_data', ACTIONS.CANCEL_RSVP)),
);

bot.onText(/^\/(E|e)vent.*/, msg => {
  createEvent(msg);
});

bot.on('callback_query', query => {
  if (query.data === ACTIONS.RSVP) {
    changeRSVPForUser(query.from, query.message, query.id, false);
  } else {
    changeRSVPForUser(query.from, query.message, query.id, true);
  }
});

function createEvent(msg) {
  const event_description = removeBotCommand(msg.text);
  const event_description_valid_length = shortenDescriptionIfTooLong(
    event_description,
  );
  const event_description_with_author = addEventAuthor(
    event_description_valid_length,
    msg.from,
  );

  const sanitized_event_description_with_author = sanitize(
    event_description_with_author,
  );
  deleteMessage(msg);
  bot.sendMessage(msg.chat.id, sanitized_event_description_with_author, {
    parse_mode: 'markdown',
    ...rsvpButtons.getMarkup(),
  })
    .then(async created_msg => {
      const event_id = createEventIDFromMessage(created_msg);
      await db.insertEvent(
        event_id,
        created_msg.chat.id,
        created_msg.message_id,
        sanitized_event_description_with_author,
      );
    });
}

function shortenDescriptionIfTooLong(description) {
  const MAX_LENGTH = 3500;
  if (description.length > MAX_LENGTH) {
    return description.substring(0, 3500) + '...';
  } else {
    return description;
  }
}

function removeBotCommand(text) {
  return text.replace(/^\/(E|e)vent( |\n)?/, '');
}

function addEventAuthor(text, author) {
  return `${text}\n\n_${i18n.message_content.created_by} ${getFullNameString(
    author,
  )}_`;
}

function deleteMessage(msg) {
  bot.deleteMessage(msg.chat.id, msg.message_id);
}

async function changeRSVPForUser(user, msg, queryID, cancellingRSVP) {

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
    const attendees = await db
      .getAttendeesByEventID(event_id)
      .catch(() =>
        console.error(
          `Error while getting attendees from database: event_id=${event_id}`,
        ),
      );
    const eventTextWithAttendees = getEventTextWithAttendees(event.description, attendees);
    bot.editMessageText(eventTextWithAttendees, {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      parse_mode: 'markdown',
      ...rsvpButtons.getMarkup(),
    });
  });
}

async function didThisUserRsvpAlready(event_id, user_id) {
  const events_attended_to = await db.getAttendeesByEventIDAndUserID(event_id, user_id);
  return events_attended_to.length > 0;
}

function getFullNameString(user) {
  if (!user.first_name && !user.last_name) {
    return sanitize(user.username);
  }
  return [sanitize(user.first_name), sanitize(user.last_name)]
    .filter(namePart => namePartIsPresent(namePart))
    .join(' ');
}

function namePartIsPresent(namePart) {
  return !!namePart;
}

function createEventIDFromMessage(msg) {
  return `${msg.chat.id}_${msg.message_id}`;
}

function getEventTextWithAttendees(description, attendees) {
  return `${description}\n\n*${i18n.message_content.rsvps}:*${attendees.reduce(
    (attendeesString, attendeeRow) =>
      `${attendeesString}\n${attendeeRow.full_name}`,
    '',
  )}`;
}

