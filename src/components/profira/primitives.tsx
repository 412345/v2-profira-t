import { useEffect, useRef, useState, type ReactNode, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function GlassPanel({
  className,
  children,
  as: As = "div",
  ...rest
}: HTMLAttributes<HTMLDivElement> & { as?: any }) {
  return (
    <As className={cn("glass-panel glass-panel-lg", className)} {...rest}>
      {children}
    </As>
  );
}

export function PremiumButton({
  children,
  variant = "primary",
  className,
  ...rest
}: {
  variant?: "primary" | "outline" | "ghost";
  className?: string;
  children: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base =
    "relative inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] tracking-[0.14em] uppercase font-medium transition active:scale-[0.98] overflow-hidden";

  if (variant === "primary") {
    return (
      <button
        className={cn(
          base,
          "text-[#0B0C10] burgundy-glow",
          className,
        )}
        style={{
          background:
            "linear-gradient(135deg, #E7C98A 0%, #C89A63 55%, #8a6a3f 100%)",
        }}
        {...rest}
      >
        <span className="relative z-10">{children}</span>
      </button>
    );
  }
  if (variant === "outline") {
    return (
      <button
        className={cn(
          base,
          "border border-[rgba(231,201,138,0.4)] text-[var(--color-champagne)] hover:bg-[rgba(231,201,138,0.06)]",
          className,
        )}
        {...rest}
      >
        {children}
      </button>
    );
  }
  return (
    <button className={cn(base, "text-white/70 hover:text-white", className)} {...rest}>
      {children}
    </button>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("eyebrow", className)}>{children}</p>;
}

export function GoldRing({ children, size = 44 }: { children: ReactNode; size?: number }) {
  return (
    <div
      className="relative flex items-center justify-center rounded-full"
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0 rounded-full ring-gold"
        style={{ padding: 1 }}
      >
        <div className="h-full w-full rounded-full bg-[#0c0d12]" />
      </div>
      <div className="relative text-[var(--color-champagne)]">{children}</div>
    </div>
  );
}

export function HeroOrb({ size = 280, crescent = false }: { size?: number; crescent?: boolean }) {
  return (
    <div
      className="relative orb-float"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* Outer ring */}
      <div className="absolute inset-0 ring-spin">
        <svg viewBox="0 0 200 200" className="h-full w-full">
          <defs>
            <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#E7C98A" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#C89A63" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#E7C98A" stopOpacity="0.85" />
            </linearGradient>
          </defs>
          <ellipse
            cx="100"
            cy="100"
            rx="92"
            ry="92"
            fill="none"
            stroke="url(#ring-grad)"
            strokeWidth="0.8"
          />
          <ellipse
            cx="100"
            cy="100"
            rx="78"
            ry="32"
            fill="none"
            stroke="rgba(231,201,138,0.35)"
            strokeWidth="0.6"
            transform="rotate(-18 100 100)"
          />
        </svg>
      </div>
      {/* Sphere */}
      <div
        className="absolute inset-[10%] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 32% 28%, #b04060 0%, #5A1022 30%, #2A0F17 60%, #0c0509 100%)",
          boxShadow:
            "inset 0 0 60px rgba(0,0,0,0.6), inset 12px -8px 60px rgba(231,201,138,0.18), 0 0 80px -10px rgba(120,22,46,0.7)",
        }}
      />
      {/* Specular highlight */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          top: "18%",
          left: "22%",
          width: "30%",
          height: "20%",
          background:
            "radial-gradient(ellipse at center, rgba(255,225,180,0.45), transparent 70%)",
          filter: "blur(6px)",
        }}
      />
      {crescent && (
        <div
          className="absolute inset-[10%] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 75% 50%, transparent 55%, rgba(0,0,0,0.85) 60%)",
          }}
        />
      )}
    </div>
  );
}

export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.add("reveal");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

export function useCountUp(target: number, durationMs = 1400, start = true) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, start]);
  return v;
}
