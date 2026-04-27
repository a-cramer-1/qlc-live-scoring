-- QLC Live Scoring database setup
-- Run this in Supabase Dashboard > SQL Editor.

create table if not exists public.match_scores (
  match_id text primary key,
  gross_a jsonb not null default '[]'::jsonb,
  gross_b jsonb not null default '[]'::jsonb,
  manual_a int,
  manual_b int,
  updated_at timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'match_scores'
      and column_name = 'gross_a'
      and data_type <> 'jsonb'
  ) then
    alter table public.match_scores
      alter column gross_a drop default,
      alter column gross_b drop default;

    alter table public.match_scores
      alter column gross_a type jsonb using to_jsonb(gross_a),
      alter column gross_b type jsonb using to_jsonb(gross_b);
  end if;

  alter table public.match_scores
    alter column gross_a set default '[]'::jsonb,
    alter column gross_b set default '[]'::jsonb;
end $$;

alter table public.match_scores enable row level security;

drop policy if exists "public read match scores" on public.match_scores;
create policy "public read match scores"
on public.match_scores
for select
to anon
using (true);

drop policy if exists "public insert match scores" on public.match_scores;
create policy "public insert match scores"
on public.match_scores
for insert
to anon
with check (true);

drop policy if exists "public update match scores" on public.match_scores;
create policy "public update match scores"
on public.match_scores
for update
to anon
using (true)
with check (true);

-- Enable realtime for this table.
do $$
begin
  alter publication supabase_realtime add table public.match_scores;
exception
  when duplicate_object then null;
end $$;
