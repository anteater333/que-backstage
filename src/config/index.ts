// 설정 관리 영역
// 환경 변수의 객체화
// 상수 관리 등등

/** 필수 환경 변수 체크 함수 */
const required = (
  key: string,
  options?: {
    defaultValue?: string;
    isOptional?: boolean;
  },
): string => {
  const value = process.env[key] || options?.defaultValue;
  if (value === undefined && !options?.isOptional) {
    throw new Error(`환경변수 설정이 누락되었습니다: ${key}`);
  }
  return value ?? "";
};

export const CONFIG = {
  // DB 설정
  DB: {
    URL: required("DATABASE_URL"),
  },

  // Redis 설정
  REDIS: {
    HOST: required("REDIS_HOST", { defaultValue: "localhost" }),
    PORT: Number(required("REDIS_PORT", { defaultValue: "6379" })),
    USER: required("REDIS_USERNAME", { isOptional: true }),
    PASS: required("REDIS_PASSWORD", { isOptional: true }),
  },

  // 경로 설정
  STORAGE: {
    OUTPUT_PATH: required("VIDEO_OUTPUT_PATH"),
  },
};

