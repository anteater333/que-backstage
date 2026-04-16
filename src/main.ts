import "dotenv/config";
import { db } from "./services/db.service";

// que backstage 공장 엔트리포인트

console.log("hello world");

db.selectFrom("stages")
  .selectAll()
  .execute()
  .then((value) => {
    console.log(value);
  });

