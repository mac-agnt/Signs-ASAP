/* Installations: Fitting Calendar, Ready for Fit, Fitter Partners, Site Packs, Completion.
   In-house fit plus fictional partner crews. Nothing is dispatched or messaged. */

import { useState } from "react";
import {
  useDemo, getTab, go, openJob, installs, jobs, job, customer, fitter, workOrders, approvedProof, materials, payments, recordPayment,
  ackPack, markInstalled, confirmInstall, reassignFitter, moveInstall, setCompletion, surveyFor, eur, stageLabel, type DemoState,
} from "../model";
import { firstTab } from "../nav";
import { FITTERS, FITTER_NOTE, type Install } from "../data";
import { DEMO_TODAY, bdFromToday, dayLabel, relDay, sameDay, weekDays, weekdayShort } from "../dates";
import { Page, PageHead, Card, Grid, Badge, Btn, JobChip, Stat, Note, KV, Table, Empty, Label, ProofArt, Source, Meter, type Tone } from "../ui";
import { workshopUtilisation, useNarrow } from "./Production";

type Inst = Install;
const STATUS_TONE: Record<Inst["status"], Tone> = { booked: "ok", proposed: "warn", tentative: "muted", done: "info" };
const STATUS_LABEL: Record<Inst["status"], string> = { booked: "Booked", proposed: "Proposed", tentative: "Tentative", done: "Installed" };

let packSelected: string | null = null;
let completionSelected: string | null = null;
function openPack(id: string) { packSelected = id; go("Installations", "packs"); }

const fitterInitials = (id: string) => {
  const f = fitter(id);
  return f.kind === "internal" ? "IH" : f.name.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase();
};
function FitterTag({ id }: { id: string }) {
  const f = fitter(id);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, minWidth: 0 }}>
      <span style={{ width: 20, height: 20, borderRadius: 999, background: f.tint, color: "#0b0e10", fontSize: 9, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{fitterInitials(id)}</span>
      <span style={{ fontSize: 12.5, color: "var(--body)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</span>
    </span>
  );
}
function crewLoad(s: DemoState) {
  const up = installs(s).filter((i) => i.status !== "done" && bdFromToday(i.date) >= 0 && bdFromToday(i.date) < 10);
  return FITTERS.map((f) => ({ f, n: up.filter((i) => i.fitterId === f.id).length })).map((x) => ({ ...x, free: 10 - x.n }));
}
function jobQa(jobId: string, s: DemoState) {
  const wos = workOrders(s).filter((w) => w.jobId === jobId);
  return { done: wos.filter((w) => w.col === "fit").length, total: wos.length };
}

/* ── Fitting calendar ───────────────────────────────────────────────────── */
function InstallCard({ i }: { i: Inst }) {
  const j = job(i.jobId);
  const off = bdFromToday(i.date);
  return (
    <div className="sa-tile" onClick={() => openJob(i.jobId)} style={{ padding: "10px 11px", boxShadow: "inset 3px 0 0 " + fitter(i.fitterId).tint }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", minWidth: 0, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{j?.short}</span>
        <Badge tone={STATUS_TONE[i.status]} style={{ height: 20, fontSize: 10.5, padding: "0 7px" }}>{STATUS_LABEL[i.status]}</Badge>
      </div>
      <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 4 }}>{i.slot}</div>
      <div style={{ marginTop: 6 }}><FitterTag id={i.fitterId} /></div>
      {i.status !== "done" && (
        <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap", alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
          <Btn small kind="quiet" disabled={off <= 0} title="Earlier by one working day" onClick={() => moveInstall(i.id, off - 1)} style={{ padding: "0 8px" }}>Earlier</Btn>
          <Btn small kind="quiet" title="Later by one working day" onClick={() => moveInstall(i.id, off + 1)} style={{ padding: "0 8px" }}>Later</Btn>
          {i.status !== "booked" && <Btn small kind="primary" onClick={() => confirmInstall(i.id)}>Confirm</Btn>}
          <select aria-label="Fitting crew" value={i.fitterId} onChange={(e) => reassignFitter(i.id, e.target.value)}
            style={{ height: 28, maxWidth: "100%", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--body)", font: "inherit", fontSize: 11.5, padding: "0 6px" }}>
            {FITTERS.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

function Calendar() {
  const [s] = useDemo();
  const all = installs(s);
  const weeks = [weekDays(0), weekDays(1)];
  const lastDay = weeks[1][4];
  const later = all.filter((i) => i.date.getTime() > lastDay.getTime() && i.status !== "done").sort((a, b) => a.date.getTime() - b.date.getTime());
  const crews = crewLoad(s);
  const used = crews.reduce((a, c) => a + c.n, 0), totalDays = crews.length * 10;
  const util = workshopUtilisation(s);
  const booked = all.filter((i) => i.status === "booked").length;
  const pending = all.filter((i) => i.status === "proposed" || i.status === "tentative").length;
  const narrow = useNarrow();
  return (
    <>
      <PageHead kicker="Installations" title="Fitting calendar" sub="In-house fit and partner crews across the next two working weeks. Move a fit, swap the crew or confirm a proposed booking; each change is logged."
        actions={<Btn onClick={() => go("Installations", "packs")}>Site packs</Btn>} />
      <Grid min={180}>
        <Stat label="Fits booked" value={booked} tone="ok" sub="confirmed with a crew" />
        <Stat label="Waiting confirmation" value={pending} tone={pending ? "warn" : "ok"} sub="proposed or tentative" />
        <Stat label="Crew-days free" value={totalDays - used} sub={"of " + totalDays + " over 10 working days"} />
        <Stat label="Workshop load" value={util.pct.toFixed(0) + "%"} tone={util.pct > 95 ? "warn" : "accent"} sub="this week, the real constraint" onClick={() => go("Production", "capacity")} />
      </Grid>
      <Grid cols={narrow ? "1fr" : "minmax(0,1fr) minmax(260px,320px)"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          {weeks.map((wk, wi) => (
            <Card key={wi} title={wi === 0 ? "This week" : "Next week"} sub={dayLabel(wk[0]) + " to " + dayLabel(wk[4])} pad={false}>
              <div style={{ overflowX: "auto", padding: "4px 14px 14px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(150px,1fr))", gap: 8, minWidth: 780 }}>
                  {wk.map((d) => {
                    const list = all.filter((i) => sameDay(i.date, d));
                    const today = sameDay(d, DEMO_TODAY);
                    const past = d.getTime() < DEMO_TODAY.getTime() && !today;
                    return (
                      <div key={d.toISOString()} style={{ minHeight: 130, padding: 8, borderRadius: 14, border: "1px solid " + (today ? "var(--accent-line)" : "var(--border)"), background: today ? "var(--accent-faint)" : "var(--surface-faint)", opacity: past ? 0.6 : 1, display: "flex", flexDirection: "column", gap: 7 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6, padding: "0 2px" }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: today ? "var(--accent)" : "var(--ink)" }}>{weekdayShort(d)}</span>
                          <span style={{ fontSize: 11.5, color: "var(--faint)" }}>{d.getDate() + (today ? " · today" : "")}</span>
                          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--faint)" }}>{list.length ? list.length + " fit" + (list.length > 1 ? "s" : "") : ""}</span>
                        </div>
                        {list.map((i) => <InstallCard key={i.id} i={i} />)}
                        {list.length === 0 && <div style={{ fontSize: 11.5, color: "var(--faint)", padding: "6px 3px" }}>{past ? "" : "Crews free"}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          ))}
          {later.length > 0 && (
            <Card title="Pencilled in later" sub="Fits that depend on production finishing first">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {later.map((i) => (
                  <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12.5, minWidth: 92, color: "var(--ink)" }}>{dayLabel(i.date)}</span>
                    <JobChip id={i.jobId} />
                    <FitterTag id={i.fitterId} />
                    <Badge tone={STATUS_TONE[i.status]}>{STATUS_LABEL[i.status]}</Badge>
                    <span style={{ fontSize: 12, color: "var(--dim)" }}>{i.slot}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <Card title="Crew availability" sub="Next 10 working days">
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {crews.map(({ f, n }) => (
                <div key={f.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 3, background: f.tint }} />
                    <span style={{ fontSize: 12.5, flex: 1, color: "var(--body)", minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</span>
                    <span style={{ fontSize: 11.5, color: "var(--dim)" }}>{n + " booked"}</span>
                  </div>
                  <Meter value={n} max={10} tone="info" height={5} />
                </div>
              ))}
            </div>
          </Card>
          <Card title="Why fitting is flexible">
            <div style={{ fontSize: 12.5, color: "var(--body)", lineHeight: 1.6 }}>
              {"The partner crews and in-house fit have " + (totalDays - used) + " free crew-days in the next two weeks. The workshop, with five people and four stations, is at " + util.pct.toFixed(0) + "% this week. A busier year strains manufacture first, so fit dates follow the workshop, not the other way round."}
            </div>
            <div style={{ marginTop: 10 }}><Btn small kind="quiet" onClick={() => go("Production", "capacity")}>See workshop capacity</Btn></div>
          </Card>
        </div>
      </Grid>
    </>
  );
}

/* ── Ready for fit ──────────────────────────────────────────────────────── */
function ReadyForFit() {
  const [s] = useDemo();
  const all = installs(s);
  const js = jobs(s).filter((j) => j.stage === "ready" || j.stage === "booked" || (j.stage === "production" && all.some((i) => i.jobId === j.id && i.status !== "done")));
  type Row = { j: (typeof js)[number]; i?: Inst; qa: { done: number; total: number } };
  const rows: Row[] = js.map((j) => ({ j, i: all.find((x) => x.jobId === j.id && x.status !== "done"), qa: jobQa(j.id, s) }))
    .sort((a, b) => (a.i?.date.getTime() || 9e15) - (b.i?.date.getTime() || 9e15));
  const ready = rows.filter((r) => r.j.stage === "ready" || r.j.stage === "booked");
  const unacked = ready.filter((r) => r.i && !r.i.packAck).length;
  return (
    <>
      <PageHead kicker="Installations" title="Ready for fit" sub="Jobs that have passed QA, plus production jobs with a fit already pencilled in. Crews work from the site pack, not from memory." />
      <Grid min={180}>
        <Stat label="Ready or booked" value={ready.length} tone="ok" sub="QA signed off" />
        <Stat label="Packs not acknowledged" value={unacked} tone={unacked ? "warn" : "ok"} sub="crew has not confirmed the pack" />
        <Stat label="Coming from production" value={rows.length - ready.length} sub="fit date depends on the workshop" onClick={() => go("Production", "live")} />
      </Grid>
      <Card pad={false}>
        <div style={{ padding: 16 }}>
          <Table rows={rows} onRow={(r) => openJob(r.j.id)} rowTone={(r) => (r.j.stage === "production" ? undefined : r.i && !r.i.packAck ? "warn" : "ok")}
            cols={[
              { key: "job", label: "Job", width: "minmax(190px,1.6fr)", render: (r) => <div style={{ minWidth: 0 }}><div style={{ color: "var(--ink)", fontSize: 13 }}>{r.j.short}</div><div style={{ fontSize: 11.5, color: "var(--faint)" }}>{r.j.id + " · " + (customer(r.j.customerId)?.name || "")}</div></div> },
              { key: "stage", label: "Stage", width: "120px", render: (r) => <Badge tone={r.j.stage === "production" ? "accent" : r.j.stage === "booked" ? "ok" : "info"}>{stageLabel(r.j.stage)}</Badge> },
              { key: "qa", label: "QA", width: "90px", hideSm: true, render: (r) => <span style={{ fontSize: 12.5, color: r.qa.total && r.qa.done === r.qa.total ? "var(--ok)" : "var(--dim)" }}>{r.qa.total ? r.qa.done + "/" + r.qa.total + " signed" : "n/a"}</span> },
              { key: "fit", label: "Fit", width: "minmax(110px,1fr)", render: (r) => <span style={{ fontSize: 12.5 }}>{r.i ? relDay(r.i.date) + " · " + r.i.slot.split(" ")[0] : "Not booked"}</span> },
              { key: "crew", label: "Crew", width: "minmax(150px,1.2fr)", hideSm: true, render: (r) => (r.i ? <FitterTag id={r.i.fitterId} /> : <span style={{ color: "var(--faint)" }}>-</span>) },
              { key: "pack", label: "Pack", width: "110px", hideSm: true, render: (r) => (r.i ? <Badge tone={r.i.packAck ? "ok" : "warn"}>{r.i.packAck ? "Acknowledged" : "Not yet"}</Badge> : null) },
              { key: "act", label: "", width: "minmax(150px,1fr)", align: "right", render: (r) => r.i ? (
                <span style={{ display: "flex", gap: 6 }}>
                  {r.i.status !== "booked" && <Btn small kind="primary" onClick={() => confirmInstall(r.i!.id)}>Confirm</Btn>}
                  <Btn small onClick={() => openPack(r.i!.id)}>Site pack</Btn>
                </span>) : null },
            ]} />
        </div>
      </Card>
      <Source>Ready for fit only after a QA sign-off in Production. Partner crews see the pack; no messages are sent from this demo.</Source>
    </>
  );
}

/* ── Fitter partners ────────────────────────────────────────────────────── */
function Partners() {
  const [s] = useDemo();
  const all = installs(s);
  return (
    <>
      <PageHead kicker="Installations" title="Fitter partners" sub="In-house fit plus the partner crews Signs ASAP keeps on call. Pick by access kit and strengths, not by who answered first." />
      <Grid min={300}>
        {FITTERS.map((f) => {
          const up = all.filter((i) => i.fitterId === f.id && i.status !== "done").sort((a, b) => a.date.getTime() - b.date.getTime());
          const done = all.filter((i) => i.fitterId === f.id && i.status === "done");
          const in10 = up.filter((i) => bdFromToday(i.date) < 10).length;
          return (
            <Card key={f.id} title={<span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}><span style={{ width: 26, height: 26, borderRadius: 999, background: f.tint, color: "#0b0e10", fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{fitterInitials(f.id)}</span>{f.name}</span>}
              sub={f.crew} right={<Badge tone={f.kind === "internal" ? "accent" : "info"}>{f.kind === "internal" ? "In-house" : "Partner"}</Badge>}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <KV k="Strengths" v={f.strengths} />
                <KV k="Access kit" v={f.access} />
                <KV k="Area" v={f.area} />
                <KV k="Next 10 days" v={in10 + " booked · " + (10 - in10) + " free"} />
              </div>
              <Label style={{ margin: "14px 0 8px" }}>Upcoming</Label>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {up.map((i) => (
                  <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, color: "var(--ink)", minWidth: 86 }}>{relDay(i.date)}</span>
                    <JobChip id={i.jobId} />
                    <Badge tone={STATUS_TONE[i.status]}>{STATUS_LABEL[i.status]}</Badge>
                  </div>
                ))}
                {up.length === 0 && <span style={{ fontSize: 12, color: "var(--faint)" }}>Nothing booked. Available.</span>}
              </div>
              {done.length > 0 && <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 10 }}>{"Recently completed: " + done.map((i) => job(i.jobId)?.short).join(", ")}</div>}
            </Card>
          );
        })}
      </Grid>
      <Source>{FITTER_NOTE}</Source>
    </>
  );
}

/* ── Site packs ─────────────────────────────────────────────────────────── */
function ObstacleMap({ obs }: { obs: { id: string; tag: string; x: number; y: number; note: string }[] }) {
  return (
    <div style={{ position: "relative", aspectRatio: "16/7", borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden", background: "linear-gradient(180deg,#1a2126,#12171b)" }}>
      <div style={{ position: "absolute", left: "8%", right: "8%", top: "26%", height: "26%", border: "2px dashed rgba(244,147,19,.6)", borderRadius: 6 }} />
      <div style={{ position: "absolute", left: "8%", top: "16%", fontSize: 10, color: "rgba(244,147,19,.85)" }}>Sign zone</div>
      <div style={{ position: "absolute", left: "40%", width: "20%", top: "56%", bottom: 0, background: "rgba(255,255,255,.06)", borderTop: "2px solid rgba(255,255,255,.14)" }} />
      <div style={{ position: "absolute", left: "40%", top: "60%", fontSize: 10, color: "rgba(255,255,255,.4)", width: "20%", textAlign: "center" }}>Entrance</div>
      {obs.map((o, n) => (
        <div key={o.id} title={o.tag + ": " + o.note} style={{ position: "absolute", left: o.x + "%", top: o.y + "%", transform: "translate(-50%,-50%)", display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 22, height: 22, borderRadius: 999, background: "#ef5b5b", color: "#fff", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 3px rgba(239,91,91,.25)" }}>{n + 1}</span>
        </div>
      ))}
      <div style={{ position: "absolute", right: 10, bottom: 8, fontSize: 10, color: "rgba(255,255,255,.45)" }}>Survey sketch (placeholder diagram)</div>
    </div>
  );
}

function SitePacks() {
  const [s] = useDemo();
  const all = installs(s).slice().sort((a, b) => a.date.getTime() - b.date.getTime());
  const open = all.filter((i) => i.status !== "done");
  const [sel, setSelState] = useState<string | null>(packSelected || open[0]?.id || null);
  const [confirmDone, setConfirmDone] = useState(false);
  const setSel = (id: string) => { packSelected = id; setSelState(id); setConfirmDone(false); };
  const i = all.find((x) => x.id === sel) || open[0];
  const j = i ? job(i.jobId, s) : undefined;
  const sv = i ? surveyFor(i.jobId) : undefined;
  const obs = sv ? sv.obstacles.concat(s.surveyObstacles[sv.id] || []) : [];
  const p = i ? approvedProof(i.jobId, s) : undefined;
  const wos = i ? workOrders(s).filter((w) => w.jobId === i.jobId) : [];
  const mats = i ? materials(s).filter((m) => m.jobId === i.jobId) : [];
  const f = i ? fitter(i.fitterId) : undefined;
  const qa = i ? jobQa(i.jobId, s) : { done: 0, total: 0 };
  const narrow = useNarrow();
  return (
    <>
      <PageHead kicker="Installations" title="Site packs" sub="What the crew sees on a phone at the site: where, who to ask for, how to get in, the approved drawing, materials, and every obstacle the owner tagged on survey." />
      <Grid cols={narrow ? "1fr" : "minmax(220px,300px) minmax(0,1fr)"}>
        <Card>
          <Label style={{ marginBottom: 8 }}>{"Upcoming (" + open.length + ")"}</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {all.map((x) => {
              const xj = job(x.jobId, s);
              const on = i && x.id === i.id;
              return (
                <button type="button" key={x.id} onClick={() => setSel(x.id)} className="sa-click"
                  style={{ textAlign: "left", font: "inherit", padding: "10px 12px", borderRadius: 12, border: "1px solid " + (on ? "var(--accent-line)" : "var(--border)"), background: on ? "var(--accent-faint)" : "var(--surface-faint)", color: "var(--ink)", opacity: x.status === "done" ? 0.6 : 1 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{xj?.short}</span>
                    {x.status === "done" ? <Badge tone="info">Installed</Badge> : x.packAck ? <Badge tone="ok">Ack</Badge> : <Badge tone="warn">New</Badge>}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 3 }}>{relDay(x.date) + " · " + fitter(x.fitterId).name}</div>
                </button>
              );
            })}
          </div>
        </Card>
        {i && j && f ? (
          <Card title={j.title} sub={(customer(j.customerId)?.name || "") + " · " + j.id}
            right={<><Badge tone={STATUS_TONE[i.status]}>{STATUS_LABEL[i.status]}</Badge><Badge tone={i.packAck ? "ok" : "warn"}>{i.packAck ? "Pack acknowledged" : "Not acknowledged"}</Badge></>}>
            <Grid min={160} gap={8}>
              <KV k="When" v={dayLabel(i.date) + " · " + i.slot} />
              <KV k="Crew" v={f.name + " (" + f.crew + ")"} />
              <KV k="Site" v={j.site} />
              <KV k="Ask for" v={i.contactRole + " (contact role only in demo)"} />
            </Grid>
            <Note tone="info" style={{ marginTop: 10 }}><b>Access: </b>{i.access}{sv ? ". " + sv.access : ""}</Note>
            {(j.safety || wos.some((w) => w.safety)) && <Note tone="warn" style={{ marginTop: 8 }}><b>Safety: </b>{[j.safety].concat(wos.map((w) => w.safety)).filter(Boolean).join(" ")}</Note>}
            <Grid cols="repeat(auto-fit,minmax(280px,1fr))" gap={16} style={{ marginTop: 16 }}>
              <div>
                <Label style={{ marginBottom: 8 }}>Approved drawing</Label>
                {p ? (
                  <>
                    <ProofArt swatch={p.swatch} label={"Proof v" + p.v + " · approved " + dayLabel(p.date)} lit={j.kind === "led"} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                      <KV k="Size" v={p.size} />
                      <KV k="Lighting" v={p.lighting} />
                      <KV k="Substrate" v={p.substrate} />
                      <KV k="Colours" v={p.pantone} />
                    </div>
                  </>
                ) : <Note tone="bad">No approved proof. Do not fit until a version is signed off.</Note>}
              </div>
              <div>
                <Label style={{ marginBottom: 8 }}>{"Survey obstacles" + (obs.length ? " (" + obs.length + ")" : "")}</Label>
                {sv ? (
                  <>
                    <ObstacleMap obs={obs} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                      {obs.map((o, n) => (
                        <div key={o.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12.5 }}>
                          <span style={{ width: 18, height: 18, borderRadius: 999, background: "var(--bad)", color: "#fff", fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none", marginTop: 1 }}>{n + 1}</span>
                          <Badge tone="warn">{o.tag}</Badge>
                          <span style={{ color: "var(--body)", lineHeight: 1.45 }}>{o.note}</span>
                        </div>
                      ))}
                      {obs.length === 0 && <span style={{ fontSize: 12, color: "var(--dim)" }}>No obstacles tagged.</span>}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                      <KV k="Fixing height" v={sv.mountHeight} />
                      <KV k="Power" v={sv.power} />
                    </div>
                    {sv.illustrativeDims && <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 6 }}>Survey dimensions are demo examples, not confirmed measurements.</div>}
                  </>
                ) : <Note>No site survey on file for this job. Use the approved drawing and check fixings on arrival.</Note>}
              </div>
            </Grid>
            <Label style={{ margin: "16px 0 8px" }}>Load list</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {wos.map((w) => (
                <div key={w.id} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", padding: "8px 10px", borderRadius: 10, background: "var(--surface-faint)", border: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 12.5, color: "var(--ink)", flex: "1 1 200px" }}>{w.title}</span>
                  <span style={{ fontSize: 12, color: "var(--dim)", flex: "1 1 160px" }}>{w.dims}</span>
                  <Badge tone={w.col === "fit" ? "ok" : "warn"}>{w.col === "fit" ? "QA passed" : "Still in workshop"}</Badge>
                </div>
              ))}
              {mats.filter((m) => m.status !== "Short").map((m) => (
                <div key={m.id} style={{ fontSize: 12, color: "var(--dim)", padding: "0 10px" }}>{m.name + " · " + m.qty}</div>
              ))}
              <div style={{ fontSize: 12, color: "var(--dim)", padding: "0 10px" }}>{"Crew kit: " + f.access}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "var(--faint)", flex: 1, minWidth: 220 }}>{qa.total && qa.done < qa.total ? "QA not finished for every item: fit only what has passed." : "Simulated handoff: nothing is sent to the crew from this demo."}</span>
              {i.status !== "done" && <Btn disabled={i.packAck} onClick={() => ackPack(i.id)}>{i.packAck ? "Acknowledged" : "Acknowledge pack"}</Btn>}
              {i.status !== "done" && !confirmDone && <Btn kind="primary" onClick={() => setConfirmDone(true)}>Mark installed</Btn>}
              {i.status !== "done" && confirmDone && (
                <>
                  <Btn kind="quiet" onClick={() => setConfirmDone(false)}>Cancel</Btn>
                  <Btn kind="primary" onClick={() => { markInstalled(i.id); setConfirmDone(false); completionSelected = i.jobId; go("Installations", "completion"); }}>Confirm installed</Btn>
                </>
              )}
              {i.status === "done" && <Btn kind="primary" onClick={() => { completionSelected = i.jobId; go("Installations", "completion"); }}>Completion record</Btn>}
            </div>
          </Card>
        ) : <Card><Empty title="No site packs" sub="Packs appear when a fit is pencilled in." /></Card>}
      </Grid>
    </>
  );
}

/* ── Completion ─────────────────────────────────────────────────────────── */
const PUNCH = [
  { id: "clean", label: "Site cleaned, packaging and old sign removed" },
  { id: "walk", label: "Walk-round with the customer" },
  { id: "photos", label: "Before and after photos uploaded" },
  { id: "elec", label: "Electrical connection signed off by customer's electrician", led: true },
  { id: "snag", label: "Snags closed (none open)" },
];
function Completion() {
  const [s] = useDemo();
  const done = jobs(s).filter((j) => j.stage === "completed");
  const [sel, setSelState] = useState<string | null>(completionSelected || done[0]?.id || null);
  const setSel = (id: string) => { completionSelected = id; setSelState(id); };
  const j = done.find((x) => x.id === sel) || done[0];
  const nextUp = jobs(s).filter((x) => x.stage === "ready" || x.stage === "booked");
  const narrow = useNarrow();
  if (!j) return <><PageHead kicker="Installations" title="Completion" /><Card><Empty title="No completed jobs yet" /></Card></>;
  const seed = j.id === "JOB-26046";
  const comp = s.completion[j.id];
  const accepted = comp ? comp.accepted : seed;
  const punch = PUNCH.filter((p) => !p.led || j.kind === "led");
  const ticked = (id: string) => (comp && comp.punch[id] !== undefined ? comp.punch[id] : seed);
  const allTicked = punch.every((p) => ticked(p.id));
  const pays = payments(s).filter((p) => p.jobId === j.id);
  const paid = pays.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0);
  const inst = installs(s).find((x) => x.jobId === j.id);
  const p = approvedProof(j.id, s);
  const balance = Math.max(0, j.price - paid);
  return (
    <>
      <PageHead kicker="Installations" title="Completion" sub="Close the job properly: photos, customer acceptance, punch list, then the balance. An installed job flows into Finance, Records and Activity."
        actions={<><Btn onClick={() => go("Finance", "deposits")}>Finance</Btn><Btn onClick={() => go("Records", "jobs")}>Records</Btn><Btn onClick={() => go("Activity", "byjob")}>Activity</Btn></>} />
      <Grid cols={narrow ? "1fr" : "minmax(220px,300px) minmax(0,1fr)"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <Card>
            <Label style={{ marginBottom: 8 }}>{"Completed (" + done.length + ")"}</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {done.map((x) => (
                <button type="button" key={x.id} onClick={() => setSel(x.id)} className="sa-click"
                  style={{ textAlign: "left", font: "inherit", padding: "10px 12px", borderRadius: 12, border: "1px solid " + (x.id === j.id ? "var(--accent-line)" : "var(--border)"), background: x.id === j.id ? "var(--accent-faint)" : "var(--surface-faint)", color: "var(--ink)" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{x.short}</div>
                  <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 2 }}>{x.id + " · " + eur(x.price)}</div>
                </button>
              ))}
            </div>
          </Card>
          {nextUp.length > 0 && (
            <Card title="Next to complete">
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {nextUp.map((x) => {
                  const xi = installs(s).find((y) => y.jobId === x.id && y.status !== "done");
                  return (
                    <div key={x.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12.5, flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{x.short}</span>
                      {xi && <Btn small kind="quiet" onClick={() => openPack(xi.id)}>{relDay(xi.date)}</Btn>}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
        <Card title={j.title} sub={(customer(j.customerId)?.name || "") + " · " + j.id} right={<><Badge tone="ok">Installed</Badge><Badge tone={accepted ? "ok" : "warn"}>{accepted ? "Customer accepted" : "Awaiting acceptance"}</Badge></>}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {["Before", "After"].map((b, n) => (
              <div key={b} style={{ position: "relative", aspectRatio: "16/9", borderRadius: 14, overflow: "hidden", border: "1px solid var(--border)",
                background: n === 0 ? "linear-gradient(160deg,#2a2e31,#171a1c)" : "linear-gradient(160deg,#16303b,#0d1518)" }}>
                {n === 1 && <div style={{ position: "absolute", left: "10%", right: "10%", top: "30%", height: "24%", borderRadius: 4, background: (p?.swatch[0] || "#2b4c3f"), boxShadow: j.kind === "led" ? "0 0 26px " + (p?.swatch[1] || "#fff") + "55" : "none" }} />}
                {n === 0 && <div style={{ position: "absolute", left: "10%", right: "10%", top: "30%", height: "24%", borderRadius: 4, border: "2px dashed rgba(255,255,255,.18)" }} />}
                <div style={{ position: "absolute", left: 10, bottom: 8, fontSize: 11, color: "rgba(255,255,255,.65)" }}>{b + " · photo placeholder"}</div>
              </div>
            ))}
          </div>
          <Grid cols="repeat(auto-fit,minmax(260px,1fr))" gap={16} style={{ marginTop: 16 }}>
            <div>
              <Label style={{ marginBottom: 8 }}>Punch list</Label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {punch.map((pi) => {
                  const on = ticked(pi.id);
                  return (
                    <label key={pi.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", borderRadius: 12, border: "1px solid var(--border)", background: on ? "var(--ok-soft)" : "var(--surface-faint)", cursor: "pointer" }}>
                      <input type="checkbox" checked={on} onChange={() => {
                        const base: Record<string, boolean> = {};
                        punch.forEach((x) => { base[x.id] = ticked(x.id); });
                        setCompletion(j.id, { accepted, punch: { ...base, [pi.id]: !on } });
                      }} style={{ accentColor: "var(--ok)", width: 16, height: 16 }} />
                      <span style={{ fontSize: 12.5, color: "var(--ink)" }}>{pi.label}</span>
                    </label>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
                <Btn kind={accepted ? "ghost" : "primary"} disabled={!allTicked && !accepted} title={!allTicked ? "Close the punch list first" : ""}
                  onClick={() => {
                    const base: Record<string, boolean> = {};
                    punch.forEach((x) => { base[x.id] = ticked(x.id); });
                    setCompletion(j.id, { accepted: !accepted, punch: base });
                  }}>{accepted ? "Undo acceptance" : "Record customer acceptance"}</Btn>
                {!allTicked && !accepted && <span style={{ fontSize: 11.5, color: "var(--faint)" }}>Close the punch list first</span>}
              </div>
            </div>
            <div>
              <Label style={{ marginBottom: 8 }}>Balance</Label>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-.6px", color: balance ? "var(--warn)" : "var(--ok)" }}>{balance ? eur(balance) : "Paid in full"}</span>
                <span style={{ fontSize: 12, color: "var(--dim)" }}>{eur(paid) + " of " + eur(j.price) + " received"}</span>
              </div>
              <Meter value={paid} max={j.price || 1} tone="ok" />
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                {pays.map((pp) => (
                  <div key={pp.id} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 12.5 }}>
                    <span style={{ color: "var(--body)", minWidth: 90 }}>{pp.kind}</span>
                    <span className="sa-mono" style={{ color: "var(--ink)" }}>{eur(pp.amount)}</span>
                    <Badge tone={pp.status === "paid" ? "ok" : "warn"}>{pp.status === "paid" ? "Paid" : "Invoiced"}</Badge>
                    {pp.status !== "paid" && <Btn small onClick={() => recordPayment(pp.id)}>Record payment</Btn>}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 8 }}>Balance trigger is a proposal to the accounts package (not connected). Ledger values are illustrative.</div>
            </div>
          </Grid>
          <Label style={{ margin: "16px 0 8px" }}>Service record</Label>
          <Grid min={160} gap={8}>
            <KV k="Installed" v={inst ? dayLabel(inst.date) : "-"} />
            <KV k="Crew" v={inst ? fitter(inst.fitterId).name : "-"} />
            <KV k="Built from" v={p ? "Proof v" + p.v + " · " + p.substrate : "-"} />
            <KV k="Suggested check" v={j.kind === "led" ? "LED function and fixings at 12 months" : "Panels and fixings after winter storms"} />
          </Grid>
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            <JobChip id={j.id} />
            <Btn small kind="quiet" onClick={() => go("Finance", "qva")}>Quote vs actual</Btn>
            <Btn small kind="quiet" onClick={() => go("Activity", "byjob")}>Job history</Btn>
          </div>
        </Card>
      </Grid>
    </>
  );
}

export default function Installations(_props: { v: any }) {
  useDemo();
  const tab = getTab("Installations", firstTab("Installations"));
  return (
    <Page>
      {tab === "calendar" && <Calendar />}
      {tab === "ready" && <ReadyForFit />}
      {tab === "partners" && <Partners />}
      {tab === "packs" && <SitePacks />}
      {tab === "completion" && <Completion />}
    </Page>
  );
}

