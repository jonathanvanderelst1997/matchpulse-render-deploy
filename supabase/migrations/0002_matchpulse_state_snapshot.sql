create table if not exists public.matchpulse_app_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.matchpulse_app_state enable row level security;
alter table public.matchpulse_app_state force row level security;

-- The app server reads and writes this table with the Supabase service-role key.
-- No client-side policy is added on purpose; browser clients should use the API.
