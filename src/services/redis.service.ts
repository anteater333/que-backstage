import Redis from "ioredis";
import { CONFIG } from "../config";

class RedisService {
  private redisClient;

  constructor() {
    this.redisClient = new Redis({
      host: CONFIG.REDIS.HOST,
      port: CONFIG.REDIS.PORT,
      username: CONFIG.REDIS.USER,
      password: CONFIG.REDIS.PASS,
      db: 0,
      // BullMQ 호환 설정
      maxRetriesPerRequest: null,
    });

    this.redisClient.on("connect", () => {
      console.log("[Redis] Redis 연결 성공.");
    });

    this.redisClient.on("error", (error) => {
      console.error({ msg: "[Redis] Redis 에러 ::", error });
    });
  }

  getClient() {
    return this.redisClient;
  }
}

export default new RedisService().getClient();

