import * as XLSX from "xlsx";
import type { Gender, Meeting, Platform } from "./types";
import { WEEKDAYS } from "./types";
import { uid } from "@/lib/utils";
import { buildJoinUrl, asPlatform } from "./platforms";
import { programIdFromLabel } from "./programs";

export const CSV_HEADERS = [
  "Name",
  "Weekday",
  "Time",
  "Timezone",
  "Duration Minutes",
  "Platform",
  "Meeting ID",
  "Password",
  "Join URL",
  "Notes",
  "Contact",
  "Gender",
  "Program",
  "Language",
  "Location",
] as const;

const HEADER_ALIASES: Record<string, (typeof CSV_HEADERS)[number]> = {
  name: "Name",
  title: "Name",
  meeting: "Name",
  weekday: "Weekday",
  day: "Weekday",
  "day of week": "Weekday",
  time: "Time",
  "start time": "Time",
  timezone: "Timezone",
  "time zone": "Timezone",
  tz: "Timezone",
  zone: "Timezone",
  duration: "Duration Minutes",
  "duration minutes": "Duration Minutes",
  minutes: "Duration Minutes",
  platform: "Platform",
  type: "Platform",
  "meeting id": "Meeting ID",
  meetingid: "Meeting ID",
  id: "Meeting ID",
  "zoom id": "Meeting ID",
  "zoom room": "Meeting ID",
  room: "Meeting ID",
  password: "Password",
  passcode: "Password",
  pwd: "Password",
  "join url": "Join URL",
  joinurl: "Join URL",
  url: "Join URL",
  link: "Join URL",
  "zoom url": "Join URL",
  notes: "Notes",
  note: "Notes",
  description: "Notes",
  contact: "Contact",
  "contact info": "Contact",
  email: "Contact",
  gender: "Gender",
  who: "Gender",
  program: "Program",
  fellowship: "Program",
  language: "Language",
  lang: "Language",
  location: "Location",
  place: "Location",
  city: "Location",
};

function csvEscape(value: string) {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function timeString(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function weekdayLabel(n: number) {
  return WEEKDAYS.find((d) => d.value === n)?.long ?? String(n);
}

export function meetingToRow(m: Meeting): Record<(typeof CSV_HEADERS)[number], string> {
  return {
    Name: m.name,
    Weekday: weekdayLabel(m.weekday),
    Time: timeString(m.hour, m.minute),
    Timezone: m.zone,
    "Duration Minutes": String(m.durationMinutes || 60),
    Platform: m.platform,
    "Meeting ID": m.meetingId,
    Password: m.password,
    "Join URL": m.joinUrl || buildJoinUrl(m) || "",
    Notes: m.notes,
    Contact: m.contactInfo,
    Gender: m.gender,
    Program: m.programId || "aca",
    Language: m.language || "",
    Location: m.location || "",
  };
}

export function meetingsToCsv(meetings: Meeting[]): string {
  const lines = [
    CSV_HEADERS.join(","),
    ...meetings.map((m) => {
      const row = meetingToRow(m);
      return CSV_HEADERS.map((h) => csvEscape(row[h] ?? "")).join(",");
    }),
  ];
  return lines.join("\r\n") + "\r\n";
}

export function meetingsToSheetRows(meetings: Meeting[]): string[][] {
  return [
    [...CSV_HEADERS],
    ...meetings.map((m) => {
      const row = meetingToRow(m);
      return CSV_HEADERS.map((h) => row[h] ?? "");
    }),
  ];
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else quoted = false;
      } else cur += ch;
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function parseCsv(text: string): string[][] {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows: string[][] = [];
  let buf = "";
  let quoted = false;
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    if (ch === '"') {
      quoted = !quoted;
      buf += ch;
    } else if (ch === "\n" && !quoted) {
      if (buf.trim()) rows.push(parseCsvLine(buf));
      buf = "";
    } else buf += ch;
  }
  if (buf.trim()) rows.push(parseCsvLine(buf));
  return rows;
}

function parseWeekday(raw: string): number | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  const asNum = Number(s);
  if (asNum >= 1 && asNum <= 7) return asNum;
  const map: Record<string, number> = {
    mon: 1, monday: 1,
    tue: 2, tues: 2, tuesday: 2,
    wed: 3, weds: 3, wednesday: 3,
    thu: 4, thur: 4, thurs: 4, thursday: 4,
    fri: 5, friday: 5,
    sat: 6, saturday: 6,
    sun: 7, sunday: 7,
  };
  return map[s] ?? null;
}

function parseTime(raw: string): { hour: number; minute: number } | null {
  const s = raw.trim();
  if (!s) return null;
  const ampm = s.match(/^(\d{1,2})(?::(\d{2}))?\s*([ap]m?)$/i);
  if (ampm) {
    let hour = Number(ampm[1]);
    const minute = Number(ampm[2] || 0);
    const mer = ampm[3].toLowerCase();
    if (mer.startsWith("p") && hour < 12) hour += 12;
    if (mer.startsWith("a") && hour === 12) hour = 0;
    return { hour, minute };
  }
  const hm = s.match(/^(\d{1,2}):(\d{2})$/);
  if (hm) return { hour: Number(hm[1]), minute: Number(hm[2]) };
  const hourOnly = s.match(/^(\d{1,2})$/);
  if (hourOnly) return { hour: Number(hourOnly[1]), minute: 0 };
  return null;
}

function parsePlatform(raw: string): Platform {
  return asPlatform(raw);
}

function parseGender(raw: string): Gender {
  const s = raw.trim().toLowerCase();
  if (s.includes("women") || s === "w" || s === "women_only") return "WOMEN_ONLY";
  if (s.includes("men") || s === "m" || s === "men_only") return "MEN_ONLY";
  return "ALL";
}

function rowToMeeting(row: Record<string, string>): Meeting | null {
  const name = (row.Name || "").trim();
  if (!name) return null;
  const weekday = parseWeekday(row.Weekday || "");
  const time = parseTime(row.Time || "");
  if (weekday == null || !time) return null;
  const duration = Number(row["Duration Minutes"] || 60) || 60;
  const platform = parsePlatform(row.Platform || "");
  return {
    id: uid(),
    name,
    weekday,
    hour: time.hour,
    minute: time.minute,
    zone: (row.Timezone || "").trim() || "America/New_York",
    durationMinutes: duration,
    platform,
    meetingId: (row["Meeting ID"] || "").trim(),
    password: (row.Password || "").trim(),
    joinUrl: (row["Join URL"] || "").trim(),
    notes: (row.Notes || "").trim(),
    contactInfo: (row.Contact || "").trim(),
    gender: parseGender(row.Gender || ""),
    programId: programIdFromLabel(row.Program || "aca"),
    groupId: "",
    language: (row.Language || "").trim(),
    location: (row.Location || "").trim(),
    source: "custom",
  };
}

function mapHeader(cell: string): string | null {
  const key = cell.trim().toLowerCase().replace(/[_-]+/g, " ");
  return HEADER_ALIASES[key] ?? null;
}

function rowsToMeetings(grid: string[][]): Meeting[] {
  if (grid.length < 2) return [];
  const header = grid[0].map((h) => mapHeader(h));
  const meetings: Meeting[] = [];
  for (const cells of grid.slice(1)) {
    if (!cells.some((c) => c && c.trim())) continue;
    const row: Record<string, string> = {};
    header.forEach((h, i) => {
      if (h) row[h] = cells[i] ?? "";
    });
    const meeting = rowToMeeting(row);
    if (meeting) meetings.push(meeting);
  }
  return meetings;
}

export function parseMeetingsCsv(text: string): Meeting[] {
  return rowsToMeetings(parseCsv(text));
}

export function parseMeetingsWorkbook(buffer: ArrayBuffer): Meeting[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const sheet = wb.Sheets[sheetName];
  const grid = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
    header: 1,
    raw: false,
    defval: "",
  }) as unknown as string[][];
  return rowsToMeetings(grid.map((r) => r.map((c) => String(c ?? ""))));
}

export function buildXlsxBytes(meetings: Meeting[]): Uint8Array {
  const ws = XLSX.utils.aoa_to_sheet(meetingsToSheetRows(meetings));
  ws["!cols"] = CSV_HEADERS.map((h) => ({ wch: Math.max(14, h.length + 2) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Meetings");
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer | Uint8Array;
  return out instanceof Uint8Array ? out : new Uint8Array(out);
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function downloadBytes(filename: string, bytes: Uint8Array, mime: string) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  downloadBlob(filename, new Blob([copy.buffer as ArrayBuffer], { type: mime }));
}

export function stampFilename(base: string, ext: string) {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${base}-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.${ext}`;
}
