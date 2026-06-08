import ffmpeg from "fluent-ffmpeg";
import path from "node:path";
import { CONFIG } from "../config";
import { mkdir, writeFile } from "node:fs/promises";

export type VideoOrientation = "LANDSCAPE" | "PORTRAIT" | "SQUARE";
type VideoMetadata = {
  width: number;
  height: number;
  duration: number;
  orientation: VideoOrientation;
  bitrate: number;
  fps: number;
  hasAudio: boolean;
};

type Resolution = {
  name: string;
  width: number;
  height: number;
  bitrate: string;
};

/** 지원 화질 */
const resolutions: Resolution[] = [
  { name: "360p", width: 640, height: 360, bitrate: "800k" },
  { name: "720p", width: 1280, height: 720, bitrate: "2500k" },
  { name: "1080p", width: 1920, height: 1080, bitrate: "5000k" },
];

/**
 * 비디오 가공 파이프라인 실행
 * @returns 가공 파일 출력 경로
 **/
export const processVideoPipeline = async (
  stageId: string,
  rawFilePath: string,
  jobId: string,
): Promise<[string, VideoMetadata]> => {
  const logPrefix = `[Job ${jobId}/${stageId}]`;
  console.log(logPrefix, "가공 파이프라인 실행");

  const outputPath = path.join(CONFIG.STORAGE.OUTPUT_PATH, stageId);

  // 폴더 먼저 생성
  await mkdir(outputPath, { recursive: true });

  console.log(logPrefix, "Step #1 메타데이터 추출");
  const metadata = await getVideoMetadata(rawFilePath);
  console.log(logPrefix, `메타데이터 추출 완료: ${JSON.stringify(metadata)}`);

  console.log(logPrefix, "Step #2 썸네일 추출");
  const thumbs = await extractThumbnails(rawFilePath, outputPath, {
    orientation: metadata.orientation,
  });
  console.log(logPrefix, `썸네일 추출 완료: ${thumbs}`);

  console.log(logPrefix, "Step #3 원본 -> HLS 변환");
  for (const res of resolutions) {
    console.log(logPrefix, `${res.name} 시작  --- `);
    await transcodeToHLS(rawFilePath, outputPath, { res });
  }

  console.log(logPrefix, "Step #4 마스터 플레이리스트 추출");
  const finalResult = await createMasterPlaylist(outputPath, resolutions);

  return [finalResult, metadata];
};

/** 원본 영상 메타데이터 추출 */
export const getVideoMetadata = async (
  input: string,
): Promise<VideoMetadata> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(input, (err, metadata) => {
      if (err) return reject(err);

      const stream = metadata.streams.find((s) => s.codec_type === "video");
      const audioStream = metadata.streams.find(
        (s) => s.codec_type === "audio",
      );

      if (!stream)
        return reject(new Error("비디오 스트림을 찾을 수 없습니다."));

      /** 영상 촬영 시 기기 회전 상태 정보 */
      const rotation =
        (stream.side_data_list?.find((d: { rotation: unknown }) => d.rotation)
          ?.rotation as number) || 0;

      let width = stream.width || 0;
      let height = stream.height || 0;

      // 회전된 영상은 가로/세로를 바꿔서 판단
      if (Math.abs(rotation) === 90 || Math.abs(rotation) === 270) {
        [width, height] = [height, width];
      }

      // 비율 판단
      let orientation: VideoOrientation = "SQUARE";
      if (width > height) orientation = "LANDSCAPE";
      else if (height > width) orientation = "PORTRAIT";

      resolve({
        width,
        height,
        duration: metadata.format.duration || 0,
        orientation,
        bitrate: metadata.format.bit_rate || 0,
        fps: eval(stream.r_frame_rate || "0"),
        hasAudio: !!audioStream,
      });
    });
  });
};

/**
 * 해상도별 HLS 변환
 **/
export const transcodeToHLS = async (
  input: string,
  baseDir: string,
  metadata: {
    res: Resolution;
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
  /** 지원 썸네일 크기 */
  const thumbnailResolutions = [
    { label: "large", size: 1280 },
    { label: "medium", size: 640 },
  ];

  const tasks = thumbnailResolutions.map((resolution) => {
    return new Promise<string>((resolve, reject) => {
      const filename = `thumbnail_${resolution.label}.webp`;
      const sizeStr =
        metadata.orientation === "LANDSCAPE"
          ? `${resolution.size}x?`
          : `?x${resolution.size}`;

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

/** 마스터 m3u8 파일 생성 */
export const createMasterPlaylist = async (
  baseDir: string,
  resolutions: Resolution[],
) => {
  // HLS 헤더 설정
  // 표준 규격에 맞는 헤더 시작
  let content = "#EXTM3U\n";
  // 가장 범용성이 높은 버전 3 사용
  content += "#EXT-X-VERSION:3\n\n";

  for (const res of resolutions) {
    /** 비트레이트 숫자 추출 */
    const bps = parseInt(res.bitrate.replace("k", "")) * 1000;

    const totalBandwidth = bps + 320000;

    // 화질 정보 메타데이터 작성
    // BANDWIDTH: 초당 최대 데이터 양
    // RESOLUTION: 가로x세로 해상도
    // CODECS: H.264 (avc1) + AAC (mp4a) 표준 코덱 명시
    content +=
      `#EXT-X-STREAM-INF:BANDWIDTH=${totalBandwidth}` +
      `,RESOLUTION=${res.width}x${res.height}` +
      `,NAME="${res.name}"` +
      `,CODECS="avc1.640028,mp4a.40.2"\n`;

    // 해당 화질의 실제 경로
    content += `${res.name}/index.m3u8\n\n`;
  }

  const masterPath = path.join(baseDir, "master.m3u8");
  await writeFile(masterPath, content, "utf8");

  return masterPath;
};
