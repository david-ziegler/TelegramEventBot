/* eslint-disable @typescript-eslint/no-explicit-any */
import { sanitize } from './bot-util';
import { Attendee, Event } from './models';

const ID_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 4500;

export class DB {
  private db: any;

  constructor() {
    this.db = {
      connect: () => {
        console.log('connect');
      },
      query: () => {
        console.log('query');
      },
    };
    // this.db = new Client({
    //   user: 'vqmgpdxxphouko',
    //   password: 'b9b986d55ddeae32af049bf2c17c17ced3b019f3d541970bfd8131321d9a3ed4',
    //   database: 'd6ntel0ao3e78o',
    //   port: 5432,
    //   host: 'ec2-174-129-227-205.compute-1.amazonaws.com',
    //   ssl: true,
    // });
  }

  public async initializeDB(): Promise<void> {
    console.log('Initializing DB:', process.env.DATABASE_URL);
    await this.db.connect();
    // this.db.query('SELECT event_id FROM events;')
    //   .then(() => {
    //     console.log('Tables exist, DB is ready.');
    //   })
    // .catch(async (err: Error) => {
    //   console.log('Tables don\'t exist yet, creating them now... The following error is probably just due to non-existing database and can be ignored:');
    //   console.error(err);
    //   await this.createTables();
    // });
  }

  public async createTables(): Promise<void> {
    // await this.db.query(`CREATE TABLE events (event_id varchar(${ID_MAX_LENGTH}),chat_id bigint, message_id bigint, description varchar(${DESCRIPTION_MAX_LENGTH}));`)
    //   .catch((err: Error) => {
    //     console.error('Error in createTables() > events:', err);
    //   });
    // await this.db.query(`CREATE TABLE attendees (event_id varchar(${ID_MAX_LENGTH}), user_id varchar(${ID_MAX_LENGTH}), full_name varchar(${ID_MAX_LENGTH}));`)
    //   .catch((err: Error) => {
    //     console.error('Error in createTables() > attendees', err);
    //   });
  }

  public async insertEvent(event_id: string, chat_id: string, message_id: string, description: string): Promise<void> {
    if (event_id.length > ID_MAX_LENGTH) {
      console.error('Error: event_id too long');
      return;
    }
    if (description.length > DESCRIPTION_MAX_LENGTH) {
      console.error('Error: description too long');
      return;
    }
    const chat_id_int = Number.parseInt(chat_id);
    const message_id_int = Number.parseInt(message_id);
    const query = `INSERT INTO events (event_id, chat_id, message_id, description)
    VALUES ('${event_id}', '${chat_id_int}', '${message_id_int}', '${description}');`;
    // await this.db.query(query)
    //   .catch((err: Error) => {
    //     console.error('Error in insertEvent():', err);
    //   });
  }

  public async rsvpToEvent(event_id: string, user_id: string, full_name: string): Promise<void> {
    if (
      event_id.length > ID_MAX_LENGTH ||
      user_id.length > ID_MAX_LENGTH ||
      full_name.length > ID_MAX_LENGTH
    ) {
      console.error('Error: event_id, user_id or full_name too long');
      return;
    }

    const sanitized_full_name = sanitize(full_name);

    // await this.db.query(`INSERT INTO attendees (event_id, user_id, full_name) VALUES ('${event_id}', '${user_id}', '${sanitized_full_name}');`)
    //   .catch((err: Error) => {
    //     console.error(
    //       `Error while writing RSVP to database: event_id=${event_id}, user_id=${user_id}: ${err}`,
    //   );
    // });
  }

  public async removeRsvpFromEvent(event_id: string, user_id: string): Promise<void> {
    // await this.db.query(`DELETE FROM attendees WHERE event_id='${event_id}' AND user_id='${user_id}';`)
    //   .catch((err: Error) => {
    //     console.error(
    // //       `Error while writing RSVP-Cancellation to database: event_id=${event_id}, user_id=${user_id}: ${err}`,
    //     );
    //   });
  }

  public async getEvent(event_id: string): Promise<Event> {
    // return await this.db.query(`SELECT * FROM events WHERE event_id='${event_id}';`)
    //   .then((res: any) => {
    //     if (res.rows.length === 0) {
    //       console.error(
    //       `getEvent: could not find the event with event_id=${event_id} in the database.`,
    //     );
    //   }
    //   return res.rows[0];
    // })
    // .catch((err: Error) => {
    //   console.error('Error in getEvent():', err);
    // });
    return new Promise(() => {
      console.log('bla');
    });
  }

  public async getAttendeesByEventIDAndUserID(event_id: string, user_id: string): Promise<Attendee[]> {
    // return await this.db.query(`SELECT * FROM attendees WHERE event_id='${event_id}' AND user_id='${user_id}';`)
    //   .then((res: any) => {
    //     return res.rows;
    //   })
    // .catch((err: Error) => {
    //   console.error('Error in getAttendeeByEventIDAndUserID():', err);
    // });
    return new Promise(() => {
      console.log('bla');
    });
  }

  public async getAttendeesByEventID(event_id: string): Promise<Attendee[]> {
    // return await this.db.query(`SELECT * FROM attendees WHERE event_id='${event_id}';`)
    //   .then((res: any) => {
    //     return res.rows;
    //   })
    // .catch((err: Error) => {
    //   console.error('Error in getAttendeesByEventID():', err);
    // });
    return new Promise(() => {
      console.log('bla');
    });
  }
}
