// 워커 로직
// BullMQ Worker 정의 (Queue와 Processor 연결)
// 공장으로 치면 원자재를 옮기는 일꾼들

import { Job, Processor, Worker } from "bullmq";
import redisService from "../services/redis.service";
import { db } from "../services/db.service";

const VIDEO_QUEUE_NAME = "video-processing";
const VIDEO_QUEUE_JOB_NAME = "process-video";

type VideoJobType = {
  stageId: string;
  filePath: string;
  fileName: string;
};

const workerProcessor: Processor = async (job: Job<VideoJobType>) => {
  const { stageId, filePath } = job.data;

  console.log(`[Job ${job.id}] 작업 발견: Stage ID ${stageId}`);

  try {
    await db
      .updateTable("stages")
      .set({ status: "PROCESSING" })
      .where("id", "=", stageId)
      .execute();

    // TODO: 프로세서 로직
    console.log(`[Job ${job.id}] 작업 시작: ${filePath}`);
    await new Promise((resolve) => setTimeout(resolve, 5000)); // TEMP

    await db
      .updateTable("stages")
      .set({ status: "DONE" })
      .where("id", "=", stageId)
      .execute();

    console.log(`[Job ${job.id}] 작업 완료`);
  } catch (error) {
    console.error(`[Job ${job.id}] 작업 실패:`, error);

    await db
      .updateTable("stages")
      .set({ status: "FAILED" })
      .where("id", "=", stageId)
      .execute();

    throw error;
  }
};



export default new Worker(VIDEO_QUEUE_NAME, workerProcessor, {
  connection: redisService,
});

