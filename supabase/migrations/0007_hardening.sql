-- Pulizia segnalata dagli advisor di Supabase: nessun cambio di
-- comportamento, solo sicurezza e prestazioni.
--
-- Eseguire DOPO 0006_cache.sql.

-- 1) Funzioni SECURITY DEFINER: search_path fisso (nessuno può infilare
--    oggetti omonimi in uno schema che viene prima) e niente chiamate
--    dirette via /rest/v1/rpc. Sono funzioni di trigger: i trigger
--    continuano a funzionare, perché il permesso EXECUTE si controlla
--    solo quando il trigger viene creato.
alter function public.handle_new_user() set search_path = '';
alter function public.prevent_plan_self_update() set search_path = '';

revoke execute on function public.handle_new_user()
  from public, anon, authenticated;
revoke execute on function public.prevent_plan_self_update()
  from public, anon, authenticated;

-- 2) Policy RLS: (select auth.uid()) viene valutato una volta per query
--    invece che una volta per riga. Stesse regole di prima.
alter policy "profiles: lettura propria" on public.profiles
  using ((select auth.uid()) = id);
alter policy "profiles: aggiornamento proprio (non del piano)" on public.profiles
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

alter policy "generations: lettura propria" on public.generations
  using ((select auth.uid()) = user_id);

alter policy "drawings: lettura propria" on public.drawings
  using ((select auth.uid()) = user_id);
alter policy "drawings: aggiornamento proprio" on public.drawings
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy "drawings: cancellazione propria" on public.drawings
  using ((select auth.uid()) = user_id);

alter policy "kid_profiles: lettura propria" on public.kid_profiles
  using ((select auth.uid()) = user_id);
alter policy "kid_profiles: creazione propria" on public.kid_profiles
  with check ((select auth.uid()) = user_id);
alter policy "kid_profiles: aggiornamento proprio" on public.kid_profiles
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy "kid_profiles: cancellazione propria" on public.kid_profiles
  using ((select auth.uid()) = user_id);

-- 3) Indice sulla chiave esterna drawings.template_id: serve quando un
--    modello viene cancellato (on delete set null) senza scandire tutto.
create index if not exists drawings_template_id_idx
  on public.drawings (template_id);
