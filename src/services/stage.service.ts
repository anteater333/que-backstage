// Stage DB 접근 서비스 관련 코드

export interface StageTable {
  id: string;
  sourceUrl: string | null;
  status:
    | "INITIATED"
    | "UPLOADING"
    | "QUEUED"
    | "PROCESSING"
    | "DONE"
    | "FAILED";
}

