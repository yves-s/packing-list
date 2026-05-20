-- Tighten anon access to participants — never expose session_token via REST or Realtime.
revoke all on table public.participants from anon;
grant select (id, trip_id, name, avatar_emoji, joined_at) on table public.participants to anon;

-- Drop participants from realtime publication so session_token never broadcasts.
-- The UI already refreshes via items/claims/comments triggers; new participants
-- become visible on the next subsequent refresh.
alter publication supabase_realtime drop table participants;
