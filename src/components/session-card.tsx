import { Bell, Star } from "lucide-react";
import { toast } from "sonner";
import type { ScheduledMeeting } from "@/lib/meetings/types";
import {
  formatLocalTime,
  formatLocalWeekday,
  isInNext24Hours,
  relativePhrase,
} from "@/lib/meetings/schedule";
import { useMeetingStore, useShownZone } from "@/lib/meetings/store";
import { programById, localizedProgram } from "@/lib/meetings/programs";
import { t } from "@/lib/meetings/i18n";
import { TAG_KEYS, type MeetingTag } from "@/lib/meetings/tags";
import { requestNotify } from "@/lib/meetings/alerts";
import { listExpired, listWindow } from "@/lib/meetings/list-window";
import { JoinButton } from "./join-button";

export function SessionCard({ meeting, now }: { meeting: ScheduledMeeting; now: number }) {
  const selectMeeting = useMeetingStore((s) => s.selectMeeting);
  const alertOn = useMeetingStore((s) => s.alertIds.includes(meeting.id));
  const favoriteOn = useMeetingStore((s) => s.favoriteMeetingIds.includes(meeting.id) || s.favoriteProgramIds.includes(meeting.programId || "") || (meeting.groupId ? s.favoriteGroupIds.includes(meeting.groupId) : false));
  const toggleAlert = useMeetingStore((s) => s.toggleAlert);
  const setAlertsEnabled = useMeetingStore((s) => s.setAlertsEnabled);
  const programs = useMeetingStore((s) => s.programs);
  const locale = useMeetingStore((s) => s.locale);
  const zone = useShownZone();
  const soon = isInNext24Hours(meeting.nextOccurrence, now);
  const upcoming = meeting.nextOccurrence > now;
  const rel = relativePhrase(now, meeting.nextOccurrence);
  const program = programById(programs, meeting.programId || "");
  const shown = program ? localizedProgram(program, locale) : null;
  const showProgram = Boolean(program && meeting.programId);
  const copied = listWindow(meeting);

  async function onBell() {
    if (!alertOn) {
      const perm = await requestNotify();
      if (perm !== "granted") {
        toast("Allow notifications to mark reminders");
        return;
      }
      setAlertsEnabled(true);
    }
    toggleAlert(meeting.id);
  }

  return (
    <article className="session-card">
      <button
        type="button"
        className="flex min-w-0 flex-1 flex-col-reverse items-start py-1 text-left"
        onClick={() => selectMeeting(meeting.id)}
      >
        <h3 className="flex flex-wrap items-baseline gap-x-2 text-[18px] leading-tight font-normal text-[var(--color-fg)]">
          {showProgram && shown ? <span className="badge-program">{shown.short}</span> : null}
          <span>{meeting.name}</span>
        </h3>
        <div className="mb-1 flex flex-wrap items-center gap-x-1 text-[10px] tracking-wide text-[var(--color-fg-3)] uppercase">
          {meeting.isLive ? (
            <span className="badge-live mr-1 inline-flex items-center gap-1">
              <span className="live-dot" /> {t(locale, "live")}
            </span>
          ) : null}
          {meeting.source === "custom" ? <span className="badge-mine mr-1">{t(locale, "mine")}</span> : null}
          {listExpired(meeting, now) ? <span className="badge-program mr-1">Expired</span> : null}
          {copied ? <span className="mr-1 normal-case">copied {copied.short}</span> : null}
          {favoriteOn ? <Star className="mr-1 size-3 fill-current text-[var(--color-gold)]" aria-label={t(locale, "favorited")} /> : null}
          {!soon ? <span className="mr-1">{formatLocalWeekday(meeting.nextOccurrence, zone)}</span> : null}
          {upcoming ? (
            <span className="mr-1 whitespace-nowrap text-[var(--color-primary)]">
              {formatLocalTime(meeting.nextOccurrence, zone)}
            </span>
          ) : null}
          {upcoming && soon ? <span className="mr-1">•</span> : null}
          {soon ? (
            <span>
              {meeting.isLive ? t(locale, "started") : t(locale, "starting")}{" "}
              <span className="text-[var(--color-primary)]">{rel}</span>
            </span>
          ) : null}
          {(meeting.tags || []).map((tag) => (
            <span key={tag} className="badge-program mr-1 normal-case">
              {t(locale, TAG_KEYS[tag as MeetingTag] || tag)}
            </span>
          ))}
        </div>
      </button>
      <div className="ml-2 flex h-full items-center gap-1">
        <button
          type="button"
          className="bell-btn"
          data-on={alertOn}
          aria-label={alertOn ? t(locale, "remindOn") : t(locale, "remindOff")}
          aria-pressed={alertOn}
          onClick={onBell}
        >
          <Bell className="size-4" fill={alertOn ? "currentColor" : "none"} />
        </button>
        <JoinButton meeting={meeting} />
      </div>
    </article>
  );
}
