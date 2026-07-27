# SIWES Writer — Production SaaS Build Plan

Two notes up front:
- **Stack**: this project runs on TanStack Start (React + TypeScript + Tailwind + Vite), not Next.js. Everything you described maps over cleanly — server functions replace Next.js API routes.
- **Gemini**: your Gemini key isn't needed. Lovable AI Gateway gives direct access to Google Gemini models server-side, with the key never exposed to the browser. The AI service will be a single isolated module so swapping to OpenAI later means changing one file.

This is a large build, so it ships in phases. Each phase leaves the app working.

---

## Phase 1 — Foundation & design system
- Enable Lovable Cloud (auth + database + file storage for payment screenshots).
- Design tokens in `src/styles.css`: primary blue `#2563EB`, white, light gray accents, rounded corners, soft shadows, clean typography, light + dark mode.
- Shared layout shell, header with session-aware auth affordance, footer.
- SEO baseline: per-route titles/meta/OG, favicon, `robots.txt`, `sitemap.xml`, JSON-LD structured data.

## Phase 2 — Database schema
Tables (all with RLS + grants):
- `profiles` — user id, full name, email, phone, department, status (`pending` / `premium` / `suspended`), timestamps. Auto-created via signup trigger.
- `user_roles` + `app_role` enum + `has_role()` security-definer function (admin checks never live on profiles).
- `reports` — user_id, department, report_type (daily/weekly/monthly), original_text, ai_output, created_at, updated_at.
- `payments` — user_id, full name, email, phone, transaction ref, amount, payment date, screenshot path, status (pending/approved/rejected), reviewed_by, timestamps.
- `departments` — name, active flag, sort order; seeded with your full list.
- `settings` — key/value for bank name, account name, account number, amount, payment instructions.
- `announcements` — title, body, active, timestamps.
- `faqs` — question, answer, sort order.
- Storage bucket for payment screenshots (private; owner + admin read).

## Phase 3 — Authentication
- `/auth` page: sign up, log in, Google sign-in, email verification handling.
- `/forgot-password` and `/reset-password` routes.
- Protected `_authenticated/` layout; admin-only nested layout gated by `has_role`.
- New users default to `pending` status.

## Phase 4 — Landing page (`/`)
- Hero: "Write Professional SIWES Reports in Seconds" + subheadline, Get Started / Learn More, generated illustration of rough notes transforming into a polished report.
- Features grid (all 10 cards), How It Works (7 steps), Benefits, Pricing (single Premium plan, manual activation), FAQ (from database), Contact, Footer with About / Contact / Privacy / Terms.
- Static pages: `/about`, `/contact`, `/privacy`, `/terms`.

## Phase 5 — Dashboard & gating
- `/dashboard`: if `pending`, show lock state with the activation message and an Upgrade CTA; generator stays locked. If `premium`, show welcome message, quick stats, recent reports, Generate / Profile / Logout actions.
- Active announcements surfaced to users.

## Phase 6 — AI generator
- `/generate`: searchable department combobox (database-driven + custom entry), report type dropdown, notes textarea, Generate button with loading state.
- Server function calls Gemini through Lovable AI Gateway with your exact system prompt, plus department and report type context. Zod validation, premium-status check server-side, per-user rate limiting.
- Output card with Copy ("Copied Successfully"), Generate Again, Save, Delete.
- AI logic isolated in one service module for future provider swaps.

## Phase 7 — Report history
- `/reports`: search, filter by type, sort newest/oldest, view / copy / delete. Grouped by Daily / Weekly / Monthly.

## Phase 8 — Manual payment flow
- `/upgrade`: payment instructions rendered from `settings` (admin-editable).
- Payment form: full name, email, phone, transaction reference, amount paid, payment date, screenshot upload. On submit, show the awaiting-approval message.

## Phase 9 — Admin panel (`/admin/*`)
- Overview: total users, premium, pending, reports generated, manual revenue stats.
- Users: list, search, activate/deactivate premium, suspend, delete.
- Payments: review queue, view screenshots, approve (auto-upgrades user to premium) or reject.
- Departments CRUD, Settings editor, FAQ manager, Announcements manager.
- Every admin action verified server-side against `has_role`, never client state.

## Phase 10 — Polish & verification
- Toast notifications for success/error, loading skeletons, smooth animations.
- Accessibility pass, mobile responsiveness pass, image optimization, lazy loading.
- Security scan, full typecheck/build, and end-to-end walkthrough: signup → pending lock → payment submit → admin approve → generate → save → history.

---

## Technical notes
- Server functions (`createServerFn`) handle all AI calls, admin actions, and privileged writes — no secrets reach the browser.
- Roles live in a separate `user_roles` table with a security-definer `has_role()` function to prevent privilege escalation.
- All user data protected by RLS scoped to `auth.uid()`; admin access via `has_role`.
- Zod validation on every form and every server function input.

Would you like me to start with Phases 1–4 (foundation, database, auth, landing page) and then continue?
