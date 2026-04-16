import { Kysely, PostgresDialect } from "kysely";
import { StageTable } from "./stage.service";
import { Pool } from "pg";

interface Database {
  stages: StageTable;
}

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }),
  }),
});

