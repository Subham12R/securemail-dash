import { toast } from "sonner";

export interface CriticalThreatNotification {
  title: string;
  description: string;
  requestId?: string;
  actionLabel?: string;
}

export function notifyCriticalThreat({
  title,
  description,
  requestId,
  actionLabel = "Inspect",
}: CriticalThreatNotification) {
  toast.error(title, {
    description,
    duration: 8000,
    action: requestId
      ? {
          label: actionLabel,
          onClick: () => {
            window.location.href = `/history/${encodeURIComponent(requestId)}`;
          },
        }
      : undefined,
  });
}

export function notifyAnalysisComplete({
  filename,
  sessionCount,
  criticalCount = 0,
  latestRequestId,
}: {
  filename: string;
  sessionCount: number;
  criticalCount?: number;
  latestRequestId?: string;
}) {
  if (criticalCount > 0) {
    toast.warning(`Critical Threats Detected (${criticalCount})`, {
      description: `${filename}: ${sessionCount} session(s) analyzed. Malicious or degraded transport flagged.`,
      duration: 8000,
      action: latestRequestId
        ? {
            label: "Inspect",
            onClick: () => {
              window.location.href = `/history/${encodeURIComponent(latestRequestId)}`;
            },
          }
        : undefined,
    });
  } else {
    toast.success("Analysis Completed", {
      description: `${filename}: ${sessionCount} session(s) analyzed. No critical violations found.`,
      duration: 5000,
      action: latestRequestId
        ? {
            label: "View details",
            onClick: () => {
              window.location.href = `/history/${encodeURIComponent(latestRequestId)}`;
            },
          }
        : undefined,
    });
  }
}

export function notifyExtractionProgress({
  filename,
  phase,
  sessionsExtracted,
}: {
  filename: string;
  phase: "queued" | "extracting" | "analyzing";
  sessionsExtracted?: number;
}) {
  if (phase === "queued") {
    toast.info("Capture Queued", {
      description: `${filename} added to analysis queue.`,
      duration: 3000,
    });
  } else if (phase === "extracting") {
    toast.info("Dissecting PCAP Packets…", {
      description: `Extracting protocol streams from ${filename}.`,
      duration: 3500,
    });
  } else if (phase === "analyzing") {
    toast.info("Evaluating Transport Security…", {
      description: `Classifying ${sessionsExtracted ?? ""} session(s) against ML models and RFC rules.`,
      duration: 3500,
    });
  }
}
