# Study Progress Analysis (SPA) – Frontend & Main Project Hub

[![Stage: Beta](https://img.shields.io/badge/Stage-Beta%20v0.4.0-blue.svg)](docs/wiki/Releases.md)
[![License](https://img.shields.io/badge/Academic-SSE%20Uni--Hildesheim-green.svg)](https://www.uni-hildesheim.de/sse/)
[![Stack](https://img.shields.io/badge/Stack-React%2018%20%7C%20Vite%20%7C%20TypeScript%20%7C%20FastAPI-informational.svg)](docs/wiki/Architecture.md)

Welcome to the **Study Progress Analysis (SPA)** system, developed for **Stiftung Universität Hildesheim (Software Systems Engineering - SSE)**. 

The SPA platform enables university lecturers and academic staff to ingest heterogeneous exam spreadsheets (`.xlsx`, `.csv`, `.tsv`, `.ods`), review and validate student marks with zero data corruption, track longitudinal student trajectories across semesters, manage course files via the Course Drive, and compare exam sittings side-by-side.

This repository (`d2-project-client`) serves as the **primary user-facing application and central documentation hub** for the entire SPA project. The backend API service is hosted in the sibling repository [`d2-project-backend`](https://gitlab.gwdg.de/sudarshan.bashyal/d2-project-backend).

---

## 🚀 Delimited Releases & Official Git Branches

Following [Semantic Versioning 2.0.0](https://semver.org/), project iterations are strictly delimited by agile sprints, marking the progression from **Alpha** prototypes to the current **Beta** milestone.

| Milestone | Official Kanban Board | Git Release Branch | Git Release Commit | Git Tags | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Release v0.4.0-beta** | `D2-Project: Sprint 4`<br>*(Created 09/30/2026)* | [`release/sprint-4-v0.4.0-beta`](https://gitlab.gwdg.de/sudarshan.bashyal/d2-project-client/-/tree/release/sprint-4-v0.4.0-beta) | `release(sprint-4): D2-Project Sprint 4 - v0.4.0-beta - Production Data Ingestion & Course Marks Milestone` | [`v0.4.0-beta`](https://gitlab.gwdg.de/sudarshan.bashyal/d2-project-client/-/tags/v0.4.0-beta)<br>`release-sprint-4-v0.4.0-beta` | **Delivered (Beta Stage - Latest)** |
| **Release v0.3.0-beta** | `D2-Project: Sprint 3`<br>*(Created 09/18/2026)* | [`release/sprint-3-v0.3.0-beta`](https://gitlab.gwdg.de/sudarshan.bashyal/d2-project-client/-/tree/release/sprint-3-v0.3.0-beta) | `release(sprint-3): D2-Project Sprint 3 - v0.3.0-beta - Course Drive, Exam Analytics & Hardening` | [`v0.3.0-beta`](https://gitlab.gwdg.de/sudarshan.bashyal/d2-project-client/-/tags/v0.3.0-beta)<br>`release-sprint-3-v0.3.0-beta` | Delivered (Beta 1) |
| **Release v0.2.0-alpha** | `D2-Project: Sprint 2`<br>*(Created 09/03/2026)* | [`release/sprint-2-v0.2.0-alpha`](https://gitlab.gwdg.de/sudarshan.bashyal/d2-project-client/-/tree/release/sprint-2-v0.2.0-alpha) | `release(sprint-2): D2-Project Sprint 2 - v0.2.0-alpha - Core Analytics, Attempts & Absence Normalization` | [`v0.2.0-alpha`](https://gitlab.gwdg.de/sudarshan.bashyal/d2-project-client/-/tags/v0.2.0-alpha)<br>`release-sprint-2-v0.2.0-alpha` | Delivered (Alpha 2) |
| **Release v0.1.0-alpha** | `D2-Project: Sprint 1`<br>*(Created 08/14/2026)* | [`release/sprint-1-v0.1.0-alpha`](https://gitlab.gwdg.de/sudarshan.bashyal/d2-project-client/-/tree/release/sprint-1-v0.1.0-alpha) | `release(sprint-1): D2-Project Sprint 1 - v0.1.0-alpha - Ingestion & Validation Foundations` | [`v0.1.0-alpha`](https://gitlab.gwdg.de/sudarshan.bashyal/d2-project-client/-/tags/v0.1.0-alpha)<br>`release-sprint-1-v0.1.0-alpha` | Delivered (Alpha 1) |
| **Release v0.0.1-alpha** | `D2-Project: Ignition`<br>*(Created 08/03/2026)* | [`release/sprint-0-ignition`](https://gitlab.gwdg.de/sudarshan.bashyal/d2-project-client/-/tree/release/sprint-0-ignition) | `release(sprint-0): D2-Project Ignition - v0.0.1-alpha - Project Setup & Architecture` | [`release-ignition-sprint-0`](https://gitlab.gwdg.de/sudarshan.bashyal/d2-project-client/-/tags/release-ignition-sprint-0)<br>`v0.0.1-alpha` | Completed (Inception) |

---

## 📚 Master Documentation Wiki

Comprehensive technical and process documentation is maintained in [`docs/wiki/`](docs/wiki/):

1. **Architecture & Topology:**
   - **[System Architecture](docs/wiki/Architecture.md):** Complete high-level architecture, component topology, sequence flows, and database ER schema.
   - **[Frontend Client Architecture](docs/wiki/Code-Documentation/Frontend-Architecture.md):** React 18, Vite, MUI layout, AG Grid matrices, Zustand stores, and client API contracts.
   - **[Deployment & Configuration Guide](docs/wiki/Code-Documentation/Deployment-Guide.md):** Zero-rebuild dynamic base URL injection, Docker containerization, and CORS allowlisting.

2. **Releases & Agile Sprints:**
   - **[Delimited Releases Log](docs/wiki/Releases.md):** Detailed changelog and deliverable scope per release.
   - **[Sprint 0: Ignition (04.08.2026 – 17.08.2026)](docs/wiki/sprints/Sprint-0.md):** Project setup, quality infrastructure, and architecture blueprint.
   - **[Sprint 1 (18.08.2026 – 31.08.2026)](docs/wiki/sprints/Sprint-1.md):** Multi-format spreadsheet parsing, header validation, atomic DB transactions.
   - **[Sprint 2 (01.09.2026 – 14.09.2026)](docs/wiki/sprints/Sprint-2.md):** Pass/Fail calculation, longitudinal history view, attempt categorization, and absence normalization (9 items).
   - **[Sprint 3 (15.09.2026 – 29.09.2026)](docs/wiki/sprints/Sprint-3.md):** Course Drive file hub, exam attempt comparison, clipboard paste, student profiling, and deployment hardening (69 points, 27 items).
   - **[Sprint 4 (30.09.2026 – 05.11.2026)](docs/wiki/sprints/Sprint-4.md):** Production Data Ingestion, Dynamic Column Mapping, Strict 1.0–5.0 Grades, Free-Form Attempts, Best Marks Analytics, Dedicated Course Drive Tab, and CourseMarksTable Fixes (58 points, 23 items).

3. **Onboarding, Traceability & Handover:**
   - **[Developer Onboarding Guide](docs/wiki/Onboarding-Guide.md):** Step-by-step setup, native vs Docker environments, and verification commands.
   - **[Full Traceability Matrix](docs/wiki/Traceability-Matrix.md):** Bidirectional mapping connecting User Stories & Tasks $\rightarrow$ Acceptance Criteria $\rightarrow$ Backend routes $\rightarrow$ Frontend views $\rightarrow$ Test suites.
   - **[Project Handover Checklist](docs/wiki/Handover-Checklist.md):** Acceptance checklist, seed accounts, database backup/restore, and troubleshooting FAQ.

---

## 🛠️ Technology Stack

| Concern | Library / Tool | Description |
| :--- | :--- | :--- |
| **Language** | TypeScript 5 (strict) | Strong typing across all components, stores, and API wrappers |
| **Framework** | React 18 + Vite | Fast single-page application bundling and hot-reloading |
| **UI Components** | Material-UI (MUI) v5 | Polished academic UI conforming to University style guidelines |
| **Data Grids** | AG Grid Community | High-performance interactive grid for spreadsheet review and inline editing |
| **Charts** | Recharts | Grade distributions, student attempts, and passing rate visualizations |
| **State Management** | Zustand | Light, reactive session lifecycle and authentication state |
| **Unit Testing** | Vitest + Testing Library | Automated unit and integration test coverage |
| **Code Quality** | ESLint 9 + typescript-eslint | Type-aware linting with strict complexity and duplication thresholds |

---

## ⚡ Quickstart

### Option A: Running with Docker Compose (Full Stack)

From the project root directory:

```bash
# 1. Copy environment configuration
cp .env.example .env

# 2. Build and start the complete application stack
docker compose up -d --build
```

- **Frontend Application:** `http://localhost:5173`
- **Backend API & Swagger Docs:** `http://localhost:8000/docs`
- **PostgreSQL Database:** `localhost:5432`

### Option B: Local Development (Native Node.js)

```bash
# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev
```

The frontend will run on `http://localhost:5173` and communicate with the backend at `http://localhost:8000/api`.

---

## 📁 Repository Layout

```
src/
  api/                 Only layer aware of backend HTTP communication
    client.ts          API base URL, closure access token, auto-refresh on 401
    auth.ts            Sign in, register, sign out
    courses.ts         Course catalog, details, course drive files
    grades.ts          Exam marks, attempt comparisons
    stats.ts           Dashboard KPIs and grade distributions
    students.ts        Student profile CRUD and transcripts
    uploads.ts         Spreadsheet file upload and clipboard preview
    index.ts           Unified API export
  hooks/
    useAppLogic.tsx    Central state management and view coordination
  components/
    features/          Feature views (AnalysisHub, CourseDetails, BatchUploadWizard, ...)
    forms/             Dialogs for course editing, user settings, student forms
  types.ts             Mirror of backend schemas (Course, Student, GradeRecord, etc.)
  stores/
    authStore.ts       Signed-in user identity and token refresh timer
  utils/constants.ts   Static UI constants and email domain validation
  theme.ts             MUI light and dark theme definitions
  App.tsx              Root layout, navigation bar, and screen router
```

---

## ⚙️ Configuration & Deployment Setup

### 1. Global Production Configuration (Zero-Rebuild)

To configure the application so that all users globally connect to your backend server, edit the central `.env` file:

```env
# 1. Endpoint called by clients' browsers:
VITE_API_BASE_URL=http://<YOUR_BACKEND_HOST_OR_IP>:8000/api

# 2. Origin(s) from which the browser accesses the client:
CORS_ORIGINS=http://<YOUR_CLIENT_HOST_OR_IP>:5173
```

- **How it works:** When the Nginx client container starts, `/docker-entrypoint.d/40-generate-config.sh` dynamically reads `VITE_API_BASE_URL` and writes `/usr/share/nginx/html/config.js`.
- **Zero Rebuild:** If the server IP or domain changes, update `VITE_API_BASE_URL` in `.env` and restart containers (`docker compose up -d`). No image recompilation is needed.

### 2. In-Browser Settings Dialog (Testing & Rescue Tool)

In addition to global configuration, an interactive **Settings Dialog** is accessible directly in the user interface:
- **On the Login / Register screen:** Click the **Settings (gear ⚙️)** icon in the top-right header.
- **When logged in:** Open the user menu in the navigation bar and select **Settings**, or click the University logo.
- **Capabilities:**
  - **Connection Tester:** Enter any backend URL and click **Test Connection** to check reachability and CORS compatibility.
  - **Client Override:** Save a custom URL to that browser's `localStorage` as an override, or click **Reset Default** to revert to the container's `.env` configuration.
  - **Developer Mode Easter Egg:** Tapping the University logo or System Information card **10 times in rapid succession** activates Developer Mode and unlocks the playable **Teacher Break (Dino Run)** mini-game!

---

## 🔒 Authentication & Token Security Architecture

- **Access Token:** Stored exclusively in an in-memory closure variable inside `src/api/client.ts`. It is never written to `localStorage` or accessible cookies, preventing XSS credential theft.
- **Refresh Token:** Transmitted via secure `httpOnly` cookie scoped to `/api/auth`. The browser automatically includes it via `credentials: 'include'`.
- **Silent Refresh & De-duplication:** `authStore` automatically triggers a token refresh before expiration. Concurrent API requests coalesce into a single token renewal call to prevent replay detection triggers.

---

## 🧪 Testing & Verification

```bash
# Run unit and integration tests
npm test

# Run tests in watch mode
npm run test:watch

# Execute typecheck without bundling
npm run typecheck

# Run ESLint quality gates
npm run lint
```

---

## 👥 Core Project Team (Group D2)

| Name | Role | Email |
| :--- | :--- | :--- |
| **Ion Poalelungi** | Architecture & Frontend Lead | `poalelungi@uni-hildesheim.de` |
| **Anna Chiriciuc** | Frontend & Quality Assurance | `chiriciuc@uni-hildesheim.de` |
| **Sudarshan Bashyal** | Backend Lead & Security | `sudarshan.bashyal@uni-hildesheim.de` |
| **Yazan Al Rifaee** | Full-Stack Developer | `alrifaee@uni-hildesheim.de` |
| **Marvin Wucher** | Full-Stack Developer | `wucher@uni-hildesheim.de` |
| **Amara Aslam** | Frontend Developer | `aslam@uni-hildesheim.de` |
| **Aditi Joshi** | QA & Frontend Developer | `joshi@uni-hildesheim.de` |
