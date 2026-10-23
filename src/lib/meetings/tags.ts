export const TAGS = ["open", "closed", "access", "speaker", "hybrid", "paused"] as const;

export type MeetingTag = (typeof TAGS)[number];

export const TAG_KEYS: Record<MeetingTag, string> = {
  open: "tagOpen",
  closed: "tagClosed",
  access: "tagAccess",
  speaker: "tagSpeaker",
  hybrid: "tagHybrid",
  paused: "tagPaused",
};

const KNOWN = new Set<string>(TAGS);

export function knownTags(raw: unknown): MeetingTag[] {
  const list = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
      ? raw.split(",")
      : [];
  const out: MeetingTag[] = [];
  for (const item of list) {
    const id = String(item).trim();
    if (KNOWN.has(id) && !out.includes(id as MeetingTag)) out.push(id as MeetingTag);
  }
  return out;
}

/** Read format words only when a list actually published them. */
export function inferTags(notes: string): MeetingTag[] {
  if (!/meetings\.aa\.org\.au/i.test(notes)) return [];
  const body = notes.replace(/^.*?meetings\.aa\.org\.au\.\s*/i, "");
  const out: MeetingTag[] = [];
  const add = (id: MeetingTag) => {
    if (!out.includes(id)) out.push(id);
  };
  if (/temporarily closed/i.test(body)) add("paused");
  for (const part of body.split(",")) {
    const s = part.replace(/\.$/, "").trim().toLowerCase();
    if (s === "open") add("open");
    else if (s === "closed") add("closed");
    else if (s === "speaker") add("speaker");
    else if (s === "hybrid") add("hybrid");
    else if (s.includes("wheelchair")) add("access");
  }
  if (out.includes("paused")) return out.filter((id) => id !== "closed");
  return out;
}
