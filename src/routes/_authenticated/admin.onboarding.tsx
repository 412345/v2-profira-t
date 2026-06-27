import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { investorSchema, type InvestorInput } from "@/lib/admin/schemas";
import { createInvestor } from "@/lib/admin/investors.functions";

export const Route = createFileRoute("/_authenticated/admin/onboarding")({
  component: OnboardingPage,
});

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-[#B8B8B8]">{label}</Label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

function OnboardingPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const createFn = useServerFn(createInvestor);
  const form = useForm<InvestorInput>({
    resolver: zodResolver(investorSchema),
    defaultValues: {
      full_name: "",
      phone: "",
      email: "",
      pan: "",
      amount: 0,
      tenure_months: 12,
      bank_account: "",
      ifsc: "",
      notes: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (input: InvestorInput) => createFn({ data: input }),
    onSuccess: ({ id }) => {
      qc.invalidateQueries({ queryKey: ["admin", "investors"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast.success("Investor onboarded.");
      navigate({ to: "/admin/investors/$id", params: { id } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const inputCls = "border-[#1F2024] bg-[#0B0C10] text-white";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Investor Onboarding</h1>
        <p className="text-sm text-[#B8B8B8]">Create a new investor record. Status defaults to <span className="text-amber-300">pending</span>.</p>
      </div>
      <form
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
        className="admin-card grid gap-4 p-6 sm:grid-cols-2"
      >
        <div className="sm:col-span-2">
          <Field label="Full Name" error={form.formState.errors.full_name?.message}>
            <Input {...form.register("full_name")} className={inputCls} />
          </Field>
        </div>
        <Field label="Phone" error={form.formState.errors.phone?.message}>
          <Input {...form.register("phone")} placeholder="+91 98xxxxxxxx" className={inputCls} />
        </Field>
        <Field label="Email" error={form.formState.errors.email?.message}>
          <Input type="email" {...form.register("email")} className={inputCls} />
        </Field>
        <Field label="PAN" error={form.formState.errors.pan?.message}>
          <Input {...form.register("pan")} placeholder="ABCDE1234F" className={`${inputCls} uppercase`} />
        </Field>
        <Field label="IFSC" error={form.formState.errors.ifsc?.message}>
          <Input {...form.register("ifsc")} placeholder="HDFC0001234" className={`${inputCls} uppercase`} />
        </Field>
        <Field label="Investment Amount (₹)" error={form.formState.errors.amount?.message}>
          <Input type="number" step="0.01" {...form.register("amount")} className={inputCls} />
        </Field>
        <Field label="Tenure (months)" error={form.formState.errors.tenure_months?.message}>
          <Input type="number" {...form.register("tenure_months")} className={inputCls} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Bank Account Number" error={form.formState.errors.bank_account?.message}>
            <Input {...form.register("bank_account")} className={inputCls} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Notes (optional)" error={form.formState.errors.notes?.message}>
            <Textarea {...form.register("notes")} className={inputCls} rows={3} />
          </Field>
        </div>
        <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => form.reset()}
            className="text-[#B8B8B8] hover:bg-white/5"
          >
            Reset
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="bg-[#D61F3A] text-white hover:bg-[#B8172F]"
          >
            {mutation.isPending ? "Saving…" : "Create Investor"}
          </Button>
        </div>
      </form>
    </div>
  );
}
