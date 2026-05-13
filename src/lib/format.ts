const COMPACT_NF = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

function toFiniteNumber(value: string | number): number | null {
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) ? n : null;
}

export function formatCompactUSDC(value: string | number): string {
  const n = toFiniteNumber(value);
  if (n === null) return "0 USDC";
  return `${COMPACT_NF.format(n)} USDC`;
}

export function formatCompactToken(
  value: string | number,
  label: string,
): string {
  const n = toFiniteNumber(value);
  if (n === null) return `0 ${label}`;
  return `${COMPACT_NF.format(n)} ${label}`;
}
