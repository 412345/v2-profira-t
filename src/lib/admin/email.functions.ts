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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendApprovalEmailForWaitlistId } = await import("./email.server");
    const res = await sendApprovalEmailForWaitlistId(supabaseAdmin, data.waitlistId);
    return { ok: true as const, status: res.status };
  });
