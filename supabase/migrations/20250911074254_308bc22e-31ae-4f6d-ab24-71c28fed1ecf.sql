-- Enable uuid-ossp extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Leads table ---------------------------------------------------------------
create table if not exists public.leads (
  id                 uuid primary key default uuid_generate_v4(),
  created_at         timestamptz        default now(),
  date               date,
  name               text,
  phone              text,
  email              text,
  source             text,           -- Instagram / Website / Referral …
  referrer_name      text,
  status             text check (status in (
                       'Closed – Meetings started',
                       'No',
                       'Pending'
                     )),
  content_type       text,
  first_meeting      date,
  second_meeting     date,
  first_call_summary  text,
  second_call_summary text,
  quoted_price       text,
  notes              text,
  updated_at         timestamptz        default now(),
  updated_by         uuid references auth.users(id)
);

-- Performance indexes -------------------------------------------------------
create index if not exists leads_status_idx  on public.leads(status);
create index if not exists leads_date_idx    on public.leads(date);
create index if not exists leads_updated_idx on public.leads(updated_at desc);

-- Row-Level Security (admins only) ------------------------------------------
alter table public.leads enable row level security;

create policy "Admins read/write leads"
  on public.leads
  for all
  using (auth.role() = 'admin');