# Create events in Telegram groups (bot)

With this bot you can create events in Telegram groups. People can RSVP to the event just by clicking on "zusagen" (it's currently only available in German).

This makes it possible to get much less notifications in large groups. Instead of everyone writing "I'm in" etc. they can click on "zusagen" for which no extra notifications are created. It just shows a nice overview of everyone who already RSVP-ed.

![mockup](https://user-images.githubusercontent.com/3832093/63650315-994cd480-c749-11e9-9787-97904e2d4a05.jpg)


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

1. Clone this repository. 
2. In order to be able to send and receive message via Telegram you first need to create a bot: [Create a bot with botfather](https://core.telegram.org/bots#3-how-do-i-create-a-bot). There you get a token.
3. In the terminal, go to the app's folder with `cd createEventsBot`.
4. Create a database by running `yarn install` and then `npx sqlite3 ./data/development.db`.
3. Rename the file `.env_example` to `.env` and set `DEV_BOT_TOKEN` to the token, you've got from BotFather. 
4. Then run `yarn watch`.

Now the bot is started in watch-mode, i.e. whenever you make changes to the code and save them, the bot automatically updates. You can now open Telegram (on the computer or phone) and use the bot (like in "How to create an event"). 

### Create your own bot with your changes

Follow the steps under "Local development"

(You may also create two different bots and use one token for local development (`DEV_BOT_TOKEN`) and one for production (the deployed bot) (`PROD_BOT_TOKEN`)).

For deployment I found [uberspace](https://uberspace.de/) really nice.

Also, feel free to make a Pull Request here with your changes if they might be useful to integrate into the CreateEventsBot!

### Used technology & acknowledgements

We use [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api), [node-telegram-keyboard-wrapper](https://github.com/alexandercerutti/node-telegram-keyboard-wrapper) and [sqlite3](https://github.com/mapbox/node-sqlite3).

You may find these documentations useful: [node-telegram-bot-api documentation](https://github.com/yagop/node-telegram-bot-api/blob/0b8ca03b54ac3361c2f656e2fa23c0e4423e49e5/doc/api.md), [Telegram API documentation](https://core.telegram.org/bots/api).
