import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
});

export const checkWaitlistStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { data: rows, error } = await supabase.rpc("get_waitlist_status", {
      _email: data.email,
    });
    if (error) throw new Error(error.message);
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row) {
      return { status: "not_found" as const, approvedAt: null };
    }
    return {
      status: row.status as "pending" | "approved" | "rejected",
      approvedAt: row.approved_at ?? null,
    };
  });
