import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  User,
  ShieldCheck,
  TrendingUp,
  FileText,
  Clock,
  Briefcase,
  LineChart as LineChartIcon,
  Wallet,
  Star,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";

import { CandleChart, HeroCandleBackdrop, MiniSparkline } from "@/components/profira/candles";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "PROFIRA — Modern Investment Platform" },
      {
        name: "description",
        content:
          "Access professionally managed forex and gold investment strategies with transparent monthly reporting and dedicated investor support.",
      },
      { property: "og:title", content: "PROFIRA — Modern Investment Platform" },
      {
        property: "og:description",
        content: "Managed forex and gold strategies with monthly profit distribution.",
      },
    ],
  }),
  component: HomePage,
});

const inr = (n: number) => `₹${new Intl.NumberFormat("en-IN").format(Math.round(n))}`;

const chips = [
  { Icon: Briefcase, label: "Managed Forex Strategies" },
  { Icon: LineChartIcon, label: "Gold Trading Exposure" },
  { Icon: Wallet, label: "Monthly Profit Distribution" },
  { Icon: Clock, label: "24-Hour Onboarding" },
];

const trustCards = [
  { Icon: Briefcase, title: "Managed Trading", body: "Professional strategy execution and portfolio management." },
  { Icon: FileText, title: "Transparent Reporting", body: "Monthly statements and performance reporting." },
  { Icon: ShieldCheck, title: "Capital Management", body: "Structured investment management with investor support." },
];

const whyCards = [
  { Icon: ShieldCheck, title: "Secure Strategy", body: "Professionally managed market strategies." },
  { Icon: FileText, title: "Transparent Reporting", body: "Monthly investor reporting and statements." },
  { Icon: Clock, title: "Fast Onboarding", body: "Applications reviewed within 24 hours." },
];

const reviews = [
  { name: "Rahul Sharma", quote: "Simple onboarding and transparent reporting every single month." },
  { name: "Amit Verma", quote: "The monthly reports are detailed and easy to follow." },
  { name: "Priya Nair", quote: "Consistent returns and a team that actually responds." },
  { name: "Karan Mehta", quote: "Best fintech experience I've had for managed investments." },
];

const ranges = ["1M", "3M", "6M", "1Y", "ALL"] as const;
type Range = (typeof ranges)[number];

function HomePage() {
  const [amount, setAmount] = useState(10000);
  const monthly = useMemo(() => amount * 0.10, [amount]);
  const sixMonth = monthly * 6;
  const [range, setRange] = useState<Range>("1M");
  const candleCount = { "1M": 24, "3M": 32, "6M": 44, "1Y": 56, ALL: 72 }[range];
  const candleSeed = { "1M": 7, "3M": 13, "6M": 19, "1Y": 23, ALL: 29 }[range];

  return (
    <main
      className="min-h-screen font-sans text-white"
      style={{ background: "#070809" }}
    >
      {/* Sticky header */}
      <header
        className="sticky top-0 z-30 backdrop-blur"
        style={{ background: "rgba(7,8,9,0.85)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="mx-auto flex h-14 max-w-[640px] items-center justify-between px-5">
          <img src="/profira-logo.png" alt="PROFIRA" className="h-7 w-auto" />
          <div className="flex items-center gap-2">
            <button
              aria-label="Notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/80 hover:text-white"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full" style={{ background: "#D61F3A" }} />
            </button>
            <button
              aria-label="Profile"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/80 hover:text-white"
            >
              <User className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[640px] px-5 pb-24 pt-5 space-y-5">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl">
          <div className="pointer-events-none absolute inset-0">
            <HeroCandleBackdrop />
          </div>
          <div className="relative py-6">
            <h1 className="font-sans text-[34px] sm:text-[40px] font-extrabold leading-[1.05] tracking-tight">
              START WITH ₹10,000 &amp;
              <br />
              GET 60% RETURNS
              <br />
              <span style={{ color: "#D61F3A" }}>IN 6 MONTHS.</span>
            </h1>
            <p className="mt-4 max-w-[36ch] text-[14px] leading-relaxed" style={{ color: "#B8B8B8" }}>
              Access professionally managed forex and gold investment strategies with transparent monthly reporting and dedicated investor support.
            </p>
          </div>
        </section>

        {/* Primary CTA */}
        <button
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold text-white transition active:scale-[0.99]"
          style={{
            background: "linear-gradient(135deg, #D61F3A 0%, #FF3355 100%)",
            boxShadow: "0 12px 32px -12px rgba(214,31,58,0.65)",
          }}
        >
          Start Investing <ArrowRight className="h-4 w-4" />
        </button>

        {/* Feature chips */}
        <section className="grid grid-cols-2 gap-3">
          {chips.map(({ Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-2xl border p-3"
              style={{ background: "#14151A", borderColor: "rgba(255,255,255,0.05)" }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "rgba(214,31,58,0.14)", color: "#D61F3A" }}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-[13px] font-medium leading-tight">{label}</span>
            </div>
          ))}
        </section>

        {/* Strategy Performance */}
        <section
          className="relative overflow-hidden rounded-2xl border p-5"
          style={{ background: "#14151A", borderColor: "rgba(255,255,255,0.05)" }}
        >
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full"
            style={{ background: "radial-gradient(closest-side, rgba(34,197,94,0.18), transparent)" }}
          />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[12px]" style={{ color: "#B8B8B8" }}>
                Average Monthly Return
              </div>
              <div className="mt-1 text-[40px] font-extrabold leading-none tracking-tight">+10.0%</div>
              <div className="mt-2 text-[12px]" style={{ color: "#B8B8B8" }}>
                Last 12 Months Performance
              </div>
              <span
                className="mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium"
                style={{ background: "rgba(34,197,94,0.14)", color: "#22C55E" }}
              >
                <TrendingUp className="h-3 w-3" /> Trending Up
              </span>
            </div>
            <div className="shrink-0">
              <MiniSparkline width={130} height={56} />
            </div>
          </div>
        </section>

        {/* Performance chart */}
        <section
          className="rounded-2xl border p-4"
          style={{ background: "#14151A", borderColor: "rgba(255,255,255,0.05)" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[14px] font-semibold">Strategy Performance</h3>
            <div className="flex gap-1">
              {ranges.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition"
                  style={
                    range === r
                      ? { background: "#D61F3A", color: "#FFFFFF" }
                      : { background: "transparent", color: "#B8B8B8" }
                  }
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <CandleChart count={candleCount} seed={candleSeed} height={180} />
        </section>

        {/* Why Investors Choose PROFIRA */}
        <section>
          <h2 className="mb-3 text-[16px] font-bold">Why Investors Choose PROFIRA</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {trustCards.map(({ Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border p-4"
                style={{ background: "#14151A", borderColor: "rgba(255,255,255,0.05)" }}
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: "rgba(214,31,58,0.14)", color: "#D61F3A" }}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <h4 className="mt-3 text-[14px] font-semibold">{title}</h4>
                <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: "#B8B8B8" }}>
                  {body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Returns calculator */}
        <section
          className="relative overflow-hidden rounded-2xl border p-5"
          style={{
            background:
              "linear-gradient(180deg, rgba(20,21,26,0.95) 0%, rgba(20,21,26,0.75) 100%)",
            borderColor: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            className="pointer-events-none absolute -left-12 -top-12 h-44 w-44 rounded-full"
            style={{ background: "radial-gradient(closest-side, rgba(214,31,58,0.16), transparent)" }}
          />
          <h3 className="relative text-[15px] font-bold">Calculate Your Monthly Returns</h3>

          <div className="relative mt-5 flex items-center justify-between">
            <span className="text-[12px]" style={{ color: "#B8B8B8" }}>
              Investment Amount
            </span>
            <span className="text-[22px] font-extrabold tracking-tight">{inr(amount)}</span>
          </div>

          <div className="relative mt-3">
            <Slider
              value={[amount]}
              min={10000}
              max={5000000}
              step={10000}
              onValueChange={(v) => setAmount(v[0])}
            />
            <div className="mt-2 flex justify-between text-[11px]" style={{ color: "#B8B8B8" }}>
              <span>₹10,000</span>
              <span>₹50,00,000</span>
            </div>
          </div>

          <div className="relative mt-5 grid grid-cols-2 gap-3">
            <div
              className="rounded-xl border p-3"
              style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}
            >
              <div className="text-[11px]" style={{ color: "#B8B8B8" }}>
                Monthly Return
              </div>
              <div className="mt-1 text-[20px] font-extrabold" style={{ color: "#D61F3A" }}>
                {inr(monthly)}
              </div>
              <div className="mt-0.5 text-[10px]" style={{ color: "#B8B8B8" }}>
                (10% per month)
              </div>
            </div>
            <div
              className="rounded-xl border p-3"
              style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}
            >
              <div className="text-[11px]" style={{ color: "#B8B8B8" }}>
                6-Month Projection
              </div>
              <div className="mt-1 text-[20px] font-extrabold" style={{ color: "#D61F3A" }}>
                {inr(sixMonth)}
              </div>
              <div className="mt-0.5 text-[10px]" style={{ color: "#B8B8B8" }}>
                (10% per month)
              </div>
            </div>
          </div>
        </section>

        {/* Why PROFIRA */}
        <section className="space-y-3">
          <h2 className="text-[16px] font-bold">Why PROFIRA</h2>
          {whyCards.map(({ Icon, title, body }) => (
            <div
              key={title}
              className="relative flex gap-3 overflow-hidden rounded-2xl border p-4"
              style={{ background: "#14151A", borderColor: "rgba(255,255,255,0.05)" }}
            >
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full"
                style={{ background: "radial-gradient(closest-side, rgba(214,31,58,0.14), transparent)" }}
              />
              <div
                className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "rgba(214,31,58,0.14)", color: "#D61F3A" }}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="relative">
                <h4 className="text-[14px] font-semibold">{title}</h4>
                <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: "#B8B8B8" }}>
                  {body}
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* Investor reviews */}
        <section>
          <h2 className="mb-3 text-[16px] font-bold">What Investors Say</h2>
          <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {reviews.map((r) => (
              <div
                key={r.name}
                className="w-[260px] shrink-0 snap-start rounded-2xl border p-4"
                style={{ background: "#14151A", borderColor: "rgba(255,255,255,0.05)" }}
              >
                <div className="flex gap-0.5" style={{ color: "#D61F3A" }}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <p className="mt-2 text-[13px] leading-relaxed">{r.quote}</p>
                <div className="mt-3 text-[12px] font-semibold">{r.name}</div>
                <div className="text-[11px]" style={{ color: "#B8B8B8" }}>
                  Verified Investor
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section
          className="relative overflow-hidden rounded-2xl border p-5"
          style={{ background: "#14151A", borderColor: "rgba(255,255,255,0.05)" }}
        >
          <div
            className="pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2 text-[120px] font-black leading-none"
            style={{ color: "rgba(214,31,58,0.12)" }}
          >
            P
          </div>
          <div className="relative">
            <h3 className="text-[22px] font-extrabold leading-tight">Ready To Invest?</h3>
            <p className="mt-2 max-w-[34ch] text-[13px] leading-relaxed" style={{ color: "#B8B8B8" }}>
              Join PROFIRA and access professionally managed investment opportunities.
            </p>
            <button
              className="mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold text-white transition active:scale-[0.99]"
              style={{
                background: "linear-gradient(135deg, #D61F3A 0%, #FF3355 100%)",
                boxShadow: "0 12px 32px -12px rgba(214,31,58,0.65)",
              }}
            >
              Become Investor <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
