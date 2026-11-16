/* Settings for Signs ASAP: identity, people, systems, AI controls, workflow rules,
   experience. Toggles persist in the demo store (settingsToggles). No payroll,
   no live connections, nothing that sends. */

import { useState, type ReactNode } from "react";
import { useDemo, getTab, update, toast, log, resetDemo, go, tasks } from "../model";
import { COMPANY, PEOPLE, FITTERS, INTEGRATIONS, AI_CONTROLS, WORKFLOW_RULES, DEMO_BANNER, STAFF_NOTE } from "../data";
import { weekDays, weekdayShort } from "../dates";
import { Page, PageHead, Grid, Card, Badge, Btn, Avatar, Note, KV, NumField, Source, type Tone } from "../ui";

const PERMS: { id: string; label: string }[] = [
  { id: "view", label: "View jobs" }, { id: "edit", label: "Edit jobs" }, { id: "quotes", label: "Approve quotes" },
  { id: "proofs", label: "Approve proofs" }, { id: "payments", label: "Record payments" }, { id: "release", label: "Release to production" },
];
const PERM_DEFAULTS: Record<string, string[]> = {
  md: ["view", "edit", "quotes", "proofs", "payments", "release"],
  conor: ["view", "edit"],
  liam: ["view", "edit", "release"],
  niamh: ["view", "edit", "release"],
  mark: ["view", "edit"],
  aisling: ["view", "edit", "payments"],
};

function Switch({ on, onChange, disabled, label }: { on: boolean; onChange?: () => void; disabled?: boolean; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={(e) => { e.stopPropagation(); if (!disabled && onChange) onChange(); }}
      style={{ position: "relative", width: 38, height: 22, flex: "none", borderRadius: 999, border: "1px solid " + (on ? "var(--accent-line)" : "var(--border)"),
        background: on ? "var(--accent-soft)" : "var(--track)", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.7 : 1, padding: 0, transition: "background .2s var(--ease)" }}>
      <span style={{ position: "absolute", top: 2, left: on ? 18 : 2, width: 16, height: 16, borderRadius: 999, background: on ? "var(--accent)" : "var(--dim)", transition: "left .2s var(--ease)" }} />
    </button>
  );
}

function Row({ title, detail, right, last }: { title: ReactNode; detail?: ReactNode; right: ReactNode; last?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 0", borderBottom: last ? undefined : "1px solid var(--border)" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, color: "var(--ink)", fontWeight: 500 }}>{title}</div>
        {detail && <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 3, lineHeight: 1.5 }}>{detail}</div>}
      </div>
      <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 8 }}>{right}</div>
    </div>
  );
}

export default function SignsSettings({ v }: { v: any }) {
  const [s] = useDemo();
  const tab = getTab("Settings", "org");
  const tog = (key: string, def: boolean) => (s.settingsToggles[key] !== undefined ? s.settingsToggles[key] : def);
  const flip = (key: string, def: boolean, text?: string) => {
    update((st) => ({ settingsToggles: { ...st.settingsToggles, [key]: !(st.settingsToggles[key] !== undefined ? st.settingsToggles[key] : def) } }));
    if (text) toast(text);
  };
  if (tab === "people") return <People tog={tog} flip={flip} />;
  if (tab === "systems") return <Systems />;
  if (tab === "ai") return <AiControls tog={tog} flip={flip} />;
  if (tab === "rules") return <Rules tog={tog} flip={flip} floor={s.marginFloor} />;
  if (tab === "experience") return <Experience v={v} />;
  return <Organisation />;
}

type TogProps = { tog: (k: string, d: boolean) => boolean; flip: (k: string, d: boolean, t?: string) => void };

/* ── Organisation ───────────────────────────────────────────────────────── */
function Organisation() {
  return (
    <Page>
      <PageHead kicker="Settings" title="Organisation" sub="Who Pulse is set up for. Identity details are taken from signsasap.ie and the Irish company register." />
      <Grid cols="repeat(auto-fit,minmax(360px,1fr))" gap={16} style={{ alignItems: "start" }}>
        <Card title="Identity" right={<Badge tone="ok" dot>Verified public details</Badge>}>
          <div style={{ padding: "22px 24px", borderRadius: 16, background: "linear-gradient(135deg,#0d1a20,#0b0e10 60%)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src={COMPANY.logo} alt="Signs ASAP, the branding specialists" style={{ width: "min(320px,100%)", height: "auto", display: "block" }} />
          </div>
          <Grid min={160} gap={10} style={{ marginTop: 14 }}>
            <KV k="Trading name" v={COMPANY.tradingName} />
            <KV k="Legal entity" v={COMPANY.legalName} />
            <KV k="CRO number" v={COMPANY.cro} mono />
            <KV k="Founded" v={String(COMPANY.founded)} mono />
            <KV k="Website" v={<a href={COMPANY.website} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>{COMPANY.websiteLabel}</a>} />
            <KV k="Public email" v={COMPANY.email} />
          </Grid>
          <div style={{ marginTop: 10 }}><KV k="Address" v={COMPANY.address} /></div>
          <div style={{ marginTop: 10 }}><KV k="Tagline" v={"“" + COMPANY.tagline + "”"} /></div>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <Card title="What the business does">
            <div style={{ fontSize: 13, color: "var(--body)", lineHeight: 1.6 }}>
              Designs, produces, prints, finishes and installs signage. {COMPANY.history} Some specialty components are sourced from Europe and China; 3-4 external fitting crews are on call.
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>{COMPANY.capabilities.map((c) => <Badge key={c} tone="info">{c}</Badge>)}</div>
            <div className="sa-label" style={{ marginTop: 14, marginBottom: 6 }}>In-house equipment</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{COMPANY.equipment.map((c) => <Badge key={c}>{c}</Badge>)}</div>
          </Card>
          <Card title="Operating settings">
            <Grid min={150} gap={10}>
              <KV k="Locale" v={COMPANY.locale} />
              <KV k="Currency" v="Euro (EUR)" />
              <KV k="Business week" v={COMPANY.businessWeek} />
              <KV k="Date format" v="Day month year (en-IE)" />
              <KV k="Owner account" v={COMPANY.ownerRole + " (role-based)"} />
              <KV k="Order to fit" v="2-3 weeks on complex jobs" />
            </Grid>
          </Card>
          <Note>The sister business in Málaga appears on the website but is out of scope here: this workspace covers Signs A.S.A.P. Limited in Swords only.</Note>
        </div>
      </Grid>
    </Page>
  );
}

/* ── People & permissions ───────────────────────────────────────────────── */
function People({ tog, flip }: TogProps) {
  const ts = tasks();
  return (
    <Page>
      <PageHead kicker="Settings" title="People and permissions"
        sub="Who can see, change and approve what. The owner keeps final say on prices, proofs and releases; the team can run the day without him." />
      <Card title="Permission matrix" sub="Toggle to try a different split. Managing Director permissions are locked on." pad={false}>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 760 }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(220px,1.6fr) repeat(" + PERMS.length + ",minmax(84px,1fr))", padding: "10px 20px", borderTop: "1px solid var(--border)", background: "var(--surface-faint)" }}>
              <span className="sa-label">Person</span>
              {PERMS.map((p) => <span key={p.id} className="sa-label" style={{ textAlign: "center" }}>{p.label}</span>)}
            </div>
            {PEOPLE.map((p) => (
              <div key={p.id} style={{ display: "grid", gridTemplateColumns: "minmax(220px,1.6fr) repeat(" + PERMS.length + ",minmax(84px,1fr))", alignItems: "center", padding: "11px 20px", borderTop: "1px solid var(--border)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <Avatar id={p.id} size={30} />
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13, color: "var(--ink)" }}>{p.name}</span>
                    <span style={{ display: "block", fontSize: 11.5, color: "var(--faint)" }}>{p.role} · {ts.filter((t) => t.assignee === p.id && t.status !== "Done").length} open tasks</span>
                  </span>
                </span>
                {PERMS.map((perm) => {
                  const key = "perm." + p.id + "." + perm.id;
                  const def = (PERM_DEFAULTS[p.id] || []).indexOf(perm.id) > -1;
                  return (
                    <span key={perm.id} style={{ display: "flex", justifyContent: "center" }}>
                      <Switch label={p.name + ": " + perm.label} on={p.owner ? true : tog(key, def)} disabled={!!p.owner}
                        onChange={() => flip(key, def, p.name + ": " + perm.label.toLowerCase() + (tog(key, def) ? " off" : " on"))} />
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </Card>
      <Grid cols="repeat(auto-fit,minmax(340px,1fr))" gap={16} style={{ alignItems: "start" }}>
        <Card title="Roles">
          <Row title="Owner (Managing Director)" detail="Everything, including pricing, tender submission, proof release overrides and deposit exceptions." right={<Badge tone="accent">1</Badge>} />
          <Row title="Design" detail="Proofs, artwork versions, survey review. Can issue a proof; the client or owner approves it." right={<Badge>1</Badge>} />
          <Row title="Workshop" detail="Work orders, QA, materials receipt. Can release to production only against an approved proof." right={<Badge>3</Badge>} />
          <Row title="Accounts" detail="Deposits, balances, supplier chasing. Reads the existing accounts package; does not replace it." right={<Badge>1</Badge>} last />
        </Card>
        <Card title="External fitting partners" sub="Site packs only: address, contact role, approved drawings, obstacles. No prices, no customer history.">
          {FITTERS.filter((f) => f.kind === "external").map((f, i, arr) => (
            <Row key={f.id} last={i === arr.length - 1} title={f.name} detail={f.crew + " · " + f.area}
              right={<Switch label={f.name + " site pack access"} on={tog("fitter." + f.id, true)} onChange={() => flip("fitter." + f.id, true, f.name + " site pack access " + (tog("fitter." + f.id, true) ? "paused" : "restored"))} />} />
          ))}
        </Card>
      </Grid>
      <Source>{STAFF_NOTE}</Source>
    </Page>
  );
}

/* ── Systems & integrations ─────────────────────────────────────────────── */
const statusTone = (s: string): Tone => (s === "Mock connection" ? "info" : s === "Planned" ? "muted" : "bad");
function Systems() {
  const [asked, setAsked] = useState<Record<string, boolean>>({});
  return (
    <Page>
      <PageHead kicker="Settings" title="Systems and integrations"
        sub="Pulse sits above the tools that already work. The accounts and workshop package stays the system of record; Illustrator, CAD and email stay where they are." />
      <Note tone="warn">Nothing on this page is live. Statuses are Planned, Mock connection or Not connected, and no credentials are stored.</Note>
      <Grid min={320} gap={14}>
        {INTEGRATIONS.map((i) => (
          <Card key={i.id} title={i.name} sub={i.vendor} right={<Badge tone={statusTone(i.status)} dot>{i.status}</Badge>}>
            <div style={{ fontSize: 13, color: "var(--body)", lineHeight: 1.55 }}>{i.does}</div>
            {i.note && <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 8, lineHeight: 1.5 }}>{i.note}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
              {asked[i.id]
                ? <Badge tone="ok" dot>Noted for scoping</Badge>
                : <Btn small onClick={() => { setAsked({ ...asked, [i.id]: true }); log("human", "Managing Director", "Flagged “" + i.name + "” for integration scoping (no connection made).", undefined, "settings", "info"); toast("Noted for scoping. Nothing connects in this demo."); }}>
                    {i.status === "Planned" ? "Confirm vendor details" : i.status === "Mock connection" ? "Review mock behaviour" : "Add to roadmap"}
                  </Btn>}
              {i.id === "acct" && <Btn small kind="quiet" onClick={() => go("Finance", "deposits")}>See demo ledger</Btn>}
              {i.id === "email" && <Btn small kind="quiet" onClick={() => go("Tenders", "inbox")}>Tender Inbox</Btn>}
              {i.id === "phone" && <Btn small kind="quiet" onClick={() => go("Jobs", "surveys")}>Site surveys</Btn>}
              {i.id === "fitters" && <Btn small kind="quiet" onClick={() => go("Installations", "packs")}>Site packs</Btn>}
            </div>
          </Card>
        ))}
      </Grid>
    </Page>
  );
}

/* ── AI controls ────────────────────────────────────────────────────────── */
function AiControls({ tog, flip }: TogProps) {
  return (
    <Page>
      <PageHead kicker="Settings" title="AI controls" sub="What the agents may and may not do. Customer-facing and destructive actions always wait for a person." />
      <Grid cols="repeat(auto-fit,minmax(360px,1fr))" gap={16} style={{ alignItems: "start" }}>
        <Card title="Permissions for agents">
          {AI_CONTROLS.map((c, i) => {
            const on = c.locked ? true : tog("ai." + c.id, c.on);
            return (
              <Row key={c.id} last={i === AI_CONTROLS.length - 1} title={c.name}
                detail={c.locked ? "Locked on: a person must approve anything a customer sees or anything that cannot be undone." : undefined}
                right={<>{c.locked && <Badge>Locked</Badge>}<Switch label={c.name} on={on} disabled={c.locked} onChange={() => flip("ai." + c.id, c.on, c.name + (on ? ": off" : ": on"))} /></>} />
            );
          })}
        </Card>
        <Card title="What agents never do">
          {[
            ["Send anything to a customer", "Quotes, tender submissions and client updates are drafts until a person sends them outside Pulse."],
            ["Change a price on their own", "Quote Coach and Tender Estimator suggest; the owner sets the number."],
            ["Firm-price a missing specification", "Unspecified illumination, foundations or tactile signage stay flagged as provisional."],
            ["Release unapproved artwork", "Proof Guardian blocks CNC and print until a version is approved."],
            ["Promise a date the workshop can't make", "Production Planner offers slots; people confirm them."],
          ].map(([t, d], i, arr) => <Row key={t} last={i === arr.length - 1} title={t} detail={d} right={<Badge tone="ok">Enforced</Badge>} />)}
        </Card>
      </Grid>
    </Page>
  );
}

/* ── Workflow rules ─────────────────────────────────────────────────────── */
function Rules({ tog, flip, floor }: TogProps & { floor: number }) {
  const days = weekDays(0);
  return (
    <Page>
      <PageHead kicker="Settings" title="Workflow rules" sub="The few rules that protect quality and price without slowing the team down. Thresholds are adjustable assumptions, not stated Signs ASAP policy." />
      <Grid cols="repeat(auto-fit,minmax(360px,1fr))" gap={16} style={{ alignItems: "start" }}>
        <Card title="Rules">
          {WORKFLOW_RULES.map((r, i) => {
            const on = r.locked ? true : tog("rule." + r.id, r.on);
            return (
              <Row key={r.id} last={i === WORKFLOW_RULES.length - 1} title={r.name} detail={r.detail}
                right={<>{r.locked && <Badge>Locked</Badge>}<Switch label={r.name} on={on} disabled={r.locked} onChange={() => flip("rule." + r.id, r.on, r.name + (on ? " paused" : " on"))} /></>} />
            );
          })}
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <Card title="Margin floor" sub="Quote Coach warns below this gross margin. Used across Quotes, Tender Desk and Finance.">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <NumField label="Margin floor" value={floor} suffix="%" width={110} onChange={(n) => update(() => ({ marginFloor: Math.min(90, n) }))} />
              <span style={{ fontSize: 12.5, color: "var(--dim)" }}>Default 38%. Printed boards usually clear it; custom LED work is where it bites.</span>
            </div>
          </Card>
          <Card title="Deposit presets" sub="Recommended, never forced. Exceptions (like a 100% prepayment) are recorded per job.">
            <Grid min={120} gap={10}>
              <KV k="Printed boards & vinyl" v="30%" />
              <KV k="Vehicle branding" v="40%" />
              <KV k="Custom LED / fabricated" v="50%" />
            </Grid>
            <Btn small kind="quiet" style={{ marginTop: 10 }} onClick={() => go("Finance", "deposits")}>Deposits & balances</Btn>
          </Card>
          <Card title="Business week" sub="Production and fitting are planned Monday to Friday. Weekend work only when tagged exceptional.">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
              {days.map((d) => <div key={d.toISOString()} style={{ textAlign: "center", padding: "9px 0", borderRadius: 10, background: "var(--accent-soft)", color: "var(--ink)", fontSize: 12 }}>{weekdayShort(d)}</div>)}
              {["Sat", "Sun"].map((d) => <div key={d} style={{ textAlign: "center", padding: "9px 0", borderRadius: 10, background: "var(--track)", color: "var(--faint)", fontSize: 12 }}>{d}</div>)}
            </div>
          </Card>
        </div>
      </Grid>
    </Page>
  );
}

/* ── Experience ─────────────────────────────────────────────────────────── */
function Experience({ v }: { v: any }) {
  const [confirm, setConfirm] = useState(false);
  const light = v.theme === "light";
  return (
    <Page>
      <PageHead kicker="Settings" title="Experience" sub="How Pulse looks and behaves for this demo." />
      <Grid cols="repeat(auto-fit,minmax(340px,1fr))" gap={16} style={{ alignItems: "start" }}>
        <Card title="Theme">
          <Row title={light ? "Light" : "Dark glass (Harbour)"} detail="Signs ASAP amber on Pulse glass. Teal marks work in progress." right={<Btn small onClick={v.toggleTheme}>{light ? "Switch to dark" : "Switch to light"}</Btn>} />
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            {["var(--brand-amber)", "var(--brand-gold)", "var(--brand-orange)", "var(--teal-deep)"].map((c) => <span key={c} style={{ flex: 1, height: 28, borderRadius: 8, background: c }} />)}
          </div>
          <Source>Brand colours sampled from the official logo on signsasap.ie.</Source>
        </Card>
        <Card title="Workshop display">
          <Row title="TV mode" detail="Full-screen Now / Next / Blocked board for the production floor." right={<Btn small onClick={() => go("Production", "tv")}>Open</Btn>} last />
        </Card>
        <Card title="Demo data" tone="warn">
          <div style={{ fontSize: 13, color: "var(--body)", lineHeight: 1.55 }}>{DEMO_BANNER}. Staff names, prices other than the €7,500 tender, costs and invoices are illustrative. Edits you make are kept in this browser only.</div>
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            {confirm ? (
              <>
                <Btn kind="danger" onClick={() => { resetDemo(); setConfirm(false); }}>Confirm reset</Btn>
                <Btn kind="quiet" onClick={() => setConfirm(false)}>Cancel</Btn>
              </>
            ) : <Btn onClick={() => setConfirm(true)}>Reset demo</Btn>}
          </div>
          <Source>Reset restores the canonical 18 jobs, proofs, tender and ledger.</Source>
        </Card>
      </Grid>
    </Page>
  );
}
