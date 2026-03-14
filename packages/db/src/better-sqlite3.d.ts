declare module "better-sqlite3" {
  interface Statement {
    all(...params: unknown[]): unknown[];
    get(...params: unknown[]): unknown;
    run(...params: unknown[]): unknown;
  }

  export default class Database {
    constructor(path: string);
    exec(sql: string): void;
    pragma(sql: string): void;
    prepare(sql: string): Statement;
  }
}
