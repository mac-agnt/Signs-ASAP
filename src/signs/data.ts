/* ─────────────────────────────────────────────────────────────────────────────
   Signs ASAP · canonical demo data
   ONE source of truth. Every page, agent, KPI and chart reads from here (through
   the selectors in model.ts, which merge in local demo edits). Never hardcode a
   count or a total in a view: derive it.

   Verified (public / call-supported): company identity, address, founding, the
   €7,500 college tender win, the 15-van fleet order, the Swords accountancy
   rebrand paid 100% upfront, 30-50% deposit habit, 5 in-house staff, 3-4 fitting
   teams, 2-3 weeks order-to-fit, 10-20 new enquiries a week.
   Everything else (staff names, prices other than €7,500, costs, invoices,
   suppliers, fitter companies) is ILLUSTRATIVE DEMO DATA, labelled as such.
   ───────────────────────────────────────────────────────────────────────────── */

import { at, bd } from "./dates";

/* ── Company ─────────────────────────────────────────────────────────────── */
export const COMPANY = {
  tradingName: "Signs ASAP",
  legalName: "Signs A.S.A.P. Limited",
  cro: "359799",
  website: "https://www.signsasap.ie/",
  websiteLabel: "signsasap.ie",
  address: "Unit 4, N1 Business Park, Nevinstown West, Swords, Co. Dublin, Ireland",
  addressShort: "Unit 4, N1 Business Park, Swords",
  email: "info@signsasap.ie",
  tagline: "Better Signage. Faster.",
  founded: 2002,
  history: "Started in Coolock in 2002, moved to Swords in 2008.",
  logo: "/brand/signs-asap-logo-white.png",
  brand: { amber: "#F49313", gold: "#FBBB17", orange: "#EA5A0C", teal: "#006D91", tealLight: "#3FB0D6" },
  capabilities: [
    "LED shopfront signs", "Built-up lettering", "Vehicle wraps & branding", "Banners", "Lightboxes",
    "Wide-format printing", "Window graphics", "Directional signage", "PVC boards", "Hoardings",
  ],
  equipment: ["Wide-format printers", "Lamination", "CNC router"],
  ownerRole: "Managing Director",
  ownerInitials: "MD",
  businessWeek: "Mon-Fri",
  locale: "en-IE · EUR · Europe/Dublin",
};

export const DEMO_BANNER = "Illustrative demo data · not connected to live systems";

/* ── People (fictional demo staff) ───────────────────────────────────────── */
export type Station = "design" | "cnc" | "print" | "prep";
export type Person = {
  id: string; name: string; initials: string; role: string; dept: string;
  station?: Station; email: string; tint: string; hoursPerDay: number; owner?: boolean;
};
export const PEOPLE: Person[] = [
  { id: "md", name: "Managing Director", initials: "MD", role: "Owner · Managing Director", dept: "Management",
    email: "info@signsasap.ie", tint: "#F49313", hoursPerDay: 0, owner: true },
  { id: "conor", name: "Conor Hayes", initials: "CH", role: "Design & Artwork", dept: "Design", station: "design",
    email: "conor@signsasap.ie", tint: "#3FB0D6", hoursPerDay: 7.5 },
  { id: "liam", name: "Liam Kelly", initials: "LK", role: "Fabrication & CNC", dept: "Workshop", station: "cnc",
    email: "liam@signsasap.ie", tint: "#e6c07a", hoursPerDay: 7.5 },
  { id: "niamh", name: "Niamh Doyle", initials: "ND", role: "Wide Format Print", dept: "Workshop", station: "print",
    email: "niamh@signsasap.ie", tint: "#b9a4f0", hoursPerDay: 7.5 },
  { id: "mark", name: "Mark Brennan", initials: "MB", role: "Prep & Dispatch", dept: "Workshop", station: "prep",
    email: "mark@signsasap.ie", tint: "#8fd6a8", hoursPerDay: 7.5 },
  { id: "aisling", name: "Aisling Ryan", initials: "AR", role: "Accounts & Collections", dept: "Accounts",
    email: "aisling@signsasap.ie", tint: "#f0a4b8", hoursPerDay: 7.5 },
];
export const STAFF_NOTE = "Staff names and addresses are fictional demo identities. Only info@signsasap.ie is a verified public mailbox.";

export const STATIONS: { id: Station; label: string; short: string; personId: string }[] = [
  { id: "design", label: "Design & artwork", short: "Design", personId: "conor" },
  { id: "cnc", label: "CNC & fabrication", short: "CNC", personId: "liam" },
  { id: "print", label: "Print & lamination", short: "Print", personId: "niamh" },
  { id: "prep", label: "Prep & assembly", short: "Prep", personId: "mark" },
];

/* ── Fitting partners (fictional) ─────────────────────────────────────────── */
export type Fitter = { id: string; name: string; kind: "internal" | "external"; crew: string; strengths: string; access: string; area: string; tint: string };
export const FITTERS: Fitter[] = [
  { id: "inhouse", name: "In-house fit", kind: "internal", crew: "Mark Brennan + Managing Director", strengths: "Small fascias, window graphics, vehicle application", access: "Ladders, towers", area: "Fingal", tint: "#F49313" },
  { id: "fft", name: "Fingal Fit-Out Crew", kind: "external", crew: "2-person team", strengths: "Shopfront fascias, built-up letters", access: "Towers, scaffold", area: "North Dublin", tint: "#3FB0D6" },
  { id: "nci", name: "North County Installs", kind: "external", crew: "2-person team", strengths: "Projecting signs, lightboxes, electrical first-fix", access: "Towers", area: "Fingal & Meath", tint: "#b9a4f0" },
  { id: "lac", name: "Leinster Access & Signs", kind: "external", crew: "3-person team + MEWP", strengths: "High-level fixing, LED fascias, hoardings", access: "MEWP / cherry picker", area: "Leinster", tint: "#8fd6a8" },
  { id: "bvf", name: "Boyne Valley Fitters", kind: "external", crew: "2-person team", strengths: "Hoardings, post signs, directional", access: "Ladders, post driver", area: "Meath & Louth", tint: "#e6c07a" },
];
export const FITTER_NOTE = "Fitting partner companies are fictional placeholders for the 3-4 crews Signs ASAP keeps on call.";

/* ── Customers ───────────────────────────────────────────────────────────── */
export type CustomerCat = "Commercial repeat" | "Franchise rollout" | "Small business" | "Housing & development" | "Public sector & education";
export type Customer = {
  id: string; name: string; cat: CustomerCat; town: string; contactRole: string;
  since: number; repeat: boolean; source: "Repeat" | "Referral" | "Website" | "Phone / email" | "Tender";
  note?: string; illustrative: true;
};
export const CUSTOMERS: Customer[] = [
  { id: "c-college", name: "College client (tender, name withheld)", cat: "Public sector & education", town: "Dublin", contactRole: "Facilities & estates manager", since: 2026, repeat: false, source: "Tender", note: "Won via public tender. Client name withheld in demo.", illustrative: true },
  { id: "c-swacc", name: "Swords Accountancy Practice", cat: "Small business", town: "Swords", contactRole: "Practice manager", since: 2019, repeat: true, source: "Repeat", note: "Full rebrand: LED shopfront, window graphics, one van. Paid 100% upfront.", illustrative: true },
  { id: "c-celcu", name: "Celbridge Credit Union", cat: "Commercial repeat", town: "Celbridge", contactRole: "Branch operations manager", since: 2026, repeat: false, source: "Referral", note: "Exact credit union, dimensions and commercials to be confirmed.", illustrative: true },
  { id: "c-fleet", name: "Window Manufacturer Fleet", cat: "Commercial repeat", town: "North Dublin", contactRole: "Fleet & marketing lead", since: 2021, repeat: true, source: "Repeat", note: "15-van livery order. Client name kept generic (call transcription uncertain).", illustrative: true },
  { id: "c-camile", name: "Camile (franchise)", cat: "Franchise rollout", town: "Dublin", contactRole: "Franchise fit-out coordinator", since: 2017, repeat: true, source: "Repeat", note: "Public reference client. Job values shown are illustrative.", illustrative: true },
  { id: "c-portdev", name: "Portmarnock Residential Development", cat: "Housing & development", town: "Portmarnock", contactRole: "Site manager", since: 2025, repeat: true, source: "Repeat", note: "48 ft × 4 ft site hoarding, printed and fitted.", illustrative: true },
  { id: "c-maldent", name: "Malahide Dental Clinic", cat: "Small business", town: "Malahide", contactRole: "Practice owner", since: 2026, repeat: false, source: "Website", illustrative: true },
  { id: "c-fingleis", name: "Fingal Leisure Centre", cat: "Public sector & education", town: "Swords", contactRole: "Centre manager", since: 2023, repeat: true, source: "Phone / email", illustrative: true },
  { id: "c-brennan", name: "Brennan's Butchers", cat: "Small business", town: "Skerries", contactRole: "Owner", since: 2026, repeat: false, source: "Referral", illustrative: true },
  { id: "c-rushphys", name: "Rush Physio Studio", cat: "Small business", town: "Rush", contactRole: "Clinic director", since: 2026, repeat: false, source: "Website", illustrative: true },
  { id: "c-harbour", name: "Harbour View Homes", cat: "Housing & development", town: "Balbriggan", contactRole: "Development sales lead", since: 2024, repeat: true, source: "Repeat", illustrative: true },
  { id: "c-nch", name: "Northside Credit Hire", cat: "Commercial repeat", town: "Santry", contactRole: "Operations manager", since: 2020, repeat: true, source: "Repeat", illustrative: true },
  { id: "c-balpharm", name: "Balbriggan Pharmacy", cat: "Small business", town: "Balbriggan", contactRole: "Pharmacist owner", since: 2022, repeat: true, source: "Referral", illustrative: true },
  { id: "c-donagolf", name: "Donabate Golf Club", cat: "Commercial repeat", town: "Donabate", contactRole: "Club secretary", since: 2018, repeat: true, source: "Repeat", illustrative: true },
  { id: "c-lusk", name: "Lusk Montessori", cat: "Small business", town: "Lusk", contactRole: "Owner", since: 2026, repeat: false, source: "Website", illustrative: true },
  { id: "c-kinsealy", name: "Kinsealy Garden Co.", cat: "Small business", town: "Kinsealy", contactRole: "Owner", since: 2021, repeat: true, source: "Repeat", illustrative: true },
  { id: "c-feltrim", name: "Feltrim Auto Services", cat: "Small business", town: "Swords", contactRole: "Workshop owner", since: 2020, repeat: true, source: "Referral", illustrative: true },
  { id: "c-seatown", name: "Seatown Coffee Co.", cat: "Small business", town: "Swords", contactRole: "Owner", since: 2025, repeat: true, source: "Referral", illustrative: true },
];

/** Public reference accounts: names appear on signsasap.ie. NO factual orders implied. */
export const REFERENCE_ACCOUNTS = [
  { id: "ref-mcd", name: "McDonald's", cat: "Franchise rollout" as CustomerCat, kinds: ["Shopfront", "Directional", "Lightbox"], prefs: "Brand-manual colours, franchise approval route", note: "Public reference on signsasap.ie" },
  { id: "ref-camile", name: "Camile", cat: "Franchise rollout" as CustomerCat, kinds: ["LED letters", "Fascia", "Window graphics"], prefs: "Repeat LED franchise signage, standard letter heights", note: "Public reference · repeat client per call" },
  { id: "ref-ads", name: "Airport Driving School", cat: "Commercial repeat" as CustomerCat, kinds: ["Vehicle branding", "Roof signs"], prefs: "Car livery kit, consistent across fleet", note: "Public reference on signsasap.ie" },
  { id: "ref-cartow", name: "CarTow.ie", cat: "Commercial repeat" as CustomerCat, kinds: ["Vehicle wraps", "Hi-vis chevrons"], prefs: "Truck graphics, reflective vinyl", note: "Public reference on signsasap.ie" },
  { id: "ref-hilton", name: "Hilton", cat: "Commercial repeat" as CustomerCat, kinds: ["Directional", "Room ID", "Event graphics"], prefs: "Brand-standard wayfinding", note: "Public reference on signsasap.ie" },
];

/* ── Jobs ────────────────────────────────────────────────────────────────── */
export type Stage = "enquiry" | "survey" | "quoting" | "proof" | "procurement" | "production" | "ready" | "booked" | "completed";
export const STAGES: { id: Stage; label: string; group: string }[] = [
  { id: "enquiry", label: "Enquiry", group: "Enquiry / Survey" },
  { id: "survey", label: "Site survey", group: "Enquiry / Survey" },
  { id: "quoting", label: "Quoting", group: "Quoting" },
  { id: "proof", label: "Proof pending", group: "Proof pending" },
  { id: "procurement", label: "Waiting materials", group: "Procurement" },
  { id: "production", label: "In production", group: "Production" },
  { id: "ready", label: "Ready to fit", group: "Ready to fit" },
  { id: "booked", label: "Install booked", group: "Install booked" },
  { id: "completed", label: "Completed", group: "Completed" },
];
/** Pipeline columns: the stage groups used for counts across the app. */
export const STAGE_GROUPS: { id: string; label: string; stages: Stage[] }[] = [
  { id: "intake", label: "Enquiry / Survey", stages: ["enquiry", "survey"] },
  { id: "quoting", label: "Quoting", stages: ["quoting"] },
  { id: "proof", label: "Proof pending", stages: ["proof"] },
  { id: "procurement", label: "Waiting materials", stages: ["procurement"] },
  { id: "production", label: "In production", stages: ["production"] },
  { id: "ready", label: "Ready to fit", stages: ["ready"] },
  { id: "booked", label: "Install booked", stages: ["booked"] },
  { id: "completed", label: "Completed", stages: ["completed"] },
];

export type JobKind = "print" | "vehicle" | "led";
export const KIND_LABEL: Record<JobKind, string> = { print: "Printed boards & vinyl", vehicle: "Vehicle branding", led: "Custom LED / fabricated" };

export type Job = {
  id: string; title: string; short: string; customerId: string; stage: Stage; kind: JobKind;
  scope: string; signTypes: string[]; site: string; price: number; cost: number;
  ownerId: string; due: Date; fitDate?: Date; story?: boolean; tenderId?: string;
  depositPct: number; depositNote?: string; paidPct: number; needsSurvey: boolean; needsProof: boolean;
  safety?: string; nextStep: string; blocker?: string; quoteId: string; created: Date;
  plannedHours: number; actualHours?: number; actualCost?: number;
};

export const JOBS: Job[] = [
  /* ── six story threads ── */
  { id: "JOB-26041", title: "College Wayfinding / Directory", short: "College wayfinding", customerId: "c-college", stage: "procurement", kind: "print",
    scope: "120 room ID plaques, 12 directional signs and 6 floor directory boards across a multi-floor college building, fitted out of hours.",
    signTypes: ["Room ID plaques", "Directional signs", "Floor directory boards"], site: "College campus, Dublin (site address on tender pack)",
    price: 7500, cost: 3851, ownerId: "md", due: bd(12), fitDate: bd(13), story: true, tenderId: "TND-031",
    depositPct: 30, depositNote: "Tender terms: 30% on order, balance on completion", paidPct: 30, needsSurvey: true, needsProof: true,
    nextStep: "Approve plaque & board materials order", blocker: "Composite panel + acrylic order awaiting owner approval",
    quoteId: "QUO-1187", created: bd(-9), plannedHours: 26 },
  { id: "JOB-26042", title: "Swords Accountancy Full Rebrand", short: "Swords Accountancy rebrand", customerId: "c-swacc", stage: "production", kind: "led",
    scope: "Illuminated LED shopfront fascia, frosted and printed window graphics, and branding on the practice's van.",
    signTypes: ["LED shopfront fascia", "Window graphics", "Van graphics"], site: "Main Street, Swords (demo address)",
    price: 12400, cost: 7610, ownerId: "liam", due: bd(4), fitDate: bd(6), story: true,
    depositPct: 100, depositNote: "Exception: customer paid 100% upfront (actual amount not disclosed; demo value)", paidPct: 100, needsSurvey: true, needsProof: true,
    safety: "Fascia at 3.4 m over public footpath. Isolate shop lighting circuit before LED connection.",
    nextStep: "Finish LED fascia assembly, then QA", quoteId: "QUO-1172", created: bd(-16), plannedHours: 54 },
  { id: "JOB-26043", title: "Celbridge Credit Union LED Sign", short: "Celbridge CU LED sign", customerId: "c-celcu", stage: "proof", kind: "led",
    scope: "Illuminated LED fascia sign, built-up face-lit letters on a composite tray. Dimensions are a demo example (6.0 m × 1.3 m), not a confirmed measurement.",
    signTypes: ["LED fascia", "Built-up letters"], site: "Main Street, Celbridge (demo address)",
    price: 8650, cost: 5330, ownerId: "conor", due: bd(11), fitDate: bd(14), story: true,
    depositPct: 40, depositNote: "40% deposit invoiced; needed before LED components are ordered", paidPct: 0, needsSurvey: true, needsProof: true,
    safety: "High-level fixing above entrance. CCTV and alarm bell within 300 mm of sign zone.",
    nextStep: "Client sign-off on proof v3", blocker: "Proof v3 not approved. Do not release to CNC.",
    quoteId: "QUO-1191", created: bd(-12), plannedHours: 38 },
  { id: "JOB-26044", title: "Window Manufacturer Fleet, 15 Vans", short: "15-van fleet livery", customerId: "c-fleet", stage: "production", kind: "vehicle",
    scope: "Part-wrap livery on 15 panel vans, printed and laminated in-house, applied in three phased batches.",
    signTypes: ["Van part-wrap", "Rear door graphics", "Cab vinyl"], site: "Applied at Signs ASAP workshop, Swords",
    price: 28500, cost: 18300, ownerId: "niamh", due: bd(10), story: true,
    depositPct: 30, depositNote: "30% deposit paid; balance invoiced per completed batch", paidPct: 30, needsSurvey: false, needsProof: true,
    nextStep: "Print & laminate batch B (4 vans)", quoteId: "QUO-1160", created: bd(-21), plannedHours: 150 },
  { id: "JOB-26045", title: "Camile Shopfront LED Letters", short: "Camile LED letters", customerId: "c-camile", stage: "procurement", kind: "led",
    scope: "Fabricated face-lit LED letters and logo for a franchise shopfront, bought-in letter shells, wired and fitted locally.",
    signTypes: ["Fabricated LED letters", "Logo panel"], site: "Franchise unit, Dublin (demo address)",
    price: 6800, cost: 4200, ownerId: "liam", due: bd(9), fitDate: bd(11), story: true,
    depositPct: 50, depositNote: "50% deposit received", paidPct: 50, needsSurvey: true, needsProof: true,
    nextStep: "Confirm ETA on fabricated letters (Poland)", blocker: "Fabricated letters: supplier ETA awaiting confirmation",
    quoteId: "QUO-1179", created: bd(-14), plannedHours: 22 },
  { id: "JOB-26046", title: "Portmarnock Development Hoarding", short: "Portmarnock hoarding", customerId: "c-portdev", stage: "completed", kind: "print",
    scope: "Printed site hoarding, about 48 ft × 4 ft (14.6 m × 1.2 m), on composite panels, fitted to existing timber hoarding.",
    signTypes: ["Printed hoarding panels"], site: "Development site, Portmarnock",
    price: 2450, cost: 925, ownerId: "niamh", due: bd(-3), fitDate: bd(-3), story: true,
    depositPct: 50, depositNote: "50% deposit paid; balance invoiced on completion", paidPct: 50, needsSurvey: false, needsProof: true,
    nextStep: "Balance invoice issued, awaiting payment", quoteId: "QUO-1166", created: bd(-15),
    plannedHours: 9, actualHours: 10.5, actualCost: 978 },

  /* ── twelve supporting jobs (fictional customers) ── */
  { id: "JOB-26047", title: "Malahide Dental: projecting sign + frosting", short: "Malahide Dental", customerId: "c-maldent", stage: "survey", kind: "print",
    scope: "Double-sided projecting sign and frosted privacy vinyl on two treatment-room windows.",
    signTypes: ["Projecting sign", "Frost vinyl"], site: "New Street, Malahide (demo)", price: 1850, cost: 980, ownerId: "md", due: bd(15),
    depositPct: 50, paidPct: 0, needsSurvey: true, needsProof: true, nextStep: "Site survey booked", quoteId: "QUO-1196", created: bd(-2), plannedHours: 8 },
  { id: "JOB-26048", title: "Fingal Leisure Centre: directional refresh", short: "Fingal Leisure directional", customerId: "c-fingleis", stage: "enquiry", kind: "print",
    scope: "Replace 14 faded internal directional signs and the car-park entrance panel.",
    signTypes: ["Directional signs", "Car-park panel"], site: "Swords (demo)", price: 3200, cost: 1540, ownerId: "md", due: bd(18),
    depositPct: 30, paidPct: 0, needsSurvey: true, needsProof: true, nextStep: "Owner to confirm survey slot", quoteId: "QUO-1199", created: bd(-1), plannedHours: 12 },
  { id: "JOB-26049", title: "Brennan's Butchers: fascia panel + vinyl", short: "Brennan's Butchers", customerId: "c-brennan", stage: "quoting", kind: "print",
    scope: "Printed composite fascia panel (4.2 m × 0.8 m) and window vinyl lettering.",
    signTypes: ["Fascia panel", "Window vinyl"], site: "Strand Street, Skerries (demo)", price: 1680, cost: 860, ownerId: "md", due: bd(14),
    depositPct: 50, paidPct: 0, needsSurvey: true, needsProof: true, nextStep: "Send quote (drafted, awaiting owner)", quoteId: "QUO-1194", created: bd(-4), plannedHours: 7 },
  { id: "JOB-26050", title: "Rush Physio Studio: illuminated lightbox", short: "Rush Physio lightbox", customerId: "c-rushphys", stage: "quoting", kind: "led",
    scope: "Single-sided LED lightbox (2.4 m × 0.6 m), opal acrylic face with applied vinyl.",
    signTypes: ["LED lightbox"], site: "Main Street, Rush (demo)", price: 3450, cost: 2190, ownerId: "md", due: bd(16),
    depositPct: 50, paidPct: 0, needsSurvey: true, needsProof: true, nextStep: "Quote Coach flagged margin below floor", quoteId: "QUO-1195", created: bd(-3), plannedHours: 16 },
  { id: "JOB-26051", title: "Harbour View Homes: phase 2 hoarding", short: "Harbour View hoarding", customerId: "c-harbour", stage: "quoting", kind: "print",
    scope: "Printed hoarding run for phase 2 show-house entrance, plus two post-mounted directional boards.",
    signTypes: ["Hoarding panels", "Post signs"], site: "Development site, Balbriggan (demo)", price: 3900, cost: 1610, ownerId: "md", due: bd(17),
    depositPct: 30, paidPct: 0, needsSurvey: false, needsProof: true, nextStep: "Quote sent, follow up Thursday", quoteId: "QUO-1192", created: bd(-6), plannedHours: 11 },
  { id: "JOB-26052", title: "Northside Credit Hire: van lettering x3", short: "Northside Credit Hire vans", customerId: "c-nch", stage: "proof", kind: "vehicle",
    scope: "Cut-vinyl lettering and rear chevrons on three courtesy vans.",
    signTypes: ["Van lettering", "Chevrons"], site: "Applied at workshop", price: 1950, cost: 1020, ownerId: "conor", due: bd(8),
    depositPct: 30, paidPct: 30, needsSurvey: false, needsProof: true, nextStep: "Client to sign off proof v2", quoteId: "QUO-1186", created: bd(-8), plannedHours: 9 },
  { id: "JOB-26053", title: "Balbriggan Pharmacy: window graphics", short: "Balbriggan Pharmacy windows", customerId: "c-balpharm", stage: "proof", kind: "print",
    scope: "Printed one-way vision on two windows and frosted band on the door.",
    signTypes: ["One-way vision", "Frost band"], site: "Drogheda Street, Balbriggan (demo)", price: 1240, cost: 610, ownerId: "conor", due: bd(7),
    depositPct: 50, paidPct: 50, needsSurvey: false, needsProof: true, nextStep: "Client to sign off proof v1", quoteId: "QUO-1189", created: bd(-7), plannedHours: 5 },
  { id: "JOB-26054", title: "Donabate Golf Club: event banners", short: "Donabate Golf banners", customerId: "c-donagolf", stage: "production", kind: "print",
    scope: "Six PVC mesh banners (3 m × 1 m) and ten correx tee boards for the winter classic.",
    signTypes: ["PVC banners", "Correx boards"], site: "Collected from workshop", price: 1320, cost: 520, ownerId: "niamh", due: bd(3),
    depositPct: 0, depositNote: "Account customer, invoiced on collection", paidPct: 0, needsSurvey: false, needsProof: true, nextStep: "Print, hem and eyelet", quoteId: "QUO-1183", created: bd(-6), plannedHours: 6 },
  { id: "JOB-26055", title: "Lusk Montessori: fascia panel", short: "Lusk Montessori fascia", customerId: "c-lusk", stage: "production", kind: "print",
    scope: "Printed 3 mm composite fascia panel (3.6 m × 0.7 m) with anti-graffiti laminate.",
    signTypes: ["Fascia panel"], site: "Main Street, Lusk (demo)", price: 980, cost: 410, ownerId: "mark", due: bd(2), fitDate: bd(5),
    depositPct: 50, paidPct: 50, needsSurvey: true, needsProof: true, nextStep: "QA then pack for fit", quoteId: "QUO-1180", created: bd(-10), plannedHours: 4 },
  { id: "JOB-26056", title: "Kinsealy Garden Co.: lightbox + post sign", short: "Kinsealy lightbox", customerId: "c-kinsealy", stage: "ready", kind: "led",
    scope: "LED lightbox over the shop entrance and a double-post roadside sign.",
    signTypes: ["LED lightbox", "Post sign"], site: "Malahide Road, Kinsealy (demo)", price: 4100, cost: 2460, ownerId: "mark", due: bd(3), fitDate: bd(3),
    depositPct: 50, paidPct: 50, needsSurvey: true, needsProof: true, safety: "Roadside work: stop/go board and hi-vis. Lightbox needs a fused spur (customer electrician).",
    nextStep: "Confirm fitter for Thursday", quoteId: "QUO-1175", created: bd(-15), plannedHours: 18 },
  { id: "JOB-26057", title: "Feltrim Auto Services: built-up lettering", short: "Feltrim Auto lettering", customerId: "c-feltrim", stage: "ready", kind: "led",
    scope: "Non-illuminated built-up acrylic letters on stand-offs over the workshop door.",
    signTypes: ["Built-up letters"], site: "Feltrim Industrial Park, Swords (demo)", price: 2300, cost: 1210, ownerId: "mark", due: bd(4), fitDate: bd(4),
    depositPct: 40, paidPct: 40, needsSurvey: true, needsProof: true, nextStep: "In-house fit Friday", quoteId: "QUO-1177", created: bd(-13), plannedHours: 10 },
  { id: "JOB-26058", title: "Seatown Coffee Co.: projecting sign + frost", short: "Seatown Coffee", customerId: "c-seatown", stage: "booked", kind: "print",
    scope: "Double-sided projecting sign on a wall bracket and frosted manifestation on the shopfront glazing.",
    signTypes: ["Projecting sign", "Frost manifestation"], site: "Main Street, Swords (demo)", price: 1580, cost: 790, ownerId: "mark", due: bd(2), fitDate: bd(2),
    depositPct: 50, paidPct: 50, needsSurvey: true, needsProof: true, nextStep: "Fit booked with North County Installs", quoteId: "QUO-1182", created: bd(-11), plannedHours: 7 },
];
export const STORY_IDS = ["JOB-26041", "JOB-26042", "JOB-26043", "JOB-26044", "JOB-26045", "JOB-26046"];

/* ── Fleet batches (15 vans = 6 + 4 + 5) ─────────────────────────────────── */
export type FleetBatch = { id: string; label: string; vans: number; status: "complete" | "in-progress" | "awaiting-slot"; detail: string; slot: string };
export const FLEET_BATCHES: FleetBatch[] = [
  { id: "A", label: "Batch A", vans: 6, status: "complete", detail: "Printed, laminated, applied, QA passed and handed back", slot: "Done" },
  { id: "B", label: "Batch B", vans: 4, status: "in-progress", detail: "Prep & cleaning done, printing + laminating on the wide-format", slot: "This week" },
  { id: "C", label: "Batch C", vans: 5, status: "awaiting-slot", detail: "Artwork approved, waiting for a print and application slot", slot: "Next week" },
];

/* ── Workshop work orders ───────────────────────────────────────────────── */
export type WoCol = "materials" | "ready" | "fabrication" | "assembly" | "qa" | "fit";
export const WO_COLS: { id: WoCol; label: string; short: string }[] = [
  { id: "materials", label: "Materials ordered", short: "Materials" },
  { id: "ready", label: "Ready for print / CNC", short: "Ready" },
  { id: "fabrication", label: "Printing & fabrication", short: "Print & fab" },
  { id: "assembly", label: "Assembly & wiring", short: "Assembly" },
  { id: "qa", label: "QA", short: "QA" },
  { id: "fit", label: "Ready for fit", short: "Ready for fit" },
];
export type WorkOrder = {
  id: string; jobId: string; title: string; signType: string; dims: string; materials: string; method: string;
  station: Station; personId: string; col: WoCol; hours: number; promised: Date; proofVersionId?: string;
  blocker?: string; next: string; safety?: string; batch?: string; locked?: boolean; dayPlan: number[];
};
/* dayPlan = hours planned Mon..Fri of the demo week on that work order's station. */
export const WORK_ORDERS: WorkOrder[] = [
  { id: "WO-3101", jobId: "JOB-26041", title: "College plaques, directional & directories", signType: "Room ID plaques · directional · directory boards", dims: "120 × 200×150 mm · 12 × 600×200 mm · 6 × 1200×900 mm",
    materials: "3 mm composite (ACM), 3 mm acrylic, UV print, tactile TBC", method: "UV flatbed print, CNC route, round corners, stand-off holes", station: "cnc", personId: "liam", col: "materials", hours: 14,
    promised: bd(10), proofVersionId: "PV-41-2", blocker: "Materials order awaiting owner approval", next: "Approve material order, then print plaques", dayPlan: [0, 0, 0, 0, 0] },
  { id: "WO-3102", jobId: "JOB-26045", title: "Camile LED letters: wire & mount", signType: "Fabricated face-lit letters + logo", dims: "Letter height 450 mm, logo 700 × 700 mm",
    materials: "Bought-in letter shells (Poland), LED modules 6500K, 12V driver, ACM backing", method: "Receive shells, fit LEDs, wire to driver, mount on rails", station: "prep", personId: "mark", col: "materials", hours: 9,
    promised: bd(9), proofVersionId: "PV-45-3", blocker: "Supplier ETA awaiting confirmation", next: "Chase ETA on letter shells", dayPlan: [0, 0, 0, 0, 0] },
  { id: "WO-3103", jobId: "JOB-26044", title: "Fleet batch C: 5 vans", signType: "Van part-wrap", dims: "5 × L2H2 panel van",
    materials: "Cast wrap film, gloss overlaminate", method: "Print, laminate, outgas 24h, apply", station: "print", personId: "niamh", col: "ready", hours: 40, batch: "C",
    promised: bd(10), proofVersionId: "PV-44-3", next: "Book print slot after batch B", dayPlan: [0, 0, 0, 0, 0] },
  { id: "WO-3104", jobId: "JOB-26042", title: "Swords Accountancy window graphics + van", signType: "Window graphics + van graphics", dims: "3 windows · 1 small van",
    materials: "Frost vinyl, printed window film, cast wrap film", method: "Print, plot, weed, apply", station: "print", personId: "niamh", col: "ready", hours: 6,
    promised: bd(5), proofVersionId: "PV-42-4", next: "Print window film Thursday", dayPlan: [0, 0, 0, 4, 2] },
  { id: "WO-3105", jobId: "JOB-26044", title: "Fleet batch B: 4 vans", signType: "Van part-wrap", dims: "4 × L2H2 panel van",
    materials: "Cast wrap film, gloss overlaminate", method: "Print, laminate, outgas 24h, apply", station: "print", personId: "niamh", col: "fabrication", hours: 32, batch: "B",
    promised: bd(4), proofVersionId: "PV-44-3", next: "Laminate panels, then application Wed-Fri", dayPlan: [7.5, 7, 6, 5, 4] },
  { id: "WO-3106", jobId: "JOB-26054", title: "Donabate Golf banners + tee boards", signType: "PVC mesh banners, correx boards", dims: "6 × 3000×1000 mm · 10 × 600×400 mm",
    materials: "PVC mesh 270gsm, 5 mm correx", method: "Print, hem, eyelet; print direct to correx", station: "print", personId: "niamh", col: "fabrication", hours: 5,
    promised: bd(3), proofVersionId: "PV-54-1", next: "Hem and eyelet banners", dayPlan: [0, 0.5, 1.5, 0, 0] },
  { id: "WO-3107", jobId: "JOB-26042", title: "Swords Accountancy LED fascia", signType: "Illuminated LED fascia, built-up letters", dims: "5.2 m × 0.9 m tray, 380 mm letters",
    materials: "3 mm ACM tray, 5 mm opal acrylic faces, LED modules 4000K, 2 × 60W drivers", method: "CNC route tray, fabricate letters, LED layout, wire, test 24h", station: "cnc", personId: "liam", col: "assembly", hours: 24,
    promised: bd(4), proofVersionId: "PV-42-4", next: "Finish wiring, 24h burn test", safety: "Low-voltage LED wiring; mains connection by customer electrician on fit day", dayPlan: [6, 6, 5, 4, 0] },
  { id: "WO-3108", jobId: "JOB-26055", title: "Lusk Montessori fascia panel", signType: "Printed composite fascia", dims: "3600 × 700 mm",
    materials: "3 mm ACM, anti-graffiti laminate", method: "Print, laminate, CNC cut, drill fixings", station: "prep", personId: "mark", col: "qa", hours: 3,
    promised: bd(2), proofVersionId: "PV-55-2", next: "QA sign-off, pack for Friday fit", dayPlan: [1, 1, 0, 0, 0] },
  { id: "WO-3109", jobId: "JOB-26056", title: "Kinsealy lightbox + post sign", signType: "LED lightbox, post sign", dims: "2.0 × 0.6 m lightbox · 1.8 × 1.2 m post sign",
    materials: "Aluminium extrusion, opal acrylic, LED modules, galvanised posts", method: "Built, burn-tested, QA passed", station: "prep", personId: "mark", col: "fit", hours: 0,
    promised: bd(3), proofVersionId: "PV-56-2", next: "Load van for Thursday", dayPlan: [0, 0, 0, 1, 0] },
  { id: "WO-3110", jobId: "JOB-26057", title: "Feltrim Auto built-up letters", signType: "Built-up acrylic letters", dims: "Letters 300 mm, run 3.1 m",
    materials: "10 mm black acrylic, stand-off locators, template", method: "Routed, painted, templated; QA passed", station: "prep", personId: "mark", col: "fit", hours: 0,
    promised: bd(4), proofVersionId: "PV-57-3", next: "In-house fit Friday", dayPlan: [0, 0, 0, 0, 1] },
  { id: "WO-3111", jobId: "JOB-26044", title: "Fleet batch A: 6 vans", signType: "Van part-wrap", dims: "6 × L2H2 panel van",
    materials: "Cast wrap film, gloss overlaminate", method: "Applied, QA passed, handed back", station: "print", personId: "niamh", col: "fit", hours: 0, batch: "A",
    promised: bd(-2), proofVersionId: "PV-44-3", next: "Complete: 6 of 15 handed back", dayPlan: [0, 0, 0, 0, 0] },
  { id: "WO-3112", jobId: "JOB-26058", title: "Seatown Coffee projecting sign", signType: "Projecting sign + frost", dims: "600 × 600 mm sign · 2 panes frost",
    materials: "ACM with UV print, steel bracket, frost vinyl", method: "Built; QA passed", station: "prep", personId: "mark", col: "fit", hours: 0,
    promised: bd(2), proofVersionId: "PV-58-2", next: "Fit Wednesday (North County Installs)", dayPlan: [0.5, 0, 0, 0, 0] },
  /* Celbridge CU: locked until proof v3 is approved. Unlocks into "Ready for print / CNC". */
  { id: "WO-3113", jobId: "JOB-26043", title: "Celbridge CU LED fascia: CNC & build", signType: "LED fascia, built-up face-lit letters", dims: "6.0 m × 1.3 m (demo example)",
    materials: "3 mm ACM tray, opal acrylic, LED modules (warm white per v3), drivers", method: "CNC route tray + letter returns, LED layout, wire, burn test", station: "cnc", personId: "liam", col: "ready", hours: 22,
    promised: bd(11), proofVersionId: "PV-43-3", locked: true, blocker: "Proof v3 awaiting client sign-off", next: "Wait for v3 approval", dayPlan: [0, 0, 0, 0, 0] },
];

/* Other planned station hours this week (design, small jobs, admin) so loads are realistic. */
export const STATION_BACKGROUND: Record<Station, { label: string; dayPlan: number[] }[]> = {
  design: [
    { label: "Proofs & revisions (CU v3, Northside, Pharmacy)", dayPlan: [4, 3, 2, 2, 1] },
    { label: "College tender artwork set-up", dayPlan: [2, 2, 3, 2, 2] },
    { label: "Quotes & mock-ups for new enquiries", dayPlan: [1.5, 2, 2, 2.5, 2] },
  ],
  cnc: [{ label: "Small routing jobs & templates", dayPlan: [1, 1, 1.5, 2, 2] }],
  print: [{ label: "Walk-in print & reprints", dayPlan: [0, 0, 0, 0, 1] }],
  prep: [
    { label: "Fleet batch B prep & application", dayPlan: [3, 3.5, 4, 4, 3.5] },
    { label: "Dispatch, van loading, site kit", dayPlan: [2, 2, 2, 2, 1.5] },
  ],
};

/* ── Site surveys ───────────────────────────────────────────────────────── */
export type Obstacle = { id: string; tag: "CCTV" | "Alarm bell" | "Electrical route" | "Downpipe" | "High-level fixing" | "Cable" | "Access"; x: number; y: number; note: string };
export type Survey = {
  id: string; jobId: string; date: Date; by: string; status: "booked" | "captured" | "shared";
  width: number; height: number; unit: "m"; mountHeight: string; location: string; access: string;
  power: string; installerNotes: string; obstacles: Obstacle[]; photos: string[]; illustrativeDims: boolean;
};
export const SURVEYS: Survey[] = [
  { id: "SV-43", jobId: "JOB-26043", date: bd(-6), by: "md", status: "shared", width: 6.0, height: 1.3, unit: "m", illustrativeDims: true,
    mountHeight: "Underside at approx. 3.1 m above footpath", location: "Front elevation, above main entrance",
    access: "Footpath 2.4 m wide; tower or MEWP needed; branch opens 09:30, fit before opening",
    power: "Spur available inside, left of entrance. Route through wall at top-left corner (customer electrician).",
    installerNotes: "Render is sound. Avoid drilling within 300 mm of the alarm bell. CCTV camera to stay clear of the sign return.",
    obstacles: [
      { id: "o1", tag: "CCTV", x: 82, y: 22, note: "CCTV camera on bracket, top right; keep 300 mm clear" },
      { id: "o2", tag: "Alarm bell", x: 14, y: 20, note: "Alarm bell box, top left; do not cover or drill near" },
      { id: "o3", tag: "Electrical route", x: 22, y: 56, note: "Cable entry for LED driver, left of door head" },
      { id: "o4", tag: "Downpipe", x: 95, y: 60, note: "Downpipe on right return; sign must stop 150 mm short" },
      { id: "o5", tag: "High-level fixing", x: 50, y: 30, note: "Fixing line ~3.1 m; chemical anchors into block" },
    ],
    photos: ["Front elevation", "Left: alarm bell", "Right: CCTV + downpipe", "Door head & cable entry"] },
  { id: "SV-42", jobId: "JOB-26042", date: bd(-14), by: "md", status: "shared", width: 5.2, height: 0.9, unit: "m", illustrativeDims: true,
    mountHeight: "3.4 m to underside", location: "Shopfront fascia", access: "Busy footpath; fit 07:00-09:00", power: "Existing sign spur reused",
    installerNotes: "Old fascia to be removed and skipped. Check timber behind for rot.", obstacles: [
      { id: "o1", tag: "Cable", x: 30, y: 40, note: "Old sign cable to be made safe" },
      { id: "o2", tag: "Downpipe", x: 4, y: 55, note: "Downpipe left side" }],
    photos: ["Existing fascia", "Left return", "Window set"] },
  { id: "SV-45", jobId: "JOB-26045", date: bd(-12), by: "md", status: "shared", width: 4.8, height: 0.6, unit: "m", illustrativeDims: true,
    mountHeight: "2.9 m", location: "Franchise unit fascia", access: "Shopping street; tower", power: "Spur behind fascia",
    installerNotes: "Landlord approval letter on file. Rail fixing into steel.", obstacles: [{ id: "o1", tag: "Electrical route", x: 60, y: 50, note: "Spur behind fascia" }],
    photos: ["Unit front", "Fascia close-up"] },
  { id: "SV-47", jobId: "JOB-26047", date: bd(1), by: "md", status: "booked", width: 0.6, height: 0.6, unit: "m", illustrativeDims: true,
    mountHeight: "TBC on survey", location: "Projecting sign position + two windows", access: "TBC", power: "None needed",
    installerNotes: "Owner to measure and photograph on site.", obstacles: [], photos: [] },
];

/* ── Artwork & proofs ───────────────────────────────────────────────────── */
export type ProofStatus = "approved" | "awaiting" | "superseded" | "changes";
export type ProofVersion = {
  id: string; jobId: string; v: number; date: Date; designer: string; summary: string; pantone: string;
  substrate: string; lighting: string; size: string; notes: string; emails: string; status: ProofStatus; swatch: string[];
};
export const PROOFS: ProofVersion[] = [
  { id: "PV-43-1", jobId: "JOB-26043", v: 1, date: bd(-9), designer: "conor", summary: "Initial layout from survey: logo left, name centred.",
    pantone: "Pantone 2945 C (blue), 7409 C (gold)", substrate: "Dibond (3 mm composite aluminium) tray", lighting: "Cool white 6500K",
    size: "6.0 m × 1.3 m (demo)", notes: "Letter height 420 mm.", emails: "Sent to branch manager. Reply: logo too close to alarm bell, prefers warmer light.", status: "superseded", swatch: ["#003da5", "#f6be00"] },
  { id: "PV-43-2", jobId: "JOB-26043", v: 2, date: bd(-5), designer: "conor", summary: "Adjusted positioning: logo moved 400 mm right to clear alarm bell; letters reduced to 400 mm.",
    pantone: "Pantone 2945 C, 7409 C", substrate: "Dibond (3 mm composite aluminium) tray", lighting: "Warm white 3000K",
    size: "6.0 m × 1.3 m (demo)", notes: "Return depth 100 mm.", emails: "Board asked for solid aluminium tray quote and confirmed warm white.", status: "superseded", swatch: ["#003da5", "#f6be00"] },
  { id: "PV-43-3", jobId: "JOB-26043", v: 3, date: bd(-1), designer: "conor", summary: "Final for approval: solid aluminium tray option priced, warm white confirmed, CCTV clearance 300 mm shown.",
    pantone: "Pantone 2945 C, 7409 C", substrate: "Solid aluminium 3 mm tray (upgrade from Dibond, +€420 priced in)", lighting: "Warm white 3000K",
    size: "6.0 m × 1.3 m (demo)", notes: "Fixing line 3.1 m. Driver location inside, left of door.", emails: "Sent to the branch operations manager at 16:40 on the last working day. Awaiting board sign-off.", status: "awaiting", swatch: ["#003da5", "#f6be00"] },
  { id: "PV-42-4", jobId: "JOB-26042", v: 4, date: bd(-10), designer: "conor", summary: "Final approved rebrand pack: fascia, windows, van.",
    pantone: "Pantone 3015 C (navy), Cool Gray 1 C", substrate: "3 mm ACM tray, 5 mm opal acrylic faces", lighting: "Neutral white 4000K",
    size: "5.2 m × 0.9 m", notes: "Signed off by practice partners.", emails: "Approved by email after 3 rounds.", status: "approved", swatch: ["#005b99", "#d9d9d6"] },
  { id: "PV-44-3", jobId: "JOB-26044", v: 3, date: bd(-17), designer: "conor", summary: "Fleet livery v3 approved: one template, 15 vans.",
    pantone: "Pantone 300 C, Process Black", substrate: "Cast wrap film + gloss laminate", lighting: "n/a", size: "L2H2 template",
    notes: "Rear door phone number updated in v3.", emails: "Approved by fleet lead.", status: "approved", swatch: ["#005eb8", "#1d1d1b"] },
  { id: "PV-45-3", jobId: "JOB-26045", v: 3, date: bd(-11), designer: "conor", summary: "Franchise standard letters, approved.",
    pantone: "Franchise brand red + white", substrate: "Fabricated letter shells, acrylic faces", lighting: "Cool white 6500K", size: "4.8 m run, 450 mm letters",
    notes: "Matches brand manual.", emails: "Approved by fit-out coordinator.", status: "approved", swatch: ["#c8102e", "#ffffff"] },
  { id: "PV-41-2", jobId: "JOB-26041", v: 2, date: bd(-4), designer: "conor", summary: "Wayfinding family v2 approved: plaque, directional, directory templates.",
    pantone: "College navy + white", substrate: "3 mm ACM / 3 mm acrylic", lighting: "n/a", size: "Per schedule", notes: "Tactile/braille scope to confirm with client.",
    emails: "Approved by estates manager.", status: "approved", swatch: ["#1f2a44", "#ffffff"] },
  { id: "PV-52-1", jobId: "JOB-26052", v: 1, date: bd(-5), designer: "conor", summary: "First layout of van lettering.", pantone: "Pantone 485 C", substrate: "Cast vinyl", lighting: "n/a",
    size: "3 vans", notes: "", emails: "Client asked for bigger phone number.", status: "superseded", swatch: ["#da291c", "#ffffff"] },
  { id: "PV-52-2", jobId: "JOB-26052", v: 2, date: bd(-2), designer: "conor", summary: "Phone number enlarged, chevrons added.", pantone: "Pantone 485 C", substrate: "Cast vinyl + reflective chevrons", lighting: "n/a",
    size: "3 vans", notes: "", emails: "Awaiting operations manager.", status: "awaiting", swatch: ["#da291c", "#ffffff"] },
  { id: "PV-53-1", jobId: "JOB-26053", v: 1, date: bd(-2), designer: "conor", summary: "One-way vision layout and frost band.", pantone: "Pharmacy green", substrate: "One-way vision + frost", lighting: "n/a",
    size: "2 windows + door", notes: "", emails: "Awaiting owner.", status: "awaiting", swatch: ["#00a651", "#ffffff"] },
  { id: "PV-54-1", jobId: "JOB-26054", v: 1, date: bd(-4), designer: "conor", summary: "Banner set approved.", pantone: "Club green", substrate: "PVC mesh / correx", lighting: "n/a", size: "Per order", notes: "", emails: "Approved.", status: "approved", swatch: ["#00573f", "#ffffff"] },
  { id: "PV-55-2", jobId: "JOB-26055", v: 2, date: bd(-6), designer: "conor", summary: "Fascia approved.", pantone: "Primary colours", substrate: "3 mm ACM + AG laminate", lighting: "n/a", size: "3.6 × 0.7 m", notes: "", emails: "Approved.", status: "approved", swatch: ["#ffcd00", "#0072ce"] },
  { id: "PV-56-2", jobId: "JOB-26056", v: 2, date: bd(-10), designer: "conor", summary: "Lightbox + post sign approved.", pantone: "Garden green", substrate: "Opal acrylic, ACM", lighting: "Neutral white", size: "Per drawing", notes: "", emails: "Approved.", status: "approved", swatch: ["#3a7d44", "#f4f1de"] },
  { id: "PV-57-3", jobId: "JOB-26057", v: 3, date: bd(-9), designer: "conor", summary: "Letters approved.", pantone: "Black", substrate: "10 mm acrylic", lighting: "n/a", size: "3.1 m run", notes: "", emails: "Approved.", status: "approved", swatch: ["#1d1d1b", "#c8102e"] },
  { id: "PV-58-2", jobId: "JOB-26058", v: 2, date: bd(-7), designer: "conor", summary: "Projecting sign approved.", pantone: "Coffee brown", substrate: "ACM", lighting: "n/a", size: "600 × 600 mm", notes: "", emails: "Approved.", status: "approved", swatch: ["#5b3a29", "#f2e8dc"] },
  { id: "PV-46-1", jobId: "JOB-26046", v: 1, date: bd(-12), designer: "conor", summary: "Hoarding artwork approved.", pantone: "Developer palette", substrate: "3 mm ACM panels", lighting: "n/a", size: "14.6 × 1.2 m", notes: "", emails: "Approved.", status: "approved", swatch: ["#2b4c3f", "#e8e2d0"] },
];

/* ── Quotes ─────────────────────────────────────────────────────────────── */
export type Quote = { id: string; jobId: string; status: "draft" | "sent" | "accepted" | "awaiting-owner"; validUntil: Date; sentOn?: Date; turnaroundHrs: number };
export const QUOTES: Quote[] = JOBS.map((j) => {
  const status: Quote["status"] = j.stage === "quoting"
    ? (j.id === "JOB-26049" ? "awaiting-owner" : j.id === "JOB-26050" ? "draft" : "sent")
    : j.stage === "enquiry" || j.stage === "survey" ? "draft" : "accepted";
  const turnaround: Record<string, number> = { "JOB-26049": 20, "JOB-26050": 30, "JOB-26051": 6, "JOB-26047": 0, "JOB-26048": 0 };
  return { id: j.quoteId, jobId: j.id, status, validUntil: bd(22, j.created), sentOn: status === "sent" || status === "accepted" ? bd(2, j.created) : undefined,
    turnaroundHrs: turnaround[j.id] ?? 18 + (parseInt(j.id.slice(-2), 10) % 5) * 6 };
});

/* ── Enquiries (sample illustrative week: 14) ───────────────────────────── */
export type Enquiry = { id: string; name: string; contactRole: string; source: "Referral" | "Repeat" | "Website" | "Phone / email" | "Site visit"; channel: string;
  received: Date; ask: string; kind: JobKind; estValue: number; isNew: boolean; jobId?: string; status: "new" | "contacted" | "converted" | "declined" };
export const ENQUIRIES: Enquiry[] = [
  { id: "ENQ-901", name: "Fingal Leisure Centre", contactRole: "Centre manager", source: "Phone / email", channel: "Phone call", received: at(-4, 9, 40), ask: "Faded internal directional signs and car-park panel.", kind: "print", estValue: 3200, isNew: false, jobId: "JOB-26048", status: "converted" },
  { id: "ENQ-902", name: "Malahide Dental Clinic", contactRole: "Practice owner", source: "Website", channel: "Website form", received: at(-4, 11, 5), ask: "Projecting sign and window frosting for new clinic.", kind: "print", estValue: 1850, isNew: true, jobId: "JOB-26047", status: "converted" },
  { id: "ENQ-903", name: "Brennan's Butchers", contactRole: "Owner", source: "Referral", channel: "Email (referred by Seatown Coffee)", received: at(-4, 15, 20), ask: "New fascia panel and window lettering.", kind: "print", estValue: 1680, isNew: true, jobId: "JOB-26049", status: "converted" },
  { id: "ENQ-904", name: "Rush Physio Studio", contactRole: "Clinic director", source: "Website", channel: "Website form", received: at(-3, 8, 55), ask: "Illuminated sign over the door.", kind: "led", estValue: 3450, isNew: true, jobId: "JOB-26050", status: "converted" },
  { id: "ENQ-905", name: "Harbour View Homes", contactRole: "Development sales lead", source: "Repeat", channel: "Email", received: at(-3, 10, 30), ask: "Phase 2 hoarding, same spec as phase 1.", kind: "print", estValue: 3900, isNew: false, jobId: "JOB-26051", status: "converted" },
  { id: "ENQ-906", name: "Skerries Sailing Club", contactRole: "Commodore", source: "Referral", channel: "Phone call", received: at(-3, 14, 10), ask: "Clubhouse sign and 2 event flags.", kind: "print", estValue: 1400, isNew: true, status: "contacted" },
  { id: "ENQ-907", name: "Feltrim Auto Services", contactRole: "Workshop owner", source: "Repeat", channel: "Phone call", received: at(-2, 9, 15), ask: "Second set of letters for the side elevation.", kind: "led", estValue: 1600, isNew: false, status: "contacted" },
  { id: "ENQ-908", name: "Ballyboughal Veterinary", contactRole: "Practice manager", source: "Website", channel: "Website form", received: at(-2, 12, 0), ask: "Car-park directional and opening-hours panel.", kind: "print", estValue: 900, isNew: true, status: "new" },
  { id: "ENQ-909", name: "Northside Credit Hire", contactRole: "Operations manager", source: "Repeat", channel: "Email", received: at(-2, 16, 45), ask: "Two more courtesy vans to letter in January.", kind: "vehicle", estValue: 1300, isNew: false, status: "contacted" },
  { id: "ENQ-910", name: "Donabate Pharmacy", contactRole: "Owner", source: "Referral", channel: "Email (referred by Balbriggan Pharmacy)", received: at(-1, 9, 5), ask: "Green cross LED and window graphics.", kind: "led", estValue: 4200, isNew: true, status: "new" },
  { id: "ENQ-911", name: "Swords Accountancy Practice", contactRole: "Practice manager", source: "Repeat", channel: "Phone call", received: at(-1, 11, 30), ask: "Reception wall logo to match the new fascia.", kind: "led", estValue: 1100, isNew: false, status: "new" },
  { id: "ENQ-912", name: "Oldtown Hardware", contactRole: "Owner", source: "Site visit", channel: "Walk-in at workshop", received: at(-1, 14, 0), ask: "Price for 20 correx sale boards.", kind: "print", estValue: 380, isNew: true, status: "new" },
  { id: "ENQ-913", name: "Portmarnock Residential Development", contactRole: "Site manager", source: "Repeat", channel: "Email", received: at(0, 8, 20), ask: "Two extra hoarding panels after the crane move.", kind: "print", estValue: 520, isNew: false, status: "new" },
  { id: "ENQ-914", name: "Lusk Community Café", contactRole: "Manager", source: "Referral", channel: "Website form (referred)", received: at(0, 9, 10), ask: "A-board and window menu graphics.", kind: "print", estValue: 650, isNew: true, status: "new" },
];
export const ENQUIRY_NOTE = "Sample illustrative week. The owner described roughly 10-20 new enquiries a week.";

/* ── Tenders ────────────────────────────────────────────────────────────── */
export type CostModel = "unit" | "area" | "vehicle" | "bom" | "service";
export type TenderLine = {
  id: string; label: string; signType: string; qty: number; unit: string; unitPrice: number; unitCost: number;
  model: CostModel; floors?: string; dims?: string; finish?: string; source: string; sourceText: string;
  countNote: string; confidence: number; warning?: string; bom?: { item: string; cost: number }[];
};
export type Tender = {
  id: string; title: string; client: string; file: string; pages: number; floors: number; received: Date; due: Date;
  status: "won" | "new" | "extracted" | "review" | "approved" | "archived"; value?: number; jobId?: string;
  labourHours: number; labourRate: number; fitting: number; fittingCost: number; delivery: number; artworkPrice: number;
  lines: TenderLine[]; requirements: string[]; warnings: string[]; docs: { name: string; pages: string }[];
};

/** The won college tender: €7,500 sell, €3,851 cost. Reconciles exactly. */
export const TENDER_WON: Tender = {
  id: "TND-031", title: "College Wayfinding / Directory", client: "College client (tender, name withheld)", file: "College Wayfinding Tender.pdf",
  pages: 38, floors: 6, received: bd(-24), due: bd(-14), status: "won", value: 7500, jobId: "JOB-26041",
  labourHours: 26, labourRate: 35, fitting: 1450, fittingCost: 620, delivery: 125, artworkPrice: 590,
  lines: [
    { id: "w1", label: "Room identification plaques", signType: "Plaque", qty: 120, unit: "each", unitPrice: 18, unitCost: 7, model: "unit", floors: "G-5", dims: "200 × 150 mm", finish: "3 mm ACM, UV print", source: "Schedule A, p.4-9", sourceText: "Room ID plaque type P1 × 120 (see room schedule)", countNote: "20 per floor × 6 floors, from room schedule", confidence: 0.97 },
    { id: "w2", label: "Directional signs", signType: "Directional", qty: 12, unit: "each", unitPrice: 95, unitCost: 38, model: "unit", floors: "G-5", dims: "600 × 200 mm", finish: "3 mm acrylic, stand-offs", source: "Schedule B, p.10", sourceText: "Directional sign type D1 × 12", countNote: "2 per floor at lift and stair cores", confidence: 0.95 },
    { id: "w3", label: "Floor directory boards", signType: "Directory", qty: 6, unit: "each", unitPrice: 360, unitCost: 150, model: "unit", floors: "G-5", dims: "1200 × 900 mm", finish: "3 mm ACM, UV print, stand-offs", source: "Drawings A-301 to A-306", sourceText: "Floor directory DB1, one per floor lobby", countNote: "1 per floor lobby", confidence: 0.99 },
  ],
  requirements: ["Out-of-hours installation", "Method statement + RAMS", "Tax clearance", "Insurance certificates"],
  warnings: [],
  docs: [{ name: "Tender specification", pages: "p.1-3" }, { name: "Room schedule (Schedule A)", pages: "p.4-9" }, { name: "Sign schedule (Schedule B)", pages: "p.10" }, { name: "Floor plans A-301-A-306", pages: "6 sheets" }],
};

/** A separate, NEW incoming tender to extract. Different client, not yet submitted. */
export const TENDER_DRAFT: Tender = {
  id: "TND-034", title: "College Campus Directory Signage", client: "Campus estates office (illustrative)", file: "College Campus Directory Signage - Tender Pack.pdf",
  pages: 46, floors: 6, received: at(0, 7, 52), due: bd(8), status: "new",
  labourHours: 34, labourRate: 35, fitting: 1950, fittingCost: 880, delivery: 140, artworkPrice: 780,
  lines: [
    { id: "d1", label: "Room identification plaques", signType: "Plaque", qty: 144, unit: "each", unitPrice: 18, unitCost: 7, model: "unit", floors: "G-5", dims: "200 × 150 mm", finish: "3 mm ACM, UV print", source: "Schedule A, p.6-13", sourceText: "P1 Room ID plaque: refer room data sheets. Qty per floor: G 22, 1 24, 2 25, 3 25, 4 24, 5 24", countNote: "Counted per floor from room data sheets: 22 + 24 + 25 + 25 + 24 + 24 = 144", confidence: 0.96, warning: "Tactile / braille requirement not stated. Priced as standard print." },
    { id: "d2", label: "Directional signs", signType: "Directional", qty: 18, unit: "each", unitPrice: 95, unitCost: 38, model: "unit", floors: "G-5", dims: "600 × 200 mm", finish: "3 mm acrylic, stand-offs", source: "Schedule B, p.14", sourceText: "D1 directional × 3 per floor at lift lobby and both stair cores", countNote: "3 per floor × 6 floors = 18", confidence: 0.94 },
    { id: "d3", label: "Floor directory boards", signType: "Directory", qty: 6, unit: "each", unitPrice: 360, unitCost: 150, model: "unit", floors: "G-5", dims: "1200 × 900 mm", finish: "3 mm ACM, UV print, stand-offs", source: "Drawings A-401 to A-406", sourceText: "DB1 directory board in each lift lobby", countNote: "1 per lift lobby × 6 floors", confidence: 0.98 },
    { id: "d4", label: "External entrance totem", signType: "Totem", qty: 1, unit: "each", unitPrice: 2200, unitCost: 1310, model: "bom", floors: "External", dims: "2400 × 800 × 200 mm", finish: "Aluminium tray, finish TBC", source: "Drawing A-110; Spec §4.3", sourceText: "T1 entrance totem: refer drawing A-110. (Spec §4.3 does not state illumination or foundation.)", countNote: "1 shown on site plan A-110", confidence: 0.71,
      warning: "Missing spec: illumination and foundation not stated. Provisional sum only, owner to price.",
      bom: [{ item: "Aluminium tray fabrication (bought in)", cost: 640 }, { item: "Acrylic faces + vinyl", cost: 180 }, { item: "LED modules + driver (if illuminated)", cost: 290 }, { item: "Base plate & fixings (foundation by others)", cost: 120 }, { item: "Workshop assembly 2 h", cost: 80 }] },
  ],
  requirements: ["Out-of-hours installation (after 18:00 or outside term)", "RAMS + method statement", "Tax clearance certificate", "Public liability €6.5m", "Programme within 4 weeks of award"],
  warnings: [
    "§2.7: statutory fire-exit signage is 'by M&E contractor'. Excluded from our price; confirm in clarifications.",
    "§4.3: totem illumination and foundation not specified. Do not firm-price until clarified.",
    "Tactile / braille requirement for room plaques not stated (Part M). Ask before pricing.",
  ],
  docs: [{ name: "Instructions to tenderers", pages: "p.1-5" }, { name: "Room data sheets (Schedule A)", pages: "p.6-13" }, { name: "Sign schedule (Schedule B)", pages: "p.14" }, { name: "Specification §4", pages: "p.15-22" }, { name: "Site plan A-110", pages: "1 sheet" }, { name: "Floor plans A-401-A-406", pages: "6 sheets" }],
};
export const TENDER_ARCHIVE = [
  { id: "TND-027", title: "Business park directional scheme", client: "Business park management (illustrative)", value: 4300, result: "Lost on price", date: bd(-60) },
  { id: "TND-029", title: "Primary school signage package", client: "School board (illustrative)", value: 2850, result: "Won", date: bd(-45) },
  { id: "TND-031", title: "College Wayfinding / Directory", client: "College client (tender, name withheld)", value: 7500, result: "Won · now JOB-26041", date: bd(-14) },
  { id: "TND-032", title: "Council depot hoardings", client: "Local authority (illustrative)", value: 5600, result: "Not submitted (capacity)", date: bd(-9) },
];
export const TENDER_STAGES = ["Reading schedule…", "Classifying sign types…", "Checking dimensions…", "Detecting ambiguities…", "Costing draft ready"];

/* ── Materials & suppliers ──────────────────────────────────────────────── */
export type Supplier = { id: string; name: string; origin: string; supplies: string; lead: string; note: string };
export const SUPPLIERS: Supplier[] = [
  { id: "s-letters", name: "Fabricated letters partner", origin: "Poland", supplies: "Built-up LED letter shells, logo cabinets", lead: "2-3 weeks + freight", note: "Supplier name not recorded in demo" },
  { id: "s-led", name: "LED components (via agent)", origin: "China", supplies: "LED modules, drivers, controllers", lead: "3-5 weeks; local buffer stock", note: "Specialty components sourced abroad" },
  { id: "s-acm", name: "Composite panel stockist", origin: "Dublin", supplies: "3 mm ACM / Dibond, solid aluminium sheet", lead: "1-2 days", note: "Illustrative" },
  { id: "s-film", name: "Vinyl & wrap film distributor", origin: "UK / Ireland", supplies: "Cast wrap film, laminates, frost, one-way vision", lead: "1-3 days", note: "Illustrative" },
  { id: "s-plastics", name: "Acrylic & PVC sheet stockist", origin: "Dublin", supplies: "Opal / clear acrylic, foamex, correx", lead: "1-2 days", note: "Illustrative" },
  { id: "s-hardware", name: "Fixings & hardware", origin: "Ireland", supplies: "Stand-offs, chemical anchors, brackets, posts", lead: "Next day", note: "Illustrative" },
];
export type MatStatus = "In stock" | "Ordered" | "Awaiting ETA" | "Received" | "Short";
export type Material = { id: string; name: string; supplierId: string; jobId?: string; qty: string; status: MatStatus; eta?: Date; cost: number; note?: string; needsApproval?: boolean };
export const MATERIALS: Material[] = [
  { id: "M-201", name: "Fabricated LED letter shells + logo cabinet", supplierId: "s-letters", jobId: "JOB-26045", qty: "1 set (11 letters + logo)", status: "Awaiting ETA", cost: 1850, note: "Shipped from Poland; carrier tracking not yet issued" },
  { id: "M-202", name: "LED modules 6500K + 12V drivers", supplierId: "s-led", jobId: "JOB-26045", qty: "140 modules, 2 drivers", status: "In stock", cost: 260 },
  { id: "M-203", name: "3 mm ACM sheets 8×4 (white)", supplierId: "s-acm", jobId: "JOB-26041", qty: "9 sheets", status: "Short", cost: 495, note: "Stock covers 4 sheets; order of 9 awaiting owner approval", needsApproval: true },
  { id: "M-204", name: "3 mm clear acrylic sheets", supplierId: "s-plastics", jobId: "JOB-26041", qty: "4 sheets", status: "Ordered", eta: bd(2), cost: 236 },
  { id: "M-205", name: "Cast wrap film + gloss laminate (batch C)", supplierId: "s-film", jobId: "JOB-26044", qty: "3 rolls + 3 rolls", status: "Ordered", eta: bd(3), cost: 2140 },
  { id: "M-206", name: "Cast wrap film + gloss laminate (batch B)", supplierId: "s-film", jobId: "JOB-26044", qty: "3 rolls + 3 rolls", status: "Received", cost: 1712 },
  { id: "M-207", name: "LED modules 3000K warm white + drivers", supplierId: "s-led", jobId: "JOB-26043", qty: "180 modules, 2 drivers", status: "In stock", cost: 410, note: "Reserved; do not cut ACM until proof v3 approved" },
  { id: "M-208", name: "Solid aluminium 3 mm sheet (CU tray upgrade)", supplierId: "s-acm", jobId: "JOB-26043", qty: "3 sheets", status: "Short", cost: 520, note: "Only order after v3 sign-off + deposit" },
  { id: "M-209", name: "5 mm opal acrylic (fascia faces)", supplierId: "s-plastics", jobId: "JOB-26042", qty: "4 sheets", status: "Received", cost: 380 },
  { id: "M-210", name: "PVC mesh 270gsm roll", supplierId: "s-film", jobId: "JOB-26054", qty: "1 roll", status: "In stock", cost: 165 },
  { id: "M-211", name: "Stand-off fixings 25 mm (box of 100)", supplierId: "s-hardware", jobId: "JOB-26041", qty: "3 boxes", status: "Ordered", eta: bd(1), cost: 120 },
  { id: "M-212", name: "Frost vinyl 1220 mm", supplierId: "s-film", jobId: "JOB-26042", qty: "1 roll", status: "In stock", cost: 140 },
];

/* ── Installations ──────────────────────────────────────────────────────── */
export type Install = { id: string; jobId: string; fitterId: string; date: Date; slot: string; status: "booked" | "proposed" | "tentative" | "done"; access: string; contactRole: string; packAck: boolean };
export const INSTALLS: Install[] = [
  { id: "IN-58", jobId: "JOB-26058", fitterId: "nci", date: bd(2), slot: "07:30-10:00", status: "booked", access: "Fit before café opens; loading bay at rear", contactRole: "Owner", packAck: true },
  { id: "IN-56", jobId: "JOB-26056", fitterId: "bvf", date: bd(3), slot: "08:00-14:00", status: "proposed", access: "Roadside; stop/go board needed for post sign", contactRole: "Owner", packAck: false },
  { id: "IN-57", jobId: "JOB-26057", fitterId: "inhouse", date: bd(4), slot: "09:00-12:00", status: "booked", access: "Yard access via side gate", contactRole: "Workshop owner", packAck: true },
  { id: "IN-55", jobId: "JOB-26055", fitterId: "inhouse", date: bd(5), slot: "07:30-09:30", status: "tentative", access: "Before school drop-off", contactRole: "Owner", packAck: false },
  { id: "IN-42", jobId: "JOB-26042", fitterId: "lac", date: bd(6), slot: "07:00-11:00", status: "booked", access: "MEWP on footpath; council permit applied", contactRole: "Practice manager", packAck: false },
  { id: "IN-45", jobId: "JOB-26045", fitterId: "fft", date: bd(11), slot: "06:30-10:00", status: "tentative", access: "Landlord letter on file; fit before trading", contactRole: "Franchise fit-out coordinator", packAck: false },
  { id: "IN-41", jobId: "JOB-26041", fitterId: "fft", date: bd(13), slot: "18:00-22:00 × 3 evenings", status: "tentative", access: "Out-of-hours; estates escort required", contactRole: "Facilities & estates manager", packAck: false },
  { id: "IN-46", jobId: "JOB-26046", fitterId: "bvf", date: bd(-3), slot: "08:00-13:00", status: "done", access: "Site induction completed", contactRole: "Site manager", packAck: true },
];

/* ── Payments (illustrative ledger) ─────────────────────────────────────── */
export type Payment = { id: string; jobId: string; kind: "Deposit" | "Prepayment" | "Batch balance" | "Balance"; amount: number; status: "paid" | "invoiced" | "due" | "not yet"; date: Date; note?: string };
export const PAYMENTS: Payment[] = [
  { id: "PAY-501", jobId: "JOB-26041", kind: "Deposit", amount: 2250, status: "paid", date: bd(-6), note: "30% per tender terms" },
  { id: "PAY-502", jobId: "JOB-26042", kind: "Prepayment", amount: 12400, status: "paid", date: bd(-15), note: "Customer paid 100% upfront (actual amount not disclosed; demo value)" },
  { id: "PAY-503", jobId: "JOB-26043", kind: "Deposit", amount: 3460, status: "invoiced", date: bd(-1), note: "40% deposit, due before LED/aluminium order" },
  { id: "PAY-504", jobId: "JOB-26044", kind: "Deposit", amount: 8550, status: "paid", date: bd(-19), note: "30% deposit" },
  { id: "PAY-505", jobId: "JOB-26044", kind: "Batch balance", amount: 7980, status: "invoiced", date: bd(-1), note: "Batch A: 6 vans × €1,900, less 30% deposit share" },
  { id: "PAY-506", jobId: "JOB-26045", kind: "Deposit", amount: 3400, status: "paid", date: bd(-12), note: "50% deposit" },
  { id: "PAY-507", jobId: "JOB-26046", kind: "Deposit", amount: 1225, status: "paid", date: bd(-14) },
  { id: "PAY-508", jobId: "JOB-26046", kind: "Balance", amount: 1225, status: "invoiced", date: bd(-3), note: "Balance on completion" },
  { id: "PAY-509", jobId: "JOB-26052", kind: "Deposit", amount: 585, status: "paid", date: bd(-6) },
  { id: "PAY-510", jobId: "JOB-26053", kind: "Deposit", amount: 620, status: "paid", date: bd(-5) },
  { id: "PAY-511", jobId: "JOB-26055", kind: "Deposit", amount: 490, status: "paid", date: bd(-8) },
  { id: "PAY-512", jobId: "JOB-26056", kind: "Deposit", amount: 2050, status: "paid", date: bd(-13) },
  { id: "PAY-513", jobId: "JOB-26057", kind: "Deposit", amount: 920, status: "paid", date: bd(-11) },
  { id: "PAY-514", jobId: "JOB-26058", kind: "Deposit", amount: 790, status: "paid", date: bd(-9) },
];
export const LEDGER_NOTE = "Illustrative mock ledger. The accounts package stays the system of record; Pulse would read from it (proposed sync, not connected).";

/* ── Historical jobs (illustrative archive for price intelligence) ──────── */
export type HistJob = { id: string; label: string; kind: JobKind; price: number; cost: number; quotedHours: number; actualHours: number; when: string };
export const HISTORY: HistJob[] = [
  { id: "H-01", label: "Hoarding panels, 12 m run", kind: "print", price: 2100, cost: 820, quotedHours: 8, actualHours: 8.5, when: "Sep" },
  { id: "H-02", label: "Fascia panel + window vinyl", kind: "print", price: 1450, cost: 690, quotedHours: 6, actualHours: 6, when: "Sep" },
  { id: "H-03", label: "Correx sale boards × 40", kind: "print", price: 620, cost: 210, quotedHours: 3, actualHours: 2.5, when: "Oct" },
  { id: "H-04", label: "Event banners × 8", kind: "print", price: 980, cost: 360, quotedHours: 4, actualHours: 4.5, when: "Oct" },
  { id: "H-05", label: "One-way vision, 3 windows", kind: "print", price: 1180, cost: 560, quotedHours: 5, actualHours: 5.5, when: "Oct" },
  { id: "H-06", label: "Van part-wrap × 4", kind: "vehicle", price: 7600, cost: 4850, quotedHours: 40, actualHours: 44, when: "Aug" },
  { id: "H-07", label: "Van lettering × 6", kind: "vehicle", price: 3300, cost: 1720, quotedHours: 15, actualHours: 15, when: "Sep" },
  { id: "H-08", label: "Car livery kit × 10", kind: "vehicle", price: 4200, cost: 2520, quotedHours: 22, actualHours: 25, when: "Oct" },
  { id: "H-09", label: "LED fascia, built-up letters (5 m)", kind: "led", price: 8900, cost: 5340, quotedHours: 36, actualHours: 41, when: "Jul" },
  { id: "H-10", label: "LED lightbox 2.4 m", kind: "led", price: 3600, cost: 2050, quotedHours: 14, actualHours: 15, when: "Aug" },
  { id: "H-11", label: "Projecting LED sign", kind: "led", price: 2400, cost: 1610, quotedHours: 12, actualHours: 17, when: "Sep" },
  { id: "H-12", label: "Franchise LED letters", kind: "led", price: 6200, cost: 3860, quotedHours: 20, actualHours: 22, when: "Sep" },
  { id: "H-13", label: "LED fascia, solid aluminium tray", kind: "led", price: 7900, cost: 5790, quotedHours: 34, actualHours: 46, when: "Oct" },
];
export const HISTORY_NOTE = "Illustrative archive used to demonstrate price intelligence. Not Signs ASAP's real job history.";

/* ── Tasks ──────────────────────────────────────────────────────────────── */
export type Task = { id: string; title: string; assignee: string; dept: string; jobId?: string; priority: "High" | "Medium" | "Low"; due: Date; status: "Open" | "In progress" | "Done" | "Blocked"; woId?: string; kind?: "approval" | "task" };
export const TASKS: Task[] = [
  { id: "T-01", title: "Issue proof v3 to branch & chase sign-off", assignee: "conor", dept: "Design", jobId: "JOB-26043", priority: "High", due: bd(0), status: "In progress" },
  { id: "T-02", title: "Fabricate Swords Accountancy fascia", assignee: "liam", dept: "Workshop", jobId: "JOB-26042", priority: "High", due: bd(2), status: "In progress", woId: "WO-3107" },
  { id: "T-03", title: "Reconcile 100% prepayment against job", assignee: "aisling", dept: "Accounts", jobId: "JOB-26042", priority: "Medium", due: bd(1), status: "Open" },
  { id: "T-04", title: "Check college plaque materials", assignee: "mark", dept: "Workshop", jobId: "JOB-26041", priority: "High", due: bd(1), status: "Open", woId: "WO-3101" },
  { id: "T-05", title: "Print & laminate fleet batch B", assignee: "niamh", dept: "Workshop", jobId: "JOB-26044", priority: "High", due: bd(2), status: "In progress", woId: "WO-3105" },
  { id: "T-06", title: "Chase Poland ETA for Camile letters", assignee: "aisling", dept: "Accounts", jobId: "JOB-26045", priority: "Medium", due: bd(0), status: "Open" },
  { id: "T-07", title: "Hem & eyelet Donabate banners", assignee: "niamh", dept: "Workshop", jobId: "JOB-26054", priority: "Medium", due: bd(2), status: "Open", woId: "WO-3106" },
  { id: "T-08", title: "QA Lusk Montessori fascia", assignee: "mark", dept: "Workshop", jobId: "JOB-26055", priority: "Medium", due: bd(1), status: "Open", woId: "WO-3108" },
  { id: "T-09", title: "Confirm Boyne Valley crew for Kinsealy", assignee: "md", dept: "Management", jobId: "JOB-26056", priority: "Medium", due: bd(1), status: "Open" },
  { id: "T-10", title: "Survey Malahide Dental (measure + photos)", assignee: "md", dept: "Management", jobId: "JOB-26047", priority: "Medium", due: bd(1), status: "Open" },
  { id: "T-11", title: "Chase Portmarnock balance invoice", assignee: "aisling", dept: "Accounts", jobId: "JOB-26046", priority: "Low", due: bd(3), status: "Open" },
  { id: "T-12", title: "Revise Rush Physio quote (margin floor)", assignee: "md", dept: "Management", jobId: "JOB-26050", priority: "Medium", due: bd(1), status: "Open" },
  { id: "T-13", title: "Send Brennan's Butchers quote", assignee: "md", dept: "Management", jobId: "JOB-26049", priority: "Medium", due: bd(0), status: "Open" },
  { id: "T-14", title: "Northside van proof v2 follow-up", assignee: "conor", dept: "Design", jobId: "JOB-26052", priority: "Low", due: bd(2), status: "Open" },
  { id: "T-15", title: "Invoice Fleet batch A balance", assignee: "aisling", dept: "Accounts", jobId: "JOB-26044", priority: "Medium", due: bd(-1), status: "Done" },
  { id: "T-16", title: "Book MEWP + council permit for Swords fit", assignee: "mark", dept: "Workshop", jobId: "JOB-26042", priority: "Medium", due: bd(3), status: "Open" },
  { id: "T-17", title: "Review College Campus tender estimate", assignee: "md", dept: "Management", priority: "High", due: bd(2), status: "Open" },
];

/* ── Activities (chronological, joined across the six story threads) ──── */
export type Actor = "human" | "agent" | "system";
export type Activity = { id: string; at: Date; actor: Actor; who: string; text: string; jobId?: string; kind: string; tone?: "ok" | "warn" | "bad" | "info" };
export const ACTIVITIES: Activity[] = [
  { id: "A-01", at: at(0, 8, 2), actor: "agent", who: "Briefing", text: "Posted the morning briefing: 17 open jobs, 3 proofs waiting, 2 material holds.", kind: "briefing", tone: "info" },
  { id: "A-02", at: at(0, 7, 52), actor: "system", who: "Email intake (mock)", text: "Tender pack received: College Campus Directory Signage (46 pages).", kind: "tender", tone: "info" },
  { id: "A-03", at: at(0, 8, 15), actor: "agent", who: "Ops Watchdog", text: "Camile fabricated letters order still awaiting ETA from Poland.", jobId: "JOB-26045", kind: "materials", tone: "warn" },
  { id: "A-04", at: at(0, 8, 40), actor: "human", who: "Liam Kelly", text: "Workshop began Accountancy LED assembly (WO-3107).", jobId: "JOB-26042", kind: "production", tone: "ok" },
  { id: "A-05", at: at(0, 9, 5), actor: "agent", who: "Proof Guardian", text: "Blocked CNC release on Celbridge CU: proof v3 not yet approved.", jobId: "JOB-26043", kind: "proof", tone: "warn" },
  { id: "A-06", at: at(0, 9, 20), actor: "human", who: "Niamh Doyle", text: "Started printing fleet batch B (4 vans).", jobId: "JOB-26044", kind: "production", tone: "ok" },
  { id: "A-07", at: at(-1, 16, 40), actor: "human", who: "Conor Hayes", text: "Uploaded Celbridge proof v3 and sent it for sign-off.", jobId: "JOB-26043", kind: "proof", tone: "info" },
  { id: "A-08", at: at(-1, 15, 10), actor: "human", who: "Mark Brennan", text: "Fleet batch 6/15 QA complete; batch A handed back.", jobId: "JOB-26044", kind: "qa", tone: "ok" },
  { id: "A-09", at: at(-1, 14, 30), actor: "human", who: "Managing Director", text: "Owner reviewed College tender €7,500 and moved it to procurement.", jobId: "JOB-26041", kind: "tender", tone: "ok" },
  { id: "A-10", at: at(-1, 11, 5), actor: "agent", who: "Quote Coach", text: "Rush Physio lightbox quote at 36.5% margin, below the 38% floor. Suggested €3,540 (38.1%).", jobId: "JOB-26050", kind: "quote", tone: "warn" },
  { id: "A-11", at: at(-1, 10, 0), actor: "system", who: "Accounts package (mock)", text: "Fleet batch A balance invoice raised in demo ledger.", jobId: "JOB-26044", kind: "payment", tone: "info" },
  { id: "A-12", at: at(-2, 16, 20), actor: "agent", who: "Production Planner", text: "Flagged print station at 92% this week with fleet batch B; suggested slot for batch C next week.", jobId: "JOB-26044", kind: "capacity", tone: "warn" },
  { id: "A-13", at: at(-2, 12, 10), actor: "human", who: "Aisling Ryan", text: "Swords accountancy payment recorded in demo: 100% prepaid.", jobId: "JOB-26042", kind: "payment", tone: "ok" },
  { id: "A-14", at: at(-3, 13, 0), actor: "human", who: "Boyne Valley Fitters", text: "Portmarnock hoarding installed; completion photos uploaded.", jobId: "JOB-26046", kind: "install", tone: "ok" },
  { id: "A-15", at: at(-3, 15, 30), actor: "system", who: "Accounts package (mock)", text: "Portmarnock balance invoice issued (€1,225).", jobId: "JOB-26046", kind: "payment", tone: "info" },
  { id: "A-16", at: at(-5, 9, 30), actor: "human", who: "Conor Hayes", text: "Celbridge proof v2: logo moved 400 mm right to clear alarm bell.", jobId: "JOB-26043", kind: "proof", tone: "info" },
  { id: "A-17", at: at(-6, 11, 0), actor: "human", who: "Managing Director", text: "Captured Celbridge site survey: 4 photos, 5 obstacles tagged.", jobId: "JOB-26043", kind: "survey", tone: "ok" },
  { id: "A-18", at: at(-6, 15, 0), actor: "human", who: "Aisling Ryan", text: "College tender 30% deposit received.", jobId: "JOB-26041", kind: "payment", tone: "ok" },
  { id: "A-19", at: at(-10, 10, 20), actor: "human", who: "Practice partners", text: "Swords accountancy rebrand v4 approved.", jobId: "JOB-26042", kind: "proof", tone: "ok" },
  { id: "A-20", at: at(-12, 9, 0), actor: "human", who: "Aisling Ryan", text: "Camile 50% deposit received; letters ordered from Poland.", jobId: "JOB-26045", kind: "materials", tone: "info" },
  { id: "A-21", at: at(-14, 16, 0), actor: "system", who: "Tender portal (mock)", text: "College wayfinding tender awarded: €7,500.", jobId: "JOB-26041", kind: "tender", tone: "ok" },
  { id: "A-22", at: at(0, 9, 45), actor: "agent", who: "Client Updates", text: "Drafted progress note for Swords Accountancy (not sent; owner review).", jobId: "JOB-26042", kind: "update", tone: "info" },
];

/* ── Agents (7) ─────────────────────────────────────────────────────────── */
export type AgentDef = { id: string; name: string; mandate: string; guardrail: string; tint: string; shape: string; runs: { at: Date; summary: string; result: "done" | "needs you" | "flagged" }[]; proposals: { id: string; text: string; jobId?: string; action: string }[]; links: string[] };
export const AGENTS: AgentDef[] = [
  { id: "briefing", name: "Briefing", shape: "crown-pebble", tint: "#2a1d10", mandate: "Reads the whole business every morning and tells the owner the few things that matter, wherever he is.",
    guardrail: "Read-only. Never changes a record.", links: ["JOB-26041", "JOB-26044", "JOB-26043"],
    runs: [{ at: at(0, 8, 2), summary: "Morning briefing: tender €7,500 in procurement, fleet 6/15, CU proof v3 waiting.", result: "done" }, { at: at(-1, 8, 0), summary: "Morning briefing: 2 decisions, rest covered.", result: "done" }],
    proposals: [{ id: "bp1", text: "Add Kinsealy fitter confirmation to tomorrow's briefing", jobId: "JOB-26056", action: "Add to briefing" }] },
  { id: "watchdog", name: "Ops Watchdog", shape: "shield", tint: "#2b1b1e", mandate: "Watches for proofs not approved, material delays, deadlines at risk and capacity conflicts. Quiet when things are healthy.",
    guardrail: "Flags and blocks unsafe releases. Never reschedules on its own.", links: ["JOB-26043", "JOB-26045", "JOB-26044"],
    runs: [{ at: at(0, 9, 5), summary: "Stopped CNC release on Celbridge CU (proof v3 unapproved).", result: "flagged" }, { at: at(0, 8, 15), summary: "Camile letters ETA still unconfirmed (day 12).", result: "flagged" }, { at: at(-1, 8, 0), summary: "No conflicts. 3 jobs on track for Friday.", result: "done" }],
    proposals: [{ id: "wp1", text: "Ask the Poland partner for a carrier tracking number", jobId: "JOB-26045", action: "Create chase task" }] },
  { id: "tender", name: "Tender Estimator", shape: "control-cube", tint: "#14232a", mandate: "Turns a tender pack into a counted quantity table with page references, flags what is missing, and drafts a costing for the owner to check.",
    guardrail: "Never firm-prices an unspecified item. Owner approval required before anything is sent.", links: ["JOB-26041"],
    runs: [{ at: at(0, 7, 55), summary: "New tender pack detected: 46 pages, 6 floors. Ready to extract.", result: "needs you" }, { at: at(-24, 10, 0), summary: "College wayfinding: 138 items counted, priced €7,500 (won).", result: "done" }],
    proposals: [{ id: "tp1", text: "Extract College Campus Directory tender pack", action: "Open Tender Desk" }] },
  { id: "quotecoach", name: "Quote Coach", shape: "executive-capsule", tint: "#2a2118", mandate: "Compares each quote against its cost build-up and past jobs, and flags under-pricing before it goes out.",
    guardrail: "Suggests prices. The owner sets them.", links: ["JOB-26050", "JOB-26043"],
    runs: [{ at: at(-1, 11, 5), summary: "Rush Physio lightbox below 38% floor; suggested €3,540.", result: "flagged" }, { at: at(-2, 15, 0), summary: "Harbour View hoarding at 58.7%: in line with past hoardings.", result: "done" }],
    proposals: [{ id: "qp1", text: "Raise Rush Physio lightbox to €3,540 (38.1% margin)", jobId: "JOB-26050", action: "Apply suggested price" }] },
  { id: "planner", name: "Production Planner", shape: "low-dome", tint: "#16241f", mandate: "Predicts the CNC and print bottleneck, sequences work orders and offers realistic slots. Never promises a date the workshop can't make.",
    guardrail: "Proposes sequences. People confirm dates.", links: ["JOB-26044", "JOB-26042", "JOB-26054"],
    runs: [{ at: at(-2, 16, 20), summary: "Print station 92% loaded; batch C slotted next week.", result: "flagged" }, { at: at(-3, 16, 0), summary: "Week plan published to TV mode.", result: "done" }],
    proposals: [{ id: "pp1", text: "Move Donabate banners to Thursday's open printer slot", jobId: "JOB-26054", action: "Apply suggestion" }] },
  { id: "proof", name: "Proof Guardian", shape: "rim-capsule", tint: "#1b2430", mandate: "Checks the approved artwork version, Pantone, dimensions, substrate, lighting and change trail before anything is released to production.",
    guardrail: "Blocks release when the approved version is missing. Can't approve on a client's behalf.", links: ["JOB-26043", "JOB-26052", "JOB-26053"],
    runs: [{ at: at(0, 9, 5), summary: "CU v3: substrate changed to solid aluminium, cost impact priced in. Awaiting client.", result: "needs you" }, { at: at(-10, 10, 25), summary: "Swords v4 verified: Pantone 3015 C, 4000K, 5.2 m. Released.", result: "done" }],
    proposals: [{ id: "gp1", text: "Release Celbridge CU to CNC once v3 is approved", jobId: "JOB-26043", action: "Open proofs" }] },
  { id: "updates", name: "Client Updates", shape: "offset-pebble", tint: "#191c1f", mandate: "Drafts short progress notes and a sensible next-status timeline for each customer, for the owner to review.",
    guardrail: "Never sends. Every note waits for a person.", links: ["JOB-26042", "JOB-26044"],
    runs: [{ at: at(0, 9, 45), summary: "Drafted Swords Accountancy update (fascia in assembly, fit next week).", result: "needs you" }, { at: at(-1, 15, 20), summary: "Drafted fleet update: 6 of 15 vans done.", result: "done" }],
    proposals: [{ id: "up1", text: "Review Swords Accountancy progress note", jobId: "JOB-26042", action: "Review draft" }] },
];

/* ── Integrations ───────────────────────────────────────────────────────── */
export const INTEGRATIONS = [
  { id: "acct", name: "Existing accounts & workshop package", vendor: "Vendor to confirm", status: "Planned" as const, does: "Read invoices, payments and workshop job photos/notes. Stays the system of record.", note: "Provider not named on the call; workshop feature still being rolled out." },
  { id: "email", name: "Company email", vendor: "Provider to confirm", status: "Mock connection" as const, does: "Tender packs and enquiries land in Tender Inbox / Enquiries (simulated).", note: "No live mailbox is read in this demo." },
  { id: "illustrator", name: "Adobe Illustrator artwork links", vendor: "Adobe", status: "Planned" as const, does: "Link .ai/.pdf proofs to each artwork version.", note: "Files stay where they are; Pulse stores the link." },
  { id: "cad", name: "CAD / CNC files", vendor: "Workshop CAD", status: "Planned" as const, does: "Attach cut files to work orders; lock to approved proof.", note: "" },
  { id: "phone", name: "Phone survey capture", vendor: "Pulse mobile", status: "Mock connection" as const, does: "Photos, sketches and measurements from site straight into the job.", note: "" },
  { id: "suppliers", name: "Supplier file import", vendor: "CSV / PDF price lists", status: "Mock connection" as const, does: "Import supplier price lists to keep cost assumptions current.", note: "" },
  { id: "fitters", name: "Fitting subcontractor handoff", vendor: "Pulse site packs", status: "Mock connection" as const, does: "Share site packs with partner crews and record acknowledgement.", note: "No external messages are sent." },
  { id: "portal", name: "Public tender portals", vendor: "eTenders etc.", status: "Not connected" as const, does: "Watch for new signage tenders.", note: "" },
];

/* ── Settings / rules ───────────────────────────────────────────────────── */
export const WORKFLOW_RULES = [
  { id: "r1", name: "Approved proof gate", detail: "No work order can move to CNC/print without an approved proof version. Later changes open a change request with cost impact.", on: true, locked: true },
  { id: "r2", name: "Deposit presets", detail: "Recommend 30% (print, repeat accounts), 40% (vehicle), 50% (custom LED / new customers). Owner can override per job.", on: true },
  { id: "r3", name: "Production sign-off", detail: "QA checklist (vinyl, Pantone, substrate, LED function, proof version, photos) required before Ready for fit.", on: true, locked: true },
  { id: "r4", name: "Supplier alerts", detail: "Flag any bought-in item without a confirmed ETA after 5 business days.", on: true },
  { id: "r5", name: "Margin floor", detail: "Warn when a quote's gross margin is below 38% (adjustable; not a stated Signs ASAP policy).", on: true },
  { id: "r6", name: "Business week", detail: "Production and fitting planned Mon-Fri. Weekend work only when tagged exceptional.", on: true },
  { id: "r7", name: "Customer-facing sends", detail: "Quotes, tender submissions and client updates always wait for a person. Nothing sends automatically.", on: true, locked: true },
];
export const AI_CONTROLS = [
  { id: "ai1", name: "Human approval for customer-facing quotes and tenders", on: true, locked: true },
  { id: "ai2", name: "Human approval for destructive changes (delete, overwrite approved proof)", on: true, locked: true },
  { id: "ai3", name: "Agents may create internal tasks", on: true },
  { id: "ai4", name: "Agents may draft client updates (never send)", on: true },
  { id: "ai5", name: "Tender Estimator may use past job costs as reference", on: true },
  { id: "ai6", name: "Show confidence and page reference on every extracted line", on: true, locked: true },
];
