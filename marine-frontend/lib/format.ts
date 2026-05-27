// Always render the Nigerian Naira (₦) symbol explicitly — Intl's en-NG locale
// data isn't reliable across all runtimes (sometimes renders "NGN 1,000.00").
// Using "decimal" style + manual symbol keeps it consistent.
const fmt2 = new Intl.NumberFormat("en-NG", {
  style: "decimal",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const fmt0 = new Intl.NumberFormat("en-NG", {
  style: "decimal",
  maximumFractionDigits: 0,
});

export const NAIRA = "₦";

export function ngn(value: number): string {
  if (!Number.isFinite(value)) return `${NAIRA}0.00`;
  const sign = value < 0 ? "-" : "";
  return `${sign}${NAIRA}${fmt2.format(Math.abs(value))}`;
}

export function ngnShort(value: number): string {
  if (!Number.isFinite(value)) return `${NAIRA}0`;
  const sign = value < 0 ? "-" : "";
  return `${sign}${NAIRA}${fmt0.format(Math.abs(value))}`;
}
