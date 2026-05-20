-- RLS posture (revised): anon SELECT-only on trip-scoped tables; writes go
-- through Server Actions using the service-role key, which bypasses RLS.
-- See docs/superpowers/plans/2026-05-20-camping-packing-app.md, Task 10.

alter table trips         enable row level security;
alter table participants  enable row level security;
alter table items         enable row level security;
alter table claims        enable row level security;
alter table comments      enable row level security;

create policy anon_select_trips        on trips        for select to anon using (true);
create policy anon_select_participants on participants for select to anon using (true);
create policy anon_select_items        on items        for select to anon using (true);
create policy anon_select_claims       on claims       for select to anon using (true);
create policy anon_select_comments     on comments     for select to anon using (true);

-- Realtime publication
alter publication supabase_realtime add table items;
alter publication supabase_realtime add table claims;
alter publication supabase_realtime add table comments;
alter publication supabase_realtime add table participants;
