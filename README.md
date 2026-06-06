# Dnyanothon 2026 Frontend + Secure Backend Integration

This Next.js app now contains the secure API layer for the Dnyanothon 2026 hackathon platform, while the Supabase database schema and RLS migrations live in [`../Backend/supabase/migrations`](../Backend/supabase/migrations).

## Stack

- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- Supabase Auth
- Supabase PostgreSQL + RLS
- Supabase Storage ready
- Resend email sending
- Signed QR passes and meal coupon flow

## Folder Layout

```text
Frontend/
  src/
    app/
      api/
        register/
        admin/
        volunteer/
    lib/
      supabase/
      validations/
      security/
      email/

Backend/
  supabase/
    migrations/
      001_schema.sql
      002_rls_policies.sql
      003_functions.sql
      004_seed_event.sql
```

## Environment Setup

Create `Frontend/.env.local` from [`Frontend/.env.example`](./.env.example).

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
QR_SIGNING_SECRET=
RESEND_API_KEY=
FROM_EMAIL=
APP_URL=http://localhost:3000
```

Important:

- `SUPABASE_SERVICE_ROLE_KEY` must never be used in client code.
- Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` belong in browser code.
- Resend is used only from server-side route handlers.
- `FROM_EMAIL` must be an actual sender address on a domain you have verified in Resend. A bare domain such as `dnyanothon.com` will be rejected.
- Resend's `onboarding@resend.dev` sender is only for testing to your own account email. Use a verified domain sender for participant emails.

## Install

```bash
cd Frontend
npm install
```

New runtime packages added:

- `@supabase/ssr`
- `@supabase/supabase-js`
- `qrcode`
- `resend`
- `zod`

## Supabase Setup

Run the SQL files in this order inside Supabase SQL Editor or Supabase CLI:

1. `Backend/supabase/migrations/001_schema.sql`
2. `Backend/supabase/migrations/002_rls_policies.sql`
3. `Backend/supabase/migrations/003_functions.sql`
4. `Backend/supabase/migrations/004_seed_event.sql`

What they do:

- `001_schema.sql` creates profiles, events, teams, participants, service types, claims, volunteers, email logs, and audit logs.
- `002_rls_policies.sql` enables RLS on every public table and adds strict participant, admin, and volunteer access rules.
- `003_functions.sql` adds the auth-to-profile trigger, team member count sync, and a limited scan snapshot function.
- `004_seed_event.sql` seeds the published `dnyanothon-2026` event and all service types.

## Auth Pattern

Use Supabase Auth from the frontend for sign up and sign in. The backend assumes the user is authenticated before calling protected routes like registration, admin approval, or volunteer scans.

Recommended sign-up metadata:

```ts
await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: fullName,
      phone,
    },
  },
});
```

The `auth.users` trigger in `003_functions.sql` automatically creates the matching `profiles` row with default role `participant`.

## Bootstrap the First Admin

After your first organizer signs up, promote that profile and attach it to the seeded event:

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

To onboard volunteers later:

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

## Registration Flow

The current registration UI at [`src/components/Registration.tsx`](./src/components/Registration.tsx) now posts to `POST /api/register`.

What happens on submit:

1. The route checks the signed-in user with Supabase SSR cookies.
2. Input is validated with Zod.
3. The event is resolved by `eventSlug` or `eventId`.
4. Duplicate participant emails are rejected per-event.
5. A team is created or reused.
6. Pending participant rows are created for the leader and additional team members.
7. A registration confirmation email is sent to the team leader.
8. Email logs and audit logs are recorded.

## Admin APIs

All admin routes require the authenticated user to have role `admin` or `super_admin`, and normal admins must be the `created_by` owner of the event.

- `POST /api/admin/approve-participant`
- `POST /api/admin/reject-participant`
- `GET /api/admin/dashboard-stats?eventId=...`
- `GET /api/admin/export-participants?eventId=...`
- `GET /api/admin/participants?eventId=...`
- `GET /api/admin/teams?eventId=...`
- `GET /api/admin/recent-scans?eventId=...`
- `GET /api/admin/meal-service-status?eventId=...`
- `GET /api/admin/volunteer-activity?eventId=...`

### Example Admin Approval Flow

1. Admin calls `POST /api/admin/approve-participant` with `{ "participantId": "..." }`.
2. Backend confirms the admin manages the participant’s event.
3. Registration status becomes `approved`.
4. A random QR token is generated server-side.
5. Only the hashed token is stored in `participants.qr_token_hash`.
6. A signed QR payload is encoded and rendered as a QR image.
7. The approval email with pass and meal instructions is sent via Resend.
8. Email and audit logs are written.

## Volunteer APIs

Volunteer routes require role `volunteer`, `admin`, or `super_admin`. Regular volunteers must be assigned to the event and service.

- `POST /api/volunteer/verify-qr`
- `GET /api/volunteer/duties`
- `GET /api/volunteer/recent-scans`
- `POST /api/volunteer/sync-offline`

### Example Volunteer QR Verification Flow

1. Volunteer app scans a QR and sends `{ qrPayload, serviceTypeId, deviceId }` to `POST /api/volunteer/verify-qr`.
2. Backend verifies the QR signature.
3. Backend fetches the participant and checks `registration_status = approved`.
4. The raw QR token is hashed server-side and compared against `participants.qr_token_hash`.
5. Backend verifies the volunteer’s assignment for that event/service.
6. Backend checks the service window and active flag.
7. A `service_claims` insert is attempted.
8. The unique constraint on `(participant_id, service_type_id)` blocks duplicate claims.
9. Backend returns one of:
   - `VERIFIED`
   - `ALREADY_CLAIMED`
   - `INVALID_QR`
   - `NOT_APPROVED`
   - `SERVICE_CLOSED`
   - `UNAUTHORIZED_VOLUNTEER`

## Security Notes

- `src/lib/supabase/admin.ts` is server-only and throws if imported in the browser.
- Every public table in Supabase has RLS enabled.
- Role checks are always read from the database, not from the frontend.
- QR payloads are HMAC-signed with `QR_SIGNING_SECRET`.
- Raw QR tokens are never stored in the database.
- Duplicate claim prevention is enforced in the database with a unique constraint.
- Admin and volunteer actions are written to `audit_logs`.
- Route handlers include a small in-memory rate-limit placeholder. For production, swap this with Redis or Upstash.

## Running Locally

```bash
cd Frontend
npm run dev
```

Then open:

- `http://localhost:3000/` for the landing page
- `http://localhost:3000/register` for the registration flow

## Files to Review First

- [`src/components/Registration.tsx`](./src/components/Registration.tsx)
- [`src/lib/security/qr-token.ts`](./src/lib/security/qr-token.ts)
- [`src/lib/security/permissions.ts`](./src/lib/security/permissions.ts)
- [`src/lib/backend/registration.ts`](./src/lib/backend/registration.ts)
- [`src/lib/backend/admin.ts`](./src/lib/backend/admin.ts)
- [`src/lib/backend/volunteer.ts`](./src/lib/backend/volunteer.ts)
