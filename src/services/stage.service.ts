// Stage DB 접근 서비스 관련 코드

import redisService from "./redis.service";

export interface StageTable {
  id: string;
  sourceUrl: string | null;
  status:
    | "INITIATED"
    | "UPLOADING"
    | "QUEUED"
    | "PROCESSING"
    | "DONE"
    | "FAILED";
}

export interface StageStatusEvent {
  status: StageTable["status"];
  stageId: string;
}

export async function publishStatus(
  stageId: string,
  status: StageTable["status"],
) {
  const event: StageStatusEvent = { stageId, status };
  await redisService
    .getPublisherClient()
    .publish(`stage:${stageId}`, JSON.stringify(event));
}
