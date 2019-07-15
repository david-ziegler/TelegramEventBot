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
const rk = new Keyboard.ReplyKeyboard();
const ik = new Keyboard.InlineKeyboard();
rk.addRow("➕ Neues Event erstellen");
ik.addRow({ text: "👍 Zusagen", callback_data: ACTIONS.RSVP });
bot.onText(/\/start/i, msg => {
  bot.sendMessage(
    msg.chat.id,
    "Started Events Bot",
    rk.open({ resize_keyboard: true })
  );
});

// Trigger Create Event
bot.onText(/➕ Neues Event erstellen/i, msg => {
  bot.deleteMessage(msg.chat.id, msg.message_id);
  bot
    .sendMessage(
      msg.chat.id,
      "*Neues Event erstellen*\nGib eine Beschreibung mit Ort & Zeit ein und sende dann die Nachricht ab um das Event zu erstellen.",
      { parse_mode: "markdown" }
    )
    .then(createdMsg => {
      currentlyCreatingEventID = createEventIDFromMessage(createdMsg);
      console.log(
        "CurrentlyCreatingID, createdMsg",
        currentlyCreatingEventID
        // createdMsg
      );
    });
});

// Create Event
bot.on("message", msg => {
  if (currentlyCreatingEventID && msg.text !== "➕ Neues Event erstellen") {
    bot.deleteMessage(msg.chat.id, msg.message_id);
    bot
      .editMessageText(msg.text, {
        chat_id: getChatIDFromEventID(currentlyCreatingEventID),
        message_id: getMessageIDFromEventID(currentlyCreatingEventID),
        parse_mode: "markdown",
        ...ik.build()
      })
      .then(createdMsg => {
        const eventID = currentlyCreatingEventID;
        events[eventID] = {
          text: createdMsg.text,
          attendees: []
        };
        // bot.editMessageReplyMarkup(ik.build(), {
        //   chat_id: getChatIDFromEventID(currentlyCreatingEventID),
        //   message_id: getMessageIDFromEventID(currentlyCreatingEventID)
        // });
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
  s;
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
