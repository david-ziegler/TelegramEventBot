const Bot = require("node-telegram-bot-api");
const Keyboard = require("node-telegram-keyboard-wrapper");
const token = process.env.TOKEN;
const ACTIONS = {
  RSVP: "RSVP"
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
let currentlyCreatingEventID = null;

// Show "Add Event"-Button
bot.onText(/\/start/i, msg => {
  const replyKeyboard = new Keyboard.ReplyKeyboard();
  replyKeyboard.addRow("➕ Neues Event erstellen");
  console.log("open reply keyboard");
  bot.sendMessage(
    msg.chat.id,
    "Ein Bot zum Erstellen von Events wurde hinzugefügt. Gib \\event ein, um ein neues Event zu erstellen oder drücke auf den entsprechenden Button unten.",
    replyKeyboard.open({ resize_keyboard: true })
  );
});

// Trigger Create Event
bot.onText(/(➕ Neues Event erstellen|\/event)/, msg => {
  if (!currentlyCreatingEventID) {
    bot.deleteMessage(msg.chat.id, msg.message_id);
    bot
      .sendMessage(
        msg.chat.id,
        "*Neues Event erstellen*\nGib eine Beschreibung mit Ort & Zeit ein und sende dann die Nachricht ab um das Event zu erstellen.",
        { parse_mode: "markdown" }
      )
      .then(createdMsg => {
        currentlyCreatingEventID = createEventIDFromMessage(createdMsg);
      });
  }
});

// Create Event
bot.on("message", msg => {
  if (currentlyCreatingEventID && msg.text !== "➕ Neues Event erstellen") {
    bot.deleteMessage(msg.chat.id, msg.message_id);
    const inlineKeyboard = new Keyboard.InlineKeyboard();
    inlineKeyboard.addRow({ text: "👍  zusagen", callback_data: ACTIONS.RSVP });
    bot
      .editMessageText(msg.text, {
        chat_id: getChatIDFromEventID(currentlyCreatingEventID),
        message_id: getMessageIDFromEventID(currentlyCreatingEventID),
        parse_mode: "markdown",
        ...inlineKeyboard.build()
      })
      .then(createdMsg => {
        const eventID = currentlyCreatingEventID;
        events[eventID] = {
          text: createdMsg.text,
          attendees: []
        };
        currentlyCreatingEventID = null;
      });
  }
});

// RSVP to Event
bot.on("callback_query", query => {
  const nameOfNewAttendee = getFullNameString(query.from);
  const eventID = createEventIDFromMessage(query.message);
  attendees = events[eventID].attendees.concat(nameOfNewAttendee);
  events[eventID].attendees = attendees;
  bot
    .answerCallbackQuery(query.id, { text: "Action received!" })
    .then(function() {
      bot.editMessageText(getEventTextWithAttendees(events[eventID]), {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        parse_mode: "markdown"
      });
    });
});

function getFullNameString(user) {
  return `${user.first_name} ${user.last_name} (${getCleanMarkdownReadyUsername(
    user.username
  )})`;
}

function createEventIDFromMessage(message) {
  return `${message.chat.id}-${message.message_id}`;
}

function getChatIDFromEventID(eventID) {
  return eventID.split("-")[0];
}

function getMessageIDFromEventID(eventID) {
  return eventID.split("-")[1];
}

function getCleanMarkdownReadyUsername(username) {
  return `@${username.replace(/_/g, "\\_")}`;
}

function getEventTextWithAttendees(event) {
  return `${event.text}\n\n*Zusagen:*${event.attendees.reduce(
    (attendeesString, attendee) => `${attendeesString}\n${attendee}`,
    ""
  )}`;
}

module.exports = bot;
