-- =====================================================================
-- Storage bucket for uploaded activity HTML.
-- Run in the Supabase SQL editor after schema.sql.
--
-- The bucket is PUBLIC-READ on purpose: the player embeds the HTML in an
-- iframe by its public URL, and serving it from the storage origin (a
-- different origin than the app) is what sandboxes student code away from
-- the teacher's app session.
--
-- Uploads are done server-side with the service-role key, so we do NOT add
-- public write policies.
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('activities', 'activities', true)
on conflict (id) do update set public = true;
