import { useId } from "react";

export function HeroBackdrop() {
  const gridId = useId().replace(/:/g, "");
  const areaId = `area-${gridId}`;
  const lineId = `line-${gridId}`;
  const globeId = `globe-${gridId}`;

  // Build a smooth-ish line path
  const points = [12, 22, 18, 32, 28, 26, 38, 40, 30, 48, 58, 52, 64, 72, 60, 78, 88, 82, 76, 90, 96, 88];
  const w = 400;
  const h = 160;
  const stepX = w / (points.length - 1);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${(i * stepX).toFixed(1)} ${(h - (p / 100) * h).toFixed(1)}`)
    .join(" ");
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        maskImage: "linear-gradient(180deg, black 0%, black 70%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(180deg, black 0%, black 70%, transparent 100%)",
      }}
    >
      {/* Burgundy wash */}
      <div
        className="absolute -top-20 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(120,22,46,0.55) 0%, rgba(90,16,34,0.25) 35%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Dotted grid */}
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={gridId} width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.7" fill="rgba(231,201,138,0.18)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${gridId})`} opacity="0.55" />
      </svg>

      {/* Wireframe globe (back-right) */}
      <div className="absolute -right-16 top-6 h-[280px] w-[280px] opacity-[0.22] globe-spin">
        <svg viewBox="0 0 200 200" className="h-full w-full">
          <defs>
            <radialGradient id={globeId} cx="40%" cy="40%" r="70%">
              <stop offset="0%" stopColor="#E7C98A" stopOpacity="0.5" />
              <stop offset="60%" stopColor="#5A1022" stopOpacity="0.15" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="92" fill={`url(#${globeId})`} />
          <circle cx="100" cy="100" r="92" fill="none" stroke="rgba(231,201,138,0.6)" strokeWidth="0.6" />
          {/* Latitudes */}
          {[20, 40, 60, 80].map((r) => (
            <ellipse key={r} cx="100" cy="100" rx="92" ry={r} fill="none" stroke="rgba(231,201,138,0.4)" strokeWidth="0.4" />
          ))}
          {/* Longitudes */}
          {[15, 35, 55, 75].map((r) => (
            <ellipse key={r} cx="100" cy="100" rx={r} ry="92" fill="none" stroke="rgba(231,201,138,0.4)" strokeWidth="0.4" />
          ))}
          <line x1="100" y1="8" x2="100" y2="192" stroke="rgba(231,201,138,0.5)" strokeWidth="0.5" />
        </svg>
      </div>

      {/* Market chart (bottom) */}
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 h-[55%] w-full chart-float"
      >
        <defs>
          <linearGradient id={areaId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E7C98A" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#E7C98A" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={lineId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#C89A63" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#E7C98A" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#5A1022" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${areaId})`} />
        <path
          d={path}
          fill="none"
          stroke={`url(#${lineId})`}
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="chart-draw"
        />
      </svg>

      {/* Top hairline */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(231,201,138,0.25)] to-transparent" />
    </div>
  );
}
