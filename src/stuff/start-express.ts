/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import express from 'express';
import bodyParser from 'body-parser';
import packageInfo from '../../package.json';

const app = express();
const ENV_PORT = process.env.PORT;
if (ENV_PORT === undefined) {
  throw new Error('Environment variable "PORT" is not set.');
}
const PORT = parseInt(ENV_PORT);
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Web server started at http://${HOST}:${PORT}`);
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