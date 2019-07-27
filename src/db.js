const { Client } = require("pg");
const { pretty } = require("./util");

class DB {
  constructor() {
    this.db = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    });
  }

  async initializeDB() {
    console.log("Initializing DB:", process.env.DATABASE_URL);
    this.db.connect();
    this.db
      .query("SELECT event_id FROM events;")
      .then(res => {
        console.log("Tables exist, DB is ready.");
      })
      .catch(async err => {
        console.log("Tables don't exist yet, creating them now...");
        console.log(err);
        await this.createTables();
      });
  }

  async createTables() {
    await this.db.query(
      "CREATE TABLE events (event_id varchar(50), description varchar(1000));"
    );
    await this.db.query(
      "CREATE TABLE attendees (event_id varchar(50), username varchar(100), full_name varchar(100));"
    );
  }

  async insertEvent(eventID, description) {
    await this.db.query(
      `INSERT INTO events (event_id, description) VALUES ('${eventID}', '${description}');`
    );
  }

  async rsvpToEvent(eventID, username, fullName) {
    await this.db.query(
      `INSERT INTO attendees (event_id, username, full_name) VALUES ('${eventID}', '${username}', '${fullName}');`
    );
  }

  async removeRsvpFromEvent(eventID, username) {
    await this.db.query(
      `DELETE FROM attendees WHERE event_id='${eventID}' AND username='${username}';`
    );
  }

  async getEvent(eventID) {
    const res = await this.db.query(
      `SELECT * FROM events WHERE event_id='${eventID}';`
    );
    return res.rows[0];
  }

  async getAttendeeByUsernameAndEventID(eventID, username) {
    const res = await this.db.query(
      `SELECT * FROM attendees WHERE event_id='${eventID}' AND username='${username}';`
    );
    return res.rows;
  }

  async getAttendeesByEventID(eventID) {
    const res = await this.db.query(
      `SELECT * FROM attendees WHERE event_id='${eventID}';`
    );
    return res.rows;
  }
}

module.exports = DB;
