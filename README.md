
-# Dnyanothon 2026 Frontend + Secure Backend Integration
+<div align="center">
 
-This Next.js app now contains the secure API layer for the Dnyanothon 2026 hackathon platform, while the Supabase database schema and RLS migrations live in [`../Backend/supabase/migrations`](../Backend/supabase/migrations).
+# Dnyanothon 2026
 
-## Stack
+### A premium hackathon platform for registrations, approvals, QR passes, meal/service claims, and event operations.
 
-- Next.js App Router
-- TypeScript strict mode
-- Tailwind CSS
-- Supabase Auth
-- Supabase PostgreSQL + RLS
-- Supabase Storage ready
-- Resend email sending
-- Signed QR passes and meal coupon flow
+[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
+[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=111)](https://react.dev/)
+[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
+[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Postgres-3FCF8E?style=for-the-badge&logo=supabase&logoColor=111)](https://supabase.com/)
+[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
 
-## Folder Layout
+**Dnyanothon 2026** is an end-to-end event platform built with the Next.js App Router. It combines a polished public landing experience with secure participant registration, Supabase-backed admin workflows, volunteer QR verification, Resend email automation, and service-claim tracking for meals, kits, certificates, and entry access.
+
+[Live App](https://dnyanthon.vercel.app) · [Register](https://dnyanthon.vercel.app/register) · [Admin](https://dnyanthon.vercel.app/admin) · [Volunteer APIs](#volunteer-operations)
+
+</div>
+
+---
+
+## ✨ Highlights
+
+- **Premium landing page** with animated counters, event tracks, timeline, prize cards, speaker/organizer sections, and FAQ.
+- **Secure participant registration** with authenticated submissions, Zod validation, team creation, duplicate checks, and confirmation emails.
+- **Admin command center** for participant approvals/rejections, team review, statistics, exports, recent scans, volunteer activity, and meal/service status.
+- **Signed QR pass system** using HMAC verification and hashed server-side token storage.
+- **Volunteer scanning workflows** for entry, meals, kits, certificates, and other event services.
+- **Supabase RLS-first architecture** with role-based authorization for participants, admins, super admins, and volunteers.
+- **Production email pipeline** powered by Resend templates and auditable email logs.
+- **Offline-friendly scan sync API** for volunteer devices operating in unreliable network environments.
+
+---
+
+## 🧭 Product Experience
+
+| Area | What it does |
+| --- | --- |
+| **Landing page** | Presents Dnyanothon tracks, prizes, schedule, speakers, organizers, and registration CTA. |
+| **Registration** | Lets authenticated users register teams and team members for the seeded event. |
+| **Participant portal** | Gives participants a dedicated event-facing experience after registration. |
+| **Admin dashboard** | Enables organizers to approve/reject participants, inspect teams, export data, and monitor event operations. |
+| **Volunteer workflow** | Supports QR validation and claim recording for entry, meals, kits, certificates, and more. |
+| **Email automation** | Sends confirmation, approval-pass, and rejection emails through Resend. |
+
+---
+
+## 🛠 Tech Stack
+
+| Layer | Technology |
+| --- | --- |
+| Framework | Next.js App Router |
+| UI | React, Tailwind CSS, Framer Motion, Lucide React, React Icons, Recharts |
+| Language | TypeScript |
+| Auth & Database | Supabase Auth, PostgreSQL, Row Level Security |
+| Email | Resend |
+| Validation | Zod |
+| QR & Security | `qrcode`, HMAC-signed payloads, SHA hashing, server-only service role access |
+| Tooling | ESLint, TypeScript, npm |
+
+---
+
+## 🗂 Repository Structure
 
 ```text
-Frontend/
-  src/
-    app/
-      api/
-        register/
-        admin/
-        volunteer/
-    lib/
-      supabase/
-      validations/
-      security/
-      email/
-
-Backend/
-  supabase/
-    migrations/
-      001_schema.sql
-      002_rls_policies.sql
-      003_functions.sql
-      004_seed_event.sql
+.
+├── public/
+│   ├── Dnyanothon_Brochure.png
+│   └── dashboard-mockup.png
+├── src/
+│   ├── app/
+│   │   ├── api/
+│   │   │   ├── admin/
+│   │   │   ├── register/
+│   │   │   └── volunteer/
+│   │   ├── admin/
+│   │   ├── participant/
+│   │   ├── register/
+│   │   └── page.tsx
+│   ├── components/
+│   │   ├── admin/
+│   │   ├── auth/
+│   │   └── sections/
+│   ├── lib/
+│   │   ├── backend/
+│   │   ├── email/
+│   │   ├── security/
+│   │   ├── supabase/
+│   │   └── validations/
+│   └── types/
+├── package.json
+├── next.config.ts
+└── tsconfig.json
 ```
 
-## Environment Setup
+---
+
+## 🚀 Quick Start
 
-Create `Frontend/.env.local` from [`Frontend/.env.example`](./.env.example).
+### 1. Clone and install
 
 ```bash
+git clone <your-repository-url>
+cd Dnyanthon
+npm install
+```
+
+### 2. Configure environment variables
+
+Create `.env.local` in the project root:
+
+```env
 NEXT_PUBLIC_SUPABASE_URL=
 NEXT_PUBLIC_SUPABASE_ANON_KEY=
 SUPABASE_SERVICE_ROLE_KEY=
 SUPABASE_JWT_SECRET=
 QR_SIGNING_SECRET=
 RESEND_API_KEY=
 FROM_EMAIL=
-APP_URL=https://dnyanthon.vercel.app
+APP_URL=http://localhost:3000
 ```
 
-Important:
-
-- `SUPABASE_SERVICE_ROLE_KEY` must never be used in client code.
-- Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` belong in browser code.
-- Resend is used only from server-side route handlers.
-- `FROM_EMAIL` must be an actual sender address on a domain you have verified in Resend. A bare domain such as `dnyanothon.com` will be rejected.
-- Resend's `onboarding@resend.dev` sender is only for testing to your own account email. Use a verified domain sender for participant emails.
+> For production, set `APP_URL` to your deployed domain and use a verified sender for `FROM_EMAIL`.
 
-## Install
+### 3. Run locally
 
 ```bash
-cd Frontend
-npm install
+npm run dev
 ```
 
-New runtime packages added:
+Open [http://localhost:3000](http://localhost:3000) to view the landing page.
 
-- `@supabase/ssr`
-- `@supabase/supabase-js`
-- `qrcode`
-- `resend`
-- `zod`
+---
 
-## Supabase Setup
+## 🔐 Environment Variables
 
-Run the SQL files in this order inside Supabase SQL Editor or Supabase CLI:
+| Variable | Required | Scope | Purpose |
+| --- | --- | --- | --- |
+| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Browser + server | Supabase project URL. |
+| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Browser + server | Public Supabase anon key. |
+| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server only | Privileged database access for protected backend operations. |
+| `SUPABASE_JWT_SECRET` | Yes | Server only | JWT verification support for Supabase-authenticated requests. |
+| `QR_SIGNING_SECRET` | Yes | Server only | HMAC secret for QR pass payload signing. |
+| `RESEND_API_KEY` | Yes | Server only | Sends transactional participant emails. |
+| `FROM_EMAIL` | Yes | Server only | Verified sender address used by Resend. |
+| `APP_URL` | Yes | Server only | Base URL used in email links and QR-related flows. |
 
-1. `Backend/supabase/migrations/001_schema.sql`
-2. `Backend/supabase/migrations/002_rls_policies.sql`
-3. `Backend/supabase/migrations/003_functions.sql`
-4. `Backend/supabase/migrations/004_seed_event.sql`
+### Security reminders
 
-What they do:
+- Never expose `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `QR_SIGNING_SECRET`, or `RESEND_API_KEY` to client components.
+- Only `NEXT_PUBLIC_*` values should be available in browser code.
+- Use a verified Resend sender domain for production participant email delivery.
 
-- `001_schema.sql` creates profiles, events, teams, participants, service types, claims, volunteers, email logs, and audit logs.
-- `002_rls_policies.sql` enables RLS on every public table and adds strict participant, admin, and volunteer access rules.
-- `003_functions.sql` adds the auth-to-profile trigger, team member count sync, and a limited scan snapshot function.
-- `004_seed_event.sql` seeds the published `dnyanothon-2026` event and all service types.
+---
 
-## Auth Pattern
+## 🧩 Core Workflows
 
-Use Supabase Auth from the frontend for sign up and sign in. The backend assumes the user is authenticated before calling protected routes like registration, admin approval, or volunteer scans.
+### Participant registration
 
-Recommended sign-up metadata:
+1. User signs in with Supabase Auth.
+2. Registration form submits to `POST /api/register`.
+3. Server validates payloads with Zod.
+4. Event is resolved by event slug or event ID.
+5. Team and participant records are created in Supabase.
+6. Confirmation email is sent to the team leader.
+7. Email and audit records are persisted for operational visibility.
 
-```ts
-await supabase.auth.signUp({
-  email,
-  password,
-  options: {
-    data: {
-      full_name: fullName,
-      phone,
-    },
-  },
-});
-```
+### Admin approval
+
+1. Organizer opens the admin dashboard.
+2. Admin reviews participants and teams.
+3. `POST /api/admin/approve-participant` approves eligible participants.
+4. Server generates a one-time QR token and stores only its hash.
+5. Signed QR payload is rendered into a scannable pass.
+6. Approval email is sent with pass and service instructions.
+7. Audit logs capture the action.
+
+### Volunteer QR verification
+
+1. Volunteer scans a participant QR pass.
+2. Scanner calls `POST /api/volunteer/verify-qr` with QR payload, service type, and device ID.
+3. Server validates signature, participant status, token hash, volunteer permissions, and service availability.
+4. A service claim is inserted.
+5. Duplicate claims are blocked by database constraints.
+6. API returns a clear scan status such as `VERIFIED`, `ALREADY_CLAIMED`, `INVALID_QR`, `NOT_APPROVED`, `SERVICE_CLOSED`, or `UNAUTHORIZED_VOLUNTEER`.
+
+---
+
+## 📡 API Surface
 
-The `auth.users` trigger in `003_functions.sql` automatically creates the matching `profiles` row with default role `participant`.
+### Registration
 
-## Bootstrap the First Admin
+| Method | Route | Purpose |
+| --- | --- | --- |
+| `POST` | `/api/register` | Register a participant team for an event. |
 
-After your first organizer signs up, promote that profile and attach it to the seeded event:
+### Admin operations
+
+| Method | Route | Purpose |
+| --- | --- | --- |
+| `POST` | `/api/admin/approve-participant` | Approve participant and issue QR pass. |
+| `POST` | `/api/admin/reject-participant` | Reject participant registration. |
+| `POST` | `/api/admin/approve-team` | Approve an entire team. |
+| `POST` | `/api/admin/resend-qr-email` | Resend an approved participant pass. |
+| `GET` | `/api/admin/dashboard-stats?eventId=...` | Fetch event dashboard metrics. |
+| `GET` | `/api/admin/export-participants?eventId=...` | Export participant data. |
+| `GET` | `/api/admin/participants?eventId=...` | List participants for review. |
+| `GET` | `/api/admin/teams?eventId=...` | List event teams. |
+| `GET` | `/api/admin/recent-scans?eventId=...` | Inspect recent QR scans. |
+| `GET` | `/api/admin/meal-service-status?eventId=...` | Monitor meal/service claim status. |
+| `GET` | `/api/admin/volunteer-activity?eventId=...` | Review volunteer scan activity. |
+
+### Volunteer operations
+
+| Method | Route | Purpose |
+| --- | --- | --- |
+| `POST` | `/api/volunteer/verify-qr` | Verify a QR pass and record a service claim. |
+| `GET` | `/api/volunteer/duties` | Fetch volunteer assignments. |
+| `GET` | `/api/volunteer/recent-scans` | Fetch recent scans for the volunteer context. |
+| `POST` | `/api/volunteer/sync-offline` | Sync offline scan attempts from a device. |
+
+### Authentication
+
+| Method | Route | Purpose |
+| --- | --- | --- |
+| `POST` | `/api/auth/logout` | Clear Supabase auth session cookies. |
+| `GET` | `/auth/confirm` | Handle auth confirmation callbacks. |
+
+---
+
+## 🧪 Scripts
+
+| Command | Description |
+| --- | --- |
+| `npm run dev` | Start the local Next.js development server. |
+| `npm run build` | Create a production build. |
+| `npm run start` | Start the production server after building. |
+| `npm run lint` | Run ESLint checks. |
+| `npm run gen:quiz` | Run the project quiz generator script. |
+
+---
+
+## 🏗 Supabase Setup
+
+This frontend expects a Supabase schema with events, profiles, teams, participants, service types, service claims, volunteers, email logs, and audit logs.
+
+Recommended migration order if using the companion backend schema:
+
+1. `001_schema.sql`
+2. `002_rls_policies.sql`
+3. `003_functions.sql`
+4. `004_seed_event.sql`
+
+### Bootstrap first admin
+
+After the first organizer signs up, promote their profile and connect them to the seeded event:
 
 ```sql
 update public.profiles
 set role = 'admin'
 where email = 'organizer@example.com';
 
 update public.events
 set created_by = (
   select id
   from public.profiles
   where email = 'organizer@example.com'
 )
 where slug = 'dnyanothon-2026';
 ```
 
-To onboard volunteers later:
+### Add a volunteer
 
 ```sql
 update public.profiles
 set role = 'volunteer'
 where email = 'volunteer@example.com';
 
 insert into public.volunteers (user_id, event_id, assigned_service_id, duty_name)
 select
   p.id,
   e.id,
   s.id,
   'Lunch Gate'
 from public.profiles p
 cross join public.events e
 join public.service_types s
   on s.event_id = e.id
 where p.email = 'volunteer@example.com'
   and e.slug = 'dnyanothon-2026'
   and s.type = 'lunch'
 on conflict (user_id, event_id) do nothing;
 ```
 
-## Registration Flow
-
-The current registration UI at [`src/components/Registration.tsx`](./src/components/Registration.tsx) now posts to `POST /api/register`.
-
-What happens on submit:
-
-1. The route checks the signed-in user with Supabase SSR cookies.
-2. Input is validated with Zod.
-3. The event is resolved by `eventSlug` or `eventId`.
-4. Duplicate participant emails are rejected per-event.
-5. A team is created or reused.
-6. Pending participant rows are created for the leader and additional team members.
-7. A registration confirmation email is sent to the team leader.
-8. Email logs and audit logs are recorded.
-
-## Admin APIs
-
-All admin routes require the authenticated user to have role `admin` or `super_admin`, and normal admins must be the `created_by` owner of the event.
-
-- `POST /api/admin/approve-participant`
-- `POST /api/admin/reject-participant`
-- `GET /api/admin/dashboard-stats?eventId=...`
-- `GET /api/admin/export-participants?eventId=...`
-- `GET /api/admin/participants?eventId=...`
-- `GET /api/admin/teams?eventId=...`
-- `GET /api/admin/recent-scans?eventId=...`
-- `GET /api/admin/meal-service-status?eventId=...`
-- `GET /api/admin/volunteer-activity?eventId=...`
-
-### Example Admin Approval Flow
-
-1. Admin calls `POST /api/admin/approve-participant` with `{ "participantId": "..." }`.
-2. Backend confirms the admin manages the participant’s event.
-3. Registration status becomes `approved`.
-4. A random QR token is generated server-side.
-5. Only the hashed token is stored in `participants.qr_token_hash`.
-6. A signed QR payload is encoded and rendered as a QR image.
-7. The approval email with pass and meal instructions is sent via Resend.
-8. Email and audit logs are written.
-
-## Volunteer APIs
-
-Volunteer routes require role `volunteer`, `admin`, or `super_admin`. Regular volunteers must be assigned to the event and service.
-
-- `POST /api/volunteer/verify-qr`
-- `GET /api/volunteer/duties`
-- `GET /api/volunteer/recent-scans`
-- `POST /api/volunteer/sync-offline`
-
-### Example Volunteer QR Verification Flow
-
-1. Volunteer app scans a QR and sends `{ qrPayload, serviceTypeId, deviceId }` to `POST /api/volunteer/verify-qr`.
-2. Backend verifies the QR signature.
-3. Backend fetches the participant and checks `registration_status = approved`.
-4. The raw QR token is hashed server-side and compared against `participants.qr_token_hash`.
-5. Backend verifies the volunteer’s assignment for that event/service.
-6. Backend checks the service window and active flag.
-7. A `service_claims` insert is attempted.
-8. The unique constraint on `(participant_id, service_type_id)` blocks duplicate claims.
-9. Backend returns one of:
-   - `VERIFIED`
-   - `ALREADY_CLAIMED`
-   - `INVALID_QR`
-   - `NOT_APPROVED`
-   - `SERVICE_CLOSED`
-   - `UNAUTHORIZED_VOLUNTEER`
-
-## Security Notes
-
-- `src/lib/supabase/admin.ts` is server-only and throws if imported in the browser.
-- Every public table in Supabase has RLS enabled.
-- Role checks are always read from the database, not from the frontend.
-- QR payloads are HMAC-signed with `QR_SIGNING_SECRET`.
-- Raw QR tokens are never stored in the database.
-- Duplicate claim prevention is enforced in the database with a unique constraint.
-- Admin and volunteer actions are written to `audit_logs`.
-- Route handlers include a small in-memory rate-limit placeholder. For production, swap this with Redis or Upstash.
-
-## Running Locally
+---
 
-```bash
-cd Frontend
-npm run dev
-```
+## 🛡 Security Architecture
+
+- **Server-only admin client** protects service role usage from browser bundles.
+- **Database-backed authorization** prevents trusting client-provided roles.
+- **Row Level Security** keeps public-table access constrained by Supabase policies.
+- **Hashed QR tokens** ensure raw pass secrets are never stored.
+- **HMAC QR signatures** detect tampering and forged payloads.
+- **Unique service claims** prevent duplicate meal or service redemption.
+- **Audit logs** track sensitive admin and volunteer operations.
+- **Rate-limit hooks** provide a foundation for production-grade abuse protection.
+
+---
+
+## 🚢 Deployment Checklist
+
+- [ ] Configure all environment variables in the hosting provider.
+- [ ] Verify Supabase migrations and RLS policies are applied.
+- [ ] Promote at least one organizer account to `admin` or `super_admin`.
+- [ ] Verify `FROM_EMAIL` uses a Resend-verified sender domain.
+- [ ] Set `APP_URL` to the final production URL.
+- [ ] Run `npm run build` before release.
+- [ ] Smoke-test registration, approval email delivery, QR verification, and duplicate scan prevention.
+
+---
+
+## 📌 Key Files
+
+| File | Why it matters |
+| --- | --- |
+| `src/app/page.tsx` | Main event landing page experience. |
+| `src/components/Registration.tsx` | Participant/team registration UI. |
+| `src/app/api/register/route.ts` | Registration API entry point. |
+| `src/lib/backend/registration.ts` | Core registration backend logic. |
+| `src/lib/backend/admin.ts` | Admin data and authorization helpers. |
+| `src/lib/backend/volunteer.ts` | Volunteer scan and duty logic. |
+| `src/lib/security/qr-token.ts` | Signed QR payload generation and verification. |
+| `src/lib/security/permissions.ts` | Role and permission enforcement. |
+| `src/lib/email/templates/` | Transactional email templates. |
+| `src/lib/constants.ts` | Event slug and service label constants. |
+
+---
+
+## 🤝 Contributing
+
+1. Create a feature branch.
+2. Install dependencies with `npm install`.
+3. Make focused, well-tested changes.
+4. Run `npm run lint` and `npm run build`.
+5. Open a pull request with a clear summary, screenshots for UI changes, and test notes.
 
-Then open:
+---
 
-- `http://localhost:3000/` for the landing page
-- `http://localhost:3000/register` for the registration flow
+<div align="center">
 
-## Files to Review First
+**Built for hackers, organizers, volunteers, and every great idea waiting to ship.**
 
-- [`src/components/Registration.tsx`](./src/components/Registration.tsx)
-- [`src/lib/security/qr-token.ts`](./src/lib/security/qr-token.ts)
-- [`src/lib/security/permissions.ts`](./src/lib/security/permissions.ts)
-- [`src/lib/backend/registration.ts`](./src/lib/backend/registration.ts)
-- [`src/lib/backend/admin.ts`](./src/lib/backend/admin.ts)
-- [`src/lib/backend/volunteer.ts`](./src/lib/backend/volunteer.ts)
+</div>
