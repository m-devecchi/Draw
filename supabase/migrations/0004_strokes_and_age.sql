-- Mano libera e fasce d'età. Eseguire DOPO 0003_parent_gate.sql.

-- Tratti a mano libera disegnati sopra il disegno.
-- Formato: [{ "d": "M 10 10 L ...", "c": "#ff5c5c", "w": 8 }, ...]
alter table public.drawings
  add column strokes jsonb not null default '[]'::jsonb;

-- Fascia d'età (colonna riservata).
-- L'età di chi disegna è una scelta del genitore valida per il
-- dispositivo (cookie `colora_age`), non legata al profilo bambino:
-- la maggior parte delle famiglie non crea profili e l'esperienza
-- giusta deve arrivare comunque. La colonna resta per un eventuale
-- affinamento per singolo bambino.
alter table public.kid_profiles
  add column age_band text not null default 'medium'
    check (age_band in ('small', 'medium', 'big'));
