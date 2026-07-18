-- =====================================================================
-- Billing: one row per teacher, synced from Stripe by the webhook.
-- Run in the Supabase SQL editor after schema.sql.
--
-- The 30-day free trial is derived from the user's signup date (auth.users
-- .created_at) — not stored here. This table only tracks the paid
-- subscription state that gates "Generate with Claude" after the trial.
-- =====================================================================

create table if not exists public.billing (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text unique,
  status             text not null default 'none', -- none | active | trialing | past_due | canceled | incomplete
  current_period_end timestamptz,
  updated_at         timestamptz not null default now()
);

alter table public.billing enable row level security;

-- A teacher can read their own billing row. All writes happen server-side
-- with the service-role key (checkout + Stripe webhook), so there are no
-- insert/update policies here.
drop policy if exists "billing owner select" on public.billing;
create policy "billing owner select" on public.billing
  for select using (auth.uid() = user_id);
