/* Finance & Margins: a management overlay above the existing accounts package.
   It never becomes the ledger. Every total is derived from the seeded demo jobs
   and payments in data.ts, and labelled as such. */

import { useState } from "react";
import {
  useDemo, getTab, go, jobs, payments, recordPayment, update, log, toast, eur, pct, margin, customer, recommendedDeposit,
  workOrders, isApproved, payStatusOf, setJobPrice, quotes, type DemoState,
} from "../model";
import { firstTab } from "../nav";
import { HISTORY, HISTORY_NOTE, LEDGER_NOTE, KIND_LABEL, TENDER_WON, type Job } from "../data";
import { dayLabel } from "../dates";
import {
  Page, PageHead, Grid, Card, Stat, Badge, Btn, Table, JobChip, Note, Source, HBars, Bars, Donut, Legend, Meter, NumField, Seg, Label, type Tone,
} from "../ui";
import {
  stationLoads, loadTone, costSplit, COST_PARTS, moneyFor, moneyTotals, histActual, kindHistory, KINDS, KIND_SHORT, KIND_TONE, median, priceForMargin,
} from "./metrics";

const DEMO = "Demo totals from seeded jobs, not real financial performance.";

export default function Finance(_props: { v: any }) {
  const [s] = useDemo();
  const tab = getTab("Finance", firstTab("Finance"));
  const [labourRate, setLabourRate] = useState(TENDER_WON.labourRate);
  return (
    <Page>
      {tab === "overview" && <Overview s={s} />}
      {tab === "profit" && <JobProfit s={s} />}
      {tab === "qva" && <QuoteVsActual s={s} labourRate={labourRate} setLabourRate={setLabourRate} />}
      {tab === "deposits" && <Deposits s={s} />}
      {tab === "intel" && <PriceIntel s={s} labourRate={labourRate} />}
    </Page>
  );
}

const marginTone = (m: number, floor: number): Tone => (m < floor ? "bad" : m < floor + 4 ? "warn" : "ok");

/* ── Overview ───────────────────────────────────────────────────────────── */
function Overview({ s }: { s: DemoState }) {
  const js = jobs(s);
  const open = js.filter((j) => j.stage !== "completed");
  const openSell = open.reduce((a, j) => a + j.price, 0);
  const openCost = open.reduce((a, j) => a + j.cost, 0);
  const m = moneyTotals(s);
  const loads = stationLoads(s);
  const floor = s.marginFloor;
  const below = open.filter((j) => margin(j.price, j.cost) < floor);
  const port = js.find((j) => j.id === "JOB-26046");
  const byStage = [
    { id: "pre", label: "Not yet won", stages: ["enquiry", "survey", "quoting"] },
    { id: "won", label: "Won, pre-production", stages: ["proof", "procurement"] },
    { id: "prod", label: "In production", stages: ["production"] },
    { id: "fit", label: "Ready / booked", stages: ["ready", "booked"] },
  ].map((g) => {
    const gj = open.filter((j) => g.stages.indexOf(j.stage) > -1);
    const sell = gj.reduce((a, j) => a + j.price, 0), cost = gj.reduce((a, j) => a + j.cost, 0);
    return { ...g, sell, cost, n: gj.length };
  });
  return (
    <>
      <PageHead kicker="Finance & Margins" title="Where the money sits on open work"
        sub="A management view above your accounts package. It reads job values and payments; it does not post, reconcile or replace the ledger."
        actions={<><Badge tone="muted">{DEMO}</Badge><Btn small onClick={() => go("Finance", "profit")}>Job profit</Btn></>} />
      <Grid min={190}>
        <Stat label="Open work (sell)" value={eur(openSell)} sub={open.length + " open jobs · " + DEMO} />
        <Stat label="Estimated margin" value={pct(margin(openSell, openCost))} sub={eur(openSell - openCost) + " gross profit across open jobs"} tone={marginTone(margin(openSell, openCost), floor)} />
        <Stat label="Deposits collected" value={eur(m.depositsPaid)} sub={eur(m.depositsAwaiting) + " deposits invoiced, not yet in"} onClick={() => go("Finance", "deposits")} />
        <Stat label="Balance due on completion" value={eur(m.balanceOnCompletion)} sub={eur(m.invoicedOpen) + " already invoiced and awaiting payment"} onClick={() => go("Finance", "deposits")} />
      </Grid>

      <Grid cols="minmax(0,1.45fr) minmax(0,1fr)">
        <Card title="Open work by stage" sub="Sell value against estimated cost, grouped by how close the money is">
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 6 }}>
            {byStage.map((g) => (
              <div key={g.id}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, fontSize: 12.5 }}>
                  <span style={{ flex: 1, color: "var(--body)" }}>{g.label} <span style={{ color: "var(--faint)" }}>· {g.n} jobs</span></span>
                  <span style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{eur(g.sell)}</span>
                  <span style={{ width: 64, textAlign: "right", color: g.n ? "var(--dim)" : "var(--faint)", fontVariantNumeric: "tabular-nums" }}>{g.n ? pct(margin(g.sell, g.cost)) : "-"}</span>
                </div>
                <div style={{ position: "relative", height: 12, marginTop: 7, borderRadius: 6, background: "var(--track)", overflow: "hidden" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: (openSell ? (g.sell / openSell) * 100 : 0) + "%", background: "var(--accent)", opacity: 0.85, borderRadius: 6 }} />
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: (openSell ? (g.cost / openSell) * 100 : 0) + "%", background: "var(--teal)", opacity: 0.7, borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 14 }}>
            <Legend items={[{ label: "Sell value", tone: "accent" }]} />
            <Legend items={[{ label: "Estimated cost", tone: "info" }]} />
          </div>
          <Source>{DEMO} Bar widths are shares of total open sell value.</Source>
        </Card>

        <Card title="Margin watch" sub={"Floor set at " + floor + "% (adjustable in Quote vs Actual; not a stated Signs ASAP policy)"}>
          {below.length === 0 ? <Note tone="ok">Every open job is at or above the floor.</Note> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {below.map((j) => (
                <div key={j.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", borderRadius: 12, background: "var(--bad-soft)" }}>
                  <JobChip id={j.id} />
                  <span style={{ flex: 1 }} />
                  <span style={{ fontSize: 13, color: "var(--bad)", fontVariantNumeric: "tabular-nums" }}>{pct(margin(j.price, j.cost))}</span>
                </div>
              ))}
            </div>
          )}
          {port && (
            <Note tone="info" style={{ marginTop: 12 }}>
              Simple print still carries the best margin: the Portmarnock hoarding closed at {pct(margin(port.price, port.cost))} on {eur(port.price)}. <span className="sa-click" style={{ color: "var(--teal)" }} onClick={() => go("Finance", "profit")}>Compare with LED work</span>
            </Note>
          )}
        </Card>
      </Grid>

      <Grid cols="minmax(0,1fr) minmax(0,1fr)">
        <Card title="Actual vs expected cost" sub="Jobs with recorded actuals, plus open jobs tracking against their estimate"
          right={<Btn small kind="quiet" onClick={() => go("Finance", "qva")}>Quote vs actual</Btn>}>
          <ActualVsExpected s={s} />
        </Card>
        <Card title="Forecast production capacity" sub="This week's planned hours by workstation against 37.5 h per person"
          right={<Btn small kind="quiet" onClick={() => go("Production", "capacity")}>Capacity planner</Btn>}>
          <div style={{ display: "flex", flexDirection: "column", gap: 13, marginTop: 4 }}>
            {loads.map((l) => (
              <div key={l.id}>
                <div style={{ display: "flex", fontSize: 12.5, gap: 8 }}>
                  <span style={{ flex: 1, color: "var(--body)" }}>{l.label}</span>
                  <span style={{ color: "var(--dim)", fontVariantNumeric: "tabular-nums" }}>{l.total.toFixed(1)} / {l.capacity} h</span>
                  <Badge tone={loadTone(l.pct)}>{Math.round(l.pct)}%</Badge>
                </div>
                <div style={{ marginTop: 6 }}><Meter value={l.total} max={l.capacity} tone={loadTone(l.pct)} over={l.pct > 100} /></div>
              </div>
            ))}
          </div>
          <Source>Manufacturing is the constraint, not fitting: 4 external crews are on call. Adding demand loads these four bars first.</Source>
        </Card>
      </Grid>
    </>
  );
}

function ActualVsExpected({ s }: { s: DemoState }) {
  const js = jobs(s);
  const port = js.find((j) => j.id === "JOB-26046")!;
  const wos = workOrders(s);
  const tracking = js.filter((j) => j.stage === "production").map((j) => {
    const jwos = wos.filter((w) => w.jobId === j.id);
    const done = jwos.filter((w) => w.col === "fit" || w.col === "qa").length;
    return { j, done, total: jwos.length };
  });
  const actualCost = port.actualCost ?? port.cost;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
      <div style={{ padding: "12px 14px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--surface-faint)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <JobChip id={port.id} />
          <span style={{ flex: 1 }} />
          <Badge tone="ok">Completed</Badge>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 12 }}>
          <MiniKV k="Expected cost" v={eur(port.cost)} />
          <MiniKV k="Actual cost" v={eur(actualCost)} tone={actualCost > port.cost ? "warn" : "ok"} />
          <MiniKV k="Actual margin" v={pct(margin(port.price, actualCost))} />
        </div>
        <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 10 }}>{(port.actualHours ?? port.plannedHours)} h on the job against {port.plannedHours} h planned. Still well above the floor.</div>
      </div>
      {tracking.map((t) => (
        <div key={t.j.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <JobChip id={t.j.id} />
          <span style={{ flex: 1, minWidth: 40 }}><Meter value={t.done} max={Math.max(1, t.total)} tone="info" /></span>
          <span style={{ fontSize: 12, color: "var(--dim)", whiteSpace: "nowrap" }}>{t.done}/{t.total} work orders past QA · est. {eur(t.j.cost)}</span>
        </div>
      ))}
      <Source>Actual costs come from the workshop package once synced (proposed). Open jobs show their estimate until then.</Source>
    </div>
  );
}

function MiniKV({ k, v, tone }: { k: string; v: string; tone?: Tone }) {
  return (
    <div>
      <div className="sa-label">{k}</div>
      <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4, color: tone === "warn" ? "var(--warn)" : tone === "bad" ? "var(--bad)" : "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{v}</div>
    </div>
  );
}

/* ── Job profit ─────────────────────────────────────────────────────────── */
function JobProfit({ s }: { s: DemoState }) {
  const js = jobs(s);
  const [sel, setSel] = useState("JOB-26046");
  const [filter, setFilter] = useState<"all" | "story" | "print" | "vehicle" | "led">("all");
  const j = js.find((x) => x.id === sel) || js[0];
  const split = costSplit(j, s);
  const floor = s.marginFloor;
  const rows = js.filter((x) => filter === "all" ? true : filter === "story" ? !!x.story : x.kind === filter);
  const compare = ["JOB-26046", "JOB-26042", "JOB-26043", "JOB-26045"].map((id) => js.find((x) => x.id === id)).filter(Boolean) as Job[];
  const perHour = (x: Job) => (x.plannedHours ? (x.price - x.cost) / x.plannedHours : 0);
  const totals = rows.reduce((a, x) => ({ p: a.p + x.price, c: a.c + x.cost }), { p: 0, c: 0 });
  return (
    <>
      <PageHead kicker="Finance & Margins" title="Job profit"
        sub="Where each job's cost goes, and why a straightforward printed hoarding can out-earn a bespoke LED sign per workshop hour."
        actions={<Badge tone="muted">{DEMO}</Badge>} />
      <Grid cols="minmax(0,1.1fr) minmax(0,1fr)">
        <Card title={j.title} sub={KIND_LABEL[j.kind] + " · " + (customer(j.customerId)?.name || "Customer")}
          right={<JobChip id={j.id} label="" />}>
          <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap", marginTop: 4 }}>
            <Donut size={136} thickness={18} parts={split.filter((p) => p.value > 0).map((p) => ({ value: p.value, tone: p.tone, label: p.label }))}
              center={<><div style={{ fontSize: 18, fontWeight: 600 }}>{pct(margin(j.price, j.cost))}</div><div style={{ fontSize: 10.5, color: "var(--faint)" }}>margin</div></>} />
            <div style={{ flex: "1 1 220px", minWidth: 0 }}>
              <Legend items={split.map((p) => ({ label: p.label, tone: p.tone, value: eur(p.value) }))} />
              <div style={{ display: "flex", gap: 10, marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)", fontSize: 13 }}>
                <span style={{ flex: 1, color: "var(--dim)" }}>Sell {eur(j.price)} · cost {eur(j.cost)}</span>
                <span style={{ color: "var(--ink)", fontWeight: 600 }}>{eur(j.price - j.cost)} profit</span>
              </div>
            </div>
          </div>
          <Source>
            {j.id === TENDER_WON.jobId ? "Split taken from the won tender's cost model on Tender Desk (materials, 26 h labour at €35, fitting, delivery)." : "Split is a demo assumption by job type, applied to the job's estimated cost. Real splits would come from the workshop package."}
          </Source>
        </Card>

        <Card title="Profit per planned workshop hour" sub="Gross profit divided by planned workshop hours: the number that matters when manufacturing is the bottleneck">
          <HBars fmt={(n) => eur(n) + "/h"} data={compare.map((x) => ({
            label: x.short, value: perHour(x), tone: x.kind === "print" ? "info" as Tone : "accent" as Tone,
            right: eur(perHour(x)) + "/h", onClick: () => setSel(x.id),
          }))} />
          <Note tone="info" style={{ marginTop: 14 }}>
            The Portmarnock hoarding earned {eur(perHour(compare[0]))} per workshop hour at {pct(margin(compare[0].price, compare[0].cost))}. Bespoke LED jobs make more money in total but tie up CNC and assembly for longer, so they need to be priced from a cost build-up, not a rate card.
          </Note>
        </Card>
      </Grid>

      <Card title="All jobs" sub="Click a row to see its cost split" right={
        <Seg size="sm" value={filter} onChange={setFilter} options={[
          { id: "all", label: "All" }, { id: "story", label: "Key jobs" }, { id: "print", label: "Print" }, { id: "vehicle", label: "Vehicle" }, { id: "led", label: "LED" },
        ]} />}>
        <Table<Job> rows={rows} onRow={(x) => setSel(x.id)} rowTone={(x) => (x.id === sel ? "accent" : undefined)}
          cols={[
            { key: "job", label: "Job", width: "2.2fr", render: (x) => <span style={{ minWidth: 0 }}><span className="sa-mono" style={{ color: "var(--faint)", fontSize: 11.5 }}>{x.id}</span><span style={{ display: "block", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{x.title}</span></span> },
            { key: "kind", label: "Type", width: "1.1fr", hideSm: true, render: (x) => <Badge tone={KIND_TONE[x.kind]}>{x.kind === "print" ? "Print" : x.kind === "vehicle" ? "Vehicle" : "LED"}</Badge> },
            { key: "price", label: "Sell", width: ".9fr", align: "right", render: (x) => <span className="sa-mono">{eur(x.price)}</span> },
            { key: "cost", label: "Cost", width: ".9fr", align: "right", hideSm: true, render: (x) => <span className="sa-mono">{eur(x.cost)}</span> },
            { key: "profit", label: "Profit", width: ".9fr", align: "right", render: (x) => <span className="sa-mono" style={{ color: "var(--ink)" }}>{eur(x.price - x.cost)}</span> },
            { key: "margin", label: "Margin", width: ".8fr", align: "right", render: (x) => <Badge tone={marginTone(margin(x.price, x.cost), floor)}>{pct(margin(x.price, x.cost))}</Badge> },
          ]}
          footer={<><span style={{ flex: 1 }}>{rows.length} jobs · {DEMO}</span><span className="sa-mono">{eur(totals.p)} sell · {eur(totals.p - totals.c)} profit · {pct(margin(totals.p, totals.c))}</span></>} />
        {filter === "all" || filter === "story" ? <Source>JOB-26044 is priced as 15 vans × €1,900 = {eur(15 * 1900)}. The €7,500 college tender value is call-supported; other prices and costs are illustrative.</Source> : null}
      </Card>
    </>
  );
}

/* ── Quote vs actual ────────────────────────────────────────────────────── */
function QuoteVsActual({ s, labourRate, setLabourRate }: { s: DemoState; labourRate: number; setLabourRate: (n: number) => void }) {
  const port = jobs(s).find((j) => j.id === "JOB-26046")!;
  const floor = s.marginFloor;
  const hs = HISTORY.map((h) => histActual(h, labourRate));
  const low = hs.filter((h) => h.actualMargin < floor);
  const actualCost = port.actualCost ?? port.cost;
  const actualHours = port.actualHours ?? port.plannedHours;
  const setFloor = (n: number) => { update(() => ({ marginFloor: Math.max(10, Math.min(70, n)) })); };
  return (
    <>
      <PageHead kicker="Finance & Margins" title="Quote vs actual"
        sub="Did the job cost what we said it would? Hours overrun at the labour rate below eat straight into margin."
        actions={
          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--dim)" }}>Margin floor <NumField label="Margin floor" value={floor} onChange={setFloor} suffix="%" width={78} /></span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--dim)" }}>Labour rate <NumField label="Labour rate" value={labourRate} onChange={setLabourRate} prefix="€" suffix="/h" width={96} /></span>
          </div>
        } />
      <Note tone="muted">Both thresholds are adjustable assumptions for the demo, not a stated Signs ASAP pricing policy.</Note>

      <Grid cols="minmax(0,1fr) minmax(0,1.3fr)">
        <Card title="Finished example: Portmarnock hoarding" sub={"Printed hoarding, about 48 ft × 4 ft, fitted " + (port.fitDate ? dayLabel(port.fitDate) : "recently")} right={<JobChip id={port.id} label="" />}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 4 }}>
            <div className="sa-kv"><div className="sa-label">Planned</div><div style={{ fontSize: 20, fontWeight: 600, marginTop: 6 }}>{port.plannedHours} h</div><div style={{ fontSize: 12, color: "var(--dim)", marginTop: 3 }}>{eur(port.cost)} cost · {pct(margin(port.price, port.cost))}</div></div>
            <div className="sa-kv"><div className="sa-label">Actual</div><div style={{ fontSize: 20, fontWeight: 600, marginTop: 6, color: "var(--warn)" }}>{actualHours} h</div><div style={{ fontSize: 12, color: "var(--dim)", marginTop: 3 }}>{eur(actualCost)} cost · {pct(margin(port.price, actualCost))}</div></div>
          </div>
          <div style={{ marginTop: 16 }}>
            <Bars height={90} fmt={(n) => n + " h"} data={[{ label: "Quoted hours", value: port.plannedHours, tone: "info" }, { label: "Actual hours", value: actualHours, tone: "warn" }]} />
          </div>
          <Note tone={margin(port.price, actualCost) < floor ? "bad" : "ok"} style={{ marginTop: 6 }}>
            {margin(port.price, actualCost) < floor
              ? "We priced this too low: actual margin is below the " + floor + "% floor."
              : "Ran " + (actualHours - port.plannedHours) + " h over and still closed at " + pct(margin(port.price, actualCost)) + ". Simple print absorbs small overruns."}
          </Note>
        </Card>

        <Card title="Past jobs: quoted vs actual hours" sub={HISTORY_NOTE}
          right={<Badge tone={low.length ? "bad" : "ok"}>{low.length} below floor</Badge>}>
          <Table rows={hs} dense rowTone={(h) => (h.actualMargin < floor ? "bad" : undefined)}
            cols={[
              { key: "label", label: "Job", width: "2fr", render: (h) => <span style={{ minWidth: 0 }}><span style={{ display: "block", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.label}</span><span style={{ fontSize: 11, color: "var(--faint)" }}>{h.id} · {h.when} · {KIND_SHORT[h.kind]}</span></span> },
              { key: "hrs", label: "Hours", width: ".9fr", align: "right", render: (h) => <span className="sa-mono" style={{ color: h.overrun > 2 ? "var(--warn)" : "var(--body)" }}>{h.quotedHours} → {h.actualHours}</span> },
              { key: "qm", label: "Quoted", width: ".7fr", align: "right", hideSm: true, render: (h) => <span className="sa-mono">{pct(h.quotedMargin)}</span> },
              { key: "am", label: "Actual", width: ".8fr", align: "right", render: (h) => <Badge tone={marginTone(h.actualMargin, floor)}>{pct(h.actualMargin)}</Badge> },
              { key: "flag", label: "", width: "1.2fr", hideSm: true, render: (h) => (h.actualMargin < floor ? <span style={{ fontSize: 11.5, color: "var(--bad)" }}>We priced this too low</span> : <span style={{ fontSize: 11.5, color: "var(--faint)" }}>On target</span>) },
            ]} />
          <Source>Actual cost = quoted cost + (actual hours - quoted hours) × {eur(labourRate)}/h. Change the labour rate or floor above and every row recalculates.</Source>
        </Card>
      </Grid>

      {low.length > 0 && (
        <Card title="Pattern behind the low ones" sub="Where the overruns cluster">
          <Grid min={220}>
            {KINDS.map((k) => {
              const kh = hs.filter((h) => h.kind === k);
              const over = kh.reduce((a, h) => a + Math.max(0, h.overrun), 0);
              const lows = kh.filter((h) => h.actualMargin < floor).length;
              return (
                <div key={k} className="sa-kv">
                  <div className="sa-label">{KIND_SHORT[k]}</div>
                  <div style={{ fontSize: 22, fontWeight: 600, marginTop: 6, color: lows ? "var(--bad)" : "var(--ink)" }}>{lows} of {kh.length}</div>
                  <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 4 }}>below floor · {over} h overrun in total</div>
                </div>
              );
            })}
          </Grid>
          <Source>Bespoke LED and fabricated work overruns most because every job is different. That is where a cost build-up (BOM + hours) beats a per-unit price.</Source>
        </Card>
      )}
    </>
  );
}

/* ── Deposits & balances ────────────────────────────────────────────────── */
function Deposits({ s }: { s: DemoState }) {
  const js = jobs(s).filter((j) => j.stage !== "enquiry");
  const ps = payments(s).slice().sort((a, b) => b.date.getTime() - a.date.getTime());
  const m = moneyTotals(s);
  const cuApproved = isApproved("PV-43-3", s);
  const cuDeposit = payStatusOf("PAY-503", s);
  const recPct = (j: Job) => s.depositOverride[j.id] ?? (j.depositPct === 100 || j.depositPct === 0 ? j.depositPct : recommendedDeposit(j));
  const setRec = (j: Job, n: number) => {
    update((st) => ({ depositOverride: { ...st.depositOverride, [j.id]: n } }));
    log("human", "Managing Director", "Set deposit recommendation for " + j.short + " to " + n + "%.", j.id, "payment", "info");
  };
  const readiness = (j: Job) => {
    const mf = moneyFor(j, s);
    const need = (recPct(j) / 100) * j.price;
    if (j.depositPct === 100) return { tone: "ok" as Tone, label: "Prepaid in full" };
    if (j.depositPct === 0) return { tone: "info" as Tone, label: "Account: invoiced on collection" };
    if (mf.paid >= need - 1) return { tone: "ok" as Tone, label: "Clear to buy materials" };
    if (mf.invoiced > 0) return { tone: "warn" as Tone, label: "Deposit invoiced: hold purchasing" };
    return { tone: "muted" as Tone, label: "Deposit not yet requested" };
  };
  return (
    <>
      <PageHead kicker="Finance & Margins" title="Deposits & balances"
        sub="Usually 30-50% up front and the balance on completion, with exceptions. The recommendation is per job; the owner decides."
        actions={<Btn small kind="teal" onClick={() => toast("Mock: sync preview only. Nothing is sent to the accounts package.")}>Preview accounts sync</Btn>} />
      <Grid min={190}>
        <Stat label="Collected to date" value={eur(m.collected)} sub="Paid lines in the demo ledger" />
        <Stat label="Deposits awaiting" value={eur(m.depositsAwaiting)} sub="Invoiced, not yet received" tone={m.depositsAwaiting ? "warn" : undefined} />
        <Stat label="Invoiced balances" value={eur(m.invoicedOpen)} sub="All invoiced lines awaiting payment" />
        <Stat label="Due on completion" value={eur(m.balanceOnCompletion)} sub="Not yet invoiced, on open jobs" />
      </Grid>

      <Grid cols="minmax(0,1fr) minmax(0,1fr)">
        <Card title="Swords Accountancy: paid 100% upfront" tone="ok" sub="An explicit exception, not the standard deposit rule" right={<JobChip id="JOB-26042" label="" />}>
          <div style={{ fontSize: 13, color: "var(--body)", lineHeight: 1.6 }}>
            The customer paid the full rebrand up front. The actual amount was not disclosed on the call; the demo shows the job value of {eur(jobs(s).find((j) => j.id === "JOB-26042")?.price || 0)}. Nothing further to collect, so Aisling only needs to reconcile the prepayment against the job.
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <Badge tone="ok" dot>Prepayment recorded</Badge><Badge tone="muted">Exception noted on the job</Badge>
          </div>
        </Card>
        <Card title="Celbridge CU: deposit gates the purchase" tone={cuDeposit === "paid" ? "ok" : "warn"} sub="LED modules are in stock; the solid aluminium tray is only ordered once proof v3 is signed and the deposit lands" right={<JobChip id="JOB-26043" label="" />}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <GateRow ok={cuApproved} label="Proof v3 approved" />
            <GateRow ok={cuDeposit === "paid"} label={"40% deposit received (" + eur(ps.find((p) => p.id === "PAY-503")?.amount || 0) + ")"} />
            <GateRow ok={cuApproved && cuDeposit === "paid"} label="Order solid aluminium sheet" />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {cuDeposit !== "paid" && <Btn small kind="primary" onClick={() => recordPayment("PAY-503")}>Record deposit received</Btn>}
            {!cuApproved && <Btn small onClick={() => go("Jobs", "proofs")}>Open proof v3</Btn>}
          </div>
        </Card>
      </Grid>

      <Card title="Deposit readiness by job" sub="Recommended deposit by job type (30% print, 40% vehicle, 50% custom LED), changeable per job">
        <Table<Job> rows={js}
          cols={[
            { key: "job", label: "Job", width: "2fr", render: (j) => <JobChip id={j.id} /> },
            { key: "value", label: "Value", width: ".8fr", align: "right", render: (j) => <span className="sa-mono">{eur(j.price)}</span> },
            { key: "rec", label: "Deposit", width: "1fr", render: (j) => (j.depositPct === 100 || j.depositPct === 0)
              ? <Badge tone={j.depositPct === 100 ? "ok" : "info"}>{j.depositPct === 100 ? "100% (exception)" : "None (account)"}</Badge>
              : (
                <select className="sa-input" aria-label={"Deposit for " + j.short} value={recPct(j)} onClick={(e) => e.stopPropagation()} onChange={(e) => setRec(j, parseInt(e.target.value, 10))}
                  style={{ height: 30, padding: "0 8px", width: 82, fontSize: 12.5 }}>
                  {[30, 40, 50].map((n) => <option key={n} value={n}>{n}%</option>)}
                </select>
              ) },
            { key: "paid", label: "Paid", width: ".8fr", align: "right", hideSm: true, render: (j) => <span className="sa-mono">{eur(moneyFor(j, s).paid)}</span> },
            { key: "ready", label: "Before purchase", width: "1.5fr", render: (j) => { const r = readiness(j); return <Badge tone={r.tone} dot>{r.label}</Badge>; } },
            { key: "bal", label: "Balance", width: ".9fr", align: "right", hideSm: true, render: (j) => { const mf = moneyFor(j, s); return <span className="sa-mono" style={{ color: "var(--dim)" }}>{eur(mf.remaining + mf.invoiced)}</span>; } },
          ]} />
      </Card>

      <Card title="Payments ledger (mock)" sub={LEDGER_NOTE} right={<Badge tone="muted">Proposed sync · not connected</Badge>}>
        <Table rows={ps}
          cols={[
            { key: "id", label: "Ref", width: ".8fr", render: (p) => <span className="sa-mono" style={{ color: "var(--faint)" }}>{p.id}</span> },
            { key: "job", label: "Job", width: "1.8fr", render: (p) => <JobChip id={p.jobId} /> },
            { key: "kind", label: "Type", width: "1fr", hideSm: true, render: (p) => <span>{p.kind}</span> },
            { key: "amt", label: "Amount", width: ".9fr", align: "right", render: (p) => <span className="sa-mono" style={{ color: "var(--ink)" }}>{eur(p.amount)}</span> },
            { key: "date", label: "Date", width: ".9fr", hideSm: true, render: (p) => <span>{dayLabel(p.date)}</span> },
            { key: "st", label: "Status", width: "1.2fr", render: (p) => p.status === "paid" ? <Badge tone="ok">Paid</Badge>
              : <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}><Badge tone="warn">{p.status === "invoiced" ? "Invoiced" : p.status}</Badge><Btn small kind="quiet" onClick={() => recordPayment(p.id)}>Record</Btn></span> },
          ]} />
        <Source>Notes on each line: {ps.filter((p) => p.note).length} lines carry context, for example "{ps.find((p) => p.id === "PAY-502")?.note}".</Source>
      </Card>
    </>
  );
}

function GateRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
      <span style={{ width: 18, height: 18, borderRadius: 9, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", background: ok ? "var(--ok-soft)" : "var(--track)", color: ok ? "var(--ok)" : "var(--faint)" }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">{ok ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : <path d="M8 12h8" />}</svg>
      </span>
      <span style={{ color: ok ? "var(--ink)" : "var(--dim)" }}>{label}</span>
    </div>
  );
}

/* ── Price intelligence ─────────────────────────────────────────────────── */
function PriceIntel({ s, labourRate }: { s: DemoState; labourRate: number }) {
  const js = jobs(s);
  const floor = s.marginFloor;
  const stats = KINDS.map((k) => {
    const kh = kindHistory(k, labourRate);
    const cur = js.filter((j) => j.kind === k);
    return { k, ...kh, curMedian: median(cur.map((j) => margin(j.price, j.cost))), n: cur.length };
  });
  const open = quotes(s).filter((q) => q.job && (q.job.stage === "quoting" || q.job.stage === "enquiry" || q.job.stage === "survey"));
  const recs = open.map((q) => {
    const st = stats.find((x) => x.k === q.job.kind)!;
    const m = margin(q.price, q.cost);
    // Below the floor: strong flag. Well below your usual for this type: soft flag. Otherwise in line.
    const status: "floor" | "usual" | "ok" = m < floor ? "floor" : m < st.quotedMedian - 5 ? "usual" : "ok";
    const target = status === "floor" ? Math.max(floor, st.quotedMedian) : status === "usual" ? st.quotedMedian - 5 : m;
    return { q, m, st, target, status, suggested: priceForMargin(q.cost, target), below: status === "floor" && m < st.quotedMedian };
  });
  const rush = recs.find((r) => r.q.jobId === "JOB-26050");
  const comparable = HISTORY.find((h) => h.id === "H-10");
  return (
    <>
      <PageHead kicker="Finance & Margins" title="Price intelligence"
        sub="Your own past jobs as the reference. Printed boards and wraps follow predictable unit economics; bespoke LED work needs a cost build-up checked against what similar jobs actually made."
        actions={<Badge tone="muted">Illustrative history</Badge>} />

      {rush && rush.below && (
        <Card tone="warn" title="Rush Physio lightbox is under-priced against your own LED history" right={<JobChip id="JOB-26050" label="" />}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
            <MiniKV k="Quoted" v={eur(rush.q.price) + " · " + pct(rush.m)} tone="warn" />
            <MiniKV k="Past median LED margin" v={pct(rush.st.quotedMedian)} />
            <MiniKV k="Realised after overruns" v={pct(rush.st.actualMedian)} />
            <MiniKV k="Suggested" v={eur(rush.suggested) + " · " + pct(margin(rush.suggested, rush.q.cost))} />
          </div>
          <div style={{ fontSize: 13, color: "var(--body)", lineHeight: 1.6, marginTop: 12 }}>
            Your LED fabrication quote for Rush Physio is below your own past median LED margin. {comparable ? "The closest past job, " + comparable.label + " (" + comparable.id + "), sold for " + eur(comparable.price) + " and ran " + (comparable.actualHours - comparable.quotedHours) + " h over. " : ""}Lightboxes rarely come in under their hours.
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            <Btn kind="primary" small onClick={() => setJobPrice("JOB-26050", rush.suggested, "Applied suggested price " + eur(rush.suggested) + " to Rush Physio lightbox quote (was " + eur(rush.q.price) + ").")}>Apply {eur(rush.suggested)}</Btn>
            <Btn small onClick={() => go("Sales", "builder")}>Rebuild in Quote Builder</Btn>
            <Btn small kind="quiet" onClick={() => toast("Kept at " + eur(rush.q.price) + ". The owner sets the price.")}>Keep my price</Btn>
          </div>
          <Source>Suggestion uses the higher of your margin floor ({floor}%) and the past median quoted LED margin. It is a reference, not a guaranteed result.</Source>
        </Card>
      )}

      <Grid cols="minmax(0,1.2fr) minmax(0,1fr)">
        <Card title="Margin by product type" sub="Median quoted margin, median realised after hour overruns, and today's jobs">
          <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 6 }}>
            {stats.map((st) => (
              <div key={st.k}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: "var(--" + (KIND_TONE[st.k] === "info" ? "teal" : KIND_TONE[st.k] === "ok" ? "ok" : "accent") + ")" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{KIND_SHORT[st.k]}</span>
                  <span style={{ fontSize: 11.5, color: "var(--faint)" }}>{st.hs.length} past · {st.n} current</span>
                </div>
                <HBars max={70} marker={floor} markerLabel={"Floor " + floor + "%"} fmt={(n) => pct(n)} data={[
                  { label: "Past, as quoted", value: st.quotedMedian, tone: "muted" },
                  { label: "Past, realised", value: st.actualMedian, tone: st.actualMedian < floor ? "bad" : "info" },
                  { label: "Current jobs", value: st.curMedian, tone: KIND_TONE[st.k] },
                ]} />
              </div>
            ))}
          </div>
          <Source>{HISTORY_NOTE} Marker shows your {floor}% floor. No industry averages are used.</Source>
        </Card>

        <Card title="Open quotes vs your own reference" sub="Each quote compared with the median of past jobs of the same type">
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {recs.map((r) => (
              <div key={r.q.id} style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid var(--border)", background: r.status === "floor" ? "var(--warn-soft)" : "var(--surface-faint)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <JobChip id={r.q.jobId} />
                  <span style={{ flex: 1 }} />
                  <Badge tone={r.status === "floor" ? "warn" : r.status === "usual" ? "info" : "ok"}>{pct(r.m)}</Badge>
                </div>
                <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 7 }}>
                  {r.q.id} · {eur(r.q.price)} · {KIND_SHORT[r.q.job.kind].toLowerCase()} usually quoted at {pct(r.st.quotedMedian)}
                  {r.status === "floor" ? " · below your " + floor + "% floor, reference " + eur(r.suggested)
                    : r.status === "usual" ? " · on the low side, reference " + eur(r.suggested) : " · in line"}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Grid>

      <Card title="Past quotes and what they made" sub={HISTORY_NOTE}>
        <Bars height={120} fmt={(n) => Math.round(n) + "%"} data={HISTORY.map((h) => {
          const a = histActual(h, labourRate);
          return { label: h.id, value: Math.max(0, a.actualMargin), tone: a.actualMargin < floor ? "bad" : KIND_TONE[h.kind] };
        })} />
        <Label style={{ marginTop: 4 }}>Realised margin per past job at {eur(labourRate)}/h labour · red is below the {floor}% floor</Label>
      </Card>
    </>
  );
}
