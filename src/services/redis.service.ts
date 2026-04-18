import Redis from "ioredis";

class RedisService {
  private redisClient;

  constructor() {
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
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

