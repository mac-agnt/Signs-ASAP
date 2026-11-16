/* One demo clock for the whole app. Every due date, fit date and activity time is
   an offset from DEMO_TODAY in business days (Mon-Fri), so the demo stays current
   whenever it is shown. A weekend opening snaps to the following Monday. */

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

function snapToWeekday(d: Date): Date {
  const out = startOfDay(d);
  const dow = out.getDay();
  if (dow === 6) out.setDate(out.getDate() + 2);
  if (dow === 0) out.setDate(out.getDate() + 1);
  return out;
}

export const DEMO_TODAY: Date = snapToWeekday(new Date());

/** Add n business days (negative goes back). */
export function bd(n: number, from: Date = DEMO_TODAY): Date {
  const d = startOfDay(from);
  let left = Math.abs(n);
  const step = n < 0 ? -1 : 1;
  while (left > 0) {
    d.setDate(d.getDate() + step);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) left--;
  }
  return d;
}

/** Monday of the demo week (+ weeks). */
export function weekStart(weeks = 0): Date {
  const d = startOfDay(DEMO_TODAY);
  const dow = d.getDay() || 7;
  d.setDate(d.getDate() - (dow - 1) + weeks * 7);
  return d;
}

/** Mon-Fri of the demo week (+ weeks). */
export function weekDays(weeks = 0): Date[] {
  const m = weekStart(weeks);
  return [0, 1, 2, 3, 4].map((i) => {
    const d = new Date(m);
    d.setDate(m.getDate() + i);
    return d;
  });
}

/** Business-day offset of a date from demo today (0 = today). */
export function bdFromToday(d: Date): number {
  const a = startOfDay(DEMO_TODAY).getTime();
  const b = startOfDay(d).getTime();
  if (a === b) return 0;
  const step = b > a ? 1 : -1;
  let n = 0;
  const cur = new Date(a);
  while (cur.getTime() !== b) {
    cur.setDate(cur.getDate() + step);
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) n += step;
    if (Math.abs(n) > 400) break;
  }
  return n;
}

export const sameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();

const fmtDay = new Intl.DateTimeFormat("en-IE", { weekday: "short", day: "numeric", month: "short" });
const fmtDate = new Intl.DateTimeFormat("en-IE", { day: "numeric", month: "short", year: "numeric" });
const fmtWeekday = new Intl.DateTimeFormat("en-IE", { weekday: "long" });
const fmtShortWd = new Intl.DateTimeFormat("en-IE", { weekday: "short" });

/** "Wed 18 Nov" */
export const dayLabel = (d: Date) => fmtDay.format(d).replace(",", "");
/** "18 Nov 2026" */
export const dateLabel = (d: Date) => fmtDate.format(d);
export const weekdayName = (d: Date) => fmtWeekday.format(d);
export const weekdayShort = (d: Date) => fmtShortWd.format(d);

/** "Today", "Tomorrow", "Yesterday", "Wed 18 Nov" */
export function relDay(d: Date): string {
  if (sameDay(d, DEMO_TODAY)) return "Today";
  const cal = Math.round((startOfDay(d).getTime() - startOfDay(DEMO_TODAY).getTime()) / 86400000);
  if (cal === 1) return "Tomorrow";
  if (cal === -1) return "Yesterday";
  return dayLabel(d);
}

/** A moment on a business day: offset in business days plus a clock time. */
export function at(dayOffset: number, hh: number, mm = 0): Date {
  const d = bd(dayOffset);
  d.setHours(hh, mm, 0, 0);
  return d;
}

export function timeLabel(d: Date): string {
  return d.toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit", hour12: false });
}

/** "09:40" today, "Yesterday 16:10", "Thu 12 Nov 11:00" */
export function stamp(d: Date): string {
  if (sameDay(d, DEMO_TODAY)) return timeLabel(d);
  return relDay(d) + " " + timeLabel(d);
}

export const isOverdue = (d: Date) => startOfDay(d).getTime() < startOfDay(DEMO_TODAY).getTime();
