alter table public.memories
  add column if not exists visibility text not null default 'match_ai'
    check (visibility in ('private', 'match_ai', 'shareable', 'profile', 'never')),
  add column if not exists updated_at timestamptz;

alter table public.consent_events
  add column if not exists memory_id uuid,
  add column if not exists visibility text
    check (visibility in ('private', 'match_ai', 'shareable', 'profile', 'never'));
