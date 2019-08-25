# Create Events in Telegram Groups (Bot)

With this bot you can create events in Telegram groups. People can RSVP to the event just by clicking on "zusagen" (it's currently only available in German).

This makes it possible to get much less notifications in large groups. Instead of everyone writing "I'm in" etc. they can click on "zusagen" for which no extra notifications are created. It just shows a nice overview of everyone who already RSVP-ed.

![Screenshot1](https://user-images.githubusercontent.com/3832093/63649676-de203d80-c740-11e9-8d3c-e6f9cd8effef.jpg)


## How to add it to your group

1. Open the Telegram group in which you would like to enable events.
2. Open group "Info" and click "Edit" to go to group settings.
3. Click on "Administrators" and "Add Admin"
4. Type "@create_events_bot" in the search and click on "CreateEventsBot".
5. Give the CreateEventsBot the right to "Delete Messages", everything else you can disable if you want.
   The bot needs delete rights to work nicely since it deletes messages that start with "/event" and replaces them with the actual event. It will not delete anything else.
6. Click on "Done" to add the bot to the group. It might ask whether you want to first add the bot as a member to the group and then promote it to admin. In that case click yes.

## How to create an event

1. In the group, type "/event Blablabla" as a message and send it. This will create an event with the description "Blablabla".
2. Now people can RSVP by clicking on "Zusagen" or revert that by clicking on "doch nicht".

If you first want to try out how to use the bot, you can simply start a private message with @create_events_bot and create an event there that only you will see.

In the event description you can also use markdown (e.g. _bold_ text) and several lines (with Shift+Enter on a Computer you create a next line without sending the message) and of course emojis. More information on possible markdown styles here: https://core.telegram.org/bots/api#markdown-style.

Currently, you can't edit or delete events. If you are a developer, Pull Requests are welcome.

## Contributing

### Local development

Clone this repository and make any code changess to `bot.js`. In the terminal, go to the app's folder with `cd createEventsBot` and run

```
npm install
npm run start
```

Now you can open Telegram (on the computer or phone) and use the bot (like in "How to create an event"). Whenever you make changes to the code and you want to try them in Telegram, you need to run `npm run start` again.

Troubleshooting: if `npm install` doesn't work you might want to try `sudo npm install`.

### Create your own bot with your changes

1. Follow the steps under "Local development"
2. Create a new bot with [BotFather](https://core.telegram.org/bots#3-how-do-i-create-a-bot) and grab your TOKEN.
3. Rename `.env_example` file into `.env` and set `DEV_BOT_TOKEN` to the token, you've got from BotFather.
   (You may also create two different bots and use one token for local development (`DEV_BOT_TOKEN`) and one for production (the deployed bot) (`PROD_BOT_TOKEN`)).

### Deploy your bot to the heroku server

1. Create a [Heroku account](https://heroku.com) and install the [Heroku Toolbelt](https://toolbelt.heroku.com/).
2. Login to your Heroku account using `heroku login` in the terminal.
3. Go to the `createEventsBot` folder.
4. Run `heroku create` to prepare the Heroku environment.
5. Configure environment variables on the server: Run `heroku config:set PROD_BOT_TOKEN=your-token` (replacing `your-token` with the token you got from Botfather. In case you created two bots, use the token from the bot that you would like to use in production here. The development-bot token is set in .env.).
6. Run `heroku config:set HEROKU_URL=$(heroku info -s | grep web_url | cut -d= -f2)`.
7. Run `git add -A && git commit -m "Ready to run on heroku" && git push heroku master` to deploy your bot to the Heroku server.
8. Send `/event blabla` to the bot to check out if it works ok. Now you don't need to run `npm run start` locally anymore since the Heroku server is doing that.
9. Whenever you made changes to the code, push them to Heroku again to deploy them.

Also feel free to make a Pull Request here with your changes if they might be useful to integrate into the CreateEventsBot!

### More Details for Developers

In development mode the bot works using [polling](https://en.wikipedia.org/wiki/Push_technology#Long_polling) and on the Heroku server it uses [webhooks](https://core.telegram.org/bots/api#setwebhook), because Heroku will shut down the web-server after a period of inactivity that will result in your polling loop to shut down too. Once webhook was enabled, telegram will return an error `{"ok":false,"error_code":409,"description":"Error: Conflict: another webhook is active"}` when you will try to use polling again, and that's actually ok.

To go back to development mode, `https://api.telegram.org/botYOUR_TOKEN/setWebhook?url=` in your browser (replacing `YOUR_TOKEN` with the token, you've got from the BotFather). Or if you are on Linux you can instead run `npm run switch_to_dev`.
Don't be afraid - when you finish with the changes you may simply push your bot to Heroku using `git push heroku master`. Then you should restart your app using `heroku restart`. It will set the webhook again.

### Used Technology and Acknowledgements

This project was based on [heroku-node-telegram-bot](https://github.com/odditive/heroku-node-telegram-bot). Thanks a lot! That made deploying to heroku a charm, without any setup or configuration <3

As a platform we use [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api).
[node-telegram-bot-api documentation](https://github.com/yagop/node-telegram-bot-api/blob/0b8ca03b54ac3361c2f656e2fa23c0e4423e49e5/doc/api.md)
[Telegram API documentation](https://core.telegram.org/bots/api)
We also use [node-telegram-keyboard-wrapper](https://github.com/alexandercerutti/node-telegram-keyboard-wrapper.)
