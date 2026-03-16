declare module "bun:sqlite" {
  interface Statement {
    all(...params: unknown[]): unknown[];
    get(...params: unknown[]): unknown;
    run(...params: unknown[]): unknown;
  }

  export class Database {
    constructor(path: string);
    close(): void;
    exec(sql: string): void;
    prepare(sql: string): Statement;
    query(sql: string): Statement;
  }
}
