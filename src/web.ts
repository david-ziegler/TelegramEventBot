/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as packageInfo from '../package.json';

const app = express();
app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.json({ version: packageInfo.version });
});

const PORT = parseInt(process.env.PORT);
const HOST = process.env.HOST;
app.listen(PORT, HOST, () => {
  console.log('Web server started at http://%s:%s', HOST, PORT);
});

export function web(bot: any): void {
  app.post('/' + bot.token, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });
}
