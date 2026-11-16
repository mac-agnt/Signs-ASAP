/* Shared primitives for the Signs ASAP modules. Built only on Pulse theme tokens
   (var(--surface), var(--accent) ...) so every page reads as Pulse v4 Glass. */

import { useState, type CSSProperties, type ReactNode } from "react";
import { person, openJob, eur, jobShort } from "./model";

export type Tone = "ok" | "warn" | "bad" | "info" | "accent" | "muted";
export const toneColor: Record<Tone, string> = {
  ok: "var(--ok)", warn: "var(--warn)", bad: "var(--bad)", info: "var(--teal)", accent: "var(--accent)", muted: "var(--dim)",
};
export const toneSoft: Record<Tone, string> = {
  ok: "var(--ok-soft)", warn: "var(--warn-soft)", bad: "var(--bad-soft)", info: "var(--teal-soft)", accent: "var(--accent-soft)", muted: "var(--track)",
};

/* ── Layout ─────────────────────────────────────────────────────────────── */
export function Page({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div className="sa-page" style={style}>{children}</div>;
}

export function PageHead({ title, sub, actions, kicker }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode; kicker?: ReactNode }) {
  return (
    <div className="sa-head">
      <div style={{ minWidth: 0, flex: "1 1 360px" }}>
        {kicker && <div className="sa-kicker">{kicker}</div>}
        <h1 className="sa-title">{title}</h1>
        {sub && <div className="sa-sub">{sub}</div>}
      </div>
      {actions && <div className="sa-actions">{actions}</div>}
    </div>
  );
}

export function Grid({ cols, gap = 14, children, style, min }: { cols?: string; gap?: number; children: ReactNode; style?: CSSProperties; min?: number }) {
  const template = cols || "repeat(auto-fit,minmax(" + (min || 220) + "px,1fr))";
  return <div className="sa-grid" style={{ gridTemplateColumns: template, gap, ...style }}>{children}</div>;
}

export function Card({ title, sub, right, children, pad = true, style, tone, onClick, className }: {
  title?: ReactNode; sub?: ReactNode; right?: ReactNode; children?: ReactNode; pad?: boolean; style?: CSSProperties; tone?: Tone; onClick?: () => void; className?: string;
}) {
  return (
    <section className={"sa-card" + (onClick ? " sa-click" : "") + (className ? " " + className : "")} onClick={onClick}
      style={{ ...(tone ? { borderColor: "color-mix(in oklab," + toneColor[tone] + " 38%, var(--border))" } : null), ...style }}>
      {(title || right) && (
        <div className="sa-card-head">
          <div style={{ minWidth: 0, flex: 1 }}>
            {title && <div className="sa-card-title">{title}</div>}
            {sub && <div className="sa-card-sub">{sub}</div>}
          </div>
          {right && <div style={{ flex: "none", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>{right}</div>}
        </div>
      )}
      <div style={pad ? { padding: title || right ? "4px 20px 18px" : "18px 20px" } : undefined}>{children}</div>
    </section>
  );
}

export function Label({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div className="sa-label" style={style}>{children}</div>;
}

/* ── Atoms ──────────────────────────────────────────────────────────────── */
export function Badge({ tone = "muted", children, dot, style, title }: { tone?: Tone; children: ReactNode; dot?: boolean; style?: CSSProperties; title?: string }) {
  return (
    <span className="sa-badge" title={title} style={{ color: toneColor[tone], background: toneSoft[tone], ...style }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 3, background: toneColor[tone], flex: "none" }} />}
      {children}
    </span>
  );
}

export function Btn({ children, kind = "ghost", onClick, disabled, small, title, style, icon }: {
  children?: ReactNode; kind?: "primary" | "ghost" | "quiet" | "danger" | "teal"; onClick?: (e: React.MouseEvent) => void; disabled?: boolean; small?: boolean; title?: string; style?: CSSProperties; icon?: ReactNode;
}) {
  return (
    <button type="button" title={title} disabled={disabled} className={"sa-btn sa-btn-" + kind + (small ? " sa-btn-sm" : "")}
      onClick={(e) => { e.stopPropagation(); if (!disabled && onClick) onClick(e); }} style={style}>
      {icon}{children}
    </button>
  );
}

export function Avatar({ id, size = 26, initials, tint }: { id?: string; size?: number; initials?: string; tint?: string }) {
  const p = id ? person(id) : null;
  const i = initials || p?.initials || "?";
  const t = tint || p?.tint || "var(--accent)";
  return (
    <span title={p?.name} style={{ width: size, height: size, flex: "none", borderRadius: 999, background: t, color: "#0b0e10", display: "inline-flex",
      alignItems: "center", justifyContent: "center", fontSize: Math.max(9, size * 0.36), fontWeight: 600, letterSpacing: "-.2px" }}>{i}</span>
  );
}

export function Who({ id, sub }: { id: string; sub?: string }) {
  const p = person(id);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
      <Avatar id={id} size={22} />
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 12.5, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
        {sub && <span style={{ display: "block", fontSize: 11, color: "var(--faint)" }}>{sub}</span>}
      </span>
    </span>
  );
}

export function JobChip({ id, label }: { id: string; label?: string }) {
  return (
    <button type="button" className="sa-jobchip" onClick={(e) => { e.stopPropagation(); openJob(id); }} title={"Open " + id}>
      <span className="sa-mono">{id}</span>
      {label !== "" && <span style={{ color: "var(--body)" }}>{label || jobShort(id)}</span>}
    </button>
  );
}

export function Stat({ label, value, sub, tone, onClick, big }: { label: ReactNode; value: ReactNode; sub?: ReactNode; tone?: Tone; onClick?: () => void; big?: boolean }) {
  return (
    <div className={"sa-stat" + (onClick ? " sa-click" : "")} onClick={onClick}>
      <div className="sa-label">{label}</div>
      <div className="sa-stat-v" style={{ fontSize: big ? 34 : 26, color: tone ? toneColor[tone] : "var(--ink)" }}>{value}</div>
      {sub && <div className="sa-stat-sub">{sub}</div>}
    </div>
  );
}

export function Meter({ value, max = 100, tone = "accent", height = 6, over }: { value: number; max?: number; tone?: Tone; height?: number; over?: boolean }) {
  const p = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ position: "relative", height, borderRadius: height, background: "var(--track)", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, width: p + "%", borderRadius: height, background: over ? "var(--bad)" : toneColor[tone], transition: "width .5s var(--ease)" }} />
    </div>
  );
}

export function Seg<T extends string>({ options, value, onChange, size = "md" }: { options: { id: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; size?: "sm" | "md" }) {
  return (
    <div className="sa-seg" role="tablist">
      {options.map((o) => (
        <button type="button" role="tab" aria-selected={o.id === value} key={o.id} onClick={() => onChange(o.id)}
          className={"sa-seg-b" + (o.id === value ? " on" : "")} style={size === "sm" ? { height: 28, fontSize: 12, padding: "0 11px" } : undefined}>{o.label}</button>
      ))}
    </div>
  );
}

export function Empty({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div style={{ padding: "34px 20px", textAlign: "center" }}>
      <div style={{ fontSize: 14, fontWeight: 500 }}>{title}</div>
      {sub && <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 6 }}>{sub}</div>}
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}

export function Note({ children, tone = "muted", style }: { children: ReactNode; tone?: Tone; style?: CSSProperties }) {
  return (
    <div className="sa-note" style={{ borderColor: "color-mix(in oklab," + toneColor[tone] + " 35%, transparent)", background: toneSoft[tone], ...style }}>
      <span style={{ width: 6, height: 6, borderRadius: 3, background: toneColor[tone], flex: "none", marginTop: 6 }} />
      <div style={{ minWidth: 0, flex: 1 }}>{children}</div>
    </div>
  );
}

export function KV({ k, v, mono }: { k: ReactNode; v: ReactNode; mono?: boolean }) {
  return (
    <div className="sa-kv">
      <div className="sa-label">{k}</div>
      <div style={{ fontSize: 13, color: "var(--ink)", marginTop: 4, fontVariantNumeric: mono ? "tabular-nums" : undefined }}>{v}</div>
    </div>
  );
}

/* ── Table ──────────────────────────────────────────────────────────────── */
export type Col<T> = { key: string; label: ReactNode; width?: string; align?: "left" | "right" | "center"; render: (row: T, i: number) => ReactNode; hideSm?: boolean };
export function Table<T>({ cols, rows, onRow, empty, dense, footer, rowTone }: {
  cols: Col<T>[]; rows: T[]; onRow?: (r: T) => void; empty?: ReactNode; dense?: boolean; footer?: ReactNode; rowTone?: (r: T) => Tone | undefined;
}) {
  const template = cols.map((c) => c.width || "1fr").join(" ");
  return (
    <div className="sa-table">
      <div className="sa-tr sa-th" style={{ gridTemplateColumns: template }}>
        {cols.map((c) => <div key={c.key} className={"sa-td" + (c.hideSm ? " sa-hide-sm" : "")} style={{ textAlign: c.align || "left" }}>{c.label}</div>)}
      </div>
      {rows.map((r, i) => {
        const tone = rowTone ? rowTone(r) : undefined;
        return (
          <div key={i} className={"sa-tr" + (onRow ? " sa-click-row" : "")} onClick={onRow ? () => onRow(r) : undefined}
            style={{ gridTemplateColumns: template, boxShadow: tone ? "inset 2px 0 0 " + toneColor[tone] : undefined, padding: dense ? "0" : undefined }}>
            {cols.map((c) => (
              <div key={c.key} className={"sa-td" + (c.hideSm ? " sa-hide-sm" : "")} style={{ textAlign: c.align || "left", justifyContent: c.align === "right" ? "flex-end" : c.align === "center" ? "center" : undefined, padding: dense ? "9px 14px" : undefined }}>{c.render(r, i)}</div>
            ))}
          </div>
        );
      })}
      {rows.length === 0 && (empty || <Empty title="Nothing here" />)}
      {footer && <div className="sa-tfoot">{footer}</div>}
    </div>
  );
}

/* ── Inputs ─────────────────────────────────────────────────────────────── */
export function NumField({ value, onChange, prefix, suffix, width = 90, step = 1, min = 0, label }: {
  value: number; onChange: (n: number) => void; prefix?: string; suffix?: string; width?: number; step?: number; min?: number; label?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <label className="sa-num" style={{ width }} onClick={(e) => e.stopPropagation()}>
      {prefix && <span className="sa-num-x">{prefix}</span>}
      <input aria-label={label} inputMode="decimal" value={draft !== null ? draft : String(value)} step={step}
        onChange={(e) => {
          setDraft(e.target.value);
          const n = parseFloat(e.target.value.replace(/[^\d.-]/g, ""));
          if (Number.isFinite(n) && n >= min) onChange(n);
        }}
        onBlur={() => setDraft(null)} />
      {suffix && <span className="sa-num-x">{suffix}</span>}
    </label>
  );
}

export function TextField({ value, onChange, placeholder, label, area, rows = 3 }: { value: string; onChange: (s: string) => void; placeholder?: string; label?: string; area?: boolean; rows?: number }) {
  return (
    <label style={{ display: "block" }}>
      {label && <div className="sa-label" style={{ marginBottom: 6 }}>{label}</div>}
      {area
        ? <textarea className="sa-input" rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        : <input className="sa-input" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />}
    </label>
  );
}

/* ── Charts (no library: divs + SVG) ────────────────────────────────────── */
export function Bars({ data, height = 150, fmt = (n: number) => String(n), tone = "accent", highlightLast }: {
  data: { label: string; value: number; tone?: Tone; sub?: string }[]; height?: number; fmt?: (n: number) => string; tone?: Tone; highlightLast?: boolean;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(" + data.length + ",1fr)", gap: 10, alignItems: "end", height: height + 40 }}>
      {data.map((d, i) => {
        const t = d.tone || (highlightLast && i === data.length - 1 ? "accent" : tone);
        return (
          <div key={d.label + i} style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: 6, minWidth: 0 }} title={d.label + ": " + fmt(d.value)}>
            <div style={{ fontSize: 11, color: "var(--body)", textAlign: "center", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{fmt(d.value)}</div>
            <div style={{ height: Math.max(3, (d.value / max) * height), borderRadius: "8px 8px 3px 3px", background: toneColor[t], opacity: highlightLast && i !== data.length - 1 ? 0.55 : 0.92, transition: "height .5s var(--ease)" }} />
            <div style={{ fontSize: 11, color: "var(--faint)", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}

export function HBars({ data, fmt = (n: number) => String(n), max: maxIn, marker, markerLabel }: {
  data: { label: ReactNode; value: number; tone?: Tone; right?: ReactNode; onClick?: () => void }[]; fmt?: (n: number) => string; max?: number; marker?: number; markerLabel?: string;
}) {
  const max = maxIn || Math.max(1, ...data.map((d) => d.value));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      {data.map((d, i) => (
        <div key={i} onClick={d.onClick} className={d.onClick ? "sa-click" : undefined} style={{ display: "grid", gridTemplateColumns: "minmax(110px,1.1fr) 2fr auto", gap: 12, alignItems: "center" }}>
          <div style={{ fontSize: 12.5, color: "var(--body)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.label}</div>
          <div style={{ position: "relative", height: 10, borderRadius: 6, background: "var(--track)" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: Math.min(100, (d.value / max) * 100) + "%", borderRadius: 6, background: toneColor[d.tone || "accent"], transition: "width .5s var(--ease)" }} />
            {marker !== undefined && <div title={markerLabel} style={{ position: "absolute", top: -4, bottom: -4, left: Math.min(100, (marker / max) * 100) + "%", width: 2, background: "var(--ink)", opacity: 0.6, borderRadius: 1 }} />}
          </div>
          <div style={{ fontSize: 12, color: "var(--ink)", fontVariantNumeric: "tabular-nums", minWidth: 54, textAlign: "right" }}>{d.right ?? fmt(d.value)}</div>
        </div>
      ))}
    </div>
  );
}

export function Donut({ parts, size = 120, thickness = 16, center }: { parts: { value: number; tone: Tone; label: string }[]; size?: number; thickness?: number; center?: ReactNode }) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  const r = (size - thickness) / 2, c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={thickness} />
        {parts.map((p, i) => {
          const len = (p.value / total) * c;
          const el = <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={toneColor[p.tone]} strokeWidth={thickness} strokeDasharray={len + " " + (c - len)} strokeDashoffset={-acc} strokeLinecap="butt" />;
          acc += len;
          return el;
        })}
      </svg>
      {center && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", textAlign: "center" }}>{center}</div>}
    </div>
  );
}

export function Legend({ items }: { items: { label: ReactNode; tone: Tone; value?: ReactNode }[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5 }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: toneColor[it.tone], flex: "none" }} />
          <span style={{ flex: 1, color: "var(--body)", minWidth: 0 }}>{it.label}</span>
          {it.value !== undefined && <span style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{it.value}</span>}
        </div>
      ))}
    </div>
  );
}

/** A small "where this number comes from" footnote. */
export function Source({ children }: { children: ReactNode }) {
  return <div className="sa-source">{children}</div>;
}

export const money = eur;

/* ── Placeholder art for proofs / photos (no stock images) ──────────────── */
export function ProofArt({ swatch, label, ratio = "16/5", lit }: { swatch: string[]; label: string; ratio?: string; lit?: boolean }) {
  const [a, b] = [swatch[0] || "#333", swatch[1] || "#ddd"];
  return (
    <div style={{ position: "relative", aspectRatio: ratio, borderRadius: 12, overflow: "hidden", background: "linear-gradient(180deg,#1b2024,#11161a)", border: "1px solid var(--border)" }}>
      <div style={{ position: "absolute", left: "6%", right: "6%", top: "22%", bottom: "22%", borderRadius: 6, background: a, boxShadow: lit ? "0 0 28px " + b + "66" : "none", display: "flex", alignItems: "center", gap: "4%", padding: "0 5%" }}>
        <div style={{ height: "62%", aspectRatio: "1", borderRadius: "50%", background: b, opacity: 0.95, flex: "none" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10%", justifyContent: "center", height: "100%" }}>
          <div style={{ height: "22%", width: "78%", borderRadius: 3, background: b, boxShadow: lit ? "0 0 12px " + b : "none" }} />
          <div style={{ height: "12%", width: "48%", borderRadius: 3, background: b, opacity: 0.7 }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 10, bottom: 8, fontSize: 10, color: "rgba(255,255,255,.6)", letterSpacing: ".04em" }}>{label}</div>
    </div>
  );
}

export function fmtMoneyDelta(n: number) { return (n >= 0 ? "+" : "-") + eur(Math.abs(n)); }
