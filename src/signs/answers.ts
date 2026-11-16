/* Deterministic answers for the Home chat and the mini chat. No LLM, no network:
   every answer is computed from the live demo model and carries deep links. */

import {
  approvedProof, eur, fleet, headline, installs, jobs, latestProof, materials, margin, pct, quotes, enquiries,
  tenderCalc, TENDERS, workOrders, getState, tasks, payments, person, fitter,
} from "./model";
import { STATIONS, STATION_BACKGROUND, TENDER_DRAFT, TENDER_WON, type Station } from "./data";
import { dayLabel, relDay } from "./dates";

export type Target = { page: string; tab?: string } | { job: string };
export type Answer = {
  tool: string; effect: "read" | "write"; text: string; cols?: string[]; rows?: string[][];
  actions?: [string, number, Target?][]; confirm?: boolean; confirmSummary?: string;
};

export const CHIPS = [
  "What needs my approval?",
  "Which jobs are at risk?",
  "Price this signage tender",
  "Show production capacity",
];

export function stationLoad(): { id: Station; label: string; hours: number; cap: number; pct: number; days: number[] }[] {
  const wos = workOrders();
  return STATIONS.map((s) => {
    const days = [0, 1, 2, 3, 4].map((d) =>
      wos.filter((w) => w.station === s.id).reduce((a, w) => a + (w.dayPlan[d] || 0), 0) +
      STATION_BACKGROUND[s.id].reduce((a, b) => a + (b.dayPlan[d] || 0), 0));
    const hours = days.reduce((a, b) => a + b, 0);
    const cap = 7.5 * 5;
    return { id: s.id, label: s.label, hours, cap, pct: Math.round((hours / cap) * 100), days };
  });
}

function approvals(): Answer {
  const s = getState();
  const rows: string[][] = [];
  jobs().filter((j) => j.stage === "proof").forEach((j) => {
    const p = latestProof(j.id);
    rows.push(["Proof v" + (p ? p.v : "?") + " sign-off", j.short, j.id === "JOB-26043" ? "Blocks CNC" : "Client", "Conor"]);
  });
  const m = materials().find((x) => x.id === "M-203");
  if (m && m.status === "Short") rows.push(["Material order", "College plaques: 9 ACM sheets", eur(m.cost), "You"]);
  if ((s.tenderStatus[TENDER_DRAFT.id] || "new") !== "approved") rows.push(["Tender estimate", "College Campus Directory", eur(tenderCalc(TENDER_DRAFT).sell), "You"]);
  const rush = jobs().find((j) => j.id === "JOB-26050");
  if (rush && margin(rush.price, rush.cost) < s.marginFloor) rows.push(["Quote below floor", rush.short, pct(margin(rush.price, rush.cost)), "You"]);
  return {
    tool: "pulse_approvals_find", effect: "read",
    text: rows.length
      ? rows.length + " things are waiting on a decision. The Celbridge Credit Union proof is the one that matters most: v3 is with the branch and nothing goes to the CNC until it is signed off. The rest can be cleared from your phone in a couple of minutes."
      : "Nothing is waiting on you. Every proof, material order and quote in the demo has a decision against it.",
    cols: ["Decision", "Job", "Value / impact", "With"], rows,
    actions: [["Review Credit Union proof", 1, { page: "Jobs", tab: "proofs" }], ["Open approvals", 0, { page: "Work", tab: "approvals" }], ["Check tender estimate", 0, { page: "Tenders", tab: "inbox" }]],
  };
}

function risk(): Answer {
  const rows: string[][] = [];
  jobs().filter((j) => j.blocker && j.stage !== "completed").forEach((j) => rows.push([j.short, j.blocker || "", relDay(j.due), person(j.ownerId).name.split(" ")[0]]));
  const f = fleet();
  if (f.waiting) rows.push(["15-van fleet, batch C", f.waiting + " vans waiting for a print slot", "Next week", "Niamh"]);
  installs().filter((i) => i.status === "proposed").forEach((i) => rows.push([jobs().find((j) => j.id === i.jobId)?.short || i.jobId, "Fitter not confirmed (" + fitter(i.fitterId).name + ")", dayLabel(i.date), "You"]));
  return {
    tool: "pulse_jobs_at_risk", effect: "read",
    text: "Nothing is on fire. " + rows.length + " jobs carry a blocker, and each has a clear next step. The two worth your attention are the Celbridge proof (it holds the CNC slot) and the Camile letters, which are still waiting on an ETA from the Poland fabricator.",
    cols: ["Job", "Blocker", "Due", "Owner"], rows,
    actions: [["Open Workshop Live", 1, { page: "Production", tab: "live" }], ["Open Camile job", 0, { job: "JOB-26045" }]],
  };
}

function tender(): Answer {
  const s = getState();
  const won = tenderCalc(TENDER_WON);
  const draft = tenderCalc(TENDER_DRAFT);
  const extracted = s.tenderStage >= 5;
  return {
    tool: "tender_estimator_extract", effect: "read",
    text: extracted
      ? "The College Campus Directory pack is extracted: " + draft.lines.reduce((a, l) => a + l.qty, 0) + " items across 6 floors, drafted at " + eur(draft.sell) + " with " + pct(draft.marginPct) + " gross margin. Three items are flagged, including the entrance totem, which has no illumination or foundation spec, so it stays a provisional sum until you price it. For reference, the college job you won came in at " + eur(won.sell) + " on " + eur(won.cost) + " cost."
      : "A new tender pack arrived this morning: College Campus Directory Signage, 46 pages, 6 floors, due " + dayLabel(TENDER_DRAFT.due) + ". I can count the room plaques, directional signs and directory boards with page references, and flag anything the spec does not say. Pricing uses the rates from the college wayfinding job you won at " + eur(won.sell) + ". You approve every number before anything is sent.",
    cols: ["Reference job (won)", "Qty", "Rate", "Total"],
    rows: won.lines.map((l) => [l.label, String(l.qty), eur(l.unitPrice), eur(l.sell)]).concat([["Installation", "", "", eur(won.fitting)], ["Artwork & proofing", "", "", eur(won.artwork)], ["Total", "", "", eur(won.sell)]]),
    actions: [[extracted ? "Open costing" : "Extract the new tender", 1, { page: "Tenders", tab: extracted ? "costing" : "inbox" }], ["See the won reference", 0, { page: "Tenders", tab: "quantities" }]],
  };
}

function capacity(): Answer {
  const loads = stationLoad();
  const top = loads.slice().sort((a, b) => b.pct - a.pct)[0];
  return {
    tool: "production_planner_capacity", effect: "read",
    text: "This week the busiest station is " + top.label.toLowerCase() + " at " + top.pct + "% of available hours, mostly fleet batch B. Manufacturing is the bottleneck, not fitting: there are 3-4 partner crews on call but only 5 people in the workshop. Batch C (5 vans) is slotted for next week rather than squeezed in.",
    cols: ["Station", "Planned", "Available", "Load"],
    rows: loads.map((l) => [l.label, l.hours.toFixed(1) + " h", l.cap + " h", l.pct + "%"]),
    actions: [["Open TV mode", 1, { page: "Production", tab: "tv" }], ["Open capacity", 0, { page: "Production", tab: "capacity" }]],
  };
}

function fleetAns(): Answer {
  const f = fleet();
  return {
    tool: "jobs_find", effect: "read",
    text: "The window manufacturer's fleet is " + f.done + "/" + f.total + " complete. " + f.inProg + " vans are being printed and laminated this week and " + f.waiting + " are waiting for a slot next week. Batch A's balance invoice is raised in the demo ledger.",
    cols: ["Batch", "Vans", "Status", "Slot"],
    rows: f.batches.map((b) => [b.label, String(b.vans), b.status.replace("-", " "), b.slot]),
    actions: [["Open fleet job", 1, { job: "JOB-26044" }], ["Workshop board", 0, { page: "Production", tab: "live" }]],
  };
}

function creditUnion(): Answer {
  const p = latestProof("JOB-26043");
  const ap = approvedProof("JOB-26043");
  return {
    tool: "proof_guardian_check", effect: "read",
    text: ap && ap.v === 3
      ? "Celbridge Credit Union v3 is approved and released to the CNC: solid aluminium tray, warm white 3000K, 6.0 × 1.3 m (demo example). The 40% deposit is invoiced, so the aluminium order waits for it."
      : "Celbridge Credit Union is on proof v" + (p ? p.v : 3) + " and waiting on the branch's sign-off. v3 moves the logo clear of the alarm bell, confirms warm white and switches to a solid aluminium tray (priced in). Proof Guardian is holding the CNC release until v3 is approved.",
    actions: [["Review proof v3", 1, { page: "Jobs", tab: "proofs" }], ["Open site survey", 0, { page: "Jobs", tab: "surveys" }]],
  };
}

function accountancy(): Answer {
  return {
    tool: "jobs_find", effect: "read",
    text: "The Swords accountancy rebrand is in production and fully paid: the customer paid 100% upfront, which is an exception to the usual 30-50% deposit. Liam is wiring the LED fascia today; window graphics print Thursday and the fit is booked with a MEWP crew for " + dayLabel(installs().find((i) => i.jobId === "JOB-26042")!.date) + ".",
    actions: [["Open the job", 1, { job: "JOB-26042" }], ["Deposits & balances", 0, { page: "Finance", tab: "deposits" }]],
  };
}

function margins(): Answer {
  const s = getState();
  const byKind = (k: string) => jobs().filter((j) => j.kind === k);
  const avg = (arr: { price: number; cost: number }[]) => margin(arr.reduce((a, j) => a + j.price, 0), arr.reduce((a, j) => a + j.cost, 0));
  const rush = jobs().find((j) => j.id === "JOB-26050")!;
  return {
    tool: "quote_coach_review", effect: "read",
    text: "Printed boards and hoardings are your easy margin: the Portmarnock hoarding made 62.2% on simple work. Custom LED jobs run closer to 38% and vary more, because every one is different. Rush Physio's lightbox is quoted at " + pct(margin(rush.price, rush.cost)) + ", under your " + s.marginFloor + "% floor; Quote Coach suggests " + eur(3540) + ". All figures are illustrative demo values.",
    cols: ["Type", "Jobs", "Value", "Margin"],
    rows: [["Printed boards & vinyl", "print"], ["Vehicle branding", "vehicle"], ["Custom LED / fabricated", "led"]].map(([l, k]) => {
      const js = byKind(k);
      return [l, String(js.length), eur(js.reduce((a, j) => a + j.price, 0)), pct(avg(js))];
    }),
    actions: [["Open Price Intelligence", 1, { page: "Finance", tab: "intel" }], ["Review Rush Physio quote", 0, { page: "Sales", tab: "approvals" }]],
  };
}

function enquiriesAns(): Answer {
  const es = enquiries();
  const fresh = es.filter((e) => e.isNew).length;
  return {
    tool: "sales_enquiries_find", effect: "read",
    text: es.length + " enquiries came in during this sample week (illustrative, inside the 10-20 you described). " + fresh + " are from new customers, mostly referrals and the website; the rest are repeat accounts. " + es.filter((e) => e.status === "new").length + " still need a first reply.",
    cols: ["From", "Source", "Ask", "Status"],
    rows: es.slice(0, 6).map((e) => [e.name, e.source, e.ask, e.status]),
    actions: [["Open enquiries", 1, { page: "Sales", tab: "enquiries" }]],
  };
}

function fitting(): Answer {
  const list = installs().filter((i) => i.status !== "done").sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 5);
  return {
    tool: "installations_find", effect: "read",
    text: "Fitting is the flexible part of the operation: " + list.length + " fits are lined up across in-house and partner crews. Only Kinsealy still needs a crew confirmed.",
    cols: ["Job", "Crew", "When", "Status"],
    rows: list.map((i) => [jobs().find((j) => j.id === i.jobId)?.short || i.jobId, fitter(i.fitterId).name, dayLabel(i.date), i.status]),
    actions: [["Open fitting calendar", 1, { page: "Installations", tab: "calendar" }]],
  };
}

function money(): Answer {
  const pays = payments();
  const collected = pays.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0);
  const awaiting = pays.filter((p) => p.status === "invoiced").reduce((a, p) => a + p.amount, 0);
  return {
    tool: "finance_overlay", effect: "read",
    text: "In the demo ledger, " + eur(collected) + " of deposits and prepayments are collected and " + eur(awaiting) + " is invoiced and awaiting payment. Your accounts package stays the system of record; this view only reads alongside it (proposed sync, not connected).",
    actions: [["Deposits & balances", 1, { page: "Finance", tab: "deposits" }]],
  };
}

function briefing(): Answer {
  const h = headline();
  const f = fleet();
  const tWon = TENDERS[1];
  return {
    tool: "briefing_agent", effect: "read",
    text: "Today at Signs ASAP: " + h.open + " open jobs, " + h.proofs + " proofs waiting, " + h.workshop + " jobs in the workshop and " + h.materials + " on material holds. The Swords accountancy rebrand is in production and fully paid. Celbridge Credit Union is waiting on proof v3, so it stays off the CNC. The 15-van fleet is " + f.done + "/" + f.total + " complete with " + f.inProg + " vans on the workshop board. The college wayfinding tender (" + eur(tWon.value || 0) + ") has moved to procurement.",
    actions: [["What needs my approval?", 1, { page: "Work", tab: "approvals" }], ["Open dashboard", 0, { page: "Dashboard", tab: "executive" }]],
  };
}

function fallback(): Answer {
  const open = tasks().filter((t) => t.status !== "Done").length;
  return {
    tool: "pulse_search", effect: "read",
    text: "I can answer from the Signs ASAP demo records: jobs, proofs, tenders, the workshop board, fitting, quotes and margins. There are " + open + " open tasks across the team right now. Try one of the questions below.",
    actions: CHIPS.map((c, i) => [c, i === 0 ? 1 : 0] as [string, number]),
  };
}

export function signsAnswer(q: string): Answer {
  const s = q.toLowerCase();
  if (/approv|decision|sign.?off|waiting on me|need.*me/.test(s)) return approvals();
  if (/risk|late|behind|slip|block|stuck/.test(s)) return risk();
  if (/tender|plaque|estimat|price this|wayfinding|directory/.test(s)) return tender();
  if (/capacity|bottleneck|cnc|workshop|production|busy|tv/.test(s)) return capacity();
  if (/fleet|van|wrap/.test(s)) return fleetAns();
  if (/credit union|celbridge|proof|artwork/.test(s)) return creditUnion();
  if (/accountan|swords|prepaid|upfront/.test(s)) return accountancy();
  if (/margin|underquot|too cheap|profit|price/.test(s)) return margins();
  if (/enquir|lead|new customer|referral/.test(s)) return enquiriesAns();
  if (/fit|install|crew/.test(s)) return fitting();
  if (/deposit|balance|paid|invoice|cash|money/.test(s)) return money();
  if (/brief|today|morning|summary|what changed|overview/.test(s)) return briefing();
  return fallback();
}

export const quotesWaiting = () => quotes().filter((q) => q.status === "awaiting-owner" || q.status === "draft").length;
