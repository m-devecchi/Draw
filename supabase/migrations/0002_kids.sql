-- Profili bambino sotto l'account genitore: ogni disegno può essere
-- associato a un bambino. Eseguire nel SQL Editor di Supabase (o con
-- supabase db push) DOPO 0001_init.sql.

create table public.kid_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 30),
  avatar text not null default '🦁' check (char_length(avatar) <= 8),
  created_at timestamptz not null default now()
);

create index kid_profiles_user_idx on public.kid_profiles (user_id);

alter table public.kid_profiles enable row level security;

create policy "kid_profiles: lettura propria"
  on public.kid_profiles for select
  using (auth.uid() = user_id);

create policy "kid_profiles: creazione propria"
  on public.kid_profiles for insert
  with check (auth.uid() = user_id);

create policy "kid_profiles: aggiornamento proprio"
  on public.kid_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "kid_profiles: cancellazione propria"
  on public.kid_profiles for delete
  using (auth.uid() = user_id);

-- Associazione disegno → bambino (facoltativa; se il profilo viene
-- eliminato il disegno resta, senza associazione).
alter table public.drawings
  add column kid_id uuid references public.kid_profiles (id) on delete set null;

create index drawings_kid_idx on public.drawings (kid_id);
