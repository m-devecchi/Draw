-- L'età di chi disegna viene scelta a ogni creazione, insieme al prompt,
-- e resta legata al disegno: riaprendolo si ritrovano gli strumenti
-- giusti anche se a usarlo è un altro fratello.
-- Eseguire DOPO 0004_strokes_and_age.sql.

alter table public.drawings
  add column age_band text not null default 'big'
    check (age_band in ('small', 'medium', 'big'));
