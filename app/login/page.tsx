import type { Metadata } from "next";
import DitherCanvas from "@/components/login/dither-canvas";
import LoginForm from "@/components/login/login-form";

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

      </div>
    </div>
  );
}
