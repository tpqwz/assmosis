import { CalendarPlus, Copy, Pencil, Trash2, MonitorPlay, X, Bell, Star } from "lucide-react";
import { toast } from "sonner";
import { useMeetingStore } from "@/lib/meetings/store";
import {
  formatLocalTime,
  formatLocalWeekday,
  nextOccurrence,
  relativePhrase,
  viewerZone,
  weekdayLong,
} from "@/lib/meetings/schedule";
import { buildZoomAppUrl, copyDetailsText, copyText, formatMeetingId } from "@/lib/meetings/zoom";
import { buildJoinUrl, joinHint } from "@/lib/meetings/platforms";
import { programById, localizedProgram } from "@/lib/meetings/programs";
import { t } from "@/lib/meetings/i18n";
import { TAG_KEYS, type MeetingTag } from "@/lib/meetings/tags";
import { requestNotify } from "@/lib/meetings/alerts";
import { JoinButton } from "./join-button";

export function SessionDetails() {
  const selectedId = useMeetingStore((s) => s.selectedId);
  const meeting = useMeetingStore((s) => (s.selectedId ? s.getMeeting(s.selectedId) : undefined));
  const now = useMeetingStore((s) => s.now);
  const selectMeeting = useMeetingStore((s) => s.selectMeeting);
  const openEdit = useMeetingStore((s) => s.openEdit);
  const deleteCustom = useMeetingStore((s) => s.deleteCustom);
  const hideCatalog = useMeetingStore((s) => s.hideCatalog);
  const programs = useMeetingStore((s) => s.programs);
  const locale = useMeetingStore((s) => s.locale);
  const groups = useMeetingStore((s) => s.groups);
  const alertOn = useMeetingStore((s) => (selectedId ? s.alertIds.includes(selectedId) : false));
  const favoriteOn = useMeetingStore((s) => (selectedId ? s.favoriteMeetingIds.includes(selectedId) : false));
  const toggleAlert = useMeetingStore((s) => s.toggleAlert);
  const toggleFavorite = useMeetingStore((s) => s.toggleFavoriteMeeting);
  const setAlertsEnabled = useMeetingStore((s) => s.setAlertsEnabled);

  if (!selectedId || !meeting) return null;

  const zone = viewerZone();
  const next = nextOccurrence(meeting, now) ?? now;
  const isLive = next <= now;
  const joinUrl = buildJoinUrl(meeting);
  const appUrl = meeting.platform === "zoom" ? buildZoomAppUrl(meeting) : null;
  const program = programById(programs, meeting.programId || "aca");
  const shown = program ? localizedProgram(program, locale) : null;
  const group = groups.find((g) => g.id === meeting.groupId);
  const when = `Every ${formatLocalWeekday(next, zone, "long")} · ${formatLocalTime(next, zone)}`;
  const details = copyDetailsText(meeting, when, joinUrl);

  function close() {
    selectMeeting(null);
  }

  async function copyField(label: string, value: string) {
    if (!value) return;
    const ok = await copyText(value);
    toast(ok ? `${label} copied` : "Could not copy");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <button type="button" className="sheet-backdrop absolute inset-0" aria-label="Close meeting" onClick={close} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative z-10 flex max-h-[92dvh] w-full flex-col overflow-y-auto rounded-t-xl bg-[var(--color-card)] shadow-2xl md:w-[500px] md:rounded-xl"
      >
        <button
          type="button"
          id="modal-close"
          className="sticky top-0 z-2 ml-auto mt-1 mr-3 rounded-lg bg-[var(--color-bg)] px-3 py-1.5 text-[var(--color-primary)]"
          onClick={close}
          aria-label="Close"
        >
          <X className="size-5" />
        </button>

        <div className="mx-6 mt-1">
          <div className="flex items-center text-[12px] tracking-wide text-[var(--color-fg-3)] uppercase">
            {isLive ? (
              <span className="badge-live mr-2 inline-flex items-center gap-1">
                <span className="live-dot" /> {t(locale, "live")}
              </span>
            ) : null}
            {meeting.source === "custom" ? <span className="badge-mine mr-2">{t(locale, "mine")}</span> : null}
            {shown ? <span className="badge-program mr-2">{shown.short}</span> : null}
            {(meeting.tags || []).map((tag) => (
              <span key={tag} className="badge-program mr-2">
                {t(locale, TAG_KEYS[tag as MeetingTag] || tag)}
              </span>
            ))}
            <span>
              {isLive ? t(locale, "started") : t(locale, "starting")}{" "}
              <span className="text-[var(--color-primary)]">{relativePhrase(now, next)}</span>
            </span>
          </div>
          <h3 id="modal-title" className="mt-2 mb-1 font-display text-3xl leading-tight text-[var(--color-fg)]">
            {meeting.name}
          </h3>
          <div className="text-sm text-[var(--color-fg-3)]">
            {shown?.name}
            {group ? ` · ${group.name}` : ""}
          </div>
          <div className="text-[var(--color-fg-3)] opacity-80">
            Every {formatLocalWeekday(next, zone, "long")} · {formatLocalTime(next, zone)}
          </div>
          <div className="mt-1 text-xs text-[var(--color-fg-3)]">
            {weekdayLong(meeting.weekday)} {meeting.hour.toString().padStart(2, "0")}:
            {meeting.minute.toString().padStart(2, "0")} {meeting.zone.replace(/_/g, " ")} · {meeting.durationMinutes} min
          </div>
          {meeting.language || meeting.location ? (
            <div className="mt-1 text-xs tracking-wide text-[var(--color-fg-2)] uppercase">
              {[meeting.language, meeting.location].filter(Boolean).join(" · ")}
            </div>
          ) : null}
        </div>

        <div className="mx-4 mt-4 mb-2 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            className="btn-secondary h-11 px-3 text-sm"
            onClick={() => copyField("Details", details)}
          >
            <Copy className="size-4" /> Copy
          </button>
          <button type="button" className="btn-secondary h-11 px-3 text-sm" onClick={() => addToCalendar(meeting, next)}>
            <CalendarPlus className="size-4" /> Calendar
          </button>
          <button type="button" className="btn-secondary h-11 px-3 text-sm" onClick={() => toggleFavorite(meeting.id)}>
            <Star className="size-4" fill={favoriteOn ? "currentColor" : "none"} />
            {favoriteOn ? t(locale, "favorited") : t(locale, "favorite")}
          </button>
          <button
            type="button"
            className="btn-secondary h-11 px-3 text-sm"
            onClick={async () => {
              if (!alertOn) {
                const perm = await requestNotify();
                if (perm !== "granted") {
                  toast("Allow notifications to mark reminders");
                  return;
                }
                setAlertsEnabled(true);
              }
              toggleAlert(meeting.id);
            }}
          >
            <Bell className="size-4" fill={alertOn ? "currentColor" : "none"} />
            {alertOn ? "Reminder on" : "Remind me"}
          </button>
          <JoinButton meeting={meeting} size="lg" stopPropagation={false} />
        </div>
        <p className="mx-6 mb-3 text-xs text-[var(--color-fg-3)]">{joinHint(meeting)}</p>

        <div className="bg-[var(--color-bg-3)] px-4 py-3 text-lg">
          {meeting.meetingId ? (
            <button
              type="button"
              className="mb-3 flex w-full items-center justify-between text-left"
              onClick={() => copyField("Meeting ID", meeting.meetingId)}
            >
              <strong className="mr-2 text-base">
                {meeting.platform === "phone" ? "Phone" : meeting.platform === "inperson" ? "Place" : "Room"}
              </strong>
              <span className="text-[var(--color-primary)]">
                {meeting.platform === "zoom" ? formatMeetingId(meeting.meetingId) : meeting.meetingId}
              </span>
            </button>
          ) : null}
          {meeting.password ? (
            <button
              type="button"
              className="flex w-full items-center justify-between text-left"
              onClick={() => copyField("Password", meeting.password)}
            >
              <strong className="mr-2 text-base">{meeting.platform === "phone" ? "Access code" : "Password"}</strong>
              <span className="text-[var(--color-primary)]">{meeting.password}</span>
            </button>
          ) : null}
          {joinUrl ? (
            <button
              type="button"
              className="mt-3 flex w-full items-center justify-between gap-3 text-left"
              onClick={() => copyField("Join link", joinUrl)}
            >
              <strong className="shrink-0 text-base">Join URL</strong>
              <span className="truncate text-sm text-[var(--color-primary)]">{joinUrl}</span>
            </button>
          ) : null}
        </div>

        {appUrl ? (
          <a
            href={appUrl}
            className="mx-6 mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]"
          >
            <MonitorPlay className="size-4" /> Open in Zoom app
          </a>
        ) : null}

        {meeting.notes ? (
          <div className="mx-6 mt-4 mb-2">
            <h4 className="mb-1 text-sm tracking-wide text-[var(--color-fg-2)] uppercase">Notes</h4>
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed break-words">{meeting.notes}</p>
          </div>
        ) : null}

        <div className="mx-6 mt-3 mb-4">
          <h4 className="mb-1 text-sm tracking-wide text-[var(--color-fg-2)] uppercase">Contact</h4>
          {meeting.contactInfo ? (
            <p className="break-words">{meeting.contactInfo}</p>
          ) : (
            <p className="opacity-60">No contact info provided.</p>
          )}
        </div>

        <div className="mx-6 mb-8 flex flex-wrap gap-2">
          {meeting.source === "custom" ? (
            <>
              <button type="button" className="btn-secondary h-11 px-4" onClick={() => openEdit(meeting.id)}>
                <Pencil className="size-4" /> Edit
              </button>
              <button
                type="button"
                className="btn-secondary h-11 px-4 text-[var(--color-live)]"
                onClick={() => {
                  if (confirm(`Delete “${meeting.name}”?`)) deleteCustom(meeting.id);
                }}
              >
                <Trash2 className="size-4" /> Delete
              </button>
            </>
          ) : (
            <button type="button" className="btn-secondary h-11 px-4" onClick={() => hideCatalog(meeting.id)}>
              Hide from my list
            </button>
          )}
        </div>
        <div className="h-2 w-full bg-[image:var(--brand-gradient)] bg-[length:100%_100%]" />
      </div>
    </div>
  );
}

function addToCalendar(meeting: { name: string; notes: string; durationMinutes: number }, startMs: number) {
  const end = startMs + meeting.durationMinutes * 60_000;
  const stamp = (ms: number) =>
    new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TheRooms//EN",
    "BEGIN:VEVENT",
    `UID:${meeting.name}-${stamp(startMs)}@nextmeeting`,
    `DTSTAMP:${stamp(Date.now())}`,
    `DTSTART:${stamp(startMs)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escapeIcs(meeting.name)}`,
    `DESCRIPTION:${escapeIcs(meeting.notes)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${meeting.name.replace(/[^\w]+/g, "-")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
  toast("Calendar event saved");
}

function escapeIcs(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
