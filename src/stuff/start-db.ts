import { DB } from '../db';

export const db = new DB();
db.initializeDB().then(() => console.log('Initialized DB'));
