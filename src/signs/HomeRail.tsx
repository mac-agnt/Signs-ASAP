/* Home right rail: the owner's briefing. KPIs, briefing, decisions, workshop and
   movement live here so the Home centre column stays clean (template rule 3). */
import AgentFace from "../components/AgentFace";
import {
  useDemo, headline, fleet, go, openJob, workOrders, activities, jobs, margin, pct, eur, approveProof, approveMaterialOrder,
  materials, isApproved, getState, tenderStatus, TENDERS, person, installs, markDecision, setTv,
} from "./model";
import { stamp, dayLabel } from "./dates";
import { Badge, Btn, Meter, Avatar } from "./ui";
import { TENDER_DRAFT } from "./data";

const card: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--card-r,18px)", padding: "16px 16px 14px" };
const head: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 };
const ttl: React.CSSProperties = { flex: 1, fontSize: 13.5, fontWeight: 600, letterSpacing: "-.2px" };

export default function HomeRail() {
  const [s] = useDemo();
  const h = headline();
  const f = fleet();
  const wos = workOrders();
  const now = wos.filter((w) => ["fabrication", "assembly", "qa"].indexOf(w.col) > -1 && !w.locked);
  const next = wos.filter((w) => (w.col === "ready" || w.col === "materials") && !w.blocker && !w.locked);
  const blocked = wos.filter((w) => w.blocker || w.locked);
  const cuApproved = isApproved("PV-43-3");
  const matDone = materials().find((m) => m.id === "M-203")?.status !== "Short";
  const tStatus = tenderStatus(TENDER_DRAFT);
  const decisions = [
    { id: "cu", label: "Review Credit Union proof v3", sub: "Blocks the CNC slot · JOB-26043", done: cuApproved,
      primary: () => go("Jobs", "proofs"), quick: () => approveProof("PV-43-3"), quickLabel: "Approve" },
    { id: "mat", label: "Approve College materials", sub: "9 ACM sheets · " + eur(495) + " · JOB-26041", done: matDone,
      primary: () => go("Production", "materials"), quick: () => approveMaterialOrder("M-203"), quickLabel: "Approve" },
    { id: "fleet", label: "Review fleet capacity", sub: f.done + "/" + f.total + " vans · batch C needs a slot", done: !!s.decisionsDone.fleet,
      primary: () => { markDecision("fleet"); go("Production", "capacity"); } },
    { id: "tender", label: "Check tender estimate", sub: tStatus === "approved" ? "Approved by you · not sent" : "College Campus Directory · TND-034", done: tStatus === "approved",
      primary: () => go("Tenders", s.tenderStage >= 5 ? "costing" : "inbox") },
  ];
  const story = jobs().filter((j) => j.story);
  const moves = activities().slice(0, 5);
  const nextFits = installs().filter((i) => i.status !== "done").sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 2);
  const tiles = [
    { k: "Open jobs", v: h.open, go: () => go("Jobs", "live"), tone: "var(--ink)" },
    { k: "Proofs waiting", v: h.proofs, go: () => go("Jobs", "proofs"), tone: h.proofs ? "var(--warn)" : "var(--ok)" },
    { k: "In workshop", v: h.workshop, go: () => go("Production", "live"), tone: "var(--accent)" },
    { k: "Material holds", v: h.materials, go: () => go("Production", "materials"), tone: h.materials ? "var(--warn)" : "var(--ok)" },
  ];
  const brief = "The Swords accountancy rebrand is in production and fully paid. " +
    (cuApproved ? "Celbridge Credit Union v3 is approved and released to the CNC. " : "Celbridge Credit Union is waiting on proof v3; do not release it to CNC. ") +
    "The 15-van fleet is " + f.done + "/" + f.total + " complete; " + f.inProg + " vans are on the workshop board. College wayfinding tender " + eur(TENDERS[1].value || 0) + " has moved to procurement.";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* 1 · Today */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {tiles.map((t) => (
          <button key={t.k} type="button" onClick={t.go} className="sa-stat sa-click" style={{ textAlign: "left", padding: "12px 14px", font: "inherit", color: "inherit", cursor: "pointer" }}>
            <div className="sa-label">{t.k}</div>
            <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-.8px", marginTop: 6, color: t.tone, fontVariantNumeric: "tabular-nums" }}>{t.v}</div>
          </button>
        ))}
      </div>

      {/* 2 · Briefing */}
      <div style={{ ...card, background: "linear-gradient(160deg,var(--accent-faint),var(--surface) 60%)", borderColor: "var(--accent-line)" }}>
        <div style={head}>
          <AgentFace shape="crown-pebble" state="complete" tint="#2a1d10" size="26" />
          <span style={ttl}>Morning briefing</span>
          <span style={{ fontSize: 11, color: "var(--faint)" }}>Briefing agent</span>
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--body)", textWrap: "pretty" }}>{brief}</div>
        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          <Btn small kind="quiet" onClick={() => go("Agents", "briefing")}>Open briefing</Btn>
          <Btn small kind="quiet" onClick={() => openJob("JOB-26044")}>Fleet job</Btn>
        </div>
      </div>

      {/* 3 · Decisions */}
      <div style={card}>
        <div style={head}>
          <span style={ttl}>Your decisions</span>
          <Badge tone={decisions.filter((d) => !d.done).length ? "accent" : "ok"}>{decisions.filter((d) => !d.done).length} open</Badge>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {decisions.map((d, i) => (
            <div key={d.id} onClick={d.primary} className="sa-click-row" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 4px", borderTop: i ? "1px solid var(--border)" : 0, cursor: "pointer", borderRadius: 8 }}>
              <span style={{ width: 18, height: 18, flex: "none", borderRadius: 6, border: "1.5px solid " + (d.done ? "var(--ok)" : "var(--border-strong)"), background: d.done ? "var(--ok-soft)" : "none", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ok)", fontSize: 11 }}>{d.done ? "✓" : ""}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: d.done ? "var(--dim)" : "var(--ink)", textDecoration: d.done ? "line-through" : "none" }}>{d.label}</div>
                <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.sub}</div>
              </div>
              {!d.done && d.quick && <Btn small kind="primary" onClick={d.quick}>{d.quickLabel}</Btn>}
            </div>
          ))}
        </div>
      </div>

      {/* 4 · Workshop mini-board */}
      <div style={card}>
        <div style={head}>
          <span style={ttl}>Workshop live</span>
          <Btn small kind="teal" onClick={() => setTv(true)}>TV mode</Btn>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 10 }}>
          {[{ k: "Now", n: now.length, c: "var(--accent)" }, { k: "Next", n: next.length, c: "var(--teal)" }, { k: "Blocked", n: blocked.length, c: "var(--warn)" }].map((l) => (
            <div key={l.k} onClick={() => go("Production", "live")} className="sa-click" style={{ padding: "8px 10px", borderRadius: 12, background: "var(--surface-faint)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: ".1em", color: l.c, textTransform: "uppercase" }}>{l.k}</div>
              <div style={{ fontSize: 20, fontWeight: 600, marginTop: 2 }}>{l.n}</div>
            </div>
          ))}
        </div>
        {now.slice(0, 3).map((w) => (
          <div key={w.id} onClick={() => openJob(w.jobId)} className="sa-click" style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 2px" }}>
            <Avatar id={w.personId} size={20} />
            <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w.title}</span>
            <span style={{ fontSize: 11, color: "var(--faint)" }}>{dayLabel(w.promised)}</span>
          </div>
        ))}
        {blocked.slice(0, 2).map((w) => (
          <div key={w.id} onClick={() => openJob(w.jobId)} className="sa-click" style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 2px" }}>
            <span style={{ width: 20, height: 20, borderRadius: 10, background: "var(--warn-soft)", color: "var(--warn)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flex: "none" }}>!</span>
            <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: "var(--body)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w.blocker || "Locked"}</span>
          </div>
        ))}
        <div style={{ marginTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--dim)", marginBottom: 6 }}><span>15-van fleet</span><span>{f.done}/{f.total} complete</span></div>
          <Meter value={f.done} max={f.total} tone="ok" />
        </div>
      </div>

      {/* 5 · Margins */}
      <div style={card}>
        <div style={head}>
          <span style={ttl}>Story job margins</span>
          <span style={{ fontSize: 11, color: "var(--faint)" }}>illustrative</span>
        </div>
        {story.map((j) => {
          const m = margin(j.price, j.cost);
          return (
            <div key={j.id} onClick={() => openJob(j.id)} className="sa-click" style={{ display: "grid", gridTemplateColumns: "1fr 70px 46px", gap: 8, alignItems: "center", padding: "5px 0" }}>
              <span style={{ fontSize: 12, color: "var(--body)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{j.short}</span>
              <Meter value={m} max={70} tone={m < getState().marginFloor ? "warn" : m > 50 ? "ok" : "accent"} height={5} />
              <span style={{ fontSize: 11.5, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{pct(m)}</span>
            </div>
          );
        })}
        <Btn small kind="quiet" onClick={() => go("Finance", "profit")} style={{ marginTop: 6 }}>Job profit</Btn>
      </div>

      {/* 6 · Movement */}
      <div style={card}>
        <div style={head}>
          <span style={ttl}>Today’s movement</span>
          <Btn small kind="quiet" onClick={() => go("Activity", "byjob")}>All</Btn>
        </div>
        {moves.map((e) => (
          <div key={e.id} onClick={() => e.jobId && openJob(e.jobId)} className={e.jobId ? "sa-click" : undefined} style={{ display: "flex", gap: 9, padding: "7px 0", borderTop: "1px solid var(--border)" }}>
            <span style={{ width: 7, height: 7, flex: "none", marginTop: 6, borderRadius: 2, background: e.actor === "agent" ? "var(--accent)" : e.actor === "system" ? "var(--teal)" : "var(--ok)" }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12.5, lineHeight: 1.45, color: "var(--body)" }}><span style={{ color: "var(--ink)" }}>{e.who}</span> {e.text}</div>
              <div style={{ fontSize: 10.5, color: "var(--faint)", marginTop: 2 }}>{stamp(e.at)} · {e.actor === "agent" ? "agent" : e.actor === "system" ? "mock system" : "person"}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 7 · Owner-away view */}
      <div style={card}>
        <div style={head}><span style={ttl}>If you’re away today</span></div>
        <div style={{ fontSize: 12.5, lineHeight: 1.6, color: "var(--body)" }}>
          The team can keep building: {now.length} work orders are moving and every one has a named owner. {blocked.length} items wait on a decision, and each can be cleared from your phone.
        </div>
        {nextFits.map((i) => (
          <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 12 }}>
            <Badge tone={i.status === "booked" ? "ok" : "warn"}>{i.status}</Badge>
            <span style={{ flex: 1, minWidth: 0, color: "var(--body)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{jobs().find((j) => j.id === i.jobId)?.short}</span>
            <span style={{ color: "var(--faint)" }}>{dayLabel(i.date)}</span>
          </div>
        ))}
        <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 10 }}>Signed in as {person("md").name}</div>
      </div>
    </div>
  );
}
