import ffmpeg from "fluent-ffmpeg";
import path from "node:path";
import { CONFIG } from "../config";

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
};

type VideoOrientation = "landscape" | "portrait" | "square";
/** TODO #0 필요 영상 메타데이터 추출 (ex. orientation 값 등) */

/** TODO #1 해상도별 HLS 변환 */

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

