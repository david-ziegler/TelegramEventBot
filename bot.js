const Bot = require("node-telegram-bot-api");
// const Keyboard = require("node-telegram-keyboard-wrapper");
const token = process.env.TOKEN;
let bot;

if (process.env.NODE_ENV === "production") {
  bot = new Bot(token);
  bot.setWebHook(process.env.HEROKU_URL + bot.token);
} else {
  bot = new Bot(token, { polling: true });
}

console.log("Bot server started in the " + process.env.NODE_ENV + " mode");

bot.on("message", msg => {
  const newChatMembers = msg.new_chat_members;
  if (newChatMembers) {
    newChatMembers.forEach(newChatMember => {
      bot.sendMessage(
        newChatMember.id,
        "🌞 *Willkommen beim Rainbow Circle!*\n\nSingkreise etc. im Park.\n\nRegeln für die Telegram-Gruppe:\nDa sehr viele Menschen in dieser Gruppe sind, schreibe nur eine Nachricht wenn es folgendes ist:\n- eine Einladung zum Singkreis oder ähnlichem Treffen mit Ort & Zeit\n- Zusagen (keine Absagen)\n- Doodle-Link zur Termin-Findung.\n\nBei Fragen oder sonstigem, ruf mich an oder schreibe mir: 0156776801234, @david\\_ziegler",
        {
          parse_mode: "markdown"
        }
      );
    });
  }
});

// const rk = new Keyboard.ReplyKeyboard();
// const ik = new Keyboard.InlineKeyboard();
// rk.addRow("➕ Neues Event erstellen");
// ik.addRow({ text: "👍 Zusagen", callback_data: "Works!" });
// bot.onText(/\/start/i, msg => {
//   bot.sendMessage(
//     msg.chat.id,
//     "Started Events Bot",
//     rk.open({ resize_keyboard: true })
//   );
// });

// bot.onText(/\/event/i, msg => {
//   bot.sendMessage(
//     msg.chat.id,
//     "Event: " + msg.text.replace("/event ", ""),
//     ik.build()
//   );
// });

module.exports = bot;
