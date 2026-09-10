import { toast } from "sonner";

export type AlertVariant = "critical" | "warning" | "success" | "info";

export interface AppleSystemAlertAction {
  label: string;
  onClick: () => void;
}

export interface SystemAlertOptions {
  variant?: AlertVariant;
  appName?: string;
  title: string;
  description: string;
  time?: string;
  action?: AppleSystemAlertAction;
  avatarSrc?: string;
  duration?: number;
}

export interface SystemAlertPayload extends SystemAlertOptions {
  variant: AlertVariant;
  appName: string;
  time: string;
  duration: number;
}

export function buildSystemAlertPayload(options: SystemAlertOptions): SystemAlertPayload {
  const variant = options.variant ?? "info";
  const defaultDuration =
    variant === "critical" || variant === "warning" ? 8000 : 5000;

  return {
    ...options,
    variant,
    appName: options.appName || "SecureMailScope",
    time: options.time || "now",
    duration: options.duration ?? defaultDuration,
  };
}

export interface CriticalThreatNotification {
  title: string;
  description: string;
  requestId?: string;
  actionLabel?: string;
}

export function buildCriticalThreatAlert({
  title,
  description,
  requestId,
  actionLabel = "Inspect",
}: CriticalThreatNotification): SystemAlertOptions {
  return {
    variant: "critical",
    appName: "SOC Alert",
    title,
    description,
    duration: 8000,
    action: requestId
      ? {
          label: actionLabel,
          onClick: () => {
            if (typeof window !== "undefined") {
              window.location.href = `/history/${encodeURIComponent(requestId)}`;
            }
          },
        }
      : undefined,
  };
}

export function buildAnalysisCompleteAlert({
  filename,
  sessionCount,
  criticalCount = 0,
  latestRequestId,
}: {
  filename: string;
  sessionCount: number;
  criticalCount?: number;
  latestRequestId?: string;
}): SystemAlertOptions {
  if (criticalCount > 0) {
    return {
      variant: "warning",
      appName: "Analysis Engine",
      title: `Critical Threats Detected (${criticalCount})`,
      description: `${filename}: ${sessionCount} session(s) analyzed. Malicious or degraded transport flagged.`,
      duration: 8000,
      action: latestRequestId
        ? {
            label: "Inspect",
            onClick: () => {
              if (typeof window !== "undefined") {
                window.location.href = `/history/${encodeURIComponent(latestRequestId)}`;
              }
            },
          }
        : undefined,
    };
  }

  return {
    variant: "success",
    appName: "Analysis Engine",
    title: "Analysis Completed",
    description: `${filename}: ${sessionCount} session(s) analyzed. No critical violations found.`,
    duration: 5000,
    action: latestRequestId
      ? {
          label: "View details",
          onClick: () => {
            if (typeof window !== "undefined") {
              window.location.href = `/history/${encodeURIComponent(latestRequestId)}`;
            }
          },
        }
      : undefined,
  };
}

export function buildExtractionProgressAlert({
  filename,
  phase,
  sessionsExtracted,
}: {
  filename: string;
  phase: "queued" | "extracting" | "analyzing";
  sessionsExtracted?: number;
}): SystemAlertOptions {
  if (phase === "queued") {
    return {
      variant: "info",
      appName: "PCAP Queue",
      title: "Capture Queued",
      description: `${filename} added to analysis queue.`,
      duration: 3000,
    };
  }

  if (phase === "extracting") {
    return {
      variant: "info",
      appName: "PCAP Dissector",
      title: "Dissecting PCAP Packets…",
      description: `Extracting protocol streams from ${filename}.`,
      duration: 3500,
    };
  }

  return {
    variant: "info",
    appName: "Transport Security",
    title: "Evaluating Transport Security…",
    description: `Classifying ${sessionsExtracted ?? ""} session(s) against ML models and RFC rules.`,
    duration: 3500,
  };
}

export type CustomAlertRenderer = (
  payload: SystemAlertPayload & { toastId: string | number }
) => any;

let registeredRenderer: CustomAlertRenderer | null = null;

export function registerSystemAlertRenderer(renderer: CustomAlertRenderer) {
  registeredRenderer = renderer;
}

export function notifySystemAlert(options: SystemAlertOptions): string | number {
  const payload = buildSystemAlertPayload(options);
  if (typeof window === "undefined") {
    return "";
  }

  if (registeredRenderer) {
    return toast.custom(
      (id) => registeredRenderer!({ ...payload, toastId: id }),
      { duration: payload.duration }
    );
  }

  // Fallback if renderer is not registered yet
  switch (payload.variant) {
    case "critical":
      return toast.error(payload.title, {
        description: payload.description,
        duration: payload.duration,
        action: payload.action,
      });
    case "warning":
      return toast.warning(payload.title, {
        description: payload.description,
        duration: payload.duration,
        action: payload.action,
      });
    case "success":
      return toast.success(payload.title, {
        description: payload.description,
        duration: payload.duration,
        action: payload.action,
      });
    case "info":
    default:
      return toast.info(payload.title, {
        description: payload.description,
        duration: payload.duration,
      });
  }
}

export function notifyCriticalThreat(notification: CriticalThreatNotification) {
  return notifySystemAlert(buildCriticalThreatAlert(notification));
}

export function notifyAnalysisComplete(args: {
  filename: string;
  sessionCount: number;
  criticalCount?: number;
  latestRequestId?: string;
}) {
  return notifySystemAlert(buildAnalysisCompleteAlert(args));
}

export function notifyExtractionProgress(args: {
  filename: string;
  phase: "queued" | "extracting" | "analyzing";
  sessionsExtracted?: number;
}) {
  return notifySystemAlert(buildExtractionProgressAlert(args));
}
