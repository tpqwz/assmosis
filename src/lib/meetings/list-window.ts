/** A catalog copy that only covers a dated week or directory. Custom meetings are not included. */

export type ListWindow = { through: string; label: string; short: string };

type Row = { id?: string; programId?: string; source?: string; notes?: string };

const ACA: ListWindow = {
  through: "2026-10-26",
  label: "the ACA world calendar for October 19–26, 2026",
  short: "Oct 19–26",
};

const ACA_NOV: ListWindow = {
  through: "2026-11-14",
  label: "the ACA world calendar for November 7–14, 2026",
  short: "Nov 7–14",
};

const SLAA: ListWindow = {
  through: "2026-10-26",
  label: "the SLAA virtual intergroup calendar for October 19–26, 2026",
  short: "Oct 19–26",
};

const SLAA_NOV: ListWindow = {
  through: "2026-11-14",
  label: "the SLAA virtual intergroup calendar for November 7–14, 2026",
  short: "Nov 7–14",
};

const ITAA: ListWindow = {
  through: "2026-11-14",
  label: "the Internet and Technology Addicts Anonymous online calendar for November 7–14, 2026",
  short: "Nov 7–14",
};

const GSA: ListWindow = {
  through: "2026-10-25",
  label: "the GreySheeters calendar for October 18–25, 2026",
  short: "Oct 18–25",
};

const FAM_US: ListWindow = {
  through: "2026-10-13",
  label: "the Families Anonymous US and Canada virtual directory dated October 13, 2026",
  short: "Oct 13",
};

const FAM_INTL: ListWindow = {
  through: "2026-05-06",
  label: "the Families Anonymous international virtual directory dated May 6, 2026",
  short: "May 6",
};

const NOVEMBER_WEEK = "November 7–14, 2026";
const FAM_CURRENT = "November 4, 2026";

export const NO_COPY_DATE = "The day this row was copied was not saved.";

export function listWindow(meeting: Row): ListWindow | null {
  if (meeting.source === "custom") return null;
  const id = meeting.id || "";
  const notes = meeting.notes || "";
  const november = notes.includes(NOVEMBER_WEEK);
  if (id.startsWith("aca-1114-") || (id.startsWith("aca-wso-") && november)) return ACA_NOV;
  if (id.startsWith("aca-wso-")) return ACA;
  if (id.startsWith("slaa-1114-") || (id.startsWith("slaa-virt-") && november)) return SLAA_NOV;
  if (id.startsWith("slaa-virt-")) return SLAA;
  if (id.startsWith("itaa-1114-")) return ITAA;
  if (id.startsWith("fam-us-")) return notes.includes(FAM_CURRENT) ? null : FAM_US;
  if (id.startsWith("fam-intl-")) return FAM_INTL;
  if (meeting.programId === "gsa") return GSA;
  return null;
}

export function programWindows(programId: string): ListWindow[] {
  if (programId === "aca") return [ACA, ACA_NOV];
  if (programId === "slaa") return [SLAA, SLAA_NOV];
  if (programId === "itaa") return [ITAA];
  if (programId === "gsa") return [GSA];
  if (programId === "fam") return [FAM_US, FAM_INTL];
  return [];
}

/** True once the inclusive end date has passed, in UTC. */
export function windowPassed(through: string, now = Date.now()): boolean {
  const [year, month, day] = through.split("-").map(Number);
  if (!year || !month || !day) return false;
  return now >= Date.UTC(year, month - 1, day + 1);
}

export function listExpired(meeting: Row, now = Date.now()): boolean {
  const window = listWindow(meeting);
  return window ? windowPassed(window.through, now) : false;
}

/** What the row itself should say about when it was copied. Blank for a meeting someone typed in. */
export function copySentence(meeting: Row, now = Date.now()): string {
  if (meeting.source !== "catalog") return "";
  const window = listWindow(meeting);
  if (!window) return NO_COPY_DATE;
  const copied = `Copied from ${window.label}.`;
  return windowPassed(window.through, now) ? `${copied} That date has passed.` : copied;
}