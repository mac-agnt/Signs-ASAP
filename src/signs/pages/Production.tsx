/* Production: Workshop Live, Work Orders, Capacity, Materials, Quality Checks, TV Mode.
   Every figure is derived from the demo model (workOrders(), materials(), fleet() ...). */

import { useEffect, useState, type ReactNode } from "react";
import {
  useDemo, getTab, go, openJob, setTv, update, log, toast, workOrders, moveWorkOrder, fleet, proofs, job, customer, person,
  approvedProof, isApproved, approveProof, approveMaterialOrder, setMaterialStatus, materials, matStatusOf, supplier, addTask,
  reassignTask, tasks, installs, confirmInstall, fitter, headline, setRushScenario, shiftPlan, toggleQa, signOffQa, QA_CHECKS,
  markDecision, eur, jobShort, stageLabel, type DemoState,
} from "../model";
import { firstTab } from "../nav";
import { PEOPLE, STATIONS, STATION_BACKGROUND, WO_COLS, SUPPLIERS, STAGES, FITTERS, STORY_IDS, type WoCol, type WorkOrder, type Station, type MatStatus } from "../data";
import { DEMO_TODAY, bd, bdFromToday, dayLabel, relDay, sameDay, weekDays, weekStart, weekdayShort } from "../dates";
import { Page, PageHead, Card, Grid, Badge, Btn, Avatar, JobChip, Stat, Meter, Seg, Note, KV, Table, Empty, Label, ProofArt, Source, type Tone, toneColor } from "../ui";
import { TvBoard } from "./TvBoard";

/** True under 900px: two-pane layouts stack into one column. */
export function useNarrow() {
  const q = () => (typeof window !== "undefined" ? window.innerWidth < 900 : false);
  const [n, setN] = useState(q);
  useEffect(() => { const f = () => setN(q()); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);
  return n;
}

/* ── Capacity model (shared with Installations) ─────────────────────────── */
const CAP_NOTE = "Capacity = 7.5 h per person per weekday. Loads are planned work-order hours plus routine station work.";
export const todayIdx = () => {
  const i = weekDays().findIndex((d) => sameDay(d, DEMO_TODAY));
  return i < 0 ? 0 : i;
};
const rushPrintDay = () => Math.min(4, Math.max(2, todayIdx()));

export type StationLoad = {
  id: Station; label: string; short: string; personId: string; cap: number; days: number[]; week: number; weekCap: number;
  items: { label: string; plan: number[]; woId?: string; jobId?: string }[];
};
export function stationLoads(s?: DemoState): StationLoad[] {
  const wos = workOrders(s);
  const st = s;
  const rush = st ? st.rushScenario : false;
  return STATIONS.map((station) => {
    const items: StationLoad["items"] = wos
      .filter((w) => w.station === station.id && w.dayPlan.some((h) => h > 0))
      .map((w) => ({ label: w.title, plan: w.dayPlan, woId: w.id, jobId: w.jobId }));
    STATION_BACKGROUND[station.id].forEach((b) => items.push({ label: b.label, plan: b.dayPlan }));
    if (rush && station.id === "print" && isApproved("PV-43-3", s)) {
      const plan = [0, 0, 0, 0, 0];
      plan[rushPrintDay()] = 1.5;
      items.push({ label: "Rush LED face graphics (Celbridge CU, simulated)", plan, jobId: "JOB-26043" });
    }
    const cap = person(station.personId).hoursPerDay;
    const days = [0, 1, 2, 3, 4].map((d) => items.reduce((a, i) => a + (i.plan[d] || 0), 0));
    const week = days.reduce((a, b) => a + b, 0);
    return { ...station, cap, days, week, weekCap: cap * 5, items };
  });
}
export function workshopUtilisation(s?: DemoState) {
  const l = stationLoads(s);
  const load = l.reduce((a, x) => a + x.week, 0), cap = l.reduce((a, x) => a + x.weekCap, 0);
  return { pct: cap ? (load / cap) * 100 : 0, load, cap };
}

type Conflict = { station: Station; stationLabel: string; day: number; over: number; load: number; cap: number; suggestion?: { woId: string; jobId: string; plan: number[]; text: string; short: string }; noSlot?: string };
function conflicts(s: DemoState): Conflict[] {
  const loads = stationLoads(s);
  const days = weekDays();
  const ti = todayIdx();
  const wos = workOrders(s);
  const out: Conflict[] = [];
  loads.forEach((L) => {
    L.days.forEach((h, d) => {
      if (d < ti || h <= L.cap + 0.01) return;
      const c: Conflict = { station: L.id, stationLabel: L.label, day: d, over: h - L.cap, load: h, cap: L.cap };
      const cands = wos.filter((w) => w.station === L.id && !w.locked && w.dayPlan[d] > 0 && w.col !== "fit" && !(s.rushScenario && w.id === "WO-3113"))
        .sort((a, b) => a.dayPlan[d] - b.dayPlan[d]);
      for (const w of cands) {
        const hrs = w.dayPlan[d];
        const order = [d + 1, d + 2, d + 3, d + 4].filter((t) => t <= 4).concat(Array.from({ length: d }, (_, i) => i).filter((t) => t >= ti));
        const slot = order.find((t) => L.days[t] + hrs <= L.cap + 0.01 && days[t].getTime() <= w.promised.getTime());
        const short = jobShort(w.jobId);
        if (slot !== undefined) {
          const plan = w.dayPlan.slice(); plan[slot] += hrs; plan[d] = 0;
          c.suggestion = { woId: w.id, jobId: w.jobId, plan, short, text: "Move " + w.title + " (" + hrs + " h) from " + weekdayShort(days[d]) + " to " + weekdayShort(days[slot]) + "'s open " + L.short.toLowerCase() + " slot. Still ready by " + relDay(w.promised) + "." };
          break;
        }
        if (w.promised.getTime() >= weekStart(1).getTime()) {
          const plan = w.dayPlan.slice(); plan[d] = 0;
          c.suggestion = { woId: w.id, jobId: w.jobId, plan, short, text: "Move " + w.title + " (" + hrs + " h) from " + weekdayShort(days[d]) + " to next " + weekdayShort(weekStart(1)) + ". Still inside its promised date (" + relDay(w.promised) + "); nothing else moves." };
          break;
        }
      }
      if (!c.suggestion) c.noSlot = "No open " + L.short.toLowerCase() + " slot before the promised dates. Your call: approve overtime, or agree a later date with the customer. Pulse will not change a promise on its own.";
      out.push(c);
    });
  });
  return out;
}

/** Earliest realistic CNC finish for the rush LED sign (planner estimate). */
function rushFinish(s: DemoState) {
  const wo = workOrders(s).find((w) => w.id === "WO-3113");
  if (!wo) return null;
  const cnc = stationLoads(s).find((l) => l.id === "cnc")!;
  let need = wo.hours, last: Date | null = null;
  const days = weekDays();
  for (let d = todayIdx(); d < 5 && need > 0; d++) {
    const spare = Math.max(0, cnc.cap - (cnc.days[d] - (wo.dayPlan[d] || 0)));
    if (spare > 0) { need -= spare; last = days[d]; }
  }
  let i = 0;
  while (need > 0 && i < 20) { const day = bd(i, weekStart(1)); need -= 6; last = day; i++; }
  return last;
}

/* ── Work order moves (fleet batches follow their work order) ───────────── */
const colIdx = (c: WoCol) => WO_COLS.findIndex((x) => x.id === c);
function nextCol(w: WorkOrder): WoCol | null {
  const j = job(w.jobId);
  switch (w.col) {
    case "materials": return "ready";
    case "ready": return "fabrication";
    case "fabrication": return w.station === "cnc" || j?.kind === "led" ? "assembly" : "qa";
    case "assembly": return "qa";
    default: return null;
  }
}
function moveWo(w: WorkOrder, col: WoCol) {
  moveWorkOrder(w.id, col);
  if (w.batch) {
    const st = col === "fit" ? "complete" : col === "fabrication" || col === "assembly" || col === "qa" ? "in-progress" : "awaiting-slot";
    update((s) => ({ fleetBatch: { ...s.fleetBatch, [w.batch as string]: st } }));
  }
}
let qaSelected: string | null = null;
function openQa(woId: string) { qaSelected = woId; go("Production", "qa"); }

function proofInfo(id?: string) {
  const p = proofs().find((x) => x.id === id);
  return p ? { v: p.v, status: p.status } : null;
}
function ProofTag({ id }: { id?: string }) {
  const p = proofInfo(id);
  if (!p) return null;
  const tone: Tone = p.status === "approved" ? "ok" : p.status === "awaiting" ? "warn" : "muted";
  return <Badge tone={tone} title={"Proof " + id}>{"v" + p.v + " " + (p.status === "approved" ? "approved" : p.status)}</Badge>;
}
const dueSoon = (d: Date) => bdFromToday(d) <= 2;

/* ── Workshop Live ──────────────────────────────────────────────────────── */
function WoTile({ w }: { w: WorkOrder }) {
  const j = job(w.jobId);
  const cust = j ? customer(j.customerId)?.name : "";
  const nc = nextCol(w);
  const pi = colIdx(w.col);
  const prev = pi > 0 ? WO_COLS[pi - 1].id : null;
  const blockedForward = w.locked || (!!w.blocker && w.col === "materials");
  return (
    <div className="sa-tile" onClick={() => openJob(w.jobId)}
      style={{ borderColor: w.locked ? "color-mix(in oklab,var(--bad) 45%,var(--border))" : w.blocker ? "color-mix(in oklab,var(--warn) 40%,var(--border))" : undefined, opacity: w.locked ? 0.92 : 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <span className="sa-mono" style={{ fontSize: 11, color: "var(--faint)" }}>{w.id}</span>
        {w.batch && <Badge tone="info">{"Batch " + w.batch}</Badge>}
        <span style={{ marginLeft: "auto" }}><ProofTag id={w.proofVersionId} /></span>
      </div>
      <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cust}</div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)", marginTop: 2, lineHeight: 1.3 }}>{w.title}</div>
      <div style={{ fontSize: 12, color: "var(--body)", marginTop: 6, lineHeight: 1.4 }}>{w.signType}</div>
      <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 3, lineHeight: 1.4 }}>{w.dims}</div>
      <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 3, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{w.materials}</div>
      {(w.locked || w.blocker) && (
        <div style={{ marginTop: 8, padding: "7px 9px", borderRadius: 10, background: w.locked ? "var(--bad-soft)" : "var(--warn-soft)", color: w.locked ? "var(--bad)" : "var(--warn)", fontSize: 11.5, lineHeight: 1.4 }}>
          {w.locked ? "Locked: " : ""}{w.blocker || "Waiting"}
        </div>
      )}
      <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 8 }}><span style={{ color: "var(--faint)" }}>Next: </span>{w.next}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 10 }}>
        <Avatar id={w.personId} size={22} />
        <span style={{ fontSize: 11.5, color: "var(--body)", minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{person(w.personId).name.split(" ")[0]}</span>
        <span style={{ marginLeft: "auto", fontSize: 11.5, color: dueSoon(w.promised) && w.col !== "fit" ? "var(--warn)" : "var(--dim)", whiteSpace: "nowrap" }}>{relDay(w.promised)}</span>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 10 }} onClick={(e) => e.stopPropagation()}>
        <Btn small kind="quiet" disabled={!prev || !!w.locked} title={prev ? "Back to " + WO_COLS[pi - 1].label : ""} onClick={() => prev && moveWo(w, prev)}>Back</Btn>
        {w.locked ? (
          <Btn small kind="teal" onClick={() => go("Jobs", "proofs")}>Open proof</Btn>
        ) : w.col === "qa" ? (
          <Btn small kind="primary" onClick={() => openQa(w.id)}>QA sign-off</Btn>
        ) : nc ? (
          <Btn small disabled={blockedForward} title={blockedForward ? w.blocker : "Move to " + WO_COLS[colIdx(nc)].label} onClick={() => moveWo(w, nc)}>{"To " + WO_COLS[colIdx(nc)].short}</Btn>
        ) : (
          <Badge tone="ok">QA passed</Badge>
        )}
      </div>
    </div>
  );
}

function FleetPanel() {
  const fl = fleet();
  const j = job("JOB-26044");
  const perVan = j ? j.price / fl.total : 0;
  const seg = (n: number) => (fl.total ? (n / fl.total) * 100 : 0) + "%";
  return (
    <Card title="15-van fleet campaign" sub={"Window Manufacturer Fleet · " + fl.total + " × " + eur(perVan) + " = " + eur(j?.price || 0)} right={<JobChip id="JOB-26044" label="" />}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-1px" }}>{fl.done}<span style={{ color: "var(--faint)", fontSize: 20 }}>{" / " + fl.total}</span></span>
        <span style={{ fontSize: 12.5, color: "var(--dim)" }}>vans finished and handed back</span>
      </div>
      <div style={{ display: "flex", height: 12, borderRadius: 8, overflow: "hidden", gap: 2, marginTop: 12, background: "var(--track)" }}>
        <div style={{ width: seg(fl.done), background: "var(--ok)" }} />
        <div style={{ width: seg(fl.inProg), background: "var(--accent)" }} />
        <div style={{ width: seg(fl.waiting), background: "var(--neutral)" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 14 }}>
        {fl.batches.map((b) => (
          <div key={b.id} style={{ display: "grid", gridTemplateColumns: "70px 1fr auto", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>{b.label}</span>
            <span style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.4 }}>{b.vans + " vans · " + b.detail}</span>
            <Badge tone={b.status === "complete" ? "ok" : b.status === "in-progress" ? "accent" : "muted"}>{b.status === "complete" ? "Done" : b.status === "in-progress" ? "In progress" : "Awaiting slot"}</Badge>
          </div>
        ))}
      </div>
      <Source>{fl.done + " + " + fl.inProg + " + " + fl.waiting + " = " + fl.total + " vans. Batches move when their work order moves on the board."}</Source>
    </Card>
  );
}

function CapacityMini() {
  const [s] = useDemo();
  const loads = stationLoads(s);
  const ti = todayIdx();
  const util = workshopUtilisation(s);
  return (
    <Card title="Capacity this week" sub={"Workshop at " + util.pct.toFixed(0) + "% of " + util.cap + " staff hours"} right={<Btn small kind="quiet" onClick={() => go("Production", "capacity")}>Plan</Btn>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {loads.map((l) => {
          const pct = (l.week / l.weekCap) * 100;
          const today = (l.days[ti] / l.cap) * 100;
          return (
            <div key={l.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Avatar id={l.personId} size={20} />
                <span style={{ fontSize: 12.5, color: "var(--body)", flex: 1 }}>{l.label}</span>
                <span style={{ fontSize: 11.5, color: today > 100 ? "var(--bad)" : "var(--dim)" }}>{"today " + today.toFixed(0) + "%"}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: pct > 100 ? "var(--bad)" : "var(--ink)", minWidth: 38, textAlign: "right" }}>{pct.toFixed(0) + "%"}</span>
              </div>
              <Meter value={Math.min(pct, 100)} tone={pct > 95 ? "warn" : "accent"} over={pct > 100} />
            </div>
          );
        })}
      </div>
    </Card>
  );
}

type QueueItem = { key: string; title: string; detail: string; jobId?: string; tone: Tone; approve?: { label: string; run: () => void }; info: { who: string; ask: string }; taskId?: string };
function remoteQueue(s: DemoState): QueueItem[] {
  const q: QueueItem[] = [];
  if (!isApproved("PV-43-3", s)) q.push({ key: "cu", title: "Celbridge CU proof v3", detail: "Waiting on board sign-off. CNC blocked until approved.", jobId: "JOB-26043", tone: "warn",
    approve: { label: "Approve v3", run: () => approveProof("PV-43-3") }, info: { who: "conor", ask: "Get the branch's sign-off date for proof v3" }, taskId: "T-01" });
  if (matStatusOf("M-203", s) === "Short") q.push({ key: "acm", title: "College plaque materials", detail: "9 ACM sheets short. Order waits for your approval.", jobId: "JOB-26041", tone: "warn",
    approve: { label: "Approve order", run: () => approveMaterialOrder("M-203") }, info: { who: "mark", ask: "Confirm ACM sheet count for the 120 plaques" }, taskId: "T-04" });
  if (matStatusOf("M-201", s) !== "Received") q.push({ key: "camile", title: "Camile letters from Poland", detail: "Ordered " + Math.max(1, -bdFromToday(bd(-12))) + " working days ago. Supplier ETA still not confirmed.", jobId: "JOB-26045", tone: "bad",
    info: { who: "aisling", ask: "Get a carrier tracking number for the Camile letters" }, taskId: "T-06" });
  const kin = installs(s).find((i) => i.id === "IN-56");
  if (kin && kin.status !== "booked" && kin.status !== "done") q.push({ key: "kin", title: "Kinsealy fit, " + relDay(kin.date), detail: fitter(kin.fitterId).name + " proposed. Needs your yes.", jobId: "JOB-26056", tone: "info",
    approve: { label: "Confirm crew", run: () => confirmInstall("IN-56") }, info: { who: "mark", ask: "Check stop/go board for the Kinsealy roadside fit" }, taskId: "T-09" });
  const cf = conflicts(s).find((c) => c.suggestion);
  if (cf && cf.suggestion) {
    const sug = cf.suggestion;
    q.push({ key: "cap-" + sug.woId, title: STATIONS.find((x) => x.id === cf.station)?.short + " over capacity " + weekdayShort(weekDays()[cf.day]), detail: sug.text, jobId: sug.jobId, tone: "warn",
      approve: { label: "Apply plan", run: () => shiftPlan(sug.woId, sug.plan, sug.text) }, info: { who: STATIONS.find((x) => x.id === cf.station)?.personId || "md", ask: "Can the " + cf.stationLabel.toLowerCase() + " plan flex this week?" } });
  }
  return q;
}

function OwnerRemote() {
  const [s] = useDemo();
  const q = remoteQueue(s);
  const [reassign, setReassign] = useState<string | null>(null);
  const h = headline(s);
  const requestInfo = (it: QueueItem) => {
    addTask({ title: "Owner asked: " + it.info.ask, assignee: it.info.who, dept: person(it.info.who).dept, jobId: it.jobId, priority: "High", due: bd(0), status: "Open" });
    markDecision("remote-info-" + it.key);
    log("human", "Managing Director", "Asked " + person(it.info.who).name + " (from phone): " + it.info.ask + ".", it.jobId, "task", "info");
    toast("Request sent to " + person(it.info.who).name + " as a task (in-app only)");
  };
  return (
    <Card title="Owner remote view" sub="What the owner sees on his phone while travelling" pad={false}>
      <div style={{ padding: "6px 16px 18px", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 340, borderRadius: 34, border: "1px solid var(--border-strong)", background: "var(--surface-faint)", padding: "14px 12px 16px", boxShadow: "0 18px 50px rgba(0,0,0,.35)" }}>
          <div style={{ width: 90, height: 5, borderRadius: 4, background: "var(--track)", margin: "0 auto 12px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 6px" }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Signs ASAP</span>
            <Badge tone="info">Away mode</Badge>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--faint)" }}>{dayLabel(DEMO_TODAY)}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginTop: 12 }}>
            {[[h.open, "open"], [h.proofs, "proofs"], [h.workshop, "in shop"], [h.materials, "holds"]].map(([n, l]) => (
              <div key={l as string} style={{ textAlign: "center", padding: "8px 2px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 17, fontWeight: 600 }}>{n}</div>
                <div style={{ fontSize: 10, color: "var(--faint)" }}>{l}</div>
              </div>
            ))}
          </div>
          <Label style={{ margin: "14px 6px 8px" }}>{q.length ? "Needs you (" + q.length + ")" : "Needs you"}</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {q.length === 0 && <div style={{ fontSize: 12.5, color: "var(--dim)", padding: "6px 8px" }}>Nothing waiting. The team has what it needs.</div>}
            {q.map((it) => {
              const asked = !!s.decisionsDone["remote-info-" + it.key];
              return (
                <div key={it.key} style={{ padding: "11px 12px", borderRadius: 16, background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "inset 3px 0 0 " + toneColor[it.tone] }}>
                  <div style={{ fontSize: 13, fontWeight: 600, cursor: it.jobId ? "pointer" : undefined }} onClick={() => it.jobId && openJob(it.jobId)}>{it.title}</div>
                  <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 3, lineHeight: 1.45 }}>{it.detail}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 9, flexWrap: "wrap" }}>
                    {it.approve && <Btn small kind="primary" onClick={it.approve.run}>{it.approve.label}</Btn>}
                    <Btn small disabled={asked} onClick={() => requestInfo(it)}>{asked ? "Info requested" : "Request info"}</Btn>
                    {it.taskId && <Btn small kind="quiet" onClick={() => setReassign(reassign === it.key ? null : it.key)}>Reassign</Btn>}
                  </div>
                  {reassign === it.key && it.taskId && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
                      {PEOPLE.filter((p) => !p.owner).map((p) => {
                        const cur = tasks(s).find((t) => t.id === it.taskId)?.assignee === p.id;
                        return (
                          <button key={p.id} type="button" className="sa-jobchip" style={cur ? { borderColor: "var(--accent-line)", color: "var(--ink)" } : undefined}
                            onClick={() => { reassignTask(it.taskId as string, p.id); log("human", "Managing Director", "Reassigned task for " + it.title + " to " + p.name + " (from phone).", it.jobId, "task", "info"); setReassign(null); }}>
                            <Avatar id={p.id} size={16} />{p.name.split(" ")[0]}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <Label style={{ margin: "14px 6px 8px" }}>Story jobs</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 4px" }}>
            {STORY_IDS.map((id) => {
              const j = job(id);
              if (!j) return null;
              const si = STAGES.findIndex((x) => x.id === j.stage);
              return (
                <div key={id} onClick={() => openJob(id)} className="sa-click">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12 }}>
                    <span style={{ color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{j.short}</span>
                    <span style={{ color: "var(--dim)", flex: "none" }}>{stageLabel(j.stage)}</span>
                  </div>
                  <div style={{ display: "flex", gap: 2, marginTop: 5 }}>
                    {STAGES.map((st, i) => <span key={st.id} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= si ? (j.blocker ? "var(--warn)" : "var(--accent)") : "var(--track)" }} />)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

function WorkshopLive() {
  const [s] = useDemo();
  const wos = workOrders(s);
  const h = headline(s);
  const fl = fleet(s);
  const blocked = wos.filter((w) => (w.locked || w.blocker) && w.col !== "fit").length;
  const moving = wos.filter((w) => w.col === "fabrication" || w.col === "assembly" || w.col === "qa").length;
  return (
    <>
      <PageHead kicker="Production" title="Workshop live" sub="Every work order from materials to ready-for-fit, with the approved proof version it is built from. Click a card for the full job."
        actions={<><Btn onClick={() => go("Production", "orders")}>Work packs</Btn><Btn kind="primary" onClick={() => setTv(true)}>Open TV mode</Btn></>} />
      <Grid min={170}>
        <Stat label="Jobs in production" value={h.workshop} sub={"of " + h.open + " open jobs"} onClick={() => go("Jobs", "pipeline")} />
        <Stat label="On the benches now" value={moving} sub="printing, fabrication, assembly, QA" />
        <Stat label="Blocked work orders" value={blocked} tone={blocked ? "warn" : "ok"} sub="materials, proof or deposit" onClick={() => go("Production", "materials")} />
        <Stat label="Fleet livery" value={fl.done + "/" + fl.total} sub="vans complete" tone="accent" />
      </Grid>
      <div className="sa-kanban">
        {WO_COLS.map((c) => {
          const list = wos.filter((w) => w.col === c.id).sort((a, b) => a.promised.getTime() - b.promised.getTime());
          return (
            <div key={c.id} className="sa-col">
              <div className="sa-col-head">
                <span>{c.label}</span>
                <span style={{ marginLeft: "auto", fontSize: 11.5, color: "var(--faint)", fontWeight: 500 }}>{list.length}</span>
              </div>
              {list.map((w) => <WoTile key={w.id} w={w} />)}
              {list.length === 0 && <div style={{ fontSize: 12, color: "var(--faint)", padding: "10px 6px" }}>Clear</div>}
            </div>
          );
        })}
      </div>
      <Grid cols="repeat(auto-fit,minmax(300px,1fr))">
        <FleetPanel />
        <CapacityMini />
        <OwnerRemote />
      </Grid>
    </>
  );
}

/* ── Work orders ────────────────────────────────────────────────────────── */
const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
function printPack(w: WorkOrder) {
  const j = job(w.jobId);
  const p = approvedProof(w.jobId);
  const rows: [string, string][] = [
    ["Job", w.jobId + " · " + (j?.title || "")], ["Customer", customer(j?.customerId || "")?.name || ""], ["Sign type", w.signType], ["Dimensions", w.dims],
    ["Materials", w.materials], ["Method", w.method], ["Approved proof", p ? "v" + p.v + " · " + p.pantone + " · " + p.substrate + " · " + p.lighting : "No approved proof: do not start"],
    ["Safety", w.safety || j?.safety || "Standard workshop PPE"], ["Assigned", person(w.personId).name + " · " + (STATIONS.find((x) => x.id === w.station)?.label || "")],
    ["Planned hours", String(w.hours)], ["Promised", dayLabel(w.promised)],
  ];
  const win = window.open("", "_blank", "width=820,height=1000");
  if (!win) { toast("Allow pop-ups to print the work pack"); return; }
  win.document.write("<!doctype html><html><head><meta charset='utf-8'><title>" + esc(w.id) + " work pack</title><style>body{font-family:system-ui,sans-serif;margin:36px;color:#111}h1{font-size:22px;margin:0 0 4px}p{color:#555;margin:0 0 20px}table{border-collapse:collapse;width:100%}td{border-top:1px solid #ddd;padding:10px 8px;vertical-align:top;font-size:14px}td:first-child{width:160px;color:#666}footer{margin-top:28px;font-size:11px;color:#888}</style></head><body>"
    + "<h1>" + esc(w.id + " · " + w.title) + "</h1><p>Signs ASAP work pack · printed " + esc(dayLabel(DEMO_TODAY)) + "</p><table>"
    + rows.map(([k, v]) => "<tr><td>" + esc(k) + "</td><td>" + esc(v) + "</td></tr>").join("") + "</table><footer>Illustrative demo data. Build only from the approved proof version shown.</footer></body></html>");
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

function WorkOrders() {
  const [s] = useDemo();
  const [station, setStation] = useState<"all" | Station>("all");
  const wos = workOrders(s).filter((w) => station === "all" || w.station === station).sort((a, b) => colIdx(a.col) - colIdx(b.col) || a.promised.getTime() - b.promised.getTime());
  const opts = [{ id: "all" as const, label: "All stations" }].concat(STATIONS.filter((x) => workOrders(s).some((w) => w.station === x.id)).map((x) => ({ id: x.id as any, label: x.short })));
  return (
    <>
      <PageHead kicker="Production" title="Work orders" sub="Printable work packs. Each one is tied to the approved proof version, so the bench builds what the customer signed."
        actions={<Seg options={opts} value={station} onChange={(x) => setStation(x as any)} />} />
      <Grid min={340}>
        {wos.map((w) => {
          const j = job(w.jobId);
          const p = approvedProof(w.jobId);
          const nc = nextCol(w);
          const st = STATIONS.find((x) => x.id === w.station);
          const planned = w.dayPlan.reduce((a, b) => a + b, 0);
          return (
            <Card key={w.id} title={<span><span className="sa-mono" style={{ color: "var(--faint)", fontWeight: 500 }}>{w.id}</span>{"  " + w.title}</span>}
              sub={customer(j?.customerId || "")?.name} right={<Badge tone={w.locked ? "bad" : w.col === "fit" ? "ok" : w.blocker ? "warn" : "accent"}>{w.locked ? "Locked" : WO_COLS[colIdx(w.col)].label}</Badge>}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <KV k="Dimensions" v={w.dims} />
                <KV k="Workstation" v={(st?.label || "") + " · " + person(w.personId).name} />
                <KV k="Materials" v={w.materials} />
                <KV k="Method" v={w.method} />
              </div>
              <div style={{ marginTop: 8, padding: "10px 12px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface-faint)" }}>
                <Label>Build from</Label>
                {p ? (
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 6 }}>
                    <span style={{ display: "flex", gap: 3 }}>{p.swatch.map((c) => <span key={c} style={{ width: 14, height: 14, borderRadius: 4, background: c, border: "1px solid var(--border)" }} />)}</span>
                    <span style={{ fontSize: 12.5, color: "var(--ink)" }}>{"Proof v" + p.v + " approved"}</span>
                    <span style={{ fontSize: 12, color: "var(--dim)", minWidth: 0 }}>{p.pantone + " · " + p.lighting}</span>
                  </div>
                ) : <div style={{ fontSize: 12.5, color: "var(--bad)", marginTop: 6 }}>No approved proof. Proof Guardian blocks release.</div>}
              </div>
              {(w.safety || j?.safety) && <Note tone="warn" style={{ marginTop: 8 }}>{w.safety || j?.safety}</Note>}
              {w.blocker && <Note tone={w.locked ? "bad" : "warn"} style={{ marginTop: 8 }}>{w.blocker}</Note>}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                <span style={{ fontSize: 12, color: "var(--dim)" }}>{w.hours + " h planned · " + planned + " h this week"}</span>
                <span style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 18 }}>
                  {w.dayPlan.map((hh, i) => <span key={i} title={weekdayShort(weekDays()[i]) + " " + hh + " h"} style={{ width: 6, height: Math.max(2, (hh / 7.5) * 18), borderRadius: 2, background: hh ? "var(--accent)" : "var(--track)" }} />)}
                </span>
                <span style={{ marginLeft: "auto", fontSize: 12, color: dueSoon(w.promised) && w.col !== "fit" ? "var(--warn)" : "var(--dim)" }}>{"Promised " + relDay(w.promised)}</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <Btn small onClick={() => printPack(w)}>Print pack</Btn>
                <JobChip id={w.jobId} label="" />
                <span style={{ flex: 1 }} />
                {w.col === "qa" ? <Btn small kind="primary" onClick={() => openQa(w.id)}>QA checks</Btn>
                  : nc ? <Btn small kind="primary" disabled={!!w.locked || (!!w.blocker && w.col === "materials")} title={w.blocker} onClick={() => moveWo(w, nc)}>
                    {w.col === "materials" ? "Materials in" : w.col === "ready" ? "Start" : "Mark done: to " + WO_COLS[colIdx(nc)].short}</Btn>
                  : <Badge tone="ok">Ready for fit</Badge>}
              </div>
            </Card>
          );
        })}
      </Grid>
      <Source>{"Moves are made by the person at the bench and written to Activity under their name. The owner does not need to be asked."}</Source>
    </>
  );
}

/* ── Capacity ───────────────────────────────────────────────────────────── */
function Capacity() {
  const [s] = useDemo();
  const loads = stationLoads(s);
  const days = weekDays();
  const ti = todayIdx();
  const cfs = conflicts(s);
  const [sel, setSel] = useState<{ st: Station; d: number } | null>(null);
  const cuOk = isApproved("PV-43-3", s);
  const finish = s.rushScenario && cuOk ? rushFinish(s) : null;
  const util = workshopUtilisation(s);
  const upcoming = installs(s).filter((i) => i.status !== "done" && bdFromToday(i.date) >= 0 && bdFromToday(i.date) < 10);
  const crewDays = FITTERS.length * 10;
  const selL = sel ? loads.find((l) => l.id === sel.st) : null;
  const narrow = useNarrow();
  return (
    <>
      <PageHead kicker="Production" title="Capacity" sub="Five people, four stations, Monday to Friday. Manufacture is the bottleneck; fitting crews have slack."
        actions={<Badge tone={util.pct > 100 ? "bad" : util.pct > 90 ? "warn" : "ok"}>{"Workshop " + util.pct.toFixed(0) + "% this week"}</Badge>} />
      <Grid cols={narrow ? "1fr" : "minmax(0,1.7fr) minmax(300px,1fr)"}>
        <Card title="Station load by day" sub={CAP_NOTE} pad={false}>
          <div style={{ overflowX: "auto", padding: "4px 16px 16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "150px repeat(5,minmax(86px,1fr)) 80px", gap: 6, minWidth: 700 }}>
              <div />
              {days.map((d, i) => <div key={i} style={{ fontSize: 11.5, color: i === ti ? "var(--accent)" : "var(--faint)", fontWeight: 600, padding: "4px 2px" }}>{weekdayShort(d) + " " + d.getDate() + (i === ti ? " · today" : "")}</div>)}
              <div style={{ fontSize: 11.5, color: "var(--faint)", fontWeight: 600, padding: "4px 2px" }}>Week</div>
              {loads.map((l) => (
                <Row key={l.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Avatar id={l.personId} size={22} /><div style={{ minWidth: 0 }}><div style={{ fontSize: 12.5 }}>{l.short}</div><div style={{ fontSize: 11, color: "var(--faint)" }}>{person(l.personId).name.split(" ")[0]}</div></div></div>
                  {l.days.map((h, d) => {
                    const pct = (h / l.cap) * 100, over = pct > 100.5, on = sel && sel.st === l.id && sel.d === d;
                    return (
                      <button type="button" key={d} onClick={() => setSel(on ? null : { st: l.id, d })} className="sa-click"
                        style={{ textAlign: "left", font: "inherit", padding: "9px 10px", borderRadius: 12, border: "1px solid " + (on ? "var(--accent-line)" : over ? "color-mix(in oklab,var(--bad) 45%,var(--border))" : "var(--border)"),
                          background: over ? "var(--bad-soft)" : d < ti ? "transparent" : "var(--surface-faint)", color: "var(--ink)", opacity: d < ti ? 0.55 : 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: over ? "var(--bad)" : "var(--ink)" }}>{h.toFixed(1) + " h"}</div>
                        <div style={{ fontSize: 11, color: "var(--dim)", margin: "2px 0 6px" }}>{pct.toFixed(0) + "%"}</div>
                        <Meter value={Math.min(pct, 100)} over={over} tone={pct > 95 ? "warn" : "accent"} height={4} />
                      </button>
                    );
                  })}
                  <div style={{ padding: "9px 4px", fontSize: 12.5, fontWeight: 600, color: l.week > l.weekCap ? "var(--bad)" : "var(--ink)" }}>{((l.week / l.weekCap) * 100).toFixed(0) + "%"}<div style={{ fontSize: 11, color: "var(--faint)", fontWeight: 400 }}>{l.week.toFixed(1) + " / " + l.weekCap}</div></div>
                </Row>
              ))}
            </div>
            {selL && sel && (
              <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--surface-faint)" }}>
                <Label>{selL.label + " · " + dayLabel(days[sel.d])}</Label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                  {selL.items.filter((i) => i.plan[sel.d] > 0).map((i) => (
                    <div key={i.label} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5 }}>
                      <span style={{ flex: 1, color: "var(--body)" }}>{i.label}</span>
                      {i.jobId && <JobChip id={i.jobId} label="" />}
                      <span style={{ fontWeight: 600, minWidth: 44, textAlign: "right" }}>{i.plan[sel.d] + " h"}</span>
                    </div>
                  ))}
                  {selL.items.every((i) => !(i.plan[sel.d] > 0)) && <span style={{ fontSize: 12.5, color: "var(--dim)" }}>Nothing planned.</span>}
                </div>
              </div>
            )}
          </div>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <Card title={cfs.length ? "Capacity warnings" : "No capacity conflicts"} sub={cfs.length ? "Production Planner proposes; you decide. Dates are never promised automatically." : "Every station fits inside 7.5 h a day for the rest of the week."} tone={cfs.length ? "warn" : undefined}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {cfs.map((c, i) => (
                <div key={i} style={{ padding: "11px 12px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--surface-faint)" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Badge tone="bad">{c.stationLabel}</Badge>
                    <span style={{ fontSize: 12.5, color: "var(--ink)" }}>{weekdayShort(days[c.day]) + ": " + c.load.toFixed(1) + " h of " + c.cap + " h"}</span>
                    <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--bad)" }}>{"+" + c.over.toFixed(1) + " h"}</span>
                  </div>
                  {c.suggestion ? (
                    <>
                      <div style={{ fontSize: 12.5, color: "var(--body)", marginTop: 8, lineHeight: 1.5 }}>{c.suggestion.text}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 9 }}>
                        <Btn small kind="primary" onClick={() => c.suggestion && shiftPlan(c.suggestion.woId, c.suggestion.plan, c.suggestion.text)}>Apply suggestion</Btn>
                        <JobChip id={c.suggestion.jobId} label="" />
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: 12.5, color: "var(--body)", marginTop: 8, lineHeight: 1.5 }}>{c.noSlot}</div>
                  )}
                </div>
              ))}
            </div>
          </Card>
          <Card title="Simulate a rush LED sign" sub="What happens if the Celbridge CU sign is pushed to this week, alongside the fleet batch and the Swords fascia?">
            {!cuOk ? (
              <>
                <Note tone="warn">The CU proof v3 is not approved, so nothing can be cut. Approve it first (only once the branch has signed off), then run the simulation.</Note>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <Btn kind="primary" small onClick={() => approveProof("PV-43-3")}>Approve proof v3</Btn>
                  <Btn small kind="quiet" onClick={() => go("Jobs", "proofs")}>Review proof first</Btn>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Seg size="sm" options={[{ id: "off", label: "Normal plan" }, { id: "on", label: "Rush this week" }]} value={s.rushScenario ? "on" : "off"} onChange={(x) => setRushScenario(x === "on")} />
                </div>
                {s.rushScenario && finish && (
                  <div style={{ marginTop: 12 }}>
                    <Note tone="bad">{"CNC cannot absorb 22 h of LED fabrication on top of the Swords fascia this week. Earliest realistic CNC finish: " + dayLabel(finish) + ", then a 24 h burn test. Planner estimate, not a promise to the customer."}</Note>
                    <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                      <Btn small onClick={() => { addTask({ title: "Agree realistic fit date with Celbridge CU (CNC finish " + dayLabel(finish) + ")", assignee: "md", dept: "Management", jobId: "JOB-26043", priority: "High", due: bd(1), status: "Open" }); toast("Task created: agree a realistic date with the branch"); }}>Agree realistic date</Btn>
                      <Btn small kind="quiet" onClick={() => { log("human", "Managing Director", "Considering overtime on CNC for the rush CU sign (decision pending).", "JOB-26043", "capacity", "warn"); toast("Logged: overtime decision pending (no one is booked)"); }}>Consider overtime</Btn>
                    </div>
                  </div>
                )}
                {!s.rushScenario && <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 10 }}>Normal plan: CU tray on CNC Thu and Fri, inside its promised date.</div>}
              </>
            )}
          </Card>
          <Card title="Where the bottleneck is">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <KV k="Workshop" v={util.pct.toFixed(0) + "% loaded"} />
              <KV k="Fitting crews" v={(crewDays - upcoming.length) + " of " + crewDays + " crew-days free"} />
            </div>
            <div style={{ fontSize: 12.5, color: "var(--body)", lineHeight: 1.55, marginTop: 10 }}>
              {"Installation is flexible: in-house fit plus " + FITTERS.filter((f) => f.kind === "external").length + " partner crews on call. Manufacture is the constraint: five people and four stations. Doubling demand would strain the workshop first, not the fitters."}
            </div>
          </Card>
        </div>
      </Grid>
    </>
  );
}
function Row({ children }: { children: ReactNode }) { return <>{children}</>; }

/* ── Materials ──────────────────────────────────────────────────────────── */
const MAT_TONE: Record<MatStatus, Tone> = { "In stock": "ok", Ordered: "info", "Awaiting ETA": "warn", Received: "ok", Short: "bad" };
function Materials() {
  const [s] = useDemo();
  const ms = materials(s);
  const [filter, setFilter] = useState<"all" | MatStatus>("all");
  const rows = ms.filter((m) => filter === "all" || m.status === filter);
  const count = (st: MatStatus) => ms.filter((m) => m.status === st).length;
  const committed = ms.filter((m) => m.status === "Ordered" || m.status === "Awaiting ETA").reduce((a, m) => a + m.cost, 0);
  const cuOk = isApproved("PV-43-3", s);
  const chase = (id: string) => {
    const m = ms.find((x) => x.id === id);
    if (!m) return;
    addTask({ title: "Chase ETA: " + m.name, assignee: "aisling", dept: "Accounts", jobId: m.jobId, priority: "High", due: bd(0), status: "Open" });
    log("human", "Managing Director", "Asked Aisling to chase ETA on " + m.name + ".", m.jobId, "materials", "info");
    toast("Chase task created for Aisling (no supplier is contacted)");
  };
  return (
    <>
      <PageHead kicker="Production" title="Materials" sub="A light bill of materials per job. Statuses are set by the team; there are no live supplier feeds in this demo."
        actions={<Seg size="sm" options={[{ id: "all" as const, label: "All" }].concat((["Short", "Awaiting ETA", "Ordered", "In stock", "Received"] as MatStatus[]).map((x) => ({ id: x as any, label: x + " " + count(x) })))} value={filter} onChange={(x) => setFilter(x as any)} />} />
      <Grid min={180}>
        <Stat label="Short" value={count("Short")} tone={count("Short") ? "bad" : "ok"} sub="need ordering" />
        <Stat label="Awaiting ETA" value={count("Awaiting ETA")} tone={count("Awaiting ETA") ? "warn" : "ok"} sub="bought in from abroad" />
        <Stat label="On order" value={count("Ordered")} sub={eur(committed) + " committed"} />
        <Stat label="Ready to use" value={count("In stock") + count("Received")} tone="ok" sub="in stock or received" />
      </Grid>
      <Card pad={false} title="Bill of materials" sub="Costs are illustrative purchase values">
        <div style={{ padding: "0 16px 16px" }}>
          <Table rows={rows} rowTone={(m) => (m.status === "Short" ? "bad" : m.status === "Awaiting ETA" ? "warn" : undefined)}
            cols={[
              { key: "item", label: "Item", width: "minmax(200px,2fr)", render: (m) => <div style={{ minWidth: 0 }}><div style={{ color: "var(--ink)", fontSize: 13 }}>{m.name}</div><div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 2 }}>{m.qty + (m.note ? " · " + m.note : "")}</div></div> },
              { key: "sup", label: "Supplier", width: "minmax(140px,1.2fr)", hideSm: true, render: (m) => { const sp = supplier(m.supplierId); return <div style={{ minWidth: 0 }}><div style={{ fontSize: 12.5 }}>{sp?.name}</div><div style={{ fontSize: 11, color: "var(--faint)" }}>{sp?.origin}</div></div>; } },
              { key: "job", label: "Job", width: "minmax(120px,1fr)", hideSm: true, render: (m) => (m.jobId ? <JobChip id={m.jobId} label="" /> : "Stock") },
              { key: "st", label: "Status", width: "120px", render: (m) => <Badge tone={MAT_TONE[m.status]}>{m.status}</Badge> },
              { key: "eta", label: "ETA", width: "90px", hideSm: true, render: (m) => <span style={{ fontSize: 12.5, color: "var(--dim)" }}>{m.status === "Awaiting ETA" ? "Unconfirmed" : m.eta && m.status === "Ordered" ? relDay(m.eta) : "-"}</span> },
              { key: "cost", label: "Cost", width: "80px", align: "right", render: (m) => <span className="sa-mono">{eur(m.cost)}</span> },
              { key: "act", label: "", width: "minmax(150px,1.1fr)", align: "right", render: (m) => {
                if (m.status === "Short" && m.needsApproval) return <Btn small kind="primary" onClick={() => approveMaterialOrder(m.id)}>Approve order</Btn>;
                if (m.status === "Short" && m.jobId === "JOB-26043") return cuOk ? <Btn small onClick={() => { setMaterialStatus(m.id, "Ordered"); toast("Order placed (mock: no supplier contacted)"); }}>Order now</Btn> : <span style={{ fontSize: 11.5, color: "var(--faint)" }}>After v3 sign-off</span>;
                if (m.status === "Short") return <Btn small onClick={() => setMaterialStatus(m.id, "Ordered")}>Order</Btn>;
                if (m.status === "Awaiting ETA") return <span style={{ display: "flex", gap: 6 }}><Btn small onClick={() => chase(m.id)}>Chase ETA</Btn><Btn small kind="quiet" onClick={() => setMaterialStatus(m.id, "Received")}>Received</Btn></span>;
                if (m.status === "Ordered") return <Btn small kind="quiet" onClick={() => setMaterialStatus(m.id, "Received")}>Mark received</Btn>;
                return <span style={{ fontSize: 11.5, color: "var(--faint)" }}>Ready</span>;
              } },
            ]} />
        </div>
      </Card>
      <Card title="Where materials come from" sub="Supplier names are not recorded in the demo; origins follow the call">
        <Grid min={220} gap={10}>
          {SUPPLIERS.map((sp) => {
            const n = ms.filter((m) => m.supplierId === sp.id && m.status !== "Received" && m.status !== "In stock").length;
            return (
              <div key={sp.id} style={{ padding: "12px 14px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--surface-faint)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{sp.name}</span><Badge tone={sp.origin === "Poland" || sp.origin === "China" ? "info" : "muted"}>{sp.origin}</Badge></div>
                <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 6, lineHeight: 1.45 }}>{sp.supplies}</div>
                <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 6 }}>{"Lead time " + sp.lead + (n ? " · " + n + " open line" + (n > 1 ? "s" : "") : "")}</div>
              </div>
            );
          })}
        </Grid>
      </Card>
    </>
  );
}

/* ── Quality checks ─────────────────────────────────────────────────────── */
function relevantChecks(w: WorkOrder) {
  const j = job(w.jobId);
  const led = j?.kind === "led" && /LED|lightbox|illuminat/i.test(w.signType + " " + w.materials);
  const vinyl = /vinyl|film|wrap|graphic|print|banner|frost/i.test(w.signType + " " + w.materials + " " + w.method);
  return QA_CHECKS.filter((c) => (c.id === "led" ? led : c.id === "vinyl" ? vinyl : true));
}
function Quality() {
  const [s] = useDemo();
  const wos = workOrders(s).filter((w) => !w.locked);
  const inQa = wos.filter((w) => w.col === "qa");
  const coming = wos.filter((w) => w.col === "assembly" || w.col === "fabrication");
  const passed = wos.filter((w) => w.col === "fit");
  const [sel, setSelState] = useState<string | null>(qaSelected || (inQa[0] || coming[0] || wos[0])?.id || null);
  const setSel = (id: string) => { qaSelected = id; setSelState(id); };
  const w = wos.find((x) => x.id === sel) || inQa[0] || coming[0];
  const checks = w ? relevantChecks(w) : [];
  const ticks = w ? s.qa[w.id] || {} : {};
  const passedOnRecord = (x: WorkOrder) => x.col === "fit";
  const all = w ? checks.every((c) => ticks[c.id] || passedOnRecord(w)) : false;
  const p = w ? approvedProof(w.jobId) : undefined;
  const j = w ? job(w.jobId) : undefined;
  const narrow = useNarrow();
  const group = (label: string, list: WorkOrder[]) => (
    <div>
      <Label style={{ margin: "4px 4px 8px" }}>{label + " (" + list.length + ")"}</Label>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {list.map((x) => (
          <button type="button" key={x.id} onClick={() => setSel(x.id)} className="sa-click"
            style={{ textAlign: "left", font: "inherit", padding: "10px 12px", borderRadius: 12, border: "1px solid " + (w && x.id === w.id ? "var(--accent-line)" : "var(--border)"), background: w && x.id === w.id ? "var(--accent-faint)" : "var(--surface-faint)", color: "var(--ink)" }}>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>{x.title}</div>
            <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 2 }}>{x.id + " · " + person(x.personId).name.split(" ")[0]}</div>
          </button>
        ))}
        {list.length === 0 && <div style={{ fontSize: 12, color: "var(--faint)", padding: "4px 6px" }}>None</div>}
      </div>
    </div>
  );
  return (
    <>
      <PageHead kicker="Production" title="Quality checks" sub="Nothing reaches Ready for fit without a QA sign-off against the approved proof: colour, substrate, dimensions, vinyl, LEDs and photos." />
      <Grid cols={narrow ? "1fr" : "minmax(240px,320px) minmax(0,1fr)"}>
        <Card pad>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {group("Waiting for QA", inQa)}
            {group("Coming to QA", coming)}
            {group("Signed off", passed)}
          </div>
        </Card>
        {w && j ? (
          <Card title={w.title} sub={customer(j.customerId)?.name + " · " + w.signType} right={<><JobChip id={w.jobId} label="" /><Badge tone={w.col === "fit" ? "ok" : w.col === "qa" ? "warn" : "muted"}>{w.col === "fit" ? "Signed off" : w.col === "qa" ? "In QA" : WO_COLS[colIdx(w.col)].label}</Badge></>}>
            <Grid cols={narrow ? "1fr" : "minmax(0,1.2fr) minmax(0,1fr)"} gap={16}>
              <div>
                <Label style={{ marginBottom: 8 }}>Checklist</Label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {checks.map((c) => {
                    const on = !!ticks[c.id] || passedOnRecord(w);
                    return (
                      <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, border: "1px solid " + (on ? "color-mix(in oklab,var(--ok) 40%,var(--border))" : "var(--border)"), background: on ? "var(--ok-soft)" : "var(--surface-faint)", cursor: w.col === "fit" ? "default" : "pointer" }}>
                        <input type="checkbox" checked={on} disabled={w.col === "fit"} onChange={() => toggleQa(w.id, c.id)} style={{ accentColor: "var(--ok)", width: 16, height: 16 }} />
                        <span style={{ fontSize: 13, color: "var(--ink)" }}>{c.label}</span>
                      </label>
                    );
                  })}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 8 }}>{QA_CHECKS.length - checks.length > 0 ? (QA_CHECKS.length - checks.length) + " check" + (QA_CHECKS.length - checks.length > 1 ? "s" : "") + " not relevant to this sign type." : "All checks apply."}</div>
                <Label style={{ margin: "16px 0 8px" }}>QA photos</Label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                  {["Front", "Detail / edge", "Label + version"].map((ph, i) => {
                    const has = !!ticks.photos || passedOnRecord(w);
                    return (
                      <button type="button" key={ph} disabled={w.col === "fit"} onClick={() => { if (!ticks.photos) toggleQa(w.id, "photos"); }}
                        style={{ aspectRatio: "4/3", borderRadius: 12, border: "1px dashed " + (has ? "var(--ok)" : "var(--border-strong)"), background: has ? "linear-gradient(135deg,rgba(79,209,139,.12),rgba(255,255,255,.02))" : "var(--surface-faint)", color: has ? "var(--ok)" : "var(--faint)", font: "inherit", fontSize: 11.5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 6 }}>
                        {has ? ph + " · placeholder" : i === 0 ? "Tap to add photo" : ph}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label style={{ marginBottom: 8 }}>Check against</Label>
                {p ? (
                  <>
                    <ProofArt swatch={p.swatch} label={"Proof v" + p.v + " (approved)"} lit={j.kind === "led"} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
                      <KV k="Pantone" v={p.pantone} />
                      <KV k="Size" v={p.size} />
                      <KV k="Substrate" v={p.substrate} />
                      <KV k="Lighting" v={p.lighting} />
                    </div>
                  </>
                ) : <Note tone="bad">No approved proof on this job. QA cannot pass.</Note>}
              </div>
            </Grid>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
              <span style={{ fontSize: 12.5, color: "var(--dim)", flex: 1, minWidth: 200 }}>
                {w.col === "fit" ? "Signed off. This work order is Ready for fit." : all ? "All checks complete. Sign-off moves it to Ready for fit and is written to Activity." : (checks.filter((c) => !ticks[c.id]).length) + " check(s) still open."}
              </span>
              {w.col !== "qa" && w.col !== "fit" && <Btn onClick={() => moveWo(w, "qa")}>Move to QA</Btn>}
              {w.col !== "fit" && <Btn kind="primary" disabled={!all || w.col !== "qa" || !p} onClick={() => signOffQa(w.id)}>Sign off QA</Btn>}
              {w.col === "fit" && <Btn kind="quiet" onClick={() => go("Installations", "ready")}>See Ready for fit</Btn>}
            </div>
          </Card>
        ) : <Card><Empty title="Nothing in QA" sub="Work orders appear here when they leave the benches." /></Card>}
      </Grid>
    </>
  );
}

/* ── TV tab ─────────────────────────────────────────────────────────────── */
function TvTab() {
  return (
    <>
      <PageHead kicker="Production" title="TV mode" sub="The floor display for the workshop screen: Now, Next and Blocked, readable from the benches. It updates from the same data as this page."
        actions={<Btn kind="primary" onClick={() => setTv(true)}>Launch full screen</Btn>} />
      <div style={{ borderRadius: 26, padding: "22px 24px", background: "radial-gradient(120% 80% at 10% 0%,#0f2530 0%,#0a0d10 45%,#07090b 100%)", border: "1px solid var(--border-strong)", boxShadow: "0 24px 60px rgba(0,0,0,.35)" }}>
        <TvBoard />
      </div>
      <Source>Landscape screens work best. Press Esc to leave full screen. The sync line is a local simulation; there is no live connection.</Source>
    </>
  );
}

export default function Production(_props: { v: any }) {
  useDemo();
  const tab = getTab("Production", firstTab("Production"));
  return (
    <Page>
      {tab === "live" && <WorkshopLive />}
      {tab === "orders" && <WorkOrders />}
      {tab === "capacity" && <Capacity />}
      {tab === "materials" && <Materials />}
      {tab === "qa" && <Quality />}
      {tab === "tv" && <TvTab />}
    </Page>
  );
}
