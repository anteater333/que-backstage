import { Kysely, PostgresDialect } from "kysely";
import { StageTable } from "./stage.service";
import { Pool } from "pg";
import { CONFIG } from "../config";

interface Database {
  stages: StageTable;
}

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: CONFIG.DB.URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }),
  }),
});

