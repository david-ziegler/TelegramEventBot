const { Client } = require("pg");

const ID_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 4500;

class DB {
  constructor() {
    this.db = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    });
  }

  async initializeDB() {
    console.log("Initializing DB:", process.env.DATABASE_URL);
    await this.db.connect();
    this.db
      .query("SELECT event_id FROM events;")
      .then(res => {
        console.log("Tables exist, DB is ready.");
      })
      .catch(async err => {
        console.log(
          "Tables don't exist yet, creating them now... The following error noticed that probably database exists:"
        );
        console.log(err);
        await this.createTables();
      });
  }

  async createTables() {
    await this.db
      .query(
        `CREATE TABLE events (event_id varchar(${ID_MAX_LENGTH}), description varchar(${DESCRIPTION_MAX_LENGTH}));`
      )
      .then(() => {})
      .catch(err => {
        console.error(`RSVP: Error while retrieving event ${event_id}: ${err}`);
        bot.answerCallbackQuery(queryID, { text: i18n.errors.generic });
      });
    await this.db
      .query(
        `CREATE TABLE attendees (event_id varchar(${ID_MAX_LENGTH}), username varchar(${ID_MAX_LENGTH}), full_name varchar(${ID_MAX_LENGTH}));`
      )
      .then(() => {})
      .catch(err => {
        console.error(`RSVP: Error while retrieving event ${event_id}: ${err}`);
        bot.answerCallbackQuery(queryID, { text: i18n.errors.generic });
      });
  }

  async insertEvent(event_id, description) {
    if (event_id.length > ID_MAX_LENGTH) {
      console.error("Error: event_id too long");
      return;
    }
    if (description.length > DESCRIPTION_MAX_LENGTH) {
      console.error("Error: description too long");
      return;
    }
    await this.db
      .query(
        `INSERT INTO events (event_id, description) VALUES ('${event_id}', '${description}');`
      )
      .then(() => {})
      .catch(err => {
        console.error(`RSVP: Error while retrieving event ${event_id}: ${err}`);
        bot.answerCallbackQuery(queryID, { text: i18n.errors.generic });
      });
  }

  async rsvpToEvent(event_id, username, full_name) {
    if (
      event_id.length > ID_MAX_LENGTH ||
      username > ID_MAX_LENGTH ||
      full_name > ID_MAX_LENGTH
    ) {
      console.error("Error: event_id, username or full_name too long");
      return;
    }
    await this.db
      .query(
        `INSERT INTO attendees (event_id, username, full_name) VALUES ('${event_id}', '${username}', '${full_name}');`
      )
      .then(() => {})
      .catch(err => {
        console.error(
          `Error while writing RSVP to database: event_id=${event_id}, username=${username}: ${err}`
        );
      });
  }

  async removeRsvpFromEvent(event_id, username) {
    await this.db
      .query(
        `DELETE FROM attendees WHERE event_id='${event_id}' AND username='${username}';`
      )
      .then(() => {})
      .catch(err => {
        console.error(
          `Error while writing RSVP-Cancellation to database: event_id=${event_id}, username=${username}: ${err}`
        );
      });
  }

  async getEvent(event_id) {
    return await this.db
      .query(`SELECT * FROM events WHERE event_id='${event_id}';`)
      .then(res => {
        return res.rows[0];
      })
      .catch(err => {
        console.error(`RSVP: Error while retrieving event ${event_id}: ${err}`);
        bot.answerCallbackQuery(queryID, { text: i18n.errors.generic });
      });
  }

  async getAttendeeByUsernameAndEventID(event_id, username) {
    return await this.db
      .query(
        `SELECT * FROM attendees WHERE event_id='${event_id}' AND username='${username}';`
      )
      .then(res => {
        return res.rows;
      })
      .catch(err => {
        console.error(`RSVP: Error while retrieving event ${event_id}: ${err}`);
        bot.answerCallbackQuery(queryID, { text: i18n.errors.generic });
      });
  }

  async getAttendeesByEventID(event_id) {
    return await this.db
      .query(`SELECT * FROM attendees WHERE event_id='${event_id}';`)
      .then(res => {
        return res.rows;
      })
      .catch(err => {
        console.error(`RSVP: Error while retrieving event ${event_id}: ${err}`);
        bot.answerCallbackQuery(queryID, { text: i18n.errors.generic });
      });
  }
}

module.exports = DB;
