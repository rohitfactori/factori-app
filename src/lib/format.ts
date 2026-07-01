export const fmtInt = (n: number) =>
  new Intl.NumberFormat("en-US").format(Math.round(n));

export const fmtCompact = (n: number) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);

export const fmtUSD = (n: number, frac = 0) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: frac,
    minimumFractionDigits: frac,
  }).format(n);

export const fmtUSDCompact = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);

export const fmtPct = (n: number, frac = 0) => `${(n * 100).toFixed(frac)}%`;

export const fmtMiles = (n: number) => `${n.toFixed(n < 10 ? 1 : 0)} mi`;

/** deterministic pseudo-random in [0,1) from a seed — keeps mock data stable across renders */
export function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
