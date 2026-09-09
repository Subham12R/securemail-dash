"use client";
// beui.dev/components/agents/prompt-input

import { ArrowUp, Plus, Square, Sparkles } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { SPRING_PRESS, SPRING_SWAP } from "@/lib/ease";
import { cn } from "@/lib/utils";

export interface PromptModel {
  value: string;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface PromptAction {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface PromptInputProps
  extends Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    "value" | "defaultValue" | "onChange" | "onSubmit" | "children"
  > {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  models?: PromptModel[];
  model?: string;
  defaultModel?: string;
  onModelChange?: (model: string) => void;
  actions?: PromptAction[];
  onAction?: (action: string) => void;
  onSubmit?: (value: string, model?: string) => void | Promise<void>;
  loading?: boolean;
  onStop?: () => void;
  minRows?: number;
  maxRows?: number;
  leadingAction?: ReactNode;
  className?: string;
}

export function PromptInput({
  value,
  defaultValue = "",
  onValueChange,
  models = [],
  model,
  defaultModel,
  onModelChange,
  actions = [],
  onAction,
  onSubmit,
  loading = false,
  onStop,
  minRows = 1,
  maxRows = 5,
  leadingAction,
  className,
  disabled,
  placeholder = "Ask about this session's telemetry, TLS posture, or risk drivers…",
  "aria-label": ariaLabel = "Security Copilot Prompt",
  onKeyDown,
  ...textareaProps
}: PromptInputProps) {
  const reduce = useReducedMotion() ?? false;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const measurementRef = useRef<HTMLDivElement>(null);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [internalModel, setInternalModel] = useState(
    defaultModel ?? models[0]?.value,
  );
  const [actionsOpen, setActionsOpen] = useState(false);
  const currentValue = value ?? internalValue;
  const currentModelValue = model ?? internalModel;
  const currentModel = models.find(
    (option) => option.value === currentModelValue,
  );
  const canSubmit = Boolean(currentValue.trim()) && !disabled && !loading;

  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    const measurement = measurementRef.current;
    if (!textarea || !measurement) return;

    const lineHeight = 22;
    const nextHeight = Math.min(
      Math.max(measurement.scrollHeight, minRows * lineHeight),
      maxRows * lineHeight,
    );
    const height = `${nextHeight}px`;
    if (textarea.style.height !== height) {
      textarea.style.height = height;
    }
  }, [maxRows, minRows]);

  useLayoutEffect(() => {
    resizeTextarea();
  }, [currentValue, resizeTextarea]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(resizeTextarea);
    observer.observe(textarea);
    return () => observer.disconnect();
  }, [resizeTextarea]);

  const setValue = (next: string) => {
    if (value === undefined) setInternalValue(next);
    onValueChange?.(next);
  };

  const setModel = (next: string) => {
    if (model === undefined) setInternalModel(next);
    onModelChange?.(next);
  };

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const prompt = currentValue.trim();
    if (!prompt || disabled || loading) return;

    onSubmit?.(prompt, currentModelValue);
    if (value === undefined) setInternalValue("");
    textareaRef.current?.focus({ preventScroll: true });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown?.(event);
    if (
      event.defaultPrevented ||
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return;
    }
    event.preventDefault();
    submit();
  };

  return (
    <form
      onSubmit={submit}
      className={cn(
        "relative w-full rounded-xl border border-zinc-200 bg-white p-2.5 shadow-xs transition-colors focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-950/5",
        disabled && "opacity-60",
        className,
      )}
    >
      <div
        ref={measurementRef}
        aria-hidden="true"
        className="pointer-events-none invisible absolute inset-x-2.5 top-0 whitespace-pre-wrap px-1.5 py-1 text-xs leading-relaxed [overflow-wrap:break-word]"
      >
        {`${currentValue}\u200b`}
      </div>
      <textarea
        ref={textareaRef}
        value={currentValue}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={ariaLabel}
        rows={minRows}
        {...textareaProps}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        className="scrollbar-hide block w-full resize-none overflow-y-auto bg-transparent px-1.5 text-xs leading-relaxed text-zinc-900 outline-none placeholder:text-zinc-400"
      />

      <div className="mt-1.5 flex min-h-7 items-center justify-between gap-1.5 border-t border-zinc-100 pt-1.5">
        <div className="relative flex items-center gap-1">
          {actions.length > 0 && (
            <div className="relative">
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                disabled={disabled || loading}
                aria-label="Prompt shortcuts"
                onClick={() => setActionsOpen((prev) => !prev)}
                className="inline-flex size-6 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-zinc-900"
              >
                <motion.span
                  animate={{ rotate: actionsOpen ? 45 : 0 }}
                  transition={reduce ? { duration: 0 } : SPRING_SWAP}
                >
                  <Plus className="size-3.5" />
                </motion.span>
              </motion.button>

              <AnimatePresence>
                {actionsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    transition={SPRING_SWAP}
                    className="absolute bottom-full left-0 z-50 mb-2 w-64 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg"
                  >
                    <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
                      Quick Analysis Prompts
                    </div>
                    {actions.map((action) => (
                      <button
                        key={action.value}
                        type="button"
                        disabled={action.disabled}
                        onClick={() => {
                          onAction?.(action.value);
                          setActionsOpen(false);
                        }}
                        className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:bg-zinc-50 focus-visible:bg-zinc-50"
                      >
                        {action.icon ? (
                          <span className="mt-0.5 size-3.5 shrink-0 text-zinc-500">
                            {action.icon}
                          </span>
                        ) : (
                          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-zinc-400" />
                        )}
                        <div className="min-w-0">
                          <div className="font-medium text-zinc-800">
                            {action.label}
                          </div>
                          {action.description && (
                            <div className="text-[10px] text-zinc-500">
                              {action.description}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {leadingAction}

          {currentModel && (
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600">
              {currentModel.icon}
              <span className="max-w-28 truncate">{currentModel.label}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <motion.button
            type={loading ? "button" : "submit"}
            whileTap={{ scale: 0.92 }}
            transition={SPRING_PRESS}
            disabled={loading ? !onStop : !canSubmit}
            aria-label={loading ? "Stop generating" : "Send prompt"}
            onClick={loading ? onStop : undefined}
            className={cn(
              "grid size-6 place-items-center rounded-lg text-white transition-[background-color,transform,opacity] duration-150",
              loading
                ? "bg-zinc-800 hover:bg-zinc-900"
                : canSubmit
                  ? "bg-zinc-900 hover:bg-zinc-800 shadow-xs"
                  : "bg-zinc-200 text-zinc-400 pointer-events-none cursor-not-allowed",
            )}
          >
            <AnimatePresence initial={false} mode="popLayout">
              {loading ? (
                <motion.span
                  key="stop"
                  initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                  transition={SPRING_SWAP}
                >
                  <Square className="size-2.5 fill-current" />
                </motion.span>
              ) : (
                <motion.span
                  key="send"
                  initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                  transition={SPRING_SWAP}
                >
                  <ArrowUp className="size-3.5" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </form>
  );
}
