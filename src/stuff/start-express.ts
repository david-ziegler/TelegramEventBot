/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import express from 'express';
import bodyParser from 'body-parser';
import packageInfo from '../../package.json';
import { ENV } from './helper';

const app = express();
const PORT = parseInt(ENV.PORT);
app.listen(PORT, ENV.HOST, () => {
  console.log(`Web server started at http://${ENV.HOST}:${PORT}`);
});

app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.json({
    app: 'telegram-event-bot',
    version: packageInfo.version,
  });
});

export function web(bot: any): void {
  app.post(`/${bot.token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });
}