-- ═══════════════════════════════════════
-- New Features: Steps, Sleep, Workout Split
-- ═══════════════════════════════════════

-- Steps logs (daily step count)
create table public.steps_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.profiles(id) on delete cascade not null,
  log_date      date not null,
  steps         integer not null default 0,
  goal          integer not null default 10000,
  distance_km   numeric(5,2),
  calories_burned integer,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique(user_id, log_date)
);

-- Sleep logs (daily sleep tracking)
create table public.sleep_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.profiles(id) on delete cascade not null,
  log_date      date not null,
  bedtime       time,
  wake_time     time,
  duration_hrs  numeric(4,1),
  quality       integer check (quality between 1 and 5),
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique(user_id, log_date)
);

-- Weekly workout split planner
create table public.workout_splits (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.profiles(id) on delete cascade not null,
  day_of_week   integer not null check (day_of_week between 0 and 6), -- 0=Sun, 1=Mon...
  label         text not null default 'Rest',
  muscle_groups text[] not null default '{}',
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique(user_id, day_of_week)
);

-- RLS
alter table public.steps_logs     enable row level security;
alter table public.sleep_logs     enable row level security;
alter table public.workout_splits enable row level security;

create policy "steps_logs_own"     on public.steps_logs     for all using (auth.uid() = user_id);
create policy "sleep_logs_own"     on public.sleep_logs     for all using (auth.uid() = user_id);
create policy "workout_splits_own" on public.workout_splits for all using (auth.uid() = user_id);
