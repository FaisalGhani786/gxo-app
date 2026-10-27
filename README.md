# gxoeditz!

Website and back office for gxoeditz — short-form video editing courses, paid 1-1 mentoring, and the editing team.

**Stack:** Next.js 16 (App Router) on **Vercel** · **Supabase** (Auth, Postgres, Row Level Security) · Motion for animation · optional **Stripe** Checkout for card payments.

## What's in it

**Public site**
- Animated hero (floating tool tiles, live "timeline" with a sweeping playhead), marquee and scroll reveals. Respects "reduce motion".
- **Latest shorts** — YouTube Shorts / TikTok / Reels / .mp4 links managed from Admin → Showcase, played inline.
- **Pricing** — courses and 1-1 mentoring, editable from Admin → Packages.
- **Book a 1-1** (`/book`) — session type → day → time (UK), clashes blocked by the database. After booking, the client can pay and send gxo the details by **email** (pre-filled) or **WhatsApp** (click-to-chat).
- **Join the team** (`/apply`) — requires Adobe Premiere Pro **and** CapCut; approved editors get the Discord invite.
- Floating WhatsApp button on every page.

**Client dashboard** (`/dashboard`) — courses with progress, lesson player with "mark complete", 1-1 sessions (cancel while unconfirmed), orders, Discord invite when entitled, profile.

**Admin** (`/admin`) — revenue and upcoming sessions, clients (with progress, bookings, orders; grant/revoke courses), bookings (confirm, add call link, mark paid), orders (mark paid → unlocks access), packages & lessons, team applications, showcase shorts, settings (email, WhatsApp, socials, booking hours, Discord invite).

## Starting prices (GBP, editable)

| Package | Price |
| --- | --- |
| CapCut Fundamentals (course) | £49 |
| Short-Form Pro — Premiere Pro + CapCut, Discord (course) | £149 |
| Agency Track — client business + team priority (course) | £349 |
| Quick Fix — 30-min 1-1 | £40 |
| Deep Dive — 60-min 1-1 | £75 |
| Mentorship Pack — 4 × 60-min 1-1 + Discord | £260 |

## Auth & security

All authentication is Supabase Auth (email + password, confirmation and reset emails) — no other auth provider. Every table has RLS; prices, enrolments and payments are decided inside `SECURITY DEFINER` functions (`create_order`, `request_booking`, `fulfil_order`), never by the browser.

## Payments

- **Without Stripe** (default): orders are created as *pending*. Mark them paid in Admin → Orders/Bookings after a bank transfer; access unlocks immediately.
- **With Stripe:** set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel and add a webhook in Stripe to `https://<domain>/api/stripe/webhook` for `checkout.session.completed` and `checkout.session.async_payment_succeeded`.

## Making yourself admin

Sign up on the site, then in Supabase → SQL Editor:

```sql
update public.profiles set is_admin = true where email = 'you@example.com';
```

## Automatic deploys

| Change | Where it goes |
| --- | --- |
| Code pushed to GitHub | Vercel builds a preview for every branch and deploys `main` to production (Git integration). |
| New file in `supabase/migrations/` merged to `main` | The **Supabase migrations** GitHub Action runs `supabase db push`. Needs repo secrets `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD`. |

## Local development

```bash
cp .env.example .env.local   # fill in the values
npm install
npm run dev
```

`npm run lint`, `npm run typecheck`, `npm run build` are what CI runs.
