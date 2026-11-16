/* Dashboard KPI band values, derived live from the demo model (same shape as the
   template's KPI_DEFS). */
import { eur, fleet, headline, jobs, margin, payments, pct, getState } from "./model";
import { TENDER_WON } from "./data";

export type KpiDef = { label: string; value: string; delta: string; dir: "up" | "down"; hint: string; hero?: boolean };

export function kpiDefs(): Record<string, KpiDef> {
  const h = headline();
  const open = jobs().filter((j) => j.stage !== "completed");
  const openValue = open.reduce((a, j) => a + j.price, 0);
  const openMargin = margin(openValue, open.reduce((a, j) => a + j.cost, 0));
  const quoting = jobs().filter((j) => j.stage === "quoting" || j.stage === "enquiry" || j.stage === "survey");
  const f = fleet();
  const pays = payments();
  const collected = pays.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0);
  const awaiting = pays.filter((p) => p.status === "invoiced").reduce((a, p) => a + p.amount, 0);
  const floor = getState().marginFloor;
  return {
    open: { label: "Open jobs", value: String(h.open), delta: h.total + " seeded", dir: "up", hint: "1 completed this week", hero: true },
    proofs: { label: "Proofs waiting", value: String(h.proofs), delta: h.proofs ? "CU v3 holds CNC" : "none", dir: h.proofs ? "down" : "up", hint: "client sign-off" },
    workshop: { label: "In the workshop", value: String(h.workshop), delta: f.done + "/" + f.total + " vans", dir: "up", hint: "fleet complete" },
    holds: { label: "Material holds", value: String(h.materials), delta: "ETA / order", dir: h.materials ? "down" : "up", hint: "waiting materials" },
    value: { label: "Open job value", value: eur(openValue), delta: pct(openMargin), dir: openMargin >= floor ? "up" : "down", hint: "est. margin · demo" },
    pipeline: { label: "Quote pipeline", value: eur(quoting.reduce((a, j) => a + j.price, 0)), delta: quoting.length + " jobs", dir: "up", hint: "enquiry to quote · demo" },
    tender: { label: "Tender won", value: eur(TENDER_WON.value || 0), delta: "48.7%", dir: "up", hint: "college wayfinding" },
    deposits: { label: "Deposits collected", value: eur(collected), delta: eur(awaiting), dir: "up", hint: "awaiting · demo ledger" },
  };
}
export const DEFAULT_KPI_KEYS = ["open", "proofs", "workshop", "holds", "value"];
