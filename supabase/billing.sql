-- =====================================================================
-- Billing: one row per teacher, synced from Stripe by the webhook.
-- Run in the Supabase SQL editor after schema.sql.
--
-- The free trial is usage-based (a fixed number of AI generations); the count
-- is tracked in trial_generations_used below. This table also tracks the paid
-- subscription state that gates "Generate with Claude" after the trial.
-- =====================================================================

create table if not exists public.billing (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text unique,
  status             text not null default 'none', -- none | active | trialing | past_due | canceled | incomplete
  current_period_end timestamptz,
  -- Usage-based free trial: count of AI generations used (incl. regenerations).
  trial_generations_used integer not null default 0,
  updated_at         timestamptz not null default now()
);

-- Safe to re-run: add the counter columns to an existing billing table.
alter table public.billing
  add column if not exists trial_generations_used integer not null default 0;
-- Fair-use monthly cap for paying subscribers (resets each calendar month).
alter table public.billing
  add column if not exists monthly_generations_used integer not null default 0;
alter table public.billing
  add column if not exists monthly_period text; -- 'YYYY-MM' (UTC) of the count above

alter table public.billing enable row level security;

-- A teacher can read their own billing row. All writes happen server-side
-- with the service-role key (checkout + Stripe webhook), so there are no
-- insert/update policies here.
drop policy if exists "billing owner select" on public.billing;
create policy "billing owner select" on public.billing
  for select using (auth.uid() = user_id);
