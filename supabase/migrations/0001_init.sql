-- Schema iniziale: profili, disegni, eventi di generazione (per le quote).
-- Applicare con: supabase db push  (oppure incollare nel SQL Editor di Supabase)

-- ── Profili utente ──────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  plan text not null default 'free' check (plan in ('free', 'premium')),
  stripe_customer_id text unique,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: lettura propria"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: aggiornamento proprio (non del piano)"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Il piano e i campi Stripe vengono modificati solo dal server (service role,
-- che bypassa la RLS). Un trigger impedisce all'utente di auto-promuoversi.
create or replace function public.prevent_plan_self_update()
returns trigger
language plpgsql
security definer
as $$
begin
  if auth.uid() is not null and (
    new.plan is distinct from old.plan
    or new.stripe_customer_id is distinct from old.stripe_customer_id
    or new.stripe_subscription_id is distinct from old.stripe_subscription_id
  ) then
    raise exception 'campo riservato';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_protect_plan
  before update on public.profiles
  for each row execute function public.prevent_plan_self_update();

-- Crea automaticamente il profilo alla registrazione.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Eventi di generazione (sorgente di verità per le quote giornaliere) ─
-- Righe inserite SOLO dal server (service role). Cancellare un disegno
-- non restituisce quota.
create table public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null,
  prompt text not null,
  created_at timestamptz not null default now()
);

create index generations_user_day_idx on public.generations (user_id, created_at);

alter table public.generations enable row level security;

create policy "generations: lettura propria"
  on public.generations for select
  using (auth.uid() = user_id);
-- Nessuna policy di insert/update/delete: scrive solo il service role.

-- ── Disegni ─────────────────────────────────────────────────────────────
create table public.drawings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  prompt text not null,
  provider text not null,
  -- Contenuto SVG sanificato lato server (kind = 'svg'),
  -- oppure PNG base64 per provider raster futuri (kind = 'raster').
  kind text not null default 'svg' check (kind in ('svg', 'raster')),
  content text not null,
  -- Colori applicati dal bambino: mappa indice-regione → colore esadecimale.
  fills jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index drawings_user_idx on public.drawings (user_id, created_at desc);

alter table public.drawings enable row level security;

create policy "drawings: lettura propria"
  on public.drawings for select
  using (auth.uid() = user_id);

create policy "drawings: aggiornamento proprio"
  on public.drawings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "drawings: cancellazione propria"
  on public.drawings for delete
  using (auth.uid() = user_id);
-- Nessuna policy di insert: i disegni vengono creati solo dal server
-- dopo il controllo quota.
