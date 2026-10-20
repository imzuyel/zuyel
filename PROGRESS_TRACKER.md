# PROJECT PROGRESS TRACKER

## PHASE 1: Codebase Cleanup, Route Deduplication & Critical Security Lockdown

- [x] **Task 1.1: Initialize PROGRESS_TRACKER.md**
  - [x] Create `PROGRESS_TRACKER.md` in root directory to track Tasks 1.1 through 1.6.

- [x] **Task 1.2: Remove Dead Scripts, Temp Files & Lockfile Conflicts**
  - [x] Delete debugging Python scripts inside `app/applet/`:
    - `app/applet/balance.py`
    - `app/applet/check_divs.py`
    - `app/applet/check_divs_v2.py`
    - `app/applet/check_divs_v3.py`
    - `app/applet/check_mismatch.py`
    - `app/applet/debug_syntax.py`
    - `app/applet/mismatch.py`
    - Remove `app/applet/` directory if empty.
  - [x] Delete `tmp/check_mismatch.py` (and `tmp/` folder if empty).
  - [x] Delete `temp_req.txt` and `clean-for-live.js` (check `package.json` first).
  - [x] Resolve lockfile conflict: Single source of truth for lockfiles (keep `package-lock.json` unless Bun is strictly required).

- [x] **Task 1.3: Critical Security — Eliminate Browser MySQL Workbench Risk**
  - [x] Inspect `app/api/mysql-workbench/route.ts` and `components/mysql/MySQLWorkbenchView.tsx`.
  - [x] Disable / remove raw arbitrary SQL execution (`DROP`, `DELETE`, `ALTER`, unrestricted queries) in `app/api/mysql-workbench/route.ts`.
  - [x] Update frontend references (e.g., `AdminSidebar.tsx`, `app/admin/page.tsx`, etc.) to convert into a Read-Only System & Database Health Status View protected by Super Admin server-side auth, or eliminate arbitrary execution.

- [x] **Task 1.4: API Route Deduplication (Safe Migration)**
  - [x] Fees API:
    - Search callers of `/api/fees` and `/api/fee-invoices` in `app/` and `components/`.
    - Update frontend callers to canonical `/api/accounts/fees`.
    - Delete `app/api/fees/route.ts` and `app/api/fee-invoices/route.ts`.
  - [x] Live Quiz API:
    - Search references to `/api/live-quiz/` (singular) across `app/`, `components/`, `context/`, `lib/`.
    - Update callers to `/api/live-quizzes/` (plural).
    - Delete redundant `app/api/live-quiz/` folder.

- [x] **Task 1.5: Frontend Duplicate Page Consolidation**
  - [x] AI Settings:
    - Compare `app/ai-settings/page.tsx` and `app/admin/ai-settings/page.tsx`.
    - Consolidate best features into `app/admin/ai-settings/page.tsx`.
    - Replace `app/ai-settings/page.tsx` with server redirect to `/admin/ai-settings` and ensure links point directly there.
  - [x] Live Quiz Pages:
    - Compare `app/live-quiz/page.tsx` and `app/live-quiz/join/page.tsx` with `app/live-quizzes/` and `app/quiz/`.
    - Ensure internal links point to canonical routes and redirect `/live-quiz/*` to canonical paths.

- [x] **Task 1.6: Verification & Phase 1 Completion Report**
  - [x] Check for broken imports, missing references, or TypeScript syntax issues (`npx tsc --noEmit` passed with 0 errors).
  - [x] Verify build / dev server health.
  - [x] Update tracker and provide final Phase 1 summary report.

## PHASE 2: Database Layer Unification & Centralized RBAC/Auth Security

- [x] **Task 2.1: Update PROGRESS_TRACKER.md with Phase 2 Checklist**
  - [x] Add Tasks 2.1 through 2.6 to `PROGRESS_TRACKER.md`.

- [x] **Task 2.2: Unify RBAC & Server-Side Auth Guards (`lib/rbac.ts`, `lib/rbac-db.ts`, `lib/serverAuthGuard.ts`)**
  - [x] Inspect `lib/rbac.ts`, `lib/rbac-db.ts`, and `lib/serverAuthGuard.ts`.
  - [x] Establish single authoritative source for Role-Based Access Control without circular dependencies.
  - [x] Harden `lib/serverAuthGuard.ts` against header/cookie/query spoofing and client privilege escalation (added cryptographic token signing & verification).
  - [x] Export clean, standardized helper functions (`requireAuth`, `requireRole`, `requireAdmin`, `requireSuperAdmin`, `requireTeacherOrAdmin`, `requireStaffOrAdmin`, `requirePermission`) returning standardized 401/403 responses.

- [x] **Task 2.3: Harden Next.js Middleware (`middleware.ts`)**
  - [x] Inspect `middleware.ts`, login pages, and error routes.
  - [x] Protect private ERP/Admin routes (`/admin/**`, `/dashboard/**`, `/accounts/**`, `/academic/**`, `/faculty/**`, `/communication/**`, `/bteb-annual-khata/**`, `/live-quizzes/**`) while keeping public landing and verification pages accessible.
  - [x] Ensure API routes (`/api/**`) return JSON 401/403 status codes instead of redirecting to HTML login pages.

- [x] **Task 2.4: Audit & Protect Critical API Endpoints (`app/api/**`)**
  - [x] Protect Admin & Governance APIs (`admin/permissions`, `admin/ai-settings`, `admin/audit-logs`).
  - [x] Protect Academic, Marks & Tabulation APIs (`examination/marks`, `marks`, `results/calculate`, `students/rollover`, `students/bulk`).
  - [x] Protect Accounts & SMS APIs (`accounts/fees`, `communication/sms/send`).
  - [x] Validate and sanitize query parameters on public verification & result endpoints (`documents/public-verify`, `documents/verify/[docNumber]`, `results`).

- [x] **Task 2.5: Database & Store Layer Stabilization (`lib/prisma.ts`, `lib/database.ts`, `prisma/schema.prisma`)**
  - [x] Ensure `lib/prisma.ts` uses singleton pattern (`globalForPrisma`) against pool exhaustion.
  - [x] Audit `lib/database.ts` and custom stores to safely query Prisma with proper try/catch and non-destructive fallbacks.
  - [x] Add standardized API error response helper in `lib/utils.ts` or `lib/safeJsonParser.ts` preventing sensitive stack trace leaks.

- [x] **Task 2.6: Verification & Phase 2 Completion Report**
  - [x] Run full TypeScript verification (`npx tsc --noEmit` passed with 0 errors).
  - [x] Update `PROGRESS_TRACKER.md` to mark all Phase 2 tasks complete.
  - [x] Generate Phase 2 summary report.

## PHASE 3: Full-Stack Design System, Atomic UI Kit & Backend API Contracts

- [x] **Task 3.1: Update PROGRESS_TRACKER.md with Full-Stack Phase 3 Checklist**
  - [x] Add Tasks 3.1 through 3.8 to `PROGRESS_TRACKER.md`.

- [x] **Task 3.2: Standardized Backend API Response & Error Handler (`lib/safeFetch.ts`, `lib/safeJsonParser.ts`, `lib/utils.ts`)**
  - [x] Implement backend standard helpers (`apiSuccess`, `apiError`, `withApiHandler`) maintaining backward compatibility.
  - [x] Catch Prisma, validation, and runtime errors cleanly with human-readable Bengali/English messages.
  - [x] Upgrade frontend fetch wrapper (`lib/safeFetch.ts`) with timeout, 401/403 interception, and structured error extraction.

- [x] **Task 3.3: Backend Global Settings, Theme & Institution Config Sync (`app/api/institution/route.ts`, `app/api/academic/academy-settings/route.ts`, `app/api/academic/global-settings/route.ts`)**
  - [x] Ensure institutional branding is served cleanly and cached via `useAcademySettings.ts` without redundant fetches.
  - [x] Validate mutation payloads in `POST`/`PUT` endpoints before saving to Prisma / `academySettingsStore.ts`.

- [x] **Task 3.4: Premium Design Tokens, Bangla Typography & Surface Hierarchy (`app/globals.css`, `app/layout.tsx`)**
  - [x] Configure Bengali (`Hind Siliguri`/`Noto Sans Bengali`) and English typography with relaxed line heights for non-clipping text.
  - [x] Implement surface elevation, hairline borders (`1px`), clean canvas backgrounds, and crisp focus rings.
  - [x] Add `@media print` rules for BTEB Tabulation Sheets, Attendance Khatas, Transcripts, and Certificates.

- [x] **Task 3.5: Build/Upgrade Reusable Full-Stack Atomic UI Kit (`components/ui/`)**
  - [x] `Button.tsx`: variants, sizes, mobile touch targets (>=40px), built-in `isLoading` state.
  - [x] `Input.tsx` & `Select.tsx`: label, helperText, error display, left/right adornments.
  - [x] `Card.tsx`: standardized `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
  - [x] `Modal.tsx`: accessible dialog with Escape close, backdrop blur, focus trap, and responsive drawer/sheet support.
  - [x] `DataTable.tsx` & `Badge.tsx`: table primitive with loading skeleton, empty state, error/retry state, and sticky columns.
  - [x] `Toast.tsx`: non-blocking notification/status feedback banner system.

- [x] **Task 3.6: SVG, Vector Graphics, Icon Theme & Animation Audit (`components/ui/animated-svgs.tsx`, `animation-effects.tsx`, `components/common/AnimatedGears.tsx`, `lib/iconThemes.ts`)**
  - [x] Optimize SVGs and remove CPU-heavy infinite filter/spin loops.
  - [x] Add `@media (prefers-reduced-motion: reduce)` support.
  - [x] Ensure standard `viewBox`, `strokeWidth`, and accessibility attributes.

- [x] **Task 3.7: Integrate Design System & Backend Error/Loading States into Global Common Components (`components/common/`)**
  - [x] Upgrade `AcademicFilterBar.tsx` and `AcademyClassTradeSelector.tsx`.
  - [x] Upgrade `GlobalSearchBar.tsx` with debounced search, keyboard shortcuts (`Cmd/Ctrl+K`), and loading indicators.
  - [x] Upgrade `ErrorBoundary.tsx` and `app/error.tsx` with new `Card` and `Button` recovery flow.

- [x] **Task 3.8: Verification & Phase 3 Completion Report**
  - [x] Run full TypeScript verification (`npx tsc --noEmit` passed with 0 errors).
  - [x] Update `PROGRESS_TRACKER.md` to mark all Phase 3 tasks complete.
  - [x] Generate Phase 3 summary report.

## PHASE 4: Unified Navigation, Role-Based Dashboards & Backend Aggregation APIs

- [x] **Task 4.1: Update PROGRESS_TRACKER.md with Full-Stack Phase 4 Checklist**
  - [x] Add Tasks 4.1 through 4.8 to `PROGRESS_TRACKER.md`.

- [x] **Task 4.2: Backend Dashboard & Analytics Aggregation API (`app/api/academic/context/route.ts`, `app/api/admin/audit-logs/route.ts`, `app/api/faculty/workload/route.ts`, `app/api/dashboard/summary/route.ts`)**
  - [x] Consolidate dashboard KPI aggregation to prevent waterfall/scattered requests.
  - [x] Implement strict role-filtered metrics (Admin, Teacher, Student) using batched queries.

- [x] **Task 4.3: Backend Global Search, Public Portal CMS & Notice APIs (`app/api/search/route.ts`, `app/api/cms/route.ts`, `app/api/notices/route.ts`, `app/api/events/route.ts`, `app/api/gallery/route.ts`, `app/api/downloads/route.ts`)**
  - [x] Upgrade `app/api/search/route.ts` with sanitized queries, role-awareness, category caps, and privacy checks.
  - [x] Harden CMS and Notice endpoints with fast GET caching and `serverAuthGuard` validation for mutations.

- [x] **Task 4.4: Consolidate 4 Sidebars into 1 Unified Role-Based Navigation System (`components/layout/Sidebar.tsx`, `components/navigation/*`)**
  - [x] Create single authoritative role-aware navigation configuration covering all 8 functional pillars.
  - [x] Turn `AdminSidebar.tsx`, `HierarchicalSidebar.tsx`, `InstitutionalErpSidebar.tsx` into backward-compatible wrappers.
  - [x] Implement desktop mini-rail mode (w-64 expanded, w-20 collapsed) and mobile slide-over drawer with zero overflow.

- [x] **Task 4.5: Upgrade Private ERP Header & Public Portal Header/Footer (`components/layout/Header.tsx`, `PublicHeader.tsx`, `PublicFooter.tsx`)**
  - [x] Upgrade ERP Header with `GlobalSearchBar` (Ctrl+K), session badge, language/theme switchers, and profile menu.
  - [x] Polish PublicHeader and PublicFooter with institutional branding, verification shortcuts, and portal links.

- [x] **Task 4.6: Unify & Upgrade Role-Based ERP Dashboards (`components/dashboard/CleanDashboardView.tsx`, `DashboardView.tsx`, `components/faculty/TeacherDashboardView.tsx`, `app/admin/page.tsx`)**
  - [x] Modernize Admin, Teacher, and Staff dashboards using Phase 3 Atomic UI primitives (`Card`, `Button`, `Badge`, `DataTable`).
  - [x] Integrate 1-click Quick Action Hub and Teacher Workspace schedule/pending mark sheets.
  - [x] Upgrade SecurityGovernanceHub and role-permission matrix with optimistic UI and audit log access.

- [x] **Task 4.7: Redesign Public Institutional Portal & CMS Panel (`app/page.tsx`, `components/home/*`, `components/dashboard/CmsManagementPanel.tsx`)**
  - [x] Upgrade public homepage with crisp Hero, digital notice board ticker, directory, and quick portals.
  - [x] Ensure CMS management panel smoothly updates slider, notices, events, gallery, and downloads.

- [x] **Task 4.8: Verification & Phase 4 Completion Report**
  - [x] Verify all routes and navigation links with zero 404s or broken imports.
  - [x] Run full TypeScript compilation (`npx tsc --noEmit` exited with 0 errors).
  - [x] Update `PROGRESS_TRACKER.md` to mark all Phase 4 tasks complete.
  - [x] Generate Phase 4 summary report.

