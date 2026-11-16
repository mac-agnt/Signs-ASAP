/* Records: the operating memory of Signs ASAP. Client tabs only (Customers, Jobs,
   Staff, Suppliers, Materials, Assets). Ontology, Files and Contacts stay on the
   stock Pulse views. Every record links to the records around it. */

import { useState, type ReactNode } from "react";
import {
  useDemo, jobs, customer, fitter, supplier, approvedProof, latestProof, payments, quotes,
  materials, workOrders, installs, tasks, surveyFor, openJob, go, eur, pct, margin, stageLabel, stageTone,
} from "../model";
import {
  CUSTOMERS, REFERENCE_ACCOUNTS, PEOPLE, STAFF_NOTE, FITTERS, FITTER_NOTE, SUPPLIERS, COMPANY, STATIONS,
  STATION_BACKGROUND, KIND_LABEL, type CustomerCat, type Job, type MatStatus, type Station,
} from "../data";
import { bd, dayLabel, relDay, isOverdue } from "../dates";
import {
  Page, PageHead, Grid, Card, Badge, Btn, Avatar, Who, JobChip, Stat, Meter, Seg, Empty, Note, KV, Table, Source,
  type Tone, type Col,
} from "../ui";

const CATS: CustomerCat[] = ["Commercial repeat", "Franchise rollout", "Small business", "Housing & development", "Public sector & education"];

export default function SignsRecords({ section }: { v: any; section: string }) {
  useDemo();
  switch (section) {
    case "customers": return <Customers />;
    case "jobs": return <JobsRecords />;
    case "staff": return <Staff />;
    case "suppliers": return <Suppliers />;
    case "materials": return <Materials />;
    case "assets": return <Assets />;
    default: return <Page><Empty title="Unknown record type" /></Page>;
  }
}

/* ── Relationship chain: Customer → Job → Survey → Proof → Materials → WO → Crew → Payment ── */
export function Chain({ jobId }: { jobId: string }) {
  const j = jobs().find((x) => x.id === jobId);
  if (!j) return null;
  const c = customer(j.customerId);
  const sv = surveyFor(j.id);
  const ap = approvedProof(j.id);
  const lp = latestProof(j.id);
  const mats = materials().filter((m) => m.jobId === j.id);
  const wos = workOrders().filter((w) => w.jobId === j.id);
  const ins = installs().filter((i) => i.jobId === j.id);
  const pays = payments().filter((p) => p.jobId === j.id);
  const paid = pays.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0);
  const nodes: { k: string; v: string; tone: Tone; go?: () => void }[] = [
    { k: "Customer", v: c ? c.name : "New customer", tone: "muted" },
    { k: "Job", v: j.id, tone: "accent", go: () => openJob(j.id) },
    { k: "Survey", v: sv ? sv.id + (sv.status === "booked" ? " (booked)" : "") : j.needsSurvey ? "Due" : "Not needed", tone: sv ? "ok" : j.needsSurvey ? "warn" : "muted", go: () => go("Jobs", "surveys") },
    { k: "Proof", v: ap ? "v" + ap.v + " approved" : lp ? "v" + lp.v + " " + (lp.status === "awaiting" ? "awaiting" : lp.status) : "Not started", tone: ap ? "ok" : lp ? "warn" : "muted", go: () => go("Jobs", "proofs") },
    { k: "Materials", v: mats.length ? mats.length + " line" + (mats.length > 1 ? "s" : "") + (mats.some((m) => m.status === "Short" || m.status === "Awaiting ETA") ? ", held" : "") : "From stock", tone: mats.some((m) => m.status === "Short" || m.status === "Awaiting ETA") ? "warn" : "muted", go: () => go("Production", "materials") },
    { k: "Work order", v: wos.length ? wos.map((w) => w.id).join(", ") : "Not raised", tone: wos.some((w) => w.locked) ? "bad" : wos.length ? "info" : "muted", go: () => go("Production", "orders") },
    { k: "Install crew", v: ins.length ? fitter(ins[0].fitterId).name : j.kind === "vehicle" ? "Applied in workshop" : "Not booked", tone: ins.some((i) => i.status === "booked" || i.status === "done") ? "ok" : ins.length ? "warn" : "muted", go: () => go("Installations", "calendar") },
    { k: "Payment", v: eur(paid) + " of " + eur(j.price), tone: paid >= j.price ? "ok" : paid > 0 ? "info" : "warn", go: () => go("Finance", "deposits") },
  ];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "stretch", gap: 6 }}>
      {nodes.map((n, i) => (
        <div key={n.k} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button type="button" onClick={n.go} disabled={!n.go} className="sa-chainnode"
            style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3, padding: "8px 11px", borderRadius: 12, border: "1px solid var(--border)",
              background: "var(--surface-faint)", color: "var(--ink)", font: "inherit", cursor: n.go ? "pointer" : "default", textAlign: "left", maxWidth: 190 }}>
            <span className="sa-label" style={{ fontSize: 9.5 }}>{n.k}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, minWidth: 0 }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, flex: "none", background: "var(--" + (n.tone === "info" ? "teal" : n.tone === "muted" ? "faint" : n.tone) + ")" }} />
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.v}</span>
            </span>
          </button>
          {i < nodes.length - 1 && <span aria-hidden style={{ color: "var(--faint)", fontSize: 12 }}>›</span>}
        </div>
      ))}
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (s: string) => void; placeholder: string }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, height: 36, padding: "0 13px", minWidth: 220, borderRadius: 999, border: "1px solid var(--border)", background: "var(--surface-faint)" }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="1.9" strokeLinecap="round"><path d="m21 21-4.3-4.3 M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0" /></svg>
      <input aria-label={placeholder} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: "none", color: "var(--ink)", font: "inherit", fontSize: 13 }} />
    </label>
  );
}

const stageBadge = (j: Job) => <Badge tone={stageTone(j.stage)} dot>{stageLabel(j.stage)}</Badge>;

/* ── Customers ──────────────────────────────────────────────────────────── */
function Customers() {
  const all = jobs();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState("c-swacc");
  const [selJob, setSelJob] = useState<string | null>(null);
  const list = CUSTOMERS.filter((c) => !q || (c.name + " " + c.town + " " + c.cat).toLowerCase().indexOf(q.toLowerCase()) > -1);
  const stats = (cid: string) => {
    const js = all.filter((j) => j.customerId === cid);
    return { js, value: js.reduce((a, j) => a + j.price, 0), open: js.filter((j) => j.stage !== "completed").length };
  };
  const repeatCount = CUSTOMERS.filter((c) => c.repeat).length;
  const c = CUSTOMERS.find((x) => x.id === sel) || CUSTOMERS[0];
  const cs = stats(c.id);
  const qs = quotes().filter((x) => cs.js.some((j) => j.id === x.jobId));
  const arts = cs.js.map((j) => ({ j, p: approvedProof(j.id) || latestProof(j.id) })).filter((x) => x.p);
  const pays = payments().filter((p) => cs.js.some((j) => j.id === p.jobId));
  const chainJob = selJob && cs.js.some((j) => j.id === selJob) ? selJob : cs.js[0]?.id;
  return (
    <Page>
      <PageHead kicker="Records" title="Customers"
        sub={"Every account, what they've ordered and where each job is. " + repeatCount + " of " + CUSTOMERS.length + " demo customers are repeat or referred accounts."}
        actions={<SearchBox value={q} onChange={setQ} placeholder="Search customers" />} />
      <Grid min={170}>
        {CATS.map((cat) => {
          const ids = CUSTOMERS.filter((x) => x.cat === cat).map((x) => x.id);
          const v = all.filter((j) => ids.indexOf(j.customerId) > -1).reduce((a, j) => a + j.price, 0);
          return <Stat key={cat} label={cat} value={ids.length} sub={eur(v) + " in demo jobs"} />;
        })}
      </Grid>
      <Grid cols="repeat(auto-fit,minmax(380px,1fr))" gap={16} style={{ alignItems: "start" }}>
        <Card title="Accounts by category" sub="Select an account to see its jobs, quotes, artwork and payments." pad={false}>
          <div style={{ padding: "0 10px 12px" }}>
            {CATS.map((cat) => {
              const rows = list.filter((x) => x.cat === cat);
              if (!rows.length) return null;
              return (
                <div key={cat} style={{ marginTop: 8 }}>
                  <div className="sa-label" style={{ padding: "8px 10px 6px" }}>{cat} · {rows.length}</div>
                  {rows.map((x) => {
                    const st = stats(x.id);
                    const on = x.id === c.id;
                    return (
                      <div key={x.id} className="sa-click-row" onClick={() => { setSel(x.id); setSelJob(null); }}
                        style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 10, alignItems: "center", padding: "10px 10px", borderRadius: 12,
                          background: on ? "var(--surface-2)" : undefined, boxShadow: on ? "inset 2px 0 0 var(--accent)" : undefined }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{x.name}</div>
                          <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 2 }}>{x.town} · {x.source} · since {x.since}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {x.repeat && <Badge tone="info">Repeat</Badge>}
                          <span style={{ fontSize: 12, color: "var(--body)", fontVariantNumeric: "tabular-nums", minWidth: 64, textAlign: "right" }}>{st.js.length ? eur(st.value) : "No jobs"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
            {!list.length && <Empty title="No customers match" sub="Search matches name, town and category." />}
          </div>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <Card title={c.name} sub={c.cat + " · " + c.town}
            right={<>{c.repeat ? <Badge tone="info">Repeat account</Badge> : <Badge>New account</Badge>}<Badge>Illustrative</Badge></>}>
            <Grid min={140} gap={10}>
              <KV k="Contact" v={c.contactRole} />
              <KV k="Source" v={c.source} />
              <KV k="Customer since" v={String(c.since)} />
              <KV k="Demo job value" v={eur(cs.value)} mono />
            </Grid>
            {c.note && <Note style={{ marginTop: 12 }}>{c.note}</Note>}
            <div className="sa-label" style={{ marginTop: 16, marginBottom: 8 }}>Jobs</div>
            {cs.js.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {cs.js.map((j) => (
                  <div key={j.id} className="sa-click-row" onClick={() => setSelJob(j.id)}
                    style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "8px 10px", borderRadius: 12, border: "1px solid " + (j.id === chainJob ? "var(--accent-line)" : "var(--border)") }}>
                    <JobChip id={j.id} />
                    <span style={{ flex: 1 }} />
                    {stageBadge(j)}
                    <span style={{ fontSize: 12.5, fontVariantNumeric: "tabular-nums" }}>{eur(j.price)}</span>
                  </div>
                ))}
              </div>
            ) : <div style={{ fontSize: 12.5, color: "var(--dim)" }}>No jobs on record in this demo.</div>}
            {chainJob && (
              <>
                <div className="sa-label" style={{ marginTop: 16, marginBottom: 8 }}>How {chainJob} connects</div>
                <Chain jobId={chainJob} />
              </>
            )}
          </Card>
          <Grid cols="repeat(auto-fit,minmax(240px,1fr))" gap={16}>
            <Card title="Quotes" sub={qs.length + " on record"}>
              {qs.length ? qs.map((x) => (
                <div key={x.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderTop: "1px solid var(--border)", fontSize: 12.5 }}>
                  <span className="sa-mono" style={{ color: "var(--ink)" }}>{x.id}</span>
                  <Badge tone={x.status === "accepted" ? "ok" : x.status === "sent" ? "info" : "warn"}>{x.status === "awaiting-owner" ? "Awaiting owner" : x.status[0].toUpperCase() + x.status.slice(1)}</Badge>
                  <span style={{ flex: 1 }} />
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>{eur(x.price)}</span>
                </div>
              )) : <div style={{ fontSize: 12.5, color: "var(--dim)" }}>None yet.</div>}
            </Card>
            <Card title="Artwork references" sub="Approved or latest proof per job">
              {arts.length ? arts.map(({ j, p }) => (
                <div key={j.id} className="sa-click-row" onClick={() => go("Jobs", "proofs")} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 4px", borderTop: "1px solid var(--border)", fontSize: 12.5 }}>
                  <span style={{ display: "flex", flex: "none" }}>{p!.swatch.map((s) => <span key={s} style={{ width: 12, height: 18, background: s, borderRadius: 3, marginRight: 2 }} />)}</span>
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.short} v{p!.v}</span>
                  <Badge tone={p!.status === "approved" ? "ok" : "warn"}>{p!.status === "approved" ? "Approved" : "Awaiting"}</Badge>
                </div>
              )) : <div style={{ fontSize: 12.5, color: "var(--dim)" }}>No artwork yet.</div>}
            </Card>
          </Grid>
          <Card title="Payments" sub="Illustrative mock ledger">
            {pays.length ? (
              <Table dense rows={pays} cols={[
                { key: "id", label: "Ref", width: "90px", render: (p) => <span className="sa-mono">{p.id}</span> },
                { key: "kind", label: "Type", width: "1fr", render: (p) => p.kind },
                { key: "job", label: "Job", width: "90px", hideSm: true, render: (p) => <span className="sa-mono">{p.jobId}</span> },
                { key: "amt", label: "Amount", width: "90px", align: "right", render: (p) => eur(p.amount) },
                { key: "st", label: "Status", width: "96px", render: (p) => <Badge tone={p.status === "paid" ? "ok" : "warn"}>{p.status === "paid" ? "Paid" : "Invoiced"}</Badge> },
              ]} />
            ) : <div style={{ fontSize: 12.5, color: "var(--dim)" }}>No payments recorded.</div>}
          </Card>
        </div>
      </Grid>
      <Card title="Public reference accounts" sub="Names shown publicly on signsasap.ie. Profiles describe the kind of work only: no orders, invoices or values are implied.">
        <Grid min={220} gap={10}>
          {REFERENCE_ACCOUNTS.map((r) => (
            <div key={r.id} style={{ padding: "13px 14px", borderRadius: 14, border: "1px dashed var(--border-strong)", background: "var(--surface-faint)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>{r.name}</span>
                <Badge>Reference</Badge>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 4 }}>{r.cat}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 10 }}>{r.kinds.map((k) => <Badge key={k} tone="info">{k}</Badge>)}</div>
              <div style={{ fontSize: 12, color: "var(--body)", marginTop: 10, lineHeight: 1.5 }}>{r.prefs}</div>
              <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 6 }}>{r.note}</div>
            </div>
          ))}
        </Grid>
      </Card>
    </Page>
  );
}

/* ── Jobs ───────────────────────────────────────────────────────────────── */
function JobsRecords() {
  const all = jobs();
  const [f, setF] = useState<"all" | "open" | "completed">("all");
  const [k, setK] = useState<"all" | "print" | "vehicle" | "led">("all");
  const [exp, setExp] = useState<string | null>("JOB-26043");
  const rows = all.filter((j) => (f === "all" || (f === "open" ? j.stage !== "completed" : j.stage === "completed")) && (k === "all" || j.kind === k));
  const value = rows.reduce((a, j) => a + j.price, 0);
  const cost = rows.reduce((a, j) => a + j.cost, 0);
  const cols: Col<Job>[] = [
    { key: "id", label: "Job", width: "minmax(220px,2fr)", render: (j) => (
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="sa-mono" style={{ color: "var(--faint)", fontSize: 11.5 }}>{j.id}</span>
          {j.story && <Badge tone="accent">Story</Badge>}
        </div>
        <div style={{ fontSize: 13, color: "var(--ink)", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{j.title}</div>
      </div>) },
    { key: "cust", label: "Customer", width: "minmax(140px,1.2fr)", hideSm: true, render: (j) => <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{customer(j.customerId)?.name || "New customer"}</span> },
    { key: "kind", label: "Type", width: "minmax(120px,1fr)", hideSm: true, render: (j) => <span style={{ fontSize: 12 }}>{KIND_LABEL[j.kind]}</span> },
    { key: "stage", label: "Stage", width: "136px", render: (j) => stageBadge(j) },
    { key: "owner", label: "Owner", width: "150px", hideSm: true, render: (j) => <Who id={j.ownerId} /> },
    { key: "price", label: "Price", width: "84px", align: "right", render: (j) => <span style={{ fontVariantNumeric: "tabular-nums" }}>{eur(j.price)}</span> },
    { key: "m", label: "Margin", width: "70px", align: "right", hideSm: true, render: (j) => <span style={{ fontVariantNumeric: "tabular-nums", color: margin(j.price, j.cost) < 38 ? "var(--warn)" : "var(--body)" }}>{pct(margin(j.price, j.cost))}</span> },
    { key: "due", label: "Due", width: "92px", hideSm: true, render: (j) => <span style={{ color: j.stage !== "completed" && isOverdue(j.due) ? "var(--bad)" : "var(--dim)", fontSize: 12 }}>{relDay(j.due)}</span> },
    { key: "x", label: "", width: "88px", align: "right", render: (j) => <Btn small kind="quiet" onClick={() => setExp(exp === j.id ? null : j.id)}>{exp === j.id ? "Hide links" : "Links"}</Btn> },
  ];
  const ej = exp ? all.find((j) => j.id === exp) : undefined;
  return (
    <Page>
      <PageHead kicker="Records" title="Jobs"
        sub="Every job as a record. Open one for the full story, or show its links to see how the customer, survey, proof, materials, work orders, crew and payments join up."
        actions={<>
          <Seg value={f} onChange={setF} size="sm" options={[{ id: "all", label: "All " + all.length }, { id: "open", label: "Open " + all.filter((j) => j.stage !== "completed").length }, { id: "completed", label: "Completed " + all.filter((j) => j.stage === "completed").length }]} />
          <Seg value={k} onChange={setK} size="sm" options={[{ id: "all", label: "All types" }, { id: "print", label: "Print" }, { id: "vehicle", label: "Vehicle" }, { id: "led", label: "LED" }]} />
        </>} />
      {ej && (
        <Card title={<span>Links for <span className="sa-mono">{ej.id}</span> · {ej.short}</span>} right={<Btn small kind="primary" onClick={() => openJob(ej.id)}>Open job</Btn>}>
          <Chain jobId={ej.id} />
        </Card>
      )}
      <Table rows={rows} cols={cols} onRow={(j) => openJob(j.id)} rowTone={(j) => (j.blocker ? "warn" : undefined)}
        footer={<><span style={{ flex: 1 }}>{rows.length} jobs · {eur(value)} demo value · {pct(margin(value, cost))} blended margin</span><span>Illustrative prices except the €7,500 college tender</span></>} />
    </Page>
  );
}

/* ── Staff ──────────────────────────────────────────────────────────────── */
function stationLoad(st: Station) {
  const wos = workOrders().filter((w) => w.station === st);
  const plan = [0, 0, 0, 0, 0];
  wos.forEach((w) => w.dayPlan.forEach((h, i) => (plan[i] += h)));
  (STATION_BACKGROUND[st] || []).forEach((b) => b.dayPlan.forEach((h, i) => (plan[i] += h)));
  return { plan, total: plan.reduce((a, b) => a + b, 0), wos };
}

function Staff() {
  const ts = tasks();
  const ins = installs();
  const upcoming = ins.filter((i) => i.status !== "done");
  return (
    <Page>
      <PageHead kicker="Records" title="Staff and fitting partners"
        sub="Five people in the workshop and office, plus the owner's role-based account. Freelance fitting crews are kept separate: they are partners, not staff." />
      <Note>{STAFF_NOTE}</Note>
      <Grid min={300} gap={14}>
        {PEOPLE.map((p) => {
          const st = STATIONS.find((s) => s.personId === p.id);
          const load = st ? stationLoad(st.id) : null;
          const cap = p.hoursPerDay * 5;
          const open = ts.filter((t) => t.assignee === p.id && t.status !== "Done");
          const mine = workOrders().filter((w) => w.personId === p.id && w.col !== "fit");
          return (
            <Card key={p.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar id={p.id} size={40} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 2 }}>{p.role} · {p.dept}</div>
                </div>
                {p.owner ? <Badge tone="accent">Owner account</Badge> : <Badge>Fictional</Badge>}
              </div>
              <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 10 }}>{p.email}{p.owner ? " (verified public mailbox)" : " (demo address, not live)"}</div>
              {load ? (
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span className="sa-label" style={{ flex: 1 }}>{st!.label} this week</span>
                    <span style={{ fontSize: 12.5, fontVariantNumeric: "tabular-nums", color: load.total > cap ? "var(--bad)" : "var(--ink)" }}>{load.total.toFixed(1)} / {cap} h</span>
                  </div>
                  <div style={{ marginTop: 7 }}><Meter value={load.total} max={cap} tone={load.total / cap > 0.9 ? "warn" : "accent"} over={load.total > cap} /></div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 4, marginTop: 8 }}>
                    {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d, i) => (
                      <div key={d} style={{ textAlign: "center" }}>
                        <div style={{ height: 30, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                          <div style={{ width: "62%", height: Math.max(3, Math.min(1, load.plan[i] / p.hoursPerDay) * 30), borderRadius: 4, background: load.plan[i] > p.hoursPerDay ? "var(--bad)" : "var(--accent)", opacity: 0.85 }} />
                        </div>
                        <div style={{ fontSize: 10, color: "var(--faint)", marginTop: 3 }}>{d}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 14, fontSize: 12.5, color: "var(--dim)", lineHeight: 1.5 }}>
                  {p.owner ? "Surveys, pricing decisions and approvals. " + ts.filter((t) => t.assignee === "md" && t.status !== "Done").length + " open decisions or tasks." : "Accounts and collections: deposits, balances and supplier chasing."}
                </div>
              )}
              <div className="sa-label" style={{ marginTop: 14, marginBottom: 6 }}>Open tasks · {open.length}</div>
              {open.slice(0, 3).map((t) => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderTop: "1px solid var(--border)", fontSize: 12.5 }}>
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
                  {t.jobId && <JobChip id={t.jobId} label="" />}
                </div>
              ))}
              {!open.length && <div style={{ fontSize: 12, color: "var(--faint)" }}>Nothing open.</div>}
              {mine.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 10 }}>
                  {mine.map((w) => <Badge key={w.id} tone={w.locked ? "bad" : "info"} title={w.title}>{w.id}</Badge>)}
                </div>
              )}
              {p.owner ? null : <Btn small kind="quiet" style={{ marginTop: 10 }} onClick={() => go("Work", "tasks")}>View in Work</Btn>}
            </Card>
          );
        })}
      </Grid>
      <Card title="Fitting partners" sub="3-4 freelance crews on call. Installation is flexible; manufacturing is the bottleneck." right={<Btn small onClick={() => go("Installations", "partners")}>Open Installations</Btn>}>
        <Table rows={FITTERS} cols={[
          { key: "n", label: "Crew", width: "minmax(180px,1.4fr)", render: (f) => (
            <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: f.tint, flex: "none" }} />
              <span><span style={{ display: "block", color: "var(--ink)" }}>{f.name}</span><span style={{ fontSize: 11, color: "var(--faint)" }}>{f.crew}</span></span>
            </span>) },
          { key: "k", label: "Type", width: "96px", render: (f) => <Badge tone={f.kind === "internal" ? "accent" : "info"}>{f.kind === "internal" ? "In-house" : "External"}</Badge> },
          { key: "s", label: "Strengths", width: "minmax(180px,1.6fr)", hideSm: true, render: (f) => <span style={{ fontSize: 12 }}>{f.strengths}</span> },
          { key: "a", label: "Access", width: "minmax(120px,1fr)", hideSm: true, render: (f) => <span style={{ fontSize: 12 }}>{f.access}</span> },
          { key: "u", label: "Upcoming fits", width: "minmax(120px,1fr)", render: (f) => {
            const mine = upcoming.filter((i) => i.fitterId === f.id);
            return mine.length ? <span style={{ fontSize: 12 }}>{mine.map((i) => dayLabel(i.date)).join(", ")}</span> : <span style={{ fontSize: 12, color: "var(--faint)" }}>Available</span>;
          } },
        ]} />
        <Source>{FITTER_NOTE}</Source>
      </Card>
    </Page>
  );
}

/* ── Suppliers ──────────────────────────────────────────────────────────── */
const matTone = (s: MatStatus): Tone => (s === "Short" ? "bad" : s === "Awaiting ETA" ? "warn" : s === "Ordered" ? "info" : s === "Received" ? "ok" : "muted");

function Suppliers() {
  const ms = materials();
  return (
    <Page>
      <PageHead kicker="Records" title="Suppliers"
        sub="Where materials and bought-in components come from. Fabricated letters come from Poland and specialty LED components from abroad; supplier names are not recorded in this demo." />
      <Grid min={320} gap={14}>
        {SUPPLIERS.map((s) => {
          const mine = ms.filter((m) => m.supplierId === s.id);
          const onOrder = mine.filter((m) => m.status === "Ordered" || m.status === "Awaiting ETA").reduce((a, m) => a + m.cost, 0);
          const held = mine.filter((m) => m.status === "Short" || m.status === "Awaiting ETA").length;
          return (
            <Card key={s.id} title={s.name} sub={s.origin + " · lead time " + s.lead}
              right={held ? <Badge tone="warn" dot>{held} held</Badge> : <Badge tone="ok" dot>Clear</Badge>}>
              <div style={{ fontSize: 12.5, color: "var(--body)", lineHeight: 1.5 }}>{s.supplies}</div>
              <Grid min={110} gap={8} style={{ marginTop: 12 }}>
                <KV k="Lines" v={String(mine.length)} mono />
                <KV k="On order" v={eur(onOrder)} mono />
              </Grid>
              <div className="sa-label" style={{ marginTop: 14, marginBottom: 6 }}>Linked materials</div>
              {mine.length ? mine.map((m) => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
                  <span style={{ flex: "1 1 160px", minWidth: 0, fontSize: 12.5 }}>{m.name}</span>
                  {m.jobId && <JobChip id={m.jobId} label="" />}
                  <Badge tone={matTone(m.status)}>{m.status}</Badge>
                </div>
              )) : <div style={{ fontSize: 12, color: "var(--faint)" }}>Nothing on order this week.</div>}
              <Source>{s.note}</Source>
            </Card>
          );
        })}
      </Grid>
    </Page>
  );
}

/* ── Materials ──────────────────────────────────────────────────────────── */
const MAT_STATUSES: MatStatus[] = ["In stock", "Ordered", "Awaiting ETA", "Received", "Short"];
function Materials() {
  const ms = materials();
  const [f, setF] = useState<"all" | MatStatus>("all");
  const rows = ms.filter((m) => f === "all" || m.status === f);
  return (
    <Page>
      <PageHead kicker="Records" title="Materials"
        sub="Catalogue of what is in the building, on order or holding a job up. Procurement actions live in Production, Materials."
        actions={<Btn kind="primary" onClick={() => go("Production", "materials")}>Open procurement</Btn>} />
      <Grid min={150}>
        {MAT_STATUSES.map((s) => (
          <Stat key={s} label={s} value={ms.filter((m) => m.status === s).length} tone={s === "Short" ? "bad" : s === "Awaiting ETA" ? "warn" : undefined}
            sub={eur(ms.filter((m) => m.status === s).reduce((a, m) => a + m.cost, 0))} onClick={() => setF(s)} />
        ))}
      </Grid>
      <div><Seg value={f} onChange={setF} size="sm" options={[{ id: "all", label: "All " + ms.length } as { id: "all" | MatStatus; label: ReactNode }].concat(MAT_STATUSES.map((s) => ({ id: s, label: s })))} /></div>
      <Table rows={rows} rowTone={(m) => (m.status === "Short" ? "bad" : m.status === "Awaiting ETA" ? "warn" : undefined)} cols={[
        { key: "id", label: "Ref", width: "76px", render: (m) => <span className="sa-mono" style={{ color: "var(--faint)" }}>{m.id}</span> },
        { key: "n", label: "Material", width: "minmax(200px,2fr)", render: (m) => (
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</div>
            {m.note && <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.note}</div>}
          </div>) },
        { key: "s", label: "Supplier", width: "minmax(140px,1.2fr)", hideSm: true, render: (m) => <span style={{ fontSize: 12 }}>{supplier(m.supplierId)?.name} · {supplier(m.supplierId)?.origin}</span> },
        { key: "j", label: "Job", width: "minmax(120px,1fr)", render: (m) => (m.jobId ? <JobChip id={m.jobId} label="" /> : <span style={{ color: "var(--faint)" }}>Stock</span>) },
        { key: "q", label: "Qty", width: "minmax(110px,1fr)", hideSm: true, render: (m) => <span style={{ fontSize: 12 }}>{m.qty}</span> },
        { key: "st", label: "Status", width: "120px", render: (m) => <Badge tone={matTone(m.status)} dot>{m.status}</Badge> },
        { key: "eta", label: "ETA", width: "90px", hideSm: true, render: (m) => <span style={{ fontSize: 12, color: "var(--dim)" }}>{m.eta ? relDay(m.eta) : m.status === "Awaiting ETA" ? "Unconfirmed" : "-"}</span> },
        { key: "c", label: "Cost", width: "80px", align: "right", render: (m) => <span style={{ fontVariantNumeric: "tabular-nums" }}>{eur(m.cost)}</span> },
      ]} footer={<span>Costs are illustrative. No live supplier feeds.</span>} />
    </Page>
  );
}

/* ── Assets ─────────────────────────────────────────────────────────────── */
type Asset = { id: string; name: string; cat: "Workshop equipment" | "Vehicles" | "Access kit"; station?: Station; status: string; tone: Tone; last?: Date; next?: Date; note: string; uses: () => { label: string; jobId?: string }[] };

function Assets() {
  const wos = workOrders();
  const ins = installs().filter((i) => i.status !== "done");
  const byStation = (st: Station) => () => wos.filter((w) => w.station === st && w.col !== "fit" && w.hours > 0).map((w) => ({ label: w.id + " " + w.title, jobId: w.jobId }));
  const byInstall = (pred: (i: (typeof ins)[number]) => boolean) => () => ins.filter(pred).map((i) => ({ label: dayLabel(i.date) + " fit", jobId: i.jobId }));
  const printLoad = stationLoad("print").total, cncLoad = stationLoad("cnc").total;
  const assets: Asset[] = [
    { id: "EQ-01", name: "Wide-format printer A (roll-to-roll)", cat: "Workshop equipment", station: "print", status: printLoad > 37.5 ? "Over-booked" : "In use", tone: printLoad > 37.5 ? "bad" : "info", last: bd(-38), next: bd(24), note: COMPANY.equipment[0] + ". Model not recorded in demo.", uses: byStation("print") },
    { id: "EQ-02", name: "Wide-format printer B (roll-to-roll)", cat: "Workshop equipment", station: "print", status: "In use", tone: "info", last: bd(-52), next: bd(10), note: "Second printer covers fleet panels while A runs banners.", uses: byStation("print") },
    { id: "EQ-03", name: "Laminator", cat: "Workshop equipment", station: "print", status: "In use", tone: "info", last: bd(-30), next: bd(35), note: COMPANY.equipment[1] + ". Every wrap panel is laminated before outgassing.", uses: () => wos.filter((w) => /laminat/i.test(w.method + w.materials) && w.col !== "fit" && w.hours > 0).map((w) => ({ label: w.id + " " + w.title, jobId: w.jobId })) },
    { id: "EQ-04", name: "CNC router", cat: "Workshop equipment", station: "cnc", status: cncLoad > 37.5 ? "Over-booked" : "In use", tone: cncLoad > 37.5 ? "bad" : "info", last: bd(-21), next: bd(4), note: COMPANY.equipment[2] + ". Spindle service due soon.", uses: byStation("cnc") },
    { id: "VH-01", name: "Workshop van 1 (long wheelbase)", cat: "Vehicles", status: "Booked", tone: "ok", last: bd(-60), next: bd(40), note: "Carries signs, towers and tools for in-house fits.", uses: byInstall((i) => i.fitterId === "inhouse") },
    { id: "VH-02", name: "Workshop van 2", cat: "Vehicles", status: "Available", tone: "muted", last: bd(-80), next: bd(18), note: "Deliveries, collections and survey runs.", uses: () => [{ label: "Malahide Dental survey " + relDay(bd(1)), jobId: "JOB-26047" }] },
    { id: "AK-01", name: "Aluminium tower scaffold", cat: "Access kit", status: "In use", tone: "info", last: bd(-90), next: bd(70), note: "Inspection tag checked every 7 days.", uses: byInstall((i) => i.fitterId === "inhouse" || i.jobId === "JOB-26056") },
    { id: "AK-02", name: "Ladders, podiums and stop/go boards", cat: "Access kit", status: "Available", tone: "muted", last: bd(-40), next: bd(45), note: "Roadside kit for post signs.", uses: byInstall((i) => /roadside|stop/i.test(i.access)) },
    { id: "AK-03", name: "MEWP / cherry picker", cat: "Access kit", status: "Hired in", tone: "warn", note: "Not owned. Hired via Leinster Access & Signs for high-level fixing.", uses: byInstall((i) => /MEWP/.test(i.access) || i.fitterId === "lac") },
  ];
  const cats: Asset["cat"][] = ["Workshop equipment", "Vehicles", "Access kit"];
  return (
    <Page>
      <PageHead kicker="Records" title="Assets"
        sub="The equipment, vans and access kit the work depends on, with which work orders and fits are using each one. Service dates and models are illustrative." />
      {cats.map((cat) => (
        <div key={cat}>
          <div className="sa-label" style={{ margin: "4px 2px 10px" }}>{cat}</div>
          <Grid min={300} gap={14}>
            {assets.filter((a) => a.cat === cat).map((a) => {
              const uses = a.uses();
              return (
                <Card key={a.id} title={a.name} sub={a.id + (a.station ? " · " + STATIONS.find((s) => s.id === a.station)?.label : "")} right={<Badge tone={a.tone} dot>{a.status}</Badge>}>
                  <div style={{ fontSize: 12.5, color: "var(--body)", lineHeight: 1.5 }}>{a.note}</div>
                  {(a.last || a.next) && (
                    <Grid min={110} gap={8} style={{ marginTop: 12 }}>
                      <KV k="Last service" v={a.last ? dayLabel(a.last) : "-"} />
                      <KV k="Next service" v={a.next ? <span style={{ color: a.next && a.next.getTime() - Date.now() < 7 * 864e5 ? "var(--warn)" : undefined }}>{dayLabel(a.next)}</span> : "-"} />
                    </Grid>
                  )}
                  <div className="sa-label" style={{ marginTop: 14, marginBottom: 6 }}>Used by · {uses.length}</div>
                  {uses.length ? uses.slice(0, 4).map((u, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderTop: "1px solid var(--border)", fontSize: 12.5 }}>
                      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.label}</span>
                      {u.jobId && <JobChip id={u.jobId} label="" />}
                    </div>
                  )) : <div style={{ fontSize: 12, color: "var(--faint)" }}>Free this week.</div>}
                </Card>
              );
            })}
          </Grid>
        </div>
      ))}
      <Source>Equipment types come from signsasap.ie (wide-format printers, lamination, CNC router). Makes, models and service dates are demo placeholders.</Source>
    </Page>
  );
}

