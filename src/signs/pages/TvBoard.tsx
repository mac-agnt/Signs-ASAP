/* Workshop floor display: Now / Next / Blocked, readable from across the floor.
   Everything is derived from the demo model; the "sync" ticker is a local
   simulation and says so. Nothing here talks to a live system. */

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useDemo, setTv, workOrders, installs, fleet, customer, job, person, fitter, openJob } from "../model";
import type { DemoState } from "../model";
import { COMPANY } from "../data";
import { bdFromToday, dayLabel, relDay, timeLabel } from "../dates";

type Lane = "now" | "next" | "blocked";
type TvItem = {
  key: string; lane: Lane; jobId: string; title: string; what: string; status: string; tone: string;
  owner: string; ownerInitials: string; ownerTint: string; date: Date; dueSoon: boolean; batch?: string;
};

const C = {
  ink: "#f3f5f4", body: "#c9d1cd", dim: "#8e9893", faint: "#5f6a66",
  amber: "#f6a20c", teal: "#3fb0d6", red: "#ff6b6b", green: "#4fd18b", yellow: "#f2c94c",
  card: "rgba(255,255,255,.045)", border: "rgba(255,255,255,.09)",
};

function ownerForBlocker(b: string): string {
  if (/proof/i.test(b)) return "conor";
  if (/deposit|ETA|supplier/i.test(b)) return "aisling";
  if (/approval/i.test(b)) return "md";
  return "md";
}

const COL_STATUS: Record<string, [string, string]> = {
  materials: ["Materials in", C.teal], ready: ["Ready for print / CNC", C.teal], fabrication: ["Printing & fabrication", C.amber],
  assembly: ["Assembly & wiring", C.amber], qa: ["QA", C.green], fit: ["Ready for fit", C.green],
};

export function tvItems(s?: DemoState): TvItem[] {
  const wos = workOrders(s);
  const out: TvItem[] = [];
  wos.forEach((w) => {
    const j = job(w.jobId, s);
    if (!j) return;
    const cust = customer(j.customerId)?.name || j.short;
    const p = person(w.personId);
    const blocked = !!w.locked || !!w.blocker;
    const title = w.batch ? "Fleet batch " + w.batch : j.short;
    if (blocked && w.col !== "fit") {
      const reason = w.blocker || "Locked";
      const o = person(ownerForBlocker(reason));
      out.push({ key: w.id, lane: "blocked", jobId: w.jobId, title, what: reason, status: w.locked ? "Locked" : "Blocked", tone: w.locked ? C.red : C.yellow,
        owner: o.name, ownerInitials: o.initials, ownerTint: o.tint, date: w.promised, dueSoon: bdFromToday(w.promised) <= 2, batch: w.batch });
      return;
    }
    if (w.col === "fabrication" || w.col === "assembly" || w.col === "qa") {
      out.push({ key: w.id, lane: "now", jobId: w.jobId, title, what: w.signType + (w.batch ? " · " + cust : ""), status: COL_STATUS[w.col][0], tone: COL_STATUS[w.col][1],
        owner: p.name, ownerInitials: p.initials, ownerTint: p.tint, date: w.promised, dueSoon: bdFromToday(w.promised) <= 1, batch: w.batch });
      return;
    }
    if (w.col === "ready" || w.col === "materials") {
      out.push({ key: w.id, lane: "next", jobId: w.jobId, title, what: w.next, status: COL_STATUS[w.col][0], tone: C.teal,
        owner: p.name, ownerInitials: p.initials, ownerTint: p.tint, date: w.promised, dueSoon: bdFromToday(w.promised) <= 1, batch: w.batch });
    }
  });
  installs(s).filter((i) => i.status !== "done").forEach((i) => {
    const n = bdFromToday(i.date);
    if (n < 0 || n > 4) return;
    const j = job(i.jobId, s);
    if (!j) return;
    const f = fitter(i.fitterId);
    const ini = f.kind === "internal" ? "IH" : f.name.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase();
    out.push({ key: i.id, lane: "next", jobId: i.jobId, title: j.short, what: "Fit " + i.slot + (i.status === "booked" ? "" : " (" + i.status + ")"), status: "Fitting", tone: C.green,
      owner: f.name, ownerInitials: ini, ownerTint: f.tint, date: i.date, dueSoon: n <= 1 });
  });
  const by = (a: TvItem, b: TvItem) => a.date.getTime() - b.date.getTime();
  const now = out.filter((x) => x.lane === "now").sort(by).slice(0, 4);
  const next = out.filter((x) => x.lane === "next").sort(by).slice(0, 4);
  const blocked = out.filter((x) => x.lane === "blocked").sort(by).slice(0, 4);
  return now.concat(next, blocked);
}

const LANES: { id: Lane; label: string; hint: string; color: string }[] = [
  { id: "now", label: "Now", hint: "On the benches", color: C.amber },
  { id: "next", label: "Next", hint: "Up next and fitting soon", color: C.teal },
  { id: "blocked", label: "Blocked", hint: "Needs a decision", color: C.red },
];

export function TvBoard({ fullscreen }: { fullscreen?: boolean }) {
  const [s] = useDemo();
  const items = useMemo(() => tvItems(s), [s]);
  const fl = fleet(s);
  const [clock, setClock] = useState(() => new Date());
  const [sync, setSync] = useState(() => ({ at: new Date(), panels: 9 + (new Date().getHours() % 6), flash: "" }));

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    const u = setInterval(() => setSync((p) => {
      const panels = p.panels >= 24 ? 24 : p.panels + 1;
      return { at: new Date(), panels, flash: panels !== p.panels ? "WO-3105" : "" };
    }), 20000);
    return () => { clearInterval(t); clearInterval(u); };
  }, []);

  const k = fullscreen ? 1 : 0.66;
  const px = (n: number) => Math.round(n * k) + "px";
  const fleetPct = (n: number) => (fl.total ? (n / fl.total) * 100 : 0) + "%";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: px(22), height: fullscreen ? "100%" : "auto", minHeight: 0, color: C.ink }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: px(28), flexWrap: "wrap" }}>
        <img src={COMPANY.logo} alt="Signs ASAP" style={{ height: px(46), width: "auto", display: "block" }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: px(30), fontWeight: 600, letterSpacing: "-.5px", lineHeight: 1.1 }}>Workshop board</div>
          <div style={{ fontSize: px(17), color: C.dim, marginTop: px(4) }}>{dayLabel(clock)} · {items.length} jobs on the board</div>
        </div>
        <div style={{ flex: "1 1 260px", minWidth: px(260), maxWidth: px(520) }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: px(16), color: C.body, marginBottom: px(8) }}>
            <span>15-van fleet livery</span>
            <span style={{ color: C.ink, fontWeight: 600 }}>{fl.done} / {fl.total} done</span>
          </div>
          <div style={{ display: "flex", height: px(16), borderRadius: px(10), overflow: "hidden", background: "rgba(255,255,255,.08)", gap: 2 }}>
            <div style={{ width: fleetPct(fl.done), background: C.green }} title={fl.done + " complete"} />
            <div style={{ width: fleetPct(fl.inProg), background: C.amber }} title={fl.inProg + " in progress"} />
            <div style={{ width: fleetPct(fl.waiting), background: "rgba(255,255,255,.14)" }} title={fl.waiting + " awaiting slot"} />
          </div>
          <div style={{ display: "flex", gap: px(16), fontSize: px(13), color: C.dim, marginTop: px(7) }}>
            <span><b style={{ color: C.green }}>{fl.done}</b> done</span>
            <span><b style={{ color: C.amber }}>{fl.inProg}</b> printing</span>
            <span><b style={{ color: C.body }}>{fl.waiting}</b> awaiting slot</span>
          </div>
        </div>
        <div style={{ textAlign: "right", marginLeft: "auto" }}>
          <div style={{ fontSize: px(52), fontWeight: 600, letterSpacing: "-1.5px", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{timeLabel(clock)}</div>
          <div style={{ fontSize: px(13), color: C.dim, marginTop: px(6) }}>Last mock sync {timeLabel(sync.at)} · simulated feed</div>
        </div>
      </div>

      {/* lanes */}
      <div style={{ flex: fullscreen ? "1 1 auto" : undefined, minHeight: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(" + px(330) + ",1fr))", gap: px(18) }}>
        {LANES.map((lane) => {
          const list = items.filter((i) => i.lane === lane.id);
          return (
            <div key={lane.id} style={{ display: "flex", flexDirection: "column", gap: px(12), minHeight: 0, padding: px(16), borderRadius: px(26), background: "rgba(255,255,255,.025)", border: "1px solid " + C.border, borderTop: "3px solid " + lane.color }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: px(12), padding: "0 " + px(4) }}>
                <span style={{ fontSize: px(34), fontWeight: 700, letterSpacing: "-.8px", color: lane.color }}>{lane.label}</span>
                <span style={{ fontSize: px(17), color: C.dim }}>{lane.hint}</span>
                <span style={{ marginLeft: "auto", fontSize: px(26), fontWeight: 600, color: C.body, fontVariantNumeric: "tabular-nums" }}>{list.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: px(10), minHeight: 0, overflowY: "auto", scrollbarWidth: "none" }}>
                {list.map((it) => {
                  const flash = sync.flash === it.key;
                  return (
                    <div key={it.key} onClick={() => { setTv(false); openJob(it.jobId); }} role="button" tabIndex={0}
                      style={{ position: "relative", cursor: "pointer", padding: px(16) + " " + px(18) + " " + px(16) + " " + px(22), borderRadius: px(18), background: C.card, border: "1px solid " + (flash ? C.amber : C.border), transition: "border-color .6s ease", overflow: "hidden", flexShrink: 0 }}>
                      <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: px(6), background: it.tone }} />
                      <div style={{ display: "flex", alignItems: "flex-start", gap: px(12) }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: px(27), fontWeight: 600, letterSpacing: "-.5px", lineHeight: 1.15, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{it.title}</div>
                          <div style={{ fontSize: px(18), color: C.body, marginTop: px(5), lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.what}</div>
                        </div>
                        <div style={{ flex: "none", textAlign: "right" }}>
                          <div style={{ fontSize: px(20), fontWeight: 600, color: it.dueSoon ? C.yellow : C.ink, whiteSpace: "nowrap" }}>{relDay(it.date)}</div>
                          {it.dueSoon && <div style={{ marginTop: px(5), display: "inline-block", fontSize: px(13), fontWeight: 600, padding: px(3) + " " + px(9), borderRadius: 999, background: "rgba(242,201,76,.16)", color: C.yellow }}>Due soon</div>}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: px(10), marginTop: px(12) }}>
                        <span style={{ width: px(32), height: px(32), borderRadius: 999, background: it.ownerTint, color: "#0b0e10", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: px(13), fontWeight: 700, flex: "none" }}>{it.ownerInitials}</span>
                        <span style={{ fontSize: px(17), color: C.body, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.owner}</span>
                        <span style={{ marginLeft: "auto", fontSize: px(14), fontWeight: 600, color: it.tone, padding: px(4) + " " + px(11), borderRadius: 999, background: "rgba(255,255,255,.06)", whiteSpace: "nowrap" }}>{it.status}</span>
                      </div>
                      {it.key === "WO-3105" && (
                        <div style={{ marginTop: px(10), fontSize: px(14), color: C.dim }}>Batch B panels printed: <b style={{ color: C.ink }}>{sync.panels} / 24</b> (simulated)</div>
                      )}
                    </div>
                  );
                })}
                {list.length === 0 && <div style={{ fontSize: px(20), color: C.dim, padding: px(18) }}>Nothing in this lane.</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: px(22), alignItems: "center", flexWrap: "wrap", fontSize: px(14), color: C.dim }}>
        {[[C.amber, "Making now"], [C.teal, "Queued"], [C.green, "QA / fitting"], [C.yellow, "Waiting"], [C.red, "Locked"]].map(([c, l]) => (
          <span key={l} style={{ display: "inline-flex", alignItems: "center", gap: px(8) }}><span style={{ width: px(12), height: px(12), borderRadius: 3, background: c }} />{l}</span>
        ))}
        <span style={{ marginLeft: "auto" }}>Demo display from local data · {COMPANY.tradingName} · {COMPANY.tagline}</span>
      </div>
    </div>
  );
}

export default function TvOverlay() {
  const [, ui] = useDemo();
  useEffect(() => {
    if (!ui.tv) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setTv(false); if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ui.tv]);
  if (!ui.tv) return null;
  const goFull = () => { const el = document.documentElement; if (!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen().catch(() => undefined); };
  return (
    <div className="sa-tv" role="dialog" aria-label="Workshop TV mode">
      <div style={{ position: "absolute", top: 18, right: 22, display: "flex", gap: 8, zIndex: 2 }}>
        <button type="button" onClick={goFull} style={tvBtn}>Browser full screen</button>
        <button type="button" onClick={() => { setTv(false); if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined); }} style={{ ...tvBtn, color: "#1a0d02", background: "linear-gradient(90deg,#f6a20c,#f07e0c)", borderColor: "transparent", fontWeight: 600 }}>Close (Esc)</button>
      </div>
      <div style={{ flex: 1, minHeight: 0, paddingTop: 34 }}>
        <TvBoard fullscreen />
      </div>
    </div>
  );
}

const tvBtn: CSSProperties = { height: 34, padding: "0 14px", borderRadius: 999, border: "1px solid rgba(255,255,255,.16)", background: "rgba(255,255,255,.06)", color: "#f3f5f4", font: "inherit", fontSize: 13, cursor: "pointer" };
