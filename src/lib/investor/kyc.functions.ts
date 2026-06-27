import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { investmentRequestSchema, kycSaveSchema, validateGovId, type GovIdType } from "./schemas";

async function getOrCreateMyInvestor(supabase: any): Promise<{ id: string; kyc_completed: boolean }> {
  const { data, error } = await supabase.rpc("get_or_create_my_investor");
  if (error) throw new Error(error.message);
  return data as { id: string; kyc_completed: boolean };
}

export const saveKycDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => {
    const parsed = kycSaveSchema.parse(d);
    const err = validateGovId(parsed.gov_id_type as GovIdType, parsed.gov_id_number);
    if (err) throw new Error(err);
    return parsed;
  })
  .handler(async ({ data, context }) => {
    const investor = await getOrCreateMyInvestor(context.supabase);
    const { error } = await context.supabase
      .from("investors")
      .update({
        full_name: data.full_name,
        aadhaar_name: data.full_name,
        phone: data.phone,
        gov_id_type: data.gov_id_type,
        gov_id_number: data.gov_id_number,
        pan: data.gov_id_type === "pan" ? data.gov_id_number.toUpperCase() : null,
        bank_account: data.bank_account,
        ifsc: data.ifsc,
        bank_name: data.bank_name,
        account_holder_name: data.account_holder_name,
        kyc_completed: true,
        kyc_completed_at: new Date().toISOString(),
      })
      .eq("id", investor.id);
    if (error) throw new Error(error.message);
    return { ok: true, investorId: investor.id };
  });

export const createInvestmentRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => investmentRequestSchema.parse(d))
  .handler(async ({ data, context }) => {
    const investor = await getOrCreateMyInvestor(context.supabase);
    if (!investor.kyc_completed) {
      // Re-fetch in case the RPC returned the stale snapshot.
      const { data: fresh } = await context.supabase
        .from("investors")
        .select("kyc_completed")
        .eq("id", investor.id)
        .maybeSingle();
      if (!fresh?.kyc_completed) throw new Error("Complete KYC before submitting an investment");
    }
    const { data: row, error } = await context.supabase
      .from("investment_requests")
      .insert({
        investor_id: investor.id,
        amount: data.amount,
        transaction_id: data.transaction_id,
        payment_method: "bank_transfer",
        status: "pending",
      })
      .select("id, reference_number")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, requestId: row.id as string, referenceNumber: row.reference_number as string };
  });

export const ensureMyInvestor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const investor = await getOrCreateMyInvestor(context.supabase);
    return { investorId: investor.id };
  });

export type OnboardingBootstrap = {
  fullName: string;
  phone: string;
  kycComplete: boolean;
  startStep: 0 | 1 | 2 | 3;
};

export const getOnboardingBootstrap = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OnboardingBootstrap> => {
    const { data: row, error } = await context.supabase.rpc("get_or_create_my_investor");
    if (error) throw new Error(error.message);
    const inv = row as {
      full_name: string | null;
      phone: string | null;
      email: string | null;
      kyc_completed: boolean;
    };
    let waitlistName: string | null = null;
    let waitlistPhone: string | null = null;
    if (inv.email) {
      const { data: wl } = await context.supabase
        .from("waitlist")
        .select("name, phone")
        .eq("email", inv.email.toLowerCase())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      waitlistName = (wl?.name as string | null) ?? null;
      waitlistPhone = (wl?.phone as string | null) ?? null;
    }
    return {
      fullName: inv.full_name || waitlistName || "",
      phone: inv.phone || waitlistPhone || "",
      kycComplete: !!inv.kyc_completed,
      startStep: inv.kyc_completed ? 2 : 0,
    };
  });

// Keep zod referenced so tree-shake doesn't drop it before validators run on edge.
void z;
