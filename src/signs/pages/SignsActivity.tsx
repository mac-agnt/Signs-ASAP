/* Activity: By Job, Agents & Automation, Systems. The Live Feed tab is the stock
   Pulse live view. Every event says who did it: a person, an agent, or a mock
   system event. Nothing here is a live integration. */

import { useState } from "react";
import { useDemo, getTab, activities, jobs, job, openJob, go, stageLabel, stageTone, customer } from "../model";
import { AGENTS, INTEGRATIONS, STORY_IDS, type Activity, type Actor } from "../data";
import { at, stamp, relDay, dayLabel } from "../dates";
import { Page, PageHead, Grid, Card, Badge, Btn, JobChip, Stat, Seg, Empty, Note, Source, type Tone } from "../ui";

const ACTOR: Record<Actor, { label: string; tone: Tone }> = {
  human: { label: "Person", tone: "accent" },
  agent: { label: "Agent", tone: "info" },
  system: { label: "Mock system", tone: "muted" },
};
const toneOf = (a: Activity): Tone => (a.tone === "ok" ? "ok" : a.tone === "warn" ? "warn" : a.tone === "bad" ? "bad" : "info");

export default function SignsActivity(_props: { v: any }) {
  useDemo();
  const tab = getTab("Activity", "feed");
  if (tab === "agents") return <AgentsAutomation />;
  if (tab === "systems") return <Systems />;
  return <ByJob />;
}

function ActorBadge({ a }: { a: Actor }) {
  return <Badge tone={ACTOR[a].tone}>{ACTOR[a].label}</Badge>;
}

function EventRow({ e, showJob = true, last }: { e: Activity; showJob?: boolean; last?: boolean }) {
  return (
    <div className={e.jobId ? "sa-click-row" : undefined} onClick={e.jobId ? () => openJob(e.jobId!) : undefined}
      style={{ display: "grid", gridTemplateColumns: "18px minmax(0,1fr)", gap: 10, padding: "0 6px", borderRadius: 10 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span style={{ width: 9, height: 9, borderRadius: 5, marginTop: 13, flex: "none", background: "var(--" + (toneOf(e) === "info" ? "teal" : toneOf(e)) + ")", boxShadow: "0 0 0 3px var(--surface)" }} />
        {!last && <span style={{ flex: 1, width: 1, background: "var(--border-strong)", marginTop: 3 }} />}
      </div>
      <div style={{ padding: "9px 0 11px", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11.5, color: "var(--faint)", fontVariantNumeric: "tabular-nums" }}>{stamp(e.at)}</span>
          <ActorBadge a={e.actor} />
          <span style={{ fontSize: 12, color: "var(--dim)" }}>{e.who}</span>
        </div>
        <div style={{ fontSize: 13, color: "var(--ink)", marginTop: 4, lineHeight: 1.45 }}>{e.text}</div>
        {showJob && e.jobId && <div style={{ marginTop: 6 }}><JobChip id={e.jobId} /></div>}
      </div>
    </div>
  );
}

/* ── By job ─────────────────────────────────────────────────────────────── */
function ByJob() {
  const all = activities();
  const [scope, setScope] = useState<"story" | "all">("story");
  const js = jobs();
  const ids = scope === "story" ? STORY_IDS : js.filter((j) => all.some((a) => a.jobId === j.id)).map((j) => j.id);
  const unlinked = all.filter((a) => !a.jobId);
  const today = all.filter((a) => relDay(a.at) === "Today");
  return (
    <Page>
      <PageHead kicker="Activity" title="By job"
        sub="Each job's history as one thread: who did what, in order. Click any event to open the job."
        actions={<Seg value={scope} onChange={setScope} size="sm" options={[{ id: "story", label: "Six story threads" }, { id: "all", label: "Every job with activity" }]} />} />
      <Grid min={170}>
        <Stat label="Events today" value={today.length} sub={today.filter((a) => a.actor === "human").length + " by people, " + today.filter((a) => a.actor === "agent").length + " by agents"} />
        <Stat label="Jobs with movement today" value={new Set(today.filter((a) => a.jobId).map((a) => a.jobId)).size} sub="Across the 18-job demo board" />
        <Stat label="Needs a look" value={all.filter((a) => a.tone === "warn" || a.tone === "bad").length} tone="warn" sub="Warnings across all threads" />
        <Stat label="Not tied to a job" value={unlinked.length} sub="Tender intake, briefings" />
      </Grid>
      <Grid cols="repeat(auto-fit,minmax(400px,1fr))" gap={14} style={{ alignItems: "start" }}>
        {ids.map((id) => {
          const j = job(id);
          if (!j) return null;
          const evs = all.filter((a) => a.jobId === id).sort((a, b) => a.at.getTime() - b.at.getTime());
          if (!evs.length) return null;
          return (
            <Card key={id} title={<span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}><span className="sa-mono" style={{ color: "var(--faint)", fontWeight: 500 }}>{id}</span>{j.title}</span>}
              sub={(customer(j.customerId)?.name || "New customer") + " · " + evs.length + " events · last " + stamp(evs[evs.length - 1].at)}
              right={<><Badge tone={stageTone(j.stage)} dot>{stageLabel(j.stage)}</Badge><Btn small kind="quiet" onClick={() => openJob(id)}>Open</Btn></>}>
              <div style={{ maxHeight: 360, overflowY: "auto", scrollbarWidth: "thin" }}>
                {evs.map((e, i) => <EventRow key={e.id} e={e} showJob={false} last={i === evs.length - 1} />)}
              </div>
            </Card>
          );
        })}
        {unlinked.length > 0 && (
          <Card title="Business-wide" sub="Events not tied to a single job" right={<Btn small kind="quiet" onClick={() => go("Tenders", "inbox")}>Tender Desk</Btn>}>
            <div style={{ maxHeight: 360, overflowY: "auto", scrollbarWidth: "thin" }}>
              {unlinked.slice().sort((a, b) => a.at.getTime() - b.at.getTime()).map((e, i, arr) => <EventRow key={e.id} e={e} last={i === arr.length - 1} />)}
            </div>
          </Card>
        )}
      </Grid>
    </Page>
  );
}

/* ── Agents & automation ────────────────────────────────────────────────── */
function AgentsAutomation() {
  const all = activities();
  const [f, setF] = useState<"all" | Actor>("all");
  const rows = all.filter((a) => f === "all" || a.actor === f);
  const runs = AGENTS.flatMap((a) => a.runs.map((r) => ({ ...r, agent: a }))).sort((a, b) => b.at.getTime() - a.at.getTime());
  return (
    <Page>
      <PageHead kicker="Activity" title="Agents and automation"
        sub="What the agents flagged, what people decided and which events were simulated system activity. Agents propose; people approve."
        actions={<Seg value={f} onChange={setF} size="sm" options={[
          { id: "all", label: "All " + all.length },
          { id: "agent", label: "Agents " + all.filter((a) => a.actor === "agent").length },
          { id: "human", label: "People " + all.filter((a) => a.actor === "human").length },
          { id: "system", label: "Mock system " + all.filter((a) => a.actor === "system").length },
        ]} />} />
      <Grid min={170}>
        <Stat label="Agent runs on record" value={runs.length} sub={runs.filter((r) => r.result === "needs you").length + " waiting for you"} />
        <Stat label="Flags raised" value={runs.filter((r) => r.result === "flagged").length} tone="warn" sub="Ops Watchdog, Quote Coach, Planner" />
        <Stat label="Human decisions" value={all.filter((a) => a.actor === "human").length} sub="Approvals, moves, payments" />
        <Stat label="Sent to customers by agents" value={0} tone="ok" sub="Agents never send. Drafts wait for a person." />
      </Grid>
      <Grid cols="repeat(auto-fit,minmax(380px,1fr))" gap={16} style={{ alignItems: "start" }}>
        <Card title="Event log" sub="Newest first. Click to open the job.">
          <div style={{ maxHeight: 620, overflowY: "auto", scrollbarWidth: "thin" }}>
            {rows.map((e, i) => <EventRow key={e.id} e={e} last={i === rows.length - 1} />)}
            {!rows.length && <Empty title="No events for this filter" />}
          </div>
        </Card>
        <Card title="Agent run history" sub="Each run, what it found and whether it needs a person." right={<Btn small onClick={() => go("Agents", "overview")}>All agents</Btn>}>
          {runs.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderTop: i ? "1px solid var(--border)" : undefined }}>
              <span style={{ width: 30, height: 30, flex: "none", borderRadius: 10, background: r.agent.tint, border: "1px solid var(--border-strong)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 600, color: "var(--ink)" }}>
                {r.agent.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" onClick={() => go("Agents", r.agent.id)} style={{ border: 0, background: "none", padding: 0, color: "var(--ink)", font: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{r.agent.name}</button>
                  <span style={{ fontSize: 11.5, color: "var(--faint)" }}>{stamp(r.at)}</span>
                  <span style={{ flex: 1 }} />
                  <Badge tone={r.result === "done" ? "ok" : r.result === "flagged" ? "warn" : "accent"}>{r.result === "done" ? "Done" : r.result === "flagged" ? "Flagged" : "Needs you"}</Badge>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--body)", marginTop: 4, lineHeight: 1.45 }}>{r.summary}</div>
              </div>
            </div>
          ))}
        </Card>
      </Grid>
    </Page>
  );
}

/* ── Systems ────────────────────────────────────────────────────────────── */
const statusTone = (s: string): Tone => (s === "Mock connection" ? "info" : s === "Planned" ? "muted" : "bad");

function Systems() {
  const sysEvents = activities().filter((a) => a.actor === "system");
  const syncLog = [
    { at: at(0, 7, 52), sys: "Company email (mock)", text: "Inbox check found 1 tender pack and 2 enquiries. Filed to Tender Inbox and Enquiries.", tone: "ok" as Tone },
    { at: at(0, 7, 30), sys: "Supplier file import (mock)", text: "Price list CSV compared: 0 changes to composite panel or film costs.", tone: "muted" as Tone },
    { at: at(0, 7, 0), sys: "Accounts package (planned)", text: "No connection. Payment statuses in Finance are a demo ledger, not a sync.", tone: "warn" as Tone },
    { at: at(-1, 17, 10), sys: "Phone survey capture (mock)", text: "Celbridge survey photos (4) and sketch attached to JOB-26043.", tone: "ok" as Tone },
    { at: at(-1, 15, 12), sys: "Fitting handoff (mock)", text: "Site pack shared with North County Installs for Seatown Coffee. Acknowledged.", tone: "ok" as Tone },
    { at: at(-2, 9, 0), sys: "Public tender portals", text: "Not connected. Tenders arrive by email in this demo.", tone: "muted" as Tone },
  ];
  return (
    <Page>
      <PageHead kicker="Activity" title="Systems"
        sub="How information would reach Pulse. In this demo every system event is simulated: no mailbox is read, no accounts data is synced, nothing is sent." />
      <Note tone="warn"><b style={{ color: "var(--ink)" }}>No live connections.</b> Statuses are Planned, Mock connection or Not connected. The existing accounts and workshop package stays the system of record (vendor to confirm).</Note>
      <Grid min={150}>
        <Stat label="Planned" value={INTEGRATIONS.filter((i) => i.status === "Planned").length} sub="Scoped, not built" />
        <Stat label="Mock connections" value={INTEGRATIONS.filter((i) => i.status === "Mock connection").length} tone="info" sub="Simulated in this demo" />
        <Stat label="Not connected" value={INTEGRATIONS.filter((i) => i.status === "Not connected").length} sub="Out of scope for now" />
        <Stat label="Live connections" value={0} tone="ok" sub="By design for a demo" />
      </Grid>
      <Grid cols="repeat(auto-fit,minmax(380px,1fr))" gap={16} style={{ alignItems: "start" }}>
        <Card title="Connections" right={<Btn small onClick={() => go("Settings", "systems")}>Manage in Settings</Btn>}>
          {INTEGRATIONS.map((i, k) => (
            <div key={i.id} style={{ padding: "11px 0", borderTop: k ? "1px solid var(--border)" : undefined }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, fontWeight: 600, flex: "1 1 200px" }}>{i.name}</span>
                <Badge tone={statusTone(i.status)} dot>{i.status}</Badge>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 3 }}>{i.vendor}</div>
              <div style={{ fontSize: 12.5, color: "var(--body)", marginTop: 5, lineHeight: 1.45 }}>{i.does}</div>
            </div>
          ))}
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <Card title="Mock sync log" sub="What the connections would report. Simulated entries.">
            {syncLog.map((l, k) => (
              <div key={k} style={{ display: "grid", gridTemplateColumns: "92px minmax(0,1fr)", gap: 10, padding: "9px 0", borderTop: k ? "1px solid var(--border)" : undefined }}>
                <span style={{ fontSize: 11.5, color: "var(--faint)", fontVariantNumeric: "tabular-nums" }}>{stamp(l.at)}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 3, background: "var(--" + (l.tone === "muted" ? "faint" : l.tone) + ")" }} />
                    <span style={{ fontSize: 12.5, color: "var(--ink)" }}>{l.sys}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--body)", marginTop: 3, lineHeight: 1.45 }}>{l.text}</div>
                </div>
              </div>
            ))}
          </Card>
          <Card title="System events on jobs" sub={sysEvents.length + " mock events linked to the activity log"}>
            {sysEvents.slice(0, 6).map((e, i, arr) => <EventRow key={e.id} e={e} last={i === arr.length - 1} />)}
            <Source>Last mock sync: {dayLabel(at(0, 7, 52))} 07:52. Times are demo times.</Source>
          </Card>
        </div>
      </Grid>
    </Page>
  );
}
