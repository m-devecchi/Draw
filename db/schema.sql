-- Schema completo per Aurora PostgreSQL (Serverless v2).
-- Sostituisce le vecchie migrazioni di Supabase: niente RLS, niente
-- trigger, niente auth.users. L'isolamento tra utenti e' garantito dal
-- livello dati (src/lib/db/repo.ts), che filtra sempre per user_id.
-- Ogni istruzione termina con ";" a fine riga: lo script di
-- infra/aws/apply-schema.mjs le esegue una alla volta (Data API).
-- Idempotente: si puo' rieseguire senza danni.

-- id = "sub" dell'utente su Cognito.
create table if not exists profiles (
  id uuid primary key,
  email text,
  display_name text,
  plan text not null default 'free' check (plan in ('free', 'premium')),
  stripe_customer_id text unique,
  stripe_subscription_id text,
  -- Hash scrypt del PIN genitore (mai il PIN in chiaro).
  parent_pin_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Profili bambino sotto l'account genitore.
create table if not exists kid_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 30),
  avatar text not null default '🦁' check (char_length(avatar) <= 8),
  age_band text not null default 'medium'
    check (age_band in ('small', 'medium', 'big')),
  created_at timestamptz not null default now()
);

create index if not exists kid_profiles_user_idx on kid_profiles (user_id);

-- Disegni gia' generati e riutilizzabili da chiunque chieda lo stesso
-- soggetto (stessa richiesta normalizzata, stessa fascia d'eta').
create table if not exists drawing_templates (
  id uuid primary key default gen_random_uuid(),
  prompt_key text not null,
  prompt text not null,
  age_band text not null check (age_band in ('small', 'medium', 'big')),
  provider text not null,
  kind text not null default 'svg' check (kind in ('svg', 'raster')),
  content text not null,
  uses integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists drawing_templates_lookup_idx
  on drawing_templates (prompt_key, age_band);

-- Disegni dell'utente.
create table if not exists drawings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  kid_id uuid references kid_profiles (id) on delete set null,
  template_id uuid references drawing_templates (id) on delete set null,
  prompt text not null,
  provider text not null,
  kind text not null default 'svg' check (kind in ('svg', 'raster')),
  content text not null,
  fills jsonb not null default '{}'::jsonb,
  strokes jsonb not null default '[]'::jsonb,
  age_band text not null default 'big'
    check (age_band in ('small', 'medium', 'big')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists drawings_user_idx on drawings (user_id, created_at desc);
create index if not exists drawings_kid_idx on drawings (kid_id);
create index if not exists drawings_template_idx on drawings (user_id, template_id);
create index if not exists drawings_template_id_idx on drawings (template_id);

-- Eventi di generazione: sorgente di verita' per le quote giornaliere.
-- Cancellare un disegno non restituisce quota.
create table if not exists generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  provider text not null,
  prompt text not null,
  cached boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists generations_user_day_idx
  on generations (user_id, created_at);
