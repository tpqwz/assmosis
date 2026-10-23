import type { Meeting, Platform } from "./types";
import { buildZoomJoinUrl } from "./zoom";

export const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "zoom", label: "Zoom" },
  { id: "jitsi", label: "Jitsi" },
  { id: "jami", label: "Jami" },
  { id: "meet", label: "Google Meet" },
  { id: "teams", label: "Teams" },
  { id: "skype", label: "Skype" },
  { id: "telegram", label: "Telegram" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "signal", label: "Signal" },
  { id: "discord", label: "Discord" },
  { id: "phone", label: "Phone" },
  { id: "email", label: "Email" },
  { id: "inperson", label: "In person" },
  { id: "other", label: "Other link" },
];

const KNOWN = new Set(PLATFORMS.map((p) => p.id));

export function asPlatform(value: string | undefined): Platform {
  const s = (value || "").trim().toLowerCase();
  if (KNOWN.has(s as Platform)) return s as Platform;
  if (s.includes("jitsi")) return "jitsi";
  if (s.includes("jami")) return "jami";
  if (s.includes("whats")) return "whatsapp";
  if (s.includes("telegram") || s === "tg") return "telegram";
  if (s.includes("signal")) return "signal";
  if (s.includes("discord")) return "discord";
  if (s.includes("meet")) return "meet";
  if (s.includes("team")) return "teams";
  if (s.includes("skype")) return "skype";
  if (s.includes("phone") || s === "tel" || s.includes("person") || s.includes("in-person") || s.includes("in person")) {
    return s.includes("person") ? "inperson" : "phone";
  }
  if (s.includes("mail")) return "email";
  if (s.includes("zoom") || s === "") return "zoom";
  return "other";
}

export function roomField(platform: Platform): { label: string; placeholder: string } {
  switch (platform) {
    case "zoom":
      return { label: "Zoom meeting ID", placeholder: "123 4567 8901" };
    case "phone":
      return { label: "Phone number", placeholder: "+1 555 123 4567" };
    case "email":
      return { label: "Email address", placeholder: "name@example.com" };
    case "jitsi":
      return { label: "Jitsi room name", placeholder: "SundaySteps" };
    case "jami":
      return { label: "Jami username", placeholder: "alice" };
    case "telegram":
      return { label: "Telegram username or invite", placeholder: "@mygroup or +AbCdEf" };
    case "whatsapp":
      return { label: "WhatsApp number or invite", placeholder: "15551234567" };
    case "meet":
      return { label: "Google Meet code", placeholder: "abc-defg-hij" };
    case "discord":
      return { label: "Discord invite", placeholder: "discord.gg/code" };
    case "signal":
      return { label: "Signal group link", placeholder: "https://signal.group/#…" };
    case "teams":
      return { label: "Teams link", placeholder: "https://teams.microsoft.com/…" };
    case "skype":
      return { label: "Skype name or link", placeholder: "join.skype.com/…" };
    case "inperson":
      return { label: "Place", placeholder: "12 Main St, church basement" };
    default:
      return { label: "Link or room", placeholder: "https://…" };
  }
}

function slugRoom(value: string) {
  return value.trim().replace(/\s+/g, "");
}

export function buildJoinUrl(
  meeting: Pick<Meeting, "platform" | "meetingId" | "password" | "joinUrl" | "name">,
): string | null {
  const join = (meeting.joinUrl || "").trim();
  const id = (meeting.meetingId || "").trim();

  if (join && /^(https?:|mailto:|tel:|jami:|skype:)/i.test(join)) {
    if (meeting.platform === "zoom" || /zoom\.us/i.test(join)) return buildZoomJoinUrl(meeting);
    return join;
  }

  switch (meeting.platform) {
    case "zoom":
      return buildZoomJoinUrl(meeting);
    case "phone": {
      const num = id.replace(/^tel:/i, "").replace(/[^\d+]/g, "");
      return num ? `tel:${num}` : null;
    }
    case "email": {
      const addr = id.replace(/^mailto:/i, "");
      return addr ? `mailto:${addr}` : null;
    }
    case "jitsi": {
      const room = slugRoom(id || meeting.name).replace(/[^a-zA-Z0-9_-]/g, "");
      return room ? `https://meet.jit.si/${encodeURIComponent(room)}` : null;
    }
    case "jami": {
      const user = id.replace(/^jami:/i, "");
      return user ? `jami:${user}` : null;
    }
    case "telegram": {
      let handle = id.replace(/^@/, "").replace(/^https?:\/\/t\.me\//i, "");
      if (!handle) return null;
      if (!handle.startsWith("+") && !handle.startsWith("joinchat/")) handle = handle.replace(/^\+/, "");
      return `https://t.me/${handle}`;
    }
    case "whatsapp": {
      if (/[a-z]/i.test(id) && !id.startsWith("http")) {
        return `https://chat.whatsapp.com/${id.replace(/\s/g, "")}`;
      }
      const digits = id.replace(/\D/g, "");
      if (digits.length >= 8) return `https://wa.me/${digits}`;
      return null;
    }
    case "meet": {
      const code = id.replace(/^https?:\/\/meet\.google\.com\//i, "");
      return code ? `https://meet.google.com/${code}` : null;
    }
    case "discord": {
      const code = id
        .replace(/^https?:\/\/discord\.gg\//i, "")
        .replace(/^https?:\/\/discord\.com\/invite\//i, "");
      return code ? `https://discord.gg/${code}` : null;
    }
    case "signal":
    case "teams":
      return /^https?:/i.test(id) ? id : null;
    case "skype": {
      if (/^https?:/i.test(id)) return id;
      if (/^skype:/i.test(id)) return id;
      if (id.includes("@")) return `skype:${id}`;
      const code = id.replace(/^live:/i, "");
      return code ? `https://join.skype.com/${code}` : null;
    }
    case "inperson": {
      const q = id || meeting.name;
      return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null;
    }
    default:
      return /^https?:/i.test(id) ? id : null;
  }
}

const VIDEO_ROOMS = new Set<Platform>(["zoom", "meet", "jitsi", "teams", "skype"]);

/** A saved passcode is copied before the room opens, so the phone can paste it. */
export function canAutoJoin(meeting: Pick<Meeting, "platform" | "password">): boolean {
  return VIDEO_ROOMS.has(meeting.platform) && Boolean(meeting.password.trim());
}

/** The listing talks about a passcode, and we do not have one. Open rooms are not included. */
export function passcodeMissing(
  meeting: Pick<Meeting, "platform" | "password" | "notes" | "contactInfo">,
): boolean {
  if (meeting.password.trim()) return false;
  if (!VIDEO_ROOMS.has(meeting.platform)) return false;
  const blob = `${meeting.notes} ${meeting.contactInfo}`;
  if (/no pass(?:word|code)|password:\s*(?:none|no)\b|no password/i.test(blob)) return false;
  return /pass(?:word|code)|access code|\bpwd\b|not published|contacts form/i.test(blob);
}

export function joinLabel(platform: Platform): string {
  switch (platform) {
    case "phone":
      return "Call";
    case "email":
      return "Email";
    case "zoom":
      return "Join Zoom";
    case "jitsi":
      return "Jitsi";
    case "jami":
      return "Jami";
    case "telegram":
      return "Telegram";
    case "whatsapp":
      return "WhatsApp";
    case "meet":
      return "Meet";
    case "discord":
      return "Discord";
    case "signal":
      return "Signal";
    case "teams":
      return "Teams";
    case "skype":
      return "Skype";
    case "inperson":
      return "Go";
    default:
      return "Open";
  }
}

export function joinHint(meeting: Pick<Meeting, "platform" | "meetingId" | "password" | "joinUrl" | "name">): string {
  if (!buildJoinUrl(meeting)) return "Add a room, number, or link to launch this in one tap.";
  switch (meeting.platform) {
    case "zoom":
      return "Opens the Zoom room. A plain passcode is copied first — paste it if the phone still asks. An invite link with Zoom's own pwd token can skip that prompt.";
    case "phone":
      return "Opens the phone dialer.";
    case "email":
      return "Opens a request email.";
    case "jitsi":
      return "Opens a Jitsi room from the name you saved.";
    case "jami":
      return "Opens Jami for this username.";
    case "telegram":
      return "Opens the Telegram chat or invite.";
    case "whatsapp":
      return "Opens WhatsApp, either a number or a group invite.";
    case "inperson":
      return "Opens a map for the place.";
    default:
      return "Opens the saved room.";
  }
}
