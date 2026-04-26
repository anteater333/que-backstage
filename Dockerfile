# 1. 빌드 시작
FROM node:22-alpine AS builder
WORKDIR /app

# 빌드에 필요한 패키지 설치
COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile

# 소스 복사 및 빌드
COPY . .
RUN yarn build

# 2. 실행
FROM node:22-alpine
WORKDIR /app

# ffmpeg 설치
RUN apk add --no-cache ffmpeg

# 빌드 결과물 및 의존성 복사
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# 환경 변수 설정
ENV NODE_ENV=production

# 워커 실행
CMD ["node", "dist/main.js"]