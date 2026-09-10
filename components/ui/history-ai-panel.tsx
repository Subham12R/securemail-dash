"use client";

import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import Image from "next/image";
import {
  User,
  RotateCcw,
  Copy,
  Check,
  PanelRightClose,
  ArrowUp,
  Circle,
  CheckCircle2,
} from "lucide-react";
import { motion } from "motion/react";
import {
  requestRiskInsight,
  type AgentActiveStep,
} from "@/lib/agent-insights";
import type { AnalysisRecord } from "@/lib/securemail-api";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageTyping,
  MessageBubble,
  MessageBubbleContent,
} from "@/components/agents/message";
import { ThinkingShimmer } from "@/components/agents/agent-activity";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  from: "user" | "assistant";
  content: string;
  timestamp: string;
}

export type HistoryAiPanelProps = {
  analysis: AnalysisRecord;
  expanded: boolean;
  onToggle: () => void;
};

const DEFAULT_RISK_QUESTION = "Explain the main risk drivers and recommend next steps.";

function formatInsight(status: string, answer: string | null, recommendations: readonly string[]) {
  const response = answer ?? `The SecureMail agent returned no analysis (status: \`${status}\`).`;
  return recommendations.length > 0
    ? `${response}\n\n### Recommended next steps\n${recommendations.map((recommendation) => `- ${recommendation}`).join("\n")}`
    : response;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function stepStatusLabel(status: AgentActiveStep["status"]): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "pending":
      return "Pending";
    default:
      return "In progress";
  }
}

function parseMarkdownSnippet(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
    const codeMatch = remaining.match(/`([^`]+)`/);

    const boldIdx = boldMatch && boldMatch.index !== undefined ? boldMatch.index : -1;
    const codeIdx = codeMatch && codeMatch.index !== undefined ? codeMatch.index : -1;

    let nextMatch: { type: "bold" | "code"; index: number; full: string; inner: string } | null = null;

    if (boldIdx !== -1 && (codeIdx === -1 || boldIdx < codeIdx)) {
      nextMatch = { type: "bold", index: boldIdx, full: boldMatch![0], inner: boldMatch![1] };
    } else if (codeIdx !== -1) {
      nextMatch = { type: "code", index: codeIdx, full: codeMatch![0], inner: codeMatch![1] };
    }

    if (!nextMatch) {
      parts.push(remaining);
      break;
    }

    if (nextMatch.index > 0) {
      parts.push(remaining.substring(0, nextMatch.index));
    }

    if (nextMatch.type === "bold") {
      parts.push(
        <strong key={`b-${keyIdx++}`} className="font-semibold text-zinc-900">
          {nextMatch.inner}
        </strong>
      );
    } else if (nextMatch.type === "code") {
      parts.push(
        <code
          key={`c-${keyIdx++}`}
          className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[0.82em] text-zinc-800 border border-zinc-200/60 break-all"
        >
          {nextMatch.inner}
        </code>
      );
    }

    remaining = remaining.substring(nextMatch.index + nextMatch.full.length);
  }

  return <>{parts}</>;
}

function FormattedContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let listBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length > 0) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="my-1.5 space-y-1 pl-3.5 list-disc text-xs text-zinc-700">
          {listBuffer.map((item, i) => (
            <li key={i} className="leading-relaxed">
              {parseMarkdownSnippet(item)}
            </li>
          ))}
        </ul>
      );
      listBuffer = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    if (trimmed.startsWith("### ")) {
      flushList();
      blocks.push(
        <h4 key={`h-${blocks.length}`} className="mt-2.5 mb-1 text-xs font-semibold text-zinc-900">
          {parseMarkdownSnippet(trimmed.substring(4))}
        </h4>
      );
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      listBuffer.push(trimmed.substring(2));
    } else {
      flushList();
      blocks.push(
        <p key={`p-${blocks.length}`} className="mt-1 text-xs leading-relaxed text-zinc-800">
          {parseMarkdownSnippet(trimmed)}
        </p>
      );
    }
  }

  flushList();
  return <div className="space-y-0.5">{blocks}</div>;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard", {
        description: "Analysis notes ready for incident triage.",
        duration: 2500,
      });
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Fallback
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Copied" : "Copy response"}
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-2 focus-visible:outline-zinc-900"
    >
      {copied ? (
        <>
          <Check className="size-2.5 text-emerald-600" />
          <span className="text-emerald-600">Copied</span>
        </>
      ) : (
        <>
          <Copy className="size-2.5" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

export default function HistoryAiPanel({
  analysis,
  expanded,
  onToggle,
}: HistoryAiPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeStep, setActiveStep] = useState<AgentActiveStep | null>(null);
  const [memoryRevision, setMemoryRevision] = useState<number | null>(null);
  const [memoryPersisted, setMemoryPersisted] = useState<boolean | null>(null);
  const [lastInsightStatus, setLastInsightStatus] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [showExpandedContent, setShowExpandedContent] = useState(expanded);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initializedRequestRef = useRef<string | null>(null);

  const askRiskQuestion = useCallback(async (question: string) => {
    const userMsg: ChatMessage = {
      id: `user-${globalThis.crypto.randomUUID()}`,
      from: "user",
      content: question,
      timestamp: formatTime(new Date()),
    };

    setMessages((previous) => [...previous, userMsg]);
    setIsGenerating(true);

    try {
      const insight = await requestRiskInsight(analysis, question);
      setActiveStep(insight.activeStep);
      setMemoryRevision(insight.memoryRevision);
      setMemoryPersisted(insight.memoryPersisted);
      setLastInsightStatus(insight.status);
      setMessages((previous) => [...previous, {
        id: `asst-${globalThis.crypto.randomUUID()}`,
        from: "assistant",
        content: formatInsight(insight.status, insight.answer, insight.recommendations),
        timestamp: formatTime(new Date()),
      }]);
    } catch (error) {
      setLastInsightStatus("error");
      setMemoryRevision(null);
      setMemoryPersisted(null);
      setMessages((previous) => [...previous, {
        id: `err-${globalThis.crypto.randomUUID()}`,
        from: "assistant",
        content: error instanceof Error ? error.message : "SecureMail agent is unavailable.",
        timestamp: formatTime(new Date()),
      }]);
    } finally {
      setIsGenerating(false);
    }
  }, [analysis]);

  const resetConversation = useCallback(() => {
    setMessages([]);
    setActiveStep(null);
    setMemoryRevision(null);
    setMemoryPersisted(null);
    setLastInsightStatus(null);
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
    void askRiskQuestion(DEFAULT_RISK_QUESTION);
  }, [askRiskQuestion]);

  useEffect(() => {
    if (initializedRequestRef.current === analysis.request_id) return;
    initializedRequestRef.current = analysis.request_id;
    resetConversation();
  }, [analysis.request_id, resetConversation]);

  useEffect(() => {
    const revealDelay = expanded ? 280 : 500;
    const contentId = window.setTimeout(() => setShowExpandedContent(expanded), revealDelay);
    return () => window.clearTimeout(contentId);
  }, [expanded]);

  // Auto-scroll to bottom on new messages (only when user has engaged)
  useEffect(() => {
    if (expanded && scrollerRef.current && messages.length > 1) {
      scrollerRef.current.scrollTo({
        top: scrollerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isGenerating, expanded]);

  // Handle textarea autosize (1 to 3 rows)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 72)}px`;
  }, [inputVal]);

  const handleSendPrompt = (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed || isGenerating) return;

    setInputVal("");
    void askRiskQuestion(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendPrompt(inputVal);
    }
  };

  const isClosing = !expanded && showExpandedContent;

  return (
    <aside
      aria-labelledby="history-ai-heading"
      className={cn(
        "flex flex-col self-start border border-zinc-200 bg-white shadow-[0_18px_40px_rgba(24,24,27,0.14)] will-change-[width,height]",
        expanded ? "overflow-hidden" : "overflow-visible",
        expanded
          ? "w-full rounded-2xl p-4 h-[min(720px,calc(100dvh-9rem))] lg:sticky lg:top-20"
          : "fixed bottom-4 right-4 w-12 h-12 items-center rounded-full border-0 bg-transparent p-0 shadow-none lg:bottom-6 lg:right-6"
      )}
      style={{
        transitionProperty: "width, height",
        transitionDuration: expanded ? "280ms, 220ms" : "220ms, 280ms",
        transitionDelay: expanded ? "0ms, 280ms" : "0ms, 220ms",
        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {/* Panel Header */}
      <div
        className={cn(
          "flex w-full shrink-0 items-center border-b border-zinc-200/80 bg-transparent px-2 text-zinc-900",
          showExpandedContent && !isClosing
            ? "h-12 justify-between"
            : cn(
                "h-12 w-12 justify-center rounded-full border border-zinc-300 bg-zinc-900 px-0 shadow-lg",
                !expanded && "h-full w-full",
                isClosing && "opacity-0"
              )
        )}
      >
        {showExpandedContent ? (
          <>
            <div className="flex min-w-0 items-center gap-2">
              <div className="grid size-6 place-items-center rounded-md bg-white border border-zinc-200/70 p-0.5 shadow-2xs">
                <Image
                  src="/logo-mark.png"
                  alt="SecureMailScope Agent"
                  width={20}
                  height={20}
                  className="size-4 object-contain"
                />
              </div>
              <h2
                id="history-ai-heading"
                className="text-xs font-semibold text-zinc-900"
              >
                SecureMailScope Agent
              </h2>
            </div>

            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={resetConversation}
                disabled={isGenerating}
                aria-label="Reset conversation"
                title="Reset conversation"
                className="inline-flex size-6.5 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50 transition-colors"
              >
                <RotateCcw className="size-3.5" />
              </button>

              <button
                type="button"
                aria-label="Collapse assistant panel"
                aria-controls="history-ai-content"
                aria-expanded={expanded}
                onClick={onToggle}
                className="inline-flex size-6.5 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
              >
                <PanelRightClose className="size-3.5" />
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            aria-label="Expand SecureMailScope Agent"
            aria-controls="history-ai-content"
            aria-expanded={expanded}
            onClick={onToggle}
            className="group relative grid size-8 place-items-center rounded-lg hover:bg-white/10 transition-colors"
            aria-describedby="history-ai-tooltip"
          >
            <span
              id="history-ai-tooltip"
              role="tooltip"
              className="pointer-events-none absolute right-full bottom-1/2 mr-3 translate-y-1/2 whitespace-nowrap rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
            >
              Open SecureMailScope Agent
            </span>
            <Image
              src="/logo-mark.png"
              alt="SecureMailScope Agent"
              width={20}
              height={20}
              className="size-4.5 object-contain"
            />
          </button>
        )}
      </div>

      {/* Main Conversation Body */}
      {showExpandedContent ? (
        <div
          id="history-ai-content"
          className={cn(
            "flex flex-1 min-h-0 flex-col justify-between overflow-hidden",
            isClosing && "pointer-events-none opacity-0"
          )}
        >
          {/* Messages Scroll Area */}
          <div
            ref={scrollerRef}
            aria-live="polite"
            aria-busy={isGenerating}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 space-y-3"
          >
            {messages.map((msg) => (
              <Message
                key={msg.id}
                from={msg.from}
                animateIn
                className="w-full gap-2"
              >
                <MessageAvatar className="size-6 shrink-0 rounded-full">
                  {msg.from === "assistant" ? (
                    <div className="grid size-full place-items-center bg-white border border-zinc-200/70 rounded-full p-0.5 shadow-2xs">
                      <Image
                        src="/logo-mark.png"
                        alt="SecureMailScope Agent"
                        width={16}
                        height={16}
                        className="size-3.5 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="grid size-full place-items-center bg-zinc-800 text-white">
                      <User className="size-3" />
                    </div>
                  )}
                </MessageAvatar>

                <MessageContent className="gap-1">
                  {/* Message Bubble */}
                  <MessageBubble
                    variant={msg.from === "user" ? "solid" : "outline"}
                    align={msg.from === "user" ? "end" : "start"}
                  >
                    <MessageBubbleContent
                      className={cn(
                        "rounded-2xl text-xs py-2 px-3",
                        msg.from === "user"
                          ? "bg-zinc-900 text-white rounded-br-sm max-w-[85%]"
                          : "border-transparent bg-transparent text-zinc-900 rounded-tl-sm max-w-[92%]"
                      )}
                    >
                      {msg.from === "user" ? (
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <FormattedContent content={msg.content} />
                      )}
                    </MessageBubbleContent>
                  </MessageBubble>

                  {/* Message Footer */}
                  <MessageFooter className="gap-1.5 text-[9.5px]">
                    <span className="text-zinc-400">{msg.timestamp}</span>
                    {msg.from === "assistant" && (
                      <CopyButton text={msg.content} />
                    )}
                  </MessageFooter>
                </MessageContent>
              </Message>
            ))}

            {/* Live Thinking Indicator */}
            {isGenerating && (
              <Message from="assistant" animateIn className="w-full gap-2">
                <MessageAvatar className="size-6 shrink-0 rounded-full">
                  <div className="grid size-full place-items-center bg-white border border-zinc-200/70 rounded-full p-0.5 shadow-2xs">
                    <Image
                      src="/logo-mark.png"
                      alt="SecureMailScope Agent"
                      width={16}
                      height={16}
                      className="size-3.5 object-contain"
                    />
                  </div>
                </MessageAvatar>
                <MessageContent>
                  <div className="rounded-xl border border-zinc-200/70 bg-zinc-50/60 px-2.5 py-1.5 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                      <MessageTyping label="SecureMailScope Agent is thinking" />
                      <ThinkingShimmer duration={1.6}>
                        Reviewing analysis evidence…
                      </ThinkingShimmer>
                    </div>
                  </div>
                </MessageContent>
              </Message>
            )}

            {activeStep ? (
              <section
                aria-labelledby="history-ai-step-heading"
                className="rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-2.5"
              >
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-zinc-300 bg-white text-zinc-600">
                    {activeStep.status === "completed" ? (
                      <CheckCircle2 aria-hidden="true" className="size-3.5 text-emerald-600" />
                    ) : (
                      <Circle aria-hidden="true" className="size-3.5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                      <h3 id="history-ai-step-heading" className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                        Current verification step
                      </h3>
                      <span className="text-[10px] font-medium text-zinc-500">
                        {stepStatusLabel(activeStep.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-medium leading-5 text-zinc-900">
                      {activeStep.title}
                    </p>
                    {activeStep.evidence.length > 0 ? (
                      <p className="mt-1 break-words text-[10px] leading-4 text-zinc-500">
                        Evidence: {activeStep.evidence.join(", ")}
                      </p>
                    ) : null}
                  </div>
                </div>
              </section>
            ) : null}

            {lastInsightStatus && lastInsightStatus !== "complete" ? (
              <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-4 text-amber-800">
                SecureMailScope Agent status: {lastInsightStatus}. Try again or reset the conversation.
              </p>
            ) : null}

            {memoryPersisted !== null ? (
              <p role="status" className="text-[10px] text-zinc-400">
                {memoryPersisted
                  ? `Conversation memory saved · turn ${memoryRevision ?? 0}`
                  : lastInsightStatus === "complete"
                    ? "Answer returned, but conversation memory could not be saved."
                    : "Conversation memory is unavailable for this response."}
              </p>
            ) : null}
          </div>

          <div className="shrink-0 border-t border-zinc-100 bg-white px-3 py-2">
            {/* Streamlined Input Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendPrompt(inputVal);
              }}
              className="relative flex min-h-20 flex-col items-stretch rounded-xl border border-zinc-200 bg-zinc-50/60 px-3 py-2.5 shadow-[0_1px_3px_rgba(15,23,42,0.06)] focus-within:border-zinc-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-zinc-950/5 transition-all"
            >
              <textarea
                ref={textareaRef}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                aria-label="Ask SecureMailScope Agent about this analysis"
                placeholder="Ask about this session’s risk…"
                rows={1}
                disabled={isGenerating}
                className="scrollbar-hide min-h-8 w-full resize-none bg-transparent pr-10 text-xs leading-5 text-zinc-900 outline-none placeholder:text-zinc-400 max-h-[72px]"
              />

              <motion.button
                type="submit"
                whileTap={{ scale: 0.92 }}
                disabled={!inputVal.trim() || isGenerating}
                aria-label="Send prompt"
                className={cn(
                  "absolute bottom-2 right-2 grid size-7 shrink-0 place-items-center rounded-lg transition-colors",
                  inputVal.trim() && !isGenerating
                    ? "bg-zinc-900 text-white hover:bg-zinc-800 shadow-2xs cursor-pointer"
                    : "bg-zinc-200/80 text-zinc-400 cursor-not-allowed"
                )}
              >
                <ArrowUp className="size-3.5" />
              </motion.button>
            </form>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
