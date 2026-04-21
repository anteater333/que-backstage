import ffmpeg from "fluent-ffmpeg";
import path from "node:path";
import { CONFIG } from "../config";
import { mkdir } from "node:fs/promises";

/** 비디오 가공 파이프라인 실행 */
export const processVideoPipeline = async (
  stageId: string,
  rawFilePath: string,
) => {
  console.log("파이프라인 개발 중: ", stageId, rawFilePath);

  console.log("썸네일 추출 테스트");
  const results = await extractThumbnails(
    rawFilePath,
    CONFIG.STORAGE.OUTPUT_PATH,
    {
      orientation: "landscape",
    },
  );
  console.log("🥕 결과 :: ", results);

  const resolutions = [
    { name: "360p", width: 640, height: 360, bitrate: "800k" },
    { name: "720p", width: 1280, height: 720, bitrate: "2500k" },
    { name: "1080p", width: 1920, height: 1080, bitrate: "5000k" },
  ];

  console.log("영상 변환 테스트");
  for (const res of resolutions) {
    console.log(`🥕 ${res.name} 인코딩 시작 ---`);
    await transcodeToHLS(rawFilePath, CONFIG.STORAGE.OUTPUT_PATH, { res });
  }
};

type VideoOrientation = "landscape" | "portrait" | "square";
/** TODO #0 필요 영상 메타데이터 추출 (ex. orientation 값 등) */

/**
 * 해상도별 HLS 변환
 **/
export const transcodeToHLS = async (
  input: string,
  baseDir: string,
  metadata: {
    res: {
      name: string;
      width: number;
      height: number;
      bitrate: string;
    };
  },
) => {
  const resDir = path.join(baseDir, metadata.res.name);
  await mkdir(resDir, { recursive: true });

  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .outputOptions([
        // --- 비디오 설정 ---
        "-preset veryfast",
        "-profile:v high",
        `-s ${metadata.res.width}x${metadata.res.height}`,
        `-b:v ${metadata.res.bitrate}`,

        // --- 오디오 설정 ---
        "-c:a aac",
        "-b:a 320k",
        "-ar 48000",
        "-ac 2",
        "-af loudnorm=I=-16:TP=-1.5:LRA=11", // 오디오 필터(음량 평준화)

        // --- HLS 설정 ---
        "-hls_time 6",
        "-hls_playlist_type vod",
        `-hls_segment_filename ${resDir}/seg-%d.ts`,
      ])
      .output(`${resDir}/index.m3u8`)
      .on("start", (commandLine) => console.log("[FFmpeg] 실행:", commandLine))
      .on("progress", (progress) => {
        const fixedPercent = Math.min(100, progress.percent || 0).toFixed(2);
        console.log(`[FFmpeg - ${metadata.res.name}] 진행률: ${fixedPercent}%`);
      })
      .on("end", resolve)
      .on("error", reject)
      .run();
  });
};

/**
 * 썸네일 추출
 * @returns 생성된 썸네일 경로
 **/
export const extractThumbnails = (
  input: string,
  baseDir: string,
  metadata: {
    orientation: VideoOrientation;
  },
) => {
  const configs = [
    { label: "large", size: 1280 },
    { label: "medium", size: 640 },
  ];

  const tasks = configs.map((config) => {
    return new Promise<string>((resolve, reject) => {
      const filename = `thumbnail_${config.label}.webp`;
      const sizeStr =
        metadata.orientation === "landscape"
          ? `${config.size}x?`
          : `?x${config.size}`;

      ffmpeg(input)
        .screenshots({
          count: 1,
          timestamps: ["50%"], // 중간지점, 임의로 설정함. TODO: 추후 가변값을 줄 수 있도록 고려할 것
          filename: filename,
          folder: baseDir,
          size: sizeStr,
        })
        .on("end", () => resolve(path.join(baseDir, filename)))
        .on("error", (err) => reject(err));
    });
  });

  return Promise.all(tasks);
};

/** TODO #3 마스터 m3u8 파일 생성 */

