"use client";

import { useState } from "react";
import { SettingsUsageTab } from "@/components/ui/settings-usage-tab";
import { SettingsBillingTab } from "@/components/ui/settings-billing-tab";
import { KeyRound, Users, Puzzle, FileText } from "lucide-react";

type SettingsTab =
  | "usage"
  | "billing"
  | "team"
  | "api-keys"
  | "integrations"
  | "documents";

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "usage", label: "Usage" },
  { id: "billing", label: "Billing" },
  { id: "team", label: "Team" },
  { id: "api-keys", label: "API Keys" },
  { id: "integrations", label: "Integrations" },
  { id: "documents", label: "Documents" },
];

export function SettingsWorkspace() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("usage");

  return (
    <div className="space-y-8 p-6 animate-reveal">
      {/* Page Heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Settings
        </h1>
      </div>

      {/* Pill-style Sub-navigation matching reference design */}
      <nav
        aria-label="Settings sections"
        className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-full transition-all cursor-pointer shrink-0 ${
                isActive
                  ? "bg-zinc-200/80 text-zinc-900 shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === "usage" && (
          <SettingsUsageTab onUpgradeClick={() => setActiveTab("billing")} />
        )}

        {activeTab === "billing" && <SettingsBillingTab />}

        {activeTab === "team" && (
          <div className="rounded-lg border-2 border-neutral-200 bg-white p-8 text-center shadow-[inset_0px_0px_2px_2px_rgba(0,0,0,0.05)]">
            <Users className="mx-auto size-8 text-zinc-400" />
            <h3 className="mt-3 text-base font-semibold text-zinc-900">
              Team Members
            </h3>
            <p className="mt-1 text-sm text-zinc-500 max-w-md mx-auto">
              Collaborate on mail capture triage and security investigations. Available on Pro and Enterprise plans.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab("billing")}
              className="mt-4 inline-flex items-center justify-center rounded-md bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 cursor-pointer"
            >
              Upgrade to invite team
            </button>
          </div>
        )}

        {activeTab === "api-keys" && (
          <div className="rounded-lg border-2 border-neutral-200 bg-white p-8 shadow-[inset_0px_0px_2px_2px_rgba(0,0,0,0.05)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-zinc-900">
                  Ingestion API Keys
                </h3>
                <p className="text-sm text-zinc-500">
                  Manage API tokens used by automated pipelines to submit PCAP captures.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 cursor-pointer"
              >
                <KeyRound className="size-3.5" />
                Create new secret key
              </button>
            </div>
            <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4 font-mono text-xs text-zinc-600 flex items-center justify-between">
              <span>sms_live_••••••••••••••••••••••••3f9a</span>
              <span className="text-[11px] text-zinc-400 font-sans">Created 12 days ago</span>
            </div>
          </div>
        )}

        {activeTab === "integrations" && (
          <div className="rounded-lg border-2 border-neutral-200 bg-white p-8 text-center shadow-[inset_0px_0px_2px_2px_rgba(0,0,0,0.05)]">
            <Puzzle className="mx-auto size-8 text-zinc-400" />
            <h3 className="mt-3 text-base font-semibold text-zinc-900">
              Integrations & Webhooks
            </h3>
            <p className="mt-1 text-sm text-zinc-500 max-w-md mx-auto">
              Forward flagged SMTP sessions directly to SIEM, Slack, or webhook endpoints.
            </p>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="rounded-lg border-2 border-neutral-200 bg-white p-8 text-center shadow-[inset_0px_0px_2px_2px_rgba(0,0,0,0.05)]">
            <FileText className="mx-auto size-8 text-zinc-400" />
            <h3 className="mt-3 text-base font-semibold text-zinc-900">
              Forensic Evidence Archives
            </h3>
            <p className="mt-1 text-sm text-zinc-500 max-w-md mx-auto">
              Review retained compliance reports, certificate chains, and exported evidence manifests.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
