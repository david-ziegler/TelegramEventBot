let Bot = require("node-telegram-bot-api");
let { InlineKeyboard } = require("node-telegram-keyboard-wrapper");
const i18n = require("./i18n");
const DB = require("./db");
const { sanitize } = require("./util");

const ACTIONS = {
  RSVP: "RSVP",
  CANCEL_RSVP: "CANCEL_RSVP"
};

let db = new DB();
db.initializeDB().then(() => console.log("Initialized DB"));

let bot;
if (process.env.NODE_ENV === "development") {
  const devBotToken = process.env.DEV_BOT_TOKEN;
  bot = new Bot(devBotToken, { polling: true });
} else {
  const prodBotToken = process.env.PROD_BOT_TOKEN;
  bot = new Bot(prodBotToken);
  bot.setWebHook(process.env.HEROKU_URL + prodBotToken);
}
console.log("Bot server started in the " + process.env.NODE_ENV + " mode");

const rsvpButtons = new InlineKeyboard();
rsvpButtons.addRow({
  text: i18n.buttons.rsvp,
  callback_data: ACTIONS.RSVP
});
rsvpButtons.addRow({
  text: i18n.buttons.cancel_rsvp,
  callback_data: ACTIONS.CANCEL_RSVP
});

bot.onText(/^\/(E|e)vent.*/, msg => {
  createEvent(msg);
});

bot.onText(/^\/edit_event.*/, msg => {
  editEvent(msg);
});

bot.on("callback_query", query => {
  if (query.data === ACTIONS.RSVP) {
    changeRSVPForUser(query.from, query.message, query.id, false);
  } else {
    changeRSVPForUser(query.from, query.message, query.id, true);
  }
});

function createEvent(msg) {
  const event_description = removeBotCommand(msg.text);
  const event_description_valid_length = shortenDescriptionIfTooLong(
    event_description
  );
  const event_description_with_author = addEventAuthor(
    event_description_valid_length,
    msg.from
  );

  const sanitized_event_description_with_author = sanitize(
    event_description_with_author
  );

  deleteMessage(msg);
  bot
    .sendMessage(msg.chat.id, sanitized_event_description_with_author, {
      parse_mode: "markdown",
      ...rsvpButtons.build()
    })
    .then(async created_msg => {
      const event_id = createEventIDFromMessage(created_msg);
      await db.insertEvent(
        event_id,
        created_msg.chat.id,
        created_msg.message_id,
        sanitized_event_description_with_author
      );
    });
}

function shortenDescriptionIfTooLong(description) {
  const MAX_LENGTH = 3500;
  if (description.length > MAX_LENGTH) {
    return description.substring(0, 3500) + "...";
  } else {
    return description;
  }
}

function removeBotCommand(text) {
  return text
    .replace("/event ", "")
    .replace("/Event", "")
    .replace("/edit_event", "");
}

function addEventAuthor(text, author) {
  return `${text}\n\n_${i18n.message_content.created_by} ${getFullNameString(
    author
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
    bot.answerCallbackQuery(queryID, { text: "" });
    return;
  }

  if (!cancellingRSVP) {
    await db.rsvpToEvent(event_id, user_id, getFullNameString(user));
  } else {
    await db.removeRsvpFromEvent(event_id, user_id);
  }

  bot.answerCallbackQuery(queryID, { text: "" }).then(async () => {
    const attendees = await db
      .getAttendeesByEventID(event_id)
      .then(res => res)
      .catch(err =>
        console.error(
          `Error while getting attendees from database: event_id=${event_id}`
        )
      );
    const eventTextWithAttendees = getEventTextWithAttendees(
      event.description,
      attendees
    );
    bot.editMessageText(eventTextWithAttendees, {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      parse_mode: "markdown",
      ...rsvpButtons.build()
    });
  });
}

async function didThisUserRsvpAlready(event_id, user_id) {
  const events_attended_to = await db.getAttendeeByEventIDAndUserID(
    event_id,
    user_id
  );
  return events_attended_to.length > 0;
}

function getFullNameString(user) {
  if (!user.first_name && !user.last_name) {
    return sanitize(user.username);
  }
  return [sanitize(user.first_name), sanitize(user.last_name)]
    .filter(namePart => namePartIsPresent(namePart))
    .join(" ");
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
    ""
  )}`;
}

module.exports = bot;
