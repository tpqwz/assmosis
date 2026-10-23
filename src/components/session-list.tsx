import { Plus } from "lucide-react";
import { useMeetingStore, useVisibleMeetings } from "@/lib/meetings/store";
import { groupByCategory, scheduleMeetings, viewerZone } from "@/lib/meetings/schedule";
import { haversineKm } from "@/lib/meetings/places";
import { t } from "@/lib/meetings/i18n";
import { SessionCard } from "./session-card";

export function SessionList() {
  const now = useMeetingStore((s) => s.now);
  const openCreate = useMeetingStore((s) => s.openCreate);
  const meetings = useVisibleMeetings();
  const cardSize = useMeetingStore((s) => s.cardSize);
  const filters = useMeetingStore((s) => s.filters);
  const locale = useMeetingStore((s) => s.locale);
  const customOnly = filters.source === "custom";
  const scheduled = scheduleMeetings(meetings, now, viewerZone());
  if (filters.originLat != null && filters.originLng != null) {
    const lat = filters.originLat;
    const lng = filters.originLng;
    scheduled.sort((a, b) => {
      const da = typeof a.lat === "number" && typeof a.lng === "number" ? haversineKm(lat, lng, a.lat, a.lng) : Number.POSITIVE_INFINITY;
      const db = typeof b.lat === "number" && typeof b.lng === "number" ? haversineKm(lat, lng, b.lat, b.lng) : Number.POSITIVE_INFINITY;
      return da - db || a.nextOccurrence - b.nextOccurrence;
    });
  }
  const groups = groupByCategory(scheduled);
  const any = scheduled.length > 0;

  return (
    <div
      className="session-list mx-auto flex w-full max-w-[520px] flex-col items-center px-4 pb-24"
      data-cards={cardSize}
    >
      {!any ? (
        <div className="mt-16 flex max-w-sm flex-col items-center text-center">
          <p className="text-sm tracking-wide text-[var(--color-fg-2)] uppercase">
            {customOnly ? t(locale, "emptyMine") : t(locale, "noMatch")}
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-fg-3)]">
            {customOnly ? t(locale, "emptyMineDetail") : t(locale, "noMatchDetail")}
          </p>
          <button type="button" className="btn-primary mt-6 h-11 px-5 text-base" onClick={openCreate}>
            <Plus className="size-4" /> {t(locale, "addMeeting")}
          </button>
        </div>
      ) : null}

      {groups.map((group) => {
        if (group.meetings.length === 0 && group.hideIfEmpty) return null;
        if (group.meetings.length === 0) {
          return (
            <section key={group.id} className="mt-7 flex w-full flex-col items-center">
              <h2 className="session-group__title mb-3">{group.title}</h2>
              <p className="text-sm text-[var(--color-fg-3)]">{group.empty}</p>
            </section>
          );
        }
        const limit = group.id === "live" || group.id === "nextHour" ? 24 : 20;
        const shown = group.meetings.slice(0, limit);
        return (
          <section key={group.id} className="mt-7 flex w-full flex-col items-center">
            <h2 className="session-group__title mb-2">{group.title}</h2>
            <div className="flex w-full flex-col items-center gap-2">
              {shown.map((m) => (
                <SessionCard key={m.id} meeting={m} now={now} />
              ))}
            </div>
            {group.meetings.length > limit ? (
              <p className="mt-3 text-center text-xs tracking-wide text-[var(--color-fg-3)] uppercase">
                {limit} of {group.meetings.length}. Narrow the list to see a different set.
              </p>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
