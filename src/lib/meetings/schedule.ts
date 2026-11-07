import type { Meeting, ScheduledMeeting, TimeCategory } from "./types";
import { WEEKDAYS } from "./types";

const DAY_MS = 86_400_000;
const GRACE_MS = 90 * 60 * 1000;
const WEEKDAY_NUM: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

const dtfCache = new Map<string, Intl.DateTimeFormat>();

function zoneFormatter(zone: string) {
  let fmt = dtfCache.get(zone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      weekday: "short",
    });
    dtfCache.set(zone, fmt);
  }
  return fmt;
}

export function isValidZone(zone: string): boolean {
  if (!zone) return false;
  try {
    zoneFormatter(zone);
    return true;
  } catch {
    return false;
  }
}

export function wallClock(zone: string, date: Date) {
  const n: Record<string, number> = {};
  for (const part of zoneFormatter(zone).formatToParts(date)) {
    if (part.type === "weekday") n.weekday = WEEKDAY_NUM[part.value] ?? 0;
    else if (part.type !== "literal") n[part.type] = Number(part.value);
  }
  return {
    weekday: n.weekday ?? 0,
    year: n.year ?? 1970,
    month: n.month ?? 1,
    day: n.day ?? 1,
    hour: n.hour ?? 0,
    minute: n.minute ?? 0,
    second: n.second ?? 0,
  };
}

function zoneOffsetMs(zone: string, utcMs: number) {
  const snapped = utcMs - (utcMs % 1000);
  const a = wallClock(zone, new Date(snapped));
  return Date.UTC(a.year, a.month - 1, a.day, a.hour, a.minute, a.second) - snapped;
}

function wallTimeToUtc(
  zone: string,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
) {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const offsets = new Set([
    zoneOffsetMs(zone, guess - DAY_MS),
    zoneOffsetMs(zone, guess),
    zoneOffsetMs(zone, guess + DAY_MS),
  ]);
  const candidates = [...offsets].map((off) => guess - off);
  const exact = candidates.filter((t) => {
    const w = wallClock(zone, new Date(t));
    return w.hour === hour && w.minute === minute;
  });
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) return Math.min(...exact);
  return Math.max(...candidates);
}

const occCache = new Map<string, number | null>();

export function nextOccurrence(
  rec: { weekday: number; hour: number; minute: number; zone: string },
  now = Date.now(),
  graceMs = GRACE_MS,
): number | null {
  const { weekday, hour, minute, zone } = rec;
  if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) return null;
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null;
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) return null;
  if (!isValidZone(zone)) return null;

  const bucket = Math.floor(now / 60_000);
  const key = `${bucket}|${weekday}|${hour}|${minute}|${zone}|${graceMs}`;
  const cached = occCache.get(key);
  if (cached !== undefined) return cached;
  if (occCache.size > 4000) occCache.clear();

  const i = wallClock(zone, new Date(now));
  const daysAhead = (weekday - i.weekday + 7) % 7;
  const baseUtc = Date.UTC(i.year, i.month - 1, i.day) + daysAhead * DAY_MS;
  const occ = (utcMidnight: number) => {
    const d = new Date(utcMidnight);
    return wallTimeToUtc(
      zone,
      d.getUTCFullYear(),
      d.getUTCMonth() + 1,
      d.getUTCDate(),
      hour,
      minute,
    );
  };

  let u = occ(baseUtc);
  if (u < now - graceMs) {
    u = occ(baseUtc + 7 * DAY_MS);
  } else if (u > now) {
    const prev = occ(baseUtc - 7 * DAY_MS);
    if (prev >= now - graceMs && prev <= now) u = prev;
  }
  occCache.set(key, u);
  return u;
}

export function deviceZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** The list's clock. An empty choice follows the device. A meeting's own zone is separate. */
export function shownZone(chosen = ""): string {
  if (chosen && isValidZone(chosen)) return chosen;
  return deviceZone();
}

export function viewerZone(): string {
  return deviceZone();
}

export function formatLocalTime(ms: number, zone?: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ms));
}

export function formatLocalWeekday(ms: number, zone?: string, style: "short" | "long" = "short") {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    weekday: style,
  }).format(new Date(ms));
}

export function formatLocalDate(ms: number, zone?: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(ms));
}

export function formatClock(hour: number, minute: number) {
  const h12 = ((hour + 11) % 12) + 1;
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h12}:${String(minute).padStart(2, "0")} ${ampm}`;
}

export function weekdayLong(n: number) {
  return WEEKDAYS.find((d) => d.value === n)?.long ?? "";
}

export function relativePhrase(from: number, to: number): string {
  const diff = to - from;
  const abs = Math.abs(diff);
  const past = diff < 0;
  if (abs < 60_000) return "now";
  const mins = Math.round(abs / 60_000);
  if (mins < 60) {
    const unit = mins === 1 ? "minute" : "minutes";
    return past ? `${mins} ${unit} ago` : `in ${mins} ${unit}`;
  }
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hours < 24) {
    const h = hours === 1 ? "1 hour" : `${hours} hours`;
    if (rem === 0) return past ? `${h} ago` : `in ${h}`;
    const m = rem === 1 ? "1 minute" : `${rem} minutes`;
    return past ? `${h} ${m} ago` : `in ${h} ${m}`;
  }
  const days = Math.round(abs / DAY_MS);
  const unit = days === 1 ? "day" : "days";
  return past ? `${days} ${unit} ago` : `in ${days} ${unit}`;
}

function startOfLocalDay(ms: number, zone: string) {
  const w = wallClock(zone, new Date(ms));
  return wallTimeToUtc(zone, w.year, w.month, w.day, 0, 0);
}

function categorize(next: number, now: number, zone: string): TimeCategory {
  if (next <= now) return "live";
  if (next <= now + 60 * 60 * 1000) return "nextHour";
  const today = startOfLocalDay(now, zone);
  const tomorrow = today + DAY_MS;
  const dayAfter = tomorrow + DAY_MS;
  const weekEnd = today + 7 * DAY_MS;
  if (next < tomorrow) return "restOfDay";
  if (next < dayAfter) return "tomorrow";
  if (next < weekEnd) return "thisWeek";
  return "upcoming";
}

export const CATEGORY_META: {
  id: TimeCategory;
  title: string;
  empty: string;
  hideIfEmpty: boolean;
}[] = [
  { id: "live", title: "Live Now", empty: "There are no meetings in progress right now", hideIfEmpty: false },
  { id: "nextHour", title: "Next Hour", empty: "There are no meetings in the next hour", hideIfEmpty: true },
  { id: "restOfDay", title: "Later Today", empty: "There are no more meetings today", hideIfEmpty: true },
  { id: "tomorrow", title: "Tomorrow", empty: "There are no meetings tomorrow", hideIfEmpty: true },
  { id: "thisWeek", title: "Next few days", empty: "There are no meetings this week", hideIfEmpty: true },
  { id: "upcoming", title: "Upcoming", empty: "There are no upcoming meetings", hideIfEmpty: true },
];

export function scheduleMeetings(
  meetings: Meeting[],
  now = Date.now(),
  zone = viewerZone(),
): ScheduledMeeting[] {
  const out: ScheduledMeeting[] = [];
  for (const meeting of meetings) {
    const next = nextOccurrence(meeting, now);
    if (next == null) continue;
    const isLive = next <= now;
    out.push({
      ...meeting,
      nextOccurrence: next,
      isLive,
      category: categorize(next, now, zone),
    });
  }
  out.sort((a, b) => a.nextOccurrence - b.nextOccurrence || a.name.localeCompare(b.name));
  return out;
}

export function groupByCategory(scheduled: ScheduledMeeting[]) {
  const groups = CATEGORY_META.map((meta) => ({
    ...meta,
    meetings: scheduled.filter((m) => m.category === meta.id),
  }));
  return groups;
}

export function groupByWeekday(scheduled: ScheduledMeeting[], zone = viewerZone()) {
  const buckets = WEEKDAYS.map((d) => ({ ...d, meetings: [] as ScheduledMeeting[] }));
  for (const m of scheduled) {
    const w = wallClock(zone, new Date(m.nextOccurrence)).weekday;
    const bucket = buckets.find((b) => b.value === w);
    if (bucket) bucket.meetings.push(m);
  }
  return buckets;
}

export function isInNext24Hours(ms: number, now = Date.now()) {
  return Math.abs(ms - now) < DAY_MS;
}
