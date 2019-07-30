const { Client } = require("pg");
const { pretty } = require("./util");

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
        `CREATE TABLE attendees (event_id varchar(${ID_MAX_LENGTH}), user_id varchar(${ID_MAX_LENGTH}), full_name varchar(${ID_MAX_LENGTH}));`
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

  async rsvpToEvent(event_id, user_id, full_name) {
    console.log("in rsvpToEvent:", event_id, user_id, full_name);
    if (
      event_id.length > ID_MAX_LENGTH ||
      user_id.length > ID_MAX_LENGTH ||
      full_name.length > ID_MAX_LENGTH
    ) {
      console.error("Error: event_id, user_id or full_name too long");
      return;
    }
    await this.db
      .query(
        `INSERT INTO attendees (event_id, user_id, full_name) VALUES ('${event_id}', '${user_id}', '${full_name}');`
      )
      .then(() => {})
      .catch(err => {
        console.error(
          `Error while writing RSVP to database: event_id=${event_id}, user_id=${user_id}: ${err}`
        );
      });
  }

  async removeRsvpFromEvent(event_id, user_id) {
    await this.db
      .query(
        `DELETE FROM attendees WHERE event_id='${event_id}' AND user_id='${user_id}';`
      )
      .then(() => {})
      .catch(err => {
        console.error(
          `Error while writing RSVP-Cancellation to database: event_id=${event_id}, user_id=${user_id}: ${err}`
        );
      });
  }

  async getEvent(event_id) {
    console.log("getEvent, event_id:", event_id);
    return await this.db
      .query(`SELECT * FROM events WHERE event_id='${event_id}';`)
      .then(res => {
        console.log("RESULT:", pretty(res));
        return res.rows[0];
      })
      .catch(err => {
        console.error(`RSVP: Error while retrieving event ${event_id}: ${err}`);
        bot.answerCallbackQuery(queryID, { text: i18n.errors.generic });
      });
  }

  async getAttendeeByEventIDAndUserID(event_id, user_id) {
    console.log("getAttendeeByEventIDAndUserID", event_id, user_id);
    return await this.db
      .query(
        `SELECT * FROM attendees WHERE event_id='${event_id}' AND user_id='${user_id}';`
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
