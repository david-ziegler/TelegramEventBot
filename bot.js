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

// Create Event
bot.onText(/\/event/i, msg => {
  bot.sendMessage(
    msg.chat.id,
    "Event: " + msg.text.replace("/event ", ""),
    ik.build()
  );
});

// RSVP to Event
bot.on("callback_query", query => {
  const newText = `${query.message.text}\n\n${query.from.first_name} ${
    query.from.last_name
  } (${query.from.username})`;
  console.log(
    "editMessage:",
    query.message.text,
    query.from.first_name,
    query.message.message_id,
    newText
  );
  bot
    .answerCallbackQuery(query.id, { text: "Action received!" })
    .then(function() {
      console.log("query", query);
      bot.editMessageText(newText, {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id
      });
    });
});

module.exports = bot;
