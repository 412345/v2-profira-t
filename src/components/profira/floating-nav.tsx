import { Link, useRouterState } from "@tanstack/react-router";
import { Home, PieChart, Sparkles } from "lucide-react";

const tabs = [
  { to: "/home", label: "Home", Icon: Home },
  { to: "/portfolio", label: "Portfolio", Icon: PieChart },
  { to: "/about", label: "About", Icon: Sparkles },
] as const;

export function FloatingNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname === "/") return null;

  return (
    <nav
      className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2"
      aria-label="Primary"
    >
      <div
        className="glass-panel flex items-center gap-1 rounded-full px-2 py-2"
        style={{
          width: "min(92vw, 380px)",
          backdropFilter: "blur(32px) saturate(160%)",
        }}
      >
        {tabs.map(({ to, label, Icon }) => {
          const active = pathname === to || pathname.startsWith(to + "/");
          return (
            <Link
              key={to}
              to={to}
              className="relative flex flex-1 flex-col items-center gap-1 rounded-full px-3 py-2 transition active:scale-[0.96]"
            >
              {active && (
                <span className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-[var(--color-champagne)] shadow-[0_0_12px_rgba(231,201,138,0.7)]" />
              )}
              <Icon
                className={`h-4 w-4 transition ${active ? "text-[var(--color-champagne)]" : "text-white/60"}`}
                strokeWidth={1.5}
              />
              <span
                className={`text-[10px] font-medium tracking-[0.18em] uppercase transition ${
                  active ? "text-[var(--color-champagne)]" : "text-white/55"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
