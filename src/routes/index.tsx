import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, ArrowRight } from "lucide-react";
import { WaitlistDialog } from "@/components/waitlist-dialog";



export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PROFIRA — 100% Secured & Guaranteed Profit" },
      {
        name: "description",
        content:
          "Start investing from ₹10,000 with professionally managed forex and gold investment strategies designed for consistent monthly returns.",
      },
      { property: "og:title", content: "PROFIRA — 100% Secured & Guaranteed Profit" },
      {
        property: "og:description",
        content:
          "Access professionally managed market strategies through a simple investment.",
      },
    ],
  }),
  component: Waitlist,
});

function Waitlist() {
  const [open, setOpen] = useState(false);
  return (

    <div className="fixed inset-0 overflow-hidden bg-black font-sans text-white">
      {/* Background: deep black + soft red ambient from top-right */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(80% 60% at 95% 0%, rgba(220,38,38,0.42) 0%, rgba(220,38,38,0.12) 30%, transparent 65%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 40% at 50% 110%, rgba(220,38,38,0.18) 0%, transparent 70%)",
          }}
        />
      </div>

      <main
        className="relative mx-auto flex h-[100dvh] w-full max-w-[480px] flex-col px-5"
        style={{
          paddingTop: "max(env(safe-area-inset-top), 14px)",
          paddingBottom: "max(env(safe-area-inset-bottom), 18px)",
        }}
      >
        {/* Header — ~10% */}
        <header className="flex shrink-0 items-center justify-between" style={{ height: "10%" }}>
          <img
            src="/profira-logo.png"
            alt="PROFIRA"
            className="h-6 w-auto select-none"
            draggable={false}
          />
          <Link
            to="/home"
            className="group flex items-center gap-1.5 rounded-full border border-white/35 bg-white/[0.03] px-3.5 py-1.5 text-[11px] font-medium tracking-wide text-white/90 backdrop-blur-sm transition hover:border-white/60 hover:bg-white/[0.07]"
          >
            Enter Platform
            <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" strokeWidth={2} />
          </Link>
        </header>

        {/* Hero — flex-1, card artwork */}
        <section className="relative flex min-h-0 flex-1 items-center justify-center">
          {/* soft red glow behind card */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(55% 45% at 55% 50%, rgba(220,38,38,0.28) 0%, transparent 70%)",
            }}
          />
          <img
            src="/profira-card-hero.png"
            alt="PROFIRA card"
            className="relative z-10 h-full max-h-full w-auto object-contain animate-[float_6s_ease-in-out_infinite]"
            draggable={false}
          />
        </section>

        {/* Copy — ~18% */}
        <section className="shrink-0 pt-2" style={{ minHeight: "18%" }}>
          <h1
            className="font-sans font-semibold uppercase tracking-tight text-white"
            style={{ fontSize: "clamp(26px, 8vw, 34px)", lineHeight: 1.08, letterSpacing: "-0.01em" }}
          >
            100% Secured &amp;
            <br />
            Guaranteed Profit.
            <br />
            Invest Now.
          </h1>
          <p
            className="mt-3 max-w-[34ch] text-sm leading-relaxed"
            style={{ color: "#C8C8C8" }}
          >
            Start investing from ₹10,000 with professionally managed forex and gold investment strategies designed for consistent monthly returns.
          </p>
        </section>

        {/* CTAs — ~22% */}
        <section className="shrink-0 pt-3" style={{ minHeight: "20%" }}>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-[15px] font-semibold text-black transition active:scale-[0.99]"
            >
              Join Waitlist
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" strokeWidth={2.25} />
            </button>
            <Link
              to="/signin"
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/55 bg-transparent text-[15px] font-medium text-white transition hover:bg-white/[0.04] active:scale-[0.99]"
            >
              Already a customer? Sign in
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" strokeWidth={2} />
            </Link>
          </div>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-white/50">
            <Lock className="h-3 w-3" strokeWidth={1.75} />
            Applications reviewed within 24 hours
          </p>
        </section>
      </main>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
      <WaitlistDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

