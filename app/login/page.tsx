import type { Metadata } from "next";
import DitherCanvas from "@/components/login/dither-canvas";
import LoginForm from "@/components/login/login-form";

export const metadata: Metadata = {
  title: "Sign in | SecureMailScope",
  description: "Sign in to SecureMailScope to analyze SMTP, IMAP, and POP3 network sessions.",
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-white dark-soc:bg-[#1a1a1a] md:flex-row">
      {/* Left Column: Sign-in Form */}
      <div className="z-10 flex min-h-screen w-full flex-col justify-between bg-white p-6 dark-soc:bg-[#1a1a1a] sm:p-10 md:w-1/2 md:p-12 lg:w-[45%] lg:p-16 xl:w-[40%]">
        <div className="flex-1 flex flex-col justify-center py-8">
          <LoginForm />
        </div>

        {/* Left Column Footer */}
        <div className="text-xs text-zinc-400 dark-soc:text-zinc-500">
          <p>© {new Date().getFullYear()} SecureMailScope Inc. All rights reserved.</p>
        </div>
      </div>

      {/* Right Column: Animated Dither Canvas & Testimonial Overlay */}
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden border-l border-zinc-200/80 bg-zinc-50 p-8 dark-soc:border-zinc-700 dark-soc:bg-[#1a1a1a] sm:p-12 lg:p-16 md:flex">
        {/* Animated Dither Canvas Background */}
        <DitherCanvas />

      </div>
    </div>
  );
}
