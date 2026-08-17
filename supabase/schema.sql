-- Run this once in the Supabase SQL Editor (Dashboard > SQL Editor > New query)

create extension if not exists pg_trgm;

create table if not exists links (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  county text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists links_title_trgm_idx on links using gin (title gin_trgm_ops);

alter table links enable row level security;

create policy "public can read links"
  on links for select
  using (true);

create policy "authenticated can insert links"
  on links for insert
  to authenticated
  with check (true);

create policy "authenticated can update links"
  on links for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated can delete links"
  on links for delete
  to authenticated
  using (true);

-- Keep updated_at current on every edit
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger links_set_updated_at
  before update on links
  for each row
  execute function set_updated_at();
