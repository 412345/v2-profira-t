// Pure SVG candlestick chart for PROFIRA fintech dashboard
// Deterministic seeded data, no external deps.

function seededCandles(count: number, seed = 7) {
  const out: { o: number; h: number; l: number; c: number }[] = [];
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  let price = 100;
  for (let i = 0; i < count; i++) {
    const drift = (rand() - 0.42) * 2.4;
    const o = price;
    const c = Math.max(60, o + drift);
    const h = Math.max(o, c) + rand() * 1.4;
    const l = Math.min(o, c) - rand() * 1.4;
    out.push({ o, h, l, c });
    price = c;
  }
  return out;
}

export function CandleChart({
  count = 32,
  seed = 7,
  height = 180,
}: {
  count?: number;
  seed?: number;
  height?: number;
}) {
  const data = seededCandles(count, seed);
  const width = 640;
  const padX = 8;
  const padY = 12;
  const lo = Math.min(...data.map((d) => d.l));
  const hi = Math.max(...data.map((d) => d.h));
  const range = hi - lo || 1;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const slot = innerW / data.length;
  const cw = Math.max(2, slot * 0.6);

  const y = (v: number) => padY + (1 - (v - lo) / range) * innerH;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
      aria-hidden="true"
    >
      {/* horizontal gridlines */}
      {[0.25, 0.5, 0.75].map((p) => (
        <line
          key={p}
          x1={padX}
          x2={width - padX}
          y1={padY + innerH * p}
          y2={padY + innerH * p}
          stroke="rgba(255,255,255,0.04)"
          strokeDasharray="3 5"
        />
      ))}
      {data.map((d, i) => {
        const x = padX + i * slot + slot / 2;
        const up = d.c >= d.o;
        const color = up ? "#FFFFFF" : "#D61F3A";
        const bodyTop = y(Math.max(d.o, d.c));
        const bodyBot = y(Math.min(d.o, d.c));
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={y(d.h)} y2={y(d.l)} stroke={color} strokeOpacity={0.7} strokeWidth={1} />
            <rect
              x={x - cw / 2}
              y={bodyTop}
              width={cw}
              height={Math.max(1, bodyBot - bodyTop)}
              fill={color}
              fillOpacity={up ? 0.95 : 0.9}
            />
          </g>
        );
      })}
    </svg>
  );
}

// Faint backdrop candles used behind hero copy
export function HeroCandleBackdrop() {
  const data = seededCandles(48, 11);
  const width = 640;
  const height = 260;
  const padY = 16;
  const lo = Math.min(...data.map((d) => d.l));
  const hi = Math.max(...data.map((d) => d.h));
  const range = hi - lo || 1;
  const innerH = height - padY * 2;
  const slot = width / data.length;
  const cw = Math.max(2, slot * 0.55);
  const y = (v: number) => padY + (1 - (v - lo) / range) * innerH;
  const linePath = data
    .map((d, i) => {
      const x = i * slot + slot / 2;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y(d.c).toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="heroGlow" cx="70%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#D61F3A" stopOpacity="0.35" />
          <stop offset="60%" stopColor="#7A0F20" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#070809" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width={width} height={height} fill="url(#heroGlow)" />
      <g opacity="0.18">
        {data.map((d, i) => {
          const x = i * slot + slot / 2;
          const up = d.c >= d.o;
          const color = up ? "#FFFFFF" : "#D61F3A";
          const bodyTop = y(Math.max(d.o, d.c));
          const bodyBot = y(Math.min(d.o, d.c));
          return (
            <g key={i}>
              <line x1={x} x2={x} y1={y(d.h)} y2={y(d.l)} stroke={color} strokeWidth={0.8} />
              <rect x={x - cw / 2} y={bodyTop} width={cw} height={Math.max(1, bodyBot - bodyTop)} fill={color} />
            </g>
          );
        })}
      </g>
      <path d={linePath} fill="none" stroke="#D61F3A" strokeOpacity="0.35" strokeWidth="1.2" />
    </svg>
  );
}

// Compact green sparkline for the performance card
export function MiniSparkline({ width = 120, height = 44 }: { width?: number; height?: number }) {
  const pts = [4, 6, 5, 8, 7, 10, 9, 12, 11, 14, 13, 17];
  const lo = Math.min(...pts);
  const hi = Math.max(...pts);
  const range = hi - lo || 1;
  const slot = width / (pts.length - 1);
  const y = (v: number) => 4 + (1 - (v - lo) / range) * (height - 8);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${(i * slot).toFixed(1)} ${y(p).toFixed(1)}`).join(" ");
  const area = `${path} L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="overflow-visible" style={{ width, height }} aria-hidden="true">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22C55E" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sparkFill)" />
      <path d={path} fill="none" stroke="#22C55E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
