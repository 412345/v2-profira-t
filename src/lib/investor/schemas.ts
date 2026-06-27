import { z } from "zod";

export const govIdTypes = ["aadhaar", "pan", "passport", "driving_license"] as const;
export type GovIdType = (typeof govIdTypes)[number];

const aadhaarRe = /^\d{12}$/;
const panRe = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const passportRe = /^[A-Z0-9]{6,12}$/i;
const dlRe = /^[A-Z0-9-]{8,20}$/i;
const ifscRe = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export function validateGovId(type: GovIdType, value: string): string | null {
  const v = value.trim();
  if (type === "aadhaar") return aadhaarRe.test(v) ? null : "Aadhaar must be 12 digits";
  if (type === "pan") return panRe.test(v.toUpperCase()) ? null : "PAN format: ABCDE1234F";
  if (type === "passport") return passportRe.test(v) ? null : "Invalid passport number";
  if (type === "driving_license") return dlRe.test(v) ? null : "Invalid DL number";
  return "Unknown ID type";
}

export const personalSchema = z.object({
  full_name: z.string().trim().min(3, "Min 3 characters").max(120),
  phone: z
    .string()
    .transform((s) => s.replace(/\D/g, "").replace(/^91/, "").slice(-10))
    .pipe(z.string().regex(/^\d{10}$/, "Enter a 10-digit mobile")),
  gov_id_type: z.enum(govIdTypes),
  gov_id_number: z.string().trim().min(4).max(40),
}).superRefine((d, ctx) => {
  const err = validateGovId(d.gov_id_type, d.gov_id_number);
  if (err) ctx.addIssue({ code: "custom", path: ["gov_id_number"], message: err });
});

export const bankSchema = z.object({
  bank_account: z.string().trim().regex(/^\d{6,18}$/, "6–18 digits"),
  ifsc: z.string().trim().toUpperCase().regex(ifscRe, "IFSC format: HDFC0001234"),
  bank_name: z.string().trim().min(2, "Required").max(120),
  account_holder_name: z.string().trim().min(2, "Required").max(120),
});

export const amountSchema = z.object({
  amount: z.coerce.number().int().min(10000, "Minimum ₹10,000").max(50_000_000),
});

export const investmentRequestSchema = z.object({
  amount: z.coerce.number().int().min(10000).max(50_000_000),
  transaction_id: z.string().trim().regex(/^[A-Za-z0-9]{10,22}$/, "10–22 alphanumeric chars"),
});

export const kycSaveSchema = personalSchema.innerType().merge(bankSchema);
export type KycInput = z.infer<typeof kycSaveSchema>;
