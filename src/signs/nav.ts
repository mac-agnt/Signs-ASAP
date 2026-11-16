/* Top-bar tabs for every page. PulseLogic renders these as the context nav; the
   module views read the active tab with getTab(page, first tab id). */

export type TabDef = { id: string; label: string };
export const MODULE_TABS: Record<string, TabDef[]> = {
  Sales: [
    { id: "overview", label: "Overview" }, { id: "enquiries", label: "Enquiries" }, { id: "quotes", label: "Quotes" },
    { id: "builder", label: "Quote Builder" }, { id: "accounts", label: "Repeat Accounts" }, { id: "approvals", label: "Approvals" },
  ],
  Tenders: [
    { id: "inbox", label: "Tender Inbox" }, { id: "extract", label: "AI Extract" }, { id: "quantities", label: "Quantities" },
    { id: "costing", label: "Costing" }, { id: "review", label: "Submission Review" }, { id: "archive", label: "Archive" },
  ],
  Jobs: [
    { id: "live", label: "Live Jobs" }, { id: "pipeline", label: "Pipeline" }, { id: "surveys", label: "Site Surveys" },
    { id: "proofs", label: "Artwork & Proofs" }, { id: "handoffs", label: "Handoffs" }, { id: "calendar", label: "Job Calendar" },
  ],
  Production: [
    { id: "live", label: "Workshop Live" }, { id: "orders", label: "Work Orders" }, { id: "capacity", label: "Capacity" },
    { id: "materials", label: "Materials" }, { id: "qa", label: "Quality Checks" }, { id: "tv", label: "TV Mode" },
  ],
  Installations: [
    { id: "calendar", label: "Fitting Calendar" }, { id: "ready", label: "Ready for Fit" }, { id: "partners", label: "Fitter Partners" },
    { id: "packs", label: "Site Packs" }, { id: "completion", label: "Completion" },
  ],
  Finance: [
    { id: "overview", label: "Overview" }, { id: "profit", label: "Job Profit" }, { id: "qva", label: "Quote vs Actual" },
    { id: "deposits", label: "Deposits & Balances" }, { id: "intel", label: "Price Intelligence" },
  ],
  Agents: [
    { id: "overview", label: "Agent Overview" }, { id: "briefing", label: "Briefing" }, { id: "watchdog", label: "Ops Watchdog" },
    { id: "tender", label: "Tender Estimator" }, { id: "quotecoach", label: "Quote Coach" }, { id: "planner", label: "Production Planner" },
    { id: "proof", label: "Proof Guardian" }, { id: "updates", label: "Client Updates" },
  ],
  Dashboard: [
    { id: "executive", label: "Executive" }, { id: "sales", label: "Sales" }, { id: "workshop", label: "Workshop" }, { id: "margins", label: "Margins" },
  ],
  Work: [
    { id: "tasks", label: "My Tasks" }, { id: "approvals", label: "Approvals" }, { id: "week", label: "This Week" }, { id: "automation", label: "Automation Queue" },
  ],
  Activity: [
    { id: "feed", label: "Live Feed" }, { id: "byjob", label: "By Job" }, { id: "agents", label: "Agents & Automation" }, { id: "systems", label: "Systems" },
  ],
  Settings: [
    { id: "org", label: "Organisation" }, { id: "people", label: "People & Permissions" }, { id: "systems", label: "Systems & Integrations" },
    { id: "ai", label: "AI Controls" }, { id: "rules", label: "Workflow Rules" }, { id: "experience", label: "Experience" },
  ],
};

/** Pages whose body is a Signs ASAP module (rendered from src/signs/pages). */
export const MODULE_PAGES = ["Sales", "Tenders", "Jobs", "Production", "Installations", "Finance"];
export const firstTab = (page: string) => (MODULE_TABS[page] && MODULE_TABS[page][0] ? MODULE_TABS[page][0].id : "");
export const PAGE_TITLE: Record<string, string> = {
  Home: "Home", Agents: "Agents", Sales: "Sales & Quotes", Tenders: "Tender Desk", Jobs: "Jobs", Production: "Production",
  Installations: "Installations", Finance: "Finance & Margins", Dashboard: "Dashboard", Work: "Work", Records: "Records", Activity: "Activity", Settings: "Settings",
};
