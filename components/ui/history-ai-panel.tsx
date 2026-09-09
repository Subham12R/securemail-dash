"use client";

import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import Image from "next/image";
import {
  User,
  RotateCcw,
  Copy,
  Check,
  Sparkles,
  Search,
  Lock,
  FileCode2,
  FileText,
  PanelRightClose,
  PanelRightOpen,
  ArrowUp,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { type AnalysisDetailViewModel } from "@/lib/analysis-detail";
import {
  generateInitialGreeting,
  processAiQuery,
  type AgentActivityStep,
  type AiAssistantResponse,
} from "@/lib/ai-assistant-engine";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageTyping,
  MessageBubble,
  MessageBubbleContent,
  MessageBubbleCollapsible,
} from "@/components/agents/message";
import {
  AgentActivity,
  ThinkingShimmer,
  type AgentActivityItem,
} from "@/components/agents/agent-activity";
import { SPRING_PRESS, SPRING_SWAP } from "@/lib/ease";
import { cn } from "@/lib/utils";

function toAgentActivityItems(steps: AgentActivityStep[]): AgentActivityItem[] {
  return steps.map((step) => {
    if (step.type === "tool") {
      return {
        id: step.id,
        type: "tool" as const,
        action: (step.action || "read") as "read",
        target: step.label,
      };
    }
    if (step.type === "trace") {
      return {
        id: step.id,
        type: "trace" as const,
        kind: "thinking" as const,
        label: step.label,
        detail: step.detail,
      };
    }
    return {
      id: step.id,
      type: "step" as const,
      label: step.label,
      status: step.status ?? "complete",
    };
  });
}

interface ChatMessage {
  id: string;
  from: "user" | "assistant";
  content: string;
  timestamp: string;
  activitySteps?: AgentActivityStep[];
  technicalPayload?: string;
  suggestedPrompts?: string[];
}

export type HistoryAiPanelProps = {
  viewModel: AnalysisDetailViewModel;
  expanded: boolean;
  onToggle: () => void;
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
  viewModel,
  expanded,
  onToggle,
}: HistoryAiPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize or reset conversation when session changes
  const resetConversation = useCallback(() => {
    const greeting = generateInitialGreeting(viewModel);
    const initialMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      from: "assistant",
      content: greeting.reply,
      timestamp: formatTime(new Date()),
      activitySteps: greeting.activitySteps,
      suggestedPrompts: greeting.suggestedPrompts,
    };
    setMessages([initialMsg]);
  }, [viewModel]);

  useEffect(() => {
    resetConversation();
  }, [resetConversation]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (expanded && scrollerRef.current) {
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

  const handleSendPrompt = async (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed || isGenerating) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      from: "user",
      content: trimmed,
      timestamp: formatTime(new Date()),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setIsGenerating(true);

    try {
      const response: AiAssistantResponse = await processAiQuery(trimmed, viewModel);

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        from: "assistant",
        content: response.reply,
        timestamp: formatTime(new Date()),
        activitySteps: response.activitySteps,
        technicalPayload: response.technicalPayload,
        suggestedPrompts: response.suggestedPrompts,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        from: "assistant",
        content: "Error evaluating session telemetry. Please try again.",
        timestamp: formatTime(new Date()),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendPrompt(inputVal);
    }
  };

  const lastAssistantMessage = [...messages].reverse().find((m) => m.from === "assistant");
  const suggestedPrompts = lastAssistantMessage?.suggestedPrompts ?? [
    "Explain the risk drivers",
    "Inspect TLS posture",
    "What evidence is missing?",
  ];

  return (
    <aside
      aria-labelledby="history-ai-heading"
      className={cn(
        "flex flex-col self-start overflow-hidden border border-zinc-200/90 bg-white shadow-xs transition-all duration-200 lg:sticky lg:top-20",
        expanded
          ? "w-full rounded-2xl h-[min(460px,calc(100dvh-7.5rem))]"
          : "w-11 rounded-xl items-center h-auto py-1.5"
      )}
    >
      {/* Panel Header */}
      <div
        className={cn(
          "flex h-11 w-full shrink-0 items-center border-b border-zinc-100 bg-zinc-50/50 px-3",
          expanded ? "justify-between" : "justify-center px-0"
        )}
      >
        {expanded ? (
          <>
            <div className="flex min-w-0 items-center gap-2">
              <div className="grid size-6 place-items-center rounded-md bg-white border border-zinc-200/70 p-0.5 shadow-2xs">
                <Image
                  src="/logo-mark.png"
                  alt="Secure Agent"
                  width={20}
                  height={20}
                  className="size-4 object-contain"
                />
              </div>
              <h2
                id="history-ai-heading"
                className="text-xs font-semibold text-zinc-900"
              >
                Secure Agent
              </h2>
            </div>

            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={resetConversation}
                disabled={isGenerating}
                aria-label="Reset conversation"
                title="Reset conversation"
                className="inline-flex size-6.5 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50 transition-colors"
              >
                <RotateCcw className="size-3.5" />
              </button>

              <button
                type="button"
                aria-label="Collapse assistant panel"
                aria-controls="history-ai-content"
                aria-expanded={expanded}
                onClick={onToggle}
                className="inline-flex size-6.5 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
              >
                <PanelRightClose className="size-3.5" />
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            aria-label="Expand Secure Agent"
            aria-controls="history-ai-content"
            aria-expanded={expanded}
            onClick={onToggle}
            className="grid size-8 place-items-center rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <Image
              src="/logo-mark.png"
              alt="Secure Agent"
              width={20}
              height={20}
              className="size-4.5 object-contain"
            />
          </button>
        )}
      </div>

      {/* Main Conversation Body */}
      {expanded ? (
        <div id="history-ai-content" className="flex flex-1 min-h-0 flex-col justify-between overflow-hidden">
          {/* Messages Scroll Area */}
          <div
            ref={scrollerRef}
            className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-3"
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
                        alt="Secure Agent"
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
                  {/* Reasoning / Execution Traces */}
                  {msg.activitySteps && msg.activitySteps.length > 0 && (
                    <div className="mb-0.5 w-full max-w-[95%]">
                      <AgentActivity
                        items={toAgentActivityItems(msg.activitySteps)}
                        status="complete"
                        defaultOpen={false}
                        summary={`Analyzed ${msg.activitySteps.length} telemetry checks`}
                        className="rounded-lg border border-zinc-200/60 bg-zinc-50/70 p-1.5 text-[11px]"
                      />
                    </div>
                  )}

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
                          : "border-zinc-200/70 bg-zinc-50/60 text-zinc-900 rounded-tl-sm max-w-[92%]"
                      )}
                    >
                      {msg.from === "user" ? (
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <FormattedContent content={msg.content} />
                      )}

                      {/* Technical payload collapsible */}
                      {msg.technicalPayload && (
                        <div className="mt-2 border-t border-zinc-200/60 pt-1.5">
                          <MessageBubbleCollapsible
                            moreLabel="View payload"
                            lessLabel="Hide payload"
                            collapsedLines={2}
                            triggerClassName="text-[10px] text-zinc-500 hover:text-zinc-800 h-6 px-1.5"
                          >
                            <pre className="mt-1 overflow-x-auto rounded-md bg-zinc-950 p-2 font-mono text-[10px] text-emerald-400 max-h-32">
                              <code>{msg.technicalPayload}</code>
                            </pre>
                          </MessageBubbleCollapsible>
                        </div>
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
                      alt="Secure Agent"
                      width={16}
                      height={16}
                      className="size-3.5 object-contain"
                    />
                  </div>
                </MessageAvatar>
                <MessageContent>
                  <div className="rounded-xl border border-zinc-200/70 bg-zinc-50/60 px-2.5 py-1.5 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                      <MessageTyping label="Thinking" />
                      <ThinkingShimmer duration={1.6}>
                        Analyzing telemetry…
                      </ThinkingShimmer>
                    </div>
                  </div>
                </MessageContent>
              </Message>
            )}
          </div>

          {/* Bottom Area: Suggestions & Composer */}
          <div className="shrink-0 border-t border-zinc-100 bg-white px-3 py-2 space-y-1.5">
            {/* Quick Suggestions Chips */}
            {suggestedPrompts.length > 0 && !isGenerating && (
              <div className="flex flex-wrap gap-1">
                {suggestedPrompts.slice(0, 2).map((prompt, idx) => (
                  <motion.button
                    key={idx}
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    transition={SPRING_PRESS}
                    onClick={() => handleSendPrompt(prompt)}
                    className="inline-flex items-center gap-1 rounded-full border border-zinc-200/70 bg-zinc-50 px-2 py-0.5 text-[10.5px] font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900"
                  >
                    <Sparkles className="size-2.5 text-zinc-400" />
                    <span>{prompt}</span>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Streamlined Input Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendPrompt(inputVal);
              }}
              className="relative flex items-center rounded-xl border border-zinc-200 bg-zinc-50/60 px-2.5 py-1.5 focus-within:border-zinc-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-zinc-950/5 transition-all"
            >
              <textarea
                ref={textareaRef}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about risk, TLS, or findings…"
                rows={1}
                disabled={isGenerating}
                className="scrollbar-hide flex-1 resize-none bg-transparent text-xs leading-5 text-zinc-900 outline-none placeholder:text-zinc-400 min-h-[20px] max-h-[72px]"
              />

              <motion.button
                type="submit"
                whileTap={{ scale: 0.92 }}
                disabled={!inputVal.trim() || isGenerating}
                aria-label="Send prompt"
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-lg transition-colors ml-1.5",
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
