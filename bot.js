const Bot = require("node-telegram-bot-api");
const Keyboard = require("node-telegram-keyboard-wrapper");
const token = process.env.TOKEN;
const ACTIONS = {
  ACCEPT: "ACCEPT",
  DECLINE: "DECLINE"
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

const acceptDeclineButtons = new Keyboard.InlineKeyboard();
acceptDeclineButtons.addRow({
  text: "👍 zusagen",
  callback_data: ACTIONS.ACCEPT
});
acceptDeclineButtons.addRow({
  text: "🚫 absagen",
  callback_data: ACTIONS.DECLINE
});

bot.on("message", msg => {
  if (isEventText(msg.text)) {
    createEvent(msg);
  } else {
    deleteMessage(msg);
  }
});

function isEventText(text) {
  return text.indexOf("/event") === 0 || text.indexOf("/Event") === 0;
}

function createEvent(msg) {
  const eventDescription = removeBotCommand(msg.text);
  deleteMessage(msg);
  bot
    .sendMessage(msg.chat.id, eventDescription, {
      parse_mode: "markdown",
      ...acceptDeclineButtons.build()
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
  return text.replace("/event ", "").replace("/Event", "");
}

function deleteMessage(msg) {
  bot.deleteMessage(msg.chat.id, msg.message_id);
}

// ACCEPT to Event
bot.on("callback_query", query => {
  if (query.data === ACTIONS.ACCEPT) {
    acceptInvitation(query.from, query.message, query.id);
  } else {
    declineInvitation(query.from, query.message, query.id);
  }
});

function acceptInvitation(acceptingUser, msg, queryID) {
  const eventID = createEventIDFromMessage(msg);
  if (!rsvpedAlready(eventID, acceptingUser)) {
    events[eventID].attendees = getAttendeeListWithUserAdded(
      events[eventID].attendees,
      acceptingUser
    );
    bot.answerCallbackQuery(queryID, { text: "" }).then(function() {
      bot.editMessageText(getEventTextWithAttendees(events[eventID]), {
        chat_id: msg.chat.id,
        message_id: msg.message_id,
        parse_mode: "markdown",
        ...acceptDeclineButtons.build()
      });
    });
  }
}

function declineInvitation(decliningUser, msg, queryID) {
  const eventID = createEventIDFromMessage(msg);
  if (rsvpedAlready(eventID, decliningUser)) {
    removeUserFromAttendeeList(events[eventID].attendees, decliningUser);
    bot.answerCallbackQuery(queryID, { text: "" }).then(function() {
      bot.editMessageText(getEventTextWithAttendees(events[eventID]), {
        chat_id: msg.chat.id,
        message_id: msg.message_id,
        parse_mode: "markdown",
        ...acceptDeclineButtons.build()
      });
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
  return `${event.text}\n\n*Zusagen:*${event.attendees.reduce(
    (attendeesString, attendee) => `${attendeesString}\n${attendee}`,
    ""
  )}`;
}

module.exports = bot;
