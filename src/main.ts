import "dotenv/config";
import videoWorker from "./workers/video.worker";
import { Job } from "bullmq";

/** que backstage 공장 엔트리포인트 */
async function bootstrap() {
  console.log(`[Initiated] Que Backstage 프로세스 실행`);

  // 워커 공통 핸들러 정의
  const handleCompleted = (job: Job) => {
    console.log(`[Job ${job.id}] ✅`);
  };
  const handleFailed = (job: Job | undefined, err: Error) => {
    console.error(`[Job ${job?.id} ❌]`, err.message);
  };
  const handleError = (err: Error) => {
    console.error(`[Worker Error]`, err);
  };

  // 워커에 핸들러 연결
  videoWorker.on("completed", handleCompleted);
  videoWorker.on("failed", handleFailed);
  videoWorker.on("error", handleError);

  /** Graceful Shutdown */
  const shutdown = async () => {
    console.log(`[Shutdown] 워커 종료 중..`);
    await videoWorker.close();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

bootstrap();

