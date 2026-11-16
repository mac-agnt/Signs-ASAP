/* Pulse template data, re-skinned for Signs ASAP. Canonical business data lives in src/signs/data.ts. */

const INK="var(--ink)", BODY="var(--body)", DIM="var(--dim)", FAINT="var(--faint)";
const LIME="var(--accent)", GREEN="var(--ok)", AMBER="var(--warn)", RED="var(--bad)", NEUTRAL="var(--neutral)";
const MONO="var(--mono)";

const ICONS = {
  navHome:"M12 3.2 3.6 9.1v10a1.5 1.5 0 0 0 1.5 1.5h13.8a1.5 1.5 0 0 0 1.5-1.5v-10L12 3.2Z M8.9 13.1h2l1-2.6 1.5 5 1.1-2.4h1.6",
  navAgents:"M12 2.4v2.3 M12 2.4a.9.9 0 1 0 0-.02 M8.2 6.5h7.6A2.2 2.2 0 0 1 18 8.7v5.1a2.2 2.2 0 0 1-2.2 2.2H8.2A2.2 2.2 0 0 1 6 13.8V8.7a2.2 2.2 0 0 1 2.2-2.2Z M9.9 10.6v1.4 M14.1 10.6v1.4 M6 10h-1.9 M18 10h1.9 M9.2 18.6h5.6 M9.2 21.2h5.6",
  navDash:"M4 5.6h7.2v5.1H4V5.6Z M13.6 5.6H20v8.6h-6.4V5.6Z M4 13.1h7.2v5.3H4v-5.3Z M13.6 16.6H20v1.8h-6.4v-1.8Z",
  navWork:"M9.4 4.4h5.2a1.4 1.4 0 0 1 1.4 1.4v1.1h2.4A1.6 1.6 0 0 1 20 8.5v9.1a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 17.6V8.5a1.6 1.6 0 0 1 1.6-1.6H8V5.8a1.4 1.4 0 0 1 1.4-1.4Z M8 6.9h8 M9.6 13.3l1.8 1.8 3.4-3.6",
  navRecords:"M12 3.6c3.9 0 7 1.1 7 2.5S15.9 8.6 12 8.6 5 7.5 5 6.1 8.1 3.6 12 3.6Z M5 6.1v5.7c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6.1 M5 11.8v5.7c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-5.7",
  navActivity:"M4.6 4.6h14.8A1.6 1.6 0 0 1 21 6.2v11.6a1.6 1.6 0 0 1-1.6 1.6H4.6A1.6 1.6 0 0 1 3 17.8V6.2a1.6 1.6 0 0 1 1.6-1.6Z M6 12.4h2.2l1.5-4.1 2.3 8 1.9-5.4 1.2 1.5H18",
  navAdmin:"M12 2.9 5 5.6v5.9c0 4 2.8 7.1 7 8.6 4.2-1.5 7-4.6 7-8.6V5.6L12 2.9Z M12 8.6a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z M8.8 16.3a3.6 3.6 0 0 1 6.4 0",
  helios:"M21 11.5a8.4 8.4 0 0 1-9 8.4 9.9 9.9 0 0 1-4-.8L3 21l1.9-4.9A8.3 8.3 0 0 1 4 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z M8 12h1.6l1.2-2.6 1.6 5 1.4-2.4H16",
  inbox:"M3 13h4l1.5 3h7l1.5-3h4 M3 13l2.4-7A2 2 0 0 1 7.3 4.6h9.4a2 2 0 0 1 1.9 1.4L21 13v4.4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V13Z",
  work:"M6 4.6h12a1.6 1.6 0 0 1 1.6 1.6v12.2A1.6 1.6 0 0 1 18 20H6a1.6 1.6 0 0 1-1.6-1.6V6.2A1.6 1.6 0 0 1 6 4.6Z M8.4 10.4l1.9 1.9 3.9-3.9 M8.4 15.6h7.2",
  approvals:"M12 3.6 19.5 6v6.1c0 4-3.1 6.9-7.5 8.3-4.4-1.4-7.5-4.3-7.5-8.3V6L12 3.6Z M9.2 12.2l2 2 3.6-3.7",
  insights:"M4.5 19.5V13 M9.7 19.5V7.5 M14.9 19.5v-8 M20 19.5V5",
  people:"M12 12.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z M5 20.2c.9-3.1 3.6-4.9 7-4.9s6.1 1.8 7 4.9",
  orgs:"M4.5 20V6.4A1.4 1.4 0 0 1 5.9 5h6.2a1.4 1.4 0 0 1 1.4 1.4V20 M13.5 10.5h4.6A1.4 1.4 0 0 1 19.5 12v8 M3 20h18 M7.5 8.5h2.5 M7.5 12h2.5 M7.5 15.5h2.5",
  teams:"M9 12a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 12Z M16.5 12.5a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z M2.6 19.6c.8-2.8 3.2-4.4 6.4-4.4s5.6 1.6 6.4 4.4 M17 15.4c2.2.4 3.7 1.8 4.3 4.2",
  locations:"M12 21s6.5-5.6 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21Z M12 12.8a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z",
  visits:"M8 4v3 M16 4v3 M4.5 9.5h15 M6.4 6h11.2A1.9 1.9 0 0 1 19.5 8v10a1.9 1.9 0 0 1-1.9 1.9H6.4A1.9 1.9 0 0 1 4.5 18V8A1.9 1.9 0 0 1 6.4 6Z M9 13.5l1.6 1.6 3.4-3.4",
  autos:"M18.5 8.5A5 5 0 0 0 8.9 7.3 3.8 3.8 0 0 0 6 14.6 M8 17.5l3.2 3.2 M11.2 20.7l3.2-3.2 M11.2 20.7V9.6",
  health:"M3 12.5h3.4l2-5 3 10 2.2-5H21",
  modules:"M6.6 4.4h10.8a2.2 2.2 0 0 1 2.2 2.2v10.8a2.2 2.2 0 0 1-2.2 2.2H6.6a2.2 2.2 0 0 1-2.2-2.2V6.6a2.2 2.2 0 0 1 2.2-2.2Z M4.4 9.6h15.2 M9.6 19.6V9.6",
  agents:"M8.5 3.6h7A2.4 2.4 0 0 1 17.9 6v5.6a2.4 2.4 0 0 1-2.4 2.4h-7A2.4 2.4 0 0 1 6.1 11.6V6a2.4 2.4 0 0 1 2.4-2.4Z M9.6 8.2h.01 M14.4 8.2h.01 M12 14v2.6 M7.6 20.4h8.8 M12 16.6c-2.4 0-4.4 1.7-4.4 3.8h8.8c0-2.1-2-3.8-4.4-3.8Z",
  dash:"M4.4 4.4h6v6h-6v-6Z M13.6 4.4h6v3.6h-6V4.4Z M13.6 11.6h6v8h-6v-8Z M4.4 14h6v5.6h-6V14Z",
  files:"M5 7.2a1.8 1.8 0 0 1 1.8-1.8h3l1.8 2.2h5.6A1.8 1.8 0 0 1 19 9.4v7.4a1.8 1.8 0 0 1-1.8 1.8H6.8A1.8 1.8 0 0 1 5 16.8V7.2Z",
  pulseLine:"M2.5 12.5h3.6l2.1-6.4 3.2 12.2 2.6-8.4 1.8 2.6h5.7",
  records:"M6.4 3.6h7.4l4.2 4.2v12.6H6.4V3.6Z M13.4 3.8v4.2h4.2 M9 12.4h6 M9 16h4",
  tree:"M4.5 6h5 M4.5 12h5 M4.5 18h5 M12.5 6h7 M12.5 12h7 M12.5 18h7",
  graph:"M7 7.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z M17.6 10.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z M9.4 21.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z M8.6 6.4l7.6 2.6 M15.8 11.4l-5.6 5.2",
  bell:"M6 8.5a6 6 0 0 1 12 0c0 6.5 2.6 8.5 2.6 8.5H3.4S6 15 6 8.5Z M10.3 20.5a1.94 1.94 0 0 0 3.4 0",
  navSales:"M3.8 12.6 11.4 5h7.1a1.5 1.5 0 0 1 1.5 1.5v7.1l-7.6 7.6a1.5 1.5 0 0 1-2.1 0l-6.5-6.5a1.5 1.5 0 0 1 0-2.1Z M15.6 8.4h.01",
  navTender:"M6.4 3.6h7.4l4.2 4.2v12.6H6.4V3.6Z M13.4 3.8v4.2h4.2 M9 13.2l1.9 1.9 3.9-3.9",
  navJobs:"M5 4.5h14v15H5z M8.5 8.5h7 M8.5 12h7 M8.5 15.5h4.5 M9 2.8v3.4 M15 2.8v3.4",
  navProd:"M3.5 20V10l5 3.2V10l5 3.2V6.5h2.5V4h2v2.5h2.5V20Z M7 17h2 M11.5 17h2 M16 17h2",
  navInstall:"M7 21 10 3 M17 21 14 3 M8.6 9h6.8 M7.9 13.5h8.2 M7.2 18h9.6",
  navFinance:"M17.5 6.6A7 7 0 1 0 17.5 17.4 M4.6 10.4h9 M4.6 13.6h9"
};

/* Ontology stays first and is never removed (PulseLogic enforces this too). */
const REC_SECTIONS = [
  {id:"ontology", label:"Ontology", blurb:"How every Signs ASAP record connects: customer, job, survey, proof, materials, work order, crew and payment."},
  {id:"files", label:"Files", blurb:"Tender packs, proofs, survey photos and supplier files, indexed where Pulse can read them."},
  {id:"contacts", label:"Contacts", blurb:"Staff, customer contacts and fitting partners."},
  {id:"customers", label:"Customers", blurb:"Repeat accounts, franchise rollouts, small businesses and developers."},
  {id:"jobs", label:"Jobs", blurb:"Every job as one record from enquiry to balance paid."},
  {id:"staff", label:"Staff", blurb:"The five-person team, the owner account and partner crews."},
  {id:"suppliers", label:"Suppliers", blurb:"Where boards, film, LEDs and fabricated letters come from."},
  {id:"materials", label:"Materials", blurb:"Stock, orders and what each job is waiting on."},
  {id:"assets", label:"Assets", blurb:"Printers, laminator, CNC router, vans and access kit."}
];

const CONTACTS = [
  ["Managing Director","Owner","info@signsasap.ie","Signs ASAP","staff","var(--accent)"],
  ["Conor Hayes","Design & Artwork","conor@signsasap.ie (demo)","Signs ASAP","staff","#3FB0D6"],
  ["Liam Kelly","Fabrication & CNC","liam@signsasap.ie (demo)","Signs ASAP","staff","#e6c07a"],
  ["Niamh Doyle","Wide Format Print","niamh@signsasap.ie (demo)","Signs ASAP","staff","#b9a4f0"],
  ["Mark Brennan","Prep & Dispatch","mark@signsasap.ie (demo)","Signs ASAP","staff","#8fd6a8"],
  ["Aisling Ryan","Accounts & Collections","aisling@signsasap.ie (demo)","Signs ASAP","staff","#f0a4b8"],
  ["Practice manager","Customer contact","Not shown in demo","Swords Accountancy Practice","repeat","#9fd6f0"],
  ["Branch operations manager","Customer contact","Not shown in demo","Celbridge Credit Union","customer","#9fd6f0"],
  ["Fleet & marketing lead","Customer contact","Not shown in demo","Window Manufacturer Fleet","repeat","#9fd6f0"],
  ["Franchise fit-out coordinator","Customer contact","Not shown in demo","Camile (franchise)","repeat","#9fd6f0"],
  ["Facilities & estates manager","Customer contact","Not shown in demo","College client (tender)","customer","#9fd6f0"],
  ["Site manager","Customer contact","Not shown in demo","Portmarnock Residential Development","repeat","#9fd6f0"],
  ["Crew lead","Fitting partner","Not shown in demo","Fingal Fit-Out Crew","fitter","#e6c78a"],
  ["Crew lead","Fitting partner","Not shown in demo","Leinster Access & Signs","fitter","#e6c78a"],
  ["Account desk","Supplier","Not shown in demo","Composite panel stockist","supplier","#c8b4f0"]
];

const FILE_TREE = [
  {type:"folder", id:"f-tender", name:"Tenders", depth:0},
  {type:"file", id:"fl-1", name:"College Campus Directory Signage - Tender Pack.pdf", depth:1, parent:"f-tender", indexed:true,
   path:"Tenders / TND-034 (draft)", title:"College Campus Directory Signage - Tender Pack",
   facts:[["TYPE","PDF · 46 pages"],["RECEIVED","Today 07:52 (mock inbox)"],["INDEXED","All 46 pages"],["OWNER","Managing Director"]],
   body:["Six floors of room identification plaques, directional signs and floor directory boards, plus one external entrance totem.",
     "Tender Estimator counted 144 plaques, 18 directional signs and 6 directories with page references. The totem has no illumination or foundation spec, so it stays a provisional sum.",
     "Section 2.7 puts statutory fire-exit signage with the M&E contractor. It is excluded from the draft and listed as a clarification."],
   links:[["Tender Desk","tender"],["Tender Estimator","agent"]]},
  {type:"file", id:"fl-2", name:"College Wayfinding Tender - award letter.pdf", depth:1, parent:"f-tender", indexed:true,
   path:"Tenders / TND-031 (won)", title:"College Wayfinding Tender - award letter",
   facts:[["TYPE","PDF · 2 pages"],["VALUE","€7,500"],["INDEXED","Both pages"],["JOB","JOB-26041"]],
   body:["Award of the college wayfinding and directory package at €7,500, now JOB-26041 in procurement.",
     "120 room plaques, 12 directional signs and 6 floor directories, fitted out of hours."],
   links:[["JOB-26041","job"],["College client","customer"]]},
  {type:"folder", id:"f-proof", name:"Artwork & proofs", depth:0},
  {type:"file", id:"fl-3", name:"Celbridge CU - proof v3.pdf", depth:1, parent:"f-proof", indexed:true,
   path:"Artwork / JOB-26043", title:"Celbridge Credit Union - proof v3",
   facts:[["TYPE","PDF · 3 pages"],["STATUS","Awaiting client sign-off"],["INDEXED","All 3 pages"],["DESIGNER","Conor Hayes"]],
   body:["Final for approval: solid aluminium tray (upgrade from Dibond, priced in), warm white 3000K, logo moved clear of the alarm bell.",
     "Dimensions are a demo example (6.0 m × 1.3 m). Proof Guardian holds the CNC release until this version is approved."],
   links:[["JOB-26043","job"],["Proof Guardian","agent"]]},
  {type:"file", id:"fl-4", name:"Fleet livery template v3.ai", depth:1, parent:"f-proof", indexed:false,
   path:"Artwork / JOB-26044", title:"Fleet livery template v3",
   facts:[["TYPE","Illustrator · linked"],["STATUS","Approved"],["INDEXED","Not indexed"],["DESIGNER","Conor Hayes"]],
   body:["One template for all 15 vans. Illustrator files stay where they are; Pulse stores the link against the approved version (planned integration).",
     "6 of 15 vans complete, 4 printing this week, 5 waiting for a slot."],
   links:[["JOB-26044","job"]]},
  {type:"folder", id:"f-survey", name:"Site surveys", depth:0},
  {type:"file", id:"fl-5", name:"Celbridge CU - survey photos.zip", depth:1, parent:"f-survey", indexed:true,
   path:"Surveys / SV-43", title:"Celbridge Credit Union - survey photos",
   facts:[["TYPE","4 photos + sketch"],["CAPTURED","By the owner, on phone"],["INDEXED","Tags and notes"],["OBSTACLES","5 tagged"]],
   body:["Front elevation, alarm bell left, CCTV and downpipe right, door head with the cable entry for the LED driver.",
     "Captured once on site and visible to design and production straight away (mock)."],
   links:[["JOB-26043","job"]]},
  {type:"folder", id:"f-supp", name:"Supplier documents", depth:0},
  {type:"file", id:"fl-6", name:"Composite panels - price list.csv", depth:1, parent:"f-supp", indexed:false,
   path:"Suppliers / Composite panel stockist", title:"Composite panels - price list",
   facts:[["TYPE","CSV · 84 rows"],["IMPORTED","Mock import"],["INDEXED","Not indexed"],["USED BY","Quote Builder"]],
   body:["Illustrative price list used to keep ACM and solid aluminium cost assumptions current.",
     "Supplier file import is a mock connection in this demo."],
   links:[["Quote Builder","module"]]}
];

const ONTO_NODES = [
  ["Job","entity",500,300,1,"The spine: one record from enquiry to balance paid. Everything else hangs off it."],
  ["Customer","entity",300,190,1,"Repeat accounts, franchises, small businesses and developers."],
  ["Site","entity",700,190,1,"Where the sign goes: address, access, power and fixing conditions."],
  ["Survey","module",250,430,1,"Captured on the owner's phone: photos, sketch, dimensions and obstacles."],
  ["Work order","entity",690,430,1,"What the workshop builds, locked to the approved proof version."],
  ["Proof version","entity",850,320,0,"v1, v2, v3. Only an approved version can be released to production."],
  ["Payment","ledger",390,95,0,"Deposits and balances, read from the existing accounts package (planned)."],
  ["Quote","entity",620,95,0,"Priced from a template: printed, fleet or custom illuminated."],
  ["Install crew","module",860,470,0,"In-house or one of the partner crews; acknowledges the site pack."],
  ["Material","entity",140,300,0,"ACM, film, LEDs and bought-in fabricated letters."],
  ["orders","predicate",395,240,0,"Customer → Job."],
  ["located at","predicate",605,240,0,"Job → Site."],
  ["surveyed by","predicate",360,370,0,"Survey → Job."],
  ["builds","predicate",600,370,0,"Work order → Job."],
  ["consumed by","predicate",140,372,0,"Material → Work order."]
];

const ONTO_EDGES = [
  [500,300,300,190],[500,300,700,190],[500,300,250,430],[500,300,690,430],
  [500,300,850,320],[500,300,390,95],[500,300,620,95],[500,300,140,300],
  [300,190,250,430],[700,190,860,470],[690,430,850,320],[690,430,860,470],
  [300,190,140,300],[390,95,620,95]
];

const REC_TEMPLATES = [
  ["Field sheet","Records","Labelled fields in a grid, the default for a person, organisation or location.",
   "M5 5.5h14v13H5v-13Z M5 10h14 M12 10v8.5","grid"],
  ["Contact card","Records","A portrait, key fields and every linked record in one compact panel.",
   "M12 11.5a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z M5.5 19c.8-3 3.3-4.7 6.5-4.7s5.7 1.7 6.5 4.7","card"],
  ["Directory","Records","A sortable table of many records at once, built for lists.",
   "M4.5 6.5h15 M4.5 12h15 M4.5 17.5h15 M4.5 6.5h.01 M4.5 12h.01 M4.5 17.5h.01","rows"],
  ["Timeline","Case work","Ordered events with who did what and when. Good for a case or a claim.",
   "M12 3.5v17 M12 7.5h6 M12 13h-6 M12 18h6","timeline"],
  ["Kanban board","Case work","Cards in columns by status. For anything that moves through stages.",
   "M5 5h4.5v14H5V5Z M9.75 5h4.5v9h-4.5V5Z M14.5 5H19v6h-4.5V5Z","kanban"],
  ["Checklist","Case work","Ticked steps in order, with an owner and a due date on each.",
   "M5 6.5h2l1.4 1.4L11 5.5 M5 12.5h2l1.4 1.4 2.6-2.4 M5 18.5h2l1.4 1.4 2.6-2.4 M15 6.5h4 M15 12.5h4 M15 18.5h4","checklist"],
  ["Ledger","Finance","Rows and running totals. For anything with amounts and dates.",
   "M4 6h16 M4 12h16 M4 18h16 M9 3.5v17","ledger"],
  ["Invoice","Finance","Line items, totals and a status, built to be sent, not just stored.",
   "M7 3.5h10v17H7v-17Z M9.5 8h5 M9.5 11.5h5 M9.5 15h3","invoice"],
  ["Document","Notes","Long-form text with linked records pulled out down the side.",
   "M7 3.5h7l5 5v12H7v-17Z M14 3.7v5h5 M10 13h6 M10 16.5h4","document"],
  ["Gallery","Notes","A wall of images and files with a caption on each, for a site or a job.",
   "M4.5 6h6v6h-6V6Z M13.5 6h6v6h-6V6Z M4.5 14h6v4h-6v-4Z M13.5 14h6v4h-6v-4Z","gallery"],
  ["Map & locations","Ops","A pinboard of places, with the record's fields beside each pin.",
   "M12 21s6.5-5.6 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21Z M12 12.8a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z","map"],
  ["Schedule","Ops","A calendar of bookings against this record, with recurring rules.",
   "M8 4v3 M16 4v3 M4.5 9.5h15 M6.4 6h11.2A1.9 1.9 0 0 1 19.5 8v10a1.9 1.9 0 0 1-1.9 1.9H6.4A1.9 1.9 0 0 1 4.5 18V8A1.9 1.9 0 0 1 6.4 6Z","schedule"]
];
const REC_TEMPLATE_CATS = ["All","Records","Case work","Finance","Notes","Ops"];

/* ---- admin hub ---- */
/* ---- admin hub: 13 settings areas in five groups ---- */
const PEOPLE = [
  ["Managing Director","Owner","info@signsasap.ie","Swords","active","Admin","Now"],
  ["Conor Hayes","Design & Artwork","conor@signsasap.ie (demo)","Swords","active","Manager","12 min ago"],
  ["Liam Kelly","Fabrication & CNC","liam@signsasap.ie (demo)","Swords","active","Standard","4 min ago"],
  ["Niamh Doyle","Wide Format Print","niamh@signsasap.ie (demo)","Swords","active","Standard","9 min ago"],
  ["Mark Brennan","Prep & Dispatch","mark@signsasap.ie (demo)","Swords","active","Standard","31 min ago"],
  ["Aisling Ryan","Accounts & Collections","aisling@signsasap.ie (demo)","Swords","active","Manager","1 h ago"]
];
const ROLE_LEVELS = ["Admin","Manager","Standard","External"];
const PERM_KEYS = [["view","View records"],["edit","Edit records"],["approve","Approve payments"]];
const GRANT_DEFS = [
  ["view","View records","Read anything in scope"],
  ["edit","Edit records","Create and change records"],
  ["approve","Approve decisions","Say yes to parked work"],
  ["pay","Release payments","Send money out"],
  ["export","Export data","Download and share out"],
  ["agents","Manage agents","Create and grant agents"],
  ["settings","Change settings","Modules, roles, integrations"],
  ["audit","Read the audit log","Every action, everyone"]
];
const ROLE_SCOPES = ["All records","Their location","Assigned only"];
const DEFAULT_PERMS = {Admin:{view:true,edit:true,approve:true}, Manager:{view:true,edit:true,approve:true},
  Standard:{view:true,edit:true,approve:false}, External:{view:true,edit:false,approve:false}};
const INTEGRATIONS = [
  {name:"Gmail", blurb:"Mail in and out of Pulse, threads attach to the record they mention, and drafts wait for your yes.", tint:"#ea4335", status:"connected", statusKind:"ok",
   glyph:"M4 7.2 12 13 20 7.2 M4 7.2v10.6h16V7.2 M4 7.2 8.5 4h7L20 7.2",
   lastSync:"2 min ago", usage:"340 emails/day", auth:"OAuth 2.0", scopes:["Read","Send"]},
  {name:"Accounts package", blurb:"Invoices, payments and credit notes sync both ways, so the ledger and the record spine never drift.", tint:"#13b5ea", status:"disconnected", statusKind:"bad",
   glyph:"M4.5 12a7.5 7.5 0 0 1 12.8-5.3 M19.5 12a7.5 7.5 0 0 1-12.8 5.3 M17.3 4v3.3h-3.3 M6.7 20v-3.3H10",
   lastSync:"27 Feb, token expired", usage:"148 invoices queued", auth:"OAuth 2.0", scopes:["Read","Write"]},
  {name:"Sage", blurb:"Nightly read of the chart of accounts and balances, mapped onto Pulse organisations.", tint:"#00d639", status:"read only", statusKind:"warn",
   glyph:"M4 8 12 4.5 20 8 12 11.5 4 8Z M4 13 12 16.5 20 13 M4 18 12 21.5 20 18",
   lastSync:"14 min ago", usage:"9 accounts synced nightly", auth:"API key", scopes:["Read"]},
  {name:"HubSpot", blurb:"Contacts, companies and deals stay matched to Pulse records without a second address book.", tint:"#ff7a59", status:"connected", statusKind:"ok",
   glyph:"M12 9.6a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8Z M12 4v3.4 M12 16.6V20 M4 12h3.4 M16.6 12H20 M6.5 6.5l2.4 2.4 M15.1 15.1l2.4 2.4 M17.5 6.5l-2.4 2.4 M8.9 15.1l-2.4 2.4",
   lastSync:"6 min ago", usage:"1.1k contacts synced", auth:"OAuth 2.0", scopes:["Read","Write"]},
  {name:"WhatsApp Business", blurb:"Send updates and chase messages from the record, logged against it as they go.", tint:"#25d366", status:"write only", statusKind:"warn",
   glyph:"M4 19.5 5.3 15A7.7 7.7 0 1 1 8.6 18.2L4 19.5Z M8.6 10.3c0 3 2.4 5.4 5.4 5.4",
   lastSync:"11 min ago", usage:"62 messages/day", auth:"API key", scopes:["Send"]},
  {name:"Resend", blurb:"Transactional email for everything Pulse generates, reminders, briefings and receipts.", tint:"var(--accent)", status:"write only", statusKind:"warn",
   glyph:"M3.5 12 20.5 4 16 20l-3.4-6.6L3.5 12Z",
   lastSync:"38 min ago", usage:"210 emails/day", auth:"API key", scopes:["Send"]},
  {name:"Composio", blurb:"One connector for the long tail of tools, so a new system does not need a new build.", tint:DIM, status:"not connected", statusKind:"off",
   glyph:"M9 3v5 M15 3v5 M6 8h12v3.5a6 6 0 0 1-12 0V8Z M12 17.5V21",
   lastSync:"-", usage:"-", auth:"-", scopes:[]}
];

/* Background catalogue. Each entry is pure CSS so a tile is the real thing at
   thumbnail size, not a picture of it. */
const BG_DEFS = [
  {id:"bloom", name:"Bloom", cat:"Signature",
   css:"background:radial-gradient(60% 48% at 50% 34%, var(--accent-faint), transparent 72%), radial-gradient(44% 38% at 16% 84%, rgba(255,255,255,.05), transparent 70%)",
   thumb:"background:radial-gradient(62% 58% at 46% 34%, var(--accent-soft), transparent 74%), radial-gradient(50% 46% at 82% 84%, rgba(255,255,255,.08), transparent 72%), var(--surface-2)"},
  {id:"mist", name:"Mist", cat:"Signature",
   css:"background:radial-gradient(52% 44% at 24% 22%, rgba(255,255,255,.07), transparent 70%), radial-gradient(56% 46% at 80% 76%, rgba(255,255,255,.05), transparent 72%)",
   thumb:"background:radial-gradient(58% 52% at 24% 22%, rgba(255,255,255,.16), transparent 72%), radial-gradient(60% 54% at 82% 78%, rgba(255,255,255,.10), transparent 74%), var(--surface-2)"},
  {id:"grid", name:"Grid", cat:"Signature",
   css:"background-image:linear-gradient(var(--border) 1px, transparent 1px),linear-gradient(90deg, var(--border) 1px, transparent 1px);background-size:56px 56px;mask-image:radial-gradient(62% 56% at 50% 46%, #000, transparent 78%);-webkit-mask-image:radial-gradient(62% 56% at 50% 46%, #000, transparent 78%)",
   thumb:"background-color:var(--surface-2);background-image:linear-gradient(var(--border-strong) 1px, transparent 1px),linear-gradient(90deg, var(--border-strong) 1px, transparent 1px);background-size:14px 14px"},
  {id:"none", name:"None", cat:"Signature", css:"", thumb:"background:var(--surface-2)"},

  {id:"aurora", name:"Aurora", cat:"Gradient",
   css:"background:radial-gradient(70% 52% at 18% 8%, var(--bloom-a), transparent 66%), radial-gradient(64% 48% at 84% 22%, var(--bloom-b), transparent 68%), radial-gradient(70% 60% at 50% 104%, var(--bloom-c), transparent 70%);filter:blur(24px)",
   thumb:"background:radial-gradient(72% 60% at 16% 6%, var(--bloom-a), transparent 68%), radial-gradient(66% 54% at 86% 24%, var(--bloom-b), transparent 70%), radial-gradient(74% 66% at 50% 108%, var(--bloom-c), transparent 72%), var(--surface-2)"},
  {id:"horizon", name:"Horizon", cat:"Gradient",
   css:"background:linear-gradient(180deg, transparent 0%, var(--accent-faint) 58%, transparent 100%), radial-gradient(90% 40% at 50% 72%, var(--accent-soft), transparent 70%)",
   thumb:"background:linear-gradient(180deg, var(--surface-2) 0%, var(--accent-faint) 58%, var(--surface-2) 100%), radial-gradient(90% 44% at 50% 74%, var(--accent-soft), transparent 70%)"},
  {id:"dusk", name:"Dusk", cat:"Gradient",
   css:"background:linear-gradient(200deg, var(--bloom-c) -10%, transparent 46%), linear-gradient(20deg, var(--bloom-b) -10%, transparent 52%);opacity:.5",
   thumb:"background:linear-gradient(200deg, var(--bloom-c) -12%, transparent 48%), linear-gradient(20deg, var(--bloom-b) -12%, transparent 54%), var(--surface-2)"},
  {id:"ember", name:"Ember", cat:"Gradient",
   css:"background:radial-gradient(60% 70% at 84% 96%, var(--bloom-a), transparent 64%), radial-gradient(50% 60% at 10% 96%, var(--bloom-c), transparent 66%)",
   thumb:"background:radial-gradient(64% 76% at 84% 100%, var(--bloom-a), transparent 66%), radial-gradient(54% 66% at 8% 100%, var(--bloom-c), transparent 68%), var(--surface-2)"},

  {id:"mesh", name:"Mesh", cat:"Abstract",
   css:"background-image:radial-gradient(var(--border-strong) 1px, transparent 1px);background-size:22px 22px;mask-image:radial-gradient(70% 62% at 50% 46%, #000, transparent 76%);-webkit-mask-image:radial-gradient(70% 62% at 50% 46%, #000, transparent 76%)",
   thumb:"background-color:var(--surface-2);background-image:radial-gradient(var(--border-strong) 1px, transparent 1px);background-size:8px 8px"},
  {id:"contour", name:"Contour", cat:"Abstract",
   css:"background:repeating-radial-gradient(circle at 30% 110%, transparent 0 22px, var(--border) 22px 23px);mask-image:radial-gradient(80% 70% at 40% 80%, #000, transparent 78%);-webkit-mask-image:radial-gradient(80% 70% at 40% 80%, #000, transparent 78%)",
   thumb:"background:repeating-radial-gradient(circle at 26% 116%, var(--surface-2) 0 9px, var(--border-strong) 9px 10px)"},
  {id:"weave", name:"Weave", cat:"Abstract",
   css:"background:repeating-linear-gradient(48deg, transparent 0 16px, var(--border) 16px 17px), repeating-linear-gradient(-48deg, transparent 0 16px, var(--border) 16px 17px);opacity:.7",
   thumb:"background-color:var(--surface-2);background-image:repeating-linear-gradient(48deg, transparent 0 7px, var(--border-strong) 7px 8px), repeating-linear-gradient(-48deg, transparent 0 7px, var(--border-strong) 7px 8px)"},
  {id:"halo", name:"Halo", cat:"Abstract",
   css:"background:repeating-radial-gradient(circle at 50% 50%, transparent 0 46px, var(--accent-line) 46px 47px);mask-image:radial-gradient(60% 60% at 50% 50%, #000, transparent 72%);-webkit-mask-image:radial-gradient(60% 60% at 50% 50%, #000, transparent 72%)",
   thumb:"background:repeating-radial-gradient(circle at 50% 50%, var(--surface-2) 0 11px, var(--accent-line) 11px 12px)"},
  {id:"drift", name:"Drift", cat:"Abstract",
   css:"background:conic-gradient(from 210deg at 32% 38%, var(--bloom-b), transparent 38%), conic-gradient(from 20deg at 76% 70%, var(--bloom-a), transparent 34%);filter:blur(30px);opacity:.6",
   thumb:"background:conic-gradient(from 210deg at 32% 38%, var(--bloom-b), transparent 38%), conic-gradient(from 20deg at 76% 70%, var(--bloom-a), transparent 34%), var(--surface-2)"},
  {id:"scan", name:"Scanlines", cat:"Abstract",
   css:"background:repeating-linear-gradient(0deg, var(--border) 0 1px, transparent 1px 7px);mask-image:linear-gradient(180deg, #000, transparent 88%);-webkit-mask-image:linear-gradient(180deg, #000, transparent 88%)",
   thumb:"background-color:var(--surface-2);background-image:repeating-linear-gradient(0deg, var(--border-strong) 0 1px, transparent 1px 5px)"}
];

const THEMES = [
  {id:"dark", label:"Dark", group:"Dark", bg:"#0b0c0b", surface:"#1a1c19", ink:"#f2f3ef", accent:"#c8f04b"},
  {id:"indigo", label:"Indigo", group:"Dark", bg:"#0a0b13", surface:"#1a1b26", ink:"#f0f1fa", accent:"#8b93ff"},
  {id:"slate", label:"Slate", group:"Dark", bg:"#100e0c", surface:"#211c17", ink:"#f4f0ea", accent:"#e8a14a"},
  {id:"plum", label:"Plum", group:"Dark", bg:"#100a10", surface:"#20151f", ink:"#f6eef4", accent:"#f077b0"},
  {id:"ember", label:"Ember", group:"Dark", bg:"#0b0b0b", surface:"#1c1714", ink:"#f7f3ef", accent:"#f4561a"},
  {id:"harbour", label:"Harbour", group:"Dark", bg:"#0b0e10", surface:"#13171a", ink:"#f3f5f4", accent:"#5ee79a"},
  {id:"cargo", label:"Cargo", group:"Dark", bg:"#0a0a0a", surface:"#1a1c1a", ink:"#f2f5f2", accent:"#4ade80"},
  {id:"ocean", label:"Ocean", group:"Dark", bg:"#080e12", surface:"#141f25", ink:"#eaf4f8", accent:"#4fd4d0"},
  {id:"graphite", label:"Graphite", group:"Dark", bg:"#111112", surface:"#212124", ink:"#f4f4f5", accent:"#f4f4f5"},
  {id:"light", label:"Cream", group:"Light", bg:"#f4f2ed", surface:"#ffffff", ink:"#16181c", accent:"#0071e3"},
  {id:"warm", label:"Warm paper", group:"Light", bg:"#faf5ec", surface:"#fffdf9", ink:"#2a2016", accent:"#c9683f"},
  {id:"mist", label:"Mist", group:"Light", bg:"#eef1f4", surface:"#ffffff", ink:"#141e20", accent:"#0e9f6e"},
  {id:"sand", label:"Sand", group:"Light", bg:"#f6f1e6", surface:"#fffdf7", ink:"#221d12", accent:"#7d5fd6"}
];

const ADMIN_ICONS = {
  people:"M12 12.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z M5 20.2c.9-3.1 3.6-4.9 7-4.9s6.1 1.8 7 4.9",
  teams:"M9 12a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 12Z M16.5 12.5a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z M2.6 19.6c.8-2.8 3.2-4.4 6.4-4.4s5.6 1.6 6.4 4.4 M17 15.4c2.2.4 3.7 1.8 4.3 4.2",
  structure:"M4.5 20V6.4A1.4 1.4 0 0 1 5.9 5h6.2a1.4 1.4 0 0 1 1.4 1.4V20 M13.5 10.5h4.6A1.4 1.4 0 0 1 19.5 12v8 M3 20h18 M7.5 8.5h2.5 M7.5 12h2.5",
  shield:"M12 3.6 19.5 6v6.1c0 4-3.1 6.9-7.5 8.3-4.4-1.4-7.5-4.3-7.5-8.3V6L12 3.6Z M9.2 12.2l2 2 3.6-3.7",
  agent:"M2 12h4l2.5-6 3.5 12 3-8 2 2h5",
  flow:"M18.5 8.5A5 5 0 0 0 8.9 7.3 3.8 3.8 0 0 0 6 14.6 M8 17.5l3.2 3.2 M11.2 20.7l3.2-3.2 M11.2 20.7V9.6",
  plug:"M9 3.5v5 M15 3.5v5 M6.5 8.5h11v3a5.5 5.5 0 0 1-11 0v-3Z M12 17v3.5",
  modules:"M6.6 4.4h10.8a2.2 2.2 0 0 1 2.2 2.2v10.8a2.2 2.2 0 0 1-2.2 2.2H6.6a2.2 2.2 0 0 1-2.2-2.2V6.6a2.2 2.2 0 0 1 2.2-2.2Z M4.4 9.6h15.2 M9.6 19.6V9.6",
  health:"M3 12.5h3.4l2-5 3 10 2.2-5H21",
  lock:"M6.5 10.5h11a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19v-7a1.5 1.5 0 0 1 1.5-1.5Z M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3",
  audit:"M8 3.5h8l3.5 3.5v13a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 6 3.5h2Z M9 12h6 M9 16h4",
  brand:"M12 3.5 14.6 9l6.4.6-4.8 4.2 1.4 6.2-5.6-3.3-5.6 3.3 1.4-6.2L3 9.6 9.4 9 12 3.5Z",
  bell:"M6 8.5a6 6 0 0 1 12 0c0 6.5 2.6 8.5 2.6 8.5H3.4S6 15 6 8.5Z M10.3 20.5a1.94 1.94 0 0 0 3.4 0",
  data:"M4.5 7.5c0-1.7 3.4-3 7.5-3s7.5 1.3 7.5 3-3.4 3-7.5 3-7.5-1.3-7.5-3Z M4.5 7.5v9c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-9 M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3"
};

const ADMIN_CARDS = [
  {id:"people", group:"ORGANISATION", title:"People & access", icon:"people", tint:"#6ad0f0",
   blurb:"Invite, suspend and offboard the people who use Pulse.",
   tags:["48 people","6 teams","3 locations"], badge:"3 waiting", badgeKind:"warn",
   footer:"Last login checked 4 minutes ago", action:"Review 3 invites",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Add, invite or remove employees","",""],["Create teams and departments","6 teams"],["Assign managers","4 reporting lines"],
     ["Set locations","Head office · Swords · Fitting partners"],["Suspend accounts","2 suspended"],["View last login","48 people tracked"]]},
  {id:"teams", group:"ORGANISATION", title:"Roles & permissions", icon:"shield", tint:"var(--accent)",
   blurb:"Permission templates, and exactly what each person can reach.",
   tags:["4 roles","64 permissions","3 scopes"],
   heroLabel:"THE QUESTION THIS ANSWERS", heroAction:"Show me what someone can access",
   heroText:"Pick a person and see every record, action and export they can reach, resolved through their grants, not guessed from the menus.",
   footer:"Preview Pulse as another user", action:"Open preview",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Create permission templates","4 in use"],["View, edit, export and delete access","per permission"],
     ["Restrict by team, location or record owner","3 scopes"],["Set approval limits","€10,000 threshold"],["Preview Pulse as another user",""]]},
  {id:"structure", group:"ORGANISATION", title:"Company structure", icon:"structure", tint:"#f0c04b",
   blurb:"Who reports to whom, where they work and when.",
   tags:["3 locations","Europe/Dublin","EUR"],
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Company details","Signs ASAP"],["Departments","5"],["Teams","6"],["Locations","3"],
     ["Reporting lines","4"],["Working hours","08:00-17:30, Mon-Fri"],["Holidays","Irish public holidays"],
     ["Default currency and timezone","EUR · Europe/Dublin"]]},

  {id:"agents", group:"CONTROL", title:"Agents & AI controls", icon:"agent", tint:"var(--accent)",
   blurb:"What agents may read, what they may do, and where they must stop.",
   tags:["7 agents","318 actions today","€0.62 spent"],
   heroLabel:"GLOBAL CONTROL", heroAction:"Pause every agent",
   heroText:"One switch stops every agent immediately. Anything mid-run finishes its current step and then holds.",
   footer:"Write and external tools always need a yes", action:"Review limits",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Create approved agent roles","7 approved"],["Control which data agents can read","by permission"],
     ["Control which actions agents can take","read · write · external"],["Set approval requirements","all write tools", true],
     ["Set spending and usage limits","€40/month cap"],["Manage agent memory and retention","90 days"]]},
  {id:"wf", group:"CONTROL", title:"Workflow controls", icon:"flow", tint:"#9d8cf5",
   blurb:"The guardrails, not the builder, that lives under Work.",
   tags:["Managers only","2 approval rules","Retry twice"],
   footer:"Building workflows happens in Work", action:"Open Work",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Who can create workflows","Managers only"],["Maximum autonomy","proposes, never sends", true],
     ["Approval rules","2 configured"],["Failure handling","retry twice, then notify"],
     ["Usage limits","500 runs/day"],["Global pause","all workflows", true],["Default notification settings","inbox only"]]},
  {id:"notif", group:"CONTROL", title:"Notifications", icon:"bell", tint:"#f0994b",
   blurb:"Which events reach people, on which channel, and when not to.",
   tags:["Inbox","WhatsApp","Quiet 19:00-07:00"],
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Which events trigger notifications","14 of 21 events"],["Email","", true],["WhatsApp","", true],
     ["Mobile push","", false],["In-app","", true],["Escalation rules","after 4 hours unread"],
     ["Quiet hours","19:00-07:00"],["Daily and weekly summaries","07:00 daily"]]},

  {id:"integrations", group:"SYSTEMS", title:"Integrations", icon:"plug", tint:"#6ad0f0",
   blurb:"Email, accounting, CRM and messaging, and which way data flows.",
   tags:["6 connected","1 disconnected","2 read-only"], badge:"Accounts package down", badgeKind:"bad",
   footer:"Accounts package not connected (planned) 27 February", action:"Reconnect",
   listLabel:"CONNECTIONS",
   rows:[["Gmail","read and write"],["Accounts package","disconnected"],["Sage","read only"],["HubSpot","read and write"],
     ["WhatsApp Business","write only"],["Resend","write only"],["Composio","not connected"]]},
  {id:"modules", group:"SYSTEMS", title:"Modules & configuration", icon:"modules", tint:"#f0c04b",
   blurb:"Turn modules on, and make Pulse speak the business's own words.",
   tags:["3 installed","1 available","2 renamed terms"],
   heroLabel:"TERMINOLOGY", heroAction:"Edit terminology",
   heroText:"Organisation reads as Customer, and Task reads as Job, everywhere in the interface, including what Helios says back to you.",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Enable or disable modules","3 installed"],["Rename business terminology","2 overridden"],
     ["Create custom fields","9 fields"],["Configure statuses","6 sets"],["Edit record types","7 types"],
     ["Set required information","per record type"],["Manage form layouts","4 layouts"]]},
  {id:"health", group:"SYSTEMS", title:"Data health", icon:"health", tint:"#e2705c",
   blurb:"What is wrong with the data, how bad it is, and the fix.",
   tags:["7 issue types","231 records affected"], badge:"74 duplicates", badgeKind:"bad",
   footer:"Last scanned 12 minutes ago", action:"Fix 3 automatically",
   listLabel:"ISSUES FOUND",
   trend:[312,289,274,256,248,241,231],
   bySeverity:[["High","137",RED],["Medium","59",AMBER],["Low","35",DIM]],
   issues:[["Duplicate records","74","high","Merge on matching name and VAT number","Fix automatically"],
     ["Missing required fields","62","high","4 organisations have no billing email","Fix automatically"],
     ["Failed imports","18","medium","Re-run the 14 August Sage batch","Retry"],
     ["Out-of-date information","41","medium","Not touched in over 18 months","Review"],
     ["Broken connections","1","high","Accounts package refresh token expired","Reconnect"],
     ["Unmatched records","23","low","Invoices with no organisation attached","Review"],
     ["Records needing review","12","low","Flagged by an agent as inconsistent","Review"]],
   rows:[]},

  {id:"security", group:"GOVERNANCE", title:"Security", icon:"lock", tint:"#8fa6ff",
   blurb:"Sign-in, sessions, devices and the keys that reach the API.",
   tags:["SSO on","2FA enforced","3 API keys"], badge:"2 advisories", badgeKind:"warn",
   footer:"2 security recommendations open", action:"Review",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Single sign-on","Google Workspace", true],["Two-factor authentication","enforced", true],
     ["Login policies","30-day session"],["Active sessions","51"],["Approved devices","44"],
     ["IP restrictions","off", false],["Security alerts","on", true],["API keys","3 active"],
     ["Data retention rules","7 years"]]},
  {id:"audit", group:"GOVERNANCE", title:"Audit log", icon:"audit", tint:"#9d8cf5",
   blurb:"A locked history of who changed what. Searchable, exportable, never editable.",
   tags:["Append-only","7-year retention"],
   footer:"Nobody can edit or delete entries", action:"Export",
   listLabel:"WHAT IS RECORDED",
   rows:[["Permission changes","41 this month"],["Employee access","118"],["Data exports","9"],
     ["Integration changes","6"],["Agent actions","2,140"],["Deleted records","3"],["Admin changes","27"]]},
  {id:"datamgmt", group:"GOVERNANCE", title:"Data management", icon:"data", tint:"#5fe0a8",
   blurb:"Import, export, restore and, carefully, delete.",
   tags:["Backup 02:00","30-day restore"],
   footer:"Last backup completed 02:00 today", action:"Run backup",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Import data","CSV, Sage, HubSpot"],["Export data","full or per module"],["Backup status","healthy · 02:00 daily"],
     ["Restore previous versions","30 days available"],["Merge records","74 candidates"],
     ["Data retention","7 years"],["Delete company data","requires two admins"]]},

  {id:"brand", group:"EXPERIENCE", title:"Branding", icon:"brand", tint:"var(--accent)",
   blurb:"Logo, accent colour, templates and how agents appear.",
   tags:["Lime accent","2 templates"],
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Company logo","signs-asap-logo-white.png"],["Pulse accent colour","oklch(0.86 0.19 118)"],
     ["Email templates","3"],["Document templates","2"],["Agent appearance","12 faces · 6 shells"],
     ["Customer-facing portal branding","on", true]]},
  {id:"appearance", group:"EXPERIENCE", title:"Appearance & themes", icon:"brand", tint:"#6ad0f0",
   blurb:"Pick a light or dark theme for how Pulse looks to you.",
   tags:["8 themes","4 dark","4 light"],
   listLabel:"THEMES", rows:[]}
];

const ADMIN_GROUPS = [
  ["ORGANISATION", "repeat(3,1fr)"],
  ["CONTROL", "repeat(3,1fr)"],
  ["SYSTEMS", "repeat(3,1fr)"],
  ["GOVERNANCE", "repeat(3,1fr)"],
  ["EXPERIENCE", "repeat(3,1fr)"]
];

/* ---- activity feeds ---- */
const SRC_TINT = {Email:"#f07a9d", Pulse:"var(--accent)", Accounts:"#6ad0f0", Phone:"#5fe0a8", Agent:"var(--accent)"};
const SRC_ABBR = {Email:"EM", Pulse:"PL", Accounts:"AC", Phone:"PH", Agent:"AI"};

const DATA_EVENTS = [
  ["Tender pack received","College Campus Directory Signage, 46 pages, landed in Tender Inbox.","Email intake (mock)","TND-034","Email","completed"],
  ["Enquiry captured","Website form: green cross LED and window graphics.","Website form","Donabate Pharmacy","Pulse","completed"],
  ["Survey photos synced","4 photos and 5 tagged obstacles filed against the job.","Owner's phone","JOB-26043","Pulse","completed"],
  ["Proof uploaded","Celbridge CU proof v3 attached to the job and sent for sign-off.","Conor Hayes","JOB-26043","Pulse","completed"],
  ["Supplier file imported","Composite panel price list refreshed in the cost assumptions.","Supplier import (mock)","Quote Builder","Pulse","completed"],
  ["Payment recorded","Swords accountancy prepayment matched to JOB-26042 (demo ledger).","Accounts package (mock)","JOB-26042","Accounts","completed"],
  ["Enquiry captured","Phone call: reception wall logo to match the new fascia.","Phone","Swords Accountancy","Pulse","completed"],
  ["Material ETA missing","Fabricated letters from Poland still have no carrier tracking.","Supplier alert","JOB-26045","Pulse","failed"]
];

const PEOPLE_EVENTS = [
  ["Liam started LED assembly","Swords accountancy fascia moved to assembly & wiring.","Liam Kelly","JOB-26042","Pulse","completed"],
  ["Niamh started batch B","Fleet batch B (4 vans) printing and laminating.","Niamh Doyle","JOB-26044","Pulse","completed"],
  ["Mark passed QA","Fleet batch A: 6 of 15 vans handed back.","Mark Brennan","JOB-26044","Pulse","completed"],
  ["Owner moved the tender","College wayfinding €7,500 moved to procurement.","Managing Director","JOB-26041","Pulse","completed"],
  ["Aisling recorded a prepayment","Swords accountancy paid 100% upfront (demo).","Aisling Ryan","JOB-26042","Pulse","completed"],
  ["Conor sent proof v3","Celbridge CU: warm white, solid aluminium tray.","Conor Hayes","JOB-26043","Pulse","awaiting"],
  ["Material order raised","9 ACM sheets for college plaques, waiting on owner approval.","Mark Brennan","JOB-26041","Pulse","awaiting"],
  ["Crew asked to confirm","Kinsealy lightbox fit proposed for Thursday.","Managing Director","JOB-26056","Pulse","awaiting"]
];

const AI_EVENTS = [
  ["Proof Guardian held a release","Celbridge CU stays off the CNC until v3 is approved.","Proof Guardian","JOB-26043","Agent","working"],
  ["Tender Estimator counted a pack","144 plaques, 18 directional, 6 directories, 1 totem flagged.","Tender Estimator","TND-034","Agent","working"],
  ["Production Planner checked capacity","Print station heavy with fleet batch B; batch C slotted next week.","Production Planner","JOB-26044","Agent","working"],
  ["Quote Coach flagged a price","Rush Physio lightbox below the 38% floor; suggested €3,540.","Quote Coach","JOB-26050","Agent","awaiting"],
  ["Client Updates drafted a note","Swords accountancy progress note, waiting for owner review. Not sent.","Client Updates","JOB-26042","Agent","awaiting"],
  ["Ops Watchdog chased an ETA","Camile letters: no ETA from the Poland fabricator after 12 days.","Ops Watchdog","JOB-26045","Agent","failed"],
  ["Briefing posted the morning brief","17 open jobs, 3 proofs waiting, 2 material holds.","Briefing","Managing Director","Agent","completed"]
];

const STREAM_DEFS = [
  {id:"data", title:"New data", sub:"Enquiries, tenders, photos and files", pool:DATA_EVENTS, every:3200,
   tint:"#6ad0f0", icon:"M4.5 7.5c0-1.7 3.4-3 7.5-3s7.5 1.3 7.5 3-3.4 3-7.5 3-7.5-1.3-7.5-3Z M4.5 7.5v9c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-9 M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3"},
  {id:"people", title:"Team activity", sub:"What the workshop and office did", pool:PEOPLE_EVENTS, every:6400,
   tint:"#f0c04b", icon:"M12 12.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z M5 20.2c.9-3.1 3.6-4.9 7-4.9s6.1 1.8 7 4.9"},
  {id:"ai", title:"AI activity", sub:"Agents at work", pool:AI_EVENTS, every:4600,
   tint:"var(--accent)", icon:"M2 12h4l2.5-6 3.5 12 3-8 2 2h5"}
];

const NAV = [
  {label:"Home", icon:"helios", page:"Home"},
  {label:"Agents", icon:"navAgents", page:"Agents"},
  {label:"Sales & Quotes", icon:"navSales", page:"Sales"},
  {label:"Tender Desk", icon:"navTender", page:"Tenders", dot:true},
  {label:"Jobs", icon:"navJobs", page:"Jobs"},
  {divider:true, group:"OPERATIONS"},
  {label:"Production", icon:"navProd", page:"Production", dot:true},
  {label:"Installations", icon:"navInstall", page:"Installations"},
  {label:"Finance & Margins", icon:"navFinance", page:"Finance"},
  {divider:true, group:"SYSTEM"},
  {label:"Dashboard", icon:"navDash", page:"Dashboard"},
  {label:"Work", icon:"navWork", page:"Work"},
  {label:"Records", icon:"navRecords", page:"Records"},
  {label:"Activity", icon:"pulseLine", page:"Activity"}
];

/* Inbox items follow the real InboxItem shape: what happened, why it matters, what I can do. */
const ITEMS = {
  proof:{kind:"Approval", importance:"high", icon:ICONS.approvals, age:"17h",
    title:"Celbridge Credit Union proof v3",
    why:"Waiting on the branch's sign-off. Proof Guardian holds the CNC release until it is approved.",
    detail:"v3 moves the logo clear of the alarm bell, confirms warm white 3000K and upgrades to a solid aluminium tray (+€420 priced in).",
    actionLabel:"Review proof", secondaryLabel:"Request change", group:"Approvals",
    fields:[{k:"Job",v:"JOB-26043"},{k:"Designer",v:"Conor Hayes"},{k:"Version",v:"v3"},{k:"Blocks",v:"CNC slot"}],
    history:[{when:"Last working day 16:40",text:"Conor sent v3 for sign-off"},{when:"Today 09:05",text:"Proof Guardian held the CNC release"}]},
  mat:{kind:"Approval", importance:"high", icon:ICONS.approvals, age:"1d",
    title:"College plaque materials: 9 ACM sheets",
    why:"The €7,500 college job is in procurement and stock only covers 4 sheets.",
    detail:"Approving marks the order as placed in the demo. No supplier is contacted.",
    actionLabel:"Approve order", secondaryLabel:"Hold", group:"Approvals",
    fields:[{k:"Job",v:"JOB-26041"},{k:"Material",v:"M-203"},{k:"Value",v:"€495"},{k:"Raised by",v:"Mark Brennan"}],
    history:[{when:"Last working day",text:"Mark checked stock against the plaque schedule"}]},
  tender:{kind:"Task", importance:"high", icon:ICONS.records, age:"Today",
    title:"New tender pack: College Campus Directory",
    why:"46 pages, 6 floors, due in 8 business days.",
    detail:"Tender Estimator can extract quantities with page references. Nothing is priced firm without you.",
    actionLabel:"Open Tender Desk", secondaryLabel:"Later", group:"Work",
    fields:[{k:"Tender",v:"TND-034"},{k:"Pages",v:"46"},{k:"Floors",v:"6"},{k:"Agent",v:"Tender Estimator"}],
    history:[{when:"Today 07:52",text:"Pack received (mock inbox)"}]},
  fit:{kind:"Task", importance:"normal", icon:ICONS.visits, age:"Today",
    title:"Kinsealy lightbox fit needs a crew",
    why:"Proposed for Boyne Valley Fitters, not yet confirmed.",
    detail:"The lightbox and post sign passed QA and are ready to load.",
    actionLabel:"Confirm crew", secondaryLabel:"Reassign", group:"Work",
    fields:[{k:"Job",v:"JOB-26056"},{k:"Crew",v:"Boyne Valley Fitters"},{k:"Status",v:"proposed"},{k:"Access",v:"Roadside"}],
    history:[{when:"Last working day",text:"Mark proposed the Thursday slot"}]},
  quote:{kind:"Alert", importance:"normal", icon:ICONS.insights, age:"1d",
    title:"Rush Physio lightbox below margin floor",
    why:"36.5% against a 38% floor. Quote Coach suggests €3,540.",
    detail:"Your past lightboxes landed between 37.8% and 43%. Prices only change when you say so.",
    actionLabel:"Review quote", secondaryLabel:"Keep price", group:"Alerts",
    fields:[{k:"Job",v:"JOB-26050"},{k:"Quoted",v:"€3,450"},{k:"Cost",v:"€2,190"},{k:"Agent",v:"Quote Coach"}],
    history:[{when:"Last working day 11:05",text:"Quote Coach flagged the margin"}]}
};
const ORDER = ["proof","mat","tender","fit","quote"];

const ANSWERS = {
  credit:{tool:"core_search", effect:"read",
    text:"Three organisations are over their agreed limit this morning, and €41.2k of the balance is past 60 days. Northside Credit Hire is the one to act on: days-to-pay went from 12 to 74 since May while order volume held steady.",
    cols:["Organisation","Balance","Over","Oldest"],
    rows:[["Northside Credit Hire","€28,410","€8,410","74d"],["Balbriggan Pharmacy","€9,240","€2,240","63d"],["Portmarnock Dev.","€3,560","€560","61d"]],
    actions:[["Draft chase emails",1],["Open Northside Credit Hire",0]]},
  jobs:{tool:"core_tasks_find", effect:"read",
    text:"Eleven tasks are past their due date. Two slipped when a van was off the road; the others are waiting on stock. Swords carries seven of the eleven, well above its usual share.",
    cols:["Task","Subject","Late","Owner"],
    rows:[["Fleet batch B follow-up","Malahide Dental, Portmarnock","4d","M. Brennan"],["Fascia fit sign-off","Harbour View Homes","3d","L. Kelly"],["Banner reprint invoice","Lusk Montessori","2d","M. Brennan"]],
    actions:[["Reassign the two van tasks",1],["Open Work → Overdue",0]]},
  chase:{tool:"core_email_draft", effect:"write", confirm:true,
    confirmSummary:"Send one chase email to accounts (demo contact) referencing PAY-503 (€28,410, 74 days), offering two instalments to 30 September.",
    text:"Drafted. This is a write tool, so I have not sent it, the proposal is stored with a hash of the exact arguments, and confirming replays those stored arguments rather than anything from your yes.",
    actions:[["Confirm and send",1],["Edit draft",0]]},
  sync:{tool:"core_operations_health", effect:"read",
    text:"The Accounts package connection failed at 02:14 with an expired refresh token, last authorised 27 February. Nothing was lost: 148 invoices are queued and post once reconnected. This is the third token failure this year, so it is worth moving the connection to the service account.",
    actions:[["Open System health",1],["Assign to Aisling",0]]},
  visits:{tool:"site_visits_find", effect:"read",
    text:"Four site visits are booked this week and one has no fitter against it. That tool is contributed by the site-visits module, not core, installing the module is what gave me the ability to answer this.",
    cols:["Visit","Organisation","When","Status"],
    rows:[["Site survey","Harbour View Homes","Wed 09:00","scheduled"],["Survey","Malahide Dental","Wed 14:00","scheduled"],["Kinsealy fit","Swords","Thu 09:00","unassigned"]],
    actions:[["Assign the unassigned visit",1],["Open Site visits",0]]},
  fallback:{tool:"core_search", effect:"read",
    text:"I can answer that from the records you have access to. Everything I reach goes through a registered tool with a declared permission, there is no SQL tool, and a record you may not see comes back as not found rather than forbidden.",
    actions:[["Show me what you can do",0]]}
};

// Turns a plain-English filter name into a full dashboard area, the "primitive
// vibe-coding" bit: no real backend, just a seeded generator so the same phrase
// always produces the same numbers, with direction and vocabulary nudged by
// keywords in the text (expansion/growth trends up, risk/issue trends down, a
// region/cost/people/ops/customer word picks which metrics show).
function synthesizeCustomArea(name){
  const trimmed = (name || "").trim();
  if (!trimmed) return null;
  let seed = 0;
  for (let i = 0; i < trimmed.length; i++) seed = (seed * 31 + trimmed.charCodeAt(i)) >>> 0;
  const rnd = (n) => (((seed >>> (n % 24)) ^ (seed << ((n * 7) % 13))) >>> 0) % 997 / 997;
  const low = trimmed.toLowerCase();
  const has = (...words) => words.some(w => low.indexOf(w) > -1);
  const growth = has("expansion","growth","launch","scale","pilot","new site","open","opening","grow");
  const risk = has("risk","issue","delay","problem","complaint","fault","incident","churn","decline");
  const dir = risk ? -1 : (growth ? 1 : (rnd(2) > 0.45 ? 1 : -1));

  let vocab = "generic";
  if (has("scotland","ireland","wales","england","region","dublin","belfast","cork","galway","london","glasgow","edinburgh"))
    vocab = "region";
  else if (has("cost","spend","budget","saving","margin")) vocab = "cost";
  else if (has("staff","hiring","team","recruit","headcount")) vocab = "people";
  else if (has("supplier","stock","inventory","warehouse","fleet")) vocab = "ops";
  else if (has("customer","client","retention","account")) vocab = "customer";

  const V = {
    region:   {labels:["New enquiries","Orders won","Revenue","Site coverage"], unit:"EUR, 30 DAYS"},
    cost:     {labels:["Spend","Cost per job","Savings found","Budget used"], unit:"EUR, 30 DAYS"},
    people:   {labels:["Headcount","Open roles","Time to hire","Retention"], unit:"PEOPLE"},
    ops:      {labels:["Stock cover","Lead time","Stockouts","Reorders raised"], unit:"DAYS"},
    customer: {labels:["Active accounts","Repeat rate","Churn","NPS"], unit:"ACCOUNTS"},
    generic:  {labels:["Volume","Rate","Cost","Coverage"], unit:"ACTIVITY, 30 DAYS"}
  }[vocab];

  const months = ["Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug"];
  let v0 = 40 + Math.floor(rnd(1) * 220);
  const chart = months.map((m, i) => {
    v0 = Math.max(8, Math.round(v0 * (1 + dir * (0.03 + rnd(i + 3) * 0.07))));
    return [m, v0, String(v0)];
  });
  const metrics = V.labels.map((label, i) => {
    const val = 20 + Math.floor(rnd(i + 5) * 400);
    const pct = 2 + Math.round(rnd(i + 9) * 18);
    const up = dir > 0 ? rnd(i + 12) > 0.25 : rnd(i + 12) > 0.7;
    const bars = [0,1,2,3,4,5,6,7,8].map(k => 0.3 + rnd(i * 3 + k) * 0.7);
    return [label, i === 1 ? pct + "%" : String(val), (up ? "+" : "\u2212") + pct + (i === 1 ? "pt" : "%"), up ? "up" : "down", "vs last month", bars];
  });
  const capName = trimmed.replace(/\b\w/g, c => c.toUpperCase());
  const split = [
    [capName + " \u2014 direct", String(Math.round(v0 * 0.5)), "48%", 1],
    ["Existing pipeline", String(Math.round(v0 * 0.3)), "31%", 0],
    ["Everything else", String(Math.round(v0 * 0.2)), "21%", 0]
  ];
  const table = [1,2,3].map(w => [capName + " \u2014 week " + w, String(20 + Math.floor(rnd(20 + w) * 200)),
    (dir > 0 ? "+" : "\u2212") + (3 + Math.floor(rnd(23 + w) * 14)) + "%", "Auto-tagged from records mentioning \u201c" + low + "\u201d"]);
  table.push(["Everything else", String(20 + Math.floor(rnd(30) * 200)), "\u2014", "Baseline"]);
  return {
    id: trimmed, label: capName, color: "var(--accent)", owner: "CUSTOM FILTER",
    description: "Generated from \u201c" + trimmed + "\u201d \u2014 a plain-English filter, not a registered metric set. Refine it and Pulse will tighten this up.",
    kind: "columns", chartTitle: capName + " over time", chartUnit: V.unit,
    chart, splitTitle: "Where \u201c" + low + "\u201d shows up", split,
    tableCols: ["Item","Value","Change","Note"], table,
    metrics, legend: [capName, "Pipeline", "Other"]
  };
}

function pickAnswer(q){
  const s = q.toLowerCase();
  if (/visit|site visit|fitter/.test(s)) return ANSWERS.visits;
  if (/chase|email|draft|send/.test(s)) return ANSWERS.chase;
  if (/credit|limit|debtor|owe|outstanding|northside/.test(s)) return ANSWERS.credit;
  if (/task|late|overdue|slip|work/.test(s)) return ANSWERS.jobs;
  if (/sync|accounts|integration|token|fail|broke|health/.test(s)) return ANSWERS.sync;
  return ANSWERS.fallback;
}

const ORGS = [
  ["Swords Accountancy Practice","Customer","€12,400","Prepaid 100%","in production"],
  ["Celbridge Credit Union","Customer","€8,650","Deposit invoiced","proof v3"],
  ["Window Manufacturer Fleet","Customer","€28,500","Batch A invoiced","6/15 vans"],
  ["Camile (franchise)","Customer","€6,800","50% deposit","waiting materials"],
  ["Portmarnock Residential Development","Customer","€2,450","Balance invoiced","completed"],
  ["Composite panel stockist","Supplier","n/a","n/a","active"]
];
const TEAMS = [
  ["Design","1 member","Conor Hayes","proofs:edit"],
  ["Workshop","3 members","Liam Kelly","work_orders:update"],
  ["Accounts","1 member","Aisling Ryan","payments:record"],
  ["Management","1 member","Managing Director","all permissions"]
];
const LOCATIONS = [
  ["Workshop & office","Unit 4, N1 Business Park, Swords","5 staff","active"]
];

const AGENT_DEFS = [
  {id:"briefing", name:"Briefing", shape:"crown-pebble", tint:"#2a1d10", state:"complete", role:"Reads the whole business every morning and tells you what matters, wherever you are",
   when:"08:02", preview:"17 open jobs. tender €7,500 in procurement. fleet 6/15.",
   thread:[
     {kind:"stamp", text:"Today 08:00"},
     {kind:"routine", text:"Ran routine", routine:"Morning briefing"},
     {kind:"agent", text:"morning briefing for Signs ASAP:", lines:[
       {k:"Jobs", v:"17 open · 3 proofs waiting · 4 in the workshop · 2 material holds"},
       {k:"Tender", v:"College wayfinding €7,500 moved to procurement"},
       {k:"Fleet", v:"6/15 vans complete · 4 on the board · 5 waiting for a slot"}]},
     {kind:"agent", text:"the Swords accountancy rebrand is in production and fully paid. Celbridge Credit Union is waiting on proof v3, so don't release it to the CNC. two decisions need you: the CU proof and the college materials order."},
     {kind:"user", text:"remind me about the cu proof at 2"},
     {kind:"agent", text:"done. i'll nudge you at 14:00 and again tomorrow's briefing if the branch hasn't signed."}
   ]},
  {id:"watchdog", name:"Ops Watchdog", shape:"shield", tint:"#2b1b1e", state:"attention", role:"Flags unapproved proofs, material delays, deadlines at risk and capacity conflicts",
   when:"09:05", preview:"held the CU CNC release. camile ETA still missing.",
   thread:[
     {kind:"stamp", text:"Today 08:15"},
     {kind:"agent", text:"Camile fabricated letters: still no ETA from the Poland partner after 12 business days. the fit is pencilled for the following week, so there's slack, but i'd chase for a tracking number today."},
     {kind:"stamp", text:"Today 09:05"},
     {kind:"agent", text:"someone opened the Celbridge CU tray file on the CNC queue. proof v3 isn't approved, so i've held it. nothing else is out of line: the rest of the board is healthy."},
     {kind:"user", text:"good, keep it held"},
     {kind:"agent", text:"held. it releases automatically to Liam's queue the moment v3 is signed off."}
   ]},
  {id:"tender", name:"Tender Estimator", shape:"control-cube", tint:"#14232a", state:"waiting", role:"Turns a tender pack into counted quantities with page references and a costing draft for you to check",
   when:"07:55", preview:"new 46-page pack in. ready to extract.",
   thread:[
     {kind:"stamp", text:"Today 07:55"},
     {kind:"agent", text:"a new tender pack arrived: College Campus Directory Signage, 46 pages, 6 floors. i can count plaques, directional signs and directories floor by floor with page references, using the rates from the college job you won at €7,500."},
     {kind:"agent", text:"i won't firm-price anything the spec doesn't define. the entrance totem has no illumination or foundation detail, so it'll come through as a provisional sum for you to price."},
     {kind:"user", text:"how long did the last one take by hand"},
     {kind:"agent", text:"you said close to a day for a multi-floor pack. the extraction takes about a minute; checking my counts against the page references is the part that needs you."}
   ]},
  {id:"quotecoach", name:"Quote Coach", shape:"executive-capsule", tint:"#2a2118", state:"waiting", role:"Checks every quote against its cost build-up and your past jobs before it goes out",
   when:"Earlier", preview:"rush physio lightbox below the 38% floor.",
   thread:[
     {kind:"stamp", text:"Last working day 11:05"},
     {kind:"agent", text:"Rush Physio lightbox is quoted at €3,450 on €2,190 cost: 36.5% margin, under your 38% floor. your last two lightboxes came in at 43% and 37.8%."},
     {kind:"agent", text:"suggest €3,540 (38.1%). it's your call: i only suggest prices, i never change one."},
     {kind:"user", text:"what about the hoarding for harbour view"},
     {kind:"agent", text:"€3,900 on €1,610: 58.7%. in line with your past hoardings. printed boards are where the easy margin is."}
   ]},
  {id:"planner", name:"Production Planner", shape:"low-dome", tint:"#16241f", state:"working", role:"Predicts the CNC and print bottleneck and offers slots the workshop can actually make",
   when:"Mon", preview:"print station heavy with fleet batch B.",
   thread:[
     {kind:"stamp", text:"Monday 16:20"},
     {kind:"agent", text:"this week the wide-format printer carries fleet batch B (4 vans) plus the Donabate banners and the Swords window film. batch C (5 vans) goes next week rather than squeezed in."},
     {kind:"agent", text:"if Celbridge CU is approved this week, the CNC goes over capacity Thursday and Friday. i'd move the Donabate banners to Thursday's open printer slot rather than promise the CU a date we can't make."},
     {kind:"user", text:"do it if the cu gets approved"},
     {kind:"agent", text:"noted. i'll propose the move the moment v3 is signed off; you confirm it."}
   ]},
  {id:"proof", name:"Proof Guardian", shape:"rim-capsule", tint:"#1b2430", state:"working", role:"Checks the approved version, Pantone, dimensions, substrate and lighting before anything is built",
   when:"09:05", preview:"cu v3 awaiting sign-off. cnc held.",
   thread:[
     {kind:"stamp", text:"Today 09:05"},
     {kind:"agent", text:"Celbridge CU v3: Pantone 2945 C and 7409 C, warm white 3000K, solid aluminium tray (changed from Dibond in v2, +€420 priced in). dimensions 6.0 × 1.3 m are a demo example, not a measurement."},
     {kind:"agent", text:"v1 and v2 stay in the history. once v3 is approved it becomes the only version the workshop can build from; any later change opens a change request with the cost impact."},
     {kind:"user", text:"what's still open on proofs"},
     {kind:"agent", text:"three waiting: Celbridge CU v3, Northside Credit Hire v2 and Balbriggan Pharmacy v1. only the CU blocks a machine slot."}
   ]},
  {id:"updates", name:"Client Updates", shape:"offset-pebble", tint:"#191c1f", state:"waiting", role:"Drafts short progress notes for customers. Never sends: every note waits for you",
   when:"09:45", preview:"swords accountancy note drafted. not sent.",
   thread:[
     {kind:"stamp", text:"Today 09:45"},
     {kind:"agent", text:"drafted for Swords Accountancy: \"Your new fascia is being wired in our workshop this week. Window graphics print on Thursday and the fit is booked with an access crew early next week. We'll confirm the morning before.\""},
     {kind:"agent", text:"it's parked for your review. nothing is sent from this demo."},
     {kind:"user", text:"and the fleet customer"},
     {kind:"agent", text:"drafted too: 6 of 15 vans done, 4 in the workshop this week, the last 5 booked for next week. waiting for you."}
   ]}
];

const KPI_DEFS = {
  open:{label:"Open jobs", value:"17", delta:"18 seeded", dir:"up", hint:"see src/signs/kpis.ts", hero:true}
};

const ASPECT_DEFS = [
  {id:"sales", label:"Sales", color:"var(--accent)", owner:"NIAMH DOYLE", description:"Repeat accounts, new enquiries and quotes out the door.",
   kind:"columns", chartTitle:"Revenue by month", chartUnit:"EUR",
   chart:[["Sep",288,"€0k"],["Oct",301,"€0k"],["Nov",352,"€0k"],["Dec",376,"€0k"],["Jan",268,"€0k"],["Feb",294,"€0k"],["Mar",318,"€0k"],["Apr",341,"€0k"],["May",362,"€0k"],["Jun",384,"€0k"],["Jul",398,"€0k"],["Aug",413,"€0k"]],
   splitTitle:"Where it came from",
   split:[["Repeat accounts","€214.6k","72%",1],["Contract accounts","€156.8k","53%",0],["Online orders","€41.4k","18%",0]],
   tableCols:["Account","Revenue","Change","Owner"],
   table:[["Harbour View Homes","€48,210","+12.4%","Niamh Doyle"],["Northside Credit Hire","€28,410","−18.2%","Aisling Ryan"],["Balbriggan Pharmacy","€21,860","+4.1%","Niamh Doyle"],["Portmarnock Residential Development","€18,240","+9.6%","Liam Kelly"]],
   metrics:[["Revenue","€412,800","+6.2%","up","30 days",[.4,.55,.44,.62,.5,.7,.6,.78,1]],
     ["Orders","318","+22","up","30 days",[.5,.6,.44,.7,.55,.75,.62,.8,.9]],
     ["Average order","€1,298","+1.8%","up","vs last month",[.6,.58,.62,.6,.66,.64,.7,.68,.74]],
     ["Quotes won","41%","−3pt","down","conversion",[.7,.66,.7,.6,.62,.55,.58,.5,.48]]]},
  {id:"development", label:"Development", color:"#9fd6f0", owner:"LIAM KELLY", description:"Modules shipped into the client build and what they contributed.",
   kind:"rows", rows:[["approval routing","412 runs",412],["overdue reminder","308 runs",308],["visit escalation","286 runs",286],["accounts sync","198 runs",198],["briefing job","80 runs",80]], chartTitle:"Runs by automation", chartUnit:"RUNS · 30 DAYS",
   chart:[["Sep",620,"620"],["Oct",684,"684"],["Nov",712,"712"],["Dec",760,"760"],["Jan",802,"802"],["Feb",864,"864"],["Mar",918,"918"],["Apr",986,"986"],["May",1042,"1042"],["Jun",1128,"1128"],["Jul",1204,"1204"],["Aug",1284,"1284"]],
   splitTitle:"Runs by module",
   split:[["core","1,042","81%",1],["site-visits","198","15%",0],["ui-showcase","44","4%",0]],
   tableCols:["Module","Version","Contributions","State"],
   table:[["core","0.1.0","31 routes · 21 events","always installed"],["site-visits","1.0.0","1 entity · 2 tools","installed"],["ui-showcase","0.1.0","3 pages","installed"],["wholesale","-","6 entities · 9 tools","available"]],
   metrics:[["Modules live","3","+1","up","this quarter",[.2,.2,.4,.4,.4,.6,.6,.6,1]],
     ["Helios tools","11","+2","up","registered",[.4,.44,.5,.5,.6,.6,.7,.8,.9]],
     ["Automation runs","1,284","+9%","up","30 days",[.5,.55,.6,.58,.66,.7,.72,.8,.86]],
     ["Failure rate","0.9%","−0.4pt","up","of all runs",[.8,.74,.7,.62,.6,.5,.44,.4,.32]]]},
  {id:"marketing", label:"Marketing", color:"#e6c78a", owner:"AISLING RYAN", description:"Reach, enquiries and what turned into an account.",
   kind:"funnel", funnel:[["Enquiries","184","-",184],["Quoted","96","52% of enquiries",96],["Won","39","41% of quotes",39],["Repeat order","12","31% of wins",12]], chartTitle:"Enquiry to repeat order", chartUnit:"CONVERSION",
   chart:[["Sep",96,"96"],["Oct",104,"104"],["Nov",88,"88"],["Dec",112,"112"],["Jan",124,"124"],["Feb",118,"118"],["Mar",136,"136"],["Apr",142,"142"],["May",151,"151"],["Jun",164,"164"],["Jul",172,"172"],["Aug",184,"184"]],
   splitTitle:"Where they came from",
   split:[["Referral","78","42%",1],["Search","61","33%",0],["Trade shows","29","16%",0],["Direct","16","9%",0]],
   tableCols:["Channel","Enquiries","Change","Cost each"],
   table:[["Referral","78","+18.2%","€0.00"],["Search","61","+9.4%","€24.60"],["Trade shows","29","−6.1%","€41.20"],["Direct","16","+2.0%","€0.00"]],
   metrics:[["Enquiries","184","+31","up","30 days",[.3,.4,.36,.5,.46,.6,.58,.7,.86]],
     ["New accounts","12","+4","up","opened",[.2,.3,.24,.4,.36,.5,.44,.6,.7]],
     ["Cost per enquiry","€18.40","−€2.10","up","blended",[.8,.76,.7,.66,.6,.56,.5,.46,.4]],
     ["Repeat rate","68%","+3pt","up","ordering again",[.5,.54,.58,.56,.62,.64,.66,.7,.74]]]},
  {id:"operations", label:"Operations", color:"#dcded6", owner:"MARK BRENNAN", description:"Fitters, vans, site visits and the work queue.",
   kind:"stacked", legend:["Head office","Swords workshop","Fitting partners"], stacked:[["Sep",[34,28,9]],["Oct",[36,30,9]],["Nov",[39,32,10]],["Dec",[37,31,10]],["Jan",[32,27,8]],["Feb",[35,29,9]],["Mar",[40,33,10]],["Apr",[43,35,11]],["May",[46,37,12]],["Jun",[49,39,12]],["Jul",[52,42,13]],["Aug",[64,48,14]]], chartTitle:"Jobs completed by month", chartUnit:"JOBS",
   chart:[["Sep",88,"88"],["Oct",94,"94"],["Nov",102,"102"],["Dec",96,"96"],["Jan",84,"84"],["Feb",91,"91"],["Mar",104,"104"],["Apr",112,"112"],["May",118,"118"],["Jun",121,"121"],["Jul",124,"124"],["Aug",126,"126"]],
   splitTitle:"By location",
   split:[["Head office","64","51%",1],["Swords workshop","48","38%",0],["Fitting partners","14","11%",0]],
   tableCols:["Fitter","Jobs","On time","Location"],
   table:[["Mark Brennan","41","94%","Swords"],["Liam Kelly","34","88%","Head office"],["Niamh Doyle","28","96%","Head office"],["Unassigned","4","-","Swords"]],
   metrics:[["Jobs completed","126","+4","up","30 days",[.5,.6,.5,.66,.6,.7,.66,.76,.84]],
     ["Overdue tasks","11","+3","down","past due",[.3,.36,.3,.44,.4,.5,.56,.7,.85]],
     ["Visits completed","38","+11%","up","30 days",[.4,.5,.6,.5,.66,.6,.72,.8,.9]],
     ["Fitter hours","84%","−2pt","down","billable",[.8,.78,.8,.76,.78,.74,.76,.72,.7]]]},
  {id:"finance", label:"Finance", color:"#7fd8a4", owner:"AISLING RYAN", description:"Cash in, debt ageing and margin after cost.",
   kind:"area", chartTitle:"Cash collected by month", chartUnit:"EUR",
   chart:[["Sep",252,"€0k"],["Oct",268,"€0k"],["Nov",296,"€0k"],["Dec",318,"€0k"],["Jan",246,"€0k"],["Feb",264,"€0k"],["Mar",288,"€0k"],["Apr",306,"€0k"],["May",324,"€0k"],["Jun",342,"€0k"],["Jul",358,"€0k"],["Aug",368,"€0k"]],
   splitTitle:"Debt by age",
   split:[["0-30 days","€184.2k","61%",1],["31-60 days","€82.4k","27%",0],["61-90 days","€28.6k","9%",0],["90 days plus","€12.6k","4%",0]],
   tableCols:["Account","Balance","Change","Oldest"],
   table:[["Northside Credit Hire","€28,410","+42.0%","74 days"],["Balbriggan Pharmacy","€9,240","+11.2%","63 days"],["Portmarnock Residential Development","€3,560","−4.4%","61 days"],["Feltrim Auto Services","€1,180","−22.0%","8 days"]],
   metrics:[["Cash collected","€368,140","+4.1%","up","30 days",[.5,.56,.5,.62,.58,.68,.66,.74,.8]],
     ["Overdue debt","€41,200","+€8,410","down","60 days plus",[.3,.34,.4,.38,.46,.5,.6,.7,.84]],
     ["Gross margin","31.4%","−0.6pt","down","vs last month",[.7,.72,.7,.68,.68,.66,.64,.62,.6]],
     ["Days to pay","38","+6","down","weighted",[.4,.44,.42,.5,.52,.6,.62,.7,.76]]]},
  {id:"support", label:"Support", color:"#e2705c", owner:"NIAMH DOYLE", description:"Callbacks, warranty work and what came back twice.",
   kind:"dots", target:12, targetLabel:"Target: 12 callbacks a month or fewer", chartTitle:"Callbacks by month", chartUnit:"COUNT",
   chart:[["Sep",18,"18"],["Oct",16,"16"],["Nov",21,"21"],["Dec",19,"19"],["Jan",24,"24"],["Feb",22,"22"],["Mar",17,"17"],["Apr",15,"15"],["May",14,"14"],["Jun",12,"12"],["Jul",9,"9"],["Aug",7,"7"]],
   splitTitle:"By cause",
   split:[["Install fault","3","43%",1],["Part failure","2","29%",0],["User error","2","28%",0]],
   tableCols:["Site","Callbacks","First-visit fix","Cost"],
   table:[["Malahide Dental, Portmarnock","2","50%","€840"],["Harbour View Homes","2","100%","€410"],["Balbriggan Pharmacy","2","100%","€1,240"],["Lusk Montessori","1","100%","€650"]],
   metrics:[["Open callbacks","7","−2","up","live",[.6,.58,.54,.5,.48,.44,.4,.38,.34]],
     ["First-visit fix","82%","+4pt","up","of callbacks",[.5,.54,.56,.6,.6,.66,.7,.74,.8]],
     ["Warranty cost","€3,140","−€420","up","30 days",[.7,.66,.62,.6,.54,.5,.46,.44,.4]],
     ["Repeat faults","3","−1","up","same site",[.5,.5,.46,.4,.4,.36,.3,.3,.26]]]}
];

const FILTER_GROUPS = [
  {title:"AREA", items:["Sales","Development","Marketing","Operations","Finance","Support"]},
  {title:"SPINE", items:["Location","Team","Person","Organisation","Module"]},
  {title:"TIME", items:["This week","This month","This quarter","Year to date"]}
];

const OPS_DEFS = [
  {id:"o1", name:"Weekly management report", kind:"report", owner:"Chief of Staff", ownerKind:"agent", initials:"CS",
   trigger:"Mon, 08:00", triggerKind:"schedule", next:"3 days", last:"Sent to 4 people", status:"healthy", rate:98, on:true,
   what:"Pulls last week's numbers from every area, writes the commentary and sends one page to the management team before Monday's meeting.",
   why:"The meeting used to start with twenty minutes of people reading numbers off their own screens.",
   saved:"6 hours a month",
   steps:[["Trigger","Every Monday at 08:00"],["Find","Last week's metrics across all six areas"],["Check","Flag anything moving more than 10%"],["Draft","Write the one-page commentary"],["Send","Email the management team"],["Update","File the report against the week"]],
   runs:[["Mon 08:00","1m 12s","ok","4 recipients","€0.04"],["Mon 25 Aug 08:00","1m 04s","ok","4 recipients","€0.04"],["Mon 18 Aug 08:00","58s","ok","4 recipients","€0.03"]]},
  {id:"o2", name:"Chase unpaid invoices", kind:"automation", owner:"Finance Agent", ownerKind:"agent", initials:"FA",
   trigger:"Daily, 09:00", triggerKind:"schedule", next:"Tomorrow", last:"3 drafts waiting", status:"approval", rate:94, on:true,
   what:"Finds invoices past 14 days, excludes anything disputed, drafts a reminder in your tone and parks it for the finance manager.",
   why:"Chasing was happening in bursts, so the oldest debt got the least attention.",
   saved:"11 hours a month",
   steps:[["Trigger","Every weekday at 09:00"],["Find","Unpaid invoices older than 14 days"],["Check","Exclude disputed invoices"],["Draft","Create personalised reminders"],["Approval","Finance manager reviews","gate"],["Send","Email the customer"],["Update","Record the activity in Pulse"]],
   runs:[["Today 09:00","42s","partial","3 of 7 drafted","€0.02","4 organisations have no billing email"],["Yesterday 09:00","51s","ok","6 sent","€0.03"],["Mon 09:00","47s","ok","5 sent","€0.03"]]},
  {id:"o3", name:"New enquiry follow-up", kind:"automation", owner:"Sales Agent", ownerKind:"agent", initials:"SA",
   trigger:"New lead created", triggerKind:"event", next:"Event-based", last:"11 followed up today", status:"healthy", rate:99, on:true,
   what:"Answers a new enquiry within minutes, asks the two questions the office always needs, and creates the quote task.",
   why:"Enquiries arriving after 5pm were sitting until the next morning.",
   saved:"14 hours a month",
   steps:[["Trigger","A lead is created in Pulse"],["Find","Match against existing organisations"],["Draft","Write the first reply"],["Send","Email the enquiry"],["Update","Create a quote task for the counter"]],
   runs:[["Today 16:20","6s","ok","1 lead","€0.01"],["Today 15:02","7s","ok","1 lead","€0.01"],["Today 11:48","6s","ok","1 lead","€0.01"]]},
  {id:"o4", name:"Certificate renewal reminder", kind:"routine", owner:"Operations", ownerKind:"person", initials:"TW",
   trigger:"60 days before expiry", triggerKind:"event", next:"14:20", last:"Failed, missing contact", status:"failed", rate:71, on:true,
   what:"Watches every fitter certificate and insurance document, and gives sixty days' notice before one lapses.",
   why:"A lapsed certificate stopped two jobs last year.",
   saved:"3 hours a month",
   steps:[["Trigger","60 days before a document expires"],["Find","The owner of the certificate"],["Check","Has a renewal already been booked?"],["Send","Notify the owner and Operations"],["Update","Create the renewal task"]],
   runs:[["Today 14:20","3s","failed","0 of 2","€0.00","No contact on file for Fitting partners"],["Yesterday 14:20","4s","failed","0 of 1","€0.00","No contact on file for Fitting partners"],["Fri 14:20","5s","ok","1 notified","€0.01"]]},
  {id:"o5", name:"Morning briefing", kind:"routine", owner:"Briefing Agent", ownerKind:"agent", initials:"BR",
   trigger:"Weekdays, 07:00", triggerKind:"schedule", next:"Tomorrow", last:"Delivered 07:02", status:"healthy", rate:100, on:true,
   what:"Reads the whole business overnight and tells you the two things that actually need you.",
   why:"You were opening six screens before your first coffee.",
   saved:"9 hours a month",
   steps:[["Trigger","Every weekday at 07:00"],["Find","Overnight changes across cash, work and approvals"],["Check","Drop anything already handled"],["Draft","Write the briefing"],["Send","Post to Home and WhatsApp"]],
   runs:[["Today 07:00","22s","ok","1 briefing","€0.02"],["Yesterday 07:00","19s","ok","1 briefing","€0.02"],["Mon 07:00","24s","ok","1 briefing","€0.02"]]},
  {id:"o6", name:"Weekly vinyl & board stock check", kind:"task", owner:"Ops Watchdog", ownerKind:"agent", initials:"SW",
   trigger:"Thursdays, 09:00", triggerKind:"schedule", next:"Thu 09:00", last:"2 lines flagged", status:"healthy", rate:96, on:true,
   what:"Compares reorder points against what the week's jobs need and raises the purchase order lines.",
   why:"Two jobs were rescheduled in June for parts nobody had ordered.",
   saved:"5 hours a month",
   steps:[["Trigger","Every Thursday at 09:00"],["Find","Lines below reorder point"],["Check","What this week's jobs need"],["Approval","Buyer confirms the order","gate"],["Update","Raise the purchase order"]],
   runs:[["Thu 09:00","31s","ok","2 lines","€0.02"],["Thu 21 Aug 09:00","28s","ok","1 line","€0.02"]]},
  {id:"o7", name:"Accounts package sync (planned)", kind:"automation", owner:"Ops Watchdog", ownerKind:"agent", initials:"OW",
   trigger:"Hourly", triggerKind:"schedule", next:"Paused", last:"Token expired", status:"failed", rate:62, on:false,
   what:"Posts every finalised invoice into Accounts package and reconciles what came back.",
   why:"Manual re-entry was the single biggest source of mismatched invoices.",
   saved:"18 hours a month",
   steps:[["Trigger","Every hour"],["Find","Invoices not yet in Accounts package"],["Send","Post to Accounts package","external"],["Check","Reconcile what came back"],["Update","Mark them synced"]],
   runs:[["Today 02:14","1.2s","failed","0 of 148","€0.00","invalid_grant: refresh token expired 27 February"],["Today 01:14","1.1s","failed","0 of 141","€0.00","invalid_grant: refresh token expired 27 February"],["Yesterday 23:14","4s","ok","12 posted","€0.01"]]},
  {id:"o8", name:"Weekend on-call handover", kind:"routine", owner:"Chief of Staff", ownerKind:"agent", initials:"CS",
   trigger:"Fri, 16:30", triggerKind:"schedule", next:"Fri 16:30", last:"Sent to 3 people", status:"healthy", rate:97, on:true,
   what:"Writes the weekend handover: open jobs, who is on call, and anything a customer is waiting on.",
   why:"Weekend calls were being answered by whoever picked up, with no context.",
   saved:"4 hours a month",
   steps:[["Trigger","Every Friday at 16:30"],["Find","Open jobs and unanswered customers"],["Draft","Write the handover note"],["Send","WhatsApp the on-call rota"]],
   runs:[["Fri 16:30","18s","ok","3 recipients","€0.02"],["Fri 15 Aug 16:30","21s","ok","3 recipients","€0.02"]]},
  {id:"o9", name:"Timesheet reminder", kind:"task", owner:"Operations", ownerKind:"person", initials:"TW",
   trigger:"Fri, 15:00", triggerKind:"schedule", next:"Fri 15:00", last:"9 of 12 submitted", status:"approval", rate:88, on:true,
   what:"Nudges anyone who has not filed hours, then sends Operations the list still outstanding.",
   why:"Payroll was chasing the same four people every week.",
   saved:"3 hours a month",
   steps:[["Trigger","Every Friday at 15:00"],["Find","Staff with no hours filed"],["Send","Remind each person"],["Approval","Operations signs off the week","gate"]],
   runs:[["Fri 15:00","12s","partial","9 of 12","€0.01"],["Fri 15 Aug 15:00","11s","ok","12 of 12","€0.01"]]},
  {id:"o10", name:"Overnight backup check", kind:"automation", owner:"Ops Watchdog", ownerKind:"agent", initials:"OW",
   trigger:"Daily, 03:00", triggerKind:"schedule", next:"Tonight", last:"All systems clean", status:"healthy", rate:100, on:true,
   what:"Confirms every nightly backup completed and the restore test passed, and raises an alert if not.",
   why:"A failed backup went unnoticed for eleven days in January.",
   saved:"2 hours a month",
   steps:[["Trigger","Every day at 03:00"],["Check","Every backup job completed"],["Check","Last restore test passed"],["Send","Alert only if something failed"]],
   runs:[["Today 03:00","8s","ok","6 jobs","€0.00"],["Yesterday 03:00","9s","ok","6 jobs","€0.00"]]},
  {id:"o11", name:"Month-end close pack", kind:"report", owner:"Finance Agent", ownerKind:"agent", initials:"FA",
   trigger:"1st, 07:00", triggerKind:"schedule", next:"1 Sep 07:00", last:"Delivered 1 Aug", status:"healthy", rate:95, on:true,
   what:"Assembles the close pack: aged debt, margin by area, cash position and the variance commentary.",
   why:"Close took three days of copying between spreadsheets.",
   saved:"16 hours a month",
   steps:[["Trigger","First of the month at 07:00"],["Find","Last month's ledger and margin data"],["Check","Reconcile against the bank"],["Draft","Write the variance commentary"],["Send","Email the pack to Finance"]],
   runs:[["1 Aug 07:00","3m 42s","ok","1 pack","€0.09"],["1 Jul 07:00","3m 51s","ok","1 pack","€0.09"]]}
];

const OPS_FILTERS = [
  ["all","All"], ["routine","Agent routines"], ["automation","Automations"],
  ["report","Scheduled reports"], ["task","Recurring tasks"], ["approval","Needs approval"], ["failed","Failed"]
];

const WORK_SECTIONS = [
  {id:"tasks", label:"Tasks", blurb:"Everything assigned to you or your team, in one permission-filtered list.",
   views:["All tasks","Due tasks","Review","Done"], filters:["Due date","Any status","Anyone","Any due date"]},
  {id:"approvals", label:"Approvals", blurb:"Requests and their steps. Every decision is written as the person who made it.",
   views:["Awaiting you","Awaiting others","Decided"], filters:["Raised date","Any value","Anyone"]},
  {id:"workflows", label:"Workflows", blurb:"Automations and agent routines, what runs on its own, and who owns it.",
   views:[], filters:[]},
  {id:"schedules", label:"Schedules", blurb:"The team calendar: when recurring work fires and what it costs the week.",
   views:[], filters:[]}
];

const WORK_TASKS = [
  {id:"w1", title:"Chase PAY-503, Northside Credit Hire", status:"In progress", priority:"High", who:"AN",
   due:"2d overdue", late:true, client:"Northside Credit Hire", day:"Today", mins:"25 mins", view:"Due tasks"},
  {id:"w2", title:"Rebalance fleet batch B across the week", status:"In progress", priority:"High", who:"MD",
   due:"Due today", late:false, client:"Swords workshop", day:"Today", mins:"50 mins", view:"Due tasks"},
  {id:"w3", title:"Approve purchase order M-203", status:"Review", priority:"Medium", who:"MD",
   due:"Due 12:00", late:false, client:"Composite panel stockist", day:"Today", mins:"15 mins", view:"Review"},
  {id:"w4", title:"Sign off monthly vinyl stocktake", status:"Not started", priority:"Medium", who:"SB",
   due:"No due date", late:false, client:"Head office", day:"Any day", mins:"Mins", view:"All tasks"},
  {id:"w5", title:"Second wide-format printer decision", status:"Not started", priority:"High", who:"MD",
   due:"Thursday", late:false, client:"Swords workshop", day:"Thu", mins:"1 hour", view:"All tasks"},
  {id:"w6", title:"VAT return, August", status:"Done", priority:"Medium", who:"AN",
   due:"Filed Friday", late:false, client:"Head office", day:"Fri", mins:"2 hours", view:"Done", done:true}
];

const WORKFLOWS = [
  {name:"Overdue invoice reminder", state:"live", trigger:"schedule · daily 08:00",
   actions:[["notify.email","write"],["tasks.create","write"]], lastRun:"Today 08:00",
   result:"6 of 10 sent · partial", resultKind:"warn", runSummary:"11 ok · 3 partial",
   runs:["ok","ok","partial","ok","ok","ok","partial","ok","ok","ok","ok","ok","partial","partial"]},
  {name:"Approval routing over €10k", state:"live", trigger:"event · core.approval.created",
   actions:[["approvals.route","read"],["notify.inbox","write"]], lastRun:"Today 08:54",
   result:"ok", resultKind:"ok", runSummary:"14 ok",
   runs:["ok","ok","ok","ok","ok","ok","ok","ok","ok","ok","ok","ok","ok","ok"]},
  {name:"Unassigned visit escalation", state:"live", trigger:"event · site-visits.visit.created",
   actions:[["notify.inbox","write"]], lastRun:"Today 07:00",
   result:"ok", resultKind:"ok", runSummary:"9 ok · 1 failed",
   runs:["idle","idle","ok","ok","failed","ok","ok","ok","idle","ok","ok","ok","ok","ok"]},
  {name:"Accounts package sync (planned)", state:"failing", trigger:"schedule · hourly",
   actions:[["accounts.read","external"]], lastRun:"Today 02:14",
   result:"invalid_grant · dead-lettered", resultKind:"bad", runSummary:"4 failed",
   runs:["ok","ok","ok","ok","ok","ok","ok","ok","ok","ok","failed","failed","failed","failed"]}
];

const SCHEDULES = [
  {id:"s1", name:"Morning briefing", cadence:"Every weekday · 07:00", next:"Tomorrow 07:00", owner:"Briefing agent", on:true, day:1},
  {id:"s2", name:"Overdue invoice reminder", cadence:"Daily · 08:00", next:"Tomorrow 08:00", owner:"Credit Control", on:true, day:1},
  {id:"s3", name:"Accounts package sync (planned)", cadence:"Hourly", next:"Paused", owner:"Ops Watchdog", on:false, day:0},
  {id:"s4", name:"Weekly vinyl & board stock check", cadence:"Thursdays · 09:00", next:"Thu 09:00", owner:"Ops Watchdog", on:true, day:3},
  {id:"s5", name:"Month-end close", cadence:"Last working day · 17:00", next:"Fri 17:00", owner:"Month-end close", on:true, day:4}
];

const WIDGET_DEFS = [["inbox","Action inbox"],["work","My work"],["activity","Activity"],["kpi","Today's numbers"],["visits","Site visits"]];
const WORK_WIDGETS = [
  {id:"queue", label:"My queue", value:"8", hint:"assigned to you", icon:"work", queue:"mine"},
  {id:"late", label:"Running late", value:"11", hint:"past their due date", icon:"health", queue:"overdue"},
  {id:"unassigned", label:"Unassigned", value:"1", hint:"nobody owns it yet", icon:"teams", queue:"unassigned"},
  {id:"week", label:"Next 7 days", value:"4", hint:"due this week", icon:"visits", queue:"upcoming"}
];
const PERSONALITIES = ["Straight-talking","Warm","Formal","Dry"];
const ANSWER_STYLES = ["Short answers","Show the working","Ask before acting"];
/* Every context source and every registered tool the agent could be granted -
   the builder shows the whole catalogue, grouped, rather than a sample. */
const CONTEXT_DEFS = [
  ["Organisations","records","Accounts, limits, payment behaviour"],
  ["People","records","Contacts and internal staff"],
  ["Files","records","Indexed documents and certificates"],
  ["Tasks","work","Queues, owners, due dates"],
  ["Site visits","work","Bookings, fitters, outcomes"],
  ["Approvals","work","What is waiting on a decision"],
  ["Invoices","money","Issued, paid, past due"],
  ["Quotes","money","Sent, accepted, expired"],
  ["Payments","money","Receipts and allocations"],
  ["Activity log","system","Every event, agent and human"],
  ["Modules","system","What this client has installed"],
  ["Insights","system","Saved metrics and trends"]
];
const CONTEXT_SOURCES = CONTEXT_DEFS.map(c => c[0]);
const SKILL_DEFS = [
  ["Search records","read"],["Summarise activity","read"],["Read invoices","read"],
  ["Read site visits","read"],["Check permissions","read"],
  ["Draft email","write"],["Create task","write"],["Update record","write"],
  ["Schedule visit","write"],["Raise approval","write"],
  ["Send email","external"],["Send WhatsApp","external"],["Post to Accounts package","external"],["Push to HubSpot","external"]
];
/* The two questions the agent asks back once it knows the job. */
const TRAIN_PHASES = [
  ["Reading the whole ontology", "4,820 records"],
  ["Learning how this business words things", "organisation → customer"],
  ["Researching the trade-supply domain", "12 sources"],
  ["Writing its own system prompt", "1,240 tokens"]
];
const BRIEF_QUESTIONS = [
  {title:"What should it cover?", sub:"Pick as many as you like, we can refine later.",
   options:[["Calendar","Meetings and what is coming up"],["Email","Unread and actionable inbox items"],
            ["Records","Accounts that moved since yesterday"],["Money","Cash, overdue and anything at risk"],
            ["Something else","Tell me in the next message"]]},
  {title:"When should it land?", sub:"One is enough to start.",
   options:[["Every morning 07:30","Before the yard opens"],["Weekdays 08:00","Monday to Friday only"],
            ["Only when something changes","Event-driven, no noise"],["On demand","When you ask for it"]]}
];
/* The words under a name, keyed to the same state the face lights with. */
const STATE_LABELS = {working:"working", thinking:"thinking", waiting:"waiting on you",
  complete:"up to date", attention:"needs you", idle:"idle"};

const FACE_SHAPES = [
  ["crown-pebble","Pebble"],["executive-capsule","Executive"],["shield","Shield"],
  ["glass-visor","Visor"],["control-cube","Control cube"],["low-dome","Low dome"],
  ["offset-pebble","Offset pebble"],["rim-capsule","Capsule"],["wide-eyed","Wide-eyed"],
  ["precision-brow","Precision brow"],["tall-unit","Tall unit"],["soft-asymmetric","Soft asymmetric"]
];
/* Shell colours only, deliberately desaturated so none of them reads as a
   state. Each is a pair: the deep shell for light themes and its pale partner
   for dark ones (the eyes take the other). The status light carries the state. */
const FACE_TINTS = [
  ["#191c1f","Graphite","#e3e6e8"],["#1b2430","Slate","#d3dde9"],["#241b2e","Aubergine","#ddd4ea"],
  ["#2a2118","Bronze","#eadccb"],["#16241f","Pine","#d1e4da"],["#2b1b1e","Oxblood","#eed5d7"]
];

/* ---- ontology graph: generation, Dijkstra traversal, canvas render ---- */
const CLUSTERS = [
  ["Customers",     "#f49313", 0.00, 0.62, 46],
  ["Jobs",          "#3fb0d6", 0.90, 0.70, 52],
  ["Proofs",        "#b06cf0", 1.75, 0.66, 58],
  ["Work orders",   "#fbbb17", 2.55, 0.72, 44],
  ["Payments",      "#f0567f", 3.35, 0.60, 38],
  ["Surveys",       "#5fe0a8", 4.15, 0.70, 40],
  ["Materials",     "#ea5a0c", 4.95, 0.64, 30],
  ["Install crews", "#5f7cf0", 5.65, 0.72, 34]
]

function mulberry(seed){
  return function(){
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* Hub-and-spoke clusters around a dense phyllotaxis core, in unit space
   (-1..1 on both axes) so the layout is resolution independent. */
const _hexCache = {};
function hexRGB(hex){
  if (_hexCache[hex]) return _hexCache[hex];
  const h = hex.replace("#", "");
  const v = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  _hexCache[hex] = v;
  return v;
}


function buildGraph(){
  const rnd = mulberry(20260902);
  const nodes = [], edges = [], adj = [];
  const add = (x, y, z, r, cluster, kind) => {
    nodes.push({x, y, z, r, cluster, kind}); adj.push([]); return nodes.length - 1;
  };
  const link = (a, b) => {
    const dx = nodes[a].x - nodes[b].x, dy = nodes[a].y - nodes[b].y, dz = nodes[a].z - nodes[b].z;
    const w = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.004;
    const id = edges.length;
    edges.push({a, b, w});
    adj[a].push([b, w, id]); adj[b].push([a, w, id]);
  };

  // the core is a filled sphere on a Fibonacci lattice, not a disc
  const CORE = 880, coreIds = [];
  for (let i = 0; i < CORE; i++){
    const t = (i + 0.5) / CORE;
    const phi = Math.acos(1 - 2 * t);
    const theta = i * 2.39996;
    const shell = 0.16 + 0.28 * Math.pow(rnd(), 0.5);
    const grade = rnd();
    coreIds.push(add(
      Math.sin(phi) * Math.cos(theta) * shell * 1.04,
      Math.cos(phi) * shell * 0.96,
      Math.sin(phi) * Math.sin(theta) * shell,
      grade < 0.06 ? 3.4 + rnd() * 1.4 : grade < 0.3 ? 2.1 + rnd() * 0.7 : 1.0 + rnd() * 0.8, 0, "core"));
  }
  // lattice neighbours plus a mesh of chords, so the sphere reads as a volume
  for (let i = 1; i < coreIds.length; i++){
    link(coreIds[i], coreIds[i - 1]);
    if (i >= 13) link(coreIds[i], coreIds[i - 13]);
    if (i >= 21 && i % 2 === 0) link(coreIds[i], coreIds[i - 21]);
    if (i >= 34 && i % 3 === 0) link(coreIds[i], coreIds[i - 34]);
    if (i >= 55 && i % 4 === 0) link(coreIds[i], coreIds[i - 55]);
    if (i >= 89 && i % 5 === 0) link(coreIds[i], coreIds[i - 89]);
    if (i % 6 === 0) link(coreIds[i], coreIds[Math.floor(rnd() * coreIds.length)]);
  }

  // a mid shell between the nucleus and the lobes: the layer that makes it
  // read as a network rather than a ball with satellites
  const MID = 560, midIds = [];
  for (let i = 0; i < MID; i++){
    const t = (i + 0.5) / MID;
    const phi = Math.acos(1 - 2 * t), theta = i * 2.39996 + 0.7;
    const d = 0.52 + 0.16 * Math.pow(rnd(), 0.6);
    const g2 = rnd();
    midIds.push(add(
      Math.sin(phi) * Math.cos(theta) * d * 1.02,
      Math.cos(phi) * d * 0.96,
      Math.sin(phi) * Math.sin(theta) * d,
      g2 < 0.05 ? 2.6 + rnd() * 1.0 : g2 < 0.3 ? 1.6 + rnd() * 0.6 : 0.8 + rnd() * 0.7, 0, "core"));
  }
  for (let i = 0; i < midIds.length; i++){
    if (i >= 1) link(midIds[i], midIds[i - 1]);
    if (i >= 17) link(midIds[i], midIds[i - 17]);
    if (i >= 29 && i % 2 === 0) link(midIds[i], midIds[i - 29]);
    // radial spokes tying the shell to the nucleus
    if (i % 2 === 0) link(midIds[i], coreIds[Math.floor(rnd() * coreIds.length)]);
    if (i % 9 === 0) link(midIds[i], coreIds[Math.floor(rnd() * coreIds.length)]);
  }

  // clusters ride a sphere: each hub gets its own latitude as well as longitude
  const hubs = [], clusterLeaves = [];
  const onSphere = (lon, lat, d0) => { const d = d0 * 1.22;
    return [Math.cos(lat) * Math.cos(lon) * d * 1.02, Math.sin(lat) * d * 0.96, Math.cos(lat) * Math.sin(lon) * d]; };
  CLUSTERS.forEach((c, ci) => {
    const [, , ang, dist, leaves] = c;
    const lat = (ci % 2 ? 1 : -1) * (0.26 + rnd() * 0.5);
    const wob = 1.06 + rnd() * 0.16;
    const hp = onSphere(ang, lat, dist * wob);
    const hub = add(hp[0], hp[1], hp[2], 5.4, ci, "hub");
    hubs.push(hub);
    const mine = [];
    clusterLeaves.push(mine);
    for (let k = 0; k < 3; k++) link(hub, coreIds[Math.floor(rnd() * coreIds.length)]);
    for (let k = 0; k < 5; k++) link(hub, midIds[Math.floor(rnd() * midIds.length)]);

    const subs = 5 + Math.floor(rnd() * 4);
    const subIds = [];
    for (let s = 0; s < subs; s++){
      const sa = ang + (rnd() - 0.5) * 0.52, sl = lat + (rnd() - 0.5) * 0.3;
      const sd = dist + 0.08 + rnd() * 0.18;
      const sp = onSphere(sa, sl, sd);
      const sub = add(sp[0], sp[1], sp[2], 3.2, ci, "sub");
      subIds.push(sub);
      link(sub, hub);
      if (s > 0 && rnd() < 0.7) link(sub, subIds[s - 1]);
      const fan = Math.floor((leaves * 7.4) / subs);
      const spread = 0.17 + rnd() * 0.2;
      let prev = -1;
      for (let l = 0; l < fan; l++){
        const la = sa + (rnd() - 0.5) * spread * 2 + (rnd() - 0.5) * 0.06;
        const ll = sl + (rnd() - 0.5) * spread * 1.1;
        const ld = sd + 0.03 + Math.pow(rnd(), 0.8) * 0.17;
        const lp = onSphere(la, ll, ld);
        const lg = rnd();
        const leaf = add(lp[0], lp[1], lp[2],
          lg < 0.08 ? 2.8 + rnd() * 1.2 : lg < 0.34 ? 1.8 + rnd() * 0.6 : 1.0 + rnd() * 0.7, ci, "leaf");
        link(leaf, sub);
        mine.push(leaf);
        if (rnd() < 0.14) link(leaf, hub);
        if (prev >= 0 && rnd() < 0.34) link(leaf, prev);
        if (rnd() < 0.16) link(leaf, midIds[Math.floor(rnd() * midIds.length)]);
        prev = leaf;
      }
    }
  });
  // far satellites hanging off the outer leaves
  CLUSTERS.forEach((c, ci) => {
    const [, , ang, dist] = c;
    for (let s = 0; s < 7; s++){
      const sa = ang + (rnd() - 0.5) * 1.5, sl = (rnd() - 0.5) * 1.3;
      const sd = dist + 0.42 + rnd() * 0.22;
      const ap = onSphere(sa, sl, sd);
      const anchor = add(ap[0], ap[1], ap[2], 2.4, ci, "sub");
      link(anchor, hubs[ci]);
      const n = 14 + Math.floor(rnd() * 18);
      for (let l = 0; l < n; l++){
        const la = sa + (rnd() - 0.5) * 0.9, ll = sl + (rnd() - 0.5) * 0.7;
        const ld = sd + 0.02 + Math.pow(rnd(), 0.8) * 0.18;
        const p = onSphere(la, ll, ld);
        const leaf = add(p[0], p[1], p[2], 0.8 + rnd() * 0.9, ci, "leaf");
        link(leaf, anchor);
        clusterLeaves[ci].push(leaf);
      }
    }
  });

  // two hub rings and long chords across the sphere
  hubs.forEach((h, i) => {
    link(h, hubs[(i + 1) % hubs.length]);
    link(h, hubs[(i + 2) % hubs.length]);
    if (i % 3 === 0) link(h, hubs[(i + 4) % hubs.length]);
  });
  // neighbouring clusters share records, so their leaves cross-link
  for (let ci = 0; ci < clusterLeaves.length; ci++){
    const a = clusterLeaves[ci], b = clusterLeaves[(ci + 1) % clusterLeaves.length];
    const n = 26 + Math.floor(rnd() * 16);
    for (let k = 0; k < n; k++){
      link(a[Math.floor(rnd() * a.length)], b[Math.floor(rnd() * b.length)]);
    }
    // and a good number reach right across to the far side
    for (let k = 0; k < 12; k++){
      const far = clusterLeaves[(ci + 3) % clusterLeaves.length];
      link(a[Math.floor(rnd() * a.length)], far[Math.floor(rnd() * far.length)]);
    }
    for (let k = 0; k < 8; k++){
      const far = clusterLeaves[(ci + 4) % clusterLeaves.length];
      link(a[Math.floor(rnd() * a.length)], far[Math.floor(rnd() * far.length)]);
    }
  }

  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9, minZ = 1e9, maxZ = -1e9;
  for (const n of nodes){
    if (n.x < minX) minX = n.x; if (n.x > maxX) maxX = n.x;
    if (n.y < minY) minY = n.y; if (n.y > maxY) maxY = n.y;
    if (n.z < minZ) minZ = n.z; if (n.z > maxZ) maxZ = n.z;
  }
  const bounds = {minX, maxX, minY, maxY, cx:(minX + maxX) / 2, cy:(minY + maxY) / 2,
    cz:(minZ + maxZ) / 2, w:maxX - minX, h:maxY - minY, d:maxZ - minZ,
    radius: Math.max(maxX - minX, maxY - minY, maxZ - minZ) / 2,
    reach: nodes.reduce((m, n) => Math.max(m, Math.sqrt(n.x * n.x + n.y * n.y + n.z * n.z)), 0)};
  return {nodes, edges, adj, hubs, coreIds, bounds};
}

export {
  INK,
  BODY,
  DIM,
  FAINT,
  LIME,
  GREEN,
  AMBER,
  RED,
  NEUTRAL,
  MONO,
  ICONS,
  REC_SECTIONS,
  CONTACTS,
  FILE_TREE,
  ONTO_NODES,
  ONTO_EDGES,
  REC_TEMPLATES,
  REC_TEMPLATE_CATS,
  PEOPLE,
  ROLE_LEVELS,
  PERM_KEYS,
  GRANT_DEFS,
  ROLE_SCOPES,
  DEFAULT_PERMS,
  INTEGRATIONS,
  BG_DEFS,
  THEMES,
  ADMIN_ICONS,
  ADMIN_CARDS,
  ADMIN_GROUPS,
  SRC_TINT,
  SRC_ABBR,
  DATA_EVENTS,
  PEOPLE_EVENTS,
  AI_EVENTS,
  STREAM_DEFS,
  NAV,
  ITEMS,
  ORDER,
  ANSWERS,
  synthesizeCustomArea,
  pickAnswer,
  ORGS,
  TEAMS,
  LOCATIONS,
  AGENT_DEFS,
  KPI_DEFS,
  ASPECT_DEFS,
  FILTER_GROUPS,
  OPS_DEFS,
  OPS_FILTERS,
  WORK_SECTIONS,
  WORK_TASKS,
  WORKFLOWS,
  SCHEDULES,
  WIDGET_DEFS,
  WORK_WIDGETS,
  PERSONALITIES,
  ANSWER_STYLES,
  CONTEXT_DEFS,
  CONTEXT_SOURCES,
  SKILL_DEFS,
  TRAIN_PHASES,
  BRIEF_QUESTIONS,
  STATE_LABELS,
  FACE_SHAPES,
  FACE_TINTS,
  CLUSTERS,
  mulberry,
  _hexCache,
  hexRGB,
  buildGraph
};
