-- Run this once in the Supabase SQL Editor (Dashboard > SQL Editor > New query)

create table if not exists tracker_settings (
  id uuid primary key default '00000000-0000-0000-0000-000000000001',
  title text not null default 'CSSC Return Mail Tracker',
  updated_at timestamptz not null default now()
);

insert into tracker_settings (id, title)
values ('00000000-0000-0000-0000-000000000001', 'CSSC Return Mail Tracker')
on conflict (id) do nothing;

alter table tracker_settings enable row level security;

create policy "public can read tracker_settings"
  on tracker_settings for select
  using (true);

create policy "authenticated can update tracker_settings"
  on tracker_settings for update
  to authenticated
  using (true)
  with check (true);

create trigger tracker_settings_set_updated_at
  before update on tracker_settings
  for each row
  execute function set_updated_at();
