import { z } from "zod";

export const investorSchema = z.object({
  full_name: z.string().trim().min(2, "Required").max(120),
  phone: z.string().trim().regex(/^[+\d][\d\s-]{7,15}$/, "Invalid phone"),
  email: z.string().trim().email("Invalid email").max(255),
  pan: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "PAN format: ABCDE1234F"),
  amount: z.coerce.number().positive("Must be > 0").max(1_000_000_000),
  tenure_months: z.coerce.number().int().min(1).max(360),
  bank_account: z.string().trim().min(6).max(34),
  ifsc: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "IFSC format: HDFC0001234"),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type InvestorInput = z.infer<typeof investorSchema>;

export const fundSchema = z.object({
  name: z.string().trim().min(2).max(120),
  aum: z.coerce.number().min(0),
});

export const payoutSchema = z.object({
  investor_id: z.string().uuid(),
  amount: z.coerce.number().positive(),
  month: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const investorStatuses = ["pending", "approved", "active", "inactive"] as const;
export type InvestorStatus = (typeof investorStatuses)[number];

export function nextStatus(current: InvestorStatus, action: "approve" | "activate" | "deactivate"): InvestorStatus | null {
  if (action === "approve" && current === "pending") return "approved";
  if (action === "activate" && current === "approved") return "active";
  if (action === "deactivate" && (current === "active" || current === "approved")) return "inactive";
  return null;
}
