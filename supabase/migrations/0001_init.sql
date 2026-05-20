-- Initial schema for the camping packing app.
create extension if not exists "pgcrypto";

create table trips (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  date_from   date not null,
  date_to     date not null,
  location    text,
  join_code   text not null unique,
  created_at  timestamptz not null default now(),
  created_by  uuid
);

create table participants (
  id            uuid primary key default gen_random_uuid(),
  trip_id       uuid not null references trips(id) on delete cascade,
  name          text not null,
  avatar_emoji  text not null default '🏕️',
  joined_at     timestamptz not null default now(),
  session_token text not null unique
);

alter table trips
  add constraint trips_created_by_fk
  foreign key (created_by) references participants(id) on delete set null;

create table items (
  id              uuid primary key default gen_random_uuid(),
  trip_id         uuid not null references trips(id) on delete cascade,
  name            text not null,
  category        text not null check (category in
                    ('schlafen','kochen','essen','equipment','persoenlich','sonstiges')),
  quantity_needed int  not null default 1 check (quantity_needed >= 1),
  note            text,
  created_at      timestamptz not null default now(),
  created_by      uuid references participants(id) on delete set null
);

create table claims (
  id              uuid primary key default gen_random_uuid(),
  item_id         uuid not null references items(id) on delete cascade,
  participant_id  uuid not null references participants(id) on delete cascade,
  quantity        int  not null default 1 check (quantity >= 1),
  trip_id         uuid not null references trips(id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique (item_id, participant_id)
);

create table comments (
  id              uuid primary key default gen_random_uuid(),
  item_id         uuid not null references items(id) on delete cascade,
  participant_id  uuid references participants(id) on delete set null,
  trip_id         uuid not null references trips(id) on delete cascade,
  text            text not null,
  created_at      timestamptz not null default now()
);

create index on participants (trip_id);
create index on items        (trip_id);
create index on claims       (trip_id);
create index on comments     (trip_id);
create index on claims       (item_id);
create index on comments     (item_id);
