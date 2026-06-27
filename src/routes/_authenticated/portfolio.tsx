import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowUp,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Download,
  Eye,
  FileDown,
  PlusCircle,
  User,
} from "lucide-react";


export const Route = createFileRoute("/_authenticated/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio — PROFIRA" },
      { name: "description", content: "Manage your PROFIRA investment portfolio." },
      { property: "og:title", content: "Portfolio — PROFIRA" },
      { property: "og:description", content: "Manage your PROFIRA investment portfolio." },
    ],
  }),
  component: PortfolioPage,
});

const BG = "#070809";
const SURFACE = "#14151A";
const ACCENT = "#D61F3A";
const SECONDARY_TEXT = "#B8B8B8";
const SUCCESS = "#22C55E";
const DANGER = "#EF4444";

const TIMEFRAMES = ["1D", "1W", "1M", "6M", "1Y", "All"] as const;
type Timeframe = (typeof TIMEFRAMES)[number];

// seed line series per timeframe (normalized 0..1, drawn in SVG)
const SERIES: Record<Timeframe, number[]> = {
  "1D": [0.55, 0.5, 0.58, 0.62, 0.6, 0.66, 0.7, 0.72, 0.78, 0.82, 0.88, 0.92],
  "1W": [0.4, 0.45, 0.42, 0.5, 0.55, 0.6, 0.72, 0.78, 0.82, 0.9],
  "1M": [
    0.32, 0.28, 0.34, 0.3, 0.38, 0.36, 0.42, 0.4, 0.46, 0.5, 0.48, 0.54, 0.52,
    0.58, 0.62, 0.6, 0.66, 0.64, 0.7, 0.74, 0.72, 0.78, 0.82, 0.86, 0.9, 0.94,
  ],
  "6M": [0.1, 0.18, 0.22, 0.3, 0.28, 0.4, 0.5, 0.46, 0.6, 0.7, 0.82, 0.9],
  "1Y": [0.05, 0.12, 0.2, 0.18, 0.3, 0.42, 0.4, 0.55, 0.6, 0.72, 0.8, 0.92],
  All: [0.02, 0.1, 0.18, 0.28, 0.4, 0.55, 0.62, 0.75, 0.88, 0.96],
};

function PortfolioPage() {
  return (
    <main
      className="min-h-[100dvh] w-full font-sans"
      style={{ background: BG, color: "#FFFFFF" }}
    >
      <div className="mx-auto w-full max-w-[520px] px-5 pt-6 pb-32">
        <Header />
        <Greeting />
        <ValueCard />
        <QuickActions />
        <PerformanceCard />
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

function Greeting() {
  return (
    <div className="mt-6">
      <p className="text-sm" style={{ color: SECONDARY_TEXT }}>
        Good Morning, Aryan
      </p>
      <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight text-white">
        Manage Your Portfolio
      </h1>
    </div>
  );
}

function ValueCard() {
  return (
    <div
      className="relative mt-5 overflow-hidden rounded-2xl border border-white/[0.06] p-5"
      style={{
        background: SURFACE,
      }}
    >
      {/* burgundy glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 100% 50%, rgba(214,31,58,0.35) 0%, rgba(214,31,58,0.10) 35%, transparent 65%)",
        }}
      />
      {/* growth sparkline on the right edge */}
      <svg
        viewBox="0 0 200 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-y-0 right-0 h-full w-[58%] opacity-90"
      >
        <defs>
          <linearGradient id="valArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENT} stopOpacity="0.35" />
            <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0,78 L18,70 L34,74 L52,60 L70,64 L90,52 L108,56 L126,40 L146,44 L168,28 L186,32 L200,18"
          fill="none"
          stroke={ACCENT}
          strokeWidth="1.6"
        />
        <path
          d="M0,78 L18,70 L34,74 L52,60 L70,64 L90,52 L108,56 L126,40 L146,44 L168,28 L186,32 L200,18 L200,100 L0,100 Z"
          fill="url(#valArea)"
        />
      </svg>

      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[13px]" style={{ color: SECONDARY_TEXT }}>
            Total Portfolio Value
          </span>
          <Eye className="h-3.5 w-3.5" style={{ color: SECONDARY_TEXT }} strokeWidth={1.5} />
        </div>
        <div
          className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{ background: "rgba(214,31,58,0.18)", color: ACCENT }}
        >
          <ArrowUpRight className="h-3 w-3" strokeWidth={2.2} />
          3.20%
        </div>
      </div>

      <div className="relative mt-2 flex items-baseline gap-0.5">
        <span className="text-[30px] font-semibold tracking-tight">₹4,80,000</span>
        <span className="text-[18px] font-medium" style={{ color: SECONDARY_TEXT }}>
          .00
        </span>
      </div>

      <div className="relative mt-3">
        <p className="text-[12px]" style={{ color: SECONDARY_TEXT }}>
          Today's Change
        </p>
        <div
          className="mt-0.5 flex items-center gap-1 text-[13px] font-medium"
          style={{ color: SUCCESS }}
        >
          + ₹14,800.00 (3.20%)
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}

type QA = { label: string; Icon: typeof Download };
const ACTIONS: QA[] = [
  { label: "Download\nAgreement", Icon: Download },
  { label: "Download\nInvoice", Icon: FileDown },
  { label: "Invest\nMore", Icon: PlusCircle },
  { label: "Withdraw", Icon: ArrowUp },
];

function QuickActions() {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      {ACTIONS.map(({ label, Icon }) => (
        <button
          key={label}
          type="button"
          className="flex items-center gap-3 rounded-xl border border-white/[0.06] p-3 text-left transition active:scale-[0.98]"
          style={{ background: SURFACE }}
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ background: "rgba(214,31,58,0.18)" }}
          >
            <Icon className="h-4 w-4" style={{ color: ACCENT }} strokeWidth={1.8} />
          </span>
          <span className="whitespace-pre-line text-[13px] font-medium leading-tight text-white">
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}

function PerformanceCard() {
  const [tf, setTf] = useState<Timeframe>("1M");
  const data = SERIES[tf];

  const { pathLine, pathArea, endX, endY } = useMemo(() => {
    const W = 320;
    const H = 160;
    const pad = { top: 8, right: 8, bottom: 20, left: 8 };
    const innerW = W - pad.left - pad.right;
    const innerH = H - pad.top - pad.bottom;
    const n = data.length;
    const pts = data.map((v, i) => {
      const x = pad.left + (i / (n - 1)) * innerW;
      const y = pad.top + (1 - v) * innerH;
      return [x, y] as const;
    });
    const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${(pad.top + innerH).toFixed(1)} L${pts[0][0].toFixed(1)},${(pad.top + innerH).toFixed(1)} Z`;
    return { pathLine: line, pathArea: area, endX: pts[pts.length - 1][0], endY: pts[pts.length - 1][1] };
  }, [data]);

  const yLabels = ["5.0L", "4.5L", "4.0L", "3.5L"];
  const xLabels = ["22 May", "29 May", "5 Jun", "12 Jun", "19 Jun"];

  return (
    <div
      className="mt-5 overflow-hidden rounded-2xl border border-white/[0.06] p-4"
      style={{ background: SURFACE }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-white">Portfolio Performance</h2>
        <button className="flex items-center gap-0.5 text-[12px] font-medium" style={{ color: ACCENT }}>
          View All <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-1">
        {TIMEFRAMES.map((t) => {
          const active = tf === t;
          return (
            <button
              key={t}
              onClick={() => setTf(t)}
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition"
              style={{
                background: active ? "rgba(214,31,58,0.18)" : "transparent",
                color: active ? ACCENT : SECONDARY_TEXT,
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      <div className="relative mt-3">
        <div className="absolute inset-y-0 left-0 flex flex-col justify-between py-1 text-[10px]" style={{ color: SECONDARY_TEXT }}>
          {yLabels.map((l) => <span key={l}>{l}</span>)}
        </div>
        <div className="ml-7">
          <svg viewBox="0 0 320 160" className="block h-[160px] w-full">
            <defs>
              <linearGradient id="perfArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ACCENT} stopOpacity="0.35" />
                <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((p) => (
              <line key={p} x1="0" x2="320" y1={8 + p * 132} y2={8 + p * 132} stroke="rgba(255,255,255,0.06)" strokeDasharray="2 4" />
            ))}
            <path d={pathArea} fill="url(#perfArea)" />
            <path d={pathLine} fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
            <circle cx={endX} cy={endY} r="4" fill={ACCENT} />
            <circle cx={endX} cy={endY} r="7" fill="none" stroke={ACCENT} strokeOpacity="0.35" strokeWidth="1.5" />
          </svg>
        </div>
        <div className="ml-7 mt-1 flex justify-between text-[10px]" style={{ color: SECONDARY_TEXT }}>
          {xLabels.map((l) => <span key={l}>{l}</span>)}
        </div>
        <div
          className="absolute right-2 top-1 rounded-md px-2 py-1 text-right"
          style={{ background: "rgba(20,21,26,0.9)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="text-[11px] font-semibold text-white">₹4,80,000</div>
          <div className="text-[9px]" style={{ color: SECONDARY_TEXT }}>20 Jun</div>
        </div>
      </div>
    </div>
  );
}

type Asset = {
  name: string;
  category: string;
  glyph: string;
  bg: string;
  price: string;
  change: number;
  spark: number[];
};

const ASSETS: Asset[] = [
  { name: "Gold (XAU/USD)", category: "Commodities", glyph: "Au", bg: "#B7841F", price: "2,365.20", change: 0.84, spark: [0.4, 0.55, 0.5, 0.7, 0.6, 0.78, 0.65, 0.72, 0.6, 0.68] },
  { name: "EUR/USD", category: "Forex", glyph: "€", bg: "#1F8F4E", price: "1.0824", change: 0.35, spark: [0.3, 0.35, 0.32, 0.45, 0.5, 0.48, 0.6, 0.62, 0.7, 0.75] },
  { name: "GBP/USD", category: "Forex", glyph: "£", bg: "#1E5BD6", price: "1.2657", change: -0.21, spark: [0.7, 0.65, 0.72, 0.6, 0.62, 0.55, 0.5, 0.52, 0.45, 0.4] },
  { name: "USD/JPY", category: "Forex", glyph: "$", bg: "#1E5BD6", price: "156.42", change: 0.12, spark: [0.35, 0.42, 0.38, 0.5, 0.48, 0.55, 0.5, 0.62, 0.58, 0.66] },
];

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const W = 90;
  const H = 32;
  const n = data.length;
  const d = data
    .map((v, i) => {
      const x = (i / (n - 1)) * W;
      const y = (1 - v) * H;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-8 w-[90px]">
      <path d={d} fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function MarketWatch() {
  return (
    <div className="mt-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-semibold text-white">Market Watch</h2>
        <button className="flex items-center gap-0.5 text-[12px] font-medium" style={{ color: ACCENT }}>
          View All <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div
        className="mt-3 overflow-hidden rounded-2xl border border-white/[0.06]"
        style={{ background: SURFACE }}
      >
        {ASSETS.map((a, i) => {
          const positive = a.change >= 0;
          return (
            <div
              key={a.name}
              className={`flex items-center gap-3 px-4 py-3 ${i < ASSETS.length - 1 ? "border-b border-white/[0.05]" : ""}`}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-white"
                style={{ background: a.bg }}
              >
                {a.glyph}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-white">{a.name}</div>
                <div className="text-[11px]" style={{ color: SECONDARY_TEXT }}>
                  {a.category}
                </div>
              </div>
              <Sparkline data={a.spark} color={positive ? SUCCESS : DANGER} />
              <div className="ml-1 text-right">
                <div className="text-[13px] font-semibold text-white">{a.price}</div>
                <div
                  className="mt-0.5 flex items-center justify-end gap-0.5 text-[11px] font-semibold"
                  style={{ color: positive ? SUCCESS : DANGER }}
                >
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
