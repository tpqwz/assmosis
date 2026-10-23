import { useEffect } from "react";
import { useMeetingStore } from "@/lib/meetings/store";
import { scheduleMeetings, viewerZone } from "@/lib/meetings/schedule";
import { claimReminder, showNotification } from "@/lib/meetings/alerts";
import type { ScheduledMeeting } from "@/lib/meetings/types";

export function AlertWatcher() {
  const hydrated = useMeetingStore((s) => s.hydrated);
  const alertsEnabled = useMeetingStore((s) => s.alertsEnabled);
  const alertIds = useMeetingStore((s) => s.alertIds);
  const alertFavorites = useMeetingStore((s) => s.alertFavorites);
  const favoriteMeetings = useMeetingStore((s) => s.favoriteMeetingIds);
  const favoritePrograms = useMeetingStore((s) => s.favoriteProgramIds);
  const favoriteGroups = useMeetingStore((s) => s.favoriteGroupIds);
  const lead = useMeetingStore((s) => s.alertLeadMinutes);
  const now = useMeetingStore((s) => s.now);
  const custom = useMeetingStore((s) => s.custom);
  const hiddenIds = useMeetingStore((s) => s.hiddenIds);
  const showCatalog = useMeetingStore((s) => s.showCatalog);

  useEffect(() => {
    if (!hydrated || !alertsEnabled) return;
    if (!alertIds.length && !alertFavorites) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const state = useMeetingStore.getState();
    const wanted = state.allMeetings().filter((meeting) => {
      if (alertIds.includes(meeting.id)) return true;
      if (!alertFavorites) return false;
      return (
        favoriteMeetings.includes(meeting.id) ||
        favoritePrograms.includes(meeting.programId || "") ||
        (meeting.groupId ? favoriteGroups.includes(meeting.groupId) : false)
      );
    });
    if (!wanted.length) return;
    const scheduled = scheduleMeetings(wanted, Date.now(), viewerZone());
    const leadMs = lead * 60_000;
    const due = scheduled.filter((meeting) => {
      const delta = meeting.nextOccurrence - Date.now();
      return delta <= leadMs && delta >= -2 * 60_000;
    });
    const marked = due.filter((meeting) => alertIds.includes(meeting.id));
    const extras = due.filter((meeting) => !alertIds.includes(meeting.id));
    for (const meeting of marked) notifyOne(meeting);
    if (extras.length === 1) notifyOne(extras[0]);
    else if (extras.length > 1) {
      const key = `favorites:${extras.map((meeting) => meeting.id).sort().join(",")}`;
      if (claimReminder(key)) {
        const names = extras.slice(0, 3).map((meeting) => meeting.name).join(", ");
        void showNotification(
          `${extras.length} favorite meetings`,
          extras.length > 3 ? `${names}…` : names,
          key,
        );
      }
    }
  }, [
    hydrated,
    alertsEnabled,
    alertIds,
    alertFavorites,
    favoriteMeetings,
    favoritePrograms,
    favoriteGroups,
    lead,
    now,
    custom,
    hiddenIds,
    showCatalog,
  ]);

  return null;
}

function notifyOne(meeting: ScheduledMeeting) {
  const delta = meeting.nextOccurrence - Date.now();
  const key = `${meeting.id}:${meeting.nextOccurrence}`;
  if (!claimReminder(key)) return;
  const mins = Math.max(0, Math.round(delta / 60_000));
  const body = mins <= 0 ? "Starting now" : `Starts in ${mins} min`;
  void showNotification(meeting.name, body, key);
}