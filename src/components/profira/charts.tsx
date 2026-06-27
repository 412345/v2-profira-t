import { useId } from "react";

export function Sparkline({
  data,
  width = 80,
  height = 28,
  positive = true,
}: {
  data: number[];
  width?: number;
  height?: number;
  positive?: boolean;
}) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const path = data
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * height;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const color = positive ? "#E7C98A" : "#b04060";
  const uid = useId();
  const id = `sp-${uid.replace(/:/g, "")}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L${width},${height} L0,${height} Z`} fill={`url(#${id})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LineChart({
  data,
  width = 640,
  height = 200,
}: {
  data: number[];
  width?: number;
  height?: number;
}) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 8;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => [pad + i * step, pad + h - ((v - min) / range) * h] as const);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <defs>
        <linearGradient id="lc-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#E7C98A" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#5A1022" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lc-line" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#C89A63" />
          <stop offset="100%" stopColor="#E7C98A" />
        </linearGradient>
      </defs>
      {/* gridlines */}
      {[0.25, 0.5, 0.75].map((p) => (
        <line key={p} x1={pad} x2={width - pad} y1={pad + h * p} y2={pad + h * p} stroke="rgba(231,201,138,0.07)" />
      ))}
      <path d={`${path} L${width - pad},${height - pad} L${pad},${height - pad} Z`} fill="url(#lc-fill)" />
      <path d={path} fill="none" stroke="url(#lc-line)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* end dot */}
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3.5" fill="#E7C98A" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="7" fill="#E7C98A" opacity="0.25" />
    </svg>
  );
}

export function RadialGauge({
  value,
  label,
  suffix = "%",
}: {
  value: number;
  label: string;
  suffix?: string;
}) {
  const r = 32;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const off = c - (pct / 100) * c;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width="86" height="86" viewBox="0 0 86 86">
          <circle cx="43" cy="43" r={r} fill="none" stroke="rgba(231,201,138,0.12)" strokeWidth="4" />
          <circle
            cx="43"
            cy="43"
            r={r}
            fill="none"
            stroke="url(#g-grad)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={off}
            transform="rotate(-90 43 43)"
            style={{ transition: "stroke-dashoffset 1.2s ease" }}
          />
          <defs>
            <linearGradient id="g-grad" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#5A1022" />
              <stop offset="100%" stopColor="#E7C98A" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-display text-lg text-[var(--color-champagne)]">
          {pct.toFixed(0)}
          <span className="text-xs ml-0.5">{suffix}</span>
        </div>
      </div>
      <div className="text-[10px] tracking-[0.18em] uppercase text-white/55 text-center">{label}</div>
    </div>
  );
}

export function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((a, b) => a + b.value, 0);
  const r = 58;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(231,201,138,0.08)" strokeWidth="14" />
      {segments.map((s, i) => {
        const len = (s.value / total) * c;
        const dash = `${len} ${c - len}`;
        const off = -acc;
        acc += len;
        return (
          <circle
            key={i}
            cx="80"
            cy="80"
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="14"
            strokeDasharray={dash}
            strokeDashoffset={off}
            transform="rotate(-90 80 80)"
            strokeLinecap="butt"
          />
        );
      })}
      <text x="80" y="76" textAnchor="middle" className="fill-[#E7C98A]" style={{ font: "500 22px var(--font-display)" }}>
        100%
      </text>
      <text x="80" y="94" textAnchor="middle" className="fill-white/55" style={{ font: "500 9px var(--font-sans)", letterSpacing: "0.2em" }}>
        ALLOCATED
      </text>
    </svg>
  );
}
