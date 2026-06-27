import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useReducer, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, ChevronLeft, ChevronRight, Copy, Loader2 } from "lucide-react";
import { saveKycDetails, createInvestmentRequest, getOnboardingBootstrap } from "@/lib/investor/kyc.functions";
import { personalSchema, bankSchema, govIdTypes, type GovIdType } from "@/lib/investor/schemas";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Complete Your Profile — PROFIRA" }] }),
  component: OnboardingPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-sm text-red-400">{error.message}</div>
  ),
});

const ACCENT = "#D61F3A";
const SURFACE = "#0B0C10";
const BORDER = "#1F2024";
const SECONDARY = "#B8B8B8";

type StepKey = 0 | 1 | 2 | 3 | 4;
type State = {
  step: StepKey;
  full_name: string;
  phone: string;
  gov_id_type: GovIdType;
  gov_id_number: string;
  bank_account: string;
  ifsc: string;
  bank_name: string;
  account_holder_name: string;
  amount: number;
  agree1: boolean;
  agree2: boolean;
  agree3: boolean;
  transaction_id: string;
  paid: boolean;
  referenceNumber: string;
};
const initial: State = {
  step: 0,
  full_name: "",
  phone: "",
  gov_id_type: "aadhaar",
  gov_id_number: "",
  bank_account: "",
  ifsc: "",
  bank_name: "",
  account_holder_name: "",
  amount: 10000,
  agree1: false,
  agree2: false,
  agree3: false,
  transaction_id: "",
  paid: false,
  referenceNumber: "",
};
type Action = { type: "set"; patch: Partial<State> } | { type: "step"; step: StepKey };
function reducer(s: State, a: Action): State {
  if (a.type === "set") return { ...s, ...a.patch };
  return { ...s, step: a.step };
}

function fmtINR(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}

function OnboardingPage() {
  const [state, dispatch] = useReducer(reducer, initial);
  const bootstrapFn = useServerFn(getOnboardingBootstrap);
  const { data: bootstrap } = useQuery({
    queryKey: ["onboarding-bootstrap"],
    queryFn: () => bootstrapFn(),
    staleTime: 60_000,
  });
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (!bootstrap || hydrated) return;
    dispatch({
      type: "set",
      patch: {
        full_name: bootstrap.fullName || "",
        phone: bootstrap.phone || "",
        step: bootstrap.startStep as StepKey,
      },
    });
    setHydrated(true);
  }, [bootstrap, hydrated]);

  return (
    <main className="min-h-[100dvh] w-full font-sans" style={{ background: "#07080a", color: "#fff" }}>
      <div className="mx-auto w-full max-w-[560px] px-5 pt-8 pb-24">
        <ProgressDots step={state.step} />
        <div className="mt-6">
          {state.step === 0 && <StepPersonal state={state} dispatch={dispatch} placeholderName={bootstrap?.fullName || ""} />}
          {state.step === 1 && <StepBank state={state} dispatch={dispatch} />}
          {state.step === 2 && <StepAmount state={state} dispatch={dispatch} />}
          {state.step === 3 && <StepTerms state={state} dispatch={dispatch} />}
          {state.step === 4 && <StepConfirmation reference={state.referenceNumber} />}
        </div>
      </div>
    </main>
  );
}

function ProgressDots({ step }: { step: StepKey }) {
  const total = 5;
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <div key={i} className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold transition"
              style={{
                background: done ? "#22C55E" : active ? ACCENT : "#1A1B1F",
                color: done || active ? "#fff" : SECONDARY,
                border: `1px solid ${done ? "#22C55E" : active ? ACCENT : BORDER}`,
              }}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            {i < total - 1 && (
              <div className="h-px w-6" style={{ background: done ? "#22C55E" : BORDER }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepShell({
  title,
  subtitle,
  children,
  onBack,
  onNext,
  nextLabel = "Next Step",
  nextDisabled,
  busy,
  hideBack,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  busy?: boolean;
  hideBack?: boolean;
}) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm" style={{ color: SECONDARY }}>{subtitle}</p>
      <div className="mt-6 rounded-2xl border p-5" style={{ background: SURFACE, borderColor: BORDER }}>
        {children}
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={hideBack || !onBack}
          className="inline-flex items-center gap-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition disabled:opacity-40"
          style={{ borderColor: BORDER, color: "#fff" }}
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled || busy}
          className="inline-flex items-center gap-1 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
          style={{ background: ACCENT }}
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} {nextLabel} <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

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
    <label className="mb-4 block last:mb-0">
      <span className="mb-1.5 block text-xs font-medium" style={{ color: SECONDARY }}>
        {label}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs" style={{ color: ACCENT }}>{error}</span>}
    </label>
  );
}

const inputCls = "w-full rounded-xl border bg-[#0F1014] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#D61F3A]";

function StepPersonal({ state, dispatch, placeholderName }: { state: State; dispatch: React.Dispatch<Action>; placeholderName: string }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  function next() {
    const res = personalSchema.safeParse({
      full_name: state.full_name,
      phone: state.phone,
      gov_id_type: state.gov_id_type,
      gov_id_number: state.gov_id_number,
    });
    if (!res.success) {
      const e: Record<string, string> = {};
      res.error.issues.forEach((i) => (e[i.path[0] as string] = i.message));
      setErrors(e);
      return;
    }
    setErrors({});
    dispatch({ type: "step", step: 1 });
  }
  return (
    <StepShell
      title="Complete Your Profile"
      subtitle="Account Registration — 40% Complete"
      hideBack
      onNext={next}
    >
      <Field label="Full Name (as per Aadhaar)" error={errors.full_name}>
        <input
          className={inputCls}
          style={{ borderColor: BORDER }}
          value={state.full_name}
          onChange={(e) => dispatch({ type: "set", patch: { full_name: e.target.value } })}
          placeholder={placeholderName || "Your full legal name"}
        />
      </Field>
      <Field label="Mobile Number" error={errors.phone}>
        <div className="flex items-center gap-2">
          <span className="rounded-lg border px-3 py-2.5 text-sm text-white" style={{ borderColor: BORDER, background: "#0F1014" }}>
            +91
          </span>
          <input
            className={inputCls}
            style={{ borderColor: BORDER }}
            value={state.phone}
            onChange={(e) => dispatch({ type: "set", patch: { phone: e.target.value.replace(/\D/g, "").slice(0, 10) } })}
            placeholder="9876543210"
            inputMode="numeric"
          />
        </div>
      </Field>
      <Field label="Government ID Type">
        <select
          className={inputCls}
          style={{ borderColor: BORDER }}
          value={state.gov_id_type}
          onChange={(e) => dispatch({ type: "set", patch: { gov_id_type: e.target.value as GovIdType } })}
        >
          {govIdTypes.map((t) => (
            <option key={t} value={t}>{t.replace("_", " ").toUpperCase()}</option>
          ))}
        </select>
      </Field>
      <Field label="ID Number" error={errors.gov_id_number}>
        <input
          className={inputCls}
          style={{ borderColor: BORDER }}
          value={state.gov_id_number}
          onChange={(e) =>
            dispatch({
              type: "set",
              patch: { gov_id_number: state.gov_id_type === "pan" ? e.target.value.toUpperCase() : e.target.value },
            })
          }
          placeholder={
            state.gov_id_type === "aadhaar"
              ? "12 digits"
              : state.gov_id_type === "pan"
                ? "ABCDE1234F"
                : "ID number"
          }
        />
      </Field>
    </StepShell>
  );
}

function StepBank({ state, dispatch }: { state: State; dispatch: React.Dispatch<Action> }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const saveFn = useServerFn(saveKycDetails);
  const m = useMutation({
    mutationFn: saveFn,
    onSuccess: () => dispatch({ type: "step", step: 2 }),
    onError: (e: Error) => setErrors({ _: e.message }),
  });
  function next() {
    const bankRes = bankSchema.safeParse({
      bank_account: state.bank_account,
      ifsc: state.ifsc,
      bank_name: state.bank_name,
      account_holder_name: state.account_holder_name || state.full_name,
    });
    if (!bankRes.success) {
      const e: Record<string, string> = {};
      bankRes.error.issues.forEach((i) => (e[i.path[0] as string] = i.message));
      setErrors(e);
      return;
    }
    setErrors({});
    m.mutate({
      data: {
        full_name: state.full_name,
        phone: state.phone,
        gov_id_type: state.gov_id_type,
        gov_id_number: state.gov_id_number,
        bank_account: state.bank_account,
        ifsc: state.ifsc.toUpperCase(),
        bank_name: state.bank_name,
        account_holder_name: state.account_holder_name || state.full_name,
      },
    });
  }
  return (
    <StepShell
      title="Bank Account Details"
      subtitle="For withdrawals and payouts"
      onBack={() => dispatch({ type: "step", step: 0 })}
      onNext={next}
      busy={m.isPending}
    >
      <Field label="Bank Account Number" error={errors.bank_account}>
        <input
          className={inputCls}
          style={{ borderColor: BORDER }}
          value={state.bank_account}
          onChange={(e) => dispatch({ type: "set", patch: { bank_account: e.target.value.replace(/\D/g, "").slice(0, 18) } })}
          inputMode="numeric"
        />
      </Field>
      <Field label="IFSC Code" error={errors.ifsc}>
        <input
          className={inputCls}
          style={{ borderColor: BORDER }}
          value={state.ifsc}
          onChange={(e) => dispatch({ type: "set", patch: { ifsc: e.target.value.toUpperCase().slice(0, 11) } })}
          placeholder="HDFC0001234"
        />
      </Field>
      <Field label="Bank Name" error={errors.bank_name}>
        <input
          className={inputCls}
          style={{ borderColor: BORDER }}
          value={state.bank_name}
          onChange={(e) => dispatch({ type: "set", patch: { bank_name: e.target.value } })}
        />
      </Field>
      <Field label="Account Holder Name" error={errors.account_holder_name}>
        <input
          className={inputCls}
          style={{ borderColor: BORDER }}
          value={state.account_holder_name || state.full_name}
          onChange={(e) => dispatch({ type: "set", patch: { account_holder_name: e.target.value } })}
        />
      </Field>
      <div className="rounded-xl border px-3 py-2.5 text-xs" style={{ borderColor: BORDER, background: "#0F1014", color: SECONDARY }}>
        Used for monthly profit distribution. Ensure accuracy.
      </div>
      {errors._ && <p className="mt-3 text-xs" style={{ color: ACCENT }}>{errors._}</p>}
    </StepShell>
  );
}

const PRESETS = [10000, 50000, 100000, 500000];

function StepAmount({ state, dispatch }: { state: State; dispatch: React.Dispatch<Action> }) {
  const amount = state.amount || 0;
  const monthly = amount * 0.1;
  const maturity = amount * Math.pow(1.1, 6);
  const returns = maturity - amount;
  return (
    <StepShell
      title="Choose Your Investment"
      subtitle="Minimum: ₹10,000"
      onBack={() => dispatch({ type: "step", step: 1 })}
      onNext={() => dispatch({ type: "step", step: 3 })}
      nextDisabled={amount < 10000}
    >
      <div className="grid grid-cols-2 gap-3">
        {PRESETS.map((p) => {
          const sel = state.amount === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => dispatch({ type: "set", patch: { amount: p } })}
              className="relative rounded-xl border px-3 py-3 text-left transition"
              style={{
                background: SURFACE,
                borderColor: sel ? ACCENT : BORDER,
                boxShadow: sel ? "0 0 0 3px rgba(214,31,58,0.25)" : "none",
              }}
            >
              {p === 10000 && (
                <span className="absolute right-2 top-2 rounded-full px-1.5 py-0.5 text-[9px] font-semibold" style={{ background: "rgba(214,31,58,0.2)", color: ACCENT }}>
                  Recommended
                </span>
              )}
              <div className="text-[11px]" style={{ color: SECONDARY }}>Invest</div>
              <div className="mt-0.5 text-lg font-semibold">₹{fmtINR(p)}</div>
            </button>
          );
        })}
      </div>
      <Field label="Custom Amount">
        <div className="flex items-center gap-2">
          <span className="rounded-lg border px-3 py-2.5 text-sm" style={{ borderColor: BORDER, background: "#0F1014" }}>₹</span>
          <input
            className={inputCls}
            style={{ borderColor: BORDER }}
            value={state.amount ? fmtINR(state.amount) : ""}
            onChange={(e) => {
              const n = Number(e.target.value.replace(/\D/g, "")) || 0;
              dispatch({ type: "set", patch: { amount: n } });
            }}
            inputMode="numeric"
            placeholder="10,000"
          />
        </div>
      </Field>
      <div className="mt-2 rounded-xl border p-4" style={{ borderColor: BORDER, background: "#0F1014" }}>
        <Row label="Monthly Return (10%)" value={`₹${fmtINR(monthly)}`} />
        <Row label="6-Month Maturity" value={`₹${fmtINR(maturity)}`} />
        <div className="my-3 h-px" style={{ background: BORDER }} />
        <Row label="Principal" value={`₹${fmtINR(amount)}`} />
        <Row label="Returns" value={`₹${fmtINR(returns)}`} accent />
        <Row label="Total" value={`₹${fmtINR(maturity)}`} bold />
      </div>
    </StepShell>
  );
}

function Row({ label, value, accent, bold }: { label: string; value: string; accent?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span style={{ color: SECONDARY }}>{label}</span>
      <span style={{ color: accent ? "#22C55E" : "#fff", fontWeight: bold ? 700 : 500 }}>{value}</span>
    </div>
  );
}

function StepTerms({ state, dispatch }: { state: State; dispatch: React.Dispatch<Action> }) {
  const allChecked = state.agree1 && state.agree2 && state.agree3;
  const [err, setErr] = useState<string | null>(null);
  const submitFn = useServerFn(createInvestmentRequest);
  const m = useMutation({
    mutationFn: submitFn,
    onSuccess: (res) => {
      dispatch({ type: "set", patch: { referenceNumber: res.referenceNumber } });
      dispatch({ type: "step", step: 4 });
    },
    onError: (e: Error) => setErr(e.message),
  });
  function submit() {
    if (!allChecked) return setErr("Please accept all terms");
    if (!/^[A-Za-z0-9]{10,22}$/.test(state.transaction_id)) return setErr("Transaction ID must be 10–22 alphanumeric chars");
    if (!state.paid) return setErr("Confirm you've completed the payment");
    setErr(null);
    m.mutate({ data: { amount: state.amount, transaction_id: state.transaction_id } });
  }

  const bank = {
    name: (import.meta.env.VITE_COMPANY_BANK_NAME as string) || "PROFIRA Capital",
    account: (import.meta.env.VITE_COMPANY_ACCOUNT_NUMBER as string) || "0000-0000-0000",
    ifsc: (import.meta.env.VITE_COMPANY_IFSC_CODE as string) || "HDFC0000000",
    holder: (import.meta.env.VITE_COMPANY_ACCOUNT_HOLDER as string) || "PROFIRA Capital Pvt Ltd",
  };

  return (
    <StepShell
      title="Payment & Confirmation"
      subtitle="Review terms, transfer funds, then submit"
      onBack={() => dispatch({ type: "step", step: 2 })}
      onNext={submit}
      nextLabel="Done"
      nextDisabled={!allChecked || !state.transaction_id || !state.paid}
      busy={m.isPending}
    >
      <div className="max-h-40 overflow-y-auto rounded-xl border p-3 text-xs" style={{ borderColor: BORDER, background: "#0F1014", color: SECONDARY }}>
        <p className="font-semibold text-white">Investment Terms & Conditions</p>
        <p className="mt-1">
          By investing, you acknowledge that returns are projections based on PROFIRA's forex/gold trading strategy and are not guaranteed.
          Principal will be returned at maturity along with accrued returns. Monthly distributions are subject to trading performance.
          You confirm the source of funds is legitimate and the bank account provided is held in your name.
        </p>
      </div>
      <div className="mt-4 space-y-2.5">
        <Check3 label="I agree to Investment Terms and Conditions" checked={state.agree1} onChange={(v) => dispatch({ type: "set", patch: { agree1: v } })} />
        <Check3 label="I understand forex/gold trading risks" checked={state.agree2} onChange={(v) => dispatch({ type: "set", patch: { agree2: v } })} />
        <Check3 label="I confirm bank details are correct and belong to me" checked={state.agree3} onChange={(v) => dispatch({ type: "set", patch: { agree3: v } })} />
      </div>

      {allChecked && (
        <div className="mt-5 rounded-xl border p-4" style={{ borderColor: ACCENT, background: "rgba(214,31,58,0.05)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: ACCENT }}>Transfer to</p>
          <BankRow label="Account Holder" value={bank.holder} />
          <BankRow label="Bank Name" value={bank.name} />
          <BankRow label="Account Number" value={bank.account} />
          <BankRow label="IFSC" value={bank.ifsc} />
          <p className="mt-2 text-[11px]" style={{ color: SECONDARY }}>
            Transfer exactly ₹{fmtINR(state.amount)} via NEFT/IMPS/UPI, then enter the transaction reference below.
          </p>
        </div>
      )}

      <Field label="Transaction ID / UTR Number">
        <input
          className={inputCls}
          style={{ borderColor: BORDER }}
          value={state.transaction_id}
          onChange={(e) => dispatch({ type: "set", patch: { transaction_id: e.target.value.replace(/[^A-Za-z0-9]/g, "").slice(0, 22) } })}
          placeholder="e.g. ABCD1234567890"
        />
      </Field>
      <Check3 label="I have completed the payment" checked={state.paid} onChange={(v) => dispatch({ type: "set", patch: { paid: v } })} />
      {err && <p className="mt-3 text-xs" style={{ color: ACCENT }}>{err}</p>}
    </StepShell>
  );
}

function Check3({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#D61F3A]" />
      <span className="text-white/90">{label}</span>
    </label>
  );
}

function BankRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-2 flex items-center justify-between gap-2 text-sm">
      <span className="text-xs" style={{ color: SECONDARY }}>{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono text-white">{value}</span>
        <button
          type="button"
          aria-label={`Copy ${label}`}
          onClick={() => {
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="rounded-md border p-1 transition hover:bg-white/5"
          style={{ borderColor: BORDER }}
        >
          {copied ? <Check className="h-3 w-3" style={{ color: "#22C55E" }} /> : <Copy className="h-3 w-3 text-white" />}
        </button>
      </div>
    </div>
  );
}

function StepConfirmation({ reference }: { reference: string }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center text-center">
      <div
        className="mt-6 flex h-20 w-20 items-center justify-center rounded-full"
        style={{ background: "rgba(34,197,94,0.15)", border: "2px solid #22C55E", animation: "popIn 0.4s ease-out" }}
      >
        <Check className="h-10 w-10" style={{ color: "#22C55E" }} strokeWidth={3} />
      </div>
      <h1 className="mt-6 text-2xl font-semibold">Investment Submitted</h1>
      <p className="mt-2 max-w-sm text-sm" style={{ color: SECONDARY }}>
        Your transaction is being reviewed by our team. We'll update your dashboard shortly.
      </p>
      <div className="mt-6 rounded-xl border px-4 py-3" style={{ borderColor: BORDER, background: SURFACE }}>
        <p className="text-xs" style={{ color: SECONDARY }}>Reference Number</p>
        <p className="mt-0.5 font-mono text-lg font-semibold tracking-wider" style={{ color: ACCENT }}>{reference || "PROF-PENDING"}</p>
      </div>
      <p className="mt-4 text-[11px]" style={{ color: SECONDARY }}>Usually takes 2–4 hours during business hours.</p>
      <button
        type="button"
        onClick={() => navigate({ to: "/portfolio" })}
        className="mt-8 inline-flex items-center gap-1 rounded-xl px-6 py-3 text-sm font-semibold text-white"
        style={{ background: ACCENT }}
      >
        Go to Dashboard <ChevronRight className="h-4 w-4" />
      </button>
      <Link to="/portfolio" className="mt-3 text-xs underline" style={{ color: SECONDARY }}>
        or return later
      </Link>
      <style>{`@keyframes popIn { 0% { transform: scale(0.4); opacity: 0; } 70% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  );
}

void useMemo;
