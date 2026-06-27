import { createFileRoute } from "@tanstack/react-router";
import { Compass, Gem, HandCoins, Hourglass } from "lucide-react";
import { GlassPanel, GoldRing, HeroOrb, PremiumButton, useReveal } from "@/components/profira/primitives";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About PROFIRA — Private Wealth Engineered With Conviction" },
      {
        name: "description",
        content: "PROFIRA is a private wealth platform engineered for clarity, conviction, and consistent income.",
      },
      { property: "og:title", content: "About PROFIRA" },
      { property: "og:description", content: "Private wealth, engineered with conviction." },
    ],
  }),
  component: AboutPage,
});

const cards = [
  { Icon: Compass, title: "Our Philosophy", body: "Wealth compounds quietly. We design strategies that prioritise survival first, growth second, and noise — never." },
  { Icon: Gem, title: "What Sets Us Apart", body: "A union of disciplined systems and human judgement. Every decision is documented, every outcome accountable." },
  { Icon: HandCoins, title: "Our Commitment", body: "Transparent reporting, monthly distributions, and a direct line to the people managing your capital." },
];

function AboutPage() {
  const heroRef = useReveal<HTMLDivElement>();
  return (
    <main className="profira-container pt-10">
      <section ref={heroRef} className="relative overflow-hidden">
        <div className="absolute -top-4 -right-4 opacity-70 pointer-events-none">
          <HeroOrb size={160} crescent />
        </div>
        <p className="eyebrow">The Firm</p>
        <h1 className="text-hero mt-4 max-w-[12ch]">
          About <span className="gold-italic">PROFIRA</span>
        </h1>
        <div className="hairline my-7" />
        <p className="max-w-[42ch] text-white/65 text-[15px] leading-relaxed">
          PROFIRA is a private wealth platform built for a generation of investors who expect
          institutional rigour, transparent reporting, and the quiet confidence of consistent income.
        </p>
      </section>

      <section className="mt-16 space-y-6">
        {cards.map(({ Icon, title, body }) => (
          <GlassPanel key={title}>
            <div className="flex items-start gap-4">
              <GoldRing size={48}>
                <Icon className="h-5 w-5" strokeWidth={1.5} />
              </GoldRing>
              <div className="flex-1">
                <h3 className="font-display text-[22px] text-white">{title}</h3>
                <p className="mt-2 text-[14px] text-white/65 leading-relaxed">{body}</p>
              </div>
            </div>
          </GlassPanel>
        ))}
      </section>

      <section className="mt-12">
        <GlassPanel className="text-center py-14">
          <div className="mx-auto mb-6">
            <GoldRing size={64}>
              <Hourglass className="h-6 w-6" strokeWidth={1.4} />
            </GoldRing>
          </div>
          <p className="eyebrow">In Development</p>
          <h2 className="font-display text-[30px] mt-3">Coming Soon</h2>
          <p className="mt-3 max-w-[34ch] mx-auto text-[13.5px] text-white/55 leading-relaxed">
            New private mandates and concierge offerings will be announced to existing members first.
          </p>
          <div className="mt-7">
            <PremiumButton variant="outline">Notify Me</PremiumButton>
          </div>
        </GlassPanel>
      </section>
    </main>
  );
}
