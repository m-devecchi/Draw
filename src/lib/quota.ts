import { createAdminClient } from "@/lib/supabase/admin";

export type Plan = "free" | "premium";

export interface QuotaStatus {
  plan: Plan;
  limit: number;
  usedToday: number;
  remaining: number;
}

// Una env var vuota, non numerica o <= 0 non deve mai azzerare la quota:
// si ricade sul default.
export function parseLimit(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function dailyLimit(plan: Plan): number {
  if (plan === "premium") {
    return parseLimit(process.env.PREMIUM_DAILY_LIMIT, 50);
  }
  return parseLimit(process.env.FREE_DAILY_LIMIT, 2);
}

// Inizio del giorno corrente in UTC: la quota si azzera a mezzanotte UTC.
function startOfTodayUtc(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  ).toISOString();
}

export async function getQuotaStatus(userId: string): Promise<QuotaStatus> {
  const admin = createAdminClient();

  const [{ data: profile }, { count }] = await Promise.all([
    admin.from("profiles").select("plan").eq("id", userId).single(),
    admin
      .from("generations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", startOfTodayUtc()),
  ]);

  const plan: Plan = profile?.plan === "premium" ? "premium" : "free";
  const limit = dailyLimit(plan);
  const usedToday = count ?? 0;

  return {
    plan,
    limit,
    usedToday,
    remaining: Math.max(0, limit - usedToday),
  };
}
