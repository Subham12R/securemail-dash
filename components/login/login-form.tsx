"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { validateWorkEmail, maskEmail } from "@/lib/login-validation";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validateWorkEmail(email);
    if (!validation.valid) {
      setError(validation.error || "Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    // Simulate authentication magic link dispatch
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSubmitting(false);
    setIsSent(true);
    toast.success(`Magic link sent to ${email}`);
  };

  const handleResend = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsSubmitting(false);
    toast.success(`New magic link dispatched to ${email}`);
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Brand Icon Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm ring-1 ring-zinc-800">
          <ShieldCheck className="h-6 w-6 text-white" aria-hidden="true" />
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-zinc-900">SecureMailScope</span>
          <span className="block text-xs font-medium text-zinc-500">Security & Packet Analysis</span>
        </div>
      </div>

      {!isSent ? (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              Sign in
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Enter your work email to get a magic link.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="work-email"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-700"
              >
                Work email
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                </div>
                <input
                  id="work-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="name@company.com"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "email-error" : "email-helper"}
                  className={`block w-full rounded-lg border bg-white py-2.5 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-colors ${
                    error
                      ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                      : "border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900/10"
                  }`}
                />
              </div>

              {error ? (
                <p id="email-error" className="mt-1.5 text-xs text-red-600 font-medium">
                  {error}
                </p>
              ) : (
                <p id="email-helper" className="mt-1.5 text-xs text-zinc-500">
                  Your magic link stays active for 15 minutes.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Sending magic link...</span>
                </>
              ) : (
                <>
                  <span>Send magic link</span>
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </>
              )}
            </button>
          </form>
        </>
      ) : (
        /* Sent Confirmation State */
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-6 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900">Check your inbox</h2>
          <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
            We sent a secure magic link to{" "}
            <span className="font-semibold text-zinc-900">{maskEmail(email)}</span>. Click the link
            in your email to sign in to your workspace.
          </p>

          <div className="mt-6 space-y-3">
            <Link
              href="/"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 transition-colors"
            >
              <span>Enter Dashboard (Demo)</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleResend}
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-60"
            >
              {isSubmitting ? "Sending new link..." : "Didn't get the email? Send again"}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSent(false);
                setEmail("");
              }}
              className="block w-full text-center text-xs text-zinc-500 hover:text-zinc-800 mt-2"
            >
              Use a different email address
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
