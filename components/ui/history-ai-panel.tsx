"use client";

import { Bot, ChevronDown } from "lucide-react";
import {
  ANALYSIS_DETAIL_FIELDS,
  analysisFieldLabel,
  type AnalysisDetailViewModel,
} from "@/lib/analysis-detail";

type HistoryAiPanelProps = {
  viewModel: AnalysisDetailViewModel;
  expanded: boolean;
  onToggle: () => void;
};

export default function HistoryAiPanel({
  viewModel,
  expanded,
  onToggle,
}: HistoryAiPanelProps) {
  const missingFields = viewModel.model.missing_fields;
  const missingLabels = missingFields.map(analysisFieldLabel);
  const availableFields = Math.max(
    0,
    ANALYSIS_DETAIL_FIELDS.length - missingFields.length,
  );

  return (
    <aside
      aria-labelledby="history-ai-heading"
      className={`min-h-0 border border-zinc-200 bg-zinc-50 transition-[width,background-color] duration-200 motion-reduce:transition-none ${
        expanded ? "rounded-xl" : "rounded-lg"
      }`}
    >
      <div
        className={`flex items-center gap-2 border-b border-zinc-200 ${
          expanded ? "justify-between p-4" : "justify-center p-2"
        }`}
      >
        <div className={expanded ? "flex min-w-0 items-center gap-2" : "sr-only"}>
          {expanded ? <Bot aria-hidden="true" className="size-4 shrink-0 text-sky-700" /> : null}
          <h2 id="history-ai-heading" className="truncate text-sm font-semibold text-zinc-900">
            AI analysis assistant
          </h2>
        </div>
        <button
          type="button"
          aria-label={expanded ? "Collapse AI analysis assistant" : "Expand AI analysis assistant"}
          aria-controls="history-ai-content"
          aria-expanded={expanded}
          onClick={onToggle}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-white hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
        >
          <ChevronDown
            aria-hidden="true"
            className={`size-4 transition-transform motion-reduce:transition-none ${expanded ? "rotate-0" : "-rotate-90"}`}
          />
        </button>
      </div>

      <div
        id="history-ai-content"
        hidden={!expanded}
        className="space-y-5 p-4"
      >
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
          <p className="font-medium">Demo mode — live AI is not connected.</p>
          <p className="mt-1 text-xs leading-5 text-sky-800">
            This panel only summarizes the fields already displayed on this page.
          </p>
        </div>

        <dl className="space-y-3 text-xs">
          <div>
            <dt className="text-zinc-500">Source</dt>
            <dd className="mt-1 break-words font-medium text-zinc-800">{viewModel.source_label}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Record status</dt>
            <dd className="mt-1 font-medium text-zinc-800">Persisted analysis record</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Available fields</dt>
            <dd className="mt-1 font-medium tabular-nums text-zinc-800">{availableFields}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Missing supporting data</dt>
            <dd className="mt-1 break-words text-zinc-800">{missingLabels.join(", ") || "None recorded"}</dd>
          </div>
        </dl>

        <div role="group" aria-label="Example prompts" className="space-y-2">
          <p className="text-[11px] font-medium text-zinc-500">Example prompts</p>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-700">Summarize this record</span>
            <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-700">What fields are missing?</span>
            <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-700">Explain the model output</span>
          </div>
        </div>

        <p className="rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-xs text-zinc-500">
          Demo only. No answer will be generated or sent.
        </p>
      </div>
    </aside>
  );
}
