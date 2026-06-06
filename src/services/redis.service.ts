import Redis from "ioredis";
import { CONFIG } from "../config";

class RedisService {
  private redisClient;
  private redisPublisherClient;

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
      console.error("[Redis] Redis 에러 ::", error);
    });

    // #region Publish 전용 Redis 클라이언트 설정
    this.redisPublisherClient = new Redis({
      host: CONFIG.REDIS.HOST,
      port: CONFIG.REDIS.PORT,
      username: CONFIG.REDIS.USER,
      password: CONFIG.REDIS.PASS,
      db: 0,
    });

    this.redisPublisherClient.on("connect", () => {
      console.log("[Redis] Redis(Publisher) 연결 성공.");
    });

    this.redisPublisherClient.on("error", (error) => {
      console.error("[Redis] Redis(Publisher) 에러 ::", error);
    });
    // #endregion
  }

  getClient() {
    return this.redisClient;
  }

  getPublisherClient() {
    return this.redisPublisherClient;
  }
}

export default new RedisService();
