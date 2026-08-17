-- Run this once in the Supabase SQL Editor (Dashboard > SQL Editor > New query)

create table if not exists note_templates (
  id uuid primary key default gen_random_uuid(),
  collection text not null,
  section text,
  title text not null,
  body text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists note_templates_collection_idx on note_templates (collection, sort_order);

alter table note_templates enable row level security;

create policy "public can read note_templates"
  on note_templates for select
  using (true);

create policy "authenticated can insert note_templates"
  on note_templates for insert
  to authenticated
  with check (true);

create policy "authenticated can update note_templates"
  on note_templates for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated can delete note_templates"
  on note_templates for delete
  to authenticated
  using (true);

create trigger note_templates_set_updated_at
  before update on note_templates
  for each row
  execute function set_updated_at();
