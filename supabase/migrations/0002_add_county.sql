-- Run this once in the Supabase SQL Editor (Dashboard > SQL Editor > New query)

alter table links add column if not exists county text;
