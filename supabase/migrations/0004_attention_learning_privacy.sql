alter table public.privacy_settings
  add column if not exists attention_learning boolean not null default true;

create table if not exists public.attention_signals (
  user_id uuid not null references auth.users(id) on delete cascade,
  signal_id text not null,
  match_profile_id text,
  match_name text,
  style text not null default '',
  label text not null,
  body text not null,
  signal_count int not null default 1 check (signal_count between 1 and 99),
  seconds int not null default 0 check (seconds between 0 and 999),
  visibility text not null default 'private_algorithm_only'
    check (visibility = 'private_algorithm_only'),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (user_id, signal_id)
);

create index if not exists attention_signals_user_updated_idx
  on public.attention_signals (user_id, updated_at desc);

alter table public.attention_signals enable row level security;
alter table public.attention_signals force row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'attention_signals'
      and policyname = 'attention_signals_own'
  ) then
    create policy attention_signals_own on public.attention_signals
      for all to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
  end if;
end $$;
