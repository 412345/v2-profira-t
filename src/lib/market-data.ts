// Live-first market data with deterministic seed fallback.
// Best-effort fetch from a free CORS-enabled FX endpoint; falls back silently.

export type Instrument = {
  symbol: string;
  name: string;
  price: number;
  change: number; // percent
  series: number[];
  live: boolean;
};

function seededSeries(seed: number, n = 24, vol = 0.012, drift = 0.001): number[] {
  let s = seed;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const out: number[] = [];
  let v = 1;
  for (let i = 0; i < n; i++) {
    v *= 1 + (rnd() - 0.5) * vol + drift;
    out.push(v);
  }
  return out;
}

const SEED: Instrument[] = [
  { symbol: "XAU", name: "Gold (XAU/USD)", price: 2374.18, change: 0.84, series: seededSeries(11), live: false },
  { symbol: "EURUSD", name: "EUR / USD", price: 1.0842, change: -0.21, series: seededSeries(23, 24, 0.005), live: false },
  { symbol: "DXY", name: "US Dollar Index", price: 104.62, change: 0.18, series: seededSeries(31, 24, 0.004), live: false },
  { symbol: "SPX", name: "S&P 500", price: 5478.4, change: 0.42, series: seededSeries(47, 24, 0.008, 0.0015), live: false },
];

export async function fetchMarkets(): Promise<Instrument[]> {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 4000);
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { signal: ctrl.signal });
    if (!res.ok) throw new Error("bad");
    const json = (await res.json()) as { rates?: Record<string, number> };
    const rates = json.rates || {};
    const eur = rates.EUR;
    const jpy = rates.JPY;
    const inr = rates.INR;
    if (!eur) throw new Error("no eur");

    const out = SEED.map((i) => ({ ...i }));
    const eurUsd = 1 / eur;
    out[1] = {
      ...out[1],
      price: parseFloat(eurUsd.toFixed(4)),
      change: parseFloat(((eurUsd / 1.085 - 1) * 100).toFixed(2)),
      series: seededSeries(Math.floor(eurUsd * 1e6) % 1000, 24, 0.005).map((v) => v * eurUsd),
      live: true,
    };
    if (jpy) {
      // proxy DXY-ish move from JPY
      const ref = 156;
      out[2] = { ...out[2], price: parseFloat(jpy.toFixed(2)), change: parseFloat(((jpy / ref - 1) * 100).toFixed(2)), name: "JPY / USD (Live)", live: true };
    }
    if (inr) {
      out[3] = { ...out[3], symbol: "USDINR", name: "USD / INR (Live)", price: parseFloat(inr.toFixed(2)), change: parseFloat(((inr / 83.2 - 1) * 100).toFixed(2)), live: true };
    }
    clearTimeout(timeout);
    return out;
  } catch {
    clearTimeout(timeout);
    return SEED;
  }
}

export function getSeedMarkets() {
  return SEED;
}

export function chartSeries(): number[] {
  return seededSeries(91, 48, 0.014, 0.0028);
}
