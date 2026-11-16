/* Derived numbers shared by Finance, Dashboard and Work. Pure functions over the
   live demo state: nothing here is hardcoded, everything comes from data.ts via
   the selectors in model.ts. */

import { HISTORY, PEOPLE, STATIONS, STATION_BACKGROUND, TENDER_WON, type HistJob, type Job, type JobKind, type Station } from "../data";
import { jobs, payments, tenderCalc, workOrders, margin, type DemoState } from "../model";

/* ── Workshop capacity ─────────────────────────────────────────────────── */
export type StationLoad = { id: Station; label: string; short: string; personId: string; days: number[]; total: number; capacity: number; dayCap: number; pct: number; peak: number };
export function stationLoads(s: DemoState): StationLoad[] {
  const wos = workOrders(s);
  return STATIONS.map((st) => {
    const days = [0, 1, 2, 3, 4].map((d) =>
      wos.filter((w) => w.station === st.id).reduce((a, w) => a + (w.dayPlan[d] || 0), 0)
      + (STATION_BACKGROUND[st.id] || []).reduce((a, b) => a + (b.dayPlan[d] || 0), 0));
    const dayCap = PEOPLE.find((p) => p.id === st.personId)?.hoursPerDay || 7.5;
    const total = days.reduce((a, b) => a + b, 0);
    const capacity = dayCap * 5;
    return { ...st, days, total, capacity, dayCap, pct: (total / capacity) * 100, peak: Math.max(...days.map((h) => (h / dayCap) * 100)) };
  });
}
export const loadTone = (pct: number): "ok" | "warn" | "bad" => (pct > 100 ? "bad" : pct >= 85 ? "warn" : "ok");

/* ── Cost split per job ────────────────────────────────────────────────── */
export const COST_PARTS = [
  { id: "materials", label: "Purchased materials", tone: "accent" as const },
  { id: "labour", label: "Print & production labour", tone: "info" as const },
  { id: "fab", label: "Specialist fabrication", tone: "warn" as const },
  { id: "fit", label: "Travel & fitters", tone: "ok" as const },
  { id: "overhead", label: "Overhead assumption", tone: "muted" as const },
];
const SPLIT: Record<JobKind, number[]> = {
  print: [0.42, 0.3, 0.05, 0.13, 0.1],
  vehicle: [0.38, 0.42, 0, 0.05, 0.15],
  led: [0.36, 0.18, 0.22, 0.14, 0.1],
};
export function costSplit(j: Job, s: DemoState): { id: string; label: string; tone: "accent" | "info" | "warn" | "ok" | "muted"; value: number }[] {
  let vals: number[];
  if (j.id === TENDER_WON.jobId) {
    // The won tender has a real cost build-up: use it, so the split ties to Tender Desk.
    const c = tenderCalc(TENDER_WON, s);
    vals = [c.materialsCost, c.labourCost, 0, c.fittingCost + c.delivery, 0];
    const diff = j.cost - vals.reduce((a, b) => a + b, 0);
    vals[4] += diff; // only non-zero if the tender model was edited after the win
  } else {
    const r = SPLIT[j.kind];
    vals = r.map((x) => Math.round(j.cost * x));
    vals[0] += j.cost - vals.reduce((a, b) => a + b, 0);
  }
  return COST_PARTS.map((p, i) => ({ ...p, value: vals[i] }));
}

/* ── Money position per job ────────────────────────────────────────────── */
export function moneyFor(j: Job, s: DemoState) {
  const ps = payments(s).filter((p) => p.jobId === j.id);
  const paid = ps.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0);
  const invoiced = ps.filter((p) => p.status === "invoiced" || p.status === "due").reduce((a, p) => a + p.amount, 0);
  return { paid, invoiced, remaining: Math.max(0, j.price - paid - invoiced), ps };
}
export function moneyTotals(s: DemoState) {
  const js = jobs(s);
  const per = js.map((j) => ({ j, ...moneyFor(j, s) }));
  const depositsPaid = payments(s).filter((p) => (p.kind === "Deposit" || p.kind === "Prepayment") && p.status === "paid").reduce((a, p) => a + p.amount, 0);
  const depositsAwaiting = payments(s).filter((p) => p.kind === "Deposit" && p.status !== "paid").reduce((a, p) => a + p.amount, 0);
  const invoicedOpen = payments(s).filter((p) => p.status === "invoiced" || p.status === "due").reduce((a, p) => a + p.amount, 0);
  const balanceOnCompletion = per.filter((x) => x.j.stage !== "completed").reduce((a, x) => a + x.remaining, 0);
  const collected = payments(s).filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0);
  return { per, depositsPaid, depositsAwaiting, invoicedOpen, balanceOnCompletion, collected };
}

/* ── History (illustrative) ────────────────────────────────────────────── */
export function histActual(h: HistJob, labourRate: number) {
  const actualCost = h.cost + (h.actualHours - h.quotedHours) * labourRate;
  return { ...h, actualCost, quotedMargin: margin(h.price, h.cost), actualMargin: margin(h.price, actualCost), overrun: h.actualHours - h.quotedHours };
}
export const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const a = xs.slice().sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
};
export function kindHistory(kind: JobKind, labourRate: number) {
  const hs = HISTORY.filter((h) => h.kind === kind).map((h) => histActual(h, labourRate));
  return { hs, quotedMedian: median(hs.map((h) => h.quotedMargin)), actualMedian: median(hs.map((h) => h.actualMargin)) };
}
export const KINDS: JobKind[] = ["print", "vehicle", "led"];
export const KIND_SHORT: Record<JobKind, string> = { print: "Printed boards & vinyl", vehicle: "Vehicle branding", led: "Custom LED / fabricated" };
export const KIND_TONE: Record<JobKind, "accent" | "info" | "ok"> = { print: "info", vehicle: "ok", led: "accent" };

/** Price needed to hit a margin on a given cost, rounded up to the next €10. */
export const priceForMargin = (cost: number, m: number) => Math.ceil(cost / (1 - m / 100) / 10) * 10;
