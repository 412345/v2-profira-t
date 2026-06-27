import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PortfolioSummary = {
  investor: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    kyc_completed: boolean;
    status: string;
  } | null;
  waitlistName: string | null;
  kycComplete: boolean;
  totalInvested: number;
  pendingAmount: number;
  monthlyReturn: number;
  payouts: Array<{ id: string; amount: number; month: string }>;
  requests: Array<{
    id: string;
    amount: number;
    status: string;
    reference_number: string | null;
    transaction_id: string;
    created_at: string;
  }>;
};

export const getMyInvestorSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PortfolioSummary> => {
    const { data: investorRow, error: invErr } = await context.supabase.rpc("get_or_create_my_investor");
    if (invErr) throw new Error(invErr.message);
    const investor = investorRow as PortfolioSummary["investor"];
    if (!investor) {
      return {
        investor: null,
        waitlistName: null,
        kycComplete: false,
        totalInvested: 0,
        pendingAmount: 0,
        monthlyReturn: 0,
        payouts: [],
        requests: [],
      };
    }

    let waitlistName: string | null = null;
    if (investor.email) {
      const { data: wl } = await context.supabase
        .from("waitlist")
        .select("name")
        .eq("email", investor.email.toLowerCase())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      waitlistName = (wl?.name as string | null) ?? null;
    }

    const [reqsRes, payoutsRes] = await Promise.all([
      context.supabase
        .from("investment_requests")
        .select("id, amount, status, reference_number, transaction_id, created_at")
        .eq("investor_id", investor.id)
        .order("created_at", { ascending: false }),
      context.supabase
        .from("payouts")
        .select("id, amount, month")
        .eq("investor_id", investor.id)
        .order("month", { ascending: true }),
    ]);
    if (reqsRes.error) throw new Error(reqsRes.error.message);
    if (payoutsRes.error) throw new Error(payoutsRes.error.message);

    const requests = (reqsRes.data ?? []).map((r) => ({
      id: r.id as string,
      amount: Number(r.amount),
      status: r.status as string,
      reference_number: (r.reference_number as string | null) ?? null,
      transaction_id: r.transaction_id as string,
      created_at: r.created_at as string,
    }));
    const payouts = (payoutsRes.data ?? []).map((p) => ({
      id: p.id as string,
      amount: Number(p.amount),
      month: p.month as string,
    }));
    const totalInvested = requests.filter((r) => r.status === "approved").reduce((s, r) => s + r.amount, 0);
    const pendingAmount = requests.filter((r) => r.status === "pending").reduce((s, r) => s + r.amount, 0);
    const monthlyReturn = totalInvested * 0.1;

    return {
      investor,
      waitlistName,
      kycComplete: !!investor.kyc_completed,
      totalInvested,
      pendingAmount,
      monthlyReturn,
      payouts,
      requests,
    };
  });
