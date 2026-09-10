# SecureMailScope Comprehensive README Design Spec

## Overview
The goal is to update the repository's `README.md` from the generic default `create-next-app` template into an authoritative, enterprise-grade product and technical documentation manual for **SecureMailScope** (`securemail-dash`).

## Objectives
1. **Accurate Product Representation**: Position SecureMailScope clearly as an evidence-backed mail-transport security forensic analysis platform targeting SMTP, IMAP, and POP3.
2. **Clear Technical & Privacy Boundaries**: Explicitly communicate the security architecture—deterministic backend rules remain authoritative, ML models are advisory, and the platform adheres strictly to observable packet evidence without claiming impossible capabilities (e.g., decrypting protected TLS secrets).
3. **Workspace Tour**: Detail all major application workspaces (Executive Overview, Live Inbox / Capture Queue, Protocol & TLS Forensics, Audit History & Forensic Inspector, AI Intelligence, and PDF Reporting).
4. **Developer Guidance**: Provide a clean developer onboarding experience including prerequisites, configuration (`.env` specifications), development commands, and verification via the 71-suite automated test runner.

---

## README Document Structure

### 1. Header & Badges
- Project Title: **SecureMailScope** (`securemail-dash`)
- Tagline: *Evidence-backed forensic analysis and transport-layer security inspection for SMTP, IMAP, and POP3.*
- Badges:
  - Next.js 16 (App Router)
  - React 19
  - Tailwind CSS v4
  - Node.js >= 20
  - Test Suite: 71 Passing Tests
  - TypeScript 5

### 2. Core Security Philosophy & Value Proposition
- **Evidence-Backed Forensics**: Reconstructs packet-level mail traffic into traceable transport sessions.
- **Protocol Depth**: Dedicated parsers and analyzers for SMTP (including STARTTLS and direct TLS), IMAP, and POP3.
- **Deterministic Verdicts vs. Advisory ML**: Deterministic rule sets provide authoritative security verdicts, while dual machine-learning models (XGBoost, Random Forest) provide calibrated anomaly detection.
- **Privacy & Evidence Boundary**: Does not claim to break cryptographic ciphers or recover protected secrets; accurately renders redacted or unavailable states when data cannot be observed.

### 3. Workspaces & Key Capabilities
- **Executive Security Dashboard**: Live posture score, verdict distributions (Clean, Suspicious, Malicious, Inconclusive), and risk trend analytics.
- **Capture Ingestion & Live Inbox**:
  - Drag-and-drop ingestion of PCAP and PCAPNG captures processed via asynchronous server job queue.
  - Real-time mailbox monitoring powered by TMPVault API with configurable fixture fallback.
- **TLS & Certificate Forensics**:
  - Audit TLS version negotiations, Perfect Forward Secrecy (PFS) support, and cipher suite strength.
  - Certificate chain validation, expiration timelines, SAN matching, and issuer verification.
- **Session History & Deep Inspector**:
  - Full packet and stream timeline reconstruction.
  - Granular evidence logs with per-finding rule citations and risk score breakdowns.
- **Threat Intelligence & ML Scoring**:
  - Model calibration status and dual-model inference outputs.
  - Anomaly detection flags highlighting protocol downgrade attempts and anomalous header structures.
- **Forensic PDF Report Generator**:
  - Client-side export of comprehensive forensic audit reports using jsPDF and autotable.

### 4. Architecture & Data Flow
- Visual flow diagram:
  `PCAP / Mailbox Source` $\to$ `Analysis & Job Engine` $\to$ `SecureMail Backend API (/api/v1)` $\to$ `Next.js Server Proxy / Route Handlers` $\to$ `Client Workspaces & Dashboards`
- Secure API credential boundaries: Secrets (`SECUREMAILSCOPE_API_KEY`) remain strictly on the server and are never leaked to client bundles.

### 5. Tech Stack
- **Framework**: Next.js 16.3.4 (App Router)
- **Frontend Core**: React 19.2.8, TypeScript 5, Tailwind CSS v4
- **Component Primitives**: React Aria Components, Lucide React icons, Motion animations, Sonner notifications
- **Data Visualization**: Recharts
- **Document Generation**: jsPDF 4.2.1, jspdf-autotable 5.0.8
- **Test Runner**: Node.js Native Test Runner (`node --experimental-strip-types --test`)

### 6. Configuration & Environment Variables
Comprehensive table detailing all environment variables:
| Variable | Description | Required / Default |
| :--- | :--- | :--- |
| `SECUREMAILSCOPE_API_URL` | Base URL for the SecureMail backend API (must include `/api/v1`) | Required for live analysis |
| `SECUREMAILSCOPE_API_KEY` | Server-side authentication key | Required for live analysis |
| `SECUREMAILSCOPE_INBOX_URL` | Endpoint for TMPVault inbox monitoring service | Defaults to `https://inbox.tmpvault.com/api/emails` |
| `SECUREMAILSCOPE_INBOX_SOURCE` | Inbox feed mode (`live` or `fixture`) | Defaults to `fixture` when unset |

### 7. Getting Started & Development
- Clone repository & install dependencies (`npm install`).
- Setup local environment file (`.env.local`).
- Start development server (`npm run dev`).
- Run build (`npm run build`).
- Execute test suite (`npm test`).
- Execute linting (`npm run lint`).

---

## Verification & Review
- Ensure no placeholder text (`TODO`, `TBD`).
- Verify commands correspond directly to `package.json`.
- Ensure claims align strictly with `landing-page-content-design.md` and `live-api-frontend-contract.md`.
