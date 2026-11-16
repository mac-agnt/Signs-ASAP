/* Agent Overview: seven specialist agents, what each is for, what it proposes,
   what it has done and which records it touches. Proposals are simulated
   locally; nothing is sent and no price changes without the owner. */

import { useState } from "react";
import AgentFace from "../../components/AgentFace";
import {
  useDemo, go, fleet, headline, job, installs, workOrders, markAgentDone, setJobPrice, shiftPlan, addTask, log, toast,
  eur, pct, margin, fitter, awaitingProofs,
} from "../model";
import { AGENTS, TENDER_WON, TENDER_DRAFT, type AgentDef } from "../data";
import { bd, stamp, dayLabel } from "../dates";
import { Page, PageHead, Grid, Card, Badge, Btn, JobChip, Stat, Note, TextField } from "../ui";

type RunResult = AgentDef["runs"][number]["result"];
const faceState = (r?: RunResult) => (r === "needs you" ? "waiting" : r === "flagged" ? "attention" : r === "done" ? "complete" : "idle");
const resultBadge = (r: RunResult) => <Badge tone={r === "done" ? "ok" : r === "flagged" ? "warn" : "accent"}>{r === "done" ? "Done" : r === "flagged" ? "Flagged" : "Needs you"}</Badge>;

function swordsDraft() {
  const j = job("JOB-26042");
  const fit = installs().find((i) => i.jobId === "JOB-26042");
  const wos = workOrders().filter((w) => w.jobId === "JOB-26042");
  const fascia = wos.find((w) => w.id === "WO-3107");
  const windows = wos.find((w) => w.id === "WO-3104");
  const fascStage = fascia ? (fascia.col === "assembly" ? "being wired and assembled" : fascia.col === "qa" ? "in final quality checks" : fascia.col === "fit" ? "finished and checked" : "in fabrication") : "in production";
  return "Hi, a quick update on your rebrand.\n\n"
    + "Your illuminated fascia is " + fascStage + " in our Swords workshop. Once it's built it runs a 24-hour light test before it leaves the building. "
    + "The window graphics and van graphics are " + (windows && windows.col === "fit" ? "printed and ready" : "scheduled to print this week") + ".\n\n"
    + (fit ? "Fitting is pencilled in for " + dayLabel(fit.date) + ", " + fit.slot + ", so we're up and finished before you open. " + fitter(fit.fitterId).name + " will bring a lift for the fascia. " : "")
    + "Your account is " + (j && j.paidPct >= 100 ? "fully paid, so there's nothing due from you." : "up to date.") + "\n\n"
    + "We'll confirm the fitting time two days before. Any questions, reply here or call the workshop.\n\nSigns ASAP";
}

export default function AgentOverview(_props: { v: any }) {
  const [s] = useDemo();
  const f = fleet();
  const h = headline();
  const [draftOpen, setDraftOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const proposalsOpen = AGENTS.flatMap((a) => a.proposals).filter((p) => !s.agentDone[p.id]).length;
  const runsToday = AGENTS.flatMap((a) => a.runs).filter((r) => r.at.getTime() >= bd(0).getTime()).length;
  const needsYou = AGENTS.filter((a) => a.runs[0]?.result === "needs you").length;

  const todayLine: Record<string, string> = {
    briefing: "College tender " + eur(TENDER_WON.value || 0) + " in procurement. Fleet " + f.done + "/" + f.total + " vans done, " + f.inProg + " on the board. " + h.proofs + " proofs waiting, " + h.materials + " material holds.",
    watchdog: awaitingProofs().some((p) => p.jobId === "JOB-26043") ? "Holding Celbridge CU out of CNC until proof v3 is approved. Camile letters ETA unconfirmed." : "Celbridge CU released on approved v3. Watching Camile letters ETA.",
    tender: (s.tenderStage >= 5 ? "Draft costed for " : "New pack waiting: ") + TENDER_DRAFT.title + ", " + TENDER_DRAFT.floors + " floors, " + TENDER_DRAFT.warnings.length + " ambiguities to clear.",
    quotecoach: (() => { const r = job("JOB-26050"); return r ? "Rush Physio lightbox at " + pct(margin(r.price, r.cost)) + " margin (" + eur(r.price) + ") against a " + s.marginFloor + "% floor." : ""; })(),
    planner: "Print station is the pinch this week: fleet batch B plus banners. Batch C slotted for next week.",
    proof: h.proofs + " proof" + (h.proofs === 1 ? "" : "s") + " awaiting sign-off. Nothing unapproved has reached CNC or print.",
    updates: "One draft waiting: Swords Accountancy progress note. Never sent without you.",
  };

  const run = (agentId: string, pid: string) => {
    switch (pid) {
      case "bp1":
        markAgentDone("bp1", "Added Kinsealy fitter confirmation to tomorrow's briefing.", "JOB-26056");
        toast("Added to tomorrow's briefing");
        break;
      case "wp1":
        addTask({ title: "Ask the Poland partner for a carrier tracking number (Camile letters)", assignee: "aisling", dept: "Accounts", jobId: "JOB-26045", priority: "Medium", due: bd(1), status: "Open" });
        markAgentDone("wp1", "Created a chase task from Ops Watchdog: carrier tracking for Camile letters.", "JOB-26045");
        toast("Chase task created for Aisling");
        break;
      case "tp1": go("Tenders", "inbox"); break;
      case "qp1": {
        const r = job("JOB-26050");
        setJobPrice("JOB-26050", 3540, "Applied Quote Coach price to Rush Physio lightbox: " + eur(3540) + " (" + pct(margin(3540, r ? r.cost : 2190)) + " margin). Quote still unsent.");
        markAgentDone("qp1");
        toast("Rush Physio quote set to " + eur(3540) + " (not sent)");
        break;
      }
      case "pp1":
        shiftPlan("WO-3106", [0, 0, 0, 1.5, 0.5], "Moved Donabate banners to Thursday's open printer slot");
        markAgentDone("pp1");
        break;
      case "gp1": go("Jobs", "proofs"); break;
      case "up1": setDraft(swordsDraft()); setEditing(false); setDraftOpen(true); break;
      default: go("Agents", agentId);
    }
  };

  return (
    <Page>
      <PageHead kicker="Agents" title="Seven agents, one rule: they propose, you decide"
        sub="Each agent has a narrow job in a sign workshop. None of them sends anything to a customer, changes a price on its own, or releases unapproved artwork." />
      <Grid min={170}>
        <Stat label="Proposals waiting" value={proposalsOpen} tone={proposalsOpen ? "accent" : undefined} sub="Simulated locally until you act" />
        <Stat label="Runs today" value={runsToday} sub="Across all seven agents" />
        <Stat label="Waiting on you" value={needsYou} sub="Latest run needs a decision" />
        <Stat label="Messages sent by agents" value={0} tone="ok" sub="Drafts only, every time" />
      </Grid>
      <Grid min={340} gap={14} style={{ alignItems: "start" }}>
        {AGENTS.map((a) => {
          const last = a.runs[0];
          return (
            <Card key={a.id} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <AgentFace shape={a.shape} state={faceState(last?.result)} tint={a.tint} size={46} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-.2px" }}>{a.name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 2 }}>{last ? "Last run " + stamp(last.at) : "No runs yet"}</div>
                </div>
                {last && resultBadge(last.result)}
              </div>
              <div style={{ fontSize: 13, color: "var(--body)", lineHeight: 1.55, marginTop: 12 }}>{a.mandate}</div>
              <div style={{ display: "flex", gap: 7, alignItems: "flex-start", marginTop: 8, fontSize: 12, color: "var(--dim)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ flex: "none", marginTop: 2 }}><path d="M7 11V8a5 5 0 0 1 10 0v3 M5.5 11h13v9h-13z" /></svg>
                <span>{a.guardrail}</span>
              </div>
              {todayLine[a.id] && (
                <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 12, background: "var(--surface-faint)", border: "1px solid var(--border)", fontSize: 12.5, color: "var(--ink)", lineHeight: 1.5 }}>
                  <div className="sa-label" style={{ marginBottom: 4 }}>Now</div>
                  {todayLine[a.id]}
                </div>
              )}
              <div className="sa-label" style={{ marginTop: 14, marginBottom: 6 }}>Proposed actions</div>
              {a.proposals.map((p) => {
                const done = !!s.agentDone[p.id];
                return (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
                    <span style={{ flex: "1 1 180px", minWidth: 0, fontSize: 12.5, color: done ? "var(--faint)" : "var(--ink)", textDecoration: done ? "line-through" : undefined }}>{p.text}</span>
                    {done ? <Badge tone="ok" dot>Done</Badge> : <Btn small kind={["tp1", "gp1"].indexOf(p.id) > -1 ? "ghost" : "primary"} onClick={() => run(a.id, p.id)}>{p.action}</Btn>}
                  </div>
                );
              })}
              <div className="sa-label" style={{ marginTop: 14, marginBottom: 6 }}>Run history</div>
              {a.runs.map((r, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", gap: 10, padding: "7px 0", borderTop: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 11, color: "var(--faint)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", paddingTop: 1 }}>{stamp(r.at)}</span>
                  <span style={{ fontSize: 12.5, color: "var(--body)", lineHeight: 1.45 }}>{r.summary}</span>
                </div>
              ))}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                {a.links.map((id) => <JobChip key={id} id={id} />)}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
                <Btn small onClick={() => go("Agents", a.id)}>Open conversation</Btn>
              </div>
            </Card>
          );
        })}
      </Grid>

      {draftOpen && (
        <div className="sa-modal-wrap" onClick={() => setDraftOpen(false)}>
          <div className="sa-modal" style={{ width: "min(620px,100%)" }} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Client update draft">
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "18px 22px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 600 }}>Progress note: Swords Accountancy Practice</div>
                <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 4 }}>Drafted by Client Updates from JOB-26042. Not sent.</div>
              </div>
              <Btn small kind="quiet" onClick={() => setDraftOpen(false)}>Close</Btn>
            </div>
            <div style={{ padding: "16px 22px" }}>
              {editing
                ? <TextField area rows={12} value={draft} onChange={setDraft} label="Draft" />
                : <div style={{ whiteSpace: "pre-wrap", fontSize: 13.5, lineHeight: 1.6, color: "var(--body)", padding: "14px 16px", borderRadius: 14, background: "var(--surface-faint)", border: "1px solid var(--border)" }}>{draft}</div>}
              <div className="sa-label" style={{ marginTop: 14, marginBottom: 8 }}>Next status timeline</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {[["Assembly", "Now"], ["24 h light test", dayLabel(bd(2))], ["QA sign-off", dayLabel(bd(4))], ["Fit", (() => { const fi = installs().find((i) => i.jobId === "JOB-26042"); return fi ? dayLabel(fi.date) : "TBC"; })()]].map(([k, d], i) => (
                  <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, border: "1px solid var(--border)", fontSize: 12, color: i === 0 ? "var(--accent)" : "var(--body)" }}>{k} · {d}</span>
                ))}
              </div>
              <Note style={{ marginTop: 14 }}>Approving marks the draft ready for you to send from your own email. Pulse sends nothing in this demo.</Note>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", padding: "14px 22px", borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
              <JobChip id="JOB-26042" />
              <span style={{ flex: 1 }} />
              <Btn onClick={() => setEditing(!editing)}>{editing ? "Preview" : "Edit"}</Btn>
              <Btn kind="primary" onClick={() => {
                markAgentDone("up1");
                log("human", "Managing Director", "Approved Client Updates draft for Swords Accountancy (not sent; demo).", "JOB-26042", "update", "ok");
                toast("Draft approved. Not sent: copy it to your email when ready");
                setDraftOpen(false);
              }}>Approve draft (not sent)</Btn>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
