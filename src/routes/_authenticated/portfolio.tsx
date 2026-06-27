import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowUp,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Download,
  FileDown,
  PlusCircle,
  User,
} from "lucide-react";
import { getMyInvestorSummary, type PortfolioSummary } from "@/lib/investor/portfolio.functions";
import { toast } from "sonner";

const BG = "#070809";
const SURFACE = "#14151A";
const ACCENT = "#D61F3A";
const SECONDARY_TEXT = "#B8B8B8";
const SUCCESS = "#22C55E";
const DANGER = "#EF4444";

const TIMEFRAMES = ["1M", "3M", "6M", "1Y", "ALL"] as const;
type Timeframe = (typeof TIMEFRAMES)[number];

const portfolioOpts = (fn: () => Promise<PortfolioSummary>) =>
  queryOptions({ queryKey: ["my-portfolio"], queryFn: fn });

export const Route = createFileRoute("/_authenticated/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio — PROFIRA" },
      { name: "description", content: "Manage your PROFIRA investment portfolio." },
    ],
  }),
  component: PortfolioPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-sm text-red-400">{error.message}</div>
  ),
});

function fmtINR(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}

function PortfolioPage() {
  const fn = useServerFn(getMyInvestorSummary);
  const { data } = useSuspenseQuery(portfolioOpts(fn));
  const hasInvestments = data.totalInvested > 0;

  return (
    <main className="min-h-[100dvh] w-full font-sans" style={{ background: BG, color: "#FFFFFF" }}>
      <div className="mx-auto w-full max-w-[520px] px-5 pt-6 pb-32">
        <Header />
        <Greeting name={data.investor?.full_name ?? "Investor"} />

        {!data.kycComplete && <CompletionBanner />}

        {hasInvestments ? (
          <ValueCard total={data.totalInvested} monthly={data.monthlyReturn} />
        ) : (
          <EmptyState kycComplete={data.kycComplete} />
        )}

        <QuickActions hasInvestments={hasInvestments} />
        <PerformanceCard payouts={data.payouts} />
        <PendingRequests requests={data.requests} />
        <MarketWatch />
      </div>
    </main>
  );
}

function Header() {
  return (
    <div className="flex items-center justify-between">
      <img src="/profira-logo.png" alt="PROFIRA" className="h-7 w-auto" />
      <button
        type="button"
        aria-label="Profile"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.03] transition active:scale-95"
      >
        <User className="h-4 w-4 text-white" strokeWidth={1.5} />
      </button>
    </div>
  );
}

function Greeting({ name }: { name: string }) {
  return (
    <div className="mt-6">
      <p className="text-sm" style={{ color: SECONDARY_TEXT }}>Welcome back,</p>
      <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight text-white">{name}</h1>
    </div>
  );
}

function CompletionBanner() {
  return (
    <Link
      to="/onboarding"
      className="mt-5 flex items-center justify-between rounded-2xl border px-4 py-3"
      style={{ borderColor: ACCENT, background: "rgba(214,31,58,0.08)" }}
    >
      <div>
        <p className="text-sm font-semibold text-white">Your profile is 40% complete</p>
        <p className="text-xs" style={{ color: SECONDARY_TEXT }}>
          Complete your registration to start investing
        </p>
      </div>
      <ChevronRight className="h-5 w-5" style={{ color: ACCENT }} />
    </Link>
  );
}

function EmptyState({ kycComplete }: { kycComplete: boolean }) {
  return (
    <div className="mt-5 rounded-2xl border p-6 text-center" style={{ background: SURFACE, borderColor: "rgba(255,255,255,0.06)" }}>
      <p className="text-sm font-semibold text-white">No active investments</p>
      <p className="mt-1 text-xs" style={{ color: SECONDARY_TEXT }}>
        {kycComplete ? "Start your first investment to see returns here." : "Complete your profile to get started."}
      </p>
      <Link
        to="/onboarding"
        className="mt-4 inline-flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-semibold text-white"
        style={{ background: ACCENT }}
      >
        Start Investing <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function ValueCard({ total, monthly }: { total: number; monthly: number }) {
  return (
    <div className="relative mt-5 overflow-hidden rounded-2xl border border-white/[0.06] p-5" style={{ background: SURFACE }}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(120% 80% at 100% 50%, rgba(214,31,58,0.35) 0%, rgba(214,31,58,0.10) 35%, transparent 65%)" }}
      />
      <div className="relative flex items-start justify-between">
        <span className="text-[13px]" style={{ color: SECONDARY_TEXT }}>Total Portfolio Value</span>
        <div className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: "rgba(34,197,94,0.18)", color: SUCCESS }}>
          <ArrowUpRight className="h-3 w-3" strokeWidth={2.2} /> +10%
        </div>
      </div>
      <div className="relative mt-2 text-[30px] font-semibold tracking-tight">₹{fmtINR(total)}</div>
      <div className="relative mt-3">
        <p className="text-[12px]" style={{ color: SECONDARY_TEXT }}>Projected Monthly Return</p>
        <div className="mt-0.5 flex items-center gap-1 text-[13px] font-medium" style={{ color: SUCCESS }}>
          + ₹{fmtINR(monthly)} <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}

type QA = { label: string; Icon: typeof Download; onClick: () => void };

function QuickActions({ hasInvestments }: { hasInvestments: boolean }) {
  const notReady = () => toast.info("Coming soon");
  const actions: QA[] = [
    { label: "Download\nAgreement", Icon: Download, onClick: hasInvestments ? notReady : notReady },
    { label: "Download\nInvoice", Icon: FileDown, onClick: notReady },
    { label: "Invest\nMore", Icon: PlusCircle, onClick: () => (window.location.href = "/onboarding") },
    { label: "Withdraw", Icon: ArrowUp, onClick: notReady },
  ];
  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      {actions.map(({ label, Icon, onClick }) => (
        <button
          key={label}
          type="button"
          onClick={onClick}
          className="flex items-center gap-3 rounded-xl border border-white/[0.06] p-3 text-left transition active:scale-[0.98]"
          style={{ background: SURFACE }}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(214,31,58,0.18)" }}>
            <Icon className="h-4 w-4" style={{ color: ACCENT }} strokeWidth={1.8} />
          </span>
          <span className="whitespace-pre-line text-[13px] font-medium leading-tight text-white">{label}</span>
        </button>
      ))}
    </div>
  );
}

function PerformanceCard({ payouts }: { payouts: Array<{ amount: number; month: string }> }) {
  const [tf, setTf] = useState<Timeframe>("6M");
  const data = useMemo(() => {
    if (!payouts.length) return [0.2, 0.3, 0.4, 0.5, 0.55, 0.6];
    const cutoff = new Date();
    const months = tf === "1M" ? 1 : tf === "3M" ? 3 : tf === "6M" ? 6 : tf === "1Y" ? 12 : 60;
    cutoff.setMonth(cutoff.getMonth() - months);
    const filtered = payouts.filter((p) => new Date(p.month) >= cutoff);
    if (!filtered.length) return [0.5];
    const vals = filtered.map((p) => p.amount);
    const max = Math.max(...vals, 1);
    return vals.map((v) => v / max);
  }, [payouts, tf]);

  const { pathLine, pathArea } = useMemo(() => {
    const W = 320, H = 160, pad = { top: 8, right: 8, bottom: 20, left: 8 };
    const innerW = W - pad.left - pad.right, innerH = H - pad.top - pad.bottom;
    const n = Math.max(data.length, 2);
    const pts = data.map((v, i) => [pad.left + (i / (n - 1)) * innerW, pad.top + (1 - v) * innerH] as const);
    if (pts.length === 1) pts.push([pad.left + innerW, pts[0][1]]);
    const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${(pad.top + innerH).toFixed(1)} L${pts[0][0].toFixed(1)},${(pad.top + innerH).toFixed(1)} Z`;
    return { pathLine: line, pathArea: area };
  }, [data]);

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-white/[0.06] p-4" style={{ background: SURFACE }}>
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-white">Portfolio Performance</h2>
        <div className="flex items-center gap-1">
          {TIMEFRAMES.map((t) => {
            const active = tf === t;
            return (
              <button
                key={t}
                onClick={() => setTf(t)}
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition"
                style={{ background: active ? "rgba(214,31,58,0.18)" : "transparent", color: active ? ACCENT : SECONDARY_TEXT }}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>
      <svg viewBox="0 0 320 160" className="mt-3 block h-[160px] w-full">
        <defs>
          <linearGradient id="perfArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENT} stopOpacity="0.35" />
            <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={pathArea} fill="url(#perfArea)" />
        <path d={pathLine} fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function PendingRequests({ requests }: { requests: PortfolioSummary["requests"] }) {
  const pending = requests.filter((r) => r.status !== "approved");
  if (!pending.length) return null;
  return (
    <div className="mt-5">
      <h2 className="text-[15px] font-semibold text-white">Recent Requests</h2>
      <div className="mt-2 overflow-hidden rounded-2xl border border-white/[0.06]" style={{ background: SURFACE }}>
        {pending.slice(0, 5).map((r, i) => (
          <div
            key={r.id}
            className={`flex items-center justify-between px-4 py-3 ${i < pending.length - 1 ? "border-b border-white/[0.05]" : ""}`}
          >
            <div className="min-w-0">
              <div className="font-mono text-xs text-white">{r.reference_number ?? "PROF-…"}</div>
              <div className="text-[10px]" style={{ color: SECONDARY_TEXT }}>{new Date(r.created_at).toLocaleDateString("en-IN")}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-white">₹{fmtINR(r.amount)}</div>
              <div className="text-[10px] capitalize" style={{ color: r.status === "rejected" ? DANGER : "#EAB308" }}>{r.status}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type Asset = { name: string; category: string; glyph: string; bg: string; price: string; change: number; spark: number[] };
const ASSETS: Asset[] = [
  { name: "Gold (XAU/USD)", category: "Commodities", glyph: "Au", bg: "#B7841F", price: "2,365.20", change: 0.84, spark: [0.4, 0.55, 0.5, 0.7, 0.6, 0.78, 0.65, 0.72, 0.6, 0.68] },
  { name: "EUR/USD", category: "Forex", glyph: "€", bg: "#1F8F4E", price: "1.0824", change: 0.35, spark: [0.3, 0.35, 0.32, 0.45, 0.5, 0.48, 0.6, 0.62, 0.7, 0.75] },
  { name: "GBP/USD", category: "Forex", glyph: "£", bg: "#1E5BD6", price: "1.2657", change: -0.21, spark: [0.7, 0.65, 0.72, 0.6, 0.62, 0.55, 0.5, 0.52, 0.45, 0.4] },
  { name: "USD/JPY", category: "Forex", glyph: "$", bg: "#1E5BD6", price: "156.42", change: 0.12, spark: [0.35, 0.42, 0.38, 0.5, 0.48, 0.55, 0.5, 0.62, 0.58, 0.66] },
];

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const W = 90, H = 32, n = data.length;
  const d = data.map((v, i) => `${i === 0 ? "M" : "L"}${((i / (n - 1)) * W).toFixed(1)},${((1 - v) * H).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-8 w-[90px]">
      <path d={d} fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function MarketWatch() {
  return (
    <div className="mt-5">
      <h2 className="text-[18px] font-semibold text-white">Market Watch</h2>
      <div className="mt-3 overflow-hidden rounded-2xl border border-white/[0.06]" style={{ background: SURFACE }}>
        {ASSETS.map((a, i) => {
          const positive = a.change >= 0;
          return (
            <div
              key={a.name}
              className={`flex items-center gap-3 px-4 py-3 ${i < ASSETS.length - 1 ? "border-b border-white/[0.05]" : ""}`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-white" style={{ background: a.bg }}>
                {a.glyph}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-white">{a.name}</div>
                <div className="text-[11px]" style={{ color: SECONDARY_TEXT }}>{a.category}</div>
              </div>
              <Sparkline data={a.spark} color={positive ? SUCCESS : DANGER} />
              <div className="ml-1 text-right">
                <div className="text-[13px] font-semibold text-white">{a.price}</div>
                <div className="mt-0.5 flex items-center justify-end gap-0.5 text-[11px] font-semibold" style={{ color: positive ? SUCCESS : DANGER }}>
                  {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {positive ? "+" : ""}{a.change.toFixed(2)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
