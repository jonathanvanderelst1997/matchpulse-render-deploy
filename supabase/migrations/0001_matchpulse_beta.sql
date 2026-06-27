create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  full_name text,
  age int check (age >= 18 and age <= 100),
  role text,
  city text,
  email text,
  photo_url text,
  orientation text not null default 'Straight' check (orientation in ('Straight', 'Gay', 'Queer')),
  looking_for text not null default 'Serious' check (looking_for in ('Serious', 'Casual', 'Tonight')),
  bio text default '',
  preferences jsonb not null default '{}'::jsonb,
  invite_code text unique,
  status text not null default 'Online now',
  profile_completion int not null default 0 check (profile_completion between 0 and 100),
  onboarded boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note text not null,
  source text not null default 'profile_tool',
  visibility text not null default 'match_ai'
    check (visibility in ('private', 'match_ai', 'shareable', 'profile', 'never')),
  updated_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.profile_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  is_primary boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.linked_tools (
  user_id uuid not null references auth.users(id) on delete cascade,
  tool_id text not null,
  label text not null,
  detail text,
  connected boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, tool_id)
);

create table if not exists public.privacy_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  memory_learning boolean not null default true,
  attention_learning boolean not null default true,
  weekly_briefing boolean not null default true,
  fuzzy_location boolean not null default true,
  online_status boolean not null default true,
  updated_at timestamptz not null default now()
);

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

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  inviter_id uuid references auth.users(id) on delete set null,
  accepted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) <= 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.date_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  match_user_id uuid references auth.users(id) on delete set null,
  match_name text not null,
  place text not null,
  planned_for text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.match_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  match_user_id uuid references auth.users(id) on delete set null,
  feedback_type text not null check (feedback_type in ('stronger', 'weaker', 'met', 'general')),
  note text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid references auth.users(id) on delete set null,
  reason text not null,
  notes text default '',
  status text not null default 'queued_for_review',
  created_at timestamptz not null default now()
);

create table if not exists public.briefings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  body text not null,
  mode text not null default 'local-preview',
  top_matches jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.consent_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  memory_id uuid,
  visibility text check (visibility in ('private', 'match_ai', 'shareable', 'profile', 'never')),
  scope jsonb not null default '[]'::jsonb,
  provider text,
  created_at timestamptz not null default now()
);

create index if not exists profiles_invite_code_idx on public.profiles (invite_code);
create index if not exists profiles_match_scan_idx on public.profiles (onboarded, looking_for, deleted_at);
create index if not exists memories_user_created_idx on public.memories (user_id, created_at desc);
create index if not exists attention_signals_user_updated_idx on public.attention_signals (user_id, updated_at desc);
create index if not exists profile_photos_user_sort_idx on public.profile_photos (user_id, sort_order, created_at desc);
create index if not exists invites_code_idx on public.invites (code);
create index if not exists invites_inviter_id_idx on public.invites (inviter_id);
create index if not exists invites_accepted_by_idx on public.invites (accepted_by);
create index if not exists messages_sender_created_idx on public.messages (sender_id, created_at desc);
create index if not exists messages_recipient_created_idx on public.messages (recipient_id, created_at desc);
create index if not exists date_plans_user_created_idx on public.date_plans (user_id, created_at desc);
create index if not exists date_plans_match_user_id_idx on public.date_plans (match_user_id);
create index if not exists match_feedback_user_created_idx on public.match_feedback (user_id, created_at desc);
create index if not exists match_feedback_match_user_id_idx on public.match_feedback (match_user_id);
create index if not exists blocks_blocked_id_idx on public.blocks (blocked_id);
create index if not exists reports_reporter_created_idx on public.reports (reporter_id, created_at desc);
create index if not exists reports_reported_user_id_idx on public.reports (reported_user_id);
create index if not exists briefings_user_created_idx on public.briefings (user_id, created_at desc);
create index if not exists consent_events_user_created_idx on public.consent_events (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.memories enable row level security;
alter table public.profile_photos enable row level security;
alter table public.linked_tools enable row level security;
alter table public.privacy_settings enable row level security;
alter table public.attention_signals enable row level security;
alter table public.invites enable row level security;
alter table public.messages enable row level security;
alter table public.date_plans enable row level security;
alter table public.match_feedback enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.briefings enable row level security;
alter table public.consent_events enable row level security;

alter table public.profiles force row level security;
alter table public.memories force row level security;
alter table public.profile_photos force row level security;
alter table public.linked_tools force row level security;
alter table public.privacy_settings force row level security;
alter table public.attention_signals force row level security;
alter table public.invites force row level security;
alter table public.messages force row level security;
alter table public.date_plans force row level security;
alter table public.match_feedback force row level security;
alter table public.blocks force row level security;
alter table public.reports force row level security;
alter table public.briefings force row level security;
alter table public.consent_events force row level security;

create policy profiles_read_authenticated on public.profiles
  for select to authenticated
  using ((deleted_at is null and onboarded = true) or (user_id = (select auth.uid())));

create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy memories_own on public.memories
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy profile_photos_own on public.profile_photos
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy linked_tools_own on public.linked_tools
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy privacy_settings_own on public.privacy_settings
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy attention_signals_own on public.attention_signals
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy invites_read_by_code_or_owner on public.invites
  for select to authenticated
  using (inviter_id = (select auth.uid()) or accepted_by = (select auth.uid()));

create policy invites_insert_own on public.invites
  for insert to authenticated
  with check (inviter_id = (select auth.uid()) or accepted_by = (select auth.uid()));

create policy messages_read_thread on public.messages
  for select to authenticated
  using (sender_id = (select auth.uid()) or recipient_id = (select auth.uid()));

create policy messages_insert_sender on public.messages
  for insert to authenticated
  with check (sender_id = (select auth.uid()));

create policy date_plans_own on public.date_plans
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy match_feedback_own on public.match_feedback
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy blocks_own on public.blocks
  for all to authenticated
  using ((select auth.uid()) = blocker_id)
  with check ((select auth.uid()) = blocker_id);

create policy reports_own on public.reports
  for all to authenticated
  using ((select auth.uid()) = reporter_id)
  with check ((select auth.uid()) = reporter_id);

create policy briefings_own on public.briefings
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy consent_events_own on public.consent_events
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy consent_events_insert_own on public.consent_events
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

create policy profile_photos_public_read on storage.objects
  for select
  using (bucket_id = 'profile-photos');

create policy profile_photos_own_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy profile_photos_own_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy profile_photos_own_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
