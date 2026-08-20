-- Cancello parentale: PIN del genitore.
-- Eseguire nel SQL Editor di Supabase DOPO 0002_kids.sql.

-- Hash del PIN (scrypt, calcolato lato server). Mai il PIN in chiaro.
alter table public.profiles
  add column parent_pin_hash text;

-- Il PIN si imposta solo dal server (service role): un'app che gira sul
-- dispositivo del bambino non deve poterlo cancellare o riscrivere.
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
    or new.parent_pin_hash is distinct from old.parent_pin_hash
  ) then
    raise exception 'campo riservato';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
