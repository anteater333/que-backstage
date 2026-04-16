// 워커 로직
// BullMQ Worker 정의 (Queue와 Processor 연결)
// 공장으로 치면 원자재를 옮기는 일꾼들

import { Job, Processor, Worker, WorkerOptions } from "bullmq";
import redisService from "../services/redis.service";

const VIDEO_QUEUE_NAME = "video-processing";
const VIDEO_QUEUE_JOB_NAME = "process-video";

const workerProcessor: Processor = async (job: Job) => {};

const workerOptions: WorkerOptions = {
  connection: redisService,
};

export default new Worker(VIDEO_QUEUE_NAME, workerProcessor, workerOptions);

