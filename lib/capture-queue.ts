export type CaptureJobStatus =
  | "queued"
  | "running"
  | "complete"
  | "empty"
  | "failed";

export type CaptureQueuePhase =
  | "ready"
  | "uploading"
  | "queued"
  | "extracting"
  | "analyzing"
  | "complete"
  | "empty"
  | "failed";

export type CaptureJob = {
  job_id: string;
  capture_id: string;
  status: CaptureJobStatus;
  pcap_sha256: string;
  filename: string;
  attempts: number;
  session_count: number;
  processed_sessions: number;
  progress: number | null;
  error_code: string | null;
  diagnostics: Record<string, string[]>;
};

export type CaptureQueueItem = {
  id: string;
  jobId: string | null;
  filename: string;
  size: number;
  file?: File;
  phase: CaptureQueuePhase;
  uploadProgress: number | null;
  job: CaptureJob | null;
  analyzedCount: number;
  sessionCount: number;
  error: string | null;
  updatedAt: number;
};

export type StoredCaptureQueueItem = Omit<CaptureQueueItem, "file">;

export type QueueProgress = {
  label: string;
  value: number | null;
  determinate: boolean;
};

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null;
}

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function boundedPercentage(value: unknown): number | null | undefined {
  if (value === null) return null;
  if (!finiteNumber(value) || value < 0 || value > 100) return undefined;
  return value;
}

function diagnostics(value: unknown): Record<string, string[]> {
  if (!isObject(value)) return {};

  return Object.fromEntries(
    Object.entries(value).flatMap(([key, messages]) => {
      if (!Array.isArray(messages)) return [];
      const safeMessages = messages.filter(
        (message): message is string => typeof message === "string",
      );
      return [[key, safeMessages]];
    }),
  );
}

export function parseCaptureJob(value: unknown): CaptureJob {
  if (!isObject(value)) {
    throw new Error("SecureMail API returned an invalid capture job");
  }

  const progress = boundedPercentage(value.progress);
  if (
    typeof value.job_id !== "string" ||
    typeof value.capture_id !== "string" ||
    typeof value.status !== "string" ||
    !new Set<CaptureJobStatus>([
      "queued",
      "running",
      "complete",
      "empty",
      "failed",
    ]).has(value.status as CaptureJobStatus) ||
    typeof value.pcap_sha256 !== "string" ||
    typeof value.filename !== "string" ||
    !finiteNumber(value.attempts) ||
    !finiteNumber(value.session_count) ||
    !finiteNumber(value.processed_sessions) ||
    progress === undefined
  ) {
    throw new Error("SecureMail API returned an invalid capture job");
  }

  return {
    job_id: value.job_id,
    capture_id: value.capture_id,
    status: value.status as CaptureJobStatus,
    pcap_sha256: value.pcap_sha256,
    filename: value.filename,
    attempts: value.attempts,
    session_count: value.session_count,
    processed_sessions: value.processed_sessions,
    progress,
    error_code: typeof value.error_code === "string" ? value.error_code : null,
    diagnostics: diagnostics(value.diagnostics),
  };
}

export function parseCaptureJobList(value: unknown): {
  jobs: CaptureJob[];
  total: number;
  skip: number;
  limit: number;
} {
  if (
    !isObject(value) ||
    !Array.isArray(value.jobs) ||
    !finiteNumber(value.total) ||
    !finiteNumber(value.skip) ||
    !finiteNumber(value.limit)
  ) {
    throw new Error("SecureMail API returned an invalid capture job list");
  }

  return {
    jobs: value.jobs.flatMap((entry) => {
      try {
        return [parseCaptureJob(entry)];
      } catch {
        return [];
      }
    }),
    total: value.total,
    skip: value.skip,
    limit: value.limit,
  };
}

export function getQueueProgress(item: Pick<
  CaptureQueueItem,
  "phase" | "uploadProgress" | "job" | "analyzedCount" | "sessionCount"
>): QueueProgress {
  if (item.phase === "uploading") {
    return {
      label: "Uploading",
      value: item.uploadProgress,
      determinate: item.uploadProgress !== null,
    };
  }

  if (item.phase === "queued") {
    return { label: "Waiting for worker", value: null, determinate: false };
  }

  if (item.phase === "extracting") {
    return {
      label: "Extracting",
      value: item.job?.progress ?? null,
      determinate: item.job?.progress !== null && item.job?.progress !== undefined,
    };
  }

  if (item.phase === "analyzing") {
    const value =
      item.sessionCount > 0
        ? Math.min(100, Math.max(0, (item.analyzedCount / item.sessionCount) * 100))
        : null;
    return { label: "Analyzing", value, determinate: value !== null };
  }

  if (item.phase === "complete" || item.phase === "empty") {
    return {
      label: item.phase === "empty" ? "No sessions found" : "Complete",
      value: 100,
      determinate: true,
    };
  }

  return { label: "Failed", value: null, determinate: false };
}

function isQueuePhase(value: unknown): value is CaptureQueuePhase {
  return (
    typeof value === "string" &&
    new Set<CaptureQueuePhase>([
      "ready",
      "uploading",
      "queued",
      "extracting",
      "analyzing",
      "complete",
      "empty",
      "failed",
    ]).has(value as CaptureQueuePhase)
  );
}

function toStoredItem(value: unknown): StoredCaptureQueueItem | null {
  if (!isObject(value) || typeof value.id !== "string" || !value.id) return null;
  if (typeof value.jobId !== "string" || !value.jobId) return null;
  if (typeof value.filename !== "string" || !finiteNumber(value.size) || value.size < 0) {
    return null;
  }
  if (!isQueuePhase(value.phase) || value.phase === "ready" || value.phase === "uploading") {
    return null;
  }

  const uploadProgress = boundedPercentage(value.uploadProgress);
  if (uploadProgress === undefined) return null;
  if (!finiteNumber(value.analyzedCount) || value.analyzedCount < 0) return null;
  if (!finiteNumber(value.sessionCount) || value.sessionCount < 0) return null;
  if (!finiteNumber(value.updatedAt) || value.updatedAt < 0) return null;

  let job: CaptureJob | null = null;
  if (value.job !== null && value.job !== undefined) {
    try {
      job = parseCaptureJob(value.job);
    } catch {
      return null;
    }
  }

  return {
    id: value.id,
    jobId: value.jobId,
    filename: value.filename,
    size: value.size,
    phase: value.phase,
    uploadProgress,
    job,
    analyzedCount: value.analyzedCount,
    sessionCount: value.sessionCount,
    error: typeof value.error === "string" ? value.error : null,
    updatedAt: value.updatedAt,
  };
}

export function serializeQueue(items: CaptureQueueItem[]): string {
  const stored = items
    .filter((item): item is CaptureQueueItem & { jobId: string } => Boolean(item.jobId))
    .map((item) => {
      const stored = { ...item };
      delete stored.file;
      return stored;
    });
  return JSON.stringify({ version: 1, items: stored });
}

export function restoreQueue(value: string | null): CaptureQueueItem[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (!isObject(parsed) || parsed.version !== 1 || !Array.isArray(parsed.items)) {
      return [];
    }

    return parsed.items.flatMap((item) => {
      const restored = toStoredItem(item);
      return restored ? [restored] : [];
    });
  } catch {
    return [];
  }
}
