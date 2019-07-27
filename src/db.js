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
      .query("SELECT * FROM blubb;")
      .then(res => {
        console.log(`Tables already exist: ${pretty(res.rows)}`);
      })
      .catch(async err => {
        console.log("Tables don't exist yet, creating them now...");
        console.log(err);
        await createTables(this.db);
      });
  }
}

async function createTables(db) {
  await db.query(
    "CREATE TABLE blubb (eventID varchar(50), description varchar(1000));"
  );
  await db.query(
    "CREATE TABLE attendees (eventID varchar(50), description varchar(1000));"
  );
}

module.exports = DB;
