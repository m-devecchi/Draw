-- Mano libera e fasce d'età. Eseguire DOPO 0003_parent_gate.sql.

-- Tratti a mano libera disegnati sopra il disegno.
-- Formato: [{ "d": "M 10 10 L ...", "c": "#ff5c5c", "w": 8 }, ...]
alter table public.drawings
  add column strokes jsonb not null default '[]'::jsonb;

-- Fascia d'età del bambino: adatta strumenti, colori ed effetti.
--   small  = 2-3 anni  · pochi colori grandi, nessun effetto, niente zoom
--   medium = 4-6 anni  · palette completa, effetti base
--   big    = 7+ anni   · tutti gli effetti e la mano libera
alter table public.kid_profiles
  add column age_band text not null default 'medium'
    check (age_band in ('small', 'medium', 'big'));
