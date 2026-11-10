# BrandLens AI

> **Your Brand's Intelligent Checkpoint Before Publication.**  
> *Developed for CodeNexus India 2026 — Round 3 (Final Round).*

[![CodeNexus 2026](https://img.shields.io/badge/CodeNexus%20India-2026%20Round%203-blue.svg)](https://github.com/dhruv10-06/BrandLens-AI)
[![Tests Passing](https://img.shields.io/badge/Automated%20Tests-45%2F45%20Passing-brightgreen.svg)](https://github.com/dhruv10-06/BrandLens-AI)
[![AI Engine](https://img.shields.io/badge/AI%20Engine-Gemini%202.5%20Flash%20Multimodal-orange.svg)](https://aistudio.google.com/)
[![Security](https://img.shields.io/badge/RBAC%20%26%20SoD-Enforced-success.svg)](https://github.com/dhruv10-06/BrandLens-AI)

BrandLens AI is an enterprise AI-powered brand governance platform that enforces brand guidelines, tone-of-voice rules, product facts, visual brand identity, and messaging compliance across multi-format marketing collateral before publication.

---

## 🌐 Live Deployments & Repository

- **Frontend Application**: [https://brand-lens-ai-one.vercel.app/](https://brand-lens-ai-one.vercel.app/)
- **Backend API**: [https://brandlens-ai-emjp.onrender.com](https://brandlens-ai-emjp.onrender.com)
- **API Health Check**: [https://brandlens-ai-emjp.onrender.com/health](https://brandlens-ai-emjp.onrender.com/health)
- **GitHub Repository**: [https://github.com/dhruv10-06/BrandLens-AI](https://github.com/dhruv10-06/BrandLens-AI)

---

## 🚀 The Three Mandatory Round 3 Improvements

All three committed improvements from Round 2 have been built, integrated, and verified with zero mock numbers:

### 1. Visual Brand Compliance Engine (Multimodal AI)
- **Multimodal Visual Inspection**: Integrates Google Gemini 2.5 Flash via native base64 inline images (`image/png`, `image/jpeg`, `image/webp`, `image/svg+xml`) to perform creative asset compliance audits.
- **Brand Color Palette Extraction & Verification**: Automatically detects dominant and secondary hex colors in submitted creative assets and checks them against the organisation's approved and prohibited palette lists.
- **Logo Usage & Placement Analysis**: Evaluates whether the official brand logo is present, appropriately scaled, unobstructed, and positioned in accordance with guidelines.
- **Typography & Legibility Check**: Audits font styles, contrast ratios, and visual clarity across marketing banners, social ads, and hero creatives.
- **Offline Deterministic Fallback**: Includes a rule-based visual engine ensuring complete evaluation reliability even without an external API connection.

### 2. Intelligent Brand Governance & Analytics Dashboard
- **100% Real Aggregated Database Metrics**: Computes organization-level governance metrics directly from MongoDB collections (`ContentSubmission`, `AnalysisReport`, `BrandDocument`, `ApprovedFact`) using MongoDB Aggregation pipelines. Zero mock or hardcoded numbers.
- **Recurring Violations Leaderboard**: Tracks repeatedly violated rules and terminology across submissions to identify institutional brand drift.
- **Guideline Gap & Conflict Detection**: Identifies unsupported promotional claims and frequent questions that lack backing in official documentation, alerting brand directors to update guidelines.
- **7-Day Compliance Score Trends & Severity Breakdown**: Visualizes the organization's average brand compliance score timeline and Critical/High/Medium/Low violation distributions.
- **Actionable Governance Recommendations**: Automatically surfaces prioritized policy recommendations (Urgent, High, Medium) based on real violation patterns.

### 3. Multi-Format Content Intelligence & Integrations
- **Draft Document Ingestion (.pdf, .txt)**: Creators can upload draft articles, whitepapers, or press release files directly; text is automatically extracted and populated into the submission workspace.
- **Multi-Format Campaign Workflows**: Supports Text-only, Document Drafts, Visual Creatives, and Multi-Format Campaigns (accompanying copy + visual creative asset analyzed together).
- **External Publishing Webhook Integrations**: Configurable publishing pipelines (Webhook, CMS, Social Media Staging, Internal Vault).
- **Human-in-the-Loop Review Gate**: Outbound publication is strictly blocked until an authorized reviewer approves the content.
- **Publishing Payload Preview & Audit Trail**: Reviewers can inspect the exact outbound JSON webhook payload before approval, with full dispatch timestamp and status persisted in the database.

---

## 🌟 Core BrandLens Capabilities

1. **Brand Guideline & Knowledge Ingestion**: Upload PDF and TXT brand manuals. The system safely extracts readable text, chunks it with overlap, and generates 768-dimensional vector embeddings with Google Gemini (`text-embedding-004`).
2. **Direct Rule & Fact Management**: Manage approved terminology, prohibited words, verified technical specs, and mandatory tone rules with real-time inclusion in RAG prompts.
3. **Retrieval-Augmented Generation (RAG) Audit Engine**:
   - Computes cosine similarity across indexed guideline chunks for the authenticated organization.
   - Grounded prompt engineering with Google Gemini (`gemini-2.5-flash`) prevents hallucinated rules and treats document text safely (anti-prompt injection).
   - Distinguishes between **Verified Rule Violations**, **Unsupported Claims**, and **Potential Tone Drift**.
   - Validates all AI outputs through strict server-side **Zod schemas**.
4. **Interactive Brand Revision Workspace**:
   - Real-time compliance score (0–100) and severity breakdown.
   - Detailed findings cards with quoted original text, issue explanation, guideline citations, and suggested corrections.
   - 1-click **"Apply Correction"** that updates copy in the live editor without destructive overwrites.
   - On-demand **"Re-Analyze Revised Copy"** to verify improved compliance score.
5. **Human Governance & Review Gate**:
   - **Role-Based Access Control (RBAC)**: Distinct permissions for `creator` and `reviewer` roles.
   - **Separation of Duties (SoD)**: Creators are cryptographically prevented by backend middleware from approving their own submissions.
   - Reviewer decision suite with mandatory audit comments for `Approved`, `Rejected`, and `Requested Changes`.
   - Comprehensive audit trail with reviewer identity, decision justification, and timestamps.

---

## 🏗️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 6, TypeScript, Tailwind CSS, React Router v7, Lucide Icons, Axios |
| **Backend** | Node.js (v24), Express.js, TypeScript, Mongoose ODM |
| **Database** | MongoDB Atlas (with automatic in-memory fallback for offline testing) |
| **AI / Multimodal** | Google Gemini API (`gemini-2.5-flash`, `text-embedding-004`), Multimodal Inline Images |
| **Validation & Security** | Zod, Helmet security headers, CORS origin isolation, Express Rate Limiting, Bcrypt.js, JWT |
| **Testing** | Vitest, Supertest, In-memory MongoDB Server (45 automated tests) |

---

## 📁 Repository Structure

```text
BrandLens AI/
├── backend/
│   ├── src/
│   │   ├── config/              # Environment, DB connection, Gemini config
│   │   ├── controllers/         # Auth, Document, Submission, Review, Fact, Org, Analytics controllers
│   │   ├── middleware/          # JWT auth, RBAC, Rate limiter, Error handler, Multer upload
│   │   ├── models/              # User, Organisation, BrandDocument, GuidelineChunk, ApprovedFact,
│   │   │                        # ContentSubmission, AnalysisReport, ReviewDecision
│   │   ├── routes/              # Modular Express REST API routes (/auth, /documents, /submissions, /review, /analytics)
│   │   ├── services/
│   │   │   ├── documentParser.service.ts         # PDF/TXT extraction, text cleaning & semantic chunking
│   │   │   ├── embedding.service.ts              # Google Gemini text-embedding-004 & vector embeddings
│   │   │   ├── rag.service.ts                    # Semantic search, cosine similarity ranking, facts merge
│   │   │   ├── analysis.service.ts               # Gemini prompt engineering, anti-prompt injection, Zod validation
│   │   │   ├── visualAnalysis.service.ts         # Multimodal Gemini 2.5 Flash image audit & color palette check
│   │   │   ├── analytics.service.ts              # Real MongoDB aggregation pipelines for governance KPIs & gaps
│   │   │   ├── publishingIntegration.service.ts  # Webhook & external publishing dispatch engine
│   │   │   └── seed.service.ts                   # Preloaded demo datasets, guidelines & multi-format submissions
│   │   ├── utils/               # Vector math (cosine similarity)
│   │   ├── app.ts               # Express configuration, Helmet, CORS, Rate Limiters
│   │   └── server.ts            # Server entrypoint with auto-seed and graceful shutdown
│   ├── tests/
│   │   ├── documentParser.test.ts          # PDF/TXT parsing & chunking tests (4 tests)
│   │   ├── rag.test.ts                     # Vector math & semantic ranking tests (3 tests)
│   │   ├── analysisValidation.test.ts      # Strict Zod schema & category verification tests (3 tests)
│   │   ├── rbacAndWorkflow.test.ts         # Integration test for auth, RBAC, and self-approval block (6 tests)
│   │   ├── securityAudit.test.ts           # Comprehensive 22-point security & tenant isolation tests (22 tests)
│   │   └── round3Improvements.test.ts     # Visual compliance, analytics & webhook tests (7 tests)
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── frontend/
│   ├── src/
│   │   ├── api/                 # Typed Axios endpoints (auth, docs, submissions, review, facts, org, analytics)
│   │   ├── components/          # Reusable UI components (Navbar, Sidebar, FindingCard, ScoreGauge, Badges)
│   │   ├── context/             # AuthContext (state, JWT, fixed evaluator login)
│   │   ├── pages/               # Full Application Pages:
│   │   │   ├── LoginPage.tsx              # Sign In + Evaluator Quickstart
│   │   │   ├── RegisterPage.tsx           # New workspace registration
│   │   │   ├── DashboardPage.tsx          # Metrics, recent submissions & quick actions
│   │   │   ├── AnalyticsPage.tsx          # Brand Governance Analytics Dashboard (R3)
│   │   │   ├── GuidelinesPage.tsx         # Document upload, chunk viewer, facts/terminology manager
│   │   │   ├── NewSubmissionPage.tsx      # Multi-Format submission (Written, Document, Visual, Campaign)
│   │   │   ├── SubmissionsListPage.tsx    # Workspace submission index with format filters
│   │   │   ├── AnalysisResultsPage.tsx    # Split-view audit editor with Visual Compliance tab
│   │   │   ├── ReviewQueuePage.tsx        # Reviewer-only queue for pending decisions
│   │   │   ├── ReviewDetailsPage.tsx      # Visual inspection, side-by-side diff & Webhook dispatch
│   │   │   ├── ReviewHistoryPage.tsx      # Historical decision audit log & publishing records
│   │   │   └── NotFoundPage.tsx           # 404 state
│   │   ├── types/               # Full TypeScript definitions (Visual, Analytics, Integrations)
│   │   ├── App.tsx              # Router setup with ProtectedRoute guard
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── README.md
└── package.json                 # Root monorepo workspace scripts
```

---

## 🧪 Testing & Verification

The project includes **45 automated tests** across 6 test suites with 100% pass rate:

```bash
npm test
```

### Test Suite Summary:
| Test Suite | Tests | Description |
|---|:---:|---|
| `securityAudit.test.ts` | 22 | Privilege escalation defense, cross-org isolation, file signatures, JWT verification |
| `round3Improvements.test.ts` | 7 | Multimodal visual audit, real DB analytics aggregations, multi-format ingestion, webhook preview & dispatch |
| `rbacAndWorkflow.test.ts` | 6 | Human review lifecycle, SoD self-approval block, audit trail logging |
| `documentParser.test.ts` | 4 | PDF/TXT extraction, whitespace cleaning, semantic chunking with overlap |
| `rag.test.ts` | 3 | Cosine similarity ranking, 768-dim embeddings, fact integration |
| `analysisValidation.test.ts` | 3 | Zod schema validation, finding categories, evidence status mapping |
| **Total** | **45** | **All 45 Passing** |

---

## 🎯 Evaluator Demo Guide (CodeNexus Round 3)

An evaluator can independently test the entire platform end-to-end:

### Pre-Seeded Evaluator Accounts:
- **Creator Account**: `creator@brandlens.demo` / `DemoCreator123!` (or 1-click button **"Demo Creator"**)
- **Reviewer Account**: `reviewer@brandlens.demo` / `DemoReviewer123!` (or 1-click button **"Demo Reviewer"**)

### Step-by-Step Evaluator Walkthrough:

1. **Sign In**:
   - Go to [https://brand-lens-ai-one.vercel.app/](https://brand-lens-ai-one.vercel.app/) (or `http://localhost:5173`).
   - Click **"Demo Creator (Alex Rivera)"** for 1-click authentication.

2. **Inspect Brand Governance Analytics (Improvement 2)**:
   - Click **"Brand Analytics"** in the sidebar.
   - Review the **Real MongoDB Governance Metrics**: Submissions Count, Average Compliance Score, Approval Rate, and Critical Violations.
   - Inspect the **Recurring Brand Violations Leaderboard** (e.g. prohibited terms like `cheap`, `unlimited free`, `100% bug-free`).
   - Inspect the **Guideline Gaps & Unsupported Claims** module.
   - Inspect the **Prioritized Policy Recommendations** generated from actual organization history.

3. **Submit a Multi-Format Campaign (Improvements 1 & 3)**:
   - Click **"Submit Content"** in the sidebar.
   - Notice the 4 Submission Formats: **Written Copy**, **Upload Document Draft (.pdf, .txt)**, **Visual Creative Only**, and **Multi-Format Campaign**.
   - Under **Multi-Format Campaign**, click **"Load Violations Preset"** to populate draft copy with intentional violations and an attached creative image.
   - Alternatively, test **"Upload Document Draft"** with any sample .txt or .pdf file to experience automatic text extraction.
   - Click **"Submit & Run AI Multimodal Audit"**.

4. **Review Visual Brand Compliance (Improvement 1)**:
   - On the **Analysis Results** page, click the **"Visual Brand Compliance"** tab.
   - Inspect the **Visual Creative Showcase**, **Detected Brand Palette Swatches** (marking compliant vs disallowed hex colors), **Logo Usage & Placement Audit**, and **Typography Legibility Assessment**.
   - Switch back to the **Text Copy Findings** tab to inspect cited guideline evidence and click **"Apply Correction"** to edit the copy.
   - Click **"Submit to Review Queue"**.

5. **Reviewer Approval & Webhook Dispatch (Improvement 3)**:
   - Log out and sign in as **Reviewer (Elena Rostova)** (or use the role switcher).
   - Navigate to **"Review Queue"** and open the pending submission.
   - Review the copy diff and visual creative side-by-side.
   - Under **Publication Channel**, select **Webhook** or **CMS**.
   - Click **"Preview JSON Payload"** to inspect the real publication payload before release (preserving human-in-the-loop governance).
   - Enter mandatory audit justification notes and click **"Approve & Dispatch"**.
   - Observe the confirmation and check **"Review History"** for the permanent audit log.

6. **Verify Security & Separation of Duties**:
   - Switch back to the Creator role.
   - Attempting to review or approve any submission will be rejected by backend middleware with `403 Forbidden` (`Separation of duties violation: Creators are not permitted to review or approve their own content.`).

---

## 🔒 Security & Data Integrity

1. **Role-Based Access Control (RBAC)**: Backend authorization middleware checks the authenticated user's actual database role (`creator`, `reviewer`, `admin`) on every state-changing route. Role cannot be manipulated by client requests.
2. **Separation of Duties (SoD)**: The backend enforces that `submission.creatorId !== authenticatedUser.id` before allowing any approval or decision.
3. **Organisation-Level Tenant Isolation**: Every database read and write explicitly filters by `organizationId`. Cross-tenant data leakage is strictly blocked.
4. **File Signature Magic Byte Validation**: Uploaded documents are verified by binary signature (`%PDF-`, text null-byte check) rather than trusting client MIME types or file extensions.
5. **Anti-Prompt Injection Defense**: User copy and guideline chunks are wrapped in delimiting tags with system prompts forbidding instruction overriding.
6. **Zero Mock Analytics**: All KPIs, recurring violations, and score trends query real database records via MongoDB aggregation pipelines.

---

## 📄 License
Developed for CodeNexus India 2026. All rights reserved.
