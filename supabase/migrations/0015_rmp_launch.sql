-- Run this once in the Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- RMP Launch: training topics, subtopics, and reference materials

create table if not exists rmp_topics (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function enforce_rmp_topics_limit()
returns trigger as $$
begin
  if (select count(*) from rmp_topics) >= 20 then
    raise exception 'RMP Launch supports a maximum of 20 topics.';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger rmp_topics_limit
  before insert on rmp_topics
  for each row
  execute function enforce_rmp_topics_limit();

alter table rmp_topics enable row level security;

create policy "public can read rmp_topics"
  on rmp_topics for select
  using (true);

create policy "authenticated can insert rmp_topics"
  on rmp_topics for insert
  to authenticated
  with check (true);

create policy "authenticated can update rmp_topics"
  on rmp_topics for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated can delete rmp_topics"
  on rmp_topics for delete
  to authenticated
  using (true);

create trigger rmp_topics_set_updated_at
  before update on rmp_topics
  for each row
  execute function set_updated_at();

create table if not exists rmp_subtopics (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references rmp_topics(id) on delete cascade,
  name text not null,
  notes text,
  done boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rmp_subtopics_topic_idx on rmp_subtopics (topic_id);

create or replace function enforce_rmp_subtopics_limit()
returns trigger as $$
begin
  if (select count(*) from rmp_subtopics where topic_id = new.topic_id) >= 10 then
    raise exception 'Each RMP Launch topic supports a maximum of 10 subtopics.';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger rmp_subtopics_limit
  before insert on rmp_subtopics
  for each row
  execute function enforce_rmp_subtopics_limit();

alter table rmp_subtopics enable row level security;

create policy "public can read rmp_subtopics"
  on rmp_subtopics for select
  using (true);

create policy "authenticated can insert rmp_subtopics"
  on rmp_subtopics for insert
  to authenticated
  with check (true);

create policy "authenticated can update rmp_subtopics"
  on rmp_subtopics for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated can delete rmp_subtopics"
  on rmp_subtopics for delete
  to authenticated
  using (true);

create trigger rmp_subtopics_set_updated_at
  before update on rmp_subtopics
  for each row
  execute function set_updated_at();

create table if not exists rmp_materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  file_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function enforce_rmp_materials_limit()
returns trigger as $$
begin
  if (select count(*) from rmp_materials) >= 2 then
    raise exception 'RMP Launch supports a maximum of 2 uploaded materials.';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger rmp_materials_limit
  before insert on rmp_materials
  for each row
  execute function enforce_rmp_materials_limit();

alter table rmp_materials enable row level security;

create policy "public can read rmp_materials"
  on rmp_materials for select
  using (true);

create policy "authenticated can insert rmp_materials"
  on rmp_materials for insert
  to authenticated
  with check (true);

create policy "authenticated can update rmp_materials"
  on rmp_materials for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated can delete rmp_materials"
  on rmp_materials for delete
  to authenticated
  using (true);

create trigger rmp_materials_set_updated_at
  before update on rmp_materials
  for each row
  execute function set_updated_at();

-- Storage bucket for the uploaded PDFs (public read, authenticated write).
insert into storage.buckets (id, name, public)
values ('rmp-materials', 'rmp-materials', true)
on conflict (id) do nothing;

create policy "public can read rmp-materials files"
  on storage.objects for select
  using (bucket_id = 'rmp-materials');

create policy "authenticated can upload rmp-materials files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'rmp-materials');

create policy "authenticated can delete rmp-materials files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'rmp-materials');
