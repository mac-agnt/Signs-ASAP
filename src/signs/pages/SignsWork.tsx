/* Work: who needs to do what now. Tasks, owner approvals, the Mon-Fri week and
   the automation queue. Every action updates the shared demo state, so a done
   task moves its work order and lands in Activity. Nothing is ever sent. */

import { useState } from "react";
import {
  useDemo, getTab, go, tasks, setTaskStatus, reassignTask, addTask, approveProof, awaitingProofs, approveMaterialOrder, materials,
  isApproved, payStatusOf, recordPayment, jobs, job, setJobPrice, markDecision, markAgentDone, log, toast, workOrders, installs,
  eur, pct, margin, person, jobShort, tenderStatus, tenderCalc, shiftPlan, fitter, openJob, update, type DemoState,
} from "../model";
import { firstTab } from "../nav";
import { AGENTS, PEOPLE, SURVEYS, TENDER_DRAFT, STATIONS, type Task } from "../data";
import { weekDays, weekdayShort, dayLabel, relDay, sameDay, DEMO_TODAY, isOverdue, bd } from "../dates";
import { Page, PageHead, Grid, Card, Badge, Btn, Table, JobChip, Note, Avatar, Seg, Stat, Source, Empty, Label, type Tone } from "../ui";
import { stationLoads, priceForMargin } from "./metrics";

export default function SignsWork(_props: { v: any }) {
  const [s] = useDemo();
  const tab = getTab("Work", firstTab("Work"));
  return (
    <Page>
      {tab === "tasks" && <MyTasks s={s} />}
      {tab === "approvals" && <Approvals s={s} />}
      {tab === "week" && <ThisWeek s={s} />}
      {tab === "automation" && <Automation s={s} />}
    </Page>
  );
}

const prioTone = (p: Task["priority"]): Tone => (p === "High" ? "warn" : p === "Medium" ? "info" : "muted");
const statusTone = (st: Task["status"]): Tone => (st === "Done" ? "ok" : st === "In progress" ? "accent" : st === "Blocked" ? "bad" : "muted");

/* ── My tasks ───────────────────────────────────────────────────────────── */
function MyTasks({ s }: { s: DemoState }) {
  const [who, setWho] = useState<string>("md");
  const [show, setShow] = useState<"open" | "done" | "all">("open");
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("conor");
  const [jobId, setJobId] = useState("");
  const [prio, setPrio] = useState<Task["priority"]>("Medium");
  const [dueIn, setDueIn] = useState(1);
  const all = tasks(s);
  const scoped = all.filter((t) => who === "all" || t.assignee === who);
  const rows = scoped.filter((t) => (show === "all" ? true : show === "done" ? t.status === "Done" : t.status !== "Done"))
    .sort((a, b) => (a.status === "Done" ? 1 : 0) - (b.status === "Done" ? 1 : 0) || a.due.getTime() - b.due.getTime());
  const open = all.filter((t) => t.status !== "Done");
  const today = open.filter((t) => sameDay(t.due, DEMO_TODAY));
  const late = open.filter((t) => isOverdue(t.due));
  const done = all.filter((t) => t.status === "Done");
  const add = () => {
    if (!title.trim()) return;
    const p = person(assignee);
    addTask({ title: title.trim(), assignee, dept: p.dept, jobId: jobId || undefined, priority: prio, due: bd(dueIn), status: "Open" });
    log("human", "Managing Director", "Created task for " + p.name + ": " + title.trim() + ".", jobId || undefined, "task", "info");
    toast("Task added for " + p.name);
    setTitle("");
  };
  const people = [{ id: "md", label: "Mine" }, { id: "all", label: "Everyone" }].concat(PEOPLE.filter((p) => !p.owner).map((p) => ({ id: p.id, label: p.name.split(" ")[0] })));
  return (
    <>
      <PageHead kicker="Work" title={who === "md" ? "My tasks" : who === "all" ? "Everyone's tasks" : person(who).name + "'s tasks"}
        sub="Every task has an owner, a department, a linked job and a date. Completing one updates its work order and the activity log." />
      <Grid min={170}>
        <Stat label="Open" value={open.length} sub={open.filter((t) => t.assignee === "md").length + " are yours"} />
        <Stat label="Due today" value={today.length} sub={today.map((t) => person(t.assignee).name.split(" ")[0]).filter((x, i, a) => a.indexOf(x) === i).join(", ") || "Nobody"} tone={today.length ? "warn" : undefined} />
        <Stat label="Overdue" value={late.length} sub={late.length ? "Past their date" : "Nothing late"} tone={late.length ? "bad" : "ok"} />
        <Stat label="Done" value={done.length} sub="Completed this week" tone="ok" />
      </Grid>

      <Card title="Task list" right={
        <>
          <Seg size="sm" value={who} onChange={setWho} options={people} />
          <Seg size="sm" value={show} onChange={setShow} options={[{ id: "open", label: "Open" }, { id: "done", label: "Done" }, { id: "all", label: "All" }]} />
        </>
      }>
        <Table<Task> rows={rows} rowTone={(t) => (t.status !== "Done" && isOverdue(t.due) ? "bad" : undefined)}
          empty={<Empty title="Nothing in this view" sub="Try Everyone, or switch to Done." />}
          cols={[
            { key: "t", label: "Task", width: "2.4fr", render: (t) => (
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", color: t.status === "Done" ? "var(--faint)" : "var(--ink)", textDecoration: t.status === "Done" ? "line-through" : "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</span>
                <span style={{ fontSize: 11, color: "var(--faint)" }}>{t.id}{t.woId ? " · " + t.woId : ""} · {t.dept}</span>
              </span>
            ) },
            { key: "who", label: "Assignee", width: "1.4fr", render: (t) => (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                <Avatar id={t.assignee} size={22} />
                <select className="sa-input" aria-label={"Reassign " + t.title} value={t.assignee} onClick={(e) => e.stopPropagation()} onChange={(e) => reassignTask(t.id, e.target.value)}
                  style={{ height: 28, padding: "0 6px", fontSize: 12, width: "auto", minWidth: 0, maxWidth: 140 }}>
                  {PEOPLE.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </span>
            ) },
            { key: "job", label: "Job", width: "1.5fr", hideSm: true, render: (t) => (t.jobId ? <JobChip id={t.jobId} /> : <span style={{ color: "var(--faint)", fontSize: 12 }}>{t.id === "T-17" ? "Tender " + TENDER_DRAFT.id : "No job"}</span>) },
            { key: "p", label: "Priority", width: ".8fr", hideSm: true, render: (t) => <Badge tone={prioTone(t.priority)}>{t.priority}</Badge> },
            { key: "due", label: "Due", width: ".9fr", render: (t) => <span style={{ color: t.status !== "Done" && isOverdue(t.due) ? "var(--bad)" : sameDay(t.due, DEMO_TODAY) ? "var(--warn)" : "var(--body)" }}>{relDay(t.due)}</span> },
            { key: "st", label: "Status", width: "1fr", render: (t) => <Badge tone={statusTone(t.status)}>{t.status}</Badge> },
            { key: "a", label: "", width: "1fr", align: "right", render: (t) => t.status === "Done"
              ? <Btn small kind="quiet" onClick={() => setTaskStatus(t.id, "Open")}>Reopen</Btn>
              : <Btn small kind={t.status === "In progress" ? "primary" : "ghost"} onClick={() => { setTaskStatus(t.id, "Done"); toast("Done: " + t.title); }}>Complete</Btn> },
          ]} />
      </Card>

      <Card title="Add a task" sub="Assign it to a person and a job. It shows in their list and in This Week straight away.">
        <div style={{ display: "grid", gridTemplateColumns: "minmax(200px,2fr) repeat(4,minmax(120px,1fr)) auto", gap: 10, alignItems: "end" }} className="sa-taskform">
          <label><Label style={{ marginBottom: 6 }}>Task</Label><input className="sa-input" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") add(); }} placeholder="For example: order stand-offs for college boards" /></label>
          <label><Label style={{ marginBottom: 6 }}>Assignee</Label>
            <select className="sa-input" value={assignee} onChange={(e) => setAssignee(e.target.value)}>{PEOPLE.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <label><Label style={{ marginBottom: 6 }}>Job</Label>
            <select className="sa-input" value={jobId} onChange={(e) => setJobId(e.target.value)}>
              <option value="">No job</option>
              {jobs(s).filter((j) => j.stage !== "completed").map((j) => <option key={j.id} value={j.id}>{j.id} · {j.short}</option>)}
            </select></label>
          <label><Label style={{ marginBottom: 6 }}>Priority</Label>
            <select className="sa-input" value={prio} onChange={(e) => setPrio(e.target.value as Task["priority"])}>{["High", "Medium", "Low"].map((p) => <option key={p}>{p}</option>)}</select></label>
          <label><Label style={{ marginBottom: 6 }}>Due</Label>
            <select className="sa-input" value={dueIn} onChange={(e) => setDueIn(parseInt(e.target.value, 10))}>
              {[0, 1, 2, 3, 5].map((n) => <option key={n} value={n}>{relDay(bd(n))}</option>)}
            </select></label>
          <Btn kind="primary" onClick={add} disabled={!title.trim()} style={{ height: 42 }}>Add task</Btn>
        </div>
      </Card>
    </>
  );
}

/* ── Approvals ──────────────────────────────────────────────────────────── */
type Approval = { id: string; kind: string; title: string; detail: string; jobId?: string; value?: string; tone: Tone; done: boolean; doneLabel: string; actions: { label: string; kind?: "primary" | "ghost" | "quiet"; run: () => void; disabled?: boolean }[] };

function buildApprovals(s: DemoState): Approval[] {
  const out: Approval[] = [];
  // Artwork: client sign-offs the owner can record, and the CU v3 release.
  const cuV3 = isApproved("PV-43-3", s);
  const cu = job("JOB-26043", s);
  out.push({
    id: "ap-cu", kind: "Artwork", title: "Celbridge Credit Union LED sign: proof v3", jobId: "JOB-26043", value: cu ? eur(cu.price) : undefined,
    detail: "Solid aluminium tray (+€420 priced in), warm white 3000K, 6.0 m × 1.3 m demo size. Approving makes v3 the only version CNC can cut.",
    tone: "warn", done: cuV3, doneLabel: "v3 approved · released to CNC",
    actions: [{ label: "Approve v3", kind: "primary", run: () => approveProof("PV-43-3") }, { label: "Open proofs", run: () => go("Jobs", "proofs") }],
  });
  awaitingProofs(s).filter((p) => p.jobId !== "JOB-26043").forEach((p) => out.push({
    id: "ap-" + p.id, kind: "Artwork", title: jobShort(p.jobId) + ": proof v" + p.v, jobId: p.jobId,
    detail: p.summary + " " + p.emails, tone: "info", done: false, doneLabel: "Client sign-off recorded",
    actions: [{ label: "Record client sign-off", run: () => approveProof(p.id) }, { label: "Open", kind: "quiet", run: () => go("Jobs", "proofs") }],
  }));
  // Tender pricing.
  const tst = tenderStatus(TENDER_DRAFT, s);
  const tc = tenderCalc(TENDER_DRAFT, s);
  out.push({
    id: "ap-tender", kind: "Tender pricing", title: TENDER_DRAFT.title + " (" + TENDER_DRAFT.id + ")",
    value: s.tenderStage >= 5 ? eur(tc.sell) + " · " + pct(tc.marginPct) : undefined,
    detail: s.tenderStage >= 5 ? "Draft costing ready with 3 ambiguities flagged. Nothing is submitted without your approval." : "Tender pack arrived today and has not been extracted yet. Due " + dayLabel(TENDER_DRAFT.due) + ".",
    tone: "accent", done: tst === "approved", doneLabel: "Draft approved for submission",
    actions: s.tenderStage >= 5 ? [{ label: "Review submission", kind: "primary", run: () => go("Tenders", "review") }] : [{ label: "Open Tender Inbox", kind: "primary", run: () => go("Tenders", "inbox") }],
  });
  // Material orders.
  materials(s).filter((m) => m.needsApproval || m.id === "M-208").forEach((m) => {
    const isCu = m.id === "M-208";
    const gated = isCu && !(cuV3 && payStatusOf("PAY-503", s) === "paid");
    out.push({
      id: "ap-" + m.id, kind: "Material order", title: m.name, jobId: m.jobId, value: eur(m.cost),
      detail: (m.note || m.qty) + (isCu ? " Order only after proof v3 is signed and the 40% deposit is in." : " Mock order: no supplier is contacted."),
      tone: gated ? "muted" : "warn", done: m.status !== "Short", doneLabel: "Ordered (" + m.status.toLowerCase() + ")",
      actions: [{ label: gated ? "Waiting on proof + deposit" : "Approve order", kind: "primary", disabled: gated, run: () => approveMaterialOrder(m.id) }],
    });
  });
  // Deposit exceptions.
  const cuPay = payStatusOf("PAY-503", s);
  out.push({
    id: "ap-cudep", kind: "Deposit", title: "Celbridge CU 40% deposit", jobId: "JOB-26043", value: eur(3460),
    detail: "Invoiced yesterday. Purchasing of the aluminium tray is held until it lands.", tone: "warn", done: cuPay === "paid", doneLabel: "Deposit recorded",
    actions: [{ label: "Record as received", run: () => recordPayment("PAY-503") }, { label: "Deposits", kind: "quiet", run: () => go("Finance", "deposits") }],
  });
  out.push({
    id: "ap-donadep", kind: "Deposit exception", title: "Donabate Golf Club: no deposit (account customer)", jobId: "JOB-26054",
    detail: "Repeat account since 2018, invoiced on collection. Approve the exception so production is not held.", tone: "info", done: !!s.decisionsDone["ap-donadep"], doneLabel: "Exception approved",
    actions: [{ label: "Approve exception", run: () => { markDecision("ap-donadep"); log("human", "Managing Director", "Approved no-deposit exception for Donabate Golf Club (account customer).", "JOB-26054", "payment", "ok"); } }],
  });
  out.push({
    id: "ap-swdep", kind: "Deposit exception", title: "Swords Accountancy: paid 100% upfront", jobId: "JOB-26042",
    detail: "Customer paid in full before production. Acknowledge so the job is not chased for a balance.", tone: "ok", done: !!s.decisionsDone["ap-swdep"], doneLabel: "Exception acknowledged",
    actions: [{ label: "Acknowledge", run: () => { markDecision("ap-swdep"); log("human", "Managing Director", "Acknowledged 100% prepayment exception on Swords Accountancy rebrand.", "JOB-26042", "payment", "ok"); } }],
  });
  // Quote below floor.
  const rush = job("JOB-26050", s);
  if (rush) {
    const m = margin(rush.price, rush.cost);
    const sug = priceForMargin(rush.cost, s.marginFloor);
    out.push({
      id: "ap-rush", kind: "Quote below floor", title: "Rush Physio lightbox quote", jobId: rush.id, value: eur(rush.price) + " · " + pct(m),
      detail: "Quote Coach: below your " + s.marginFloor + "% floor. Suggested " + eur(sug) + " (" + pct(margin(sug, rush.cost)) + ").", tone: "warn",
      done: m >= s.marginFloor || !!s.decisionsDone["ap-rush"], doneLabel: m >= s.marginFloor ? "Price updated to " + eur(rush.price) : "Kept at " + eur(rush.price),
      actions: [
        { label: "Apply " + eur(sug), kind: "primary", run: () => { setJobPrice(rush.id, sug, "Applied Quote Coach price " + eur(sug) + " to Rush Physio lightbox (was " + eur(rush.price) + ")."); markAgentDone("qp1"); toast("Quote updated to " + eur(sug)); } },
        { label: "Keep my price", kind: "quiet", run: () => { markDecision("ap-rush"); log("human", "Managing Director", "Kept Rush Physio lightbox at " + eur(rush.price) + " below the margin floor.", rush.id, "quote", "info"); } },
      ],
    });
  }
  return out;
}

function Approvals({ s }: { s: DemoState }) {
  const [view, setView] = useState<"waiting" | "decided">("waiting");
  const list = buildApprovals(s);
  const waiting = list.filter((a) => !a.done);
  const decided = list.filter((a) => a.done);
  const rows = view === "waiting" ? waiting : decided;
  const kinds = waiting.reduce<Record<string, number>>((a, x) => { a[x.kind] = (a[x.kind] || 0) + 1; return a; }, {});
  return (
    <>
      <PageHead kicker="Work" title="Approvals"
        sub="Artwork, tender pricing, material orders and deposit exceptions. The owner stays in control of anything customer-facing or costly."
        actions={<Seg value={view} onChange={setView} options={[{ id: "waiting", label: "Awaiting you · " + waiting.length }, { id: "decided", label: "Decided · " + decided.length }]} />} />
      {view === "waiting" && waiting.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Object.keys(kinds).map((k) => <Badge key={k} tone="muted">{k}: {kinds[k]}</Badge>)}
        </div>
      )}
      {rows.length === 0 ? (
        <Card><Empty title={view === "waiting" ? "Nothing waiting on you" : "No decisions yet"} sub={view === "waiting" ? "Every approval in the demo has been handled. Reset the demo to replay them." : "Approve something on the other tab and it lands here."} /></Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((a) => (
            <Card key={a.id} tone={a.done ? undefined : a.tone === "muted" ? undefined : a.tone}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 360px", minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <Badge tone={a.done ? "ok" : a.tone}>{a.kind}</Badge>
                    {a.jobId && <JobChip id={a.jobId} label="" />}
                    {a.value && <span style={{ fontSize: 12.5, color: "var(--dim)", fontVariantNumeric: "tabular-nums" }}>{a.value}</span>}
                  </div>
                  <div style={{ fontSize: 14.5, fontWeight: 600, marginTop: 9, letterSpacing: "-.2px" }}>{a.title}</div>
                  <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 5, lineHeight: 1.55 }}>{a.detail}</div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", flex: "none" }}>
                  {a.done ? <Badge tone="ok" dot>{a.doneLabel}</Badge> : a.actions.map((x) => <Btn key={x.label} small kind={x.kind || "ghost"} disabled={x.disabled} onClick={x.run}>{x.label}</Btn>)}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Source>Approvals are local demo actions. Approving writes to the activity log as Managing Director; nothing is sent to customers, suppliers or the accounts package.</Source>
    </>
  );
}

/* ── This week ──────────────────────────────────────────────────────────── */
function ThisWeek({ s }: { s: DemoState }) {
  const days = weekDays(0);
  const ts = tasks(s);
  const wos = workOrders(s);
  const ins = installs(s);
  const loads = stationLoads(s);
  const items = days.map((d, di) => {
    const fits = ins.filter((i) => sameDay(i.date, d) && i.status !== "done");
    const done = ins.filter((i) => sameDay(i.date, d) && i.status === "done");
    const surveys = SURVEYS.filter((v) => sameDay(v.date, d));
    const due = ts.filter((t) => sameDay(t.due, d));
    const work = wos.filter((w) => (w.dayPlan[di] || 0) > 0).map((w) => ({ w, h: w.dayPlan[di] }));
    const hours = loads.reduce((a, l) => a + l.days[di], 0);
    const cap = loads.reduce((a, l) => a + l.dayCap, 0);
    return { d, di, fits, done, surveys, due, work, hours, cap };
  });
  const totalH = loads.reduce((a, l) => a + l.total, 0), totalCap = loads.reduce((a, l) => a + l.capacity, 0);
  return (
    <>
      <PageHead kicker="Work" title={"Week of " + dayLabel(days[0])}
        sub="Monday to Friday across the workshop and management: fits, surveys, work order hours and what is due. No weekend work is planned."
        actions={<><Badge tone={totalH / totalCap > 1 ? "bad" : totalH / totalCap > 0.85 ? "warn" : "ok"}>Workshop {Math.round((totalH / totalCap) * 100)}% loaded</Badge><Btn small onClick={() => go("Jobs", "calendar")}>Job calendar</Btn></>} />
      <div className="sa-kanban" style={{ gridAutoColumns: "minmax(240px,1fr)" }}>
        {items.map((it) => {
          const isToday = sameDay(it.d, DEMO_TODAY);
          const past = isOverdue(it.d);
          return (
            <div key={it.di} className="sa-col" style={{ borderColor: isToday ? "var(--accent-line)" : undefined, opacity: past ? 0.72 : 1 }}>
              <div className="sa-col-head">
                <span style={{ flex: 1 }}>{weekdayShort(it.d)} {it.d.getDate()}</span>
                {isToday && <Badge tone="accent">Today</Badge>}
              </div>
              <div style={{ padding: "0 4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--dim)" }}><span>Workshop</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{it.hours.toFixed(1)} / {it.cap} h</span></div>
                <div style={{ height: 6, borderRadius: 3, background: "var(--track)", marginTop: 5, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: Math.min(100, (it.hours / it.cap) * 100) + "%", background: it.hours > it.cap ? "var(--bad)" : "var(--accent)", borderRadius: 3 }} />
                </div>
              </div>
              {it.fits.map((i) => (
                <div key={i.id} className="sa-tile" onClick={() => openJob(i.jobId)} style={{ borderColor: "color-mix(in oklab,var(--teal) 40%,var(--border))" }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}><Badge tone="info">Fit</Badge><span style={{ fontSize: 11, color: "var(--faint)" }}>{i.slot}</span></div>
                  <div style={{ fontSize: 13, marginTop: 7, color: "var(--ink)" }}>{jobShort(i.jobId)}</div>
                  <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 3 }}>{fitter(i.fitterId).name} · {i.status}</div>
                </div>
              ))}
              {it.done.map((i) => (
                <div key={i.id} className="sa-tile" onClick={() => openJob(i.jobId)}>
                  <Badge tone="ok">Installed</Badge>
                  <div style={{ fontSize: 13, marginTop: 7 }}>{jobShort(i.jobId)}</div>
                </div>
              ))}
              {it.surveys.map((v) => (
                <div key={v.id} className="sa-tile" onClick={() => go("Jobs", "surveys")}>
                  <Badge tone="accent">Site survey</Badge>
                  <div style={{ fontSize: 13, marginTop: 7 }}>{jobShort(v.jobId)}</div>
                  <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 3 }}>{person(v.by).name} · {v.status === "booked" ? "booked" : "captured"}</div>
                </div>
              ))}
              {it.work.length > 0 && (
                <div style={{ padding: "8px 10px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <Label>Work orders</Label>
                  {it.work.map(({ w, h }) => (
                    <div key={w.id} className="sa-click" onClick={() => openJob(w.jobId)} style={{ display: "flex", gap: 7, alignItems: "center", marginTop: 7, fontSize: 12 }}>
                      <Avatar id={w.personId} size={18} />
                      <span style={{ flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--body)" }}>{w.title}</span>
                      <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--dim)" }}>{h}h</span>
                    </div>
                  ))}
                </div>
              )}
              {it.due.length > 0 && (
                <div style={{ padding: "8px 10px", borderRadius: 12, background: "var(--surface-faint)", border: "1px dashed var(--border-strong)" }}>
                  <Label>Due</Label>
                  {it.due.map((t) => (
                    <div key={t.id} style={{ display: "flex", gap: 7, alignItems: "center", marginTop: 7, fontSize: 12 }}>
                      <button type="button" aria-label={t.status === "Done" ? "Reopen " + t.title : "Complete " + t.title} onClick={() => setTaskStatus(t.id, t.status === "Done" ? "Open" : "Done")}
                        style={{ width: 16, height: 16, flex: "none", borderRadius: 5, border: "1px solid " + (t.status === "Done" ? "var(--ok)" : "var(--border-strong)"), background: t.status === "Done" ? "var(--ok)" : "none", cursor: "pointer", padding: 0 }} />
                      <span style={{ flex: 1, minWidth: 0, color: t.status === "Done" ? "var(--faint)" : "var(--body)", textDecoration: t.status === "Done" ? "line-through" : "none" }}>{t.title}</span>
                      <Avatar id={t.assignee} size={18} />
                    </div>
                  ))}
                </div>
              )}
              {!it.fits.length && !it.done.length && !it.surveys.length && !it.work.length && !it.due.length && <div style={{ fontSize: 12, color: "var(--faint)", padding: "8px 4px" }}>Clear</div>}
            </div>
          );
        })}
      </div>
      <Grid min={220}>
        {loads.map((l) => (
          <div key={l.id} className="sa-stat">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Avatar id={l.personId} size={22} /><span className="sa-label" style={{ flex: 1 }}>{STATIONS.find((x) => x.id === l.id)?.label}</span></div>
            <div className="sa-stat-v" style={{ fontSize: 22, color: l.pct > 100 ? "var(--bad)" : "var(--ink)" }}>{Math.round(l.pct)}%</div>
            <div className="sa-stat-sub">{l.total.toFixed(1)} of {l.capacity} h · busiest day {weekdayShort(days[l.days.indexOf(Math.max(...l.days))])}</div>
          </div>
        ))}
      </Grid>
    </>
  );
}

/* ── Automation queue ───────────────────────────────────────────────────── */
type QueueItem = { id: string; agent: string; text: string; jobId?: string; kind: "Proposal" | "Check" | "Alert" | "Draft"; approve: string; onApprove: () => void; detail: string; dismissable?: boolean };

function queueItems(s: DemoState): QueueItem[] {
  const out: QueueItem[] = AGENTS.flatMap((a) => a.proposals.map((p) => ({
    id: p.id, agent: a.name, text: p.text, jobId: p.jobId, kind: "Proposal" as const, approve: p.action, detail: a.guardrail,
    onApprove: () => runProposal(p.id, p.text, p.jobId),
  })));
  const cuApproved = isApproved("PV-43-3", s);
  out.push({ id: "au-proofgate", agent: "Proof Guardian", kind: "Check", jobId: "JOB-26043",
    text: cuApproved ? "Proof gate passed for WO-3113: v3 is the approved version" : "Proof gate holding WO-3113 (Celbridge CU CNC) until v3 is approved",
    approve: cuApproved ? "Acknowledge" : "Open proof", detail: "Runs before any work order moves to CNC or print.",
    onApprove: () => { if (cuApproved) markAgentDone("au-proofgate", "Acknowledged proof gate pass on Celbridge CU.", "JOB-26043"); else go("Jobs", "proofs"); } });
  out.push({ id: "au-eta", agent: "Ops Watchdog", kind: "Alert", jobId: "JOB-26045",
    text: "Camile letter shells: no confirmed ETA from the Poland partner after 12 days", approve: "Create chase task", detail: "Supplier alert rule: flag bought-in items without an ETA after 5 business days.",
    onApprove: () => { addTask({ title: "Chase Poland partner for Camile letters carrier tracking", assignee: "aisling", dept: "Accounts", jobId: "JOB-26045", priority: "High", due: bd(0), status: "Open" }); markAgentDone("au-eta", "Created chase task for Camile letter shells ETA.", "JOB-26045"); } });
  out.push({ id: "au-dep", agent: "Client Updates", kind: "Draft", jobId: "JOB-26043",
    text: "Deposit reminder drafted for Celbridge CU (40%, " + eur(3460) + ")", approve: "Approve draft", detail: "Drafted only. Approving marks it ready for you to send from your own email; the demo sends nothing.",
    onApprove: () => markAgentDone("au-dep", "Approved deposit reminder draft for Celbridge CU (not sent).", "JOB-26043") });
  out.push({ id: "au-fleet", agent: "Client Updates", kind: "Draft", jobId: "JOB-26044",
    text: "Progress note for the fleet client: 6 of 15 vans complete, batch B in print", approve: "Approve draft", detail: "Drafted only. Nothing is sent in the demo.",
    onApprove: () => markAgentDone("au-fleet", "Approved fleet progress note draft (not sent).", "JOB-26044") });
  out.push({ id: "au-port", agent: "Ops Watchdog", kind: "Draft", jobId: "JOB-26046",
    text: "Balance reminder drafted for Portmarnock hoarding (" + eur(1225) + ")", approve: "Approve draft", detail: "Drafted only. The accounts package remains the system of record.",
    onApprove: () => markAgentDone("au-port", "Approved Portmarnock balance reminder draft (not sent).", "JOB-26046") });
  return out;
}

function runProposal(id: string, text: string, jobId?: string) {
  if (id === "qp1") {
    const j = job("JOB-26050");
    if (j) { const p = priceForMargin(j.cost, 38); setJobPrice(j.id, p, "Applied Quote Coach price " + eur(p) + " to Rush Physio lightbox."); }
  } else if (id === "pp1") {
    shiftPlan("WO-3106", [0, 0, 0, 2, 0], "Moved Donabate banners to Thursday's open printer slot.");
  } else if (id === "wp1") {
    addTask({ title: "Ask the Poland partner for a carrier tracking number", assignee: "aisling", dept: "Accounts", jobId: "JOB-26045", priority: "High", due: bd(0), status: "Open" });
  } else if (id === "tp1") {
    go("Tenders", "inbox");
  } else if (id === "gp1") {
    go("Jobs", "proofs");
  }
  markAgentDone(id, "Approved agent proposal: " + text + ".", jobId);
  if (id !== "tp1" && id !== "gp1") toast("Approved: " + text);
}

function Automation({ s }: { s: DemoState }) {
  const [view, setView] = useState<"queue" | "handled">("queue");
  const items = queueItems(s);
  const state = (i: QueueItem) => (s.agentDone[i.id] ? "approved" : s.agentDone["x:" + i.id] ? "dismissed" : "queued");
  const queued = items.filter((i) => state(i) === "queued");
  const handled = items.filter((i) => state(i) !== "queued");
  const rows = view === "queue" ? queued : handled;
  const kindTone: Record<QueueItem["kind"], Tone> = { Proposal: "accent", Check: "info", Alert: "warn", Draft: "muted" };
  return (
    <>
      <PageHead kicker="Work" title="Automation queue"
        sub="What the agents and rules want to do next. Each item waits for a person: approve it, or dismiss it. Drafts are never sent."
        actions={<Seg value={view} onChange={setView} options={[{ id: "queue", label: "Queued · " + queued.length }, { id: "handled", label: "Handled · " + handled.length }]} />} />
      <Card pad={false}>
        {rows.length === 0 ? <Empty title={view === "queue" ? "Queue is clear" : "Nothing handled yet"} sub={view === "queue" ? "Agents will add items as work moves." : "Approve or dismiss something on the Queued view."} /> : rows.map((i, n) => (
          <div key={i.id} style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px 18px", borderTop: n ? "1px solid var(--border)" : "0", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 380px", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <Badge tone={kindTone[i.kind]}>{i.kind}</Badge>
                <span style={{ fontSize: 12, color: "var(--dim)" }}>{i.agent}</span>
                {i.jobId && <JobChip id={i.jobId} />}
              </div>
              <div style={{ fontSize: 13.5, color: "var(--ink)", marginTop: 8 }}>{i.text}</div>
              <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 4 }}>{i.detail}</div>
            </div>
            <div style={{ display: "flex", gap: 8, flex: "none" }}>
              {state(i) === "queued" ? (
                <>
                  <Btn small kind="primary" onClick={i.onApprove}>{i.approve}</Btn>
                  <Btn small kind="quiet" onClick={() => { update((st) => ({ agentDone: { ...st.agentDone, ["x:" + i.id]: true } })); log("human", "Managing Director", "Dismissed: " + i.text + ".", i.jobId, "agent", "info"); }}>Dismiss</Btn>
                </>
              ) : (
                <>
                  <Badge tone={state(i) === "approved" ? "ok" : "muted"} dot>{state(i) === "approved" ? "Approved" : "Dismissed"}</Badge>
                  <Btn small kind="quiet" onClick={() => update((st) => { const a = { ...st.agentDone }; delete a[i.id]; delete a["x:" + i.id]; return { agentDone: a }; })}>Return to queue</Btn>
                </>
              )}
            </div>
          </div>
        ))}
      </Card>
      <Note tone="muted">Customer-facing sends, deletes and overwrites of approved proofs always need a person (Settings, AI Controls). Agents can create internal tasks and drafts only.</Note>
    </>
  );
}

