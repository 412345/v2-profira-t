import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertStaff } from "./auth.server";

const sendSchema = z.object({
  waitlistId: z.string().uuid(),
});

export const sendApprovalEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => sendSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { sendApprovalEmailForWaitlistId } = await import("./email.server");
    const res = await sendApprovalEmailForWaitlistId(context.supabase, data.waitlistId);
    return { ok: true as const, status: res.status };
  });

const sendConfirmationSchema = z.object({
  requestId: z.string().uuid(),
});

export const sendInvestmentConfirmationEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => sendConfirmationSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { sendInvestmentConfirmationForRequestId } = await import("./email.server");
    const res = await sendInvestmentConfirmationForRequestId(context.supabase, data.requestId);
    return { ok: true as const, status: res.status };
  });
