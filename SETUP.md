# Setup

A tool where teachers upload an interactive HTML activity (made with Claude) and
get a shareable link for students. Students just type their name — no login.
Teachers sign in to save activities and watch responses come in live.

It reuses the `stardrop:*` postMessage protocol, so activities you already made
for Stardrop work here unchanged.

## 1. Create a Supabase project

1. Go to <https://supabase.com/dashboard> → **New project** (a fresh project,
   separate from Stardrop).
2. Once it's up, open **Project Settings → API** and copy:
   - **Project URL**
   - **anon public** key
   - **service_role** key (keep secret)

## 2. Configure env vars

```bash
cp .env.local.example .env.local
```

Fill in the three values from step 1.

**Optional — AI generation ("Generate with Claude"):** also set `ANTHROPIC_API_KEY`
(from <https://console.anthropic.com/>). Leave it blank to hide the feature —
uploading still works. You pay per generation. The model is set in
`lib/anthropic.ts` (`MODEL`); it defaults to `claude-opus-4-8` — switch to
`claude-sonnet-5` there for lower cost and faster generation.

## 3. Create the database + storage

In the Supabase dashboard, open **SQL Editor → New query** and run, in order:

1. `supabase/schema.sql`  — tables, RLS, realtime
2. `supabase/storage.sql` — the public `activities` storage bucket
3. `supabase/billing.sql` — the `billing` table (only needed if you set up Stripe)

## 4. Turn on email/password auth

**Authentication → Providers → Email**: make sure it's enabled. For fast local
testing you can turn **off** "Confirm email" (Authentication → Providers → Email
→ Confirm email) so new teacher signups can log in immediately.

## 5. Install + run

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## 6. (Optional) Billing — $10/month after the free-generation trial

Gates only **AI generation** (the Anthropic cost). Each teacher gets a fixed
number of free generations (`FREE_GENERATIONS` in `lib/plan.ts`, default 25),
then pays $10/mo — after which a fair-use monthly cap (`PAID_MONTHLY_LIMIT`,
default 100) keeps a power user from running up your bill. Both numbers are
one-line edits in `lib/plan.ts`. The generation model is set in `lib/anthropic.ts`
(`MODEL`, currently `claude-sonnet-5` — cheaper/faster than Opus). Upload,
sharing, join codes, and data collection are always free. Skip this whole
section to leave generation open (the trial banner just won't enforce anything).

1. Run `supabase/billing.sql` (step 3 above). If you already ran it, re-run it —
   it safely adds the `trial_generations_used` column.
2. In the **Stripe dashboard** (test mode first):
   - **Products → Add product** → recurring price, **$10 / month** → copy the
     **Price ID** (`price_...`) into `STRIPE_PRICE_ID`.
   - **Developers → API keys** → copy the **Secret key** into `STRIPE_SECRET_KEY`.
   - **Developers → Webhooks → Add endpoint** → URL
     `https://YOUR_DOMAIN/api/stripe/webhook`, subscribe to
     `checkout.session.completed`, `customer.subscription.created`,
     `customer.subscription.updated`, `customer.subscription.deleted`,
     `invoice.payment_failed` → copy the **Signing secret** (`whsec_...`) into
     `STRIPE_WEBHOOK_SECRET`.
   - **Settings → Billing → Customer portal** → activate it (lets teachers
     cancel/manage).
3. Add the three `STRIPE_*` vars to `.env.local` (and to Vercel's env vars for
   production). Redeploy.

Local webhook testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
and use the `whsec_` it prints.

## How it works (quick tour)

- **Teacher** signs in → **New activity** → uploads an HTML file → picks whether
  to collect student data → gets a link like `/p/abc123`.
- **Student** opens the link → types their name → does the activity. If the
  activity speaks the `stardrop:*` protocol, their answers save automatically
  (one editable record per name).
- **Teacher** opens the activity → **View data** → sees responses live, grouped
  per question as word walls.

## Making an activity collect data

Tell Claude to build the activity so it talks to the host page via `postMessage`:

- On load, post `{ type: "stardrop:ready" }` to `window.parent`.
- Listen for `{ type: "stardrop:init", initialData, readOnly }` and restore from
  `initialData` (so returning students see their previous answers).
- As the student works, post `{ type: "stardrop:progress", data }` where `data`
  is `{ answers, responses: [{ id, prompt, type, answer }] }`.
- When they finish, post `{ type: "stardrop:complete", data }`.

The `responses` array is what powers the word walls — give each prompt a stable
`id` and a human-readable `prompt`. (See `sample-activities/` for a working
example.)
