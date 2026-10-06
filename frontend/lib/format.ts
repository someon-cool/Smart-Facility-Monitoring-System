/**
 * Shared formatters for the Smart Facility Monitor.
 *
 * Date style: "21 Jan", "21 Jan, 14:30", "21 Jan 2024, 14:30"
 * Number style: en-IN (1,20,431)
 * Currency: ₹ via Intl, INR, no decimals
 *
 * The dataset is a simulated week (Jan 15–21 2024).
 * Never compute "x hours ago" from the real clock — use absolute times
 * or relative to the dataset end timestamp.
 */

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function toDate(iso: string | Date): Date {
  return typeof iso === "string" ? new Date(iso) : iso;
}

/** "21 Jan" */
export function formatDate(iso: string | Date): string {
  const d = toDate(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** "21 Jan, 14:30" (24-hour) — for lists and tables */
export function formatDateTime(iso: string | Date): string {
  const d = toDate(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** "21 Jan 2024, 14:30" — for detail views and tooltips */
export function formatDateTimeFull(iso: string | Date): string {
  const d = toDate(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** "21 Jan, 06:00 – 14:30" */
export function formatRange(isoStart: string | Date, isoEnd: string | Date): string {
  const s = toDate(isoStart);
  const e = toDate(isoEnd);
  const sameDay =
    s.getDate() === e.getDate() &&
    s.getMonth() === e.getMonth() &&
    s.getFullYear() === e.getFullYear();

  if (sameDay) {
    return `${formatDate(s)}, ${pad2(s.getHours())}:${pad2(s.getMinutes())} – ${pad2(e.getHours())}:${pad2(e.getMinutes())}`;
  }
  return `${formatDateTime(s)} – ${formatDateTime(e)}`;
}

/** en-IN number format (1,20,431) */
const numberFormatter = new Intl.NumberFormat("en-IN");

export function formatNumber(n: number): string {
  return numberFormatter.format(n);
}

/** ₹4,210 — INR, no decimals */
const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatCurrency(n: number): string {
  return currencyFormatter.format(n);
}

/** Format flow rate: "2.4 L/min" */
export function formatFlow(lpm: number): string {
  return `${lpm.toFixed(1)} L/min`;
}

/** Format volume: "124 L" */
export function formatVolume(liters: number): string {
  return `${formatNumber(Math.round(liters))} L`;
}

/** Format carbon: "12.4 kg CO₂e" */
export function formatCarbon(kg: number): string {
  return `${kg.toFixed(1)} kg CO₂e`;
}

/** Format percentage: "12.3%" */
export function formatPercent(pct: number, decimals = 1): string {
  return `${pct.toFixed(decimals)}%`;
}

/** Format hour for heatmap axis: "06:00", "09:00" */
export function formatHour(hour: number): string {
  return `${pad2(hour)}:00`;
}
