/* Jobs: one connected record from enquiry to balance paid.
   Tabs: Live Jobs · Pipeline · Site Surveys · Artwork & Proofs · Handoffs · Job Calendar. */

import { useMemo, useState, type MouseEvent } from "react";
import {
  useDemo, getTab, go, openJob, jobs, job, stageCounts, headline, eur, pct, margin, person, fitter, stageLabel, stageTone,
  proofs, proofsFor, approvedProof, approveProof, awaitingProofs, workOrders, installs, update, log, toast, addObstacle,
  setSurveyField, requestProofChange, openJobs, type DemoState,
} from "../model";
import { firstTab } from "../nav";
import { STAGE_GROUPS, SURVEYS, KIND_LABEL, WO_COLS, type Job, type JobKind, type Obstacle, type ProofVersion } from "../data";
import { dayLabel, relDay, weekDays, sameDay, bdFromToday, bd, isOverdue, DEMO_TODAY, weekdayShort } from "../dates";
import {
  Page, PageHead, Card, Badge, Btn, Avatar, Who, JobChip, Note, Label, Seg, Table, Empty, ProofArt, Source, type Col, type Tone,
} from "../ui";
import {
  custName, ownerOf, jobsFocus, setJobsFocus, handoffChain, HandoffStrip, StepDot, STEP_LABELS, STEP_TONE, STAGE_ORDER,
  RequestChangeModal, ChangeApprovedModal,
} from "./JobDrawer";

const CSS = `
.jb-strip{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:8px}
.jb-stagebtn{display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:12px 13px;border-radius:var(--r-md,16px);border:1px solid var(--border);background:var(--surface);cursor:pointer;font:inherit;color:var(--ink);text-align:left;min-width:0;transition:border-color .18s var(--ease),background .18s var(--ease)}
.jb-stagebtn:hover{border-color:var(--border-strong)}
.jb-stagebtn.on{border-color:var(--accent-line);background:var(--accent-faint)}
.jb-bar{display:flex;flex-wrap:wrap;align-items:center;gap:10px}
.jb-search{flex:1 1 220px;max-width:340px;height:36px;padding:0 14px;border:1px solid var(--border);border-radius:999px;background:var(--surface-faint);color:var(--ink);font:inherit;font-size:13px;outline:0}
.jb-search:focus{border-color:var(--accent-line)}
.jb-split{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:16px;align-items:start}
.jb-survey{display:grid;grid-template-columns:250px minmax(0,1fr);gap:16px;align-items:start}
.jb-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.jb-photos{display:grid;grid-template-columns:repeat(auto-fill,minmax(128px,1fr));gap:10px}
.jb-cal{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
.jb-matrix{display:grid;grid-template-columns:minmax(190px,1.5fr) repeat(12,minmax(26px,1fr));align-items:center}
.jb-steps{display:grid;grid-template-columns:repeat(auto-fill,minmax(178px,1fr));gap:10px}
.jb-facade{position:relative;aspect-ratio:16/9;border-radius:14px;overflow:hidden;border:1px solid var(--border);cursor:crosshair;user-select:none;background:linear-gradient(180deg,#15232c 0%,#1a2a33 8%,transparent 8%)}
.jb-mk{position:absolute;transform:translate(-50%,-50%);width:24px;height:24px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2px solid #0b0e10;box-shadow:0 4px 12px rgba(0,0,0,.45)}
.jb-tagbtn{height:30px;padding:0 12px;border-radius:999px;border:1px solid var(--border);background:var(--surface-2);color:var(--body);font:inherit;font-size:12px;cursor:pointer}
.jb-tagbtn.on{border-color:var(--warn);color:var(--ink);background:var(--warn-soft)}
.jb-pick{display:flex;align-items:center;gap:10px;width:100%;padding:11px 12px;border:1px solid var(--border);border-radius:14px;background:var(--surface);cursor:pointer;font:inherit;color:var(--ink);text-align:left}
.jb-pick.on{border-color:var(--accent-line);background:var(--accent-faint)}
.jb-scroll{overflow-x:auto;scrollbar-width:thin}
@media (max-width: 1180px){ .jb-strip{grid-template-columns:repeat(4,minmax(0,1fr))} .jb-split{grid-template-columns:1fr} }
@media (max-width: 900px){
  .jb-survey{grid-template-columns:1fr}
  .jb-fields{grid-template-columns:1fr}
  .jb-cal{grid-template-columns:1fr}
  .jb-strip{grid-template-columns:repeat(2,minmax(0,1fr))}
  .jb-matrix{min-width:620px}
}
`;

export default function Jobs(_props: { v: any }) {
  const [s] = useDemo();
  const tab = getTab("Jobs", firstTab("Jobs"));
  return (
    <Page>
      <style>{CSS}</style>
      {tab === "live" && <LiveJobs s={s} />}
      {tab === "pipeline" && <Pipeline s={s} />}
      {tab === "surveys" && <Surveys s={s} />}
      {tab === "proofs" && <Proofs s={s} />}
      {tab === "handoffs" && <Handoffs s={s} />}
      {tab === "calendar" && <Calendar s={s} />}
    </Page>
  );
}

const KIND_SHORT: Record<JobKind, string> = { print: "Print", vehicle: "Vehicle", led: "LED / fab" };
const groupOf = (j: Job) => STAGE_GROUPS.find((g) => g.stages.indexOf(j.stage) > -1)!;

/* ═══ Live Jobs ═════════════════════════════════════════════════════════ */
function LiveJobs({ s }: { s: DemoState }) {
  const [group, setGroup] = useState<string>("open");
  const [kind, setKind] = useState<"all" | JobKind>("all");
  const [q, setQ] = useState("");
  const all = jobs(s);
  const counts = stageCounts(s);
  const h = headline(s);
  const rows = all.filter((j) => {
    if (group === "open" && j.stage === "completed") return false;
    if (group !== "open" && group !== "all" && groupOf(j).id !== group) return false;
    if (kind !== "all" && j.kind !== kind) return false;
    if (q.trim()) {
      const t = (j.id + " " + j.title + " " + custName(j) + " " + j.signTypes.join(" ") + " " + j.site).toLowerCase();
      if (q.toLowerCase().split(/\s+/).some((w) => w && t.indexOf(w) < 0)) return false;
    }
    return true;
  }).sort((a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage) || a.due.getTime() - b.due.getTime());
  const value = rows.reduce((a, j) => a + j.price, 0);
  const cost = rows.reduce((a, j) => a + j.cost, 0);

  const cols: Col<Job>[] = [
    { key: "job", label: "Job", width: "minmax(210px,1.9fr)", render: (j) => (
      <span style={{ minWidth: 0 }}>
        <span className="sa-mono" style={{ fontSize: 11, color: "var(--faint)" }}>{j.id}</span>
        <span style={{ display: "block", color: "var(--ink)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{j.short}</span>
      </span>) },
    { key: "cust", label: "Customer", width: "1.25fr", hideSm: true, render: (j) => <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{custName(j)}</span> },
    { key: "stage", label: "Stage", width: "1fr", render: (j) => <Badge tone={stageTone(j.stage)} dot>{stageLabel(j.stage)}</Badge> },
    { key: "owner", label: "Owner", width: ".9fr", hideSm: true, render: (j) => <Who id={ownerOf(j, s)} /> },
    { key: "due", label: "Due", width: ".75fr", render: (j) => <span style={{ color: isOverdue(j.due) && j.stage !== "completed" ? "var(--bad)" : undefined, whiteSpace: "nowrap" }}>{relDay(j.due)}</span> },
    { key: "fit", label: "Fit", width: ".75fr", hideSm: true, render: (j) => <span style={{ whiteSpace: "nowrap", color: j.fitDate ? undefined : "var(--faint)" }}>{j.fitDate ? relDay(j.fitDate) : j.kind === "vehicle" ? "Workshop" : "Not planned"}</span> },
    { key: "val", label: "Value", width: ".75fr", align: "right", render: (j) => <span className="sa-mono" style={{ color: "var(--ink)" }}>{eur(j.price)}</span> },
    { key: "mg", label: "Margin", width: ".65fr", align: "right", hideSm: true, render: (j) => { const m = margin(j.price, j.cost); return <span className="sa-mono" style={{ color: m < s.marginFloor ? "var(--warn)" : undefined }}>{pct(m)}</span>; } },
    { key: "next", label: "Next step / blocker", width: "minmax(200px,1.8fr)", hideSm: true, render: (j) => (
      <span style={{ minWidth: 0, lineHeight: 1.35 }}>
        <span style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{j.nextStep}</span>
        {j.blocker && <span style={{ display: "block", fontSize: 11.5, color: "var(--warn)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{j.blocker}</span>}
      </span>) },
  ];

  return (
    <>
      <PageHead title="Live jobs" sub={h.total + " jobs in this demo sample: " + h.open + " open, " + h.completed + " completed. Each job keeps one record from enquiry to balance paid, so nobody retypes it."}
        actions={<><Btn onClick={() => go("Jobs", "pipeline")}>Pipeline</Btn><Btn onClick={() => go("Jobs", "calendar")}>Job calendar</Btn><Btn kind="primary" onClick={() => go("Sales", "enquiries")}>New from enquiry</Btn></>} />
      <div className="jb-strip">
        {counts.map((g) => (
          <button type="button" key={g.id} className={"jb-stagebtn" + (group === g.id ? " on" : "")} onClick={() => setGroup(group === g.id ? "open" : g.id)} aria-pressed={group === g.id}>
            <span className="sa-label" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{g.label}</span>
            <span style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-.6px", fontVariantNumeric: "tabular-nums", color: g.id === "proof" || g.id === "procurement" ? "var(--warn)" : g.id === "production" ? "var(--accent)" : "var(--ink)" }}>{g.count}</span>
            <span style={{ fontSize: 11, color: "var(--faint)" }}>{eur(g.jobs.reduce((a, j) => a + j.price, 0))}</span>
          </button>
        ))}
      </div>
      <div className="jb-bar">
        <Seg size="sm" options={[{ id: "open", label: "Open (" + h.open + ")" }, { id: "all", label: "All (" + h.total + ")" }]} value={group === "all" ? "all" : group === "open" ? "open" : ("" as "open")} onChange={(x) => setGroup(x)} />
        <Seg size="sm" options={[{ id: "all" as const, label: "All kinds" }, { id: "print" as const, label: "Print" }, { id: "vehicle" as const, label: "Vehicle" }, { id: "led" as const, label: "LED / fab" }]} value={kind} onChange={setKind} />
        <input className="jb-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search job, customer, sign type" aria-label="Search jobs" />
        {group !== "open" && group !== "all" && <Btn small kind="quiet" onClick={() => setGroup("open")}>Clear stage filter</Btn>}
      </div>
      <Table cols={cols} rows={rows} onRow={(j) => openJob(j.id)}
        rowTone={(j) => (j.blocker ? "warn" : undefined)}
        empty={<Empty title="No jobs match" sub="Try another stage, kind or fewer words." />}
        footer={<><span style={{ flex: 1 }}>{rows.length} job{rows.length === 1 ? "" : "s"} · {eur(value)} value · {pct(margin(value, cost))} blended gross margin</span><span>Values illustrative, except the €7,500 college tender</span></>} />
    </>
  );
}

/* ═══ Pipeline ══════════════════════════════════════════════════════════ */
function Pipeline({ s }: { s: DemoState }) {
  const counts = stageCounts(s);
  const open = openJobs(s);
  const blocked = open.filter((j) => j.blocker);
  return (
    <>
      <PageHead title="Pipeline" sub={"Every job by stage, " + open.length + " open worth " + eur(open.reduce((a, j) => a + j.price, 0)) + ". The strip on each card is its handoff chain."}
        actions={<><Badge tone="warn" dot>{blocked.length} blocked</Badge><Btn onClick={() => go("Jobs", "handoffs")}>Explain handoffs</Btn></>} />
      <div className="sa-kanban" style={{ gridAutoColumns: "minmax(232px,1fr)" }}>
        {counts.map((g) => (
          <div key={g.id} className="sa-col">
            <div className="sa-col-head">
              <span style={{ flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.label}</span>
              <Badge tone={g.id === "proof" || g.id === "procurement" ? "warn" : g.id === "production" ? "accent" : g.id === "completed" ? "ok" : "muted"}>{g.count}</Badge>
            </div>
            <div style={{ fontSize: 11, color: "var(--faint)", padding: "0 4px 4px" }}>{eur(g.jobs.reduce((a, j) => a + j.price, 0))}</div>
            {g.jobs.map((j) => {
              const steps = handoffChain(j, s);
              return (
                <div key={j.id} className="sa-tile" onClick={() => openJob(j.id)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") openJob(j.id); }}
                  style={{ boxShadow: j.blocker ? "inset 2px 0 0 var(--warn)" : undefined }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="sa-mono" style={{ fontSize: 10.5, color: "var(--faint)", flex: 1 }}>{j.id}</span>
                    <span style={{ fontSize: 10.5, color: "var(--dim)" }}>{KIND_SHORT[j.kind]}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4, lineHeight: 1.3 }}>{j.short}</div>
                  <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{custName(j)}</div>
                  <div style={{ margin: "10px 0 8px" }}><HandoffStrip steps={steps} compact /></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5 }}>
                    <Avatar id={ownerOf(j, s)} size={18} />
                    <span style={{ flex: 1, color: isOverdue(j.due) && j.stage !== "completed" ? "var(--bad)" : "var(--dim)" }}>{j.stage === "completed" ? "Done" : "Due " + relDay(j.due)}</span>
                    <span className="sa-mono" style={{ color: "var(--ink)" }}>{eur(j.price)}</span>
                  </div>
                  {j.blocker && <div style={{ fontSize: 11, color: "var(--warn)", marginTop: 7, lineHeight: 1.35 }}>{j.blocker}</div>}
                </div>
              );
            })}
            {g.jobs.length === 0 && <div style={{ fontSize: 12, color: "var(--faint)", padding: "10px 4px" }}>Nothing at this stage</div>}
          </div>
        ))}
      </div>
      <Source>Columns and totals are computed from the job records. Values are illustrative except the €7,500 college tender.</Source>
    </>
  );
}

/* ═══ Site Surveys ══════════════════════════════════════════════════════ */
const TAGS: Obstacle["tag"][] = ["CCTV", "Alarm bell", "Electrical route", "Downpipe", "High-level fixing", "Cable", "Access"];

function Surveys({ s }: { s: DemoState }) {
  const focus = jobsFocus(s);
  const initial = SURVEYS.find((x) => x.jobId === focus) || SURVEYS[0];
  const [svId, setSvId] = useState(initial.id);
  const sv = SURVEYS.find((x) => x.id === svId) || SURVEYS[0];
  const j = job(sv.jobId, s);
  const F = (k: string, d: string) => { const f = s.surveyFields[sv.id] || {}; return f[k] !== undefined ? f[k] : d; };
  const status = F("status", sv.status);
  const obstacles = sv.obstacles.concat(s.surveyObstacles[sv.id] || []);
  const extraPhotos = parseInt(F("extraPhotos", "0"), 10) || 0;
  const [pending, setPending] = useState<{ x: number; y: number } | null>(null);
  const [tag, setTag] = useState<Obstacle["tag"]>("CCTV");
  const [note, setNote] = useState("");
  const width = F("width", String(sv.width));
  const height = F("height", String(sv.height));
  const unit = F("unit", sv.unit);

  const place = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPending({ x: Math.round(((e.clientX - r.left) / r.width) * 100), y: Math.round(((e.clientY - r.top) / r.height) * 100) });
  };
  const addMarker = () => {
    if (!pending) return;
    addObstacle(sv.id, { id: "u" + Date.now(), tag, x: pending.x, y: pending.y, note: note.trim() || tag + " tagged on site" });
    log("human", "Managing Director", "Tagged " + tag.toLowerCase() + " on the " + (j ? j.short : sv.jobId) + " survey" + (note.trim() ? ": " + note.trim() : "") + ".", sv.jobId, "survey", "info");
    toast(tag + " marker added to the job record");
    setPending(null); setNote("");
  };
  const field = (k: string, label: string, d: string, area?: boolean) => (
    <label style={{ display: "block", minWidth: 0 }}>
      <div className="sa-label" style={{ marginBottom: 6 }}>{label}</div>
      {area
        ? <textarea className="sa-input" rows={3} value={F(k, d)} onChange={(e) => setSurveyField(sv.id, k, e.target.value)} />
        : <input className="sa-input" value={F(k, d)} onChange={(e) => setSurveyField(sv.id, k, e.target.value)} />}
    </label>
  );

  return (
    <>
      <PageHead title="Site surveys" sub="Measure, photograph and sketch on the phone. The survey lands in the job record, so design and production work from the same facts."
        actions={j ? <JobChip id={j.id} /> : undefined} />
      <Note tone="info">Owner captures once; Conor sees it in the shared job record instantly (mock). AI does not replace the physical survey: dimensions, fixings and obstacles come from being on site.</Note>
      <div className="jb-survey">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Label style={{ padding: "0 4px" }}>Surveys</Label>
          {SURVEYS.map((x) => {
            const xj = job(x.jobId, s);
            const st = (s.surveyFields[x.id] || {}).status || x.status;
            return (
              <button type="button" key={x.id} className={"jb-pick" + (x.id === sv.id ? " on" : "")} onClick={() => { setSvId(x.id); setPending(null); setJobsFocus(x.jobId); }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{xj ? xj.short : x.jobId}</span>
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--faint)", marginTop: 2 }}>{x.id} · {st === "booked" ? "booked " + relDay(x.date) : dayLabel(x.date)}</span>
                </span>
                <Badge tone={st === "booked" ? "warn" : st === "captured" ? "info" : "ok"}>{st === "booked" ? "Booked" : st === "captured" ? "Captured" : "Shared"}</Badge>
              </button>
            );
          })}
          <Source>Demo dimensions are examples, not measured facts.</Source>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <Card title={(j ? j.short : sv.jobId) + " · elevation"} sub="Tap the elevation to tag an obstacle. Markers are saved to the job record."
            right={<Badge tone={status === "booked" ? "warn" : "ok"}>{status === "booked" ? "Survey booked " + relDay(sv.date) : "Captured " + dayLabel(sv.date) + " by " + person(sv.by).name}</Badge>}>
            <div className="jb-facade" onClick={place} role="img" aria-label="Shopfront elevation with tagged obstacles">
              <Facade />
              <div style={{ position: "absolute", left: "18%", width: "64%", top: "16%", height: "20%", border: "2px dashed var(--accent)", borderRadius: 4, background: "rgba(244,147,19,.12)", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                <span style={{ fontSize: "clamp(9px,1.3vw,12px)", color: "#fff", background: "rgba(11,14,16,.72)", padding: "3px 8px", borderRadius: 6, textAlign: "center" }}>
                  Sign zone {width} × {height} {unit}{sv.illustrativeDims ? " · demo example, not measured" : ""}
                </span>
              </div>
              <div style={{ position: "absolute", left: "18%", width: "64%", top: "38.5%", height: 0, borderTop: "1px solid rgba(255,255,255,.55)", pointerEvents: "none" }}>
                <span style={{ position: "absolute", left: "50%", top: 2, transform: "translateX(-50%)", fontSize: 10, color: "rgba(255,255,255,.75)", whiteSpace: "nowrap" }}>{width} {unit}</span>
              </div>
              {obstacles.map((o, i) => (
                <span key={o.id} className="jb-mk" title={o.tag + ": " + o.note} style={{ left: o.x + "%", top: o.y + "%", background: "var(--warn)", color: "#0b0e10" }}>{i + 1}</span>
              ))}
              {pending && <span className="jb-mk" style={{ left: pending.x + "%", top: pending.y + "%", background: "var(--accent)", color: "#1a0d02", animation: "saPulse 1.2s ease-in-out infinite" }}>+</span>}
            </div>
            {pending ? (
              <div style={{ marginTop: 12, padding: 12, border: "1px solid var(--accent-line)", borderRadius: 14, background: "var(--accent-faint)", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 12.5, color: "var(--body)" }}>New marker at {pending.x}% across, {pending.y}% down. What is it?</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {TAGS.map((t) => <button type="button" key={t} className={"jb-tagbtn" + (t === tag ? " on" : "")} onClick={() => setTag(t)}>{t}</button>)}
                </div>
                <input className="sa-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note for design and fitters (optional)" />
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn kind="primary" onClick={addMarker}>Add marker</Btn>
                  <Btn kind="quiet" onClick={() => setPending(null)}>Cancel</Btn>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 12 }}>
                {obstacles.length === 0 && <div style={{ fontSize: 12.5, color: "var(--faint)" }}>No obstacles tagged yet. Tap the elevation on site to add one.</div>}
                {obstacles.map((o, i) => (
                  <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: i ? "1px solid var(--border)" : "none", fontSize: 12.5 }}>
                    <span style={{ width: 20, height: 20, borderRadius: 10, background: "var(--warn)", color: "#0b0e10", fontSize: 10.5, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{i + 1}</span>
                    <Badge tone="warn">{o.tag}</Badge>
                    <span style={{ color: "var(--body)", minWidth: 0 }}>{o.note}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Photos" sub={status === "booked" ? "Taken on site with the phone camera" : (sv.photos.length + extraPhotos) + " photos in the job record"}>
            <div className="jb-photos">
              {sv.photos.map((p, i) => <PhotoTile key={p} label={p} i={i} />)}
              {Array.from({ length: extraPhotos }).map((_, i) => <PhotoTile key={"x" + i} label={"Site photo " + (sv.photos.length + i + 1)} i={i + 3} />)}
              <button type="button" onClick={() => { setSurveyField(sv.id, "extraPhotos", String(extraPhotos + 1)); toast("Photo captured (simulated, no camera used)"); }}
                style={{ aspectRatio: "4/3", borderRadius: 12, border: "1.5px dashed var(--border-strong)", background: "none", color: "var(--dim)", font: "inherit", fontSize: 12.5, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8.5h3l1.6-2.5h6.8L17 8.5h3v10H4z M12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" /></svg>
                Add photo
              </button>
            </div>
          </Card>

          <Card title="Measurements & site notes" sub="Edits save to the shared job record as you type.">
            <div className="jb-fields">
              {field("width", "Width", String(sv.width))}
              {field("height", "Height", String(sv.height))}
              <div>
                <div className="sa-label" style={{ marginBottom: 6 }}>Units</div>
                <Seg size="sm" options={[{ id: "m", label: "Metres" }, { id: "mm", label: "Millimetres" }]} value={unit === "mm" ? "mm" : "m"} onChange={(x) => setSurveyField(sv.id, "unit", x)} />
              </div>
              {field("mountHeight", "Mounting height", sv.mountHeight)}
              {field("location", "Location on building", sv.location)}
              {field("access", "Access requirements", sv.access)}
              {field("power", "Power / electrical", sv.power)}
              <div style={{ gridColumn: "1 / -1" }}>{field("installerNotes", "Installer notes", sv.installerNotes, true)}</div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginTop: 14 }}>
              <Btn kind="primary" onClick={() => { setSurveyField(sv.id, "status", "shared"); log("human", "Managing Director", "Shared " + (j ? j.short : sv.jobId) + " survey to the job record: " + obstacles.length + " obstacles, " + (sv.photos.length + extraPhotos) + " photos.", sv.jobId, "survey", "ok"); toast("Survey shared to the job record"); }}>
                {status === "booked" ? "Save capture to job" : "Share update to job"}
              </Btn>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--dim)" }}>
                <Avatar id="conor" size={20} /> Conor Hayes sees this in the {j ? j.id : ""} record (mock)
              </span>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function PhotoTile({ label, i }: { label: string; i: number }) {
  const hues = ["#1f3440", "#2a2f22", "#302626", "#22303a", "#2b2a35", "#263228"];
  return (
    <div style={{ position: "relative", aspectRatio: "4/3", borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)",
      background: "linear-gradient(160deg," + hues[i % hues.length] + ",#0f1316)" }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", top: 10, right: 10 }}>
        <path d="M4 8.5h3l1.6-2.5h6.8L17 8.5h3v10H4z M12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "18px 10px 8px", background: "linear-gradient(0deg,rgba(0,0,0,.6),transparent)", fontSize: 11, color: "rgba(255,255,255,.85)" }}>{label}</div>
    </div>
  );
}

/** A drawn shopfront: wall, fascia line, door, windows, downpipe, footpath. */
function Facade() {
  const abs = (st: React.CSSProperties) => <div style={{ position: "absolute", pointerEvents: "none", ...st }} />;
  return (
    <>
      {abs({ left: 0, right: 0, top: "8%", bottom: 0, background: "repeating-linear-gradient(0deg,#2c333a 0 14px,#283036 14px 15px)" })}
      {abs({ left: 0, right: 0, top: "8%", height: "3%", background: "#3a434b" })}
      {abs({ left: "20%", width: "13%", top: "50%", bottom: "6%", background: "#121a20", border: "3px solid #444e57", borderBottom: 0 })}
      {abs({ left: "38%", width: "20%", top: "46%", height: "34%", background: "linear-gradient(160deg,#2f4d5e,#1a2a33)", border: "3px solid #444e57" })}
      {abs({ left: "62%", width: "17%", top: "46%", height: "34%", background: "linear-gradient(160deg,#2f4d5e,#1a2a33)", border: "3px solid #444e57" })}
      {abs({ left: "94.4%", width: "1.4%", top: "8%", bottom: "6%", background: "#5d666e", borderRadius: 2 })}
      {abs({ left: 0, right: 0, bottom: 0, height: "6%", background: "#3d4348" })}
      {abs({ left: "13%", width: "3%", top: "17%", height: "6%", background: "#c23b3b", borderRadius: 3 })}
      {abs({ left: "81%", width: "3%", top: "20%", height: "3%", background: "#d6dadd", borderRadius: 2 })}
    </>
  );
}

/* ═══ Artwork & Proofs ══════════════════════════════════════════════════ */
const PROOF_TONE: Record<string, Tone> = { approved: "ok", awaiting: "warn", superseded: "muted", changes: "bad" };
const PROOF_LABEL: Record<string, string> = { approved: "Approved", awaiting: "Awaiting client sign-off", superseded: "Superseded", changes: "Change requested" };

function Proofs({ s }: { s: DemoState }) {
  const all = proofs(s);
  const jobIds = useMemo(() => {
    const ids: string[] = [];
    all.forEach((p) => { if (ids.indexOf(p.jobId) < 0) ids.push(p.jobId); });
    return ids.sort((a, b) => (all.some((p) => p.jobId === b && p.status === "awaiting") ? 1 : 0) - (all.some((p) => p.jobId === a && p.status === "awaiting") ? 1 : 0) || a.localeCompare(b));
  }, [all.length, s.proofStatus]); // eslint-disable-line react-hooks/exhaustive-deps
  const focus = jobsFocus(s);
  const [jobId, setJobId] = useState(focus && jobIds.indexOf(focus) > -1 ? focus : "JOB-26043");
  const versions = proofsFor(jobId, s);
  const [sel, setSel] = useState<string | null>(null);
  const current = versions.find((p) => p.id === sel) || versions[versions.length - 1];
  const prev = current ? versions[versions.indexOf(current) - 1] : undefined;
  const ap = approvedProof(jobId, s);
  const awaiting = versions.filter((p) => p.status === "awaiting").pop();
  const j = job(jobId, s);
  const wos = workOrders(s).filter((w) => w.jobId === jobId);
  const crs = s.changeRequests.filter((c) => c.jobId === jobId);
  const [modal, setModal] = useState<null | "change" | "approved">(null);
  const others = awaitingProofs(s).filter((p) => p.jobId !== jobId);

  const pick = (id: string) => { setJobId(id); setSel(null); setJobsFocus(id); };
  const changed = (k: keyof ProofVersion) => !!prev && prev[k] !== current?.[k];
  const spec = (k: keyof ProofVersion, label: string) => (
    <div className="sa-kv" style={changed(k) ? { borderColor: "var(--accent-line)", background: "var(--accent-faint)" } : undefined}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span className="sa-label" style={{ flex: 1 }}>{label}</span>
        {changed(k) && <span style={{ fontSize: 10, color: "var(--accent)", fontWeight: 600 }}>Changed in v{current!.v}</span>}
      </div>
      <div style={{ fontSize: 13, color: "var(--ink)", marginTop: 4, lineHeight: 1.4 }}>{String(current![k])}</div>
    </div>
  );

  return (
    <>
      <PageHead title="Artwork & proofs" sub="One approved version per job. Production can only build from it, and every change keeps its history."
        actions={<Badge tone="warn" dot>{awaitingProofs(s).length} awaiting sign-off</Badge>} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {jobIds.map((id) => {
          const aw = all.some((p) => p.jobId === id && p.status === "awaiting");
          const jj = job(id, s);
          return (
            <button type="button" key={id} onClick={() => pick(id)} className={"jb-tagbtn" + (id === jobId ? " on" : "")}
              style={id === jobId ? { borderColor: "var(--accent-line)", background: "var(--accent-faint)" } : undefined}>
              {aw && <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 3, background: "var(--warn)", marginRight: 6, verticalAlign: "middle" }} />}
              {jj ? jj.short : id}
            </button>
          );
        })}
      </div>

      {current && j && (
        <div className="jb-split">
          <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
            <Card title={j.title} sub={custName(j) + " · " + KIND_LABEL[j.kind]} right={<><Badge tone={PROOF_TONE[current.status]} dot>{"v" + current.v + " · " + PROOF_LABEL[current.status]}</Badge><JobChip id={j.id} label="" /></>}>
              {current.status === "awaiting" && (
                <Note tone="warn" style={{ marginBottom: 12 }}>
                  <b style={{ color: "var(--ink)" }}>Awaiting client sign-off.</b> {current.emails}{j.kind === "led" && !ap ? " This job cannot enter fabrication until v" + current.v + " is approved." : ""}
                </Note>
              )}
              <ProofArt swatch={current.swatch} label={j.short + " · v" + current.v + " · " + current.size} ratio="16/5" lit={current.lighting !== "n/a"} />
              <div style={{ fontSize: 13.5, color: "var(--body)", lineHeight: 1.55, marginTop: 12 }}>{current.summary}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 8, marginTop: 12 }}>
                {spec("pantone", "Pantone / colour")}
                {spec("substrate", "Substrate")}
                {spec("lighting", "Lighting")}
                {spec("size", "Size")}
                <div className="sa-kv"><div className="sa-label">Designer</div><div style={{ marginTop: 5 }}><Who id={current.designer} sub={dayLabel(current.date)} /></div></div>
                {current.notes && <div className="sa-kv"><div className="sa-label">Notes</div><div style={{ fontSize: 13, color: "var(--ink)", marginTop: 4, lineHeight: 1.4 }}>{current.notes}</div></div>}
              </div>
              <div style={{ marginTop: 12, padding: "11px 13px", border: "1px solid var(--border)", borderRadius: 12, background: "var(--surface-faint)" }}>
                <div className="sa-label">Email correspondence summary</div>
                <div style={{ fontSize: 12.5, color: "var(--body)", marginTop: 5, lineHeight: 1.5 }}>{current.emails}</div>
              </div>
            </Card>

            <Card title="Version history" sub={versions.length + " version" + (versions.length === 1 ? "" : "s") + ". Nothing is overwritten; superseded versions stay on record."} pad={false}>
              <div style={{ padding: "0 12px 12px" }}>
                {versions.slice().reverse().map((p) => (
                  <div key={p.id} onClick={() => setSel(p.id)} className="sa-click-row"
                    style={{ display: "grid", gridTemplateColumns: "96px minmax(0,1fr) auto", gap: 12, alignItems: "center", padding: 10, borderRadius: 12,
                      background: p.id === current.id ? "var(--surface-2)" : undefined, boxShadow: p.status === "approved" ? "inset 2px 0 0 var(--ok)" : p.status === "awaiting" ? "inset 2px 0 0 var(--warn)" : undefined }}>
                    <ProofArt swatch={p.swatch} label={"v" + p.v} ratio="16/7" lit={p.lighting !== "n/a"} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>v{p.v} · {dayLabel(p.date)} · {person(p.designer).name}</div>
                      <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 3, lineHeight: 1.4 }}>{p.summary}</div>
                      <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 3 }}>{p.substrate} · {p.lighting}</div>
                    </div>
                    <Badge tone={PROOF_TONE[p.status]}>{PROOF_LABEL[p.status]}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
            <Card title="Production gate" tone={ap ? "ok" : "bad"}>
              {ap
                ? <div style={{ fontSize: 13, color: "var(--body)", lineHeight: 1.55 }}>Production may only build from <b style={{ color: "var(--ok)" }}>v{ap.v}</b>: {ap.pantone}; {ap.substrate}; {ap.lighting}; {ap.size}.</div>
                : <div style={{ fontSize: 13, color: "var(--body)", lineHeight: 1.55 }}>No approved version. <b style={{ color: "var(--bad)" }}>Fabrication is locked</b> until the client signs off{awaiting ? " v" + awaiting.v : ""}.</div>}
              {wos.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  {wos.map((w) => (
                    <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderTop: "1px solid var(--border)", fontSize: 12.5 }}>
                      <span className="sa-mono" style={{ fontSize: 11, color: "var(--faint)" }}>{w.id}</span>
                      <span style={{ flex: 1, minWidth: 0, color: "var(--body)" }}>{w.title}</span>
                      {w.locked ? <Badge tone="bad">Locked</Badge> : <Badge tone="ok">{WO_COLS.find((c) => c.id === w.col)?.short}</Badge>}
                    </div>
                  ))}
                  {wos.some((w) => !w.locked) && jobId === "JOB-26043" && <Btn small kind="teal" onClick={() => go("Production", "live")} style={{ marginTop: 8 }}>See it on the workshop board</Btn>}
                </div>
              )}
            </Card>

            <Card title="Decide">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {awaiting && <Btn kind="primary" onClick={() => { approveProof(awaiting.id); setSel(null); }}>Approve v{awaiting.v} for production</Btn>}
                {awaiting && <Btn onClick={() => setModal("change")}>Request change on v{awaiting.v}</Btn>}
                {ap && !awaiting && <Btn onClick={() => setModal("approved")}>Change approved artwork</Btn>}
                {!awaiting && !ap && <div style={{ fontSize: 12.5, color: "var(--dim)" }}>Waiting for Conor's next version.</div>}
                <div style={{ fontSize: 11.5, color: "var(--faint)", lineHeight: 1.5 }}>Approving records the decision as the owner on the client's sign-off. Nothing is emailed from the demo.</div>
              </div>
            </Card>

            {crs.length > 0 && (
              <Card title="Change requests" sub="Logged against the approved version">
                {crs.map((c) => (
                  <div key={c.id} style={{ padding: "9px 0", borderTop: "1px solid var(--border)", fontSize: 12.5 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ flex: 1, color: "var(--ink)" }}>{c.note}</span>
                      <Badge tone={c.status === "open" ? "warn" : c.status === "accepted" ? "ok" : "muted"}>{c.status === "open" ? "Open" : c.status === "accepted" ? "Accepted" : "Rejected"}</Badge>
                    </div>
                    <div style={{ color: "var(--faint)", fontSize: 11.5, marginTop: 3 }}>Cost impact {eur(c.costImpact)}</div>
                    {c.status === "open" && (
                      <div style={{ display: "flex", gap: 6, marginTop: 7 }}>
                        <Btn small onClick={() => { update((st) => ({ changeRequests: st.changeRequests.map((x) => x.id === c.id ? { ...x, status: "accepted" } : x) })); requestProofChange(c.proofId, c.note); }}>Accept, new version</Btn>
                        <Btn small kind="quiet" onClick={() => { update((st) => ({ changeRequests: st.changeRequests.map((x) => x.id === c.id ? { ...x, status: "rejected" } : x) })); log("human", "Managing Director", "Rejected change request on " + j.short + ": " + c.note + ".", j.id, "proof", "info"); }}>Reject</Btn>
                      </div>
                    )}
                  </div>
                ))}
              </Card>
            )}

            <Card title="Other proofs awaiting" sub={others.length ? "Across all jobs" : "None"}>
              {others.map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderTop: "1px solid var(--border)", fontSize: 12.5 }}>
                  <button type="button" onClick={() => pick(p.jobId)} className="sa-jobchip">{job(p.jobId, s)?.short || p.jobId} · v{p.v}</button>
                  <span style={{ flex: 1, fontSize: 11.5, color: "var(--faint)" }}>{relDay(p.date)}</span>
                  <Btn small kind="teal" onClick={() => approveProof(p.id)}>Approve</Btn>
                </div>
              ))}
              {others.length === 0 && <div style={{ fontSize: 12.5, color: "var(--faint)" }}>Every other job has an approved version.</div>}
            </Card>
          </div>
        </div>
      )}
      {modal === "change" && awaiting && j && <RequestChangeModal proofId={awaiting.id} label={j.short + " v" + awaiting.v} onClose={() => setModal(null)} />}
      {modal === "approved" && ap && j && <ChangeApprovedModal jobId={j.id} proofId={ap.id} label={j.short + " v" + ap.v} onClose={() => setModal(null)} />}
    </>
  );
}

/* ═══ Handoffs ══════════════════════════════════════════════════════════ */
function Handoffs({ s }: { s: DemoState }) {
  const all = jobs(s);
  const focus = jobsFocus(s);
  const [jobId, setJobId] = useState(focus && all.some((x) => x.id === focus) ? focus : "JOB-26043");
  const j = job(jobId, s) || all[0];
  const steps = handoffChain(j, s);
  const open = openJobs(s);
  const skipped = steps.filter((x) => x.state === "skipped");
  const required = steps.filter((x) => x.required);
  const pick = (id: string) => { setJobId(id); setJobsFocus(id); };

  return (
    <>
      <PageHead title="Handoffs" sub="One traceable chain from enquiry to balance paid. Steps are conditional: a printed board skips what it does not need; an LED fascia cannot skip site conditions or proof acceptance."
        actions={<select className="sa-input" style={{ width: 300, height: 36, padding: "0 12px" }} value={j.id} onChange={(e) => pick(e.target.value)} aria-label="Choose job">
          {all.map((x) => <option key={x.id} value={x.id}>{x.id} · {x.short}</option>)}
        </select>} />
      <Card title={j.title} sub={custName(j) + " · " + KIND_LABEL[j.kind] + " · " + stageLabel(j.stage)} right={<><Btn small onClick={() => openJob(j.id)}>Open job</Btn></>}>
        <div style={{ margin: "6px 0 16px" }}><HandoffStrip steps={steps} /></div>
        <div className="jb-steps">
          {steps.map((x, i) => (
            <div key={x.id} style={{ padding: "12px 13px", borderRadius: 14, border: "1px solid " + (x.state === "current" ? "var(--accent-line)" : x.state === "blocked" ? "color-mix(in oklab,var(--bad) 45%,transparent)" : "var(--border)"),
              background: x.state === "current" ? "var(--accent-faint)" : x.state === "blocked" ? "var(--bad-soft)" : "var(--surface-faint)", opacity: x.state === "skipped" ? 0.7 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <StepDot state={x.state} />
                <span className="sa-mono" style={{ fontSize: 11, color: "var(--faint)" }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{x.label}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--body)", marginTop: 7, lineHeight: 1.45 }}>{x.note}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                <Badge tone={STEP_TONE[x.state]}>{x.state === "done" ? "Done" : x.state === "current" ? "Now" : x.state === "blocked" ? "Blocked" : x.state === "skipped" ? "Not needed" : "Later"}</Badge>
                {x.required && <Badge tone="info">Cannot skip</Badge>}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 10, marginTop: 14 }}>
          <Note tone="muted"><b style={{ color: "var(--ink)" }}>Skipped for this job:</b> {skipped.length ? skipped.map((x) => x.label + " (" + x.note.toLowerCase() + ")").join("; ") : "nothing; every step applies"}.</Note>
          <Note tone={j.kind === "led" ? "info" : "muted"}>
            <b style={{ color: "var(--ink)" }}>Rules:</b> {j.kind === "led"
              ? "Custom LED work must pass " + required.map((x) => x.label.toLowerCase()).join(" and ") + ". Safety and site conditions are checked on the survey; the approved proof gates fabrication."
              : "Print and vehicle jobs follow the same chain but skip a survey or deposit where it adds nothing. The approved proof and QA gates still apply."}
          </Note>
        </div>
      </Card>

      <Card title="All open jobs" sub="Each row is one job's chain. Click to inspect." pad={false}>
        <div className="jb-scroll" style={{ padding: "0 14px 14px" }}>
          <div className="jb-matrix" style={{ padding: "8px 6px", borderBottom: "1px solid var(--border)" }}>
            <span className="sa-label">Job</span>
            {STEP_LABELS.map((l) => <span key={l} className="sa-label" style={{ fontSize: 9, letterSpacing: ".04em", textAlign: "center", lineHeight: 1.2 }} title={l}>{l.split(" ")[0].slice(0, 5)}</span>)}
          </div>
          {open.map((x) => {
            const st = handoffChain(x, s);
            return (
              <div key={x.id} className="jb-matrix sa-click-row" onClick={() => pick(x.id)} style={{ padding: "9px 6px", borderRadius: 10, background: x.id === j.id ? "var(--surface-2)" : undefined }}>
                <span style={{ minWidth: 0, fontSize: 12.5 }}>
                  <span style={{ color: "var(--ink)", fontWeight: 500, display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{x.short}</span>
                  <span style={{ fontSize: 10.5, color: "var(--faint)" }}>{x.id} · {KIND_SHORT[x.kind]}</span>
                </span>
                {st.map((y) => <span key={y.id} title={y.label + ": " + y.note} style={{ display: "flex", justifyContent: "center" }}><StepDot state={y.state} size={11} /></span>)}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, padding: "10px 20px 16px", borderTop: "1px solid var(--border)", fontSize: 11.5, color: "var(--dim)" }}>
          {(["done", "current", "blocked", "pending", "skipped"] as const).map((k) => (
            <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><StepDot state={k} />{k === "done" ? "Done" : k === "current" ? "Now" : k === "blocked" ? "Blocked" : k === "pending" ? "Later" : "Not needed"}</span>
          ))}
        </div>
      </Card>
    </>
  );
}

/* ═══ Job Calendar ══════════════════════════════════════════════════════ */
function Calendar({ s }: { s: DemoState }) {
  const all = jobs(s);
  const ins = installs(s);
  const weeks = [0, 1].map((w) => weekDays(w));
  const last = weeks[1][4];
  const later = all.filter((j) => j.fitDate && j.stage !== "completed" && j.fitDate.getTime() > last.getTime()).sort((a, b) => a.fitDate!.getTime() - b.fitDate!.getTime());
  const unplanned = all.filter((j) => !j.fitDate && j.stage !== "completed" && j.kind !== "vehicle" && !/collect/i.test(j.site));

  const moveFit = (j: Job, delta: number) => {
    if (!j.fitDate) return;
    const nxt = Math.max(0, bdFromToday(j.fitDate) + delta);
    const inst = ins.find((i) => i.jobId === j.id && i.status !== "done");
    update((st) => ({ jobFit: { ...st.jobFit, [j.id]: nxt }, installDay: inst ? { ...st.installDay, [inst.id]: nxt } : st.installDay }));
    log("human", "Managing Director", "Moved " + j.short + " fit to " + dayLabel(bd(nxt)) + (inst ? "; " + fitter(inst.fitterId).name + " booking follows" : "") + ".", j.id, "install", "info");
  };
  const plan = (j: Job) => {
    const off = Math.max(1, bdFromToday(j.due) + 1);
    update((st) => ({ jobFit: { ...st.jobFit, [j.id]: off } }));
    log("human", "Managing Director", "Planned " + j.short + " fit for " + dayLabel(bd(off)) + ".", j.id, "install", "info");
    toast(j.short + " pencilled in for " + dayLabel(bd(off)));
  };

  return (
    <>
      <PageHead title="Job calendar" sub="Due dates and planned fits, Monday to Friday. Move a fit and the crew booking moves with it. No weekend work unless tagged exceptional."
        actions={<Btn onClick={() => go("Installations", "calendar")}>Fitting calendar</Btn>} />
      {weeks.map((days, wi) => (
        <Card key={wi} title={wi === 0 ? "This week" : "Next week"} sub={dayLabel(days[0]) + " to " + dayLabel(days[4])}>
          <div className="jb-cal">
            {days.map((d) => {
              const today = sameDay(d, DEMO_TODAY);
              const fits = all.filter((j) => j.fitDate && sameDay(j.fitDate, d));
              const dues = all.filter((j) => sameDay(j.due, d) && !(j.fitDate && sameDay(j.fitDate, d)));
              const past = d.getTime() < DEMO_TODAY.getTime() && !today;
              return (
                <div key={d.toISOString()} style={{ minHeight: 150, padding: 10, borderRadius: 14, border: "1px solid " + (today ? "var(--accent-line)" : "var(--border)"),
                  background: today ? "var(--accent-faint)" : "var(--surface-faint)", opacity: past ? 0.65 : 1, display: "flex", flexDirection: "column", gap: 7, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: today ? "var(--accent)" : "var(--ink)" }}>{weekdayShort(d)}</span>
                    <span style={{ fontSize: 12, color: "var(--dim)" }}>{d.getDate()}</span>
                    {today && <span style={{ fontSize: 10.5, color: "var(--accent)", marginLeft: "auto" }}>Today</span>}
                  </div>
                  {fits.map((j) => {
                    const inst = ins.find((i) => i.jobId === j.id && i.status !== "done");
                    return (
                      <div key={"f" + j.id} className="sa-tile" onClick={() => openJob(j.id)} style={{ padding: "8px 9px", borderRadius: 11, boxShadow: "inset 2px 0 0 var(--accent)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Badge tone={j.stage === "completed" ? "ok" : "accent"} style={{ height: 18, fontSize: 10 }}>{j.stage === "completed" ? "Fitted" : "Fit"}</Badge>
                          <span style={{ fontSize: 12, fontWeight: 600, minWidth: 0, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{j.short}</span>
                        </div>
                        <div style={{ fontSize: 10.5, color: "var(--faint)", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {inst ? fitter(inst.fitterId).name + " · " + inst.slot : "Crew not booked"}
                        </div>
                        {j.stage !== "completed" && (
                          <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                            <Btn small kind="quiet" title="One business day earlier" disabled={bdFromToday(j.fitDate!) <= 0} onClick={() => moveFit(j, -1)} style={{ height: 22, padding: "0 7px", fontSize: 11 }}>Earlier</Btn>
                            <Btn small kind="quiet" title="One business day later" onClick={() => moveFit(j, 1)} style={{ height: 22, padding: "0 7px", fontSize: 11 }}>Later</Btn>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {dues.map((j) => (
                    <div key={"d" + j.id} onClick={() => openJob(j.id)} className="sa-click" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--dim)", padding: "2px 2px" }}>
                      <span style={{ width: 6, height: 6, borderRadius: 3, background: j.stage === "completed" ? "var(--ok)" : isOverdue(j.due) ? "var(--bad)" : "var(--teal)", flex: "none" }} />
                      <span style={{ minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Due: {j.short}</span>
                    </div>
                  ))}
                  {fits.length === 0 && dues.length === 0 && <div style={{ fontSize: 11.5, color: "var(--faint)" }}>Nothing planned</div>}
                </div>
              );
            })}
          </div>
        </Card>
      ))}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14 }}>
        <Card title="Later fits" sub="Planned beyond next week">
          {later.length === 0 && <div style={{ fontSize: 12.5, color: "var(--faint)" }}>None</div>}
          {later.map((j) => (
            <div key={j.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderTop: "1px solid var(--border)", fontSize: 12.5 }}>
              <JobChip id={j.id} />
              <span style={{ flex: 1 }} />
              <span style={{ color: "var(--body)" }}>{dayLabel(j.fitDate!)}</span>
              <Btn small kind="quiet" onClick={() => moveFit(j, -1)}>Earlier</Btn>
            </div>
          ))}
        </Card>
        <Card title="No fit date yet" sub="Open jobs that will need a crew">
          {unplanned.length === 0 && <div style={{ fontSize: 12.5, color: "var(--faint)" }}>Every fitted job has a date.</div>}
          {unplanned.map((j) => (
            <div key={j.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderTop: "1px solid var(--border)", fontSize: 12.5 }}>
              <JobChip id={j.id} />
              <span style={{ flex: 1, color: "var(--faint)", fontSize: 11.5 }}>{stageLabel(j.stage)} · due {dayLabel(j.due)}</span>
              <Btn small onClick={() => plan(j)}>Pencil in</Btn>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}

