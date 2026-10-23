import type { Meeting, MeetingDraft, Platform } from "./types";

export function zoomDigits(id: string): string {
  return (id || "").replace(/\D/g, "");
}

export function formatMeetingId(id: string): string {
  const raw = (id || "").trim();
  if (!raw) return "";
  if (raw.startsWith("+") || raw.toLowerCase().startsWith("tel:")) return raw.replace(/^tel:/i, "");
  const d = zoomDigits(raw);
  if (d.length < 9 || d.length > 13) return raw;
  if (d.length === 9) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  if (d.length === 10) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  if (d.length === 11) return `${d.slice(0, 3)} ${d.slice(3, 7)} ${d.slice(7)}`;
  return d.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
}

function extractZoomIdFromUrl(url: string): string {
  const m = url.match(/zoom\.us\/(?:j|w|wc\/join)\/(\d+)/i);
  return m?.[1] ?? "";
}

function extractPwdFromUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.searchParams.get("pwd") ?? "";
  } catch {
    const m = url.match(/[?&]pwd=([^&\s]+)/i);
    return m?.[1] ? decodeURIComponent(m[1]) : "";
  }
}

export function buildZoomJoinUrl(meeting: Pick<Meeting, "meetingId" | "password" | "joinUrl" | "platform">): string | null {
  const join = (meeting.joinUrl || "").trim();
  const pwd = (meeting.password || "").trim();

  if (join) {
    if (join.startsWith("mailto:") || join.startsWith("tel:")) return join;
    if (/zoom\.us/i.test(join)) {
      try {
        const u = new URL(join);
        if (pwd && !u.searchParams.get("pwd")) u.searchParams.set("pwd", pwd);
        return u.toString();
      } catch {
        if (pwd && !/[?&]pwd=/.test(join)) {
          return `${join}${join.includes("?") ? "&" : "?"}pwd=${encodeURIComponent(pwd)}`;
        }
        return join;
      }
    }
    return join;
  }

  if (meeting.platform === "phone") {
    const num = (meeting.meetingId || "").replace(/^tel:/i, "");
    return num ? `tel:${num}` : null;
  }

  const id = zoomDigits(meeting.meetingId);
  if (id.length >= 9) {
    const u = new URL(`https://zoom.us/j/${id}`);
    if (pwd) u.searchParams.set("pwd", pwd);
    return u.toString();
  }
  return null;
}

export function buildZoomAppUrl(meeting: Pick<Meeting, "meetingId" | "password" | "joinUrl">): string | null {
  const id = zoomDigits(meeting.meetingId) || extractZoomIdFromUrl(meeting.joinUrl || "");
  if (id.length < 9) return null;
  const params = new URLSearchParams({ action: "join", confno: id });
  const pwd = (meeting.password || "").trim();
  if (pwd) params.set("pwd", pwd);
  return `zoommtg://zoom.us/join?${params.toString()}`;
}

export function joinLabel(platform: Platform): string {
  if (platform === "phone") return "Call";
  if (platform === "email") return "Email";
  if (platform === "zoom") return "Join Zoom";
  return "Join";
}

export function joinHint(meeting: Pick<Meeting, "platform" | "meetingId" | "password" | "joinUrl">): string {
  if (meeting.platform === "phone") return "Opens your phone dialer";
  if (meeting.platform === "email") return "Opens a request email";
  if (buildZoomJoinUrl(meeting)) {
    const constructed = !(meeting.joinUrl || "").includes("zoom.us");
    return constructed
      ? "Builds the Zoom link from room ID + password"
      : "Opens the Zoom room with password attached";
  }
  return "No join link yet — add a Zoom ID";
}

export function copyDetailsText(meeting: Meeting, whenLabel: string, joinUrl: string | null) {
  const lines = [
    meeting.name,
    whenLabel,
    joinUrl ? `Join: ${joinUrl}` : "",
    meeting.meetingId ? `Meeting ID: ${formatMeetingId(meeting.meetingId)}` : "",
    meeting.password ? `Password: ${meeting.password}` : "",
    meeting.language ? `Language: ${meeting.language}` : "",
    meeting.location ? `Place: ${meeting.location}` : "",
    meeting.notes ? `Notes: ${meeting.notes}` : "",
  ].filter(Boolean);
  return lines.join("\n");
}

const ZOOM_URL_RE = /https?:\/\/[^\s]*zoom\.us\/(?:j|w|wc\/join)\/(\d+)(?:\?[^\s]*)?/i;

export function parseZoomInvite(text: string): Partial<MeetingDraft> {
  const raw = text.trim();
  if (!raw) return {};
  const draft: Partial<MeetingDraft> = { platform: "zoom" };

  const urlMatch = raw.match(ZOOM_URL_RE);
  if (urlMatch) {
    draft.joinUrl = urlMatch[0].replace(/[).,]+$/, "");
    draft.meetingId = formatMeetingId(urlMatch[1] ?? "");
    const pwd = extractPwdFromUrl(draft.joinUrl);
    // Encrypted Zoom pwd hashes are long; keep them on the URL, not as the passcode field.
    if (pwd && pwd.length <= 32 && !/%/.test(pwd)) draft.password = pwd;
  }

  const idMatch = raw.match(/Meeting ID:\s*([\d\s-]+)/i);
  if (idMatch?.[1]) draft.meetingId = formatMeetingId(idMatch[1]);

  const pwdMatch = raw.match(/(?:Passcode|Password|Pwd):\s*([^\s\n]+)/i);
  if (pwdMatch?.[1]) draft.password = pwdMatch[1].replace(/[).,]+$/, "");

  const nameMatch = raw.match(/Topic:\s*(.+)/i);
  if (nameMatch?.[1]) draft.name = nameMatch[1].trim();

  return draft;
}

export function copyTextNow(text: string): boolean {
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.top = "0";
    el.style.left = "0";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.focus();
    el.select();
    el.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    if (ok) {
      void navigator.clipboard?.writeText(text).catch(() => {});
      return true;
    }
  } catch {
    /* fall through */
  }
  return false;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
}
