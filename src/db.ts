/* eslint-disable @typescript-eslint/no-explicit-any */
import { Database } from 'sqlite3';
import { Event } from './models';
import { ENV } from './stuff/helper';

// const ID_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 4500;

export class DB {
  private db: Database;

  constructor() {
    this.db = new Database(ENV.DATABASE_PATH);
    console.log(`Initialized DB ${ENV.DATABASE_PATH}`);
  }

  public async getAllEvents(): Promise<unknown[]> {
    return await this.all(`SELECT * FROM events;`);
  }

  public async getEvent(chat_id: number, message_id: number): Promise<unknown> {
    return await this.db.get(`SELECT * FROM events WHERE chat_id=? AND message_id=?`, [chat_id, message_id]);
  }

  public async insertEvent(chat_id: number, message_id: number, description: string): Promise<void> {
    if (description.length > DESCRIPTION_MAX_LENGTH) {
      throw new Error(`Description too long. Maximum length: ${DESCRIPTION_MAX_LENGTH} characters.`);
    }
    console.log('insert', chat_id, message_id, description);
    this.db.run('INSERT INTO events (chat_id, message_id, description) VALUES (?,?,?)',
      [chat_id, message_id, description],
      () => {
        console.log('inserted event');
      },
    );
  }

  private all(query: string, params?: string[]): Promise<unknown[]> {
    return new Promise((resolve, reject) => {
      if (params == undefined) {
        params = [];
      }
      this.db.all(query, params, function (err, rows) {
        if (err) {
          reject('Error: ' + err.message);
        }
        else {
          resolve(rows);
        }
      });
    });
  }

  //   public async rsvpToEvent(event_id: string, user_id: string, full_name: string): Promise<void> {
  //     if (
  //       event_id.length > ID_MAX_LENGTH ||
  //       user_id.length > ID_MAX_LENGTH ||
  //       full_name.length > ID_MAX_LENGTH
  //     ) {
  //       console.error('Error: event_id, user_id or full_name too long');
  //       return;
  //     }

  //     const sanitized_full_name = sanitize(full_name);

  //     // await this.db.query(`INSERT INTO attendees (event_id, user_id, full_name) VALUES ('${event_id}', '${user_id}', '${sanitized_full_name}');`)
  //     //   .catch((err: Error) => {
  //     //     console.error(
  //     //       `Error while writing RSVP to database: event_id=${event_id}, user_id=${user_id}: ${err}`,
  //     //   );
  //     // });
  //   }

  //   public async removeRsvpFromEvent(event_id: string, user_id: string): Promise<void> {
  //     // await this.db.query(`DELETE FROM attendees WHERE event_id='${event_id}' AND user_id='${user_id}';`)
  //     //   .catch((err: Error) => {
  //     //     console.error(
  //     // //       `Error while writing RSVP-Cancellation to database: event_id=${event_id}, user_id=${user_id}: ${err}`,
  //     //     );
  //     //   });
  //   }

  //   public async getAttendeesByEventIDAndUserID(event_id: string, user_id: string): Promise<Attendee[]> {
  //     // return await this.db.query(`SELECT * FROM attendees WHERE event_id='${event_id}' AND user_id='${user_id}';`)
  //     //   .then((res: any) => {
  //     //     return res.rows;
  //     //   })
  //     // .catch((err: Error) => {
  //     //   console.error('Error in getAttendeeByEventIDAndUserID():', err);
  //     // });
  //     return new Promise(() => {
  //       console.log('bla');
  //     });
  //   }

  //   public async getAttendeesByEventID(event_id: string): Promise<Attendee[]> {
  //     // return await this.db.query(`SELECT * FROM attendees WHERE event_id='${event_id}';`)
  //     //   .then((res: any) => {
  //     //     return res.rows;
  //     //   })
  //     // .catch((err: Error) => {
  //     //   console.error('Error in getAttendeesByEventID():', err);
  //     // });
  //     return new Promise(() => {
  //       console.log('bla');
  //     });
  //   }

}
