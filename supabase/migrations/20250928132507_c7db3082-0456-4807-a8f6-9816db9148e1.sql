-- Create the "speaker_leads" table for Ruth Frissman
create table public.speaker_leads (
  id               bigserial primary key,
  full_name        text      not null,
  inquiry_title    text      not null,
  email            text      not null,
  phone            text      not null,
  message          text,
  date_option_1    date,
  date_option_2    date,
  date_option_3    date,
  group_type       text check (group_type in ('organization','private')),
  format           text check (format in ('zoom','in_person')),
  source           text,
  status           text not null default 'new'
                 check (status in ('new','contacted','closed')),
  consent_privacy  boolean   not null default false,
  created_at       timestamptz not null default now()
);

-- Enable Row-Level Security
alter table public.speaker_leads enable row level security;

-- Policy: only authenticated (admin) users may read/write
create policy "Admins manage speaker leads"
  on public.speaker_leads
  for all
  to authenticated
  using ( true )
  with check ( true );