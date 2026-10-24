import { fromJson, isUuid, iso, query } from "./client";

// Livello dati dell'app. Con Supabase l'isolamento tra utenti lo faceva la
// RLS dentro il database; qui non c'e' piu', quindi OGNI funzione che tocca
// dati personali riceve lo userId e lo mette nella clausola WHERE. Non
// esporre mai query "per solo id" su tabelle personali.

export type Plan = "free" | "premium";
export type AgeBand = "small" | "medium" | "big";

export interface Profile {
  plan: Plan;
  displayName: string | null;
  email: string | null;
  parentPinHash: string | null;
  stripeCustomerId: string | null;
  createdAt: string;
}

export interface Kid {
  id: string;
  name: string;
  avatar: string;
}

export interface DrawingRow {
  id: string;
  prompt: string;
  kind: "svg" | "raster";
  content: string;
  fills: Record<string, string>;
  strokes: unknown;
  ageBand: string | null;
  kidId: string | null;
  createdAt: string;
}

// ── Profili ─────────────────────────────────────────────────────────────

/** Crea il profilo al primo accesso (prima lo faceva un trigger). */
export async function ensureProfile(userId: string, email: string | null) {
  await query(
    `insert into profiles (id, email, display_name)
     values (CAST($1 AS uuid), $2, split_part(coalesce($2, ''), '@', 1))
     on conflict (id) do update set email = excluded.email
       where profiles.email is distinct from excluded.email`,
    [userId, email]
  );
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const rows = await query<{
    plan: Plan;
    display_name: string | null;
    email: string | null;
    parent_pin_hash: string | null;
    stripe_customer_id: string | null;
    created_at: string;
  }>(
    `select plan, display_name, email, parent_pin_hash, stripe_customer_id,
            ${iso("created_at")} as created_at
       from profiles where id = CAST($1 AS uuid)`,
    [userId]
  );
  const r = rows[0];
  if (!r) return null;
  return {
    plan: r.plan === "premium" ? "premium" : "free",
    displayName: r.display_name,
    email: r.email,
    parentPinHash: r.parent_pin_hash,
    stripeCustomerId: r.stripe_customer_id,
    createdAt: r.created_at,
  };
}

export async function setDisplayName(userId: string, name: string) {
  await query(
    `update profiles set display_name = $2, updated_at = now()
      where id = CAST($1 AS uuid)`,
    [userId, name]
  );
}

export async function setEmail(userId: string, email: string) {
  await query(
    `update profiles set email = $2, updated_at = now()
      where id = CAST($1 AS uuid)`,
    [userId, email]
  );
}

export async function setParentPinHash(userId: string, hash: string) {
  await query(
    `update profiles set parent_pin_hash = $2, updated_at = now()
      where id = CAST($1 AS uuid)`,
    [userId, hash]
  );
}

export async function setStripeCustomer(userId: string, customerId: string) {
  await query(
    `update profiles set stripe_customer_id = $2, updated_at = now()
      where id = CAST($1 AS uuid)`,
    [userId, customerId]
  );
}

/** Webhook Stripe: l'abbonamento e' identificato dal customer. */
export async function setPlanByCustomer(
  customerId: string,
  plan: Plan,
  subscriptionId: string | null
) {
  await query(
    `update profiles
        set plan = $2, stripe_subscription_id = $3, updated_at = now()
      where stripe_customer_id = $1`,
    [customerId, plan, subscriptionId]
  );
}

/** Elimina il profilo e, a cascata, bambini, disegni e generazioni. */
export async function deleteProfile(userId: string) {
  await query(`delete from profiles where id = CAST($1 AS uuid)`, [userId]);
}

// ── Bambini ─────────────────────────────────────────────────────────────

export async function listKids(userId: string): Promise<Kid[]> {
  return query<Kid>(
    `select id, name, avatar from kid_profiles
      where user_id = CAST($1 AS uuid) order by created_at`,
    [userId]
  );
}

export async function addKid(
  userId: string,
  name: string,
  avatar: string
): Promise<Kid> {
  const rows = await query<Kid>(
    `insert into kid_profiles (user_id, name, avatar)
     values (CAST($1 AS uuid), $2, $3)
     returning id, name, avatar`,
    [userId, name, avatar]
  );
  return rows[0];
}

export async function deleteKid(userId: string, kidId: string) {
  if (!isUuid(kidId)) return;
  await query(
    `delete from kid_profiles
      where id = CAST($1 AS uuid) and user_id = CAST($2 AS uuid)`,
    [kidId, userId]
  );
}

export async function kidBelongsTo(
  userId: string,
  kidId: string
): Promise<boolean> {
  if (!isUuid(kidId)) return false;
  const rows = await query(
    `select 1 as ok from kid_profiles
      where id = CAST($1 AS uuid) and user_id = CAST($2 AS uuid)`,
    [kidId, userId]
  );
  return rows.length > 0;
}

// ── Disegni ─────────────────────────────────────────────────────────────

interface RawDrawing {
  id: string;
  prompt: string;
  kind: "svg" | "raster";
  content: string;
  fills: unknown;
  strokes: unknown;
  age_band: string | null;
  kid_id: string | null;
  created_at: string;
}

const DRAWING_COLUMNS = `id, prompt, kind, content, fills, strokes, age_band,
  kid_id, ${iso("created_at")} as created_at`;

function mapDrawing(r: RawDrawing): DrawingRow {
  return {
    id: r.id,
    prompt: r.prompt,
    kind: r.kind,
    content: r.content,
    fills: fromJson<Record<string, string>>(r.fills, {}),
    strokes: fromJson<unknown>(r.strokes, []),
    ageBand: r.age_band,
    kidId: r.kid_id,
    createdAt: r.created_at,
  };
}

export async function listDrawings(
  userId: string,
  opts: { kidId?: string | null; limit?: number } = {}
): Promise<DrawingRow[]> {
  const rows = await query<RawDrawing>(
    `select ${DRAWING_COLUMNS} from drawings
      where user_id = CAST($1 AS uuid)
        and (CAST($2 AS uuid) is null or kid_id = CAST($2 AS uuid))
      order by created_at desc
      limit $3`,
    [userId, opts.kidId ?? null, opts.limit ?? 30]
  );
  return rows.map(mapDrawing);
}

export async function getDrawing(
  userId: string,
  id: string
): Promise<DrawingRow | null> {
  if (!isUuid(id)) return null;
  const rows = await query<RawDrawing>(
    `select ${DRAWING_COLUMNS} from drawings
      where id = CAST($1 AS uuid) and user_id = CAST($2 AS uuid)`,
    [id, userId]
  );
  return rows[0] ? mapDrawing(rows[0]) : null;
}

export async function getDrawingsByIds(
  userId: string,
  ids: string[]
): Promise<DrawingRow[]> {
  const valid = ids.filter(isUuid);
  if (!valid.length) return [];
  const rows = await query<RawDrawing>(
    `select ${DRAWING_COLUMNS} from drawings
      where user_id = CAST($1 AS uuid)
        and id = any(CAST($2 AS uuid[]))`,
    [userId, `{${valid.join(",")}}`]
  );
  return rows.map(mapDrawing);
}

export async function countDrawings(userId: string): Promise<number> {
  const rows = await query<{ n: number }>(
    `select count(*)::int as n from drawings where user_id = CAST($1 AS uuid)`,
    [userId]
  );
  return rows[0]?.n ?? 0;
}

export async function insertDrawing(
  userId: string,
  d: {
    prompt: string;
    provider: string;
    kind: string;
    content: string;
    ageBand: AgeBand;
    kidId: string | null;
    templateId: string | null;
  }
): Promise<string> {
  const rows = await query<{ id: string }>(
    `insert into drawings
       (user_id, kid_id, template_id, prompt, provider, kind, content, age_band)
     values (CAST($1 AS uuid), CAST($2 AS uuid), CAST($3 AS uuid),
             $4, $5, $6, $7, $8)
     returning id`,
    [
      userId,
      d.kidId,
      d.templateId,
      d.prompt,
      d.provider,
      d.kind,
      d.content,
      d.ageBand,
    ]
  );
  return rows[0].id;
}

/** Aggiorna colori (e, se presenti, tratti) di un disegno dell'utente. */
export async function updateDrawing(
  userId: string,
  id: string,
  data: { fills: Record<string, string>; strokes?: unknown[] }
): Promise<boolean> {
  if (!isUuid(id)) return false;
  const rows = await query(
    `update drawings
        set fills = CAST($3 AS jsonb),
            strokes = coalesce(CAST($4 AS jsonb), strokes),
            updated_at = now()
      where id = CAST($1 AS uuid) and user_id = CAST($2 AS uuid)
      returning id`,
    [id, userId, data.fills, data.strokes ?? null]
  );
  return rows.length > 0;
}

export async function deleteDrawing(userId: string, id: string) {
  if (!isUuid(id)) return;
  await query(
    `delete from drawings
      where id = CAST($1 AS uuid) and user_id = CAST($2 AS uuid)`,
    [id, userId]
  );
}

// ── Quota ───────────────────────────────────────────────────────────────

export async function countGenerationsSince(
  userId: string,
  sinceIso: string
): Promise<number> {
  const rows = await query<{ n: number }>(
    `select count(*)::int as n from generations
      where user_id = CAST($1 AS uuid)
        and created_at >= CAST($2 AS timestamptz)`,
    [userId, sinceIso]
  );
  return rows[0]?.n ?? 0;
}

export async function insertGeneration(
  userId: string,
  g: { provider: string; prompt: string; cached: boolean }
): Promise<string> {
  const rows = await query<{ id: string }>(
    `insert into generations (user_id, provider, prompt, cached)
     values (CAST($1 AS uuid), $2, $3, CAST($4 AS boolean))
     returning id`,
    [userId, g.provider, g.prompt, g.cached]
  );
  return rows[0].id;
}

export async function deleteGeneration(userId: string, id: string) {
  await query(
    `delete from generations
      where id = CAST($1 AS uuid) and user_id = CAST($2 AS uuid)`,
    [id, userId]
  );
}

// ── Cache dei disegni (non personale) ───────────────────────────────────

export interface TemplateRow {
  id: string;
  content: string;
  kind: "svg" | "raster";
}

export async function findTemplates(
  promptKey: string,
  ageBand: string
): Promise<TemplateRow[]> {
  return query<TemplateRow>(
    `select id, content, kind from drawing_templates
      where prompt_key = $1 and age_band = $2`,
    [promptKey, ageBand]
  );
}

/** Quali di questi template l'utente ha gia' ricevuto? */
export async function ownedTemplateIds(
  userId: string,
  templateIds: string[]
): Promise<string[]> {
  const valid = templateIds.filter(isUuid);
  if (!valid.length) return [];
  const rows = await query<{ template_id: string }>(
    `select distinct template_id from drawings
      where user_id = CAST($1 AS uuid)
        and template_id = any(CAST($2 AS uuid[]))`,
    [userId, `{${valid.join(",")}}`]
  );
  return rows.map((r) => r.template_id);
}

export async function insertTemplate(t: {
  key: string;
  prompt: string;
  ageBand: string;
  provider: string;
  kind: string;
  content: string;
}): Promise<string> {
  const rows = await query<{ id: string }>(
    `insert into drawing_templates
       (prompt_key, prompt, age_band, provider, kind, content)
     values ($1, $2, $3, $4, $5, $6)
     returning id`,
    [t.key, t.prompt, t.ageBand, t.provider, t.kind, t.content]
  );
  return rows[0].id;
}

export async function bumpTemplateUses(templateId: string) {
  if (!isUuid(templateId)) return;
  await query(
    `update drawing_templates set uses = uses + 1
      where id = CAST($1 AS uuid)`,
    [templateId]
  );
}
