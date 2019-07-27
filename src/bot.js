let Bot = require("node-telegram-bot-api");
let { InlineKeyboard } = require("node-telegram-keyboard-wrapper");
const i18n = require("./i18n");
const { pretty } = require("./util");

const ACTIONS = {
  RSVP: "RSVP",
  CANCEL_RSVP: "CANCEL_RSVP"
};

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

let events = {};

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
    rsvpToEvent(query.from, query.message, query.id);
  } else {
    cancelRsvp(query.from, query.message, query.id);
  }
});

function createEvent(msg) {
  const eventDescription = removeBotCommand(msg.text);
  const eventDescriptionWithAuthor = addEventAuthor(eventDescription, msg.from);
  deleteMessage(msg);
  bot
    .sendMessage(msg.chat.id, eventDescriptionWithAuthor, {
      parse_mode: "markdown",
      ...rsvpButtons.build()
    })
    .then(createdMsg => {
      const eventID = createEventIDFromMessage(createdMsg);
      events[eventID] = {
        text: eventDescriptionWithAuthor,
        attendees: []
      };
    });
}

function removeBotCommand(text) {
  return text
    .replace("/event ", "")
    .replace("/Event", "")
    .replace("/edit_event", "");
}

function addEventAuthor(text, author) {
  return `${text}\n\n_${i18n.messageContent.created_by} ${getFullNameString(
    author
  )}_`;
}

function deleteMessage(msg) {
  bot.deleteMessage(msg.chat.id, msg.message_id);
}

function rsvpToEvent(user, msg, queryID) {
  const eventID = createEventIDFromMessage(msg);
  if (!events[eventID]) {
    console.error(`RSVP: event doesn't exist. user: ${user.username},
eventID: ${eventID}, events: ${pretty(events)}`);
    bot.answerCallbackQuery(queryID, { text: i18n.errors.generic });
  }
  if (!rsvpedAlready(eventID, user)) {
    events[eventID].attendees = getAttendeeListWithUserAdded(
      events[eventID].attendees,
      user
    );
    bot.answerCallbackQuery(queryID, { text: "" }).then(function() {
      bot.editMessageText(getEventTextWithAttendees(events[eventID]), {
        chat_id: msg.chat.id,
        message_id: msg.message_id,
        parse_mode: "markdown",
        ...rsvpButtons.build()
      });
    });
  } else {
    bot.answerCallbackQuery(queryID, { text: "" });
  }
}

function cancelRsvp(user, msg, queryID) {
  const eventID = createEventIDFromMessage(msg);
  if (!events[eventID]) {
    console.error(`CANCEL_RSVP: event doesn't exist. user: ${user.username},
eventID: ${eventID}, events: ${pretty(events)}`);
    bot.answerCallbackQuery(queryID, { text: i18n.errors.generic });
  }
  if (rsvpedAlready(eventID, user)) {
    removeUserFromAttendeeList(events[eventID].attendees, user);
    bot.answerCallbackQuery(queryID, { text: "" }).then(function() {
      bot.editMessageText(getEventTextWithAttendees(events[eventID]), {
        chat_id: msg.chat.id,
        message_id: msg.message_id,
        parse_mode: "markdown",
        ...rsvpButtons.build()
      });
    });
  } else {
    bot.answerCallbackQuery(queryID, {
      text: ""
    });
  }
}

function rsvpedAlready(eventID, user) {
  const nameOfNewAttendee = getFullNameString(user);
  return events[eventID].attendees.includes(nameOfNewAttendee);
}

function getAttendeeListWithUserAdded(originalAttendees, user) {
  const nameOfNewAttendee = getFullNameString(user);
  if (originalAttendees.includes(nameOfNewAttendee)) {
    return originalAttendees;
  } else {
    return originalAttendees.concat(nameOfNewAttendee);
  }
}

function removeUserFromAttendeeList(originalAttendees, user) {
  const nameOfNewAttendee = getFullNameString(user);
  if (originalAttendees.includes(nameOfNewAttendee)) {
    originalAttendees.splice(originalAttendees.indexOf(nameOfNewAttendee), 1);
  }
  return;
}

function getFullNameString(user) {
  return [user.first_name, user.last_name]
    .filter(namePart => namePartIsPresent(namePart))
    .join(" ");
}

function namePartIsPresent(namePart) {
  return !!namePart;
}

function createEventIDFromMessage(msg) {
  return `${msg.chat.id}_${msg.message_id}`;
}

function getEventTextWithAttendees(event) {
  return `${event.text}\n\n*${
    i18n.messageContent.rsvps
  }:*${event.attendees.reduce(
    (attendeesString, attendee) => `${attendeesString}\n${attendee}`,
    ""
  )}`;
}

module.exports = bot;
