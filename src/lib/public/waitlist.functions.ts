import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(255),
  phone: z.string().trim().min(7).max(20),
});

export const submitWaitlist = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { error } = await supabase.from("waitlist").insert({
      name: data.name,
      email: data.email,
      phone: data.phone,
      source: "website",
      status: "pending",
    });
    if (error) {
      if (error.code === "23505") {
        return { ok: true as const, duplicate: true as const };
      }
      throw new Error(error.message);
    }
    return { ok: true as const, duplicate: false as const };
  });
