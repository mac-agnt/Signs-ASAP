# Pulse · Signs ASAP

Frontend demo of Pulse v4 Glass (Harbour theme) tailored for **Signs ASAP** (Signs A.S.A.P. Limited, Swords, Co. Dublin). Everything runs in the browser on local mock data: no backend, no live integrations, nothing is sent.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
```

## Where things live

| Area | Where |
| --- | --- |
| Canonical demo data (jobs, tenders, proofs, work orders, payments...) | `src/signs/data.ts` |
| Live demo state, selectors, actions, localStorage persistence, reset | `src/signs/model.ts` |
| Demo clock (all dates relative to today, Mon-Fri) | `src/signs/dates.ts` |
| Top-bar tabs per page | `src/signs/nav.ts` |
| Module pages (Sales, Tender Desk, Jobs, Production, TV mode, Installations, Finance, Dashboard, Work, Records tabs, Activity tabs, Settings, Agent overview, job drawer) | `src/signs/pages/` |
| Home chat answers (deterministic, deep-linked) | `src/signs/answers.ts` |
| Home right rail (briefing, decisions, workshop) | `src/signs/HomeRail.tsx` |
| Signs ASAP skin (brand tokens from the official logo) | `src/styles/signs.css` |
| Pulse shell, rail, top bar, ontology, live feed, agent chat | `src/views/`, `src/logic/PulseLogic.js`, `src/logic/data.js` |

## Rules

- Read `CLAUDE.md` first: Home and Agents lead the rail, Records opens on Ontology, the Home centre column stays clean.
- Every number on screen is derived from `src/signs/data.ts` through `src/signs/model.ts`. Don't hardcode counts or totals in views.
- Figures other than the €7,500 college tender are illustrative demo values, labelled as such in the UI.
- "Reset demo" (bottom of the screen, and Settings → Experience) restores the canonical data.
- Don't run `npm run import-design` on this copy: it regenerates `src/views` and `src/logic` from the original template and wipes the client build.
