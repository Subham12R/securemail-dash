import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CaptureQueueProvider } from "@/components/providers/capture-queue-provider";
import LiveDataRefreshProvider from "@/components/providers/live-data-refresh-provider";
import Sidebar from "@/components/ui/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SecureMailScope",
  description: "Cryptographic and Secure analysis of mail transfer",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-screen w-full flex-col overflow-hidden bg-white">
        <div className="flex min-h-0 min-w-0 flex-1">
          <Sidebar />
          <CaptureQueueProvider>
            <LiveDataRefreshProvider />
            {children}
          </CaptureQueueProvider>
        </div>
      </body>
    </html>
  );
}
