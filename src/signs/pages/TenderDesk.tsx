/* Tender Desk: the hero journey. A multi-floor tender pack becomes a counted,
   page-referenced quantity table and an editable costing draft. Nothing is
   firm-priced without the owner, and nothing is ever sent. */

import { Fragment, useState, type ReactNode } from "react";
import {
  useDemo, getTab, go, tenderCalc, tenderStatus, editTender, resetTenderEdits, runExtraction, setTenderStatus,
  ackTenderWarning, update, log, toast, eur, pct, num, margin, job, stageLabel, type DemoState, type TenderCalc,
} from "../model";
import { firstTab } from "../nav";
import { COMPANY, TENDER_DRAFT, TENDER_WON, TENDER_ARCHIVE, TENDER_STAGES, type Tender, type TenderLine } from "../data";
import { DEMO_TODAY, relDay, dayLabel, dateLabel, stamp, timeLabel } from "../dates";
import {
  Page, PageHead, Grid, Card, Badge, Btn, Stat, NumField, Seg, Note, Label, JobChip, Table, Donut, Legend, Source, Empty, Meter, type Tone,
} from "../ui";

const DRAFT = TENDER_DRAFT;
const WON = TENDER_WON;
const FLOOR_NAMES = ["Ground", "1st", "2nd", "3rd", "4th", "5th"];

/* ── shared helpers ─────────────────────────────────────────────────────── */
let lastSel: string | null = null;
function useTenderSel(extracted: boolean): [string, (id: string) => void] {
  const [sel, setSel] = useState<string>(() => lastSel || (extracted ? DRAFT.id : WON.id));
  return [sel, (id: string) => { lastSel = id; setSel(id); }];
}

const tenderById = (id: string): Tender => (id === WON.id ? WON : DRAFT);

function perFloor(l: TenderLine): { floor: string; qty: number }[] {
  if (!l.floors || l.floors.indexOf("G") !== 0) return [{ floor: l.floors || "Site", qty: l.qty }];
  const m = l.sourceText.match(/Qty per floor:\s*(.+)$/);
  if (m) {
    const parts = m[1].split(",").map((p) => parseInt(p.trim().split(/\s+/)[1], 10));
    if (parts.length === 6 && parts.every((n) => Number.isFinite(n)) && parts.reduce((a, b) => a + b, 0) === l.qty) {
      return FLOOR_NAMES.map((f, i) => ({ floor: f, qty: parts[i] }));
    }
  }
  const base = Math.floor(l.qty / 6), rem = l.qty % 6;
  return FLOOR_NAMES.map((f, i) => ({ floor: f, qty: base + (i < rem ? 1 : 0) }));
}

function warningKeys(): { key: string; text: string; where: string }[] {
  return DRAFT.warnings.map((w, i) => ({ key: "tw-" + i, text: w, where: "Tender pack" }))
    .concat(DRAFT.lines.filter((l) => l.warning).map((l) => ({ key: "lw-" + l.id, text: l.warning as string, where: l.label + " · " + l.source })));
}

const marginTone = (m: number, floor: number): Tone => (m < floor ? "bad" : m < floor + 5 ? "warn" : "ok");

function TenderSwitch({ sel, setSel, extracted }: { sel: string; setSel: (id: string) => void; extracted: boolean }) {
  return (
    <Seg
      value={sel}
      onChange={setSel}
      options={[
        { id: DRAFT.id, label: <span>Draft {DRAFT.id}{extracted ? "" : " (not extracted)"}</span> },
        { id: WON.id, label: <span>Won {WON.id} · {eur(WON.value || 0)}</span> },
      ]}
    />
  );
}

function StatusBadge({ t, s }: { t: Tender; s: DemoState }) {
  const st = tenderStatus(t, s);
  const map: Record<string, [Tone, string]> = {
    won: ["ok", "Won"], new: ["info", "New, not extracted"], extracted: ["warn", "Draft extracted"], review: ["accent", "In owner review"],
    approved: ["ok", "Approved by owner, not sent"], archived: ["muted", "Archived"],
  };
  const [tone, label] = map[st] || ["muted", st];
  return <Badge tone={tone} dot>{label}</Badge>;
}

/* ── Inbox ──────────────────────────────────────────────────────────────── */
function Inbox({ s }: { s: DemoState }) {
  const st = tenderStatus(DRAFT, s);
  const extracted = s.tenderStage >= 5;
  const running = s.tenderStage > 0 && s.tenderStage < 5;
  const wonCalc = tenderCalc(WON, s);
  const wonJob = job("JOB-26041", s);
  const signTypes = DRAFT.lines.map((l) => l.signType);
  const archiveWon = TENDER_ARCHIVE.filter((a) => a.result.indexOf("Won") === 0);
  return (
    <Page>
      <PageHead
        kicker="Tender Desk"
        title="A day of counting, turned into a checkable draft"
        sub="Tender packs land here. The estimator counts every sign against the schedules and drawings, shows the page it came from, and flags what the pack does not say. You set the price."
        actions={<>
          <Btn kind="quiet" onClick={() => go("Tenders", "archive")}>Archive</Btn>
          <Btn kind="primary" onClick={() => { if (!extracted && !running) runExtraction(); go("Tenders", "extract"); }}>
            {extracted ? "View extraction" : running ? "Extraction running" : "Extract new tender"}
          </Btn>
        </>}
      />
      <Grid min={190}>
        <Stat label="Open tender packs" value={st === "approved" ? 0 : 1} sub={st === "approved" ? "Draft approved, ready for manual submission" : "College Campus Directory, due " + relDay(DRAFT.due)} />
        <Stat label="Manual count today" value="Up to a day" sub="Owner's estimate for a multi-floor pack" />
        <Stat label="Recent win" value={eur(WON.value || 0)} tone="ok" sub={"College wayfinding, now " + (wonJob ? stageLabel(wonJob.stage).toLowerCase() : "in procurement")} onClick={() => go("Jobs", "live")} />
        <Stat label="Tender record" value={archiveWon.length + " of " + TENDER_ARCHIVE.length} sub="Won in the archive (illustrative history)" onClick={() => go("Tenders", "archive")} />
      </Grid>

      <Grid cols="minmax(0,1.55fr) minmax(0,1fr)" min={320} style={{ alignItems: "start" }}>
        {/* incoming tender as an email with attachment */}
        <Card pad={false} style={{ overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface-faint)" }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, background: "var(--teal-soft)", color: "var(--teal)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16v12H4z M4 7l8 6 8-6" /></svg>
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 600 }}>{DRAFT.client}</div>
              <div style={{ fontSize: 11.5, color: "var(--faint)" }}>to tenders inbox · {stamp(DRAFT.received)} · mock inbox, no live mailbox read</div>
            </div>
            <StatusBadge t={DRAFT} s={s} />
          </div>
          <div style={{ padding: "16px 20px 20px" }}>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.3px" }}>Invitation to tender: {DRAFT.title}</div>
            <div style={{ fontSize: 13, color: "var(--dim)", marginTop: 6, lineHeight: 1.55 }}>
              Supply and install of internal wayfinding across {DRAFT.floors} floors plus an external entrance totem. Return by {dayLabel(DRAFT.due)}. Tender pack attached.
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, padding: "12px 14px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--surface-2)" }}>
              <span style={{ width: 38, height: 46, borderRadius: 6, background: "linear-gradient(180deg,#e25b4b,#b8382b)", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 6, flex: "none" }}>PDF</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{DRAFT.file}</div>
                <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 3 }}>{DRAFT.pages} pages · {DRAFT.docs.length} sections · schedules, drawings, specification</div>
              </div>
              <Badge tone="warn">Due {relDay(DRAFT.due)}</Badge>
            </div>

            <Grid min={150} gap={10} style={{ marginTop: 14 }}>
              <Mini k="Floors" v={DRAFT.floors + " (Ground to 5th)"} />
              <Mini k="Sign types found" v={signTypes.length + ": " + signTypes.join(", ")} />
              <Mini k="Drawings" v={DRAFT.docs.filter((d) => /plan|A-/.test(d.name)).map((d) => d.name.replace(/ A-.*/, "")).join(", ")} />
              <Mini k="Specification" v={"Section 4, " + (DRAFT.docs.find((d) => d.name.indexOf("Spec") === 0)?.pages || "")} />
            </Grid>

            <Label style={{ marginTop: 16 }}>Requirements in the pack</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 8 }}>
              {DRAFT.requirements.map((r) => <Badge key={r} tone="muted">{r}</Badge>)}
            </div>

            <Note tone="warn" style={{ marginTop: 14 }}>
              Pre-scan confidence is high on quantities and low on the totem: illumination, foundation and tactile requirements are not stated in the pack. The estimator will flag these, not guess them.
            </Note>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16, alignItems: "center" }}>
              <Btn kind="primary" onClick={() => { if (!extracted && !running) runExtraction(); go("Tenders", "extract"); }}>
                {extracted ? "Open extraction" : running ? "Watch extraction" : "Extract tender"}
              </Btn>
              {extracted && <Btn onClick={() => { lastSel = DRAFT.id; go("Tenders", "quantities"); }}>Quantities</Btn>}
              {extracted && <Btn onClick={() => { lastSel = DRAFT.id; go("Tenders", "costing"); }}>Costing</Btn>}
              <span style={{ fontSize: 11.5, color: "var(--faint)", marginLeft: 4 }}>Extraction is simulated with deterministic results. No document leaves the demo.</span>
            </div>
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <Card tone="ok" title="Won tender, kept as the rate reference" sub="A separate tender. Already won and in production planning, not this draft."
            right={<Badge tone="ok" dot>Won</Badge>}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}>
              <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-.8px" }}>{eur(WON.value || 0)}</div>
              <div style={{ fontSize: 12.5, color: "var(--dim)" }}>{WON.title}</div>
            </div>
            <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <JobChip id="JOB-26041" />
              {wonJob && <Badge tone="warn">{stageLabel(wonJob.stage)}</Badge>}
            </div>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 7 }}>
              {wonCalc.lines.map((l) => (
                <Row key={l.id} left={num(l.qty) + " × " + l.label.toLowerCase()} right={eur(l.sell)} />
              ))}
              <Row left="Installation / site fitting" right={eur(wonCalc.fitting)} />
              <Row left="Artwork / proofing" right={eur(wonCalc.artwork)} />
              <div style={{ height: 1, background: "var(--border)", margin: "3px 0" }} />
              <Row left={<b style={{ color: "var(--ink)" }}>Quoted</b>} right={<b style={{ color: "var(--ink)" }}>{eur(wonCalc.sell)}</b>} />
              <Row left="Estimated cost" right={eur(wonCalc.cost)} />
              <Row left="Gross margin" right={<span style={{ color: "var(--ok)" }}>{eur(wonCalc.profit)} · {pct(wonCalc.marginPct)}</span>} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
              <Btn small onClick={() => { lastSel = WON.id; go("Tenders", "quantities"); }}>See quantities</Btn>
              <Btn small onClick={() => { lastSel = WON.id; go("Tenders", "costing"); }}>See cost model</Btn>
            </div>
            <Source>€7,500 award is from the call. Cost lines are an illustrative demo model.</Source>
          </Card>

          <Card title="Recent tenders" sub="Illustrative history" right={<Btn small kind="quiet" onClick={() => go("Tenders", "archive")}>All</Btn>}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {TENDER_ARCHIVE.slice().reverse().map((a, i) => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderTop: i ? "1px solid var(--border)" : "0" }}>
                  <span className="sa-mono" style={{ fontSize: 11, color: "var(--faint)", width: 58, flex: "none" }}>{a.id}</span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: "var(--body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</span>
                  <Badge tone={a.result.indexOf("Won") === 0 ? "ok" : a.result.indexOf("Lost") === 0 ? "bad" : "muted"}>{a.result.split(" · ")[0]}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Grid>
    </Page>
  );
}

function Mini({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="sa-kv">
      <div className="sa-label">{k}</div>
      <div style={{ fontSize: 12.5, color: "var(--ink)", marginTop: 5, lineHeight: 1.4 }}>{v}</div>
    </div>
  );
}
function Row({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 10, fontSize: 12.5, color: "var(--dim)" }}>
      <span style={{ flex: 1, minWidth: 0 }}>{left}</span>
      <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--body)" }}>{right}</span>
    </div>
  );
}

/* ── AI Extract ─────────────────────────────────────────────────────────── */
function Extract({ s }: { s: DemoState }) {
  const stage = s.tenderStage;
  const done = stage >= 5;
  const running = stage > 0 && !done;
  const [focus, setFocus] = useState<string | null>(null);
  const calc = tenderCalc(DRAFT, s);
  const items = calc.lines.reduce((a, l) => a + l.qty, 0);
  const warns = warningKeys();

  return (
    <Page>
      <PageHead
        kicker="AI Extract"
        title={DRAFT.title}
        sub={DRAFT.file + " · " + DRAFT.pages + " pages. Every extracted line carries the page it came from. Where the pack is silent, the line is flagged instead of filled in."}
        actions={<>
          {stage === 0 && <Btn kind="primary" onClick={runExtraction}>Run extraction</Btn>}
          {done && <Btn onClick={runExtraction}>Run again</Btn>}
          <Btn kind={done ? "primary" : "ghost"} disabled={!done} onClick={() => { lastSel = DRAFT.id; go("Tenders", "quantities"); }}>Open quantities</Btn>
        </>}
      />

      <Card pad={false}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(" + TENDER_STAGES.length + ",minmax(0,1fr))", gap: 0 }}>
          {TENDER_STAGES.map((label, i) => {
            const isDone = done || i < stage - 1;
            const isNow = running && i === stage - 1;
            const c = isDone ? "var(--ok)" : isNow ? "var(--accent)" : "var(--faint)";
            return (
              <div key={label} style={{ padding: "14px 16px", borderLeft: i ? "1px solid var(--border)" : "0", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 20, height: 20, borderRadius: 10, flex: "none", display: "flex", alignItems: "center", justifyContent: "center",
                    border: "1px solid " + c, background: isDone ? "var(--ok-soft)" : isNow ? "var(--accent-soft)" : "none", color: c, fontSize: 10.5, fontWeight: 700,
                    animation: isNow ? "saPulse 1.1s ease-in-out infinite" : undefined }}>
                    {isDone ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg> : i + 1}
                  </span>
                  <span style={{ fontSize: 12.5, color: isDone || isNow ? "var(--ink)" : "var(--dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ padding: "0 16px 14px" }}>
          <Meter value={done ? 5 : Math.max(0, stage - 0.5)} max={5} tone={done ? "ok" : "accent"} />
        </div>
      </Card>

      {stage === 0 ? (
        <Card>
          <Empty title="Not extracted yet" sub="Run the estimator on the tender pack. It reads the schedules, counts every sign by floor and lists what is missing."
            action={<Btn kind="primary" onClick={runExtraction}>Run extraction</Btn>} />
        </Card>
      ) : (
        <Grid cols="minmax(0,1fr) minmax(0,1.25fr)" min={340} style={{ alignItems: "start" }}>
          {/* source pane */}
          <Card pad={false} style={{ overflow: "hidden" }} title="Source document" sub="Mock view of the tender pack with the passages the estimator used">
            <div style={{ position: "relative", margin: "4px 16px 16px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface-faint)", overflow: "hidden" }}>
              {running && <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: "40%", pointerEvents: "none", background: "linear-gradient(180deg,transparent,var(--accent-faint),transparent)", animation: "saScan 1.6s linear infinite" }} />}
              <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "var(--ink)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{DRAFT.file}</span>
                <Badge tone="muted">{DRAFT.pages} pp</Badge>
              </div>
              <div style={{ padding: "8px 14px 4px" }}>
                <Label>Sections read</Label>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
                  {DRAFT.docs.map((d) => (
                    <div key={d.name} style={{ display: "flex", gap: 10, fontSize: 12, color: "var(--body)" }}>
                      <span style={{ flex: 1, minWidth: 0 }}>{d.name}</span>
                      <span className="sa-mono" style={{ color: "var(--faint)" }}>{d.pages}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                <Label>Excerpts</Label>
                {calc.lines.map((l, i) => {
                  const shown = stage >= 2 + Math.min(i, 2) || done;
                  if (!shown) return null;
                  const on = focus === l.id;
                  return (
                    <div key={l.id} onClick={() => setFocus(on ? null : l.id)} className="sa-click"
                      style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid " + (on ? "var(--accent-line)" : "var(--border)"), background: on ? "var(--accent-faint)" : "var(--surface)", transition: "background .2s var(--ease),border-color .2s var(--ease)" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span className="sa-mono" style={{ fontSize: 10.5, color: "var(--accent)" }}>{l.source}</span>
                        {l.warning && stage >= 4 && <Badge tone="warn" style={{ height: 18, fontSize: 10.5 }}>ambiguous</Badge>}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--body)", marginTop: 5, lineHeight: 1.5, fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace" }}>"{l.sourceText}"</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* extracted pane */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
            <Card title="Extracted lines" sub={done ? num(items) + " items across " + calc.lines.length + " sign types and " + DRAFT.floors + " floors. Click a line to see its source." : "Reading..."}
              right={done ? <Badge tone="ok" dot>Draft ready</Badge> : <Badge tone="accent" dot>{TENDER_STAGES[Math.max(0, stage - 1)]}</Badge>}>
              <Table
                dense
                rows={stage >= 2 ? calc.lines : []}
                onRow={(l) => setFocus(focus === l.id ? null : l.id)}
                rowTone={(l) => (focus === l.id ? "accent" : l.warning && stage >= 4 ? "warn" : undefined)}
                empty={<Empty title="Classifying sign types" sub="Rows appear as the schedules are read." />}
                cols={[
                  { key: "l", label: "Sign type", width: "1.5fr", render: (l) => <span style={{ minWidth: 0 }}><span style={{ display: "block", color: "var(--ink)" }}>{l.label}</span><span style={{ fontSize: 11, color: "var(--faint)" }}>{l.floors}</span></span> },
                  { key: "q", label: "Qty", width: "60px", align: "right", render: (l) => <b style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{stage >= 2 ? num(l.qty) : "-"}</b> },
                  { key: "d", label: "Size / finish", width: "1.4fr", hideSm: true, render: (l) => stage >= 3 ? <span style={{ fontSize: 12 }}>{l.dims}<br /><span style={{ color: "var(--faint)" }}>{l.finish}</span></span> : <span style={{ color: "var(--faint)" }}>checking...</span> },
                  { key: "c", label: "Conf.", width: "70px", align: "right", render: (l) => <span style={{ color: l.confidence < 0.8 ? "var(--warn)" : "var(--ok)", fontVariantNumeric: "tabular-nums" }}>{Math.round(l.confidence * 100)}%</span> },
                  { key: "s", label: "Page ref", width: "1fr", hideSm: true, render: (l) => <span className="sa-mono" style={{ fontSize: 11.5, color: "var(--dim)" }}>{l.source}</span> },
                ]}
              />
              {focus && (() => {
                const l = calc.lines.find((x) => x.id === focus);
                if (!l) return null;
                return (
                  <Note tone="info" style={{ marginTop: 12 }}>
                    <b style={{ color: "var(--ink)" }}>{l.label}:</b> {l.countNote}. Source {l.source}.
                    {l.warning ? <span style={{ display: "block", marginTop: 4, color: "var(--warn)" }}>{l.warning}</span> : null}
                  </Note>
                );
              })()}
            </Card>

            <Card title="Ambiguities and missing specification" sub="Flagged, not filled in. Each one needs your call before anything is firm-priced."
              right={stage >= 4 ? <Badge tone="warn">{warns.length} flagged</Badge> : <Badge tone="muted">detecting...</Badge>}>
              {stage >= 4 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {warns.map((w) => (
                    <Note key={w.key} tone="warn">
                      <span style={{ display: "block", fontSize: 11, color: "var(--faint)", marginBottom: 3 }}>{w.where}</span>
                      {w.text}
                    </Note>
                  ))}
                </div>
              ) : <div style={{ fontSize: 12.5, color: "var(--dim)" }}>Checked once dimensions are read.</div>}
              {done && (
                <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                  <Btn kind="primary" onClick={() => { lastSel = DRAFT.id; go("Tenders", "quantities"); }}>Open quantities</Btn>
                  <Btn onClick={() => { lastSel = DRAFT.id; go("Tenders", "costing"); }}>Go to costing</Btn>
                </div>
              )}
            </Card>
          </div>
        </Grid>
      )}
    </Page>
  );
}

/* ── Quantities ─────────────────────────────────────────────────────────── */
function Quantities({ s }: { s: DemoState }) {
  const extracted = s.tenderStage >= 5;
  const [sel, setSel] = useTenderSel(extracted);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const t = tenderById(sel);
  const showDraftEmpty = t.id === DRAFT.id && !extracted;
  const calc = tenderCalc(t, s);
  const items = calc.lines.reduce((a, l) => a + l.qty, 0);
  const lineSum = calc.lines.reduce((a, l) => a + l.sell, 0);
  const reconciles = t.value === undefined || Math.round(calc.sell) === t.value;

  return (
    <Page>
      <PageHead
        kicker="Quantities"
        title={t.title}
        sub={t.id === WON.id ? "Won tender, used as the reference model. Rows reconcile exactly to the €7,500 award." : "Counted from the tender pack. Expand any row to see how it was counted and the per-floor split."}
        actions={<TenderSwitch sel={sel} setSel={setSel} extracted={extracted} />}
      />
      {showDraftEmpty ? (
        <Card><Empty title="Extract the draft first" sub="Quantities appear once the estimator has read the pack." action={<Btn kind="primary" onClick={() => { runExtraction(); go("Tenders", "extract"); }}>Extract tender</Btn>} /></Card>
      ) : (
        <>
          <Grid min={170}>
            <Stat label="Items counted" value={num(items)} sub={calc.lines.length + " sign types"} />
            <Stat label="Floors" value={t.floors} sub="Ground to 5th" />
            <Stat label="Quote total" value={eur(calc.sell)} tone={t.id === WON.id ? "ok" : undefined} sub={t.id === WON.id ? "Won value " + eur(t.value || 0) : "Draft, editable in Costing"} />
            <Stat label="Lowest confidence" value={Math.round(Math.min(...calc.lines.map((l) => l.confidence)) * 100) + "%"} tone={Math.min(...calc.lines.map((l) => l.confidence)) < 0.8 ? "warn" : "ok"} sub={calc.lines.slice().sort((a, b) => a.confidence - b.confidence)[0].label} />
          </Grid>

          <Card pad={false} title="Line items" sub="Quantity × unit price = line total. Prices are editable assumptions in Costing."
            right={reconciles ? <Badge tone="ok" dot>{t.value ? "Reconciles to " + eur(t.value) : "Totals reconcile"}</Badge> : <Badge tone="warn" dot>Edited: {eur(calc.sell)} vs won {eur(t.value || 0)}</Badge>}>
            <div style={{ padding: "4px 16px 16px" }}>
              <div className="sa-table">
                <div className="sa-tr sa-th" style={{ gridTemplateColumns: QTY_GRID }}>
                  {["", "Line", "Floors", "Size", "Qty", "Unit price", "Line total", "Source"].map((h, i) => (
                    <div key={i} className={"sa-td" + (i === 2 || i === 3 || i === 7 ? " sa-hide-sm" : "")} style={{ justifyContent: i >= 4 && i <= 6 ? "flex-end" : undefined }}>{h}</div>
                  ))}
                </div>
                {calc.lines.map((l) => {
                  const isOpen = !!open[l.id];
                  const floors = perFloor(l);
                  return (
                    <Fragment key={l.id}>
                      <div className="sa-tr sa-click-row" style={{ gridTemplateColumns: QTY_GRID, boxShadow: l.warning && t.id === DRAFT.id ? "inset 2px 0 0 var(--warn)" : undefined }}
                        onClick={() => setOpen({ ...open, [l.id]: !isOpen })}>
                        <div className="sa-td" style={{ color: "var(--faint)" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .2s var(--ease)" }}><path d="m9 6 6 6-6 6" /></svg>
                        </div>
                        <div className="sa-td"><span style={{ minWidth: 0 }}><span style={{ display: "block", color: "var(--ink)" }}>{l.label}</span>
                          {l.model === "bom" && <span style={{ fontSize: 11, color: "var(--warn)" }}>Provisional sum</span>}</span></div>
                        <div className="sa-td sa-hide-sm">{l.floors}</div>
                        <div className="sa-td sa-hide-sm" style={{ fontSize: 12 }}>{l.dims}</div>
                        <div className="sa-td" style={{ justifyContent: "flex-end", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{num(l.qty)}</div>
                        <div className="sa-td" style={{ justifyContent: "flex-end", fontVariantNumeric: "tabular-nums" }}>{eur(l.unitPrice)}</div>
                        <div className="sa-td" style={{ justifyContent: "flex-end", color: "var(--ink)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{eur(l.sell)}</div>
                        <div className="sa-td sa-hide-sm sa-mono" style={{ fontSize: 11.5, color: "var(--dim)" }}>{l.source}</div>
                      </div>
                      {isOpen && (
                        <div style={{ borderTop: "1px solid var(--border)", padding: "12px 16px 16px 46px", background: "var(--surface)", animation: "saRise .2s var(--ease) both" }}>
                          <div style={{ fontSize: 12.5, color: "var(--body)" }}><b style={{ color: "var(--ink)" }}>How it was counted:</b> {l.countNote}.</div>
                          <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 4 }}>Finish: {l.finish} · Cost model: {MODEL_LABEL[l.model]}</div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(78px,1fr))", gap: 8, marginTop: 10 }}>
                            {floors.map((f) => (
                              <div key={f.floor} className="sa-kv" style={{ padding: "8px 10px" }}>
                                <div className="sa-label">{f.floor}</div>
                                <div style={{ fontSize: 15, color: "var(--ink)", marginTop: 3, fontVariantNumeric: "tabular-nums" }}>{f.qty}</div>
                              </div>
                            ))}
                          </div>
                          {l.warning && <Note tone="warn" style={{ marginTop: 10 }}>{l.warning}</Note>}
                        </div>
                      )}
                    </Fragment>
                  );
                })}
                <ExtraRow label="Installation / site fitting" note={t.id === WON.id ? "Out-of-hours fit across 6 floors" : "Out-of-hours fit, 6 floors + totem"} value={calc.fitting} />
                <ExtraRow label="Artwork / proofing" note="Templates, schedule set-up, proof rounds" value={calc.artwork} />
                <div className="sa-tr" style={{ gridTemplateColumns: QTY_GRID, background: "var(--surface)" }}>
                  <div className="sa-td" />
                  <div className="sa-td" style={{ color: "var(--ink)", fontWeight: 600 }}>Total (ex VAT)</div>
                  <div className="sa-td sa-hide-sm" /><div className="sa-td sa-hide-sm" />
                  <div className="sa-td" style={{ justifyContent: "flex-end", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{num(items)}</div>
                  <div className="sa-td" />
                  <div className="sa-td" style={{ justifyContent: "flex-end", color: "var(--accent)", fontWeight: 700, fontSize: 15, fontVariantNumeric: "tabular-nums" }}>{eur(calc.sell)}</div>
                  <div className="sa-td sa-hide-sm" />
                </div>
              </div>
              <Source>
                Lines {eur(lineSum)} + fitting {eur(calc.fitting)} + artwork {eur(calc.artwork)} = {eur(calc.sell)}.
                {t.id === DRAFT.id ? " Unit prices reuse the won tender's rates (€18 plaque, €95 directional, €360 directory). The totem has no reference and is a provisional sum." : ""}
              </Source>
            </div>
          </Card>

          <Grid cols="minmax(0,1.3fr) minmax(0,1fr)" min={320} style={{ alignItems: "start" }}>
            <Card title="Floor by sign type" sub="Same counts, laid out the way the building is">
              <FloorMatrix calc={calc} />
            </Card>
            <Card title="Next step" sub={t.id === DRAFT.id ? "Check costs and clear the flagged items" : "Reference model, already won"}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {t.id === DRAFT.id ? (
                  <>
                    <Note tone="warn">{warningKeys().length} items need your decision before this can go to owner review.</Note>
                    <Btn kind="primary" onClick={() => { lastSel = DRAFT.id; go("Tenders", "costing"); }}>Open costing</Btn>
                  </>
                ) : (
                  <>
                    <Note tone="ok">This tender is won and running as JOB-26041. Its rates seed the new draft.</Note>
                    <div><JobChip id="JOB-26041" /></div>
                    <Btn onClick={() => { lastSel = WON.id; go("Tenders", "costing"); }}>See its cost model</Btn>
                  </>
                )}
              </div>
            </Card>
          </Grid>
        </>
      )}
    </Page>
  );
}
const QTY_GRID = "34px minmax(150px,1.6fr) 70px 1.1fr 70px 96px 110px 1fr";
const MODEL_LABEL: Record<string, string> = { unit: "per item", area: "per m²", vehicle: "per vehicle package", bom: "bill of materials", service: "service" };

function ExtraRow({ label, note, value }: { label: string; note: string; value: number }) {
  return (
    <div className="sa-tr" style={{ gridTemplateColumns: QTY_GRID }}>
      <div className="sa-td" />
      <div className="sa-td"><span><span style={{ display: "block", color: "var(--ink)" }}>{label}</span><span style={{ fontSize: 11, color: "var(--faint)" }}>{note}</span></span></div>
      <div className="sa-td sa-hide-sm" /><div className="sa-td sa-hide-sm" />
      <div className="sa-td" style={{ justifyContent: "flex-end", color: "var(--faint)" }}>1</div>
      <div className="sa-td" style={{ justifyContent: "flex-end", fontVariantNumeric: "tabular-nums" }}>{eur(value)}</div>
      <div className="sa-td" style={{ justifyContent: "flex-end", color: "var(--ink)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{eur(value)}</div>
      <div className="sa-td sa-hide-sm" style={{ fontSize: 11.5, color: "var(--dim)" }}>Rate card</div>
    </div>
  );
}

function FloorMatrix({ calc }: { calc: TenderCalc }) {
  const floored = calc.lines.filter((l) => l.floors && l.floors.indexOf("G") === 0);
  const external = calc.lines.filter((l) => !(l.floors && l.floors.indexOf("G") === 0));
  const per = floored.map((l) => perFloor(l));
  const grid = "70px repeat(" + floored.length + ",minmax(0,1fr)) 60px";
  return (
    <div className="sa-table">
      <div className="sa-tr sa-th" style={{ gridTemplateColumns: grid }}>
        <div className="sa-td">Floor</div>
        {floored.map((l) => <div key={l.id} className="sa-td" style={{ justifyContent: "flex-end" }}>{l.signType}</div>)}
        <div className="sa-td" style={{ justifyContent: "flex-end" }}>All</div>
      </div>
      {FLOOR_NAMES.slice().reverse().map((f) => {
        const idx = FLOOR_NAMES.indexOf(f);
        const vals = per.map((p) => p[idx]?.qty || 0);
        return (
          <div key={f} className="sa-tr" style={{ gridTemplateColumns: grid }}>
            <div className="sa-td" style={{ color: "var(--ink)" }}>{f}</div>
            {vals.map((q, i) => <div key={i} className="sa-td" style={{ justifyContent: "flex-end", fontVariantNumeric: "tabular-nums" }}>{q}</div>)}
            <div className="sa-td" style={{ justifyContent: "flex-end", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{vals.reduce((a, b) => a + b, 0)}</div>
          </div>
        );
      })}
      {external.map((l) => (
        <div key={l.id} className="sa-tr" style={{ gridTemplateColumns: "70px 1fr 60px" }}>
          <div className="sa-td" style={{ color: "var(--ink)" }}>External</div>
          <div className="sa-td">{l.label} <Badge tone="warn" style={{ height: 18, fontSize: 10.5 }}>provisional</Badge></div>
          <div className="sa-td" style={{ justifyContent: "flex-end" }}>{l.qty}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Costing ────────────────────────────────────────────────────────────── */
function Costing({ s }: { s: DemoState }) {
  const extracted = s.tenderStage >= 5;
  const [sel, setSel] = useTenderSel(extracted);
  const t = tenderById(sel);
  const isWon = t.id === WON.id;
  const calc = tenderCalc(t, s);
  const edits = s.tenderEdits[t.id] || {};
  const edited = Object.keys(edits).some((k) => k.charAt(0) !== "_");
  const floor = s.marginFloor;
  const mt = marginTone(calc.marginPct, floor);
  const warns = warningKeys();
  const acked = warns.filter((w) => s.tenderAck[w.key]).length;
  const allAcked = acked === warns.length;
  const st = tenderStatus(DRAFT, s);
  const wonCalc = tenderCalc(WON, s);

  if (t.id === DRAFT.id && !extracted) {
    return (
      <Page>
        <PageHead kicker="Costing" title={DRAFT.title} actions={<TenderSwitch sel={sel} setSel={setSel} extracted={extracted} />} />
        <Card><Empty title="Extract the draft first" sub="The costing draft is built from the extracted quantities." action={<Btn kind="primary" onClick={() => { runExtraction(); go("Tenders", "extract"); }}>Extract tender</Btn>} /></Card>
      </Page>
    );
  }

  const set = (key: string) => (n: number) => editTender(t.id, key, n);
  const totem = calc.lines.find((l) => l.model === "bom");

  return (
    <Page>
      <PageHead
        kicker="Costing"
        title={isWon ? "Won tender cost model" : "Costing draft: " + t.title}
        sub={isWon ? "Scenario mode. The quoted price is fixed at €7,500 (won). Change a cost and watch the margin move." : "Every price and cost below is an editable assumption, seeded from your past rates. The estimator does not know supplier prices it has not been given."}
        actions={<>
          <TenderSwitch sel={sel} setSel={setSel} extracted={extracted} />
          <Btn kind="quiet" disabled={!edited} onClick={() => { resetTenderEdits(t.id); toast("Assumptions reset for " + t.id); }}>Reset assumptions</Btn>
        </>}
      />

      <Note tone={isWon ? "info" : "warn"}>
        {isWon
          ? "What-if only: edits here never change the won quote or JOB-26041. Use it to test how cost changes would have moved the margin."
          : "Cells with an amber outline are editable. Prices reuse the won tender's rate card; anything without a reference is marked provisional."}
      </Note>

      <Grid cols="minmax(0,1.6fr) minmax(0,1fr)" min={330} style={{ alignItems: "start" }}>
        <Card pad={false} title="Cost build-up" sub="Materials per line, then labour, fitting and delivery">
          <div style={{ padding: "4px 16px 16px" }}>
            <div className="sa-table">
              <div className="sa-tr sa-th" style={{ gridTemplateColumns: COST_GRID }}>
                {["Line", "Qty", "Unit cost", "Cost", "Unit price", "Sell"].map((h, i) => <div key={h} className="sa-td" style={{ justifyContent: i ? "flex-end" : undefined }}>{h}</div>)}
              </div>
              {calc.lines.map((l) => (
                <div key={l.id} className="sa-tr" style={{ gridTemplateColumns: COST_GRID }}>
                  <div className="sa-td"><span style={{ minWidth: 0 }}><span style={{ display: "block", color: "var(--ink)" }}>{l.label}</span>
                    <span style={{ fontSize: 11, color: l.model === "bom" ? "var(--warn)" : "var(--faint)" }}>{l.model === "bom" ? "BOM below, provisional" : MODEL_LABEL[l.model] + " · " + l.source}</span></span></div>
                  <div className="sa-td" style={{ justifyContent: "flex-end" }}>{isWon ? <span style={{ fontVariantNumeric: "tabular-nums" }}>{num(l.qty)}</span> : <NumField value={l.qty} onChange={set(l.id + ".qty")} width={66} label={l.label + " quantity"} />}</div>
                  <div className="sa-td" style={{ justifyContent: "flex-end" }}>{l.model === "bom" ? <span style={{ fontVariantNumeric: "tabular-nums" }}>{eur(l.unitCost)}</span> : <NumField prefix="€" value={l.unitCost} onChange={set(l.id + ".unitCost")} width={84} label={l.label + " unit cost"} />}</div>
                  <div className="sa-td" style={{ justifyContent: "flex-end", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{eur(l.costTotal)}</div>
                  <div className="sa-td" style={{ justifyContent: "flex-end" }}>{isWon ? <span style={{ fontVariantNumeric: "tabular-nums" }}>{eur(l.unitPrice)}</span> : <NumField prefix="€" value={l.unitPrice} onChange={set(l.id + ".unitPrice")} width={92} label={l.label + " unit price"} />}</div>
                  <div className="sa-td" style={{ justifyContent: "flex-end", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{eur(l.sell)}</div>
                </div>
              ))}
              <CostRow label="Workshop & design labour" note={calc.labourHours + " h × " + eur(calc.labourRate) + "/h"}
                cost={<span style={{ display: "inline-flex", gap: 6 }}><NumField suffix="h" value={calc.labourHours} onChange={set("labourHours")} width={66} label="Labour hours" /><NumField prefix="€" value={calc.labourRate} onChange={set("labourRate")} width={70} label="Labour rate" /></span>}
                costTotal={calc.labourCost} sell="in line prices" />
              <CostRow label="Installation / fitting" note="Crew cost vs fitting price"
                cost={<NumField prefix="€" value={calc.fittingCost} onChange={set("fittingCost")} width={88} label="Fitting cost" />}
                costTotal={calc.fittingCost}
                sell={isWon ? eur(calc.fitting) : <NumField prefix="€" value={calc.fitting} onChange={set("fitting")} width={92} label="Fitting price" />} />
              <CostRow label="Delivery" note="Van, fuel, tolls" cost={<NumField prefix="€" value={calc.delivery} onChange={set("delivery")} width={80} label="Delivery cost" />} costTotal={calc.delivery} sell="included" />
              <CostRow label="Artwork / proofing" note="Charged; time sits in labour" cost={<span style={{ color: "var(--faint)" }}>in labour</span>} costTotal={0}
                sell={isWon ? eur(calc.artwork) : <NumField prefix="€" value={calc.artwork} onChange={set("artwork")} width={84} label="Artwork price" />} />
              <div className="sa-tr" style={{ gridTemplateColumns: COST_GRID, background: "var(--surface)" }}>
                <div className="sa-td" style={{ color: "var(--ink)", fontWeight: 600 }}>Totals</div>
                <div className="sa-td" /><div className="sa-td" />
                <div className="sa-td" style={{ justifyContent: "flex-end", color: "var(--ink)", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{eur(calc.cost)}</div>
                <div className="sa-td" />
                <div className="sa-td" style={{ justifyContent: "flex-end", color: "var(--accent)", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{eur(calc.sell)}</div>
              </div>
            </div>
            <Source>
              Materials {eur(calc.materialsCost)} + labour {eur(calc.labourCost)} + fitting {eur(calc.fittingCost)} + delivery {eur(calc.delivery)} = {eur(calc.cost)} cost.
            </Source>
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0, position: "sticky", top: 0 }}>
          <Card title="Margin" sub={isWon ? "Won price held at " + eur(WON.value || 0) : "Updates as you type"} tone={mt === "bad" ? "bad" : undefined}>
            <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
              <Donut size={128} thickness={14}
                parts={[{ value: calc.materialsCost, tone: "accent" as Tone, label: "Materials" }, { value: calc.labourCost, tone: "info" as Tone, label: "Labour" }, { value: calc.fittingCost, tone: "ok" as Tone, label: "Fitting" }, { value: calc.delivery, tone: "muted" as Tone, label: "Delivery" }]}
                center={<><div style={{ fontSize: 22, fontWeight: 600, color: "var(--" + (mt === "bad" ? "bad" : mt === "warn" ? "warn" : "ok") + ")" }}>{pct(calc.marginPct)}</div><div style={{ fontSize: 10.5, color: "var(--faint)" }}>gross margin</div></>} />
              <div style={{ flex: 1, minWidth: 150, display: "flex", flexDirection: "column", gap: 8 }}>
                <Row left="Quote (sell)" right={<b style={{ color: "var(--ink)" }}>{eur(calc.sell)}</b>} />
                <Row left="Estimated cost" right={eur(calc.cost)} />
                <Row left="Gross profit" right={<b style={{ color: calc.profit >= 0 ? "var(--ok)" : "var(--bad)" }}>{eur(calc.profit)}</b>} />
                <div style={{ height: 1, background: "var(--border)" }} />
                <Legend items={[{ label: "Materials", tone: "accent", value: eur(calc.materialsCost) }, { label: "Labour", tone: "info", value: eur(calc.labourCost) }, { label: "Fitting crew", tone: "ok", value: eur(calc.fittingCost) }, { label: "Delivery", tone: "muted", value: eur(calc.delivery) }]} />
              </div>
            </div>
            {mt !== "ok" && (
              <Note tone={mt} style={{ marginTop: 12 }}>
                {mt === "bad" ? "Below your " + floor + "% floor. Raise a price or cut a cost before this goes anywhere." : "Within 5 points of your " + floor + "% floor."}
              </Note>
            )}
            {!isWon && <Source>Won reference for comparison: {eur(wonCalc.sell)} at {pct(wonCalc.marginPct)} margin.</Source>}
            {isWon && <Source>Default model: {eur(3851)} cost, {eur(3649)} profit, 48.7% margin. Floor is your setting ({floor}%), not a stated policy.</Source>}
          </Card>

          {!isWon && (
            <Card title="Missing spec: your call" sub={acked + " of " + warns.length + " acknowledged"} tone={allAcked ? "ok" : "warn"}
              right={<Badge tone={allAcked ? "ok" : "warn"} dot>{allAcked ? "Clear" : "Gate closed"}</Badge>}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {warns.map((w) => {
                  const on = !!s.tenderAck[w.key];
                  return (
                    <label key={w.key} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "9px 11px", borderRadius: 10, border: "1px solid var(--border)", background: on ? "var(--ok-soft)" : "var(--surface-faint)", cursor: "pointer" }}>
                      <input type="checkbox" checked={on} onChange={() => ackTenderWarning(w.key)} style={{ marginTop: 2, accentColor: "var(--accent)" }} />
                      <span style={{ fontSize: 12.5, lineHeight: 1.45, color: "var(--body)" }}>
                        <span style={{ display: "block", fontSize: 10.5, color: "var(--faint)" }}>{w.where}</span>
                        {w.text}
                      </span>
                    </label>
                  );
                })}
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {st === "review" || st === "approved" ? (
                  <Btn kind="primary" onClick={() => go("Tenders", "review")}>{st === "approved" ? "Approved: view proposal" : "In owner review: open"}</Btn>
                ) : (
                  <Btn kind="primary" disabled={!allAcked}
                    onClick={() => { setTenderStatus(DRAFT.id, "review", "Moved " + DRAFT.title + " draft to owner review at " + eur(calc.sell) + " (" + pct(calc.marginPct) + " margin)."); go("Tenders", "review"); }}>
                    Ready for owner review
                  </Btn>
                )}
                {!allAcked && <span style={{ fontSize: 11.5, color: "var(--faint)" }}>Acknowledge each item to open the gate.</span>}
              </div>
            </Card>
          )}
        </div>
      </Grid>

      <Label style={{ marginTop: 4 }}>Three cost models, kept separate</Label>
      <Grid min={300} style={{ alignItems: "start" }}>
        <AreaModel />
        <VehicleModel />
        <BomModel t={t} isWon={isWon} totem={totem} s={s} />
      </Grid>
    </Page>
  );
}
const COST_GRID = "minmax(150px,1.5fr) 80px 104px 92px 108px 96px";

function CostRow({ label, note, cost, costTotal, sell }: { label: string; note: string; cost: ReactNode; costTotal: number; sell: ReactNode }) {
  return (
    <div className="sa-tr" style={{ gridTemplateColumns: COST_GRID }}>
      <div className="sa-td"><span style={{ minWidth: 0 }}><span style={{ display: "block", color: "var(--ink)" }}>{label}</span><span style={{ fontSize: 11, color: "var(--faint)" }}>{note}</span></span></div>
      <div className="sa-td" style={{ gridColumn: "span 2", justifyContent: "flex-end" }}>{cost}</div>
      <div className="sa-td" style={{ justifyContent: "flex-end", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{costTotal ? eur(costTotal) : "-"}</div>
      <div className="sa-td" style={{ gridColumn: "span 2", justifyContent: "flex-end", fontSize: 12, color: "var(--dim)" }}>{sell}</div>
    </div>
  );
}

function ModelResult({ cost, sell }: { cost: number; sell: number }) {
  const m = margin(sell, cost);
  const floor = useDemo()[0].marginFloor;
  const tone = marginTone(m, floor);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 12 }}>
      <div className="sa-kv"><div className="sa-label">Cost</div><div style={{ fontSize: 15, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{eur(cost)}</div></div>
      <div className="sa-kv"><div className="sa-label">Sell</div><div style={{ fontSize: 15, marginTop: 4, fontVariantNumeric: "tabular-nums", color: "var(--ink)" }}>{eur(sell)}</div></div>
      <div className="sa-kv"><div className="sa-label">Margin</div><div style={{ fontSize: 15, marginTop: 4, fontVariantNumeric: "tabular-nums", color: "var(--" + (tone === "bad" ? "bad" : tone === "warn" ? "warn" : "ok") + ")" }}>{pct(m)}</div></div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "6px 0", borderTop: "1px solid var(--border)" }}>
      <span style={{ fontSize: 12.5, color: "var(--body)" }}>{label}</span>
      {children}
    </div>
  );
}

function AreaModel() {
  const [w, setW] = useState(1.2), [h, setH] = useState(0.9), [qty, setQty] = useState(6), [costM2, setCostM2] = useState(139), [sellM2, setSellM2] = useState(333);
  const area = w * h * qty;
  return (
    <Card title="Printed boards, per m²" sub="Predictable unit economics: area × rate" right={<Badge tone="muted">Area model</Badge>}>
      <Field label="Width (m)"><NumField value={w} onChange={setW} width={80} step={0.1} label="Width" /></Field>
      <Field label="Height (m)"><NumField value={h} onChange={setH} width={80} step={0.1} label="Height" /></Field>
      <Field label="Quantity"><NumField value={qty} onChange={setQty} width={80} label="Quantity" /></Field>
      <Field label="Cost per m² (ACM + print + laminate)"><NumField prefix="€" value={costM2} onChange={setCostM2} width={90} label="Cost per m2" /></Field>
      <Field label="Sell per m²"><NumField prefix="€" value={sellM2} onChange={setSellM2} width={90} label="Sell per m2" /></Field>
      <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 8 }}>{area.toFixed(2)} m² in total</div>
      <ModelResult cost={area * costM2} sell={area * sellM2} />
      <Source>Defaults derived from the directory board rate (1.2 × 0.9 m at €360 sell, €150 cost).</Source>
    </Card>
  );
}

function VehicleModel() {
  const [vans, setVans] = useState(15), [pkgCost, setPkgCost] = useState(1200), [pkgPrice, setPkgPrice] = useState(1900), [setup, setSetup] = useState(300);
  const [discountOn, setDiscountOn] = useState(false);
  const tiers = [{ from: 1, to: 4, d: 0 }, { from: 5, to: 9, d: 3 }, { from: 10, to: 999, d: 5 }];
  const tier = tiers.find((t) => vans >= t.from && vans <= t.to) || tiers[0];
  const d = discountOn ? tier.d : 0;
  const sell = vans * pkgPrice * (1 - d / 100);
  const cost = vans * pkgCost + setup;
  return (
    <Card title="Vehicle wraps, per vehicle" sub="Package price × vehicles, with optional batch discount" right={<Badge tone="muted">Vehicle model</Badge>}>
      <Field label="Vehicles"><NumField value={vans} onChange={setVans} width={80} label="Vehicles" /></Field>
      <Field label="Package cost per van (film, laminate, application)"><NumField prefix="€" value={pkgCost} onChange={setPkgCost} width={90} label="Package cost" /></Field>
      <Field label="Package price per van"><NumField prefix="€" value={pkgPrice} onChange={setPkgPrice} width={90} label="Package price" /></Field>
      <Field label="One-off design & template"><NumField prefix="€" value={setup} onChange={setSetup} width={90} label="Setup" /></Field>
      <Field label="Batch discount">
        <Seg size="sm" value={discountOn ? "on" : "off"} onChange={(v) => setDiscountOn(v === "on")} options={[{ id: "off", label: "Off" }, { id: "on", label: "Tiered" }]} />
      </Field>
      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
        {tiers.map((t) => <Badge key={t.from} tone={discountOn && t === tier ? "accent" : "muted"}>{t.from}{t.to > 100 ? "+" : "-" + t.to} vans: {t.d}%</Badge>)}
      </div>
      <ModelResult cost={cost} sell={sell} />
      <Source>Defaults mirror the 15-van fleet order (illustrative: €1,900 per van, flat, no discount).</Source>
    </Card>
  );
}

function BomModel({ t, isWon, totem, s }: { t: Tender; isWon: boolean; totem?: TenderCalc["lines"][number]; s: DemoState }) {
  const base = DRAFT.lines.find((l) => l.model === "bom");
  if (!base || !base.bom) return null;
  const edits = s.tenderEdits[DRAFT.id] || {};
  const items = base.bom.map((b, i) => ({ ...b, cost: edits["d4.bom." + i] !== undefined ? edits["d4.bom." + i] : b.cost }));
  const total = items.reduce((a, b) => a + b.cost, 0);
  const price = totem && t.id === DRAFT.id ? totem.unitPrice : (edits["d4.unitPrice"] !== undefined ? edits["d4.unitPrice"] : base.unitPrice);
  const setItem = (i: number) => (n: number) => {
    editTender(DRAFT.id, "d4.bom." + i, n);
    const next = items.map((b, j) => (j === i ? n : b.cost)).reduce((a, b) => a + b, 0);
    editTender(DRAFT.id, "d4.unitCost", next);
  };
  return (
    <Card title="Custom illuminated, bill of materials" sub="Every bespoke sign is different, so it is built up line by line" right={<Badge tone="warn">BOM model</Badge>}>
      {items.map((b, i) => (
        <Field key={b.item} label={b.item}><NumField prefix="€" value={b.cost} onChange={setItem(i)} width={90} label={b.item} /></Field>
      ))}
      <ModelResult cost={total} sell={price} />
      <Note tone="warn" style={{ marginTop: 10 }}>
        Entrance totem (draft): illumination and foundation are not in the pack. This BOM assumes internally lit LED with foundation by others. Provisional until clarified.
      </Note>
      {isWon && <Source>The won tender has no illuminated item; this block edits the draft's totem.</Source>}
      {!isWon && <Source>Edits here flow into the totem's unit cost in the build-up above.</Source>}
    </Card>
  );
}

/* ── Submission Review ──────────────────────────────────────────────────── */
function Review({ s }: { s: DemoState }) {
  const extracted = s.tenderStage >= 5;
  const st = tenderStatus(DRAFT, s);
  const calc = tenderCalc(DRAFT, s);
  const warns = warningKeys();
  const allAcked = warns.every((w) => s.tenderAck[w.key]);
  const dep = s.tenderDeposit[DRAFT.id] ?? 30;
  const approvedAt = (s.tenderEdits[DRAFT.id] || {})._approvedAt;
  const floor = s.marginFloor;
  const provisional = calc.lines.filter((l) => l.model === "bom");

  if (!extracted) {
    return (
      <Page>
        <PageHead kicker="Submission Review" title={DRAFT.title} />
        <Card><Empty title="Nothing to review yet" sub="Extract the tender pack and clear the costing gate first." action={<Btn kind="primary" onClick={() => { runExtraction(); go("Tenders", "extract"); }}>Extract tender</Btn>} /></Card>
      </Page>
    );
  }

  const approve = () => {
    update((x) => ({ tenderStatus: { ...x.tenderStatus, [DRAFT.id]: "approved" }, tenderEdits: { ...x.tenderEdits, [DRAFT.id]: { ...(x.tenderEdits[DRAFT.id] || {}), _approvedAt: Date.now() } } }));
    log("human", "Managing Director", "Approved " + DRAFT.title + " quote at " + eur(calc.sell) + " (" + pct(calc.marginPct) + " margin, " + dep + "% deposit). Not sent: submission is a manual step.", undefined, "tender", "ok");
    toast("Quote approved. Nothing was sent to the client.");
  };

  return (
    <Page>
      <PageHead
        kicker="Submission Review"
        title="Proposal preview"
        sub="What the client would receive, built from the costing draft. Approving records your decision; it does not email, upload or submit anything."
        actions={<>
          <Btn onClick={() => { setTenderStatus(DRAFT.id, "extracted", "Returned " + DRAFT.title + " draft to the estimator for changes."); go("Tenders", "costing"); }}>Return to estimator</Btn>
          <Btn onClick={() => { log("agent", "Tender Estimator", "Recalculated " + DRAFT.id + ": " + eur(calc.sell) + " sell, " + eur(calc.cost) + " cost, " + pct(calc.marginPct) + " margin.", undefined, "tender", "info"); toast("Recalculated: " + eur(calc.sell) + " at " + pct(calc.marginPct) + " margin"); }}>Recalculate</Btn>
          <Btn kind="primary" disabled={st !== "review"} onClick={approve} title={st === "review" ? "Approve this quote" : "Clear the costing gate first"}>{st === "approved" ? "Approved" : "Approve quote"}</Btn>
        </>}
      />

      <Grid cols="minmax(0,1.6fr) minmax(0,1fr)" min={340} style={{ alignItems: "start" }}>
        {/* proposal document */}
        <div style={{ borderRadius: 18, overflow: "hidden", border: "1px solid var(--border-strong)", boxShadow: "0 24px 60px rgba(0,0,0,.35)", minWidth: 0 }}>
          <div style={{ background: "#0f1316", padding: "18px 26px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <img src={COMPANY.logo} alt="Signs ASAP" style={{ height: 34, width: "auto" }} />
            <div style={{ flex: 1 }} />
            <div style={{ fontSize: 10.5, color: "#9aa39f", textAlign: "right", lineHeight: 1.5 }}>
              {COMPANY.legalName} · CRO {COMPANY.cro}<br />{COMPANY.address}<br />{COMPANY.email} · {COMPANY.websiteLabel}
            </div>
          </div>
          <div style={{ background: "#f4f5f2", color: "#1a1f22", padding: "24px 26px 26px", fontSize: 12.5, lineHeight: 1.55 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 10.5, letterSpacing: ".1em", textTransform: "uppercase", color: "#6b7470" }}>Tender response</div>
                <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-.3px", marginTop: 4 }}>{DRAFT.title}</div>
                <div style={{ color: "#4b5450" }}>To: {DRAFT.client}</div>
              </div>
              <div style={{ textAlign: "right", color: "#4b5450" }}>
                Ref {DRAFT.id}-Q1<br />{dateLabel(DEMO_TODAY)}<br />Valid 30 days
              </div>
            </div>

            <div style={{ marginTop: 18, border: "1px solid #d9dcd6", borderRadius: 10, overflow: "hidden" }}>
              {calc.lines.map((l, i) => (
                <div key={l.id} style={{ display: "grid", gridTemplateColumns: "1fr 64px 84px 92px", gap: 8, padding: "9px 12px", borderTop: i ? "1px solid #e4e6e1" : "0", alignItems: "baseline" }}>
                  <div>{l.label}{l.model === "bom" ? <span style={{ color: "#a0620a" }}> (provisional sum)</span> : ""}<div style={{ fontSize: 11, color: "#6b7470" }}>{l.dims} · {l.finish}</div></div>
                  <div style={{ textAlign: "right" }}>{num(l.qty)}</div>
                  <div style={{ textAlign: "right" }}>{eur(l.unitPrice)}</div>
                  <div style={{ textAlign: "right", fontWeight: 600 }}>{eur(l.sell)}</div>
                </div>
              ))}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 92px", gap: 8, padding: "9px 12px", borderTop: "1px solid #e4e6e1" }}><div>Installation, out of hours, all floors</div><div style={{ textAlign: "right", fontWeight: 600 }}>{eur(calc.fitting)}</div></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 92px", gap: 8, padding: "9px 12px", borderTop: "1px solid #e4e6e1" }}><div>Artwork, templates and proofing</div><div style={{ textAlign: "right", fontWeight: 600 }}>{eur(calc.artwork)}</div></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 8, padding: "11px 12px", borderTop: "1px solid #c9ccc6", background: "#eaece7" }}>
                <div style={{ fontWeight: 600 }}>Total, excluding VAT</div><div style={{ textAlign: "right", fontWeight: 700, fontSize: 14 }}>{eur(calc.sell)}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, marginTop: 18 }}>
              <DocBlock title="Exclusions" items={[
                "Statutory fire-exit and safety signage (by M&E contractor, §2.7)",
                "Totem foundation and ducting (by others)",
                "Mains electrical connection to the totem (by client's electrician)",
                "Making good of decoration after removal of old signs",
              ]} />
              <DocBlock title="Clarifications" items={[
                "Totem illumination not specified (§4.3): priced as provisional sum for an internally lit unit",
                "Tactile / braille to room plaques not stated: priced as standard UV print",
                "Quantities per room data sheets, Schedule A p.6-13",
              ]} />
              <DocBlock title="Programme and terms" items={[
                "Lead time 2-3 weeks from order and approved proofs",
                "Installation out of hours (after 18:00 or outside term)",
                dep + "% deposit on order, balance on completion",
                "RAMS and method statement supplied before start",
              ]} />
              <DocBlock title="Based on" items={DRAFT.docs.map((d) => d.name + " (" + d.pages + ")")} />
            </div>
            <div style={{ marginTop: 16, fontSize: 11, color: "#6b7470" }}>Prepared by {COMPANY.tradingName}, {COMPANY.addressShort}. {COMPANY.tagline}</div>
          </div>
        </div>

        {/* owner control */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <Card title="Owner control" right={<StatusBadge t={DRAFT} s={s} />}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Check ok label="Quantities traced to page references" />
              <Check ok={allAcked} label={"Ambiguities acknowledged (" + warns.filter((w) => s.tenderAck[w.key]).length + "/" + warns.length + ")"} />
              <Check ok={calc.marginPct >= floor} label={"Margin " + pct(calc.marginPct) + " vs your " + floor + "% floor"} />
              <Check ok={provisional.length === 0} warn label={provisional.length + " provisional item stays provisional in the document"} />
              <Check ok={st === "review" || st === "approved"} label="Passed the costing gate" />
            </div>
            {st === "approved" ? (
              <Note tone="ok" style={{ marginTop: 12 }}>
                Approved by Managing Director{approvedAt ? " at " + timeLabel(new Date(approvedAt)) : ""}. Nothing was sent. Export and submission stay a manual step on the tender portal.
              </Note>
            ) : st === "review" ? (
              <Note tone="accent" style={{ marginTop: 12 }}>Ready for your decision. Approving records it in Activity and leaves the client untouched.</Note>
            ) : (
              <Note tone="warn" style={{ marginTop: 12 }}>
                Not through the costing gate yet. <span className="sa-click" style={{ color: "var(--accent)" }} onClick={() => go("Tenders", "costing")}>Open costing</span>
              </Note>
            )}
          </Card>

          <Card title="Deposit" sub="Your choice per job. Recommended 30% for printed wayfinding (matches the won tender's terms); 50% if the totem is confirmed as illuminated.">
            <Seg value={String(dep)} onChange={(v) => { update((x) => ({ tenderDeposit: { ...x.tenderDeposit, [DRAFT.id]: parseInt(v, 10) } })); }}
              options={[{ id: "30", label: "30%" }, { id: "40", label: "40%" }, { id: "50", label: "50%" }]} />
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <div className="sa-kv" style={{ flex: 1 }}><div className="sa-label">On order</div><div style={{ fontSize: 16, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{eur(calc.sell * dep / 100)}</div></div>
              <div className="sa-kv" style={{ flex: 1 }}><div className="sa-label">On completion</div><div style={{ fontSize: 16, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{eur(calc.sell * (1 - dep / 100))}</div></div>
            </div>
          </Card>

          <Card title="Numbers behind it">
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <Row left="Sell" right={eur(calc.sell)} />
              <Row left="Estimated cost" right={eur(calc.cost)} />
              <Row left="Gross profit" right={eur(calc.profit)} />
              <Row left="Margin" right={pct(calc.marginPct)} />
              <Row left="Won reference margin" right={pct(tenderCalc(WON, s).marginPct)} />
            </div>
          </Card>
        </div>
      </Grid>
    </Page>
  );
}

function DocBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, letterSpacing: ".1em", textTransform: "uppercase", color: "#6b7470", fontWeight: 600 }}>{title}</div>
      <ul style={{ margin: "6px 0 0", paddingLeft: 16, color: "#2b3230" }}>
        {items.map((it) => <li key={it} style={{ marginTop: 3 }}>{it}</li>)}
      </ul>
    </div>
  );
}

function Check({ ok, label, warn }: { ok: boolean; label: string; warn?: boolean }) {
  const c = ok ? "var(--ok)" : warn ? "var(--warn)" : "var(--bad)";
  return (
    <div style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 12.5, color: "var(--body)" }}>
      <span style={{ width: 18, height: 18, flex: "none", borderRadius: 9, border: "1px solid " + c, color: c, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
        {ok ? <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          : <span style={{ width: 6, height: 2, borderRadius: 1, background: c }} />}
      </span>
      <span>{label}</span>
    </div>
  );
}

/* ── Archive ────────────────────────────────────────────────────────────── */
function Archive({ s }: { s: DemoState }) {
  const st = tenderStatus(DRAFT, s);
  const calc = tenderCalc(DRAFT, s);
  const rows = [{ id: DRAFT.id, title: DRAFT.title, client: DRAFT.client, value: s.tenderStage >= 5 ? calc.sell : 0, result: st === "approved" ? "Approved, awaiting manual submission" : st === "review" ? "In owner review" : s.tenderStage >= 5 ? "Draft extracted" : "New", date: DRAFT.received, live: true }]
    .concat(TENDER_ARCHIVE.slice().reverse().map((a) => ({ ...a, live: false })));
  const submitted = TENDER_ARCHIVE.filter((a) => a.result.indexOf("Not submitted") !== 0);
  const won = TENDER_ARCHIVE.filter((a) => a.result.indexOf("Won") === 0);
  const wonValue = won.reduce((a, b) => a + b.value, 0);
  return (
    <Page>
      <PageHead kicker="Archive" title="Tender history" sub="Illustrative record of past tenders, plus the live draft. Lost and skipped tenders stay here so the next estimate can learn from them." />
      <Grid min={180}>
        <Stat label="Submitted" value={submitted.length} sub={"of " + TENDER_ARCHIVE.length + " received"} />
        <Stat label="Won" value={won.length} tone="ok" sub={"Win rate " + pct((won.length / Math.max(1, submitted.length)) * 100, 0)} />
        <Stat label="Won value" value={eur(wonValue)} sub="Includes the €7,500 college award" />
        <Stat label="Skipped for capacity" value={TENDER_ARCHIVE.filter((a) => a.result.indexOf("capacity") > -1).length} tone="warn" sub="Workshop full that fortnight" />
      </Grid>
      <Card pad={false}>
        <div style={{ padding: 16 }}>
          <Table
            rows={rows}
            onRow={(r) => { if (r.live) go("Tenders", st === "approved" || st === "review" ? "review" : "inbox"); else if (r.id === WON.id) { lastSel = WON.id; go("Tenders", "quantities"); } }}
            cols={[
              { key: "id", label: "Ref", width: "80px", render: (r) => <span className="sa-mono" style={{ color: "var(--dim)" }}>{r.id}</span> },
              { key: "t", label: "Tender", width: "1.6fr", render: (r) => <span style={{ minWidth: 0 }}><span style={{ display: "block", color: "var(--ink)" }}>{r.title}</span><span style={{ fontSize: 11, color: "var(--faint)" }}>{r.client}</span></span> },
              { key: "d", label: "Date", width: "110px", hideSm: true, render: (r) => dateLabel(r.date) },
              { key: "v", label: "Value", width: "100px", align: "right", render: (r) => <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--ink)" }}>{r.value ? eur(r.value) : "-"}</span> },
              { key: "r", label: "Result", width: "1.3fr", render: (r) => <Badge tone={r.live ? "accent" : r.result.indexOf("Won") === 0 ? "ok" : r.result.indexOf("Lost") === 0 ? "bad" : "muted"}>{r.result}</Badge> },
            ]}
            footer={<span>Archive history is illustrative demo data.</span>}
          />
        </div>
      </Card>
    </Page>
  );
}

/* ── Entry ──────────────────────────────────────────────────────────────── */
export default function TenderDesk(_props: { v: any }) {
  const [s] = useDemo();
  const tab = getTab("Tenders", firstTab("Tenders"));
  if (tab === "extract") return <Extract s={s} />;
  if (tab === "quantities") return <Quantities s={s} />;
  if (tab === "costing") return <Costing s={s} />;
  if (tab === "review") return <Review s={s} />;
  if (tab === "archive") return <Archive s={s} />;
  return <Inbox s={s} />;
}
