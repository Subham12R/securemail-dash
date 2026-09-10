import type { Metadata } from "next";
import { Star } from "lucide-react";
import DitherCanvas from "@/components/login/dither-canvas";
import LoginForm from "@/components/login/login-form";
import { EnterpriseLogos } from "@/components/login/enterprise-logos";

export const metadata: Metadata = {
  title: "Sign in | SecureMailScope",
  description: "Sign in to SecureMailScope to analyze SMTP, IMAP, and POP3 network sessions.",
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col md:flex-row bg-white overflow-x-hidden">
      {/* Left Column: Sign-in Form */}
      <div className="flex w-full flex-col justify-between p-6 sm:p-10 md:w-1/2 lg:w-[45%] xl:w-[40%] md:min-h-screen md:p-12 lg:p-16 z-10 bg-white">
        <div className="flex-1 flex flex-col justify-center py-8">
          <LoginForm />
        </div>

        {/* Left Column Footer */}
        <div className="text-xs text-zinc-400">
          <p>© {new Date().getFullYear()} SecureMailScope Inc. All rights reserved.</p>
        </div>
      </div>

      {/* Right Column: Animated Dither Canvas & Testimonial Overlay */}
      <div className="relative hidden md:flex flex-1 flex-col justify-between overflow-hidden border-l border-zinc-200/80 bg-zinc-50 p-8 sm:p-12 lg:p-16">
        {/* Animated Dither Canvas Background */}
        <DitherCanvas />

        {/* Center Testimonial Card Overlay */}
        <div className="relative z-10 my-auto max-w-xl">
          {/* Star Rating */}
          <div className="flex items-center gap-1 text-amber-500 mb-6" aria-label="5 out of 5 stars">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" aria-hidden="true" />
            ))}
          </div>

          {/* Testimonial Quote */}
          <blockquote className="text-2xl lg:text-3xl font-semibold tracking-tight text-zinc-900 leading-snug">
            “The best security tools disappear into your workflow. SecureMailScope already feels instantaneous.”
          </blockquote>

          {/* Testimonial Author */}
          <div className="mt-8 flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white shadow-sm ring-2 ring-white">
              SB
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-900">Sean Bold</div>
              <div className="text-xs text-zinc-500">Co-founder • ReUI</div>
            </div>
          </div>
        </div>

        {/* Enterprise Trust Logos Footer */}
        <div className="relative z-10 pt-8 border-t border-zinc-200/70">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">
            Trusted by leading teams
          </p>
          <EnterpriseLogos />
        </div>
      </div>
    </div>
  );
}
