-- ═══════════════════════════════════════
-- Alvin's Diet & Workout Journey — Schema
-- ═══════════════════════════════════════

-- Profiles (one per user)
create table public.profiles (
  id                  uuid references auth.users(id) on delete cascade primary key,
  email               text not null,
  full_name           text not null,
  date_of_birth       date,
  gender              text,
  height_cm           numeric(5,1),
  timezone            text not null default 'Asia/Jakarta',
  activity_level      text not null default 'moderate',
  primary_goal        text not null default 'lose_fat',
  target_weight_kg    numeric(5,1),
  weekly_target       text,
  calorie_target      integer not null default 2200,
  protein_target      integer not null default 160,
  carb_target         integer not null default 220,
  fat_target          integer not null default 73,
  water_target_cups   integer not null default 10,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Body scans (SK-X90 data)
create table public.body_scans (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references public.profiles(id) on delete cascade not null,
  scan_date           date not null,
  weight_kg           numeric(5,1) not null,
  body_fat_pct        numeric(4,1),
  muscle_kg           numeric(5,1),
  visceral_fat_grade  integer,
  health_score        integer,
  bmr                 numeric(7,1),
  bmi                 numeric(4,1),
  notes               text,
  created_at          timestamptz not null default now()
);

-- Progress photos (front/back/left/right)
create table public.progress_photos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.profiles(id) on delete cascade not null,
  scan_id       uuid references public.body_scans(id) on delete set null,
  photo_date    date not null,
  angle         text not null, -- 'front' | 'back' | 'left' | 'right'
  storage_path  text not null,
  created_at    timestamptz not null default now()
);

-- Workout sessions (one per day)
create table public.workout_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.profiles(id) on delete cascade not null,
  session_date  date not null,
  notes         text,
  created_at    timestamptz not null default now(),
  unique(user_id, session_date)
);

-- Exercises (strength or cardio, linked to session)
create table public.exercises (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid references public.workout_sessions(id) on delete cascade not null,
  user_id         uuid references public.profiles(id) on delete cascade not null,
  type            text not null check (type in ('strength','cardio')),
  name            text not null,
  category        text not null,
  muscle_groups   text[] not null default '{}',
  -- strength fields
  sets            integer,
  reps            integer,
  weight_kg       numeric(6,2),
  rest_seconds    integer,
  -- cardio fields
  duration_min    integer,
  distance_km     numeric(6,2),
  speed_kmh       numeric(4,1),
  incline_pct     numeric(4,1),
  intensity       text,
  notes           text,
  is_done         boolean not null default false,
  created_at      timestamptz not null default now()
);

-- Meal logs (individual food entries)
create table public.meal_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade not null,
  log_date    date not null,
  meal_type   text not null check (meal_type in ('breakfast','snack_am','lunch','snack_pm','dinner')),
  food_name   text not null,
  calories    integer not null default 0,
  protein_g   numeric(6,1) not null default 0,
  carbs_g     numeric(6,1) not null default 0,
  fat_g       numeric(6,1) not null default 0,
  notes       text,
  created_at  timestamptz not null default now()
);

-- Meal photos (food journal proof)
create table public.meal_photos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.profiles(id) on delete cascade not null,
  log_date      date not null,
  meal_type     text not null,
  storage_path  text not null,
  created_at    timestamptz not null default now()
);

-- Water logs (one row per user per day)
create table public.water_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.profiles(id) on delete cascade not null,
  log_date        date not null,
  cups_consumed   integer not null default 0,
  cup_size_ml     integer not null default 250,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(user_id, log_date)
);

-- ═══════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════
alter table public.profiles        enable row level security;
alter table public.body_scans      enable row level security;
alter table public.progress_photos enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.exercises       enable row level security;
alter table public.meal_logs       enable row level security;
alter table public.meal_photos     enable row level security;
alter table public.water_logs      enable row level security;

-- Profiles: users only see/edit their own
create policy "profiles_own" on public.profiles for all using (auth.uid() = id);

-- All other tables: user_id = auth.uid()
create policy "body_scans_own"       on public.body_scans       for all using (auth.uid() = user_id);
create policy "progress_photos_own"  on public.progress_photos  for all using (auth.uid() = user_id);
create policy "workout_sessions_own" on public.workout_sessions  for all using (auth.uid() = user_id);
create policy "exercises_own"        on public.exercises         for all using (auth.uid() = user_id);
create policy "meal_logs_own"        on public.meal_logs         for all using (auth.uid() = user_id);
create policy "meal_photos_own"      on public.meal_photos       for all using (auth.uid() = user_id);
create policy "water_logs_own"       on public.water_logs        for all using (auth.uid() = user_id);

-- ═══════════════════════════════════════
-- Auto-create profile on signup
-- ═══════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ═══════════════════════════════════════
-- Storage buckets
-- ═══════════════════════════════════════
insert into storage.buckets (id, name, public) values ('meal-photos', 'meal-photos', false);
insert into storage.buckets (id, name, public) values ('progress-photos', 'progress-photos', false);

create policy "meal_photos_user" on storage.objects for all
  using (bucket_id = 'meal-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "progress_photos_user" on storage.objects for all
  using (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- ═══════════════════════════════════════
-- Seed: Alvin's baseline (optional)
-- Run manually after creating your account
-- ═══════════════════════════════════════
-- insert into public.body_scans (user_id, scan_date, weight_kg, body_fat_pct, muscle_kg,
--   visceral_fat_grade, health_score, bmr, bmi)
-- values (
--   auth.uid(), '2026-05-02', 104.8, 41.3, 34.5, 21, 54, 1696.3, 35.8
-- );
