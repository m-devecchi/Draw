-- Riuso dei disegni già generati.
--
-- Un disegno da colorare non è personale: se qualcuno chiede un soggetto
-- già disegnato (stessa richiesta normalizzata, stessa fascia d'età) si
-- riusa quello, senza chiamare il modello. Il costo smette di crescere
-- col numero di utenti e cresce solo col numero di soggetti diversi.
--
-- Eseguire DOPO 0005_drawing_age.sql.

create table public.drawing_templates (
  id uuid primary key default gen_random_uuid(),
  -- Richiesta normalizzata (vedi src/lib/prompt-key.ts).
  prompt_key text not null,
  -- Richiesta originale, utile per capire cosa chiede la gente.
  prompt text not null,
  age_band text not null check (age_band in ('small', 'medium', 'big')),
  provider text not null,
  kind text not null default 'svg' check (kind in ('svg', 'raster')),
  content text not null,
  -- Quante volte è stato riusato: misura quanto la cache sta funzionando.
  uses integer not null default 0,
  created_at timestamptz not null default now()
);

create index drawing_templates_lookup_idx
  on public.drawing_templates (prompt_key, age_band);

-- Solo il server (service role) legge e scrive: nessuna policy.
alter table public.drawing_templates enable row level security;

-- Da quale disegno originale nasce una copia (per non riproporre due
-- volte lo stesso identico foglio alla stessa persona).
alter table public.drawings
  add column template_id uuid references public.drawing_templates (id)
    on delete set null;

create index drawings_template_idx on public.drawings (user_id, template_id);

-- Per sapere quante generazioni hanno davvero chiamato il modello.
alter table public.generations
  add column cached boolean not null default false;

-- Incrementa il contatore di riusi in modo atomico.
create or replace function public.bump_template_uses(template uuid)
returns void
language sql
security definer
as $$
  update public.drawing_templates set uses = uses + 1 where id = template;
$$;
