"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  parseCaptureJob,
  parseCaptureJobList,
  restoreQueue,
  serializeQueue,
  type CaptureJob,
  type CaptureQueueItem,
  type CaptureQueuePhase,
} from "@/lib/capture-queue";
import type { AttachmentUploadItem } from "@/components/motion/attachment-upload";
import type { AnalysisRecord } from "@/lib/securemail-api";

const STORAGE_KEY = "securemailscope:capture-queue:v1";
const POLL_INTERVAL_MS = 1_500;
const PIPELINE_LIMIT_MS = 15 * 60 * 1_000;

const ACTIVE_JOB_STATUSES = new Set(["queued", "running"]);

function now() {
  return Date.now();
}

function isActiveJobStatus(status: CaptureJob["status"]) {
  return ACTIVE_JOB_STATUSES.has(status);
}

function phaseForJob(job: CaptureJob): CaptureQueuePhase {
  if (job.status === "queued") return "queued";
  if (job.status === "running") return "extracting";
  if (job.status === "complete") return "analyzing";
  if (job.status === "empty") return "empty";
  return "failed";
}

function attachmentFromQueue(item: CaptureQueueItem): AttachmentUploadItem {
  return {
    id: item.id,
    name: item.filename,
    kind: "file",
    size: item.size,
    file: item.file,
    status: item.phase === "failed" ? "failed" : undefined,
    error: item.error ?? undefined,
  };
}

function queueItemFromAttachment(item: AttachmentUploadItem): CaptureQueueItem {
  return {
    id: item.id,
    jobId: null,
    filename: item.name,
    size: item.size ?? 0,
    file: item.file,
    phase: "ready",
    uploadProgress: null,
    job: null,
    analyzedCount: 0,
    sessionCount: 0,
    error: null,
    updatedAt: now(),
  };
}

function queueItemFromJob(job: CaptureJob): CaptureQueueItem {
  return {
    id: job.job_id,
    jobId: job.job_id,
    filename: job.filename,
    size: 0,
    phase: phaseForJob(job),
    uploadProgress: 100,
    job,
    analyzedCount: 0,
    sessionCount: job.session_count,
    error:
      job.status === "failed"
        ? `Capture extraction failed${job.error_code ? ` (${job.error_code})` : ""}.`
        : null,
    updatedAt: now(),
  };
}

function safeError(value: unknown, status?: number) {
  if (typeof value === "string" && value.trim()) return value;
  if (status) return `SecureMail API returned ${status}`;
  return "SecureMail API request failed.";
}

function apiErrorMessage(value: unknown, status: number) {
  if (typeof value !== "object" || value === null) return safeError(null, status);
  const payload = value as Record<string, unknown>;
  if (typeof payload.detail === "string") return payload.detail;
  if (typeof payload.detail === "object" && payload.detail !== null) {
    const detail = payload.detail as Record<string, unknown>;
    const error = detail.error;
    if (typeof error === "object" && error !== null) {
      const message = (error as Record<string, unknown>).message;
      if (typeof message === "string") return message;
    }
  }
  if (typeof payload.message === "string") return payload.message;
  return safeError(null, status);
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(apiErrorMessage(payload, response.status));
  return payload;
}

async function getJson(path: string) {
  const response = await fetch(path, {
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });
  return readJsonResponse(response);
}

function uploadCapture(
  file: File,
  onProgress: (value: number) => void,
): Promise<CaptureJob> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/capture-jobs");
    request.responseType = "text";
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      }
    });
    request.addEventListener("load", () => {
      const payload = (() => {
        try {
          return JSON.parse(request.responseText) as unknown;
        } catch {
          return null;
        }
      })();

      if (request.status < 200 || request.status >= 300) {
        reject(new Error(apiErrorMessage(payload, request.status)));
        return;
      }

      try {
        resolve(parseCaptureJob(payload));
      } catch (error) {
        reject(error instanceof Error ? error : new Error("Invalid capture job response"));
      }
    });
    request.addEventListener("error", () => reject(new Error("Capture upload failed.")));
    request.addEventListener("abort", () => reject(new Error("Capture upload was interrupted.")));

    const form = new FormData();
    form.append("file", file, file.name);
    request.send(form);
  });
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

function objectValue(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function parseAnalysisRecord(value: unknown): AnalysisRecord | null {
  const row = objectValue(value);
  if (
    !row ||
    typeof row.id !== "number" ||
    typeof row.request_id !== "string" ||
    typeof row.session_id !== "string" ||
    typeof row.timestamp !== "string" ||
    typeof row.risk_score !== "number" ||
    typeof row.final_verdict !== "string"
  ) {
    return null;
  }

  return {
    id: row.id,
    request_id: row.request_id,
    session_id: row.session_id,
    client_id: typeof row.client_id === "string" ? row.client_id : null,
    capture_id: typeof row.capture_id === "string" ? row.capture_id : null,
    protocol: typeof row.protocol === "string" ? row.protocol : null,
    posture: typeof row.posture === "string" ? row.posture : null,
    timestamp: row.timestamp,
    evidence_ref_count:
      typeof row.evidence_ref_count === "number" ? row.evidence_ref_count : 0,
    risk_score: row.risk_score,
    final_verdict: row.final_verdict,
    rule_score: typeof row.rule_score === "number" ? row.rule_score : null,
    rule_triggers_count:
      typeof row.rule_triggers_count === "number" ? row.rule_triggers_count : 0,
    trigger_details: Array.isArray(row.trigger_details) ? row.trigger_details : [],
    ml_scores: objectValue(row.ml_scores) ?? {},
    explanations: objectValue(row.explanations) ?? {},
    model_bundle: objectValue(row.model_bundle) ?? {},
    is_synthetic: row.is_synthetic === true,
    source_label: typeof row.source_label === "string" ? row.source_label : null,
  };
}

function sessionIdFromRecord(value: unknown) {
  const record = objectValue(value);
  const provenance = objectValue(record?.provenance);
  return typeof provenance?.session_id === "string" ? provenance.session_id : null;
}

async function getAllSessionRecords(jobId: string) {
  const records: unknown[] = [];
  let skip = 0;
  let total = 0;

  do {
    const payload = objectValue(
      await getJson(
        `/api/capture-jobs/${encodeURIComponent(jobId)}/sessions?skip=${skip}&limit=500`,
      ),
    );
    if (!payload || !Array.isArray(payload.records) || typeof payload.total !== "number") {
      throw new Error("SecureMail API returned invalid extracted sessions");
    }
    records.push(...payload.records);
    total = payload.total;
    skip += payload.records.length;
    if (payload.records.length === 0) break;
  } while (skip < total);

  return records;
}

async function getAllAnalysisResults(jobId: string) {
  const records: AnalysisRecord[] = [];
  let skip = 0;
  let total = 0;

  do {
    const payload = objectValue(
      await getJson(
        `/api/capture-jobs/${encodeURIComponent(jobId)}/results?skip=${skip}&limit=200`,
      ),
    );
    if (!payload || !Array.isArray(payload.records) || typeof payload.total !== "number") {
      throw new Error("SecureMail API returned invalid capture results");
    }
    records.push(
      ...payload.records.flatMap((record) => {
        const parsed = parseAnalysisRecord(record);
        return parsed ? [parsed] : [];
      }),
    );
    total = payload.total;
    skip += payload.records.length;
    if (payload.records.length === 0) break;
  } while (skip < total);

  return records;
}

type CaptureQueueContextValue = {
  attachments: AttachmentUploadItem[];
  queueItems: CaptureQueueItem[];
  isProcessing: boolean;
  canQueue: boolean;
  setAttachments: (items: AttachmentUploadItem[]) => void;
  removeAttachment: (item: AttachmentUploadItem) => void;
  removeQueueItem: (id: string) => void;
  queueFiles: () => Promise<void>;
  latestAnalysis: AnalysisRecord | null;
};

const CaptureQueueContext = createContext<CaptureQueueContextValue | null>(null);

export function CaptureQueueProvider({ children }: { children: ReactNode }) {
  const [attachments, setAttachmentList] = useState<AttachmentUploadItem[]>([]);
  const [queueItems, setQueueItems] = useState<CaptureQueueItem[]>([]);
  const [latestAnalysis, setLatestAnalysis] = useState<AnalysisRecord | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const queueItemsRef = useRef<CaptureQueueItem[]>([]);
  const attachmentsRef = useRef<AttachmentUploadItem[]>([]);
  const inFlightRef = useRef(new Set<string>());
  const aliveRef = useRef(true);

  useEffect(() => {
    queueItemsRef.current = queueItems;
    if (!hydrated) return;    try {
      window.localStorage.setItem(STORAGE_KEY, serializeQueue(queueItems));
    } catch {
      // Queue work continues in memory when browser storage is unavailable.
    }
  }, [hydrated, queueItems]);
  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  const updateItem = useCallback((id: string, patch: Partial<CaptureQueueItem>) => {
    if (!aliveRef.current) return;
    setQueueItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, ...patch, updatedAt: now() } : item,
      ),
    );
  }, []);

  const processJob = useCallback(
    async (id: string, initialJob: CaptureJob) => {
      let job = initialJob;
      const deadline = now() + PIPELINE_LIMIT_MS;

      updateItem(id, {
        job,
        phase: phaseForJob(job),
        sessionCount: job.session_count,
        error: null,
      });

      while (isActiveJobStatus(job.status)) {
        if (now() >= deadline) {
          throw new Error(
            "Capture processing exceeded the browser wait limit; the job may still finish on the server.",
          );
        }
        await wait(POLL_INTERVAL_MS);
        job = parseCaptureJob(
          await getJson(`/api/capture-jobs/${encodeURIComponent(job.job_id)}`),
        );
        updateItem(id, {
          job,
          phase: phaseForJob(job),
          sessionCount: job.session_count,
          error: null,
        });
      }

      if (job.status === "failed") {
        updateItem(id, {
          job,
          phase: "failed",
          error: `Capture extraction failed${job.error_code ? ` (${job.error_code})` : ""}.`,
        });
        return;
      }
      if (job.status === "empty") {
        updateItem(id, {
          job,
          phase: "empty",
          sessionCount: 0,
          analyzedCount: 0,
          error: null,
        });
        return;
      }

      const [sessionRecords, existingResults] = await Promise.all([
        getAllSessionRecords(job.job_id),
        getAllAnalysisResults(job.job_id),
      ]);
      const existingSessionIds = new Set(existingResults.map((result) => result.session_id));
      const alreadyAnalyzed = sessionRecords.filter((record) => {
        const sessionId = sessionIdFromRecord(record);
        return sessionId !== null && existingSessionIds.has(sessionId);
      }).length;
      updateItem(id, {
        job,
        phase: "analyzing",
        sessionCount: sessionRecords.length,
        analyzedCount: alreadyAnalyzed,
        error: null,
      });

      let analyzedCount = alreadyAnalyzed;
      for (const record of sessionRecords) {
        const sessionId = sessionIdFromRecord(record);
        if (!sessionId) throw new Error("SecureMail API returned a session without an ID");
        if (existingSessionIds.has(sessionId)) continue;

        await readJsonResponse(
          await fetch("/api/analyses", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              schema_version: "analysis-request.v1",
              record,
            }),
          }),
        );
        existingSessionIds.add(sessionId);
        analyzedCount += 1;
        updateItem(id, {
          job,
          phase: "analyzing",
          sessionCount: sessionRecords.length,
          analyzedCount,
          error: null,
        });
      }

      const finalResults = await getAllAnalysisResults(job.job_id);
      if (finalResults[0]) setLatestAnalysis(finalResults[0]);
      updateItem(id, {
        job,
        phase: "complete",
        sessionCount: sessionRecords.length,
        analyzedCount: sessionRecords.length,
        error: null,
      });
    },
    [updateItem],
  );

  const startPipeline = useCallback(
    async (initialItem: CaptureQueueItem) => {
      if (inFlightRef.current.has(initialItem.id)) return;
      inFlightRef.current.add(initialItem.id);

      try {
        const item = queueItemsRef.current.find((entry) => entry.id === initialItem.id) ?? initialItem;
        let job = item.job;

        if (!item.jobId) {
          if (!item.file) {
            updateItem(item.id, {
              phase: "failed",
              error: "The selected file is unavailable.",
            });
            return;
          }
          updateItem(item.id, {
            phase: "uploading",
            uploadProgress: 0,
            error: null,
          });
          job = await uploadCapture(item.file, (uploadProgress) => {
            updateItem(item.id, { phase: "uploading", uploadProgress });
          });
          updateItem(item.id, {
            jobId: job.job_id,
            filename: job.filename,
            uploadProgress: 100,
            job,
            phase: phaseForJob(job),
            sessionCount: job.session_count,
            analyzedCount: 0,
            error: null,
          });
        } else if (!job) {
          job = parseCaptureJob(
            await getJson(`/api/capture-jobs/${encodeURIComponent(item.jobId)}`),
          );
          updateItem(item.id, {
            job,
            phase: phaseForJob(job),
            sessionCount: job.session_count,
            error: null,
          });
        }

        if (!job) throw new Error("SecureMail API did not return a capture job");
        await processJob(item.id, job);
      } catch (error) {
        const current = queueItemsRef.current.find((entry) => entry.id === initialItem.id);
        const message = safeError(
          error instanceof Error ? error.message : "Capture processing failed.",
        );
        updateItem(initialItem.id, {
          phase: current?.jobId ? current.phase : "failed",
          error: message,
        });
      } finally {
        inFlightRef.current.delete(initialItem.id);
      }
    },
    [processJob, updateItem],
  );

  useEffect(() => {
    aliveRef.current = true;
    let restored: CaptureQueueItem[] = [];
    try {
      restored = restoreQueue(window.localStorage.getItem(STORAGE_KEY));
    } catch {
      restored = [];
    }
    // Hydrate the external browser store after the initial client render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQueueItems(restored);
    setAttachmentList(restored.map(attachmentFromQueue));
    // Mark storage ready only after the restored state is scheduled together.
    setHydrated(true);

    for (const item of restored) {
      if (item.jobId && ["queued", "extracting", "analyzing"].includes(item.phase)) {
        void startPipeline(item);
      }
    }

    void (async () => {
      try {
        const jobs = parseCaptureJobList(
          await getJson("/api/capture-jobs?skip=0&limit=12"),
        ).jobs.filter((job) => isActiveJobStatus(job.status));
        const knownJobIds = new Set(restored.map((item) => item.jobId).filter(Boolean));
        const additions = jobs
          .filter((job) => !knownJobIds.has(job.job_id))
          .map(queueItemFromJob);
        if (additions.length === 0) return;
        setQueueItems((current) => {
          const currentIds = new Set(current.map((item) => item.jobId));
          return [
            ...current,
            ...additions.filter((item) => !currentIds.has(item.jobId)),
          ];
        });
        setAttachmentList((current) => {
          const currentIds = new Set(current.map((item) => item.id));
          return [
            ...current,
            ...additions
              .filter((item) => !currentIds.has(item.id))
              .map(attachmentFromQueue),
          ];
        });
        for (const item of additions) void startPipeline(item);
      } catch {
        // A failed reattachment lookup must not hide locally persisted work.
      }
    })();

    return () => {
      aliveRef.current = false;
    };
  }, [startPipeline]);

  const setAttachments = useCallback((items: AttachmentUploadItem[]) => {
    setAttachmentList(items);
    setQueueItems((current) => {
      const existing = new Map(current.map((item) => [item.id, item]));
      return items.map((attachment) => {
        const previous = existing.get(attachment.id);
        return previous
          ? {
              ...previous,
              filename: attachment.name,
              size: attachment.size ?? previous.size,
              file: attachment.file ?? previous.file,
              updatedAt: now(),
            }
          : queueItemFromAttachment(attachment);
      });
    });
  }, []);

  const removeQueueItem = useCallback((id: string) => {
    setAttachmentList((current) => current.filter((entry) => entry.id !== id));
    setQueueItems((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const removeAttachment = useCallback(
    (item: AttachmentUploadItem) => removeQueueItem(item.id),
    [removeQueueItem],
  );

  const queueFiles = useCallback(async () => {
    const candidates = attachmentsRef.current.filter((attachment) => {
      const item = queueItemsRef.current.find((entry) => entry.id === attachment.id);
      return Boolean(attachment.file) && (!item || !item.jobId);
    });

    for (const attachment of candidates) {
      const item = queueItemsRef.current.find((entry) => entry.id === attachment.id);
      if (!item) {
        const next = queueItemFromAttachment(attachment);
        setQueueItems((current) => [...current, next]);
        queueItemsRef.current = [...queueItemsRef.current, next];
        await startPipeline(next);
      } else {
        await startPipeline({ ...item, file: attachment.file });
      }
    }
  }, [startPipeline]);

  const isProcessing = useMemo(
    () => queueItems.some((item) =>
      ["uploading", "queued", "extracting", "analyzing"].includes(item.phase),
    ),
    [queueItems],
  );
  const canQueue = useMemo(
    () =>
      !isProcessing &&
      attachments.some((attachment) => {
        const item = queueItems.find((entry) => entry.id === attachment.id);
        return Boolean(attachment.file) && !item?.jobId;
      }),
    [attachments, isProcessing, queueItems],
  );

  const value = useMemo(
    () => ({
      attachments,
      queueItems,
      isProcessing,
      canQueue,
      setAttachments,
      removeAttachment,
      removeQueueItem,
      queueFiles,
      latestAnalysis,
    }),
    [
      attachments,
      canQueue,
      isProcessing,
      latestAnalysis,
      queueFiles,
      queueItems,
      removeAttachment,
      removeQueueItem,
      setAttachments,
    ],
  );

  return (
    <CaptureQueueContext.Provider value={value}>
      {children}
    </CaptureQueueContext.Provider>
  );
}

export function useCaptureQueue() {
  const context = useContext(CaptureQueueContext);
  if (!context) {
    throw new Error("useCaptureQueue must be used inside CaptureQueueProvider");
  }
  return context;
}
