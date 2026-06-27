alter table public.profiles
  add column if not exists gender_identity text not null default 'Not shown'
    check (gender_identity in ('Not shown', 'Man', 'Woman', 'Non-binary', 'Trans man', 'Trans woman', 'Another identity')),
  add column if not exists interested_in text not null default 'Everyone'
    check (interested_in in ('Men', 'Women', 'Men & women', 'Everyone')),
  add column if not exists photo_privacy text not null default 'public'
    check (photo_privacy in ('public', 'blurred', 'private')),
  add column if not exists language text not null default 'English',
  add column if not exists phone text,
  add column if not exists plan text not null default 'Beta',
  add column if not exists attraction_dna jsonb not null default '{}'::jsonb,
  add column if not exists visibility_flags jsonb not null default '{}'::jsonb,
  add column if not exists last_active_at timestamptz;

alter table public.profile_photos
  add column if not exists privacy text not null default 'public'
    check (privacy in ('public', 'blurred', 'private')),
  add column if not exists consent_required boolean not null default false,
  add column if not exists active_from_chat boolean not null default false;

alter table public.messages
  add column if not exists status text not null default 'request'
    check (status in ('request', 'accepted')),
  add column if not exists request_type text not null default 'message'
    check (request_type in ('message', 'photo')),
  add column if not exists accepted_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.match_scores (
  user_id uuid not null references auth.users(id) on delete cascade,
  match_user_id uuid not null references auth.users(id) on delete cascade,
  score int not null check (score between 0 and 100),
  values_score int not null default 0 check (values_score between 0 and 100),
  attraction_score int not null default 0 check (attraction_score between 0 and 100),
  lifestyle_score int not null default 0 check (lifestyle_score between 0 and 100),
  intent_score int not null default 0 check (intent_score between 0 and 100),
  uncertainty_score int not null default 0 check (uncertainty_score between 0 and 100),
  shared_neurons jsonb not null default '[]'::jsonb,
  private_reasons jsonb not null default '[]'::jsonb,
  public_summary text not null default '',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (user_id, match_user_id),
  check (user_id <> match_user_id)
);

create table if not exists public.profile_visibility_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_user_id uuid references auth.users(id) on delete cascade,
  scope text not null check (scope in ('photo', 'memory', 'profile_field', 'attention_signal')),
  visibility text not null check (visibility in ('private', 'match_ai', 'shareable', 'profile', 'never')),
  allowed boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.tester_feedback (
  id uuid primary key default gen_random_uuid(),
  client_id text,
  user_id uuid references auth.users(id) on delete set null,
  surface text not null default 'app',
  rating int check (rating between 1 and 5),
  issue_type text not null default 'general'
    check (issue_type in ('general', 'confusing', 'visual', 'bug', 'privacy', 'match_quality', 'performance')),
  body text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.tester_feedback
  add column if not exists client_id text,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists profiles_reciprocal_matching_idx
  on public.profiles (onboarded, deleted_at, gender_identity, interested_in, photo_privacy);

create index if not exists profiles_last_active_idx
  on public.profiles (last_active_at desc)
  where deleted_at is null and onboarded = true;

create index if not exists profile_photos_user_primary_idx
  on public.profile_photos (user_id, is_primary desc, sort_order, created_at desc);

create index if not exists messages_thread_status_idx
  on public.messages (sender_id, recipient_id, status, created_at desc);

create index if not exists messages_recipient_request_idx
  on public.messages (recipient_id, status, created_at desc)
  where status = 'request';

create index if not exists match_scores_user_score_idx
  on public.match_scores (user_id, score desc, updated_at desc);

create index if not exists match_scores_match_user_idx
  on public.match_scores (match_user_id, updated_at desc);

create index if not exists profile_visibility_consents_user_scope_idx
  on public.profile_visibility_consents (user_id, scope, updated_at desc);

create index if not exists tester_feedback_user_created_idx
  on public.tester_feedback (user_id, created_at desc);

create unique index if not exists tester_feedback_user_client_id_idx
  on public.tester_feedback (user_id, client_id)
  where client_id is not null and client_id <> '';

alter table public.match_scores enable row level security;
alter table public.profile_visibility_consents enable row level security;
alter table public.tester_feedback enable row level security;

alter table public.match_scores force row level security;
alter table public.profile_visibility_consents force row level security;
alter table public.tester_feedback force row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'match_scores'
      and policyname = 'match_scores_own'
  ) then
    create policy match_scores_own on public.match_scores
      for all to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profile_visibility_consents'
      and policyname = 'profile_visibility_consents_own'
  ) then
    create policy profile_visibility_consents_own on public.profile_visibility_consents
      for all to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'tester_feedback'
      and policyname = 'tester_feedback_own'
  ) then
    create policy tester_feedback_own on public.tester_feedback
      for all to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
  end if;
end $$;
