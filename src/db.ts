import { Database } from 'sqlite3';
import { sanitize } from './bot-util';
import { Attendee, Event } from './models';
import { all, get, run } from './stuff/db-helper';
import { ENV } from './stuff/environment-variables';

const DESCRIPTION_MAX_LENGTH = 4500;

export class DB {
  private db: Database;

  constructor() {
    this.db = new Database(ENV.DATABASE_PATH);
    console.log(`Initialized DB ${ENV.DATABASE_PATH}`);
  }

  public async getAllEvents(): Promise<Event[]> {
    return await all<Event>(this.db, 'SELECT * FROM events');
  }

  public async getEvent(chat_id: number, message_id: number): Promise<Event> {
    return await get<Event>(this.db, 'SELECT * FROM events WHERE chat_id=? AND message_id=?', [chat_id, message_id]);
  }

  public async insertEvent(chat_id: number, message_id: number, description: string): Promise<void> {
    if (description.length > DESCRIPTION_MAX_LENGTH) {
      throw new Error(`Description too long. Maximum length: ${DESCRIPTION_MAX_LENGTH} characters.`);
    }
    await run(this.db, 'INSERT INTO events (chat_id, message_id, description) VALUES (?,?,?)', [chat_id, message_id, description]);
  }

  public async rsvpToEvent(event_id: number, user_id: number, name: string): Promise<void> {
    const sanitized_full_name = sanitize(name);
    await run(this.db, 'INSERT INTO attendees (event_id, user_id, name) VALUES (?, ?, ?)', [event_id, user_id, sanitized_full_name]);
  }

  public async removeRsvpFromEvent(event_id: number, user_id: number): Promise<void> {
    await run(this.db, 'DELETE FROM attendees WHERE event_id=? AND user_id=?', [event_id, user_id]);
  }

  public async didThisUserRsvpAlready(chat_id: number, message_id: number, user_id: number): Promise<boolean> {
    const attendances = await this.getAttendeesForEventAndUser(chat_id, message_id, user_id);
    return attendances.length > 0;
  }

  private async getAttendeesForEventAndUser(chat_id: number, message_id: number, user_id: number): Promise<Attendee[]> {
    return await all<Attendee>(this.db, 'SELECT * FROM attendees JOIN events ON attendees.event_id = events.id WHERE chat_id=? AND message_id=? AND user_id=?',
      [chat_id, message_id, user_id],
    );
  }

  public async getAttendeesForEvent(chat_id: number, message_id: number): Promise<Attendee[]> {
    return await all<Attendee>(this.db, 'SELECT * FROM attendees JOIN events ON attendees.event_id = events.id WHERE chat_id=? AND message_id=?',
      [chat_id, message_id],
    );
  }
}
