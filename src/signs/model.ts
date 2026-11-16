/* Live demo state for Signs ASAP: the seed in data.ts plus every local edit the
   presenter makes (approvals, moves, edits). Persisted to localStorage so edits
   survive navigation and reloads; resetDemo() restores the canonical seed.
   Nothing here talks to a network. */

import { useSyncExternalStore } from "react";
import {
  ACTIVITIES, AGENTS, CUSTOMERS, ENQUIRIES, FLEET_BATCHES, INSTALLS, JOBS, MATERIALS, PAYMENTS, PEOPLE, PROOFS,
  QUOTES, STAGE_GROUPS, SURVEYS, TASKS, TENDER_DRAFT, TENDER_WON, WORK_ORDERS, FITTERS, SUPPLIERS,
  type Activity, type Actor, type Enquiry, type Install, type Job, type MatStatus, type Payment, type ProofStatus,
  type ProofVersion, type Stage, type Task, type Tender, type TenderLine, type WoCol, type WorkOrder, type Obstacle,
} from "./data";
import { DEMO_TODAY, bd } from "./dates";

/* ── State ─────────────────────────────────────────────────────────────── */
export type TenderEdits = Record<string, number>; // "<lineId>.<field>" or "<global>"
export type DemoState = {
  proofStatus: Record<string, ProofStatus>;
  proofExtra: ProofVersion[];
  changeRequests: { id: string; jobId: string; proofId: string; note: string; costImpact: number; at: Date; status: "open" | "accepted" | "rejected" }[];
  jobStage: Record<string, Stage>;
  jobPrice: Record<string, number>;
  jobCost: Record<string, number>;
  jobFit: Record<string, number>;
  newJobs: Job[];
  enquiryStatus: Record<string, Enquiry["status"]>;
  enquiryJob: Record<string, string>;
  taskStatus: Record<string, Task["status"]>;
  taskAssignee: Record<string, string>;
  extraTasks: Task[];
  extraActivities: Activity[];
  woCol: Record<string, WoCol>;
  woPlanShift: Record<string, number[]>;
  matStatus: Record<string, MatStatus>;
  installStatus: Record<string, Install["status"]>;
  installAck: Record<string, boolean>;
  installFitter: Record<string, string>;
  installDay: Record<string, number>;
  completion: Record<string, { accepted: boolean; punch: Record<string, boolean> }>;
  payStatus: Record<string, Payment["status"]>;
  fleetBatch: Record<string, "complete" | "in-progress" | "awaiting-slot">;
  tenderStage: number; // 0 = not run, 1..5 = staged extraction, 5 = done
  tenderEdits: Record<string, TenderEdits>;
  tenderAck: Record<string, boolean>;
  tenderStatus: Record<string, Tender["status"]>;
  tenderDeposit: Record<string, number>;
  qa: Record<string, Record<string, boolean>>;
  rushScenario: boolean;
  marginFloor: number;
  agentDone: Record<string, boolean>;
  decisionsDone: Record<string, boolean>;
  surveyObstacles: Record<string, Obstacle[]>;
  surveyFields: Record<string, Record<string, string>>;
  settingsToggles: Record<string, boolean>;
  depositOverride: Record<string, number>;
};

type Ui = { tabs: Record<string, string>; openJob: string | null; tv: boolean; toasts: { id: number; text: string }[] };

const KEY = "signs-asap-demo-v1";
const fresh = (): DemoState => ({
  proofStatus: {}, proofExtra: [], changeRequests: [], jobStage: {}, jobPrice: {}, jobCost: {}, jobFit: {}, newJobs: [],
  enquiryStatus: {}, enquiryJob: {}, taskStatus: {}, taskAssignee: {}, extraTasks: [], extraActivities: [],
  woCol: {}, woPlanShift: {}, matStatus: {}, installStatus: {}, installAck: {}, installFitter: {}, installDay: {}, completion: {},
  payStatus: {}, fleetBatch: {}, tenderStage: 0, tenderEdits: {}, tenderAck: {}, tenderStatus: {}, tenderDeposit: {},
  qa: {}, rushScenario: false, marginFloor: 38, agentDone: {}, decisionsDone: {}, surveyObstacles: {}, surveyFields: {},
  settingsToggles: {}, depositOverride: {},
});

const DATE_KEYS = new Set(["at", "due", "date", "created", "fitDate", "validUntil", "sentOn", "eta", "received"]);
function load(): DemoState {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null;
    if (!raw) return fresh();
    const parsed = JSON.parse(raw, (k, v) => (DATE_KEYS.has(k) && typeof v === "string" ? new Date(v) : v));
    return Object.assign(fresh(), parsed);
  } catch {
    return fresh();
  }
}

let state: DemoState = load();
let ui: Ui = { tabs: {}, openJob: null, tv: false, toasts: [] };
let version = 0;
const listeners = new Set<() => void>();

function emit() {
  version++;
  listeners.forEach((l) => l());
}
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode: edits live for the session */ }
}
export function update(fn: (s: DemoState) => Partial<DemoState> | void) {
  const patch = fn(state);
  if (patch) state = { ...state, ...patch };
  persist();
  emit();
}
function setUi(patch: Partial<Ui>) {
  ui = { ...ui, ...patch };
  emit();
}
export const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const getState = () => state;
export const getUi = () => ui;

/** Re-render on any demo change. Returns [state, ui]. */
export function useDemo(): [DemoState, Ui] {
  useSyncExternalStore(subscribe, () => version);
  return [state, ui];
}

export function resetDemo() {
  state = fresh();
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  ui = { ...ui, openJob: null, tv: false };
  toast("Demo reset to the canonical Signs ASAP data");
  emit();
}

/* ── Navigation bridge (PulseLogic registers the real navigator) ──────── */
let navigator: ((page: string, tab?: string) => void) | null = null;
export function registerNavigator(fn: (page: string, tab?: string) => void) { navigator = fn; }
export function getTab(page: string, fallback: string) { return ui.tabs[page] || fallback; }
export function setTab(page: string, tab: string) { setUi({ tabs: { ...ui.tabs, [page]: tab } }); }
export function go(page: string, tab?: string) {
  if (tab) ui = { ...ui, tabs: { ...ui.tabs, [page]: tab } };
  ui = { ...ui, openJob: null };
  if (navigator) navigator(page, tab);
  emit();
}
export function openJob(id: string) { setUi({ openJob: id }); }
export function closeJob() { setUi({ openJob: null }); }
export function setTv(on: boolean) { setUi({ tv: on }); }

let toastN = 0;
export function toast(text: string) {
  const id = ++toastN;
  setUi({ toasts: ui.toasts.concat([{ id, text }]).slice(-3) });
  setTimeout(() => setUi({ toasts: ui.toasts.filter((t) => t.id !== id) }), 3600);
}

/* ── Formatting ────────────────────────────────────────────────────────── */
const eur0 = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const eur2 = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const eur = (n: number) => eur0.format(Math.round(n));
export const eurc = (n: number) => eur2.format(n);
export const pct = (n: number, dp = 1) => (Number.isFinite(n) ? n.toFixed(dp) : "0.0") + "%";
export const num = (n: number) => new Intl.NumberFormat("en-IE").format(n);
export const margin = (price: number, cost: number) => (price > 0 ? ((price - cost) / price) * 100 : 0);

/* ── Lookups ───────────────────────────────────────────────────────────── */
export const customer = (id: string) => CUSTOMERS.find((c) => c.id === id);
export const person = (id: string) => PEOPLE.find((p) => p.id === id) || PEOPLE[0];
export const fitter = (id: string) => FITTERS.find((f) => f.id === id) || FITTERS[0];
export const supplier = (id: string) => SUPPLIERS.find((s) => s.id === id);
export const agentDef = (id: string) => AGENTS.find((a) => a.id === id);

/* ── Jobs ──────────────────────────────────────────────────────────────── */
export function jobs(s: DemoState = state): Job[] {
  return JOBS.concat(s.newJobs).map((j) => {
    const stage = s.jobStage[j.id] || j.stage;
    const price = s.jobPrice[j.id] ?? j.price;
    const cost = s.jobCost[j.id] ?? j.cost;
    const fit = s.jobFit[j.id];
    const paid = payments(s).filter((p) => p.jobId === j.id && p.status === "paid").reduce((a, p) => a + p.amount, 0);
    return { ...j, stage, price, cost, fitDate: fit !== undefined ? bd(fit) : j.fitDate, paidPct: price ? Math.round((paid / price) * 100) : 0,
      blocker: blockerFor({ ...j, stage }, s), nextStep: nextStepFor({ ...j, stage }, s) };
  });
}
export const job = (id: string, s: DemoState = state) => jobs(s).find((j) => j.id === id);
export const openJobs = (s: DemoState = state) => jobs(s).filter((j) => j.stage !== "completed");
export const jobsIn = (stages: Stage[], s: DemoState = state) => jobs(s).filter((j) => stages.indexOf(j.stage) > -1);
export function stageCounts(s: DemoState = state) {
  const js = jobs(s);
  return STAGE_GROUPS.map((g) => ({ ...g, count: js.filter((j) => g.stages.indexOf(j.stage) > -1).length, jobs: js.filter((j) => g.stages.indexOf(j.stage) > -1) }));
}
export function headline(s: DemoState = state) {
  const js = jobs(s);
  return {
    total: js.length,
    open: js.filter((j) => j.stage !== "completed").length,
    proofs: js.filter((j) => j.stage === "proof").length,
    workshop: js.filter((j) => j.stage === "production").length,
    materials: js.filter((j) => j.stage === "procurement").length,
    ready: js.filter((j) => j.stage === "ready").length,
    booked: js.filter((j) => j.stage === "booked").length,
    completed: js.filter((j) => j.stage === "completed").length,
  };
}

function blockerFor(j: Job, s: DemoState): string | undefined {
  if (j.id === "JOB-26043") return isApproved("PV-43-3", s) ? (payStatusOf("PAY-503", s) === "paid" ? undefined : "Deposit invoiced, not yet received: hold aluminium order") : "Proof v3 not approved. Do not release to CNC.";
  if (j.id === "JOB-26045") return matStatusOf("M-201", s) === "Received" ? undefined : "Fabricated letters: supplier ETA awaiting confirmation";
  if (j.id === "JOB-26041") return matStatusOf("M-203", s) === "Short" ? "Composite panel order awaiting owner approval" : undefined;
  return undefined;
}
function nextStepFor(j: Job, s: DemoState): string {
  if (j.id === "JOB-26043" && isApproved("PV-43-3", s)) return "Released to CNC: tray + letter returns";
  if (j.id === "JOB-26041" && matStatusOf("M-203", s) !== "Short") return "Materials ordered; print plaques when received";
  if (j.id === "JOB-26045" && matStatusOf("M-201", s) === "Received") return "Wire letters and book fit";
  const base = JOBS.find((x) => x.id === j.id);
  if (j.stage === "completed" && base && base.stage !== "completed") return "Installed; balance invoice due";
  return base ? base.nextStep : "";
}

/* ── Proofs ────────────────────────────────────────────────────────────── */
export function proofs(s: DemoState = state): ProofVersion[] {
  return PROOFS.concat(s.proofExtra).map((p) => ({ ...p, status: s.proofStatus[p.id] || p.status }));
}
export const proofsFor = (jobId: string, s: DemoState = state) => proofs(s).filter((p) => p.jobId === jobId).sort((a, b) => a.v - b.v);
export const isApproved = (proofId: string, s: DemoState = state) => (s.proofStatus[proofId] || PROOFS.find((p) => p.id === proofId)?.status) === "approved";
export const approvedProof = (jobId: string, s: DemoState = state) => proofsFor(jobId, s).filter((p) => p.status === "approved").pop();
export const latestProof = (jobId: string, s: DemoState = state) => proofsFor(jobId, s).pop();
export const awaitingProofs = (s: DemoState = state) => proofs(s).filter((p) => p.status === "awaiting");

export function approveProof(proofId: string) {
  const p = proofs().find((x) => x.id === proofId);
  if (!p) return;
  update((s) => {
    const ps: Record<string, ProofStatus> = { ...s.proofStatus };
    proofsFor(p.jobId, s).forEach((o) => { if (o.id !== proofId && o.status !== "changes") ps[o.id] = "superseded"; });
    ps[proofId] = "approved";
    const stagePatch: Record<string, Stage> = { ...s.jobStage };
    const cur = job(p.jobId, s);
    if (cur && cur.stage === "proof") stagePatch[p.jobId] = p.jobId === "JOB-26043" ? "production" : "procurement";
    return { proofStatus: ps, jobStage: stagePatch };
  });
  log("human", "Managing Director", "Approved " + jobShort(p.jobId) + " proof v" + p.v + ". It is now the only version production can use.", p.jobId, "proof", "ok");
  if (p.jobId === "JOB-26043") log("agent", "Proof Guardian", "Celbridge CU released to CNC on v3: solid aluminium tray, warm white 3000K, 6.0 × 1.3 m.", p.jobId, "proof", "ok");
  toast("Proof v" + p.v + " approved · production card unlocked");
}
export function requestProofChange(proofId: string, note: string) {
  const p = proofs().find((x) => x.id === proofId);
  if (!p) return;
  const nextV = Math.max(...proofsFor(p.jobId).map((x) => x.v)) + 1;
  const newId = "PV-" + p.jobId.slice(-2) + "-" + nextV + "x";
  update((s) => ({
    proofStatus: { ...s.proofStatus, [proofId]: "changes" },
    proofExtra: s.proofExtra.concat([{ ...p, id: newId, v: nextV, date: new Date(), status: "awaiting", summary: "Revision in progress: " + note, emails: "Change requested by owner/client. Previous versions kept in history." }]),
    extraTasks: s.extraTasks.concat([{ id: "T-" + Date.now(), title: "Revise " + jobShort(p.jobId) + " proof to v" + nextV + ": " + note, assignee: "conor", dept: "Design", jobId: p.jobId, priority: "High", due: bd(1), status: "Open" }]),
  }));
  log("human", "Managing Director", "Requested a change on " + jobShort(p.jobId) + " proof v" + p.v + ": " + note + ". Revision task created for Conor.", p.jobId, "proof", "warn");
  toast("Change requested · revision task created for Conor");
}
export function raiseChangeRequest(jobId: string, proofId: string, note: string, costImpact: number) {
  update((s) => ({ changeRequests: s.changeRequests.concat([{ id: "CR-" + Date.now(), jobId, proofId, note, costImpact, at: new Date(), status: "open" }]) }));
  log("human", "Managing Director", "Change request on approved proof for " + jobShort(jobId) + ": " + note + " (cost impact " + eur(costImpact) + ").", jobId, "proof", "warn");
  toast("Change request logged · approved version unchanged until accepted");
}

/* ── Work orders ───────────────────────────────────────────────────────── */
export function workOrders(s: DemoState = state): WorkOrder[] {
  const cuApproved = isApproved("PV-43-3", s);
  return WORK_ORDERS.map((w) => {
    let wo: WorkOrder = { ...w, col: s.woCol[w.id] || w.col, dayPlan: s.woPlanShift[w.id] || w.dayPlan };
    if (w.id === "WO-3113") wo = cuApproved ? { ...wo, locked: false, blocker: payStatusOf("PAY-503", s) === "paid" ? undefined : "Deposit invoiced: hold aluminium order", next: "CNC tray + letter returns", dayPlan: s.rushScenario ? [0, 0, 6, 7.5, 7] : (s.woPlanShift[w.id] || [0, 0, 0, 4, 6]) } : wo;
    if (w.id === "WO-3101" && matStatusOf("M-203", s) !== "Short") wo = { ...wo, blocker: undefined, next: "Print plaques when ACM lands" };
    if (w.id === "WO-3102" && matStatusOf("M-201", s) === "Received") wo = { ...wo, blocker: undefined, next: "Fit LEDs and wire" };
    return wo;
  });
}
export function moveWorkOrder(woId: string, col: WoCol) {
  const w = workOrders().find((x) => x.id === woId);
  if (!w || w.locked) return;
  update((s) => ({ woCol: { ...s.woCol, [woId]: col } }));
  log("human", person(w.personId).name, "Moved " + w.title + " to " + col.replace("qa", "QA") + ".", w.jobId, "production", "info");
}
export function setRushScenario(on: boolean) {
  update(() => ({ rushScenario: on }));
  if (on) log("agent", "Production Planner", "Rush LED sign added to CNC this week: CNC station over capacity Wed-Fri.", "JOB-26043", "capacity", "warn");
}
export function shiftPlan(woId: string, plan: number[], text: string) {
  const w = WORK_ORDERS.find((x) => x.id === woId);
  update((s) => ({ woPlanShift: { ...s.woPlanShift, [woId]: plan } }));
  log("human", "Managing Director", text, w?.jobId, "capacity", "ok");
  toast(text);
}

/* ── Fleet ─────────────────────────────────────────────────────────────── */
export function fleet(s: DemoState = state) {
  const batches = FLEET_BATCHES.map((b) => ({ ...b, status: s.fleetBatch[b.id] || b.status }));
  const done = batches.filter((b) => b.status === "complete").reduce((a, b) => a + b.vans, 0);
  const inProg = batches.filter((b) => b.status === "in-progress").reduce((a, b) => a + b.vans, 0);
  const waiting = batches.filter((b) => b.status === "awaiting-slot").reduce((a, b) => a + b.vans, 0);
  return { batches, done, inProg, waiting, total: done + inProg + waiting };
}

/* ── Materials ─────────────────────────────────────────────────────────── */
export const matStatusOf = (id: string, s: DemoState = state) => s.matStatus[id] || MATERIALS.find((m) => m.id === id)?.status;
export const materials = (s: DemoState = state) => MATERIALS.map((m) => ({ ...m, status: s.matStatus[m.id] || m.status }));
export function setMaterialStatus(id: string, st: MatStatus, by = "Managing Director") {
  const m = MATERIALS.find((x) => x.id === id);
  update((s) => ({ matStatus: { ...s.matStatus, [id]: st } }));
  if (m) log("human", by, m.name + ": " + st.toLowerCase() + ".", m.jobId, "materials", st === "Received" || st === "Ordered" ? "ok" : "info");
}
export function approveMaterialOrder(id: string) {
  setMaterialStatus(id, "Ordered");
  const m = MATERIALS.find((x) => x.id === id);
  if (m?.jobId === "JOB-26041") log("agent", "Ops Watchdog", "College plaque materials ordered; ETA 2 business days. Hold cleared.", m.jobId, "materials", "ok");
  toast("Material order approved (mock: no supplier is contacted)");
}

/* ── Installations ─────────────────────────────────────────────────────── */
export function installs(s: DemoState = state) {
  return INSTALLS.map((i) => ({ ...i, status: s.installStatus[i.id] || i.status, packAck: s.installAck[i.id] ?? i.packAck,
    fitterId: s.installFitter[i.id] || i.fitterId, date: s.installDay[i.id] !== undefined ? bd(s.installDay[i.id]) : i.date }));
}
export function ackPack(id: string) {
  const i = installs().find((x) => x.id === id);
  update((s) => ({ installAck: { ...s.installAck, [id]: true } }));
  if (i) log("human", fitter(i.fitterId).name, "Acknowledged site pack for " + jobShort(i.jobId) + ".", i.jobId, "install", "ok");
  toast("Site pack acknowledged (simulated; nothing sent)");
}
export function confirmInstall(id: string) {
  const i = installs().find((x) => x.id === id);
  update((s) => ({ installStatus: { ...s.installStatus, [id]: "booked" } }));
  if (i) {
    const j = job(i.jobId);
    if (j && j.stage === "ready") update((s) => ({ jobStage: { ...s.jobStage, [i.jobId]: "booked" } }));
    log("human", "Managing Director", "Confirmed " + fitter(i.fitterId).name + " for " + jobShort(i.jobId) + ".", i.jobId, "install", "ok");
  }
}
export function reassignFitter(id: string, fitterId: string) {
  const i = installs().find((x) => x.id === id);
  update((s) => ({ installFitter: { ...s.installFitter, [id]: fitterId } }));
  if (i) log("human", "Managing Director", "Reassigned " + jobShort(i.jobId) + " fit to " + fitter(fitterId).name + ".", i.jobId, "install", "info");
}
export function moveInstall(id: string, dayOffset: number) {
  const i = installs().find((x) => x.id === id);
  update((s) => ({ installDay: { ...s.installDay, [id]: dayOffset } }));
  if (i) log("human", "Managing Director", "Moved " + jobShort(i.jobId) + " fit to " + bd(dayOffset).toLocaleDateString("en-IE", { weekday: "short", day: "numeric", month: "short" }) + ".", i.jobId, "install", "info");
}
export function markInstalled(id: string) {
  const i = installs().find((x) => x.id === id);
  if (!i) return;
  update((s) => ({ installStatus: { ...s.installStatus, [id]: "done" }, jobStage: { ...s.jobStage, [i.jobId]: "completed" },
    completion: { ...s.completion, [i.jobId]: s.completion[i.jobId] || { accepted: false, punch: {} } } }));
  log("human", fitter(i.fitterId).name, "Marked " + jobShort(i.jobId) + " installed. Completion photos attached (placeholder).", i.jobId, "install", "ok");
  log("system", "Pulse", "Balance invoice trigger raised for " + jobShort(i.jobId) + " (proposed to accounts package, not sent).", i.jobId, "payment", "info");
  toast("Installed · job moved to Completed · balance trigger raised");
}
export function setCompletion(jobId: string, patch: Partial<{ accepted: boolean; punch: Record<string, boolean> }>) {
  update((s) => ({ completion: { ...s.completion, [jobId]: { ...(s.completion[jobId] || { accepted: false, punch: {} }), ...patch } } }));
}

/* ── Payments ──────────────────────────────────────────────────────────── */
export const payStatusOf = (id: string, s: DemoState = state) => s.payStatus[id] || PAYMENTS.find((p) => p.id === id)?.status;
export function payments(s: DemoState = state): Payment[] {
  const out = PAYMENTS.map((p) => ({ ...p, status: s.payStatus[p.id] || p.status }));
  // Completed-in-demo jobs get a balance line so Finance reflects the install.
  Object.keys(s.jobStage).forEach((jid) => {
    if (s.jobStage[jid] !== "completed") return;
    if (out.some((p) => p.jobId === jid && p.kind === "Balance")) return;
    const base = JOBS.find((j) => j.id === jid) || s.newJobs.find((j) => j.id === jid);
    if (!base) return;
    const paid = out.filter((p) => p.jobId === jid && p.status === "paid").reduce((a, p) => a + p.amount, 0);
    const price = s.jobPrice[jid] ?? base.price;
    if (price - paid > 0) out.push({ id: "PAY-B" + jid.slice(-2), jobId: jid, kind: "Balance", amount: price - paid, status: s.payStatus["PAY-B" + jid.slice(-2)] || "invoiced", date: DEMO_TODAY, note: "Raised on install (demo)" });
  });
  return out;
}
export function recordPayment(id: string) {
  const p = payments().find((x) => x.id === id);
  update((s) => ({ payStatus: { ...s.payStatus, [id]: "paid" } }));
  if (p) log("human", "Aisling Ryan", p.kind + " of " + eur(p.amount) + " recorded for " + jobShort(p.jobId) + " (demo ledger).", p.jobId, "payment", "ok");
  toast("Payment recorded in demo ledger");
}

/* ── Tasks ─────────────────────────────────────────────────────────────── */
export function tasks(s: DemoState = state): Task[] {
  return s.extraTasks.concat(TASKS).map((t) => ({ ...t, status: s.taskStatus[t.id] || t.status, assignee: s.taskAssignee[t.id] || t.assignee }));
}
export function setTaskStatus(id: string, st: Task["status"]) {
  const t = tasks().find((x) => x.id === id);
  update((s) => ({ taskStatus: { ...s.taskStatus, [id]: st } }));
  if (t && st === "Done") {
    log("human", person(t.assignee).name, "Completed: " + t.title + ".", t.jobId, "task", "ok");
    if (t.woId === "WO-3108") update((s) => ({ woCol: { ...s.woCol, "WO-3108": "fit" } }));
    if (t.id === "T-04") update((s) => ({ matStatus: { ...s.matStatus, "M-203": s.matStatus["M-203"] || "Short" } }));
  }
}
export function reassignTask(id: string, personId: string) {
  update((s) => ({ taskAssignee: { ...s.taskAssignee, [id]: personId } }));
  toast("Task reassigned to " + person(personId).name);
}
export function addTask(t: Omit<Task, "id">) {
  update((s) => ({ extraTasks: [{ ...t, id: "T-" + Date.now() }].concat(s.extraTasks) }));
}

/* ── Activity log ──────────────────────────────────────────────────────── */
const now = () => {
  const d = new Date();
  const dow = d.getDay();
  if (dow === 0 || dow === 6) { const x = new Date(DEMO_TODAY); x.setHours(d.getHours(), d.getMinutes()); return x; }
  return d;
};
export function log(actor: Actor, who: string, text: string, jobId: string | undefined, kind: string, tone: Activity["tone"] = "info") {
  const entry: Activity = { id: "X-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6), at: now(), actor, who, text, jobId, kind, tone };
  update((s) => ({ extraActivities: [entry].concat(s.extraActivities).slice(0, 80) }));
}
export const activities = (s: DemoState = state) => s.extraActivities.concat(ACTIVITIES).sort((a, b) => b.at.getTime() - a.at.getTime());

/* ── Enquiries ─────────────────────────────────────────────────────────── */
export const enquiries = (s: DemoState = state) => ENQUIRIES.map((e) => ({ ...e, status: s.enquiryStatus[e.id] || e.status, jobId: s.enquiryJob[e.id] || e.jobId }));
export function convertEnquiry(id: string) {
  const e = enquiries().find((x) => x.id === id);
  if (!e || e.jobId) return;
  const n = 26059 + state.newJobs.length;
  const jid = "JOB-" + n;
  const cid = "c-new-" + id;
  const newJob: Job = {
    id: jid, title: e.name + ": " + e.ask.replace(/\.$/, ""), short: e.name, customerId: cid, stage: "enquiry", kind: e.kind,
    scope: e.ask, signTypes: [e.kind === "vehicle" ? "Vehicle graphics" : e.kind === "led" ? "Illuminated sign" : "Printed signage"], site: "To confirm on survey",
    price: e.estValue, cost: Math.round(e.estValue * 0.55), ownerId: "md", due: bd(15), depositPct: e.kind === "led" ? 50 : 30, paidPct: 0,
    needsSurvey: e.kind !== "vehicle", needsProof: true, nextStep: e.kind === "vehicle" ? "Quote from vehicle template" : "Book site survey", quoteId: "QUO-" + (1200 + state.newJobs.length), created: DEMO_TODAY, plannedHours: Math.round(e.estValue / 200),
  };
  if (!CUSTOMERS.some((c) => c.id === cid)) CUSTOMERS.push({ id: cid, name: e.name, cat: "Small business", town: "Fingal", contactRole: e.contactRole, since: DEMO_TODAY.getFullYear(), repeat: e.source === "Repeat", source: e.source === "Site visit" ? "Phone / email" : (e.source as any), illustrative: true });
  update((s) => ({ newJobs: s.newJobs.concat([newJob]), enquiryStatus: { ...s.enquiryStatus, [id]: "converted" }, enquiryJob: { ...s.enquiryJob, [id]: jid } }));
  log("human", "Managing Director", "Converted enquiry from " + e.name + " to " + jid + " (no retyping: scope, contact and source carried over).", jid, "enquiry", "ok");
  toast(e.name + " → " + jid + " created");
  return jid;
}
export function setEnquiryStatus(id: string, st: Enquiry["status"]) { update((s) => ({ enquiryStatus: { ...s.enquiryStatus, [id]: st } })); }

/* ── Tenders ───────────────────────────────────────────────────────────── */
export const TENDERS = [TENDER_DRAFT, TENDER_WON];
export const tenderStatus = (t: Tender, s: DemoState = state) => s.tenderStatus[t.id] || (t.id === TENDER_DRAFT.id && s.tenderStage >= 5 ? "extracted" : t.status);
export type TenderCalc = {
  t: Tender; lines: (TenderLine & { sell: number; costTotal: number })[]; materialsCost: number; labourHours: number; labourRate: number;
  labourCost: number; fitting: number; fittingCost: number; delivery: number; artwork: number; sell: number; cost: number; profit: number; marginPct: number;
};
export function tenderCalc(t: Tender, s: DemoState = state): TenderCalc {
  const e = s.tenderEdits[t.id] || {};
  const g = (k: string, d: number) => (e[k] !== undefined ? e[k] : d);
  const lines = t.lines.map((l) => {
    const qty = g(l.id + ".qty", l.qty), unitPrice = g(l.id + ".unitPrice", l.unitPrice), unitCost = g(l.id + ".unitCost", l.unitCost);
    return { ...l, qty, unitPrice, unitCost, sell: qty * unitPrice, costTotal: qty * unitCost };
  });
  const labourHours = g("labourHours", t.labourHours), labourRate = g("labourRate", t.labourRate);
  const fitting = g("fitting", t.fitting), fittingCost = g("fittingCost", t.fittingCost), delivery = g("delivery", t.delivery), artwork = g("artwork", t.artworkPrice);
  const materialsCost = lines.reduce((a, l) => a + l.costTotal, 0);
  const labourCost = labourHours * labourRate;
  const sell = lines.reduce((a, l) => a + l.sell, 0) + fitting + artwork;
  const cost = materialsCost + labourCost + fittingCost + delivery;
  return { t, lines, materialsCost, labourHours, labourRate, labourCost, fitting, fittingCost, delivery, artwork, sell, cost, profit: sell - cost, marginPct: margin(sell, cost) };
}
export function editTender(tid: string, key: string, value: number) {
  update((s) => ({ tenderEdits: { ...s.tenderEdits, [tid]: { ...(s.tenderEdits[tid] || {}), [key]: value } } }));
}
export function resetTenderEdits(tid: string) { update((s) => ({ tenderEdits: { ...s.tenderEdits, [tid]: {} } })); }
let extractTimer: ReturnType<typeof setTimeout> | null = null;
export function runExtraction() {
  if (extractTimer) clearTimeout(extractTimer);
  update(() => ({ tenderStage: 1, tenderStatus: { ...state.tenderStatus, [TENDER_DRAFT.id]: "new" } }));
  log("agent", "Tender Estimator", "Started extraction on " + TENDER_DRAFT.file + " (46 pages).", undefined, "tender", "info");
  const step = () => {
    if (state.tenderStage >= 5) return;
    update((s) => ({ tenderStage: s.tenderStage + 1 }));
    if (state.tenderStage < 5) extractTimer = setTimeout(step, 1050);
    else {
      update((s) => ({ tenderStatus: { ...s.tenderStatus, [TENDER_DRAFT.id]: "extracted" } }));
      log("agent", "Tender Estimator", "Costing draft ready: 4 sign types, 169 items, 3 ambiguities flagged. Waiting for owner review.", undefined, "tender", "warn");
    }
  };
  extractTimer = setTimeout(step, 1050);
}
export function setTenderStatus(tid: string, st: Tender["status"], text?: string) {
  update((s) => ({ tenderStatus: { ...s.tenderStatus, [tid]: st } }));
  if (text) log("human", "Managing Director", text, tid === TENDER_WON.id ? "JOB-26041" : undefined, "tender", st === "approved" ? "ok" : "info");
}
export function ackTenderWarning(key: string) { update((s) => ({ tenderAck: { ...s.tenderAck, [key]: !s.tenderAck[key] } })); }

/* ── Agents & decisions ────────────────────────────────────────────────── */
export function markAgentDone(id: string, text?: string, jobId?: string) {
  update((s) => ({ agentDone: { ...s.agentDone, [id]: true } }));
  if (text) log("human", "Managing Director", text, jobId, "agent", "ok");
}
export function markDecision(id: string) { update((s) => ({ decisionsDone: { ...s.decisionsDone, [id]: true } })); }
export function setJobPrice(id: string, price: number, text?: string) {
  update((s) => ({ jobPrice: { ...s.jobPrice, [id]: price } }));
  if (text) log("human", "Managing Director", text, id, "quote", "ok");
}

/* ── Surveys ───────────────────────────────────────────────────────────── */
export const surveyFor = (jobId: string) => SURVEYS.find((s) => s.jobId === jobId);
export function addObstacle(svId: string, o: Obstacle) { update((s) => ({ surveyObstacles: { ...s.surveyObstacles, [svId]: (s.surveyObstacles[svId] || []).concat([o]) } })); }
export function setSurveyField(svId: string, k: string, v: string) { update((s) => ({ surveyFields: { ...s.surveyFields, [svId]: { ...(s.surveyFields[svId] || {}), [k]: v } } })); }

/* ── Quotes ────────────────────────────────────────────────────────────── */
export const quotes = (s: DemoState = state) => QUOTES.map((q) => {
  const j = job(q.jobId, s);
  return { ...q, job: j!, price: j?.price || 0, cost: j?.cost || 0 };
});

/* ── QA ────────────────────────────────────────────────────────────────── */
export const QA_CHECKS = [
  { id: "proof", label: "Matches approved proof version" },
  { id: "pantone", label: "Colour / Pantone checked against swatch" },
  { id: "dims", label: "Dimensions measured against drawing" },
  { id: "substrate", label: "Substrate and finish as specified" },
  { id: "vinyl", label: "Vinyl: no bubbles, lifting or weeding marks" },
  { id: "led", label: "LED colour temperature + 24 h burn test" },
  { id: "photos", label: "QA photos taken and attached" },
];
export function toggleQa(woId: string, check: string) {
  update((s) => ({ qa: { ...s.qa, [woId]: { ...(s.qa[woId] || {}), [check]: !(s.qa[woId] || {})[check] } } }));
}
export function signOffQa(woId: string) {
  const w = workOrders().find((x) => x.id === woId);
  update((s) => ({ woCol: { ...s.woCol, [woId]: "fit" } }));
  if (w) {
    log("human", "Mark Brennan", "QA signed off: " + w.title + ". Moved to Ready for fit.", w.jobId, "qa", "ok");
    const j = job(w.jobId);
    if (j && j.stage === "production" && workOrders().filter((x) => x.jobId === w.jobId).every((x) => x.col === "fit")) update((s) => ({ jobStage: { ...s.jobStage, [w.jobId]: "ready" } }));
  }
  toast("QA signed off · Ready for fit");
}

/* ── Helpers ───────────────────────────────────────────────────────────── */
export function jobShort(id: string) { const j = JOBS.find((x) => x.id === id) || state.newJobs.find((x) => x.id === id); return j ? j.short : id; }
export const stageLabel = (st: Stage) => ({ enquiry: "Enquiry", survey: "Site survey", quoting: "Quoting", proof: "Proof pending", procurement: "Waiting materials", production: "In production", ready: "Ready to fit", booked: "Install booked", completed: "Completed" }[st]);
export const stageTone = (st: Stage): "info" | "warn" | "ok" | "accent" | "muted" =>
  st === "proof" || st === "procurement" ? "warn" : st === "production" ? "accent" : st === "ready" || st === "booked" ? "info" : st === "completed" ? "ok" : "muted";
export const deposits = (jobId: string, s: DemoState = state) => payments(s).filter((p) => p.jobId === jobId);
export const recommendedDeposit = (j: Job) => (j.kind === "led" ? 50 : j.kind === "vehicle" ? 40 : 30);
