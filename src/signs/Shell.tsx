/* Glue between the Pulse shell and the Signs ASAP modules. */
import { useState } from "react";
import { useDemo, resetDemo } from "./model";
import { DEMO_BANNER } from "./data";
import TenderDesk from "./pages/TenderDesk";
import SalesQuotes from "./pages/SalesQuotes";
import Jobs from "./pages/Jobs";
import Production from "./pages/Production";
import Installations from "./pages/Installations";
import Finance from "./pages/Finance";
import JobDrawer from "./pages/JobDrawer";
import TvOverlay from "./pages/TvBoard";

const MODULES: Record<string, (p: { v: any }) => JSX.Element | null> = {
  Sales: SalesQuotes, Tenders: TenderDesk, Jobs, Production, Installations, Finance,
};

export function ModuleHost({ v, page }: { v: any; page: string }) {
  useDemo();
  const M = MODULES[page];
  if (!M) return null;
  return <div key={page} style={{ animation: "pageIn .5s var(--ease) both" }}><M v={v} /></div>;
}

export function DemoFlag() {
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="sa-demo-flag" role="note">
      <span>{DEMO_BANNER}</span>
      {confirm ? (
        <>
          <button type="button" onClick={() => { resetDemo(); setConfirm(false); }} style={{ color: "var(--accent)" }}>Confirm reset</button>
          <button type="button" onClick={() => setConfirm(false)}>Cancel</button>
        </>
      ) : (
        <button type="button" onClick={() => setConfirm(true)} title="Restore the canonical demo data">Reset demo</button>
      )}
    </div>
  );
}

export function Toasts() {
  const [, ui] = useDemo();
  return (
    <div className="sa-toasts" aria-live="polite">
      {ui.toasts.map((t) => <div key={t.id} className="sa-toast">{t.text}</div>)}
    </div>
  );
}

/** Overlays that sit above every page. */
export function GlobalOverlays() {
  return (
    <>
      <JobDrawer />
      <TvOverlay />
      <Toasts />
      <DemoFlag />
    </>
  );
}
