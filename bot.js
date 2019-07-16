const Bot = require("node-telegram-bot-api");
const Keyboard = require("node-telegram-keyboard-wrapper");
const token = process.env.TOKEN;
const ACTIONS = {
  RSVP: "RSVP",
  START_CREATING_EVENT: "START_CREATING_EVENT",
  DONT_CREATE_EVENT: "DONT_CREATE_EVENT"
};

let bot;
if (process.env.NODE_ENV === "production") {
  bot = new Bot(token);
  bot.setWebHook(process.env.HEROKU_URL + bot.token);
} else {
  bot = new Bot(token, { polling: true });
}
console.log("Bot server started in the " + process.env.NODE_ENV + " mode");

let events = {};

const rsvpButton = new Keyboard.InlineKeyboard();
rsvpButton.addRow({ text: "👍  zusagen", callback_data: ACTIONS.RSVP });
const yesNoButtons = new Keyboard.InlineKeyboard();
yesNoButtons.addRow({
  text: "ja",
  callback_data: ACTIONS.START_CREATING_EVENT
});
yesNoButtons.addRow({ text: "nein", callback_data: ACTIONS.DONT_CREATE_EVENT });

bot.on("message", msg => {
  if (isEventText(msg.text)) {
    createEvent(msg);
  } else {
    deleteMessage(msg);
  }
});

function isEventText(text) {
  return text.indexOf("/event") === 0;
}

function createEvent(msg) {
  const eventDescription = removeBotCommand(msg.text);
  deleteMessage(msg);
  bot
    .sendMessage(msg.chat.id, eventDescription, {
      parse_mode: "markdown",
      ...rsvpButton.build()
    })
    .then(createdMsg => {
      const eventID = createEventIDFromMessage(createdMsg);
      events[eventID] = {
        text: eventDescription,
        attendees: []
      };
    });
}

function removeBotCommand(text) {
  return text.replace("/event ", "");
}

function deleteMessage(msg) {
  bot.deleteMessage(msg.chat.id, msg.message_id);
}

// RSVP to Event
bot.on("callback_query", query => {
  const nameOfNewAttendee = getFullNameString(query.from);
  const eventID = createEventIDFromMessage(query.message);
  attendees = events[eventID].attendees.concat(nameOfNewAttendee);
  events[eventID].attendees = attendees;
  bot.answerCallbackQuery(query.id, { text: "" }).then(function() {
    bot.editMessageText(getEventTextWithAttendees(events[eventID]), {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      parse_mode: "markdown",
      ...rsvpButton.build()
    });
  });
});

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
  return `${event.text}\n\n*Zusagen:*${event.attendees.reduce(
    (attendeesString, attendee) => `${attendeesString}\n${attendee}`,
    ""
  )}`;
}

module.exports = bot;
