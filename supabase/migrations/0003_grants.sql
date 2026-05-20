-- Grant full CRUD privileges on app tables to service_role.
-- On some Supabase projects, default privileges do not auto-grant
-- non-SELECT to service_role for newly-created tables. Server Actions
-- use the service-role key for mutations (after validating trip_id in
-- the action layer — see Task 13).
--
-- service_role still bypasses RLS by virtue of its BYPASSRLS attribute,
-- so the anon SELECT-only RLS policies from 0002 remain the access
-- gate for the anon role.

grant all on table public.trips        to service_role;
grant all on table public.participants to service_role;
grant all on table public.items        to service_role;
grant all on table public.claims       to service_role;
grant all on table public.comments     to service_role;
