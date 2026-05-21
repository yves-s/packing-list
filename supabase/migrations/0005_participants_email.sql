-- Add email as the cross-device identity anchor for participants.
-- One email per trip → re-entering the same email means same participant,
-- enforced via case-insensitive partial unique index.

alter table public.participants
  add column if not exists email text;

-- Index participants by email for fast cross-trip recovery lookups.
create index if not exists participants_email_idx
  on public.participants (lower(email))
  where email is not null;

-- One participant per (trip, email). Case-insensitive.
create unique index if not exists participants_trip_email_unique
  on public.participants (trip_id, lower(email))
  where email is not null;

-- Allow anon to read the email-by-trip count for nicer error UX (optional;
-- kept restrictive for now — server actions handle this with service role).
