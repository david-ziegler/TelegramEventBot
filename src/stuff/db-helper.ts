import { Database } from 'sqlite3';

export function all<Result>(db: Database, query: string, params?: Param[]): Promise<Result[]> {
  return new Promise((resolve, reject) => {
    if (params == undefined) {
      params = [];
    }
    db.all(query, params, function (err, rows) {
      if (err) {
        reject('Error: ' + err.message);
      }
      else {
        resolve(rows);
      }
    });
  });
}

export function get<Result>(db: Database, query: string, params?: Param[]): Promise<Result> {
  return new Promise((resolve, reject) => {
    if (params == undefined) {
      params = [];
    }
    db.get(query, params, function (err, rows) {
      if (err) {
        reject('Error: ' + err.message);
      }
      else {
        resolve(rows);
      }
    });
  });
}

export function run(db: Database, query: string, params?: Param[]): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    if (params == undefined) {
      params = [];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    db.run(query, params, function (err: any, rows: any) {
      if (err) {
        reject('Error: ' + err.message);
      }
      else {
        resolve(rows);
      }
    });
  });
}

export type Param = string | number;