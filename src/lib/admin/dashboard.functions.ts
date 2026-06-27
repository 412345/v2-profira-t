import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertStaff } from "./auth.server";

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.supabase, context.userId);
    const sb = context.supabase;

    const [
      fundsRes,
      investorsRes,
      payoutsRes,
      payoutsAllRes,
      waitlistRes,
      reqPendingRes,
      reqApprovedRes,
    ] = await Promise.all([
      sb.from("funds").select("aum"),
      sb.from("investors").select("id, status, created_at"),
      sb.from("payouts").select("amount, status"),
      sb.from("payouts").select("amount, month, status"),
      sb.from("waitlist").select("id", { count: "exact", head: true }).eq("status", "pending"),
      sb.from("investment_requests").select("amount").eq("status", "pending"),
      sb.from("investment_requests").select("amount, approved_at").eq("status", "approved"),
    ]);

    const pendingWaitlist = waitlistRes.count ?? 0;
    const totalAum = (fundsRes.data ?? []).reduce((s, f) => s + Number(f.aum), 0);
    const activeInvestors = (investorsRes.data ?? []).filter((i) => i.status === "active").length;
    const pendingPayouts = (payoutsRes.data ?? [])
      .filter((p) => p.status === "pending")
      .reduce((s, p) => s + Number(p.amount), 0);

    const pendingRequestsCount = (reqPendingRes.data ?? []).length;
    const pendingRequestsVolume = (reqPendingRes.data ?? []).reduce(
      (s, r) => s + Number(r.amount),
      0,
    );

    const now = new Date();
    const months: { label: string; key: string }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleString("en-IN", { month: "short" }),
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      });
    }

    const payoutByMonth: Record<string, number> = {};
    for (const p of payoutsAllRes.data ?? []) {
      const k = (p.month as string).slice(0, 7);
      payoutByMonth[k] = (payoutByMonth[k] ?? 0) + Number(p.amount);
    }
    const payoutsSeries = months.map((m) => ({ label: m.label, value: payoutByMonth[m.key] ?? 0 }));

    // Real cumulative principal from approved investment_requests
    const approvedByMonth: Record<string, number> = {};
    for (const r of reqApprovedRes.data ?? []) {
      if (!r.approved_at) continue;
      const k = String(r.approved_at).slice(0, 7);
      approvedByMonth[k] = (approvedByMonth[k] ?? 0) + Number(r.amount);
    }
    let cumulative = 0;
    const growthSeries = months.map((m) => {
      cumulative += approvedByMonth[m.key] ?? 0;
      return { label: m.label, value: cumulative };
    });

    return {
      totalAum,
      activeInvestors,
      pendingPayouts,
      pendingWaitlist,
      pendingRequestsCount,
      pendingRequestsVolume,
      growthSeries,
      payoutsSeries,
    };
  });
