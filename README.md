# BrandLens AI

> **Your Brand's Intelligent Checkpoint Before Publication.**  
> *Developed for CodeNexus India 2026 — Round 2.*

BrandLens AI is an end-to-end AI-powered brand governance platform that enforces brand guidelines, tone-of-voice rules, product facts, prohibited terminology, and messaging standards across marketing collateral before publication.

---

## 🌟 Key Capabilities

1. **Brand Guideline & Knowledge Base Ingestion**: Upload brand manuals in **PDF** and **TXT** formats. The system safely extracts readable text, splits content into cohesive chunks, and generates 768-dimensional vector embeddings with Google Gemini (`text-embedding-004`).
2. **Direct Rule & Fact Management**: Manage approved terminology, prohibited words, verified technical specs/metrics, and mandatory tone rules with real-time RAG inclusion.
3. **Retrieval-Augmented Generation (RAG) Audit Engine**:
   - Computes cosine similarity across indexed guideline chunks for the authenticated organization.
   - Grounded prompt engineering with Google Gemini (`gemini-2.5-flash`) strictly prevents hallucinated rules and treats document text safely (anti-prompt injection).
   - Distinguishes between **Verified Rule Violations**, **Unsupported Claims** (where verification is unavailable in approved sources), and **Potential Tone Drift**.
   - Validates all AI outputs through strict server-side **Zod schemas**.
4. **Interactive Brand Revision Workspace**:
   - Real-time compliance score (0–100) and severity breakdown (Critical, High, Medium, Low).
   - Detailed findings cards with quoted original text, issue explanation, guideline citations, and suggested corrections.
   - 1-click **"Apply Correction"** that updates the copy in the live editor without destructive overwrites.
   - On-demand **"Re-Analyze Revised Copy"** to verify improved compliance score.
5. **Human Governance & Review Gate**:
   - **Role-Based Access Control (RBAC)**: Distinct permissions for `creator` and `reviewer` roles.
   - **Separation of Duties**: Creators are cryptographically prevented by backend middleware from approving their own submissions.
   - Reviewer decision suite with mandatory audit comments for `Approved`, `Rejected`, and `Requested Changes`.
   - Comprehensive audit trail with reviewer identity, decision justification, and timestamps.
6. **1-Click Hackathon Demo Mode**:
   - Preloaded sample organization (*ApexFlow Technologies*).
   - Pre-indexed sample brand guideline document and rules.
   - Pre-loaded test submission that intentionally triggers multiple brand violations.
   - 1-click role switcher in the navbar to test both Creator and Reviewer perspectives effortlessly.

---

## 🏗️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 6, TypeScript, Tailwind CSS, React Router v7, Lucide Icons, Axios |
| **Backend** | Node.js (v24), Express.js, TypeScript, Mongoose ODM |
| **Database** | MongoDB Atlas (with automatic in-memory fallback for offline/local testing) |
| **AI / RAG** | Google Gemini API (`gemini-2.5-flash`, `text-embedding-004`), Vector Cosine Similarity |
| **Validation & Security** | Zod, Helmet security headers, CORS origin isolation, Express Rate Limiting, Bcrypt.js, JWT |
| **Testing** | Vitest, Supertest, In-memory MongoDB Server |

---

## 📁 Repository Structure

```text
BrandLens AI/
├── backend/
│   ├── src/
│   │   ├── config/              # Environment, DB connection, Gemini config
│   │   ├── controllers/         # Auth, Document, Submission, Review, Fact, Org controllers
│   │   ├── middleware/          # JWT auth, RBAC, Rate limiter, Error handler, Multer upload
│   │   ├── models/              # User, Organisation, BrandDocument, GuidelineChunk, ApprovedFact,
│   │   │                        # ContentSubmission, AnalysisReport, ReviewDecision
│   │   ├── routes/              # Modular Express REST API routes
│   │   ├── services/
│   │   │   ├── documentParser.service.ts   # PDF/TXT extraction, text cleaning & semantic chunking
│   │   │   ├── embedding.service.ts        # Google Gemini text-embedding-004 & fallback vector math
│   │   │   ├── rag.service.ts              # Semantic search, cosine similarity ranking, facts merge
│   │   │   ├── analysis.service.ts         # Gemini prompt engineering, anti-prompt injection, Zod validation
│   │   │   └── seed.service.ts             # Preloaded demo datasets, sample guidelines & violations
│   │   ├── utils/               # Vector math (cosine similarity)
│   │   ├── app.ts               # Express configuration, Helmet, CORS, Rate Limiters
│   │   └── server.ts            # Server entrypoint with auto-seed and graceful shutdown
│   ├── tests/
│   │   ├── documentParser.test.ts          # PDF/TXT parsing & chunking tests
│   │   ├── rag.test.ts                     # Vector math & semantic ranking tests
│   │   ├── analysisValidation.test.ts      # Strict Zod schema & category verification tests
│   │   └── rbacAndWorkflow.test.ts         # Integration test for auth, RBAC, and self-approval block
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/                 # Typed Axios endpoints (auth, docs, submissions, review, facts, org)
│   │   ├── components/          # Reusable UI components (Navbar, Sidebar, FindingCard, ScoreGauge, Badges)
│   │   ├── context/             # AuthContext (state, JWT, quick demo login)
│   │   ├── pages/               # 9 Full Pages:
│   │   │   ├── LoginPage.tsx              # Sign In + 1-Click Evaluator Quickstart
│   │   │   ├── RegisterPage.tsx           # New workspace registration
│   │   │   ├── DashboardPage.tsx          # Metrics, recent submissions & quick actions
│   │   │   ├── GuidelinesPage.tsx         # Document upload, chunk viewer, facts/terminology manager
│   │   │   ├── NewSubmissionPage.tsx      # Copy submission form with "Load Sample Violation" button
│   │   │   ├── SubmissionsListPage.tsx    # Workspace submission index with filters
│   │   │   ├── AnalysisResultsPage.tsx    # Split-view audit editor with 1-click "Apply Correction"
│   │   │   ├── ReviewQueuePage.tsx        # Reviewer-only queue for pending decisions
│   │   │   ├── ReviewDetailsPage.tsx      # Side-by-side diff review & decision deck
│   │   │   ├── ReviewHistoryPage.tsx      # Historical decision audit log
│   │   │   └── NotFoundPage.tsx           # 404 state
│   │   ├── types/               # Full TypeScript definitions
│   │   ├── App.tsx              # Router setup with ProtectedRoute guard
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── .env.example
├── README.md
└── package.json                 # Root monorepo workspace scripts
```

---

## ⚙️ Environment Configuration

### Backend (`backend/.env`)

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# MongoDB Atlas Connection String
# (If left empty during local testing, an embedded in-memory MongoDB instance runs automatically!)
MONGODB_URI=

# JWT Authentication Secret
JWT_SECRET=super-secret-brandlens-jwt-key-change-in-production-min32chars
JWT_EXPIRES_IN=7d

# Google Gemini API Key (Obtain free from https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=

# File Upload Limit (MB)
MAX_FILE_SIZE_MB=10
```

### Frontend (`frontend/.env`)

```env
# In development, Vite automatically proxies /api to http://localhost:5000
VITE_API_URL=/api
```

---

## 🚀 Local Installation & Execution

### Prerequisites
- Node.js 18+ (tested on Node v24)
- npm 9+

### 1. Install Dependencies
From the repository root:
```bash
npm install --workspace=backend
npm install --workspace=frontend
```

### 2. Run Backend
In a terminal:
```bash
cd backend
npm run dev
```
*The backend connects to MongoDB, auto-seeds the ApexFlow Technologies demo workspace, and starts on `http://localhost:5000`.*

### 3. Run Frontend
In a second terminal:
```bash
cd frontend
npm run dev
```
*The Vite frontend starts on `http://localhost:5173`.*

---

## 🧪 Testing & Verification

Run the comprehensive automated test suite (unit and integration tests):

```bash
cd backend
npm test
```

### Test Coverage Results:
- `documentParser.test.ts`: PDF & TXT text extraction, whitespace/null-byte sanitization, chunking with overlap, rejection of empty files.
- `rag.test.ts`: Cosine similarity calculation, 768-dimensional vector generation, semantic ranking accuracy.
- `analysisValidation.test.ts`: Strict Zod schema compliance, finding category validation, distinction between verified violations and unsupported claims.
- `rbacAndWorkflow.test.ts`: Real end-to-end API integration test verifying:
  - User registration & JWT authentication
  - Content submission & AI audit pipeline
  - RBAC protection (creators blocked from review queue)
  - **Separation of Duties enforcement** (creators blocked from approving their own work)
  - Human reviewer sign-off with mandatory justification
  - Audit trail logging in review history.

---

## 🎯 Evaluator Demo Guide (CodeNexus Round 2)

An evaluator can independently test the entire platform without manual setup:

1. **Open the Web App**: Navigate to `http://localhost:5173`.
2. **1-Click Demo Login**:
   - On the login screen, click **"As Creator"** (logs in as `Alex Rivera`).
3. **Inspect the Preloaded Guidelines**:
   - Navigate to **"Brand Guidelines"** in the sidebar.
   - Notice `ApexFlow_Global_Brand_Guidelines_2026.txt` with indexed vector chunks.
   - Click **"View Chunks"** to inspect semantic segments.
   - Switch to the **"Terminology & Verified Facts"** tab to see prohibited phrases (`cheap`, `unlimited free`, `100% bug-free`), approved terms (`ApexFlow Platform`), and verified facts (`10,000 tasks/sec SLA`).
4. **Submit New Copy for AI Audit**:
   - Click **"Submit Content"** in the sidebar.
   - Click **"Load Test Violations Draft"** on top-right. This loads copy intentionally violating multiple rules.
   - Click **"Submit & Run AI Analysis"**.
5. **Inspect Audit Findings & Apply Corrections**:
   - You are redirected to the **Analysis Results** page.
   - Note the **Brand Compliance Score** and severity breakdown.
   - Observe findings categorized by **Prohibited language**, **Terminology violation**, **Unsupported promotional claim**, and **Tone inconsistency** with cited evidence from the guidelines.
   - Click **"Apply Correction"** on any finding: it dynamically replaces the violation in the live editor.
   - Click **"Re-Analyze Revised Copy"**: the compliance score recalculates!
   - Click **"Submit to Review Queue"**.
6. **Switch to Reviewer Role**:
   - In the top navbar, click **"Reviewer Role"** (instant switch to `Elena Rostova`).
   - Navigate to **"Review Queue"** in the sidebar.
   - Open the submission and inspect the side-by-side diff (Original Draft vs Revised Draft).
   - Enter an audit justification in the comment box and click **"Approve for Publication"** or **"Reject Content"**.
7. **View Audit History**:
   - Navigate to **"Review History"** to see the permanent audit decision, reviewer identity, rationale, and timestamp.
8. **Test Separation of Duties**:
   - Switch back to the Creator role.
   - Try approving your own submission: the backend will reject the action with `403 Forbidden` (`Separation of duties violation: Creators are not permitted to review or approve their own content.`).
9. **Reset Anytime**:
   - Click **"Reset Demo"** in the top navbar to return to a fresh baseline.

---

## 🔒 Security Architecture

1. **Authentication**: Bcrypt password hashing (cost factor 10) and signed JWT tokens with expiry.
2. **Role-Based Access Control**: Backend middleware validates user membership and roles (`creator`, `reviewer`, `admin`) on every state-changing route.
3. **Separation of Duties**: Creators cannot approve their own submissions even by altering requests.
4. **Organisation Isolation**: All MongoDB queries are scoped strictly to `organizationId`.
5. **Anti-Prompt Injection**: Uploaded guidelines and user submissions are wrapped in untrusted delimiter tags (`<<<SUBMITTED_CONTENT>>>`) with strict system instructions preventing prompt hijacking.
6. **Safe Document Processing**: In-memory buffer uploads prevent filesystem path traversal; strict MIME and extension validation prevents arbitrary file execution.
7. **Rate Limiting**: Dedicated rate limiters on authentication endpoints (30/15min) and AI endpoints (25/5min).
8. **Security Headers & CORS**: Configured with `helmet` and restricted CORS origins.

---

## 🚢 Deployment Instructions

### 1. Database (MongoDB Atlas)
1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com/).
2. Under **Network Access**, whitelist `0.0.0.0/0` (or your host IP).
3. Under **Database Access**, create a user and copy the connection string:
   `mongodb+srv://<username>:<password>@cluster0.mongodb.net/brandlens?retryWrites=true&w=majority`

### 2. Backend (Render / Railway)
1. Connect your GitHub repository to Render.
2. Set **Root Directory**: `backend`
3. Set **Build Command**: `npm install && npm run build`
4. Set **Start Command**: `npm start`
5. Configure Environment Variables:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `<Your MongoDB Atlas URI>`
   - `JWT_SECRET`: `<Secure random 32+ char secret>`
   - `GEMINI_API_KEY`: `<Your Google Gemini API Key>`
   - `FRONTEND_URL`: `https://brandlens-ai.vercel.app`

### 3. Frontend (Vercel)
1. Import repository in [vercel.com](https://vercel.com).
2. Set **Framework Preset**: `Vite`
3. Set **Root Directory**: `frontend`
4. Set **Build Command**: `npm run build`
5. Set **Output Directory**: `dist`
6. Configure Environment Variable:
   - `VITE_API_URL`: `https://your-backend.onrender.com/api`

---

## 📊 Round 2 Scope & Round 3 Readiness

### Implemented & Verified in Round 2:
- [x] Multi-format Guideline Ingestion (PDF & TXT) with semantic chunking.
- [x] Vector embedding generation and cosine similarity retrieval.
- [x] Manual terminology, verified facts, and tone rules engine.
- [x] RAG-based AI analysis with Google Gemini and Zod schema validation.
- [x] Interactive results interface with live editor and 1-click correction application.
- [x] Complete human review lifecycle (Draft -> Analysing -> Needs Changes / Pending Review -> Approved / Rejected).
- [x] RBAC & Separation of Duties enforcement.
- [x] Review decision audit log with reviewer identity and timestamps.
- [x] 1-Click demo seeder with reproducible test case.
- [x] Comprehensive automated unit & integration test suite (16 tests passed).

### Planned for Round 3 (Expansion Readiness):
- Multimodal visual brand governance (logo placement, color contrast, hex code compliance).
- Cross-campaign recurring violation analytics.
- Webhook integrations with CMS and publishing workflows (WordPress, Contentful).

