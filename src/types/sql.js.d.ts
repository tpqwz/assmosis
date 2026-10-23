declare module "sql.js" {
  interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | null) => {
      exec(sql: string): void;
      run(sql: string, params?: Array<string | number | null>): void;
      prepare(sql: string): {
        run(params?: Array<string | number | null>): void;
        step(): boolean;
        getAsObject(): Record<string, string | number | Uint8Array | null>;
        free(): void;
      };
      export(): Uint8Array;
    };
  }
  export default function initSqlJs(config?: {
    locateFile?: (file: string) => string;
    wasmBinary?: ArrayBuffer | Uint8Array;
  }): Promise<SqlJsStatic>;
}
