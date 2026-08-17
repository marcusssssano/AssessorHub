-- Run this once in the Supabase SQL Editor (Dashboard > SQL Editor > New query)

alter table note_templates add column if not exists is_favorite boolean not null default false;
