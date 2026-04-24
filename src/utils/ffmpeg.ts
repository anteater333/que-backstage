import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * ffmpeg과 ffprobe의 사용 가능 여부 확인
 */
export const ffmpegHealthCheck = async () => {
  try {
    const { stdout: ffmpegOut } = await execAsync("ffmpeg -version");
    console.log(`[FFmpeg] ✅ ffmpeg 사용 가능 -`, ffmpegOut.split("\n")[0]);
  } catch (error) {
    console.error(`[FFmpeg] ❌ ffmpeg 사용 불가`);
    return false;
  }

  try {
    const { stdout: ffprobeOut } = await execAsync("ffprobe -version");
    console.log(`[FFmpeg] ✅ ffprobe 사용 가능 -`, ffprobeOut.split("\n")[0]);
  } catch (error) {
    console.error(`[FFmpeg] ❌ ffprobe 사용 불가`);
    return false;
  }

  return true;
};

