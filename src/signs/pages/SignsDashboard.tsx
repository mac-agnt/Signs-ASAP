/* Dashboard body (renders under the Pulse KPI band). Four views of the same
   canonical data: Executive, Sales, Workshop, Margins. All totals derived. */

import {
  useDemo, getTab, go, jobs, stageCounts, awaitingProofs, fleet, quotes, enquiries, setEnquiryStatus, payments, activities,
  tasks, workOrders, installs, eur, pct, margin, tenderCalc, tenderStatus, jobShort, person, openJob, type DemoState,
} from "../model";
import { firstTab } from "../nav";
import { TENDER_ARCHIVE, TENDER_DRAFT, ENQUIRY_NOTE, HISTORY_NOTE, WO_COLS, type Job } from "../data";
import { weekDays, weekdayShort, dayLabel, relDay, sameDay, DEMO_TODAY, isOverdue, stamp } from "../dates";
import { Page, Grid, Card, Badge, Btn, Bars, HBars, Donut, Legend, Meter, JobChip, Note, Source, Stat, Table, Avatar, Label, type Tone } from "../ui";
import { stationLoads, loadTone, moneyTotals, median, KINDS, KIND_SHORT, KIND_TONE, kindHistory } from "./metrics";
import { TENDER_WON } from "../data";

const SAMPLE = "Demo totals from seeded jobs, not real financial performance";
const TAB_INFO: Record<string, [string, string]> = {
  executive: ["Executive", "The whole business on one screen: what is moving, what is stuck, and what it is worth."],
  sales: ["Sales", "Enquiries, quote turnaround, follow-ups and tenders. Mostly repeat and referred work, so speed and service matter more than ads."],
  workshop: ["Workshop", "Five people, four workstations, Monday to Friday. Manufacturing capacity is the constraint to watch."],
  margins: ["Margins", "Printed work, vehicle branding and bespoke LED compared on sample data."],
};

export default function SignsDashboard(_props: { v: any }) {
  const [s] = useDemo();
  const tab = getTab("Dashboard", firstTab("Dashboard"));
  const info = TAB_INFO[tab] || TAB_INFO.executive;
  return (
    <Page style={{ paddingTop: 6, maxWidth: 1280, margin: "0 auto", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "6px 2px 0" }}>
        <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-.2px" }}>{info[0]}</span>
        <span style={{ fontSize: 13, color: "var(--dim)", flex: "1 1 320px", minWidth: 0 }}>{info[1]}</span>
        <Badge tone="muted">Illustrative demo data</Badge>
      </div>
      {tab === "executive" && <Executive s={s} />}
      {tab === "sales" && <Sales s={s} />}
      {tab === "workshop" && <Workshop s={s} />}
      {tab === "margins" && <Margins s={s} />}
    </Page>
  );
}

/* ── Executive ──────────────────────────────────────────────────────────── */
function Executive({ s }: { s: DemoState }) {
  const sc = stageCounts(s);
  const js = jobs(s);
  const proofsWaiting = awaitingProofs(s);
  const holds = js.filter((j) => j.stage === "procurement");
  const f = fleet(s);
  const qs = quotes(s).filter((q) => q.job && q.job.stage === "quoting");
  const quoteVal = qs.reduce((a, q) => a + q.price, 0);
  const enq = enquiries(s).filter((e) => e.status !== "converted" && e.status !== "declined");
  const enqVal = enq.reduce((a, e) => a + e.estValue, 0);
  const draft = tenderCalc(TENDER_DRAFT, s);
  const draftStatus = tenderStatus(TENDER_DRAFT, s);
  const loads = stationLoads(s);
  const m = moneyTotals(s);
  const owed = payments(s).filter((p) => p.status !== "paid");
  const won = TENDER_ARCHIVE.filter((t) => t.result.indexOf("Won") === 0);
  const acts = activities(s).slice(0, 6);
  return (
    <>
      <Grid cols="minmax(0,1.55fr) minmax(0,1fr)">
        <Card title="Jobs by stage" sub={js.length + " jobs on the board · " + js.filter((j) => j.stage !== "completed").length + " open"}
          right={<Btn small kind="quiet" onClick={() => go("Jobs", "pipeline")}>Open pipeline</Btn>}>
          <Bars height={130} data={sc.map((g) => ({ label: g.label.replace("Enquiry / Survey", "Enquiry"), value: g.count, tone: (g.id === "proof" || g.id === "procurement" ? "warn" : g.id === "production" ? "accent" : g.id === "completed" ? "ok" : "info") as Tone }))} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 8, marginTop: 12 }}>
            {sc.filter((g) => g.count).map((g) => (
              <div key={g.id} className="sa-kv sa-click" onClick={() => go("Jobs", "pipeline")}>
                <div className="sa-label">{g.label}</div>
                <div style={{ fontSize: 13, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{eur(g.jobs.reduce((a, j) => a + j.price, 0))}</div>
              </div>
            ))}
          </div>
          <Source>Stage values are sell prices of the jobs in each stage. {SAMPLE}.</Source>
        </Card>

        <Card title="Owner watchlist" sub="Only what is blocked or waiting on a decision">
          <WatchRow tone="warn" label={proofsWaiting.length + " proofs awaiting sign-off"} onClick={() => go("Jobs", "proofs")}>
            {proofsWaiting.map((p) => <JobChip key={p.id} id={p.jobId} label={jobShort(p.jobId) + " v" + p.v} />)}
          </WatchRow>
          <WatchRow tone="warn" label={holds.length + " jobs waiting on materials"} onClick={() => go("Production", "materials")}>
            {holds.map((j) => <span key={j.id} style={{ display: "block", fontSize: 12, color: "var(--dim)", marginTop: 4 }}><JobChip id={j.id} /> {j.blocker || j.nextStep}</span>)}
          </WatchRow>
          <div style={{ padding: "12px 0 2px", borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>15-van fleet livery</span>
              <span style={{ fontSize: 13, fontVariantNumeric: "tabular-nums" }}>{f.done}/{f.total} done</span>
            </div>
            <div style={{ display: "flex", gap: 3, marginTop: 9 }}>
              {f.batches.flatMap((b) => Array.from({ length: b.vans }, (_, i) => (
                <span key={b.id + i} title={b.label + ": " + b.detail} style={{ flex: 1, height: 10, borderRadius: 3, background: b.status === "complete" ? "var(--ok)" : b.status === "in-progress" ? "var(--accent)" : "var(--track)" }} />
              )))}
            </div>
            <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 11.5, color: "var(--dim)", flexWrap: "wrap" }}>
              {f.batches.map((b) => <span key={b.id}>{b.label}: {b.vans} {b.status === "complete" ? "done" : b.status === "in-progress" ? "in the workshop" : "awaiting slot"}</span>)}
            </div>
          </div>
        </Card>
      </Grid>

      <Grid min={240}>
        <Card title="Quote pipeline" sub="Quoted, not yet won" onClick={() => go("Sales", "quotes")}>
          <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-.8px", fontVariantNumeric: "tabular-nums" }}>{eur(quoteVal)}</div>
          <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 4 }}>{qs.length} live quotes · plus {eur(enqVal)} estimated across {enq.length} open enquiries</div>
          <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 12, background: "var(--surface-faint)", border: "1px solid var(--border)", fontSize: 12.5 }}>
            <div className="sa-label">Draft tender {TENDER_DRAFT.id}</div>
            <div style={{ marginTop: 5, color: "var(--body)" }}>
              {s.tenderStage >= 5 ? eur(draft.sell) + " draft at " + pct(draft.marginPct) + " · " + (draftStatus === "approved" ? "approved for submission" : "awaiting owner review") : "Tender pack received today, not yet extracted"}
            </div>
          </div>
        </Card>
        <Card title="Workshop load this week" sub="Planned hours vs capacity" onClick={() => go("Production", "capacity")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {loads.map((l) => (
              <div key={l.id} style={{ display: "grid", gridTemplateColumns: "70px 1fr 44px", gap: 10, alignItems: "center", fontSize: 12.5 }}>
                <span style={{ color: "var(--body)" }}>{l.short}</span>
                <Meter value={l.total} max={l.capacity} tone={loadTone(l.pct)} over={l.pct > 100} />
                <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: l.pct > 100 ? "var(--bad)" : "var(--ink)" }}>{Math.round(l.pct)}%</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Outstanding balances (mock)" sub={owed.length + " invoiced lines in the demo ledger"} onClick={() => go("Finance", "deposits")}>
          <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-.8px", fontVariantNumeric: "tabular-nums" }}>{eur(m.invoicedOpen)}</div>
          <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 4 }}>{eur(m.balanceOnCompletion)} more falls due as open jobs complete</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
            {owed.slice(0, 3).map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--dim)" }}>{p.kind} · {jobShort(p.jobId)}</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{eur(p.amount)}</span>
              </div>
            ))}
          </div>
        </Card>
      </Grid>

      <Grid cols="minmax(0,1fr) minmax(0,1.3fr)">
        <Card title="Tenders" sub={won.length + " won of " + TENDER_ARCHIVE.length + " recent · " + eur(won.reduce((a, t) => a + t.value, 0)) + " won"}
          right={<Btn small kind="quiet" onClick={() => go("Tenders", "archive")}>Archive</Btn>}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {TENDER_ARCHIVE.slice().reverse().map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: "1px solid var(--border)", fontSize: 12.5 }}>
                <span className="sa-mono" style={{ color: "var(--faint)", width: 62, flex: "none" }}>{t.id}</span>
                <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
                <span style={{ fontVariantNumeric: "tabular-nums", color: t.id === TENDER_WON.id ? "var(--accent)" : "var(--ink)" }}>{eur(t.value)}</span>
                <Badge tone={t.result.indexOf("Won") === 0 ? "ok" : t.result.indexOf("Lost") === 0 ? "bad" : "muted"}>{t.result.split(" · ")[0]}</Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Latest movement" sub="People, agents and systems, newest first" right={<Btn small kind="quiet" onClick={() => go("Activity", "feed")}>All activity</Btn>}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {acts.map((a) => (
              <div key={a.id} className={a.jobId ? "sa-click" : undefined} onClick={a.jobId ? () => openJob(a.jobId!) : undefined}
                style={{ display: "flex", gap: 10, padding: "9px 0", borderTop: "1px solid var(--border)", alignItems: "flex-start" }}>
                <Badge tone={a.actor === "agent" ? "accent" : a.actor === "system" ? "info" : "muted"}>{a.actor === "agent" ? "Agent" : a.actor === "system" ? "System" : "Person"}</Badge>
                <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: "var(--body)", lineHeight: 1.45 }}><span style={{ color: "var(--ink)" }}>{a.who}</span> · {a.text}</span>
                <span style={{ fontSize: 11, color: "var(--faint)", whiteSpace: "nowrap" }}>{stamp(a.at)}</span>
              </div>
            ))}
          </div>
        </Card>
      </Grid>
    </>
  );
}

function WatchRow({ tone, label, children, onClick }: { tone: Tone; label: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <div style={{ padding: "11px 0", borderTop: "1px solid var(--border)" }}>
      <div className="sa-click" onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 7, height: 7, borderRadius: 2, background: tone === "warn" ? "var(--warn)" : "var(--bad)" }} />
        <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{label}</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>Open</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>{children}</div>
    </div>
  );
}

/* ── Sales ──────────────────────────────────────────────────────────────── */
function Sales({ s }: { s: DemoState }) {
  const enq = enquiries(s);
  const fresh = enq.filter((e) => e.isNew).length;
  const repeat = enq.length - fresh;
  const sources = ["Repeat", "Referral", "Website", "Phone / email", "Site visit"].map((src) => ({ label: src, value: enq.filter((e) => e.source === src).length }));
  const qs = quotes(s).filter((q) => q.turnaroundHrs > 0).sort((a, b) => b.job.created.getTime() - a.job.created.getTime()).slice(0, 9);
  const med = median(qs.map((q) => q.turnaroundHrs));
  const follow = quotes(s).filter((q) => q.job && q.job.stage === "quoting");
  const notContacted = enq.filter((e) => e.status === "new");
  const won = TENDER_ARCHIVE.filter((t) => t.result.indexOf("Won") === 0);
  const decided = TENDER_ARCHIVE.filter((t) => t.result.indexOf("Not submitted") < 0);
  return (
    <>
      <Grid min={190}>
        <Stat label="Enquiries (sample week)" value={enq.length} sub={ENQUIRY_NOTE} onClick={() => go("Sales", "enquiries")} />
        <Stat label="From new contacts" value={fresh + " of " + enq.length} sub={repeat + " from repeat or existing customers this week"} />
        <Stat label="Median quote turnaround" value={Math.round(med) + " h"} sub={"Across the " + qs.length + " most recent quotes"} tone={med > 24 ? "warn" : "ok"} />
        <Stat label="Quotes to follow up" value={follow.length} sub={notContacted.length + " enquiries not yet contacted"} tone={follow.length ? "warn" : undefined} onClick={() => go("Sales", "quotes")} />
      </Grid>

      <Grid cols="minmax(0,1fr) minmax(0,1.3fr)">
        <Card title="New vs repeat enquiries" sub="This sample week">
          <div style={{ display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap" }}>
            <Donut size={128} thickness={18} parts={[{ value: repeat, tone: "accent", label: "Repeat / existing" }, { value: fresh, tone: "info", label: "New contacts" }]}
              center={<><div style={{ fontSize: 20, fontWeight: 600 }}>{enq.length}</div><div style={{ fontSize: 10.5, color: "var(--faint)" }}>enquiries</div></>} />
            <div style={{ flex: "1 1 180px" }}>
              <Legend items={[{ label: "Repeat / existing customer", tone: "accent", value: repeat }, { label: "New contact", tone: "info", value: fresh }]} />
            </div>
          </div>
          <Note tone="muted" style={{ marginTop: 14 }}>The owner reports that historically 80-90% of business was repeat or referred, and that recently around 20-30% has been newly sourced. Those are different measures from this one-week enquiry count.</Note>
        </Card>
        <Card title="Where enquiries came from" sub="No paid advertising in the mix: referrals, repeat customers and the website">
          <HBars data={sources.map((x) => ({ label: x.label, value: x.value, tone: (x.label === "Repeat" ? "accent" : x.label === "Referral" ? "ok" : "info") as Tone }))} />
          <Source>{ENQUIRY_NOTE}</Source>
        </Card>
      </Grid>

      <Grid cols="minmax(0,1.2fr) minmax(0,1fr)">
        <Card title="Quote response time" sub="Hours from enquiry to quote sent, most recent first" right={<Badge tone="muted">Median {Math.round(med)} h</Badge>}>
          <HBars marker={24} markerLabel="24 h" max={Math.max(36, ...qs.map((q) => q.turnaroundHrs))} fmt={(n) => n + " h"}
            data={qs.map((q) => ({ label: q.job.short, value: q.turnaroundHrs, tone: (q.turnaroundHrs > 24 ? "warn" : "ok") as Tone, onClick: () => openJob(q.jobId) }))} />
          <Source>Marker at 24 h. A fast first quote matters most with repeat and referred customers.</Source>
        </Card>
        <Card title="Follow-ups" sub="Quotes out and enquiries not yet answered">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {follow.map((q) => (
              <div key={q.id} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <JobChip id={q.jobId} />
                <Badge tone={q.status === "sent" ? "info" : q.status === "awaiting-owner" ? "warn" : "muted"}>{q.status === "sent" ? "Sent" : q.status === "awaiting-owner" ? "Awaiting you" : "Draft"}</Badge>
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}>{eur(q.price)}</span>
              </div>
            ))}
            {notContacted.map((e) => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: 12.5 }}>
                  <span style={{ color: "var(--ink)" }}>{e.name}</span>
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--faint)" }}>{e.source} · {relDay(e.received)}</span>
                </span>
                <Btn small kind="quiet" onClick={() => setEnquiryStatus(e.id, "contacted")}>Mark contacted</Btn>
              </div>
            ))}
          </div>
        </Card>
      </Grid>

      <Card title="Tender win progress" sub={won.length + " won of " + decided.length + " decided · " + eur(won.reduce((a, t) => a + t.value, 0)) + " won value"}
        right={<Btn small onClick={() => go("Tenders", "inbox")}>Tender Desk</Btn>}>
        <Grid min={200}>
          {TENDER_ARCHIVE.map((t) => (
            <div key={t.id} className="sa-kv">
              <div className="sa-label">{t.id} · {dayLabel(t.date)}</div>
              <div style={{ fontSize: 13, marginTop: 5, color: "var(--ink)" }}>{t.title}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <span style={{ fontVariantNumeric: "tabular-nums", fontSize: 13 }}>{eur(t.value)}</span>
                <Badge tone={t.result.indexOf("Won") === 0 ? "ok" : t.result.indexOf("Lost") === 0 ? "bad" : "muted"}>{t.result}</Badge>
              </div>
            </div>
          ))}
          <div className="sa-kv sa-click" onClick={() => go("Tenders", s.tenderStage >= 5 ? "review" : "inbox")} style={{ borderColor: "var(--accent-line)" }}>
            <div className="sa-label">{TENDER_DRAFT.id} · due {dayLabel(TENDER_DRAFT.due)}</div>
            <div style={{ fontSize: 13, marginTop: 5, color: "var(--ink)" }}>{TENDER_DRAFT.title}</div>
            <div style={{ marginTop: 8 }}><Badge tone="accent">{s.tenderStage >= 5 ? (tenderStatus(TENDER_DRAFT, s) === "approved" ? "Approved draft" : "Draft for review") : "New: not yet extracted"}</Badge></div>
          </div>
        </Grid>
        <Source>Archive tenders other than the €7,500 college win are illustrative.</Source>
      </Card>
    </>
  );
}

/* ── Workshop ───────────────────────────────────────────────────────────── */
function Workshop({ s }: { s: DemoState }) {
  const loads = stationLoads(s);
  const days = weekDays(0);
  const wos = workOrders(s).filter((w) => w.col !== "fit" || w.hours > 0).sort((a, b) => a.promised.getTime() - b.promised.getTime());
  const late = tasks(s).filter((t) => t.status !== "Done" && isOverdue(t.due));
  const lateWo = workOrders(s).filter((w) => w.col !== "fit" && isOverdue(w.promised));
  const dueToday = tasks(s).filter((t) => t.status !== "Done" && sameDay(t.due, DEMO_TODAY));
  const f = fleet(s);
  const fits = installs(s).filter((i) => i.status !== "done" && days.some((d) => sameDay(d, i.date)));
  return (
    <>
      <Card title="Capacity by station, Monday to Friday" sub="Planned hours per person per day against 7.5 h. Red is over capacity."
        right={<><Btn small onClick={() => go("Production", "capacity")}>Capacity planner</Btn><Btn small kind="quiet" onClick={() => go("Production", "tv")}>TV mode</Btn></>}>
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(150px,1.4fr) repeat(5,minmax(70px,1fr)) minmax(90px,1fr)", gap: 6, minWidth: 620 }}>
            <div />
            {days.map((d) => (
              <div key={d.toISOString()} style={{ fontSize: 11.5, textAlign: "center", color: sameDay(d, DEMO_TODAY) ? "var(--accent)" : "var(--faint)", fontWeight: sameDay(d, DEMO_TODAY) ? 600 : 500 }}>
                {weekdayShort(d)} {d.getDate()}
              </div>
            ))}
            <div style={{ fontSize: 11.5, textAlign: "right", color: "var(--faint)" }}>Week</div>
            {loads.map((l) => (
              <Row key={l.id} label={l.label} personId={l.personId}>
                {l.days.map((h, i) => {
                  const p = (h / l.dayCap) * 100;
                  const tone = p > 100 ? "var(--bad)" : p >= 85 ? "var(--warn)" : "var(--ok)";
                  return (
                    <div key={i} title={h.toFixed(1) + " h planned"} style={{ height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontVariantNumeric: "tabular-nums",
                      background: "color-mix(in oklab," + tone + " " + Math.round(Math.min(100, p) * 0.32 + 6) + "%, var(--surface-faint))", border: sameDay(days[i], DEMO_TODAY) ? "1px solid var(--accent-line)" : "1px solid var(--border)", color: p > 100 ? "var(--bad)" : "var(--ink)" }}>
                      {h.toFixed(1)}
                    </div>
                  );
                })}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center", gap: 4 }}>
                  <Badge tone={loadTone(l.pct)}>{Math.round(l.pct)}%</Badge>
                  <span style={{ fontSize: 11, color: "var(--faint)" }}>{l.total.toFixed(1)} / {l.capacity} h</span>
                </div>
              </Row>
            ))}
          </div>
        </div>
        {s.rushScenario && <Note tone="bad" style={{ marginTop: 12 }}>Rush LED scenario is on: the Celbridge CU sign has been pulled into this week on CNC. See Production for the suggested reshuffle.</Note>}
        <Source>Hours come from work order day plans plus routine station work (proofs, walk-in print, dispatch). Capacity uses each person's 7.5 h day.</Source>
      </Card>

      <Grid cols="minmax(0,1.5fr) minmax(0,1fr)">
        <Card title="Work order schedule" sub="Sorted by promised date" right={<Btn small kind="quiet" onClick={() => go("Production", "orders")}>All work orders</Btn>}>
          <Table rows={wos} dense onRow={(w) => openJob(w.jobId)} rowTone={(w) => (w.locked || w.blocker ? "warn" : undefined)}
            cols={[
              { key: "t", label: "Work order", width: "2.2fr", render: (w) => <span style={{ minWidth: 0 }}><span style={{ display: "block", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.title}</span><span style={{ fontSize: 11, color: "var(--faint)" }}>{w.id} · {w.jobId}</span></span> },
              { key: "who", label: "Who", width: ".6fr", hideSm: true, render: (w) => <Avatar id={w.personId} size={22} /> },
              { key: "col", label: "Stage", width: "1.2fr", render: (w) => <Badge tone={w.locked ? "bad" : w.col === "fit" ? "ok" : w.col === "materials" ? "warn" : "info"}>{w.locked ? "Locked: proof" : (WO_COLS.find((c) => c.id === w.col)?.short || w.col)}</Badge> },
              { key: "due", label: "Promised", width: ".9fr", align: "right", render: (w) => <span style={{ color: isOverdue(w.promised) ? "var(--bad)" : "var(--body)" }}>{relDay(w.promised)}</span> },
            ]} />
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <Card title="Overdue steps" sub={(late.length + lateWo.length) ? "Past their date and not done" : "Nothing past its date"} tone={(late.length + lateWo.length) ? "bad" : undefined}>
            {late.length + lateWo.length === 0 ? <Note tone="ok">Every task and work order is on or ahead of its date.</Note> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {late.map((t) => <div key={t.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12.5 }}><Avatar id={t.assignee} size={20} /><span style={{ flex: 1 }}>{t.title}</span><span style={{ color: "var(--bad)", fontSize: 11.5 }}>{relDay(t.due)}</span></div>)}
                {lateWo.map((w) => <div key={w.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12.5 }}><Avatar id={w.personId} size={20} /><span style={{ flex: 1 }}>{w.title}</span><span style={{ color: "var(--bad)", fontSize: 11.5 }}>{relDay(w.promised)}</span></div>)}
              </div>
            )}
            <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 10 }}>{dueToday.length} tasks due today across the team.</div>
          </Card>
          <Card title="Fleet batches" sub={f.done + " of " + f.total + " vans complete"}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {f.batches.map((b) => (
                <div key={b.id} style={{ display: "grid", gridTemplateColumns: "64px 1fr auto", gap: 10, alignItems: "center", fontSize: 12.5 }}>
                  <span>{b.label}</span>
                  <Meter value={b.status === "complete" ? b.vans : b.status === "in-progress" ? b.vans / 2 : 0} max={b.vans} tone={b.status === "complete" ? "ok" : "accent"} />
                  <span style={{ color: "var(--dim)" }}>{b.vans} vans · {b.slot}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Fits this week" sub={fits.length + " booked or proposed"} onClick={() => go("Installations", "calendar")}>
            {fits.map((i) => <div key={i.id} style={{ display: "flex", gap: 8, fontSize: 12.5, padding: "4px 0" }}><span style={{ width: 70, color: "var(--faint)" }}>{weekdayShort(i.date)}</span><span style={{ flex: 1 }}>{jobShort(i.jobId)}</span><Badge tone={i.status === "booked" ? "ok" : "warn"}>{i.status}</Badge></div>)}
          </Card>
        </div>
      </Grid>
    </>
  );
}

function Row({ label, personId, children }: { label: string; personId: string; children: React.ReactNode }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
        <Avatar id={personId} size={26} />
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 12.5, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
          <span style={{ display: "block", fontSize: 11, color: "var(--faint)" }}>{person(personId).name}</span>
        </span>
      </div>
      {children}
    </>
  );
}

/* ── Margins ────────────────────────────────────────────────────────────── */
function Margins({ s }: { s: DemoState }) {
  const js = jobs(s);
  const floor = s.marginFloor;
  const rows = KINDS.map((k) => {
    const kj = js.filter((j) => j.kind === k);
    const sell = kj.reduce((a, j) => a + j.price, 0), cost = kj.reduce((a, j) => a + j.cost, 0);
    const hrs = kj.reduce((a, j) => a + j.plannedHours, 0);
    const h = kindHistory(k, 35);
    return { k, n: kj.length, sell, cost, m: margin(sell, cost), perHour: hrs ? (sell - cost) / hrs : 0, hist: h.actualMedian, histQ: h.quotedMedian };
  });
  const open = js.filter((j) => j.stage !== "completed").sort((a, b) => margin(a.price, a.cost) - margin(b.price, b.cost));
  return (
    <>
      <Grid cols="minmax(0,1fr) minmax(0,1fr)">
        <Card title="Margin by product type" sub="Current jobs vs the illustrative archive (realised, after hour overruns)">
          <Bars height={140} fmt={(n) => Math.round(n) + "%"} data={rows.flatMap((r) => [
            { label: (r.k === "print" ? "Print" : r.k === "vehicle" ? "Vehicle" : "LED") + " now", value: r.m, tone: KIND_TONE[r.k] as Tone },
            { label: "past", value: r.hist, tone: "muted" as Tone },
          ])} />
          <Source>{HISTORY_NOTE}</Source>
        </Card>
        <Card title="Profit per planned workshop hour" sub="Gross profit on current jobs divided by their planned workshop hours">
          <HBars fmt={(n) => eur(n) + "/h"} data={rows.map((r) => ({ label: KIND_SHORT[r.k], value: r.perHour, tone: KIND_TONE[r.k] as Tone }))} />
          <Note tone="info" style={{ marginTop: 14 }}>Printed boards and hoardings earn the most per hour on these figures. LED and fabricated work earns more per job but holds CNC and assembly longer, which is where capacity runs out first.</Note>
        </Card>
      </Grid>

      <Card title="By product type" sub={SAMPLE}>
        <Table rows={rows}
          cols={[
            { key: "k", label: "Type", width: "1.6fr", render: (r) => <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Badge tone={KIND_TONE[r.k]}>{r.n} jobs</Badge>{KIND_SHORT[r.k]}</span> },
            { key: "sell", label: "Sell", width: "1fr", align: "right", render: (r) => <span className="sa-mono">{eur(r.sell)}</span> },
            { key: "profit", label: "Profit", width: "1fr", align: "right", render: (r) => <span className="sa-mono">{eur(r.sell - r.cost)}</span> },
            { key: "m", label: "Margin", width: ".8fr", align: "right", render: (r) => <Badge tone={r.m < floor ? "bad" : "ok"}>{pct(r.m)}</Badge> },
            { key: "hq", label: "Past quoted", width: ".9fr", align: "right", hideSm: true, render: (r) => <span className="sa-mono">{pct(r.histQ)}</span> },
            { key: "h", label: "Past realised", width: ".9fr", align: "right", hideSm: true, render: (r) => <span className="sa-mono" style={{ color: r.hist < floor ? "var(--bad)" : "var(--body)" }}>{pct(r.hist)}</span> },
          ]} />
      </Card>

      <Card title="Open jobs by margin" sub={"Lowest first · marker at the " + floor + "% floor (adjustable in Finance)"} right={<Btn small kind="quiet" onClick={() => go("Finance", "qva")}>Change floor</Btn>}>
        <HBars max={70} marker={floor} markerLabel={"Floor " + floor + "%"} fmt={(n) => pct(n)}
          data={open.map((j: Job) => ({ label: j.short, value: margin(j.price, j.cost), tone: (margin(j.price, j.cost) < floor ? "bad" : KIND_TONE[j.kind]) as Tone, right: pct(margin(j.price, j.cost)) + " · " + eur(j.price - j.cost), onClick: () => openJob(j.id) }))} />
        <Label style={{ marginTop: 12 }}>{SAMPLE}</Label>
      </Card>
    </>
  );
}
