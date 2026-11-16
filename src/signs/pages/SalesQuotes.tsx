/* Sales & Quotes: enquiries in, quotes out, margins protected. Repeat accounts
   stay visible; nothing here runs paid acquisition and nothing is sent. */

import { useState, type ReactNode } from "react";
import {
  useDemo, getTab, go, openJob, enquiries, convertEnquiry, setEnquiryStatus, quotes, jobs, job, customer, eur, pct, margin,
  setJobPrice, markDecision, update, log, toast, tenderStatus, tenderCalc, proofsFor, payments, stageLabel, stageTone, type DemoState,
} from "../model";
import { firstTab } from "../nav";
import { CUSTOMERS, REFERENCE_ACCOUNTS, ENQUIRY_NOTE, KIND_LABEL, HISTORY, TENDER_DRAFT, type JobKind, type Enquiry } from "../data";
import { stamp, dayLabel, dateLabel, relDay } from "../dates";
import {
  Page, PageHead, Grid, Card, Badge, Btn, Stat, NumField, Seg, Note, Label, JobChip, Table, HBars, Bars, Donut, Legend, Source, Empty, Avatar, type Tone,
} from "../ui";

const KIND_TONE: Record<JobKind, Tone> = { print: "info", vehicle: "ok", led: "accent" };
const SOURCE_TONE: Record<string, Tone> = { Referral: "accent", Repeat: "ok", Website: "info", "Phone / email": "muted", "Site visit": "warn" };
const marginTone = (m: number, floor: number): Tone => (m < floor ? "bad" : m < floor + 5 ? "warn" : "ok");
const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const a = xs.slice().sort((x, y) => x - y), m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
};
const QUOTE_STATUS: Record<string, [Tone, string]> = {
  draft: ["muted", "Draft"], sent: ["info", "Sent"], accepted: ["ok", "Accepted"], "awaiting-owner": ["warn", "Awaiting owner"],
};

let lastTemplate: JobKind = "print";

/* ── approvals model (shared by Overview + Approvals) ───────────────────── */
type Approval = { id: string; group: string; tone: Tone; title: string; detail: ReactNode; jobId?: string; actions: ReactNode };
function approvalsFor(s: DemoState): Approval[] {
  const floor = s.marginFloor;
  const out: Approval[] = [];
  const qs = quotes(s);

  qs.filter((q) => q.status === "awaiting-owner").forEach((q) => {
    const id = "qa-" + q.id;
    if (s.decisionsDone[id]) return;
    const m = margin(q.price, q.cost);
    out.push({
      id, group: "Quote approval", tone: "warn", jobId: q.jobId,
      title: q.id + " · " + (customer(q.job.customerId)?.name || "") + " · " + eur(q.price),
      detail: <>Drafted and waiting for you before it goes out. {pct(m)} margin ({m >= floor ? "above" : "below"} your {floor}% floor). Valid to {dateLabel(q.validUntil)}.</>,
      actions: <>
        <Btn small kind="primary" onClick={() => { markDecision(id); log("human", "Managing Director", "Approved " + q.id + " for " + q.job.short + " at " + eur(q.price) + ". Marked ready to send (not sent).", q.jobId, "quote", "ok"); toast("Quote approved and marked ready to send. Nothing was emailed."); }}>Approve quote</Btn>
        <Btn small onClick={() => { lastTemplate = q.job.kind; go("Sales", "builder"); }}>Rework in builder</Btn>
      </>,
    });
  });

  qs.filter((q) => q.status !== "accepted" && margin(q.price, q.cost) < floor).forEach((q) => {
    const id = "mf-" + q.id;
    if (s.decisionsDone[id]) return;
    const m = margin(q.price, q.cost);
    const suggested = Math.ceil(q.cost / (1 - floor / 100) / 10) * 10;
    out.push({
      id, group: "Below margin floor", tone: "bad", jobId: q.jobId,
      title: q.id + " · " + q.job.short + " at " + pct(m),
      detail: <>Quote Coach: cost build-up {eur(q.cost)} against {eur(q.price)}. Suggested {eur(suggested)} ({pct(margin(suggested, q.cost))}) to clear your {floor}% floor. Past {KIND_LABEL[q.job.kind].toLowerCase()} jobs ran at a {pct(median(HISTORY.filter((h) => h.kind === q.job.kind).map((h) => margin(h.price, h.cost))), 0)} median.</>,
      actions: <>
        <Btn small kind="primary" onClick={() => { setJobPrice(q.jobId, suggested, "Applied Quote Coach price to " + q.job.short + ": " + eur(q.price) + " to " + eur(suggested) + "."); markDecision(id); toast("Price updated to " + eur(suggested) + ". Quote not sent."); }}>Apply {eur(suggested)}</Btn>
        <Btn small onClick={() => { markDecision(id); log("human", "Managing Director", "Kept " + q.job.short + " at " + eur(q.price) + " below the floor (owner decision).", q.jobId, "quote", "info"); toast("Kept at " + eur(q.price) + ". Your call is logged."); }}>Keep price</Btn>
      </>,
    });
  });

  jobs(s).filter((j) => (j.depositPct === 100 || j.depositPct === 0) && j.stage !== "completed").forEach((j) => {
    const id = "dep-" + j.id;
    if (s.decisionsDone[id]) return;
    out.push({
      id, group: "Deposit exception", tone: "info", jobId: j.id,
      title: j.short + ": " + (j.depositPct === 100 ? "100% paid upfront" : "no deposit taken"),
      detail: <>{j.depositNote || "Outside the usual 30-50% deposit."} Recorded as an exception, not a new rule.</>,
      actions: <Btn small kind="primary" onClick={() => { markDecision(id); log("human", "Managing Director", "Acknowledged deposit exception on " + j.short + ".", j.id, "payment", "ok"); toast("Exception acknowledged"); }}>Acknowledge</Btn>,
    });
  });

  s.changeRequests.filter((c) => c.status === "open").forEach((c) => {
    const setCr = (st: "accepted" | "rejected") => {
      update((x) => ({ changeRequests: x.changeRequests.map((r) => (r.id === c.id ? { ...r, status: st } : r)) }));
      log("human", "Managing Director", (st === "accepted" ? "Accepted" : "Rejected") + " late change on " + (job(c.jobId, s)?.short || c.jobId) + ": " + c.note + ".", c.jobId, "proof", st === "accepted" ? "ok" : "info");
      toast("Change request " + st);
    };
    out.push({
      id: c.id, group: "Late change", tone: "warn", jobId: c.jobId,
      title: (job(c.jobId, s)?.short || c.jobId) + ": change after approval",
      detail: <>{c.note}. Cost impact {eur(c.costImpact)}. The approved proof stays the production version until you accept.</>,
      actions: <><Btn small kind="primary" onClick={() => setCr("accepted")}>Accept change</Btn><Btn small onClick={() => setCr("rejected")}>Reject</Btn></>,
    });
  });

  const tst = tenderStatus(TENDER_DRAFT, s);
  if (tst !== "approved") {
    const calc = tenderCalc(TENDER_DRAFT, s);
    out.push({
      id: "tender-" + TENDER_DRAFT.id, group: "Tender review", tone: "accent",
      title: TENDER_DRAFT.id + " · " + TENDER_DRAFT.title + (s.tenderStage >= 5 ? " · " + eur(calc.sell) : ""),
      detail: <>{s.tenderStage >= 5 ? "Costing draft at " + pct(calc.marginPct) + " margin. " : "Tender pack received, not extracted. "}Due {relDay(TENDER_DRAFT.due)}. Nothing goes to the client without your approval.</>,
      actions: <Btn small kind="primary" onClick={() => go("Tenders", tst === "review" ? "review" : s.tenderStage >= 5 ? "costing" : "inbox")}>Open Tender Desk</Btn>,
    });
  }
  return out;
}

/* ── Overview ───────────────────────────────────────────────────────────── */
function Overview({ s }: { s: DemoState }) {
  const enq = enquiries(s);
  const converted = enq.filter((e) => e.jobId).length;
  const newCount = enq.filter((e) => e.isNew).length;
  const sources = ["Referral", "Repeat", "Website", "Phone / email", "Site visit"].map((src) => ({ src, n: enq.filter((e) => e.source === src).length })).filter((x) => x.n);
  const byDay: { label: string; value: number; t: number }[] = [];
  enq.slice().sort((a, b) => a.received.getTime() - b.received.getTime()).forEach((e) => {
    const label = dayLabel(e.received);
    const hit = byDay.find((d) => d.label === label);
    if (hit) hit.value++; else byDay.push({ label, value: 1, t: e.received.getTime() });
  });
  const qs = quotes(s);
  const sentQs = qs.filter((q) => q.sentOn && q.turnaroundHrs > 0);
  const turnMed = median(sentQs.map((q) => q.turnaroundHrs));
  const open = qs.filter((q) => q.status !== "accepted");
  const openValue = open.reduce((a, q) => a + q.price, 0);
  const appr = approvalsFor(s);
  const recentQs = qs.filter((q) => q.turnaroundHrs > 0).sort((a, b) => b.job.created.getTime() - a.job.created.getTime()).slice(0, 7);

  return (
    <Page>
      <PageHead kicker="Sales & Quotes" title="Quote fast, keep the margin"
        sub="Most work comes back through repeat customers and referrals. This view keeps new enquiries moving to a quote quickly without guessing the price."
        actions={<><Btn onClick={() => go("Sales", "builder")}>New quote</Btn><Btn kind="primary" onClick={() => go("Sales", "enquiries")}>Work the enquiries</Btn></>} />
      <Grid min={180}>
        <Stat label="New enquiries" value={enq.length} sub="Sample illustrative week" onClick={() => go("Sales", "enquiries")} />
        <Stat label="Converted to jobs" value={converted} tone="ok" sub={enq.length - converted + " still open"} />
        <Stat label="Quote turnaround" value={Math.round(turnMed) + " h"} sub={"Median of " + sentQs.length + " sent quotes"} />
        <Stat label="Open quote value" value={eur(openValue)} sub={open.length + " quotes not yet accepted"} onClick={() => go("Sales", "quotes")} />
        <Stat label="Waiting on you" value={appr.length} tone={appr.length ? "warn" : "ok"} sub="Quote, deposit and tender decisions" onClick={() => go("Sales", "approvals")} />
      </Grid>

      <Grid cols="minmax(0,1.2fr) minmax(0,1fr) minmax(0,1fr)" min={280} style={{ alignItems: "stretch" }}>
        <Card title="Enquiries by day" sub="Sample week, all channels">
          <Bars data={byDay.map((d) => ({ label: d.label.split(" ")[0], value: d.value }))} height={110} highlightLast />
          <Source>{ENQUIRY_NOTE}</Source>
        </Card>
        <Card title="Where they came from" sub="No paid acquisition tracked">
          <HBars data={sources.map((x) => ({ label: x.src, value: x.n, tone: SOURCE_TONE[x.src] }))} />
          <Source>Referral and repeat lead the week. Website enquiries come from the existing form (mock intake).</Source>
        </Card>
        <Card title="New vs known customers" sub="This sample week only">
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <Donut size={112} thickness={14} parts={[{ value: newCount, tone: "accent", label: "New" }, { value: enq.length - newCount, tone: "ok", label: "Known" }]}
              center={<><div style={{ fontSize: 20, fontWeight: 600 }}>{pct((newCount / Math.max(1, enq.length)) * 100, 0)}</div><div style={{ fontSize: 10.5, color: "var(--faint)" }}>new</div></>} />
            <Legend items={[{ label: "New to Signs ASAP", tone: "accent", value: newCount }, { label: "Repeat or referred known", tone: "ok", value: enq.length - newCount }]} />
          </div>
          <Source>Illustrative. Not the same measurement as the historic 80-90% repeat share the owner described, or the recent 20-30% new share.</Source>
        </Card>
      </Grid>

      <Grid cols="minmax(0,1fr) minmax(0,1fr)" min={320} style={{ alignItems: "start" }}>
        <Card title="Quote turnaround" sub="Hours from enquiry to quote sent, most recent first" right={<Badge tone="muted">median {Math.round(turnMed)} h</Badge>}>
          <HBars data={recentQs.map((q) => ({ label: q.job.short, value: q.turnaroundHrs, tone: q.turnaroundHrs > 24 ? "warn" : "ok", onClick: () => openJob(q.jobId), right: q.turnaroundHrs + " h" }))} marker={turnMed} markerLabel="Median" />
          <Source>Quotes still drafting (no turnaround yet) are left out.</Source>
        </Card>
        <Card title="Waiting on you" sub="Decisions only you make" right={<Btn small kind="quiet" onClick={() => go("Sales", "approvals")}>All approvals</Btn>}>
          {appr.length === 0 ? <Empty title="Nothing waiting" sub="Every quote and exception is decided." /> : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {appr.slice(0, 5).map((a, i) => (
                <div key={a.id} className="sa-click" onClick={() => go("Sales", "approvals")} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0", borderTop: i ? "1px solid var(--border)" : "0" }}>
                  <Badge tone={a.tone}>{a.group}</Badge>
                  <span style={{ fontSize: 12.5, color: "var(--body)", minWidth: 0, flex: 1 }}>{a.title}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </Grid>

      <Card title="Latest enquiries" sub="Convert straight to a job record, no retyping" right={<Btn small kind="quiet" onClick={() => go("Sales", "enquiries")}>All {enq.length}</Btn>}>
        <Table dense rows={enq.slice().sort((a, b) => b.received.getTime() - a.received.getTime()).slice(0, 5)}
          cols={[
            { key: "n", label: "From", width: "1.4fr", render: (e) => <span style={{ minWidth: 0 }}><span style={{ display: "block", color: "var(--ink)" }}>{e.name}</span><span style={{ fontSize: 11, color: "var(--faint)" }}>{e.channel}</span></span> },
            { key: "a", label: "Ask", width: "2fr", hideSm: true, render: (e) => <span style={{ fontSize: 12.5 }}>{e.ask}</span> },
            { key: "w", label: "Received", width: "130px", hideSm: true, render: (e) => stamp(e.received) },
            { key: "x", label: "", width: "190px", align: "right", render: (e) => e.jobId ? <JobChip id={e.jobId} label="" /> : <Btn small kind="primary" onClick={() => { const id = convertEnquiry(e.id); if (id) openJob(id); }}>Convert to job</Btn> },
          ]} />
      </Card>
    </Page>
  );
}

/* ── Enquiries ──────────────────────────────────────────────────────────── */
const channelGroup = (e: Enquiry) => (/Website/.test(e.channel) ? "Website form" : /Phone/.test(e.channel) ? "Phone" : /Walk-in/.test(e.channel) ? "Walk-in / site" : "Email");
function Enquiries({ s }: { s: DemoState }) {
  const [filter, setFilter] = useState<"all" | "new" | "contacted" | "converted">("all");
  const enq = enquiries(s).slice().sort((a, b) => b.received.getTime() - a.received.getTime());
  const shown = enq.filter((e) => filter === "all" || (filter === "converted" ? !!e.jobId : e.status === filter && !e.jobId));
  const groups = ["Email", "Phone", "Website form", "Walk-in / site"].map((g) => ({ g, items: shown.filter((e) => channelGroup(e) === g) })).filter((x) => x.items.length);
  const count = (f: string) => enq.filter((e) => (f === "converted" ? !!e.jobId : e.status === f && !e.jobId)).length;
  return (
    <Page>
      <PageHead kicker="Enquiries" title={enq.length + " enquiries this sample week"} sub={ENQUIRY_NOTE + " Leads arrive from email, phone, the website form and walk-ins (mock intake). Converting carries scope, contact and source into the job."}
        actions={<Seg value={filter} onChange={setFilter} options={[{ id: "all", label: "All " + enq.length }, { id: "new", label: "New " + count("new") }, { id: "contacted", label: "Contacted " + count("contacted") }, { id: "converted", label: "Converted " + count("converted") }]} />} />
      {groups.length === 0 && <Card><Empty title="No enquiries in this view" sub="Try another filter." /></Card>}
      {groups.map((grp) => (
        <div key={grp.g} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Label>{grp.g} · {grp.items.length}</Label>
          <Grid min={300}>
            {grp.items.map((e) => (
              <Card key={e.id} tone={e.status === "new" && !e.jobId ? "accent" : undefined}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{e.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 2 }}>{e.contactRole} · {e.channel}</div>
                  </div>
                  <Badge tone={SOURCE_TONE[e.source]}>{e.source}</Badge>
                </div>
                <div style={{ fontSize: 13, color: "var(--body)", marginTop: 10, lineHeight: 1.5 }}>{e.ask}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                  <Badge tone={KIND_TONE[e.kind]}>{KIND_LABEL[e.kind]}</Badge>
                  <Badge tone="muted">est. {eur(e.estValue)}</Badge>
                  <Badge tone={e.isNew ? "accent" : "ok"}>{e.isNew ? "New customer" : "Known customer"}</Badge>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11.5, color: "var(--faint)", flex: 1, minWidth: 90 }}>{stamp(e.received)}</span>
                  {e.jobId ? <JobChip id={e.jobId} /> : (
                    <>
                      {e.status === "new" && <Btn small onClick={() => { setEnquiryStatus(e.id, "contacted"); log("human", "Managing Director", "Contacted " + e.name + " about: " + e.ask, undefined, "enquiry", "info"); toast(e.name + " marked contacted"); }}>Mark contacted</Btn>}
                      <Btn small kind="quiet" onClick={() => { setEnquiryStatus(e.id, "declined"); log("human", "Managing Director", "Declined enquiry from " + e.name + ".", undefined, "enquiry", "info"); toast("Enquiry declined"); }}>Decline</Btn>
                      <Btn small kind="primary" onClick={() => { const id = convertEnquiry(e.id); if (id) openJob(id); }}>Convert to job</Btn>
                    </>
                  )}
                </div>
                {e.status === "declined" && !e.jobId && <Note style={{ marginTop: 10 }}>Declined. <span className="sa-click" style={{ color: "var(--accent)" }} onClick={() => setEnquiryStatus(e.id, "new")}>Undo</span></Note>}
              </Card>
            ))}
          </Grid>
        </div>
      ))}
    </Page>
  );
}

/* ── Quotes ─────────────────────────────────────────────────────────────── */
function Quotes({ s }: { s: DemoState }) {
  const [kind, setKind] = useState<"all" | JobKind>("all");
  const [status, setStatus] = useState<"all" | "open" | "accepted">("all");
  const floor = s.marginFloor;
  const qs = quotes(s);
  const rows = qs.filter((q) => (kind === "all" || q.job.kind === kind) && (status === "all" || (status === "accepted" ? q.status === "accepted" : q.status !== "accepted")))
    .sort((a, b) => b.job.created.getTime() - a.job.created.getTime());
  const kinds: JobKind[] = ["print", "vehicle", "led"];
  const total = rows.reduce((a, q) => a + q.price, 0), totalCost = rows.reduce((a, q) => a + q.cost, 0);
  return (
    <Page>
      <PageHead kicker="Quotes" title="Every quote with its cost behind it" sub="Price, expected cost and contribution side by side. Simple print, vehicle branding and custom LED work have very different economics, so filter by type."
        actions={<Btn kind="primary" onClick={() => go("Sales", "builder")}>New quote</Btn>} />
      <Grid min={220}>
        {kinds.map((k) => {
          const ks = qs.filter((q) => q.job.kind === k);
          const v = ks.reduce((a, q) => a + q.price, 0), c = ks.reduce((a, q) => a + q.cost, 0);
          const m = margin(v, c);
          return (
            <Card key={k} onClick={() => setKind(kind === k ? "all" : k)} tone={kind === k ? "accent" : undefined}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Badge tone={KIND_TONE[k]}>{KIND_LABEL[k]}</Badge><span style={{ flex: 1 }} /><span style={{ fontSize: 12, color: "var(--faint)" }}>{ks.length} quotes</span></div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 12 }}>
                <span style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-.6px", fontVariantNumeric: "tabular-nums" }}>{eur(v)}</span>
                <span style={{ fontSize: 13, color: "var(--" + (marginTone(m, floor) === "bad" ? "bad" : marginTone(m, floor) === "warn" ? "warn" : "ok") + ")" }}>{pct(m)} margin</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 4 }}>{eur(v - c)} contribution</div>
            </Card>
          );
        })}
      </Grid>
      <Card pad={false}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, padding: "14px 16px 0", alignItems: "center" }}>
          <Seg size="sm" value={kind} onChange={setKind} options={[{ id: "all", label: "All types" }, { id: "print", label: "Print" }, { id: "vehicle", label: "Vehicle" }, { id: "led", label: "Custom LED" }]} />
          <Seg size="sm" value={status} onChange={setStatus} options={[{ id: "all", label: "Any status" }, { id: "open", label: "Open" }, { id: "accepted", label: "Accepted" }]} />
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 12, color: "var(--faint)" }}>Margin floor {floor}% · <span className="sa-click" style={{ color: "var(--accent)" }} onClick={() => go("Sales", "builder")}>change</span></span>
        </div>
        <div style={{ padding: 16 }}>
          <Table rows={rows} onRow={(q) => openJob(q.jobId)}
            rowTone={(q) => (q.status !== "accepted" && margin(q.price, q.cost) < floor ? "bad" : undefined)}
            cols={[
              { key: "id", label: "Quote", width: "84px", render: (q) => <span className="sa-mono" style={{ color: "var(--dim)" }}>{q.id}</span> },
              { key: "c", label: "Customer / job", width: "1.7fr", render: (q) => <span style={{ minWidth: 0 }}><span style={{ display: "block", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{customer(q.job.customerId)?.name || q.job.short}</span><span style={{ fontSize: 11, color: "var(--faint)" }}>{q.jobId} · {stageLabel(q.job.stage)}</span></span> },
              { key: "k", label: "Type", width: "110px", hideSm: true, render: (q) => <Badge tone={KIND_TONE[q.job.kind]}>{q.job.kind === "led" ? "Custom LED" : q.job.kind === "vehicle" ? "Vehicle" : "Print"}</Badge> },
              { key: "p", label: "Price", width: "90px", align: "right", render: (q) => <span style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{eur(q.price)}</span> },
              { key: "e", label: "Exp. cost", width: "90px", align: "right", hideSm: true, render: (q) => <span style={{ fontVariantNumeric: "tabular-nums" }}>{eur(q.cost)}</span> },
              { key: "m", label: "Contribution", width: "120px", align: "right", render: (q) => { const m = margin(q.price, q.cost); return <span style={{ fontVariantNumeric: "tabular-nums" }}>{eur(q.price - q.cost)} <span style={{ color: "var(--" + (marginTone(m, floor) === "bad" ? "bad" : marginTone(m, floor) === "warn" ? "warn" : "ok") + ")" }}>{pct(m, 0)}</span></span>; } },
              { key: "s", label: "Status", width: "120px", render: (q) => <Badge tone={QUOTE_STATUS[q.status][0]}>{QUOTE_STATUS[q.status][1]}</Badge> },
              { key: "v", label: "Valid to", width: "100px", hideSm: true, render: (q) => <span style={{ fontSize: 12 }}>{q.status === "accepted" ? "Accepted" : dayLabel(q.validUntil)}</span> },
            ]}
            footer={<span>{rows.length} quotes · {eur(total)} quoted · {eur(totalCost)} expected cost · {pct(margin(total, totalCost))} blended margin. Values are illustrative.</span>}
          />
        </div>
      </Card>
    </Page>
  );
}

/* ── Quote Builder ──────────────────────────────────────────────────────── */
function Assume({ label, children, note }: { label: string; children: ReactNode; note?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderTop: "1px solid var(--border)" }}>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 12.5, color: "var(--body)" }}>{label}</span>
        {note && <span style={{ display: "block", fontSize: 11, color: "var(--faint)" }}>{note}</span>}
      </span>
      <span style={{ display: "inline-flex", gap: 6, flex: "none" }}>{children}</span>
    </div>
  );
}

function Result({ s, kind, cost, sell, lines, template }: { s: DemoState; kind: JobKind; cost: number; sell: number; lines: { label: string; cost: number; sell?: number }[]; template: string }) {
  const floor = s.marginFloor;
  const m = margin(sell, cost);
  const tone = marginTone(m, floor);
  const histMed = median(HISTORY.filter((h) => h.kind === kind).map((h) => margin(h.price, h.cost)));
  const floorPrice = cost / (1 - floor / 100);
  const pastPrice = cost / (1 - histMed / 100);
  const lo = Math.min(floorPrice, pastPrice, sell) * 0.9, hi = Math.max(floorPrice, pastPrice, sell) * 1.08;
  const pos = (x: number) => ((x - lo) / (hi - lo)) * 100 + "%";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
      <Card title="Live result" sub={"Template: " + template} tone={tone === "bad" ? "bad" : undefined}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
          <div className="sa-kv"><div className="sa-label">Price</div><div style={{ fontSize: 20, marginTop: 4, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{eur(sell)}</div></div>
          <div className="sa-kv"><div className="sa-label">Cost</div><div style={{ fontSize: 20, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{eur(cost)}</div></div>
          <div className="sa-kv"><div className="sa-label">Margin</div><div style={{ fontSize: 20, marginTop: 4, fontVariantNumeric: "tabular-nums", color: "var(--" + (tone === "bad" ? "bad" : tone === "warn" ? "warn" : "ok") + ")" }}>{pct(m)}</div></div>
        </div>
        <Label style={{ marginTop: 16 }}>Pricing range</Label>
        <div style={{ position: "relative", height: 44, marginTop: 10 }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 16, height: 8, borderRadius: 4, background: "var(--track)" }} />
          <div style={{ position: "absolute", top: 16, height: 8, borderRadius: 4, left: pos(Math.min(floorPrice, pastPrice)), width: "calc(" + pos(Math.max(floorPrice, pastPrice)) + " - " + pos(Math.min(floorPrice, pastPrice)) + ")", background: "var(--accent-soft)" }} />
          <Marker x={pos(floorPrice)} label={"Floor " + eur(floorPrice)} tone="bad" top />
          <Marker x={pos(pastPrice)} label={"Past median " + eur(pastPrice)} tone="ok" />
          <div title={"Your price " + eur(sell)} style={{ position: "absolute", left: pos(sell), top: 11, width: 18, height: 18, marginLeft: -9, borderRadius: 9, background: "var(--accent-fill,var(--accent))", boxShadow: "0 0 0 3px var(--surface)" }} />
        </div>
        <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 6, lineHeight: 1.5 }}>
          Low end is the price that just clears your {floor}% floor. High end is this cost at the median margin of past {KIND_LABEL[kind].toLowerCase()} jobs ({pct(histMed, 0)}, illustrative archive).
        </div>
        {tone !== "ok" && <Note tone={tone} style={{ marginTop: 12 }}>{tone === "bad" ? "Below your " + floor + "% minimum margin. Raise the price to at least " + eur(Math.ceil(floorPrice / 10) * 10) + " or trim cost." : "Close to your " + floor + "% floor."}</Note>}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12.5, color: "var(--body)" }}>Minimum margin</span>
          <NumField value={floor} suffix="%" width={78} onChange={(n) => update(() => ({ marginFloor: Math.min(80, n) }))} label="Minimum margin" />
          <span style={{ fontSize: 11, color: "var(--faint)" }}>Your setting, not a stated policy</span>
        </div>
      </Card>
      <Card title="Cost build-up">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {lines.map((l) => (
            <div key={l.label} style={{ display: "flex", gap: 10, fontSize: 12.5, color: "var(--dim)" }}>
              <span style={{ flex: 1, minWidth: 0 }}>{l.label}</span>
              <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--body)" }}>{eur(l.cost)}</span>
            </div>
          ))}
          <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
          <div style={{ display: "flex", gap: 10, fontSize: 13, color: "var(--ink)" }}><span style={{ flex: 1 }}>Total cost</span><b style={{ fontVariantNumeric: "tabular-nums" }}>{eur(cost)}</b></div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          <Btn kind="primary" onClick={() => { log("human", "Managing Director", "Saved a draft quote from the " + template + " template: " + eur(sell) + " at " + pct(m) + " margin (not sent).", undefined, "quote", "info"); toast("Draft saved. Nothing was sent."); }}>Save as draft quote</Btn>
          <Btn onClick={() => { log("agent", "Quote Coach", "Checked " + template + " draft: " + pct(m) + " vs " + pct(histMed, 0) + " past median for " + KIND_LABEL[kind].toLowerCase() + ".", undefined, "quote", tone === "bad" ? "warn" : "info"); toast("Quote Coach: " + (tone === "bad" ? "below floor, raise the price" : m < histMed ? "under your past median, room to firm up" : "in line with past jobs")); }}>Ask Quote Coach</Btn>
        </div>
      </Card>
    </div>
  );
}
function Marker({ x, label, tone, top }: { x: string; label: string; tone: Tone; top?: boolean }) {
  return (
    <div style={{ position: "absolute", left: x, top: 0, bottom: 0, width: 0 }}>
      <div style={{ position: "absolute", left: -1, top: 12, width: 2, height: 16, background: "var(--" + (tone === "bad" ? "bad" : "ok") + ")" }} />
      <div style={{ position: "absolute", top: top ? -4 : 30, left: 0, transform: "translateX(-50%)", whiteSpace: "nowrap", fontSize: 10.5, color: "var(--" + (tone === "bad" ? "bad" : "ok") + ")" }}>{label}</div>
    </div>
  );
}

function Builder({ s }: { s: DemoState }) {
  const [tpl, setTplState] = useState<JobKind>(lastTemplate);
  const setTpl = (k: JobKind) => { lastTemplate = k; setTplState(k); };
  /* printed boards / vinyl */
  const [pw, setPw] = useState(4.2), [ph, setPh] = useState(0.8), [pq, setPq] = useState(1), [pSub, setPSub] = useState(38), [pPrint, setPPrint] = useState(22);
  const [pLam, setPLam] = useState(true), [pLamCost, setPLamCost] = useState(9), [pSell, setPSell] = useState(210), [pCons, setPCons] = useState(40);
  const [pInstH, setPInstH] = useState(3), [pInstPrice, setPInstPrice] = useState(260), [pDesH, setPDesH] = useState(2), [pDesPrice, setPDesPrice] = useState(90), [rate, setRate] = useState(35);
  /* fleet wraps */
  const [vq, setVq] = useState(15), [vFilm, setVFilm] = useState(720), [vAppH, setVAppH] = useState(11), [vCons, setVCons] = useState(95), [vDesign, setVDesign] = useState(300), [vPkg, setVPkg] = useState(1900);
  const [vDisc, setVDisc] = useState(false), [t1, setT1] = useState(0), [t2, setT2] = useState(3), [t3, setT3] = useState(5);
  /* custom illuminated */
  const [lTray, setLTray] = useState(980), [lFaces, setLFaces] = useState(420), [lLedN, setLLedN] = useState(180), [lLedU, setLLedU] = useState(1.6), [lDrvN, setLDrvN] = useState(2), [lDrvU, setLDrvU] = useState(95);
  const [lDes, setLDes] = useState(10), [lCnc, setLCnc] = useState(16), [lAsm, setLAsm] = useState(14), [lFit, setLFit] = useState(900), [lMewp, setLMewp] = useState(380), [lCont, setLCont] = useState(8), [lPrice, setLPrice] = useState(7600);

  let cost = 0, sell = 0, lines: { label: string; cost: number }[] = [], template = "";
  if (tpl === "print") {
    const area = pw * ph * pq;
    const matRate = pSub + pPrint + (pLam ? pLamCost : 0);
    lines = [
      { label: "Substrate + print" + (pLam ? " + laminate" : "") + " (" + area.toFixed(2) + " m² × " + eur(matRate) + ")", cost: area * matRate },
      { label: "Fixings & consumables", cost: pCons },
      { label: "Design " + pDesH + " h × " + eur(rate), cost: pDesH * rate },
      { label: "Installation " + pInstH + " h × " + eur(rate), cost: pInstH * rate },
    ];
    cost = lines.reduce((a, l) => a + l.cost, 0);
    sell = area * pSell + pInstPrice + pDesPrice;
    template = "Printed boards / vinyl";
  } else if (tpl === "vehicle") {
    const tier = vq >= 10 ? t3 : vq >= 5 ? t2 : t1;
    const disc = vDisc ? tier : 0;
    lines = [
      { label: "Film + laminate × " + vq + " (" + eur(vFilm) + " each)", cost: vFilm * vq },
      { label: "Application " + vAppH + " h × " + eur(rate) + " × " + vq, cost: vAppH * rate * vq },
      { label: "Prep & consumables × " + vq, cost: vCons * vq },
      { label: "Design & template (one-off)", cost: vDesign },
    ];
    cost = lines.reduce((a, l) => a + l.cost, 0);
    sell = vq * vPkg * (1 - disc / 100);
    template = "Fleet wraps" + (disc ? " (" + disc + "% batch discount)" : "");
  } else {
    const mats = lTray + lFaces + lLedN * lLedU + lDrvN * lDrvU;
    lines = [
      { label: "Tray (composite or solid aluminium)", cost: lTray },
      { label: "Acrylic faces + vinyl", cost: lFaces },
      { label: "LED modules " + lLedN + " × " + eur(lLedU).replace(/\.00$/, ""), cost: lLedN * lLedU },
      { label: "Drivers " + lDrvN + " × " + eur(lDrvU), cost: lDrvN * lDrvU },
      { label: "Design " + lDes + " h", cost: lDes * rate },
      { label: "CNC " + lCnc + " h", cost: lCnc * rate },
      { label: "Assembly & wiring " + lAsm + " h", cost: lAsm * rate },
      { label: "Fitting crew", cost: lFit },
      { label: "MEWP hire", cost: lMewp },
      { label: "Contingency " + lCont + "% of materials", cost: (mats * lCont) / 100 },
    ];
    cost = lines.reduce((a, l) => a + l.cost, 0);
    sell = lPrice;
    template = "Custom illuminated";
  }

  return (
    <Page>
      <PageHead kicker="Quote Builder" title="Three ways to price, because the work is different"
        sub="Printed boards and wraps have predictable unit economics. LED and fabricated signs are different every time, so they are built from a bill of materials. All figures are editable assumptions, not a universal automatic price."
        actions={<Seg value={tpl} onChange={setTpl} options={[{ id: "print", label: "Printed boards / vinyl" }, { id: "vehicle", label: "Fleet wraps" }, { id: "led", label: "Custom illuminated" }]} />} />

      <Grid cols="minmax(0,1.15fr) minmax(0,1fr)" min={330} style={{ alignItems: "start" }}>
        <Card title={tpl === "print" ? "Area × unit price" : tpl === "vehicle" ? "Per vehicle × quantity" : "Bill of materials + labour + fitting"}
          sub={tpl === "print" ? "Width × height × quantity, then rate per m²" : tpl === "vehicle" ? "One package per van, optional batch discount tiers" : "Each component costed; set the price yourself"}
          right={<Badge tone={KIND_TONE[tpl]}>{KIND_LABEL[tpl]}</Badge>}>
          {tpl === "print" && (
            <>
              <Assume label="Width × height (m)"><NumField value={pw} onChange={setPw} width={70} step={0.1} label="Width" /><NumField value={ph} onChange={setPh} width={70} step={0.1} label="Height" /></Assume>
              <Assume label="Quantity" note={(pw * ph * pq).toFixed(2) + " m² in total"}><NumField value={pq} onChange={setPq} width={70} label="Quantity" /></Assume>
              <Assume label="Substrate cost per m²" note="3 mm ACM / Dibond"><NumField prefix="€" value={pSub} onChange={setPSub} width={84} label="Substrate cost" /></Assume>
              <Assume label="Print cost per m²" note="Ink, media, machine time"><NumField prefix="€" value={pPrint} onChange={setPPrint} width={84} label="Print cost" /></Assume>
              <Assume label="Laminate">
                <Seg size="sm" value={pLam ? "on" : "off"} onChange={(x) => setPLam(x === "on")} options={[{ id: "on", label: "Yes" }, { id: "off", label: "No" }]} />
                {pLam && <NumField prefix="€" value={pLamCost} onChange={setPLamCost} width={74} label="Laminate cost per m2" />}
              </Assume>
              <Assume label="Fixings & consumables"><NumField prefix="€" value={pCons} onChange={setPCons} width={84} label="Consumables" /></Assume>
              <Assume label="Sell per m²"><NumField prefix="€" value={pSell} onChange={setPSell} width={84} label="Sell per m2" /></Assume>
              <Assume label="Design hours / price"><NumField suffix="h" value={pDesH} onChange={setPDesH} width={64} label="Design hours" /><NumField prefix="€" value={pDesPrice} onChange={setPDesPrice} width={80} label="Design price" /></Assume>
              <Assume label="Install hours / price"><NumField suffix="h" value={pInstH} onChange={setPInstH} width={64} label="Install hours" /><NumField prefix="€" value={pInstPrice} onChange={setPInstPrice} width={80} label="Install price" /></Assume>
              <Assume label="Labour rate (cost)"><NumField prefix="€" suffix="/h" value={rate} onChange={setRate} width={92} label="Labour rate" /></Assume>
            </>
          )}
          {tpl === "vehicle" && (
            <>
              <Assume label="Vehicles"><NumField value={vq} onChange={setVq} width={70} label="Vehicles" /></Assume>
              <Assume label="Film + laminate per van"><NumField prefix="€" value={vFilm} onChange={setVFilm} width={84} label="Film cost" /></Assume>
              <Assume label="Application hours per van"><NumField suffix="h" value={vAppH} onChange={setVAppH} width={70} label="Application hours" /></Assume>
              <Assume label="Prep & consumables per van"><NumField prefix="€" value={vCons} onChange={setVCons} width={84} label="Prep cost" /></Assume>
              <Assume label="Design & template (one-off)"><NumField prefix="€" value={vDesign} onChange={setVDesign} width={84} label="Design" /></Assume>
              <Assume label="Package price per van"><NumField prefix="€" value={vPkg} onChange={setVPkg} width={90} label="Package price" /></Assume>
              <Assume label="Labour rate (cost)"><NumField prefix="€" suffix="/h" value={rate} onChange={setRate} width={92} label="Labour rate" /></Assume>
              <Assume label="Batch discount" note="Tiers: 1-4 vans, 5-9 vans, 10+ vans">
                <Seg size="sm" value={vDisc ? "on" : "off"} onChange={(x) => setVDisc(x === "on")} options={[{ id: "off", label: "Off" }, { id: "on", label: "Tiered" }]} />
              </Assume>
              {vDisc && (
                <Assume label="Tier discounts (%)">
                  <NumField value={t1} onChange={setT1} width={54} label="Tier 1" /><NumField value={t2} onChange={setT2} width={54} label="Tier 2" /><NumField value={t3} onChange={setT3} width={54} label="Tier 3" />
                </Assume>
              )}
              <Source>Defaults mirror the 15-van fleet order: €1,900 per van flat (illustrative), {eur(18300)} cost.</Source>
            </>
          )}
          {tpl === "led" && (
            <>
              <Assume label="Tray" note="3 mm ACM or solid aluminium"><NumField prefix="€" value={lTray} onChange={setLTray} width={88} label="Tray" /></Assume>
              <Assume label="Acrylic faces + vinyl"><NumField prefix="€" value={lFaces} onChange={setLFaces} width={88} label="Faces" /></Assume>
              <Assume label="LED modules (qty × unit)"><NumField value={lLedN} onChange={setLLedN} width={66} label="LED count" /><NumField prefix="€" value={lLedU} onChange={setLLedU} width={74} step={0.1} label="LED unit" /></Assume>
              <Assume label="Drivers (qty × unit)"><NumField value={lDrvN} onChange={setLDrvN} width={56} label="Drivers" /><NumField prefix="€" value={lDrvU} onChange={setLDrvU} width={74} label="Driver unit" /></Assume>
              <Assume label="Design hours"><NumField suffix="h" value={lDes} onChange={setLDes} width={66} label="Design hours" /></Assume>
              <Assume label="CNC hours"><NumField suffix="h" value={lCnc} onChange={setLCnc} width={66} label="CNC hours" /></Assume>
              <Assume label="Assembly & wiring hours"><NumField suffix="h" value={lAsm} onChange={setLAsm} width={66} label="Assembly hours" /></Assume>
              <Assume label="Labour rate (cost)"><NumField prefix="€" suffix="/h" value={rate} onChange={setRate} width={92} label="Labour rate" /></Assume>
              <Assume label="Fitting crew" note="External partner, high-level fix"><NumField prefix="€" value={lFit} onChange={setLFit} width={88} label="Fitting" /></Assume>
              <Assume label="MEWP hire"><NumField prefix="€" value={lMewp} onChange={setLMewp} width={84} label="MEWP" /></Assume>
              <Assume label="Contingency on materials"><NumField suffix="%" value={lCont} onChange={setLCont} width={70} label="Contingency" /></Assume>
              <Assume label="Your price"><NumField prefix="€" value={lPrice} onChange={setLPrice} width={96} label="Price" /></Assume>
              <Source>Each bespoke sign differs. Supplier prices are your inputs; the builder does not invent them.</Source>
            </>
          )}
        </Card>
        <Result s={s} kind={tpl} cost={cost} sell={sell} lines={lines} template={template} />
      </Grid>
    </Page>
  );
}

/* ── Repeat Accounts ────────────────────────────────────────────────────── */
function Accounts({ s }: { s: DemoState }) {
  const repeatCustomers = CUSTOMERS.filter((c) => c.repeat);
  const all = jobs(s);
  const [sel, setSel] = useState<string>(repeatCustomers[0]?.id || "");
  const cust = CUSTOMERS.find((c) => c.id === sel);
  const cjobs = all.filter((j) => j.customerId === sel);
  const cquotes = quotes(s).filter((q) => q.job.customerId === sel);
  const art = cjobs.flatMap((j) => proofsFor(j.id, s).filter((p) => p.status === "approved").map((p) => ({ ...p, jobShort: j.short })));
  const pays = payments(s).filter((p) => cjobs.some((j) => j.id === p.jobId));
  const kinds = Array.from(new Set(cjobs.flatMap((j) => j.signTypes)));
  return (
    <Page>
      <PageHead kicker="Repeat Accounts" title="One view of everyone who comes back"
        sub="Prior quotes, approved artwork and preferences in one place, so anyone in the team can handle a repeat order. Public reference names appear as profiles only." />

      <Label>Public reference profiles (from signsasap.ie)</Label>
      <Grid min={230}>
        {REFERENCE_ACCOUNTS.map((r) => (
          <Card key={r.id}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar initials={r.name.replace(/[^A-Za-z ]/g, "").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()} tint="var(--teal)" size={30} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{r.name}</div>
                <div style={{ fontSize: 11, color: "var(--faint)" }}>{r.cat}</div>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 10 }}>{r.kinds.map((k) => <Badge key={k} tone="muted">{k}</Badge>)}</div>
            <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 10, lineHeight: 1.45 }}>Preferences: {r.prefs}</div>
            <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 8 }}>{r.note}. Illustrative account history: no orders shown.</div>
            <div style={{ marginTop: 10 }}>
              <Btn small onClick={() => { lastTemplate = r.kinds.some((k) => /vehicle|wrap|car/i.test(k)) ? "vehicle" : r.kinds.some((k) => /LED|Lightbox/i.test(k)) ? "led" : "print"; go("Sales", "builder"); }}>Start a quote</Btn>
            </div>
          </Card>
        ))}
      </Grid>

      <Grid cols="minmax(0,1fr) minmax(0,1.3fr)" min={320} style={{ alignItems: "start" }}>
        <Card pad={false} title="Repeat customers in the demo" sub="Fictional accounts with illustrative history">
          <div style={{ padding: "4px 12px 12px" }}>
            {repeatCustomers.map((c) => {
              const js = all.filter((j) => j.customerId === c.id);
              const val = js.reduce((a, j) => a + j.price, 0);
              const on = c.id === sel;
              return (
                <div key={c.id} onClick={() => setSel(c.id)} className="sa-click"
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 10px", borderRadius: 12, background: on ? "var(--surface-2)" : "none", boxShadow: on ? "inset 2px 0 0 var(--accent)" : undefined }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "var(--faint)" }}>{c.cat} · since {c.since} · {c.town}</div>
                  </div>
                  <span style={{ fontSize: 12, color: "var(--body)", fontVariantNumeric: "tabular-nums" }}>{js.length ? eur(val) : "-"}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {cust && (
          <Card title={cust.name} sub={cust.contactRole + " · " + cust.cat + " · customer since " + cust.since}
            right={<><Badge tone="ok">Repeat</Badge><Btn small kind="primary" onClick={() => { lastTemplate = cjobs[0]?.kind || "print"; go("Sales", "builder"); }}>New quote</Btn></>}>
            {cust.note && <Note style={{ marginBottom: 12 }}>{cust.note}</Note>}
            <Label>Jobs</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
              {cjobs.length === 0 && <span style={{ fontSize: 12.5, color: "var(--dim)" }}>No live jobs in the demo.</span>}
              {cjobs.map((j) => (
                <div key={j.id} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <JobChip id={j.id} />
                  <Badge tone={stageTone(j.stage)}>{stageLabel(j.stage)}</Badge>
                  <span style={{ flex: 1 }} />
                  <span style={{ fontSize: 12.5, fontVariantNumeric: "tabular-nums" }}>{eur(j.price)}</span>
                </div>
              ))}
            </div>
            <Label style={{ marginTop: 16 }}>Prior quotes</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
              {cquotes.length === 0 && <span style={{ fontSize: 12.5, color: "var(--dim)" }}>None in the demo.</span>}
              {cquotes.map((q) => (
                <div key={q.id} style={{ display: "flex", gap: 10, fontSize: 12.5, color: "var(--body)", alignItems: "center" }}>
                  <span className="sa-mono" style={{ color: "var(--faint)", width: 70 }}>{q.id}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>{q.job.short}</span>
                  <Badge tone={QUOTE_STATUS[q.status][0]}>{QUOTE_STATUS[q.status][1]}</Badge>
                  <span style={{ fontVariantNumeric: "tabular-nums", width: 74, textAlign: "right" }}>{eur(q.price)}</span>
                </div>
              ))}
            </div>
            <Label style={{ marginTop: 16 }}>Artwork references</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
              {art.length === 0 && <span style={{ fontSize: 12.5, color: "var(--dim)" }}>No approved artwork yet.</span>}
              {art.map((p) => (
                <div key={p.id} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 12.5 }}>
                  <span style={{ display: "inline-flex", gap: 3 }}>{p.swatch.map((c) => <span key={c} style={{ width: 12, height: 12, borderRadius: 3, background: c, border: "1px solid var(--border)" }} />)}</span>
                  <span style={{ flex: 1, minWidth: 0, color: "var(--body)" }}>{p.jobShort} v{p.v}: {p.pantone}</span>
                  <span style={{ fontSize: 11, color: "var(--faint)" }}>{p.substrate.split(",")[0]}</span>
                </div>
              ))}
            </div>
            <Label style={{ marginTop: 16 }}>Repeat-order preferences</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {kinds.map((k) => <Badge key={k} tone="muted">{k}</Badge>)}
              {pays.length > 0 && <Badge tone="info">Deposit pattern: {Array.from(new Set(cjobs.map((j) => j.depositPct + "%"))).join(", ")}</Badge>}
            </div>
            <Source>Illustrative account history for demonstration.</Source>
          </Card>
        )}
      </Grid>
    </Page>
  );
}

/* ── Approvals ──────────────────────────────────────────────────────────── */
function Approvals({ s }: { s: DemoState }) {
  const items = approvalsFor(s);
  const groups = ["Quote approval", "Below margin floor", "Tender review", "Late change", "Deposit exception"];
  const done = Object.keys(s.decisionsDone).filter((k) => /^(qa-|mf-|dep-)/.test(k)).length;
  return (
    <Page>
      <PageHead kicker="Approvals" title={items.length ? items.length + " decisions waiting on you" : "Nothing waiting on you"}
        sub="Quotes, margin exceptions, deposit exceptions, late artwork changes and tender submissions. The owner stays in control; nothing here sends anything."
        actions={done ? <Badge tone="ok">{done} decided this session</Badge> : undefined} />
      {items.length === 0 && <Card><Empty title="All clear" sub="Every quote and exception has a decision. New ones appear here as they come in." /></Card>}
      {groups.map((g) => {
        const gi = items.filter((a) => a.group === g);
        if (!gi.length) return null;
        return (
          <div key={g} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Label>{g} · {gi.length}</Label>
            <Grid min={340}>
              {gi.map((a) => (
                <Card key={a.id} tone={a.tone === "bad" ? "bad" : a.tone === "warn" ? "warn" : undefined}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ minWidth: 0, flex: 1, fontSize: 14, fontWeight: 600, color: "var(--ink)", lineHeight: 1.35 }}>{a.title}</div>
                    <Badge tone={a.tone}>{a.group}</Badge>
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--body)", marginTop: 8, lineHeight: 1.55 }}>{a.detail}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
                    {a.actions}
                    <span style={{ flex: 1 }} />
                    {a.jobId && <JobChip id={a.jobId} label="" />}
                  </div>
                </Card>
              ))}
            </Grid>
          </div>
        );
      })}
      <Source>Pending counts are derived from quotes, deposits, change requests and the tender draft. Approvals are recorded in Activity.</Source>
    </Page>
  );
}

/* ── Entry ──────────────────────────────────────────────────────────────── */
export default function SalesQuotes(_props: { v: any }) {
  const [s] = useDemo();
  const tab = getTab("Sales", firstTab("Sales"));
  if (tab === "enquiries") return <Enquiries s={s} />;
  if (tab === "quotes") return <Quotes s={s} />;
  if (tab === "builder") return <Builder s={s} />;
  if (tab === "accounts") return <Accounts s={s} />;
  if (tab === "approvals") return <Approvals s={s} />;
  return <Overview s={s} />;
}
