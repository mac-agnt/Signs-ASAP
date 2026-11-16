/* The canonical job detail. Every page opens jobs through openJob(id); this
   drawer is the one place a job is shown in full, with a right-hand action rail
   whose actions really change the demo state (and are logged to Activity). */

import { useEffect, useState, type ReactNode } from "react";
import {
  useDemo, closeJob, job, customer, person, fitter, eur, pct, margin, proofsFor, approvedProof, latestProof, approveProof,
  requestProofChange, raiseChangeRequest, workOrders, materials, approveMaterialOrder, tasks, setTaskStatus, addTask, payments,
  recordPayment, installs, confirmInstall, markInstalled, activities, update, log, toast, go, stageLabel, stageTone,
  recommendedDeposit, surveyFor, supplier, isApproved, payStatusOf, type DemoState,
} from "../model";
import { KIND_LABEL, WO_COLS, AGENTS, PEOPLE, ENQUIRIES, type Job, type Stage } from "../data";
import { dayLabel, relDay, stamp, bd, isOverdue } from "../dates";
import { Badge, Btn, Avatar, Note, KV, Label, ProofArt, NumField, TextField, toneColor, type Tone } from "../ui";

/* ── Extra demo state owned by the Jobs slice ───────────────────────────── */
type Ext = { jobOwner?: Record<string, string>; jobsFocus?: string };
const ext = (s: DemoState) => s as DemoState & Ext;
export const ownerOf = (j: Job, s: DemoState) => (ext(s).jobOwner || {})[j.id] || j.ownerId;
export const jobsFocus = (s: DemoState) => ext(s).jobsFocus;
export function setJobsFocus(id: string) {
  update(() => ({ jobsFocus: id } as unknown as Partial<DemoState>));
}
export function reassignOwner(j: Job, personId: string) {
  update((s) => ({ jobOwner: { ...(ext(s).jobOwner || {}), [j.id]: personId } } as unknown as Partial<DemoState>));
  log("human", "Managing Director", "Reassigned " + j.short + " to " + person(personId).name + ".", j.id, "task", "info");
  toast(j.short + " now owned by " + person(personId).name);
}

/** Customer name, with a fallback for jobs converted from enquiries in the demo. */
export function custName(j: Job): string {
  const c = customer(j.customerId);
  if (c) return c.name;
  const e = ENQUIRIES.find((x) => "c-new-" + x.id === j.customerId);
  return e ? e.name : j.short;
}

export const priceNote = (j: Job) =>
  j.id === "JOB-26041" ? "€7,500 tender value confirmed on the call. Cost build-up is an illustrative model." : "Illustrative demo values, not audited figures.";

/* ── Stage movement with the production gates ───────────────────────────── */
export const STAGE_ORDER: Stage[] = ["enquiry", "survey", "quoting", "proof", "procurement", "production", "ready", "booked", "completed"];

export function nextStage(j: Job): Stage | null {
  const i = STAGE_ORDER.indexOf(j.stage);
  if (i < 0 || i >= STAGE_ORDER.length - 1) return null;
  let n = STAGE_ORDER[i + 1];
  if (n === "survey" && !j.needsSurvey) n = "quoting";
  if (n === "proof" && !j.needsProof) n = "procurement";
  return n;
}
/** Why the job cannot move on, if a locked rule applies. */
export function gateReason(j: Job, s: DemoState): string | null {
  if (j.stage === "proof" && j.needsProof && !approvedProof(j.id, s)) return "Approved proof gate: approve a proof version before procurement.";
  if (j.stage === "production") {
    const wos = workOrders(s).filter((w) => w.jobId === j.id);
    if (wos.some((w) => w.col !== "fit")) return "Production sign-off: QA must pass on every work order before Ready for fit.";
  }
  return null;
}
export function setStage(j: Job, st: Stage) {
  update((s) => ({ jobStage: { ...s.jobStage, [j.id]: st } }));
  log("human", "Managing Director", "Moved " + j.short + " from " + stageLabel(j.stage) + " to " + stageLabel(st) + ".", j.id, "stage", "info");
}

/* ── Handoff chain ──────────────────────────────────────────────────────── */
export type StepState = "done" | "current" | "pending" | "skipped" | "blocked";
export type Step = { id: string; label: string; state: StepState; note: string; required?: boolean };
export const STEP_LABELS = ["Enquiry", "Survey", "Quote", "Deposit", "Design", "Approval", "Procurement", "Production", "QA", "Ready to fit", "Installed", "Balance paid"];

export function handoffChain(j: Job, s: DemoState): Step[] {
  const idx = STAGE_ORDER.indexOf(j.stage);
  const sv = surveyFor(j.id);
  const svStatus = (s.surveyFields[sv?.id || ""] || {}).status || sv?.status;
  const pays = payments(s).filter((p) => p.jobId === j.id);
  const paid = pays.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0);
  const ap = approvedProof(j.id, s);
  const lp = latestProof(j.id, s);
  const wos = workOrders(s).filter((w) => w.jobId === j.id);
  const inst = installs(s).filter((i) => i.jobId === j.id && i.status !== "done").sort((a, b) => a.date.getTime() - b.date.getTime())[0];
  const mats = materials(s).filter((m) => m.jobId === j.id);
  const matsIn = mats.filter((m) => m.status === "In stock" || m.status === "Received").length;
  const led = j.kind === "led";
  const collected = /collect/i.test(j.site);
  const workshopApplied = j.kind === "vehicle";
  const st = (c: boolean, cur: boolean): StepState => (c ? "done" : cur ? "current" : "pending");

  const steps: Step[] = [];
  steps.push({ id: "enquiry", label: "Enquiry", state: "done", note: "Logged " + dayLabel(j.created) });

  if (!j.needsSurvey) steps.push({ id: "survey", label: "Survey", state: "skipped", note: workshopApplied ? "Applied in the workshop, no site visit" : collected ? "Collected from workshop" : "Fitted to an existing structure" });
  else if (sv && svStatus !== "booked") steps.push({ id: "survey", label: "Survey", state: "done", note: "Captured " + dayLabel(sv.date) + ", " + (sv.obstacles.length + (s.surveyObstacles[sv.id] || []).length) + " obstacles", required: led });
  else if (sv) steps.push({ id: "survey", label: "Survey", state: "current", note: "Booked " + relDay(sv.date), required: led });
  else steps.push({ id: "survey", label: "Survey", state: idx >= 2 ? "done" : "current", note: idx >= 2 ? "Measured on site" : "Owner to book a visit", required: led });

  steps.push({ id: "quote", label: "Quote", state: st(idx > 2, idx === 2), note: idx > 2 ? "Accepted at " + eur(j.price) : idx === 2 ? "With customer / owner" : "After survey" });

  const prepaid = pays.find((p) => p.kind === "Prepayment" && p.status === "paid");
  const depPaid = pays.find((p) => p.kind === "Deposit" && p.status === "paid");
  const depInv = pays.find((p) => p.kind === "Deposit" && p.status !== "paid");
  if (j.depositPct === 0) steps.push({ id: "deposit", label: "Deposit", state: "skipped", note: "Account customer, invoiced on collection" });
  else if (prepaid) steps.push({ id: "deposit", label: "Deposit", state: "done", note: "100% paid upfront (exception)" });
  else if (depPaid) steps.push({ id: "deposit", label: "Deposit", state: "done", note: eur(depPaid.amount) + " received (" + j.depositPct + "%)" });
  else if (depInv) steps.push({ id: "deposit", label: "Deposit", state: idx >= 4 ? "blocked" : "current", note: "Invoiced " + eur(depInv.amount) + ", not yet received" });
  else steps.push({ id: "deposit", label: "Deposit", state: idx >= 3 ? "current" : "pending", note: "Recommend " + recommendedDeposit(j) + "% for " + KIND_LABEL[j.kind].toLowerCase() });

  const anyProof = proofsFor(j.id, s).length > 0;
  if (!j.needsProof) steps.push({ id: "design", label: "Design", state: "skipped", note: "Repeat artwork, no new design" });
  else steps.push({ id: "design", label: "Design", state: ap || idx > 3 ? "done" : anyProof || idx >= 2 ? "current" : "pending", note: lp ? "Latest v" + lp.v + " by " + person(lp.designer).name.split(" ")[0] : "Not started" });

  if (!j.needsProof) steps.push({ id: "approval", label: "Approval", state: "skipped", note: "No proof required" });
  else if (ap) steps.push({ id: "approval", label: "Approval", state: "done", note: "v" + ap.v + " approved, only version production can use", required: led });
  else if (lp && lp.status === "awaiting") steps.push({ id: "approval", label: "Approval", state: idx > 3 ? "blocked" : "current", note: "v" + lp.v + " awaiting sign-off" + (led ? ". LED cannot skip this" : ""), required: led });
  else steps.push({ id: "approval", label: "Approval", state: "pending", note: led ? "Required before fabrication" : "Before production", required: led });

  const blockedProc = idx === 4 && !!j.blocker;
  steps.push({ id: "procurement", label: "Procurement", state: idx > 4 ? "done" : idx === 4 ? (blockedProc ? "blocked" : "current") : "pending",
    note: mats.length ? matsIn + " of " + mats.length + " materials in" + (blockedProc ? ": " + j.blocker : "") : "Stock materials" });

  const inShop = wos.filter((w) => w.col !== "fit").length;
  steps.push({ id: "production", label: "Production", state: st(idx > 5 || (idx === 5 && wos.length > 0 && inShop === 0), idx === 5),
    note: idx === 5 ? (inShop ? inShop + " work order" + (inShop === 1 ? "" : "s") + " in the workshop" : "Built") : idx > 5 ? "Built" : wos.length + " work order" + (wos.length === 1 ? "" : "s") + " planned" });

  const inQa = wos.some((w) => w.col === "qa");
  steps.push({ id: "qa", label: "QA", state: idx > 5 || (idx === 5 && wos.length > 0 && inShop === 0) ? "done" : idx === 5 && inQa ? "current" : "pending", note: idx > 5 ? "Signed off" : inQa ? "Checklist in progress" : "Checklist before fit" });

  steps.push({ id: "ready", label: workshopApplied ? "Ready / handed back" : "Ready to fit", state: st(idx > 6, idx === 6), note: idx === 6 ? "Packed, waiting on fit" : idx > 6 ? "Handed to fit" : "After QA" });

  if (workshopApplied) steps.push({ id: "installed", label: "Applied", state: st(idx === 8, idx === 7), note: "Applied in the workshop in batches" });
  else if (collected) steps.push({ id: "installed", label: "Collected", state: st(idx === 8, idx === 7), note: "Customer collects" });
  else steps.push({ id: "installed", label: "Installed", state: st(idx === 8, idx === 7), note: inst ? fitter(inst.fitterId).name + ", " + dayLabel(inst.date) : idx === 8 ? "Fitted" : "Crew not booked" });

  steps.push({ id: "balance", label: "Balance paid", state: paid >= j.price ? "done" : idx === 8 ? "current" : "pending",
    note: paid >= j.price ? (prepaid ? "Prepaid in full" : "Paid in full") : eur(j.price - paid) + (idx === 8 ? " due now" : " due on completion") });
  return steps;
}

export const STEP_TONE: Record<StepState, Tone> = { done: "ok", current: "accent", pending: "muted", skipped: "muted", blocked: "bad" };

export function StepDot({ state, size = 10 }: { state: StepState; size?: number }) {
  const c = state === "pending" ? "var(--track)" : toneColor[STEP_TONE[state]];
  return <span style={{ width: size, height: size, flex: "none", borderRadius: size, background: state === "skipped" ? "none" : c,
    border: state === "skipped" ? "1.5px dashed var(--faint)" : state === "current" ? "2px solid color-mix(in oklab, var(--accent) 40%, transparent)" : "none",
    boxShadow: state === "current" ? "0 0 0 3px var(--accent-faint)" : undefined, boxSizing: "border-box" }} />;
}

/** Compact 12-step strip. */
export function HandoffStrip({ steps, compact }: { steps: Step[]; compact?: boolean }) {
  if (compact) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 3 }} title={steps.map((x) => x.label + ": " + x.state).join(" · ")}>
        {steps.map((x) => (
          <span key={x.id} style={{ height: 4, borderRadius: 2, background: x.state === "pending" ? "var(--track)" : x.state === "skipped" ? "transparent" : toneColor[STEP_TONE[x.state]],
            border: x.state === "skipped" ? "1px dashed var(--faint)" : "none", boxSizing: "border-box", opacity: x.state === "done" ? 0.75 : 1 }} />
        ))}
      </div>
    );
  }
  return (
    <div className="jd-chain">
      {steps.map((x, i) => (
        <div key={x.id} title={x.note} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 0 }}>
          {i > 0 && <span style={{ position: "absolute", top: 4, right: "50%", width: "100%", height: 2, background: x.state === "pending" || x.state === "skipped" ? "var(--track)" : "color-mix(in oklab," + toneColor[STEP_TONE[x.state]] + " 55%, transparent)", zIndex: 0 }} />}
          <span style={{ position: "relative", zIndex: 1 }}><StepDot state={x.state} /></span>
          <span style={{ fontSize: 10, lineHeight: 1.2, textAlign: "center", color: x.state === "current" ? "var(--ink)" : x.state === "blocked" ? "var(--bad)" : x.state === "pending" || x.state === "skipped" ? "var(--faint)" : "var(--body)", fontWeight: x.state === "current" ? 600 : 400 }}>{x.label}</span>
        </div>
      ))}
    </div>
  );
}

const CSS = `
.jd-head{flex:none;display:flex;align-items:flex-start;gap:12px;padding:20px 22px 16px;border-bottom:1px solid var(--border)}
.jd-body{flex:1;min-height:0;overflow-y:auto;display:grid;grid-template-columns:minmax(0,1fr) 232px;gap:18px;padding:18px 22px 40px;align-items:start}
.jd-rail{position:sticky;top:0;display:flex;flex-direction:column;gap:8px}
.jd-sec{padding:14px 16px;border:1px solid var(--border);border-radius:var(--r-md,16px);background:var(--surface-faint)}
.jd-sec + .jd-sec{margin-top:12px}
.jd-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--border);font-size:12.5px;color:var(--body);min-width:0}
.jd-row:first-of-type{border-top:0}
.jd-chain{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:2px}
.jd-money{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.jd-railbtn{width:100%;justify-content:flex-start !important}
.jd-railgroup{padding:12px;border:1px solid var(--border);border-radius:var(--r-md,16px);background:var(--surface);display:flex;flex-direction:column;gap:7px}
@media (max-width: 860px){
  .jd-body{grid-template-columns:1fr;padding:16px 16px 60px}
  .jd-rail{position:static}
  .jd-money{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width: 620px){ .jd-chain{grid-template-columns:repeat(6,minmax(0,1fr));row-gap:12px} }
`;

function Sec({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <div className="jd-sec">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Label style={{ flex: 1 }}>{title}</Label>
        {right}
      </div>
      {children}
    </div>
  );
}

const PROOF_TONE: Record<string, Tone> = { approved: "ok", awaiting: "warn", superseded: "muted", changes: "bad" };
const PROOF_LABEL: Record<string, string> = { approved: "Approved", awaiting: "Awaiting sign-off", superseded: "Superseded", changes: "Change requested" };
const MAT_TONE: Record<string, Tone> = { "In stock": "ok", Received: "ok", Ordered: "info", "Awaiting ETA": "warn", Short: "bad" };

/* ── Small modals ───────────────────────────────────────────────────────── */
export function Modal({ title, sub, children, onClose, actions }: { title: string; sub?: string; children: ReactNode; onClose: () => void; actions: ReactNode }) {
  return (
    <div className="sa-modal-wrap" onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div className="sa-modal" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "18px 22px 12px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-.3px" }}>{title}</div>
          {sub && <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 5, lineHeight: 1.5 }}>{sub}</div>}
        </div>
        <div style={{ padding: "16px 22px", display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 22px 18px" }}>{actions}</div>
      </div>
    </div>
  );
}

export function RequestChangeModal({ proofId, label, onClose }: { proofId: string; label: string; onClose: () => void }) {
  const [note, setNote] = useState("");
  return (
    <Modal title={"Request a change on " + label} sub="Creates a revision task for Conor. Every earlier version and its approval history stays on record." onClose={onClose}
      actions={<><Btn kind="quiet" onClick={onClose}>Cancel</Btn><Btn kind="primary" disabled={!note.trim()} onClick={() => { requestProofChange(proofId, note.trim()); onClose(); }}>Request change</Btn></>}>
      <TextField area value={note} onChange={setNote} label="What needs to change" placeholder="e.g. Move logo 200 mm left, switch to warm white" />
    </Modal>
  );
}

export function ChangeApprovedModal({ jobId, proofId, label, onClose }: { jobId: string; proofId: string; label: string; onClose: () => void }) {
  const [note, setNote] = useState("");
  const [cost, setCost] = useState(0);
  return (
    <Modal title={"Change approved artwork: " + label} sub="This version is approved and may already be in production. A change is logged as a change request with its cost impact. The approved version stays in force until the change is accepted."
      onClose={onClose}
      actions={<><Btn kind="quiet" onClick={onClose}>Cancel</Btn><Btn kind="primary" disabled={!note.trim()} onClick={() => { raiseChangeRequest(jobId, proofId, note.trim(), cost); onClose(); }}>Log change request</Btn></>}>
      <TextField area value={note} onChange={setNote} label="Requested change" placeholder="e.g. Client wants the strapline added under the name" />
      <div>
        <Label style={{ marginBottom: 6 }}>Cost impact (reprint, materials, labour)</Label>
        <NumField value={cost} onChange={setCost} prefix="€" width={140} label="Cost impact" />
      </div>
      <Note tone="warn">No silent overwrite: production keeps working from the approved version until this request is accepted.</Note>
    </Modal>
  );
}

/* ── The drawer ─────────────────────────────────────────────────────────── */
export default function JobDrawer() {
  const [s, ui] = useDemo();
  const id = ui.openJob;
  useEffect(() => {
    if (!id) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeJob(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [id]);
  if (!id) return null;
  const j = job(id, s);
  if (!j) {
    return (
      <div className="sa-scrim" onClick={closeJob}>
        <div className="sa-drawer" onClick={(e) => e.stopPropagation()} style={{ padding: 24 }}>
          <div className="sa-title">{id}</div>
          <div className="sa-sub">This job is not in the demo data.</div>
          <div style={{ marginTop: 16 }}><Btn onClick={closeJob}>Close</Btn></div>
        </div>
      </div>
    );
  }
  return <DrawerBody key={j.id} j={j} s={s} />;
}

function DrawerBody({ j, s }: { j: Job; s: DemoState }) {
  const [modal, setModal] = useState<null | { kind: "change" | "approved"; proofId: string; label: string }>(null);
  const [undo, setUndo] = useState<Stage | null>(null);
  const [askOpen, setAskOpen] = useState(false);
  const [askWho, setAskWho] = useState("conor");
  const [askText, setAskText] = useState("");
  const [ownerOpen, setOwnerOpen] = useState(false);

  const steps = handoffChain(j, s);
  const m = margin(j.price, j.cost);
  const owner = ownerOf(j, s);
  const sv = surveyFor(j.id);
  const svObs = sv ? sv.obstacles.concat(s.surveyObstacles[sv.id] || []) : [];
  const pv = proofsFor(j.id, s);
  const ap = approvedProof(j.id, s);
  const lp = latestProof(j.id, s);
  const wos = workOrders(s).filter((w) => w.jobId === j.id);
  const mats = materials(s).filter((x) => x.jobId === j.id);
  const tks = tasks(s).filter((t) => t.jobId === j.id);
  const pays = payments(s).filter((p) => p.jobId === j.id);
  const paid = pays.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0);
  const ins = installs(s).filter((i) => i.jobId === j.id).sort((a, b) => a.date.getTime() - b.date.getTime());
  const acts = activities(s).filter((a) => a.jobId === j.id).slice(0, 8);
  const agentNotes = AGENTS.map((a) => {
    const prop = a.proposals.find((p) => p.jobId === j.id && !s.agentDone[p.id]);
    const linked = a.links.indexOf(j.id) > -1;
    if (!prop && !linked) return null;
    return { a, text: prop ? prop.text : a.runs[0].summary, kind: prop ? "Proposes" : "Last run" };
  }).filter(Boolean) as { a: (typeof AGENTS)[number]; text: string; kind: string }[];

  const awaiting = lp && lp.status === "awaiting" ? lp : null;
  const approveMat = mats.find((x) => x.needsApproval && x.status === "Short");
  const invoiced = pays.filter((p) => p.status === "invoiced");
  const pendingInstall = ins.find((i) => i.status === "proposed" || i.status === "tentative");
  const bookedInstall = ins.find((i) => i.status === "booked");
  const nxt = nextStage(j);
  const gate = gateReason(j, s);
  const cuLocked = j.id === "JOB-26043" && !isApproved("PV-43-3", s);
  const prepaid = pays.some((p) => p.kind === "Prepayment");
  const go2 = (page: string, tab: string) => { setJobsFocus(j.id); closeJob(); go(page, tab); };

  return (
    <div className="sa-scrim" onClick={closeJob}>
      <style>{CSS}</style>
      <div className="sa-drawer" role="dialog" aria-label={j.title} onClick={(e) => e.stopPropagation()} style={{ width: "min(860px,100%)" }}>
        <div className="jd-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span className="sa-mono" style={{ fontSize: 12, color: "var(--faint)" }}>{j.id}</span>
              <Badge tone={stageTone(j.stage)} dot>{stageLabel(j.stage)}</Badge>
              <Badge tone="muted">{KIND_LABEL[j.kind]}</Badge>
              {j.story && <Badge tone="info">Story thread</Badge>}
            </div>
            <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-.5px", marginTop: 8, lineHeight: 1.25 }}>{j.title}</div>
            <div style={{ fontSize: 13, color: "var(--dim)", marginTop: 5 }}>
              {custName(j)}{customer(j.customerId) ? " · " + customer(j.customerId)!.contactRole : ""} · owner {person(owner).name}
            </div>
          </div>
          <button type="button" onClick={closeJob} aria-label="Close job" className="sa-btn sa-btn-quiet" style={{ width: 34, padding: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12 M18 6 6 18" /></svg>
          </button>
        </div>

        <div className="jd-body">
          <div style={{ minWidth: 0 }}>
            <div className="jd-money">
              <KV k="Price" v={eur(j.price)} mono />
              <KV k="Est. cost" v={eur(j.cost)} mono />
              <KV k="Gross margin" v={<span style={{ color: m < s.marginFloor ? "var(--warn)" : "var(--ink)" }}>{eur(j.price - j.cost)} · {pct(m)}</span>} mono />
              <KV k="Paid" v={eur(paid) + " (" + (j.price ? Math.round((paid / j.price) * 100) : 0) + "%)"} mono />
            </div>
            <div className="sa-source">{priceNote(j)}</div>

            {j.blocker && <Note tone={cuLocked ? "bad" : "warn"} style={{ marginTop: 12 }}><b style={{ color: "var(--ink)" }}>Blocked:</b> {j.blocker}</Note>}

            <div className="jd-sec" style={{ marginTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Label style={{ flex: 1 }}>Handoff chain</Label>
                <span style={{ fontSize: 11.5, color: "var(--dim)" }}>{steps.filter((x) => x.state === "done").length} of {steps.filter((x) => x.state !== "skipped").length} steps done</span>
              </div>
              <HandoffStrip steps={steps} />
              <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 12 }}>
                Next: <span style={{ color: "var(--ink)" }}>{j.nextStep}</span>
              </div>
            </div>

            <Sec title="Scope">
              <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--body)" }}>{j.scope}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>{j.signTypes.map((t) => <Badge key={t} tone="muted">{t}</Badge>)}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, marginTop: 12 }}>
                <KV k="Site" v={j.site} />
                <KV k="Due" v={<span style={{ color: isOverdue(j.due) && j.stage !== "completed" ? "var(--bad)" : undefined }}>{dayLabel(j.due)}</span>} />
                <KV k="Fit" v={j.fitDate ? dayLabel(j.fitDate) : "Not planned"} />
                <KV k="Planned hours" v={j.plannedHours + " h" + (j.actualHours ? " (actual " + j.actualHours + " h)" : "")} />
              </div>
              {j.safety && <Note tone="warn" style={{ marginTop: 10 }}><b style={{ color: "var(--ink)" }}>Safety:</b> {j.safety}</Note>}
            </Sec>

            {sv && (
              <Sec title={"Site survey · " + sv.id} right={<Btn small kind="quiet" onClick={() => go2("Jobs", "surveys")}>Open survey</Btn>}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", fontSize: 12.5, color: "var(--body)" }}>
                  <Badge tone={sv.status === "booked" ? "warn" : "ok"}>{sv.status === "booked" ? "Booked " + relDay(sv.date) : "Captured " + dayLabel(sv.date)}</Badge>
                  <span>{sv.width} × {sv.height} {sv.unit}{sv.illustrativeDims ? " (demo example, not measured)" : ""}</span>
                  <span style={{ color: "var(--faint)" }}>· {sv.photos.length} photos</span>
                </div>
                {svObs.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    {svObs.map((o, i) => (
                      <div key={o.id} className="jd-row">
                        <span style={{ width: 18, height: 18, borderRadius: 9, background: "var(--warn-soft)", color: "var(--warn)", fontSize: 10, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{i + 1}</span>
                        <Badge tone="warn">{o.tag}</Badge>
                        <span style={{ minWidth: 0 }}>{o.note}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 8 }}>{sv.access}</div>
              </Sec>
            )}

            {pv.length > 0 && (
              <Sec title="Artwork versions" right={<Btn small kind="quiet" onClick={() => go2("Jobs", "proofs")}>Proofs</Btn>}>
                {awaiting && j.kind === "led" && !ap && (
                  <Note tone="bad" style={{ marginBottom: 10 }}>v{awaiting.v} is awaiting client sign-off. This job cannot enter fabrication until it is approved.</Note>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "130px minmax(0,1fr)", gap: 12, alignItems: "start" }}>
                  <ProofArt swatch={(ap || lp)!.swatch} label={"v" + (ap || lp)!.v} ratio="16/7" lit={(ap || lp)!.lighting !== "n/a"} />
                  <div>
                    {pv.slice().reverse().map((p) => (
                      <div key={p.id} className="jd-row" style={{ alignItems: "flex-start", boxShadow: p.status === "approved" ? "inset 2px 0 0 var(--ok)" : p.status === "awaiting" ? "inset 2px 0 0 var(--warn)" : undefined, paddingLeft: 8 }}>
                        <span className="sa-mono" style={{ fontWeight: 600, color: "var(--ink)", width: 22, flex: "none" }}>v{p.v}</span>
                        <span style={{ flex: 1, minWidth: 0, lineHeight: 1.45 }}>{p.summary}<span style={{ display: "block", fontSize: 11, color: "var(--faint)", marginTop: 2 }}>{p.substrate} · {p.lighting} · {dayLabel(p.date)}</span></span>
                        <Badge tone={PROOF_TONE[p.status]}>{PROOF_LABEL[p.status]}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </Sec>
            )}

            {wos.length > 0 && (
              <Sec title="Work orders" right={<Btn small kind="quiet" onClick={() => go2("Production", "live")}>Workshop</Btn>}>
                {wos.map((w) => (
                  <div key={w.id} className="jd-row">
                    <Avatar id={w.personId} size={22} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ color: "var(--ink)" }}>{w.title}</span>
                      <span style={{ display: "block", fontSize: 11, color: "var(--faint)", marginTop: 2 }}>{w.dims} · {w.hours} h · promised {dayLabel(w.promised)}</span>
                    </span>
                    {w.locked ? <Badge tone="bad">Locked</Badge> : <Badge tone={w.col === "fit" ? "ok" : w.blocker ? "warn" : "accent"}>{WO_COLS.find((c) => c.id === w.col)?.short}</Badge>}
                  </div>
                ))}
              </Sec>
            )}

            {mats.length > 0 && (
              <Sec title="Materials">
                {mats.map((x) => (
                  <div key={x.id} className="jd-row">
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ color: "var(--ink)" }}>{x.name}</span>
                      <span style={{ display: "block", fontSize: 11, color: "var(--faint)", marginTop: 2 }}>{x.qty} · {supplier(x.supplierId)?.name} ({supplier(x.supplierId)?.origin}){x.eta ? " · ETA " + dayLabel(x.eta) : ""}{x.note ? " · " + x.note : ""}</span>
                    </span>
                    <Badge tone={MAT_TONE[x.status]}>{x.status}</Badge>
                  </div>
                ))}
              </Sec>
            )}

            <Sec title="Payments & deposit">
              {prepaid
                ? <Note tone="info" style={{ marginBottom: 8 }}>Exception: customer paid 100% upfront. No standard deposit rule applied (actual amount not disclosed; demo value).</Note>
                : <div style={{ fontSize: 12, color: "var(--dim)", marginBottom: 6 }}>{j.depositNote || "Deposit " + j.depositPct + "%"}. Preset for {KIND_LABEL[j.kind].toLowerCase()}: {recommendedDeposit(j)}%, owner can override.</div>}
              {pays.length === 0 && <div style={{ fontSize: 12.5, color: "var(--faint)" }}>No invoices yet.</div>}
              {pays.map((p) => (
                <div key={p.id} className="jd-row">
                  <span className="sa-mono" style={{ fontSize: 11, color: "var(--faint)", width: 64, flex: "none" }}>{p.id}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>{p.kind}{p.note ? <span style={{ color: "var(--faint)" }}> · {p.note}</span> : null}</span>
                  <span className="sa-mono" style={{ color: "var(--ink)" }}>{eur(p.amount)}</span>
                  <Badge tone={p.status === "paid" ? "ok" : p.status === "invoiced" ? "warn" : "muted"}>{p.status === "paid" ? "Paid" : p.status === "invoiced" ? "Invoiced" : "Not yet"}</Badge>
                </div>
              ))}
            </Sec>

            {ins.length > 0 && (
              <Sec title="Installation" right={<Btn small kind="quiet" onClick={() => go2("Installations", "packs")}>Site pack</Btn>}>
                {ins.map((i) => {
                  const f = fitter(i.fitterId);
                  return (
                    <div key={i.id} className="jd-row">
                      <Avatar initials={f.name.split(" ").map((w) => w[0]).slice(0, 2).join("")} tint={f.tint} size={22} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ color: "var(--ink)" }}>{f.name}</span> <span style={{ color: "var(--faint)" }}>({f.kind === "internal" ? "in-house" : "partner"})</span>
                        <span style={{ display: "block", fontSize: 11, color: "var(--faint)", marginTop: 2 }}>{dayLabel(i.date)} · {i.slot} · {i.access}</span>
                      </span>
                      <Badge tone={i.packAck ? "ok" : "muted"}>{i.packAck ? "Pack acknowledged" : "Pack not acknowledged"}</Badge>
                      <Badge tone={i.status === "done" ? "ok" : i.status === "booked" ? "info" : "warn"}>{i.status === "done" ? "Installed" : i.status === "booked" ? "Booked" : i.status === "proposed" ? "Proposed" : "Tentative"}</Badge>
                    </div>
                  );
                })}
              </Sec>
            )}

            {tks.length > 0 && (
              <Sec title="Tasks">
                {tks.map((t) => (
                  <div key={t.id} className="jd-row">
                    <button type="button" aria-label={t.status === "Done" ? "Reopen task" : "Complete task"} onClick={() => setTaskStatus(t.id, t.status === "Done" ? "Open" : "Done")}
                      style={{ width: 18, height: 18, flex: "none", borderRadius: 6, border: "1.5px solid " + (t.status === "Done" ? "var(--ok)" : "var(--border-strong)"), background: t.status === "Done" ? "var(--ok)" : "none", cursor: "pointer", padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#0b0e10" }}>
                      {t.status === "Done" && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
                    </button>
                    <span style={{ flex: 1, minWidth: 0, textDecoration: t.status === "Done" ? "line-through" : undefined, color: t.status === "Done" ? "var(--faint)" : undefined }}>{t.title}</span>
                    <Avatar id={t.assignee} size={20} />
                    <span style={{ fontSize: 11, color: isOverdue(t.due) && t.status !== "Done" ? "var(--bad)" : "var(--faint)", width: 64, textAlign: "right", flex: "none" }}>{relDay(t.due)}</span>
                  </div>
                ))}
              </Sec>
            )}

            {agentNotes.length > 0 && (
              <Sec title="Agent notes">
                {agentNotes.map((n) => (
                  <div key={n.a.id} className="jd-row" style={{ alignItems: "flex-start" }}>
                    <Badge tone="accent">{n.a.name}</Badge>
                    <span style={{ flex: 1, minWidth: 0, lineHeight: 1.45 }}><span style={{ color: "var(--faint)" }}>{n.kind}: </span>{n.text}</span>
                  </div>
                ))}
              </Sec>
            )}

            <Sec title="Recent activity">
              {acts.length === 0 && <div style={{ fontSize: 12.5, color: "var(--faint)" }}>Nothing logged yet.</div>}
              {acts.map((a) => (
                <div key={a.id} className="jd-row" style={{ alignItems: "flex-start" }}>
                  <span style={{ width: 7, height: 7, borderRadius: 4, marginTop: 6, flex: "none", background: a.tone === "ok" ? "var(--ok)" : a.tone === "warn" ? "var(--warn)" : a.tone === "bad" ? "var(--bad)" : "var(--teal)" }} />
                  <span style={{ flex: 1, minWidth: 0, lineHeight: 1.45 }}>
                    {a.text}
                    <span style={{ display: "block", fontSize: 11, color: "var(--faint)", marginTop: 2 }}>{a.who} · {a.actor === "agent" ? "agent" : a.actor === "system" ? "system (mock)" : "person"} · {stamp(a.at)}</span>
                  </span>
                </div>
              ))}
            </Sec>
          </div>

          {/* ── action rail ── */}
          <aside className="jd-rail">
            <div className="jd-railgroup">
              <Label>Actions</Label>
              {awaiting && (
                <>
                  <Btn kind="primary" onClick={() => approveProof(awaiting.id)} style={{ width: "100%" }}>Approve proof v{awaiting.v}</Btn>
                  <Btn onClick={() => setModal({ kind: "change", proofId: awaiting.id, label: "v" + awaiting.v })} style={{ width: "100%" }}>Request change</Btn>
                </>
              )}
              {ap && !awaiting && STAGE_ORDER.indexOf(j.stage) >= 4 && (
                <Btn onClick={() => setModal({ kind: "approved", proofId: ap.id, label: "v" + ap.v })} style={{ width: "100%" }}>Change approved artwork</Btn>
              )}
              {approveMat && <Btn kind={awaiting ? "ghost" : "primary"} onClick={() => approveMaterialOrder(approveMat.id)} style={{ width: "100%" }}>Approve material order ({eur(approveMat.cost)})</Btn>}
              {invoiced.map((p) => (
                <Btn key={p.id} kind="teal" onClick={() => recordPayment(p.id)} style={{ width: "100%" }}>Record {p.kind.toLowerCase()} {eur(p.amount)}</Btn>
              ))}
              {pendingInstall && <Btn onClick={() => confirmInstall(pendingInstall.id)} style={{ width: "100%" }}>Confirm {fitter(pendingInstall.fitterId).name.split(" ")[0]} for {dayLabel(pendingInstall.date)}</Btn>}
              {bookedInstall && (j.stage === "booked" || j.stage === "ready") && <Btn onClick={() => markInstalled(bookedInstall.id)} style={{ width: "100%" }}>Mark installed</Btn>}
              {nxt && (
                <Btn disabled={!!gate} title={gate || undefined} onClick={() => { setUndo(j.stage); setStage(j, nxt); }} style={{ width: "100%" }}>
                  Move to {stageLabel(nxt)}
                </Btn>
              )}
              {gate && <div style={{ fontSize: 11.5, color: "var(--warn)", lineHeight: 1.45 }}>{gate}</div>}
              {undo && undo !== j.stage && (
                <Btn kind="quiet" small onClick={() => { setStage(j, undo); setUndo(null); }}>Undo: back to {stageLabel(undo)}</Btn>
              )}
              <Btn onClick={() => setAskOpen((o) => !o)} style={{ width: "100%" }}>Request info</Btn>
              {askOpen && (
                <div style={{ display: "flex", flexDirection: "column", gap: 7, padding: "4px 0" }}>
                  <select className="sa-input" value={askWho} onChange={(e) => setAskWho(e.target.value)} aria-label="Ask who">
                    {PEOPLE.filter((p) => !p.owner).map((p) => <option key={p.id} value={p.id}>{p.name} · {p.role}</option>)}
                  </select>
                  <textarea className="sa-input" rows={2} value={askText} placeholder="What do you need to know?" onChange={(e) => setAskText(e.target.value)} />
                  <Btn small kind="primary" disabled={!askText.trim()} onClick={() => {
                    const p = person(askWho);
                    addTask({ title: "Info needed on " + j.short + ": " + askText.trim(), assignee: askWho, dept: p.dept, jobId: j.id, priority: "Medium", due: bd(1), status: "Open" });
                    log("human", "Managing Director", "Asked " + p.name + " for info on " + j.short + ": " + askText.trim(), j.id, "task", "info");
                    toast("Task created for " + p.name);
                    setAskText(""); setAskOpen(false);
                  }}>Create task</Btn>
                </div>
              )}
              <Btn onClick={() => setOwnerOpen((o) => !o)} style={{ width: "100%" }}>Reassign owner</Btn>
              {ownerOpen && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {PEOPLE.filter((p) => p.id !== "aisling").map((p) => (
                    <button type="button" key={p.id} onClick={() => { reassignOwner(j, p.id); setOwnerOpen(false); }} title={p.name + " · " + p.role}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 28, padding: "0 9px 0 3px", borderRadius: 999, cursor: "pointer", font: "inherit", fontSize: 11.5,
                        border: "1px solid " + (p.id === owner ? "var(--accent-line)" : "var(--border)"), background: p.id === owner ? "var(--accent-faint)" : "var(--surface-2)", color: "var(--body)" }}>
                      <Avatar id={p.id} size={20} />{p.name.split(" ")[0]}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="jd-railgroup">
              <Label>Go to</Label>
              {wos.length > 0 && <Btn kind="quiet" small onClick={() => go2("Production", "live")}>Open in Production</Btn>}
              {pv.length > 0 && <Btn kind="quiet" small onClick={() => go2("Jobs", "proofs")}>Artwork & proofs</Btn>}
              {sv && <Btn kind="quiet" small onClick={() => go2("Jobs", "surveys")}>Site survey</Btn>}
              <Btn kind="quiet" small onClick={() => go2("Jobs", "handoffs")}>Handoff chain</Btn>
              {ins.length > 0 && <Btn kind="quiet" small onClick={() => go2("Installations", "packs")}>Site pack</Btn>}
              <Btn kind="quiet" small onClick={() => go2("Finance", "profit")}>Job profit</Btn>
            </div>
            <div style={{ fontSize: 11, color: "var(--faint)", lineHeight: 1.5, padding: "0 4px" }}>
              Actions update this demo only and are written to Activity. Nothing is sent to a customer, supplier or crew.
            </div>
          </aside>
        </div>
      </div>
      {modal && modal.kind === "change" && <RequestChangeModal proofId={modal.proofId} label={j.short + " " + modal.label} onClose={() => setModal(null)} />}
      {modal && modal.kind === "approved" && <ChangeApprovedModal jobId={j.id} proofId={modal.proofId} label={j.short + " " + modal.label} onClose={() => setModal(null)} />}
    </div>
  );
}

/** Used by Jobs → Handoffs to explain steps. */
export const payStatus = payStatusOf;
