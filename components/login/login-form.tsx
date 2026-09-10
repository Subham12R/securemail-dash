"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { validateWorkEmail } from "@/lib/login-validation";

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validateWorkEmail(email);
    if (!validation.valid) {
      setError(validation.error || "Please enter a valid work email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const payload =
        mode === "register"
          ? { email: email.trim(), password, display_name: displayName.trim() || undefined }
          : { email: email.trim(), password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setError(data?.error || (mode === "register" ? "Registration failed." : "Invalid credentials."));
        setIsSubmitting(false);
        return;
      }

      toast.success(
        mode === "register"
          ? `Account created! Welcome, ${data.profile?.display_name || "Analyst"}.`
          : data.profile?.display_name
            ? `Welcome back, ${data.profile.display_name}!`
            : "Signed in successfully!",
      );
      router.push("/");
      router.refresh();
    } catch {
      setError("Unable to connect to authentication service.");
      setIsSubmitting(false);
    }
  };

  const handleFillDemo = (targetEmail = "0day@company.com", targetPass = "0day@SIH26") => {
    setEmail(targetEmail);
    setPassword(targetPass);
    if (mode === "register") {
      setDisplayName("0day");
    }
    setError(null);
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

      {/* Mode Switcher Tabs */}
      <div className="mb-6 flex rounded-lg bg-zinc-100 p-1">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setError(null);
          }}
          className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
            mode === "login"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("register");
            setError(null);
          }}
          className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
            mode === "register"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          Register
        </button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          {mode === "register" ? "Create an account" : "Sign in"}
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          {mode === "register"
            ? "Enter your work email to register your enterprise account."
            : "Enter your work email and password to access the dashboard."}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Full Name / Display Name (Register mode only) */}
        {mode === "register" && (
          <div>
            <label
              htmlFor="display-name"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-700"
            >
              Full name / Call-sign
            </label>
            <div className="relative mt-1.5">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                <UserIcon className="h-4 w-4" aria-hidden="true" />
              </div>
              <input
                id="display-name"
                name="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="0day Analyst"
                className="block w-full rounded-lg border border-zinc-300 bg-white py-2.5 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Work Email Field */}
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
              placeholder="0day@company.com"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "auth-error" : "email-helper"}
              className={`block w-full rounded-lg border bg-white py-2.5 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-colors ${
                error
                  ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                  : "border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900/10"
              }`}
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-700"
            >
              Password
            </label>
            <span className="text-xs text-zinc-400">Enterprise SSO</span>
          </div>
          <div className="relative mt-1.5">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
              <Lock className="h-4 w-4" aria-hidden="true" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="••••••••••••"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "auth-error" : undefined}
              className={`block w-full rounded-lg border bg-white py-2.5 pl-9 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-colors ${
                error
                  ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                  : "border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900/10"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-700"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Error Feedback */}
        {error ? (
          <div id="auth-error" className="rounded-lg bg-red-50 p-2.5 border border-red-200">
            <p className="text-xs text-red-700 font-medium">{error}</p>
          </div>
        ) : (
          <p id="email-helper" className="text-xs text-zinc-500">
            {mode === "register"
              ? "Requires authorized organization domain (@company.com)."
              : "Requires authorized enterprise organization credentials."}
          </p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="group relative flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>{mode === "register" ? "Registering account..." : "Authenticating..."}</span>
            </>
          ) : (
            <>
              <span>{mode === "register" ? "Create enterprise account" : "Sign in"}</span>
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </>
          )}
        </button>
      </form>

      {/* Enterprise Account Quick Fill */}
      <div className="mt-6 border-t border-zinc-200 pt-4 text-center">
        <button
          type="button"
          onClick={() => handleFillDemo("0day@company.com", "0day@SIH26")}
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          <span>Fill credentials:</span>
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px] text-zinc-800 border border-zinc-200">
            0day@company.com
          </code>
        </button>
      </div>
    </div>
  );
}
