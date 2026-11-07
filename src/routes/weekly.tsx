import { useLayoutEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";
import { useMeetingStore, useVisibleMeetings, useShownZone } from "@/lib/meetings/store";
import { registerOfflineShell } from "@/lib/meetings/idb";
import { groupByWeekday, scheduleMeetings, formatLocalTime } from "@/lib/meetings/schedule";
import { ZoneSheet } from "@/components/zone-sheet";
import { formatMeetingId, buildZoomJoinUrl } from "@/lib/meetings/zoom";

export const Route = createFileRoute("/weekly")({ component: WeeklyPage });

function WeeklyPage() {
  const hydrate = useMeetingStore((s) => s.hydrate);
  const hydrated = useMeetingStore((s) => s.hydrated);
  const now = useMeetingStore((s) => s.now);
  const meetings = useVisibleMeetings();
  const setZoneOpen = useMeetingStore((s) => s.setZoneOpen);
  const zone = useShownZone();

  useLayoutEffect(() => {
    hydrate();
    registerOfflineShell();
  }, [hydrate]);

  const scheduled = scheduleMeetings(meetings, now, zone);
  const days = groupByWeekday(scheduled, zone);

  return (
    <div className="min-h-dvh bg-[var(--color-bg)] text-[var(--color-fg)] print:bg-white print:text-black">
      <header className="brand-gradient print:hidden sticky top-0 z-20 flex items-center justify-between px-3 py-2 text-white shadow-[var(--shadow-nav)]">
        <Link to="/" className="flex h-11 items-center gap-1 px-2 font-semibold">
          <ArrowLeft className="size-5" /> Back
        </Link>
        <h1 className="wordmark text-base">Weekly</h1>
        <button type="button" className="flex h-11 items-center gap-1 px-2" onClick={() => window.print()}>
          <Printer className="size-5" /> Print
        </button>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <p className="mb-6 text-center text-sm text-[var(--color-fg-3)] print:text-neutral-600">
          {hydrated ? (
            <button type="button" className="underline decoration-[var(--color-border)] underline-offset-4" onClick={() => setZoneOpen(true)}>
              Times shown in {zone.replace(/_/g, " ")}
            </button>
          ) : (
            "Loading weekly list…"
          )}
          {hydrated ? ` · ${scheduled.length} meetings` : ""}
        </p>
        {hydrated
          ? days.map((day) => (
              <section key={day.value} className="mb-6 break-inside-avoid">
                <h2 className="mb-2 border-b-2 border-[var(--color-primary)] pb-1 text-sm font-bold tracking-wider text-[var(--color-fg-2)] uppercase">
                  {day.long}
                </h2>
                {day.meetings.length === 0 ? (
                  <p className="text-sm text-[var(--color-fg-3)]">No meetings</p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {day.meetings.map((m) => {
                      const url = buildZoomJoinUrl(m);
                      return (
                        <li key={m.id} className="grid grid-cols-[72px_1fr] items-baseline gap-2 text-sm sm:grid-cols-[72px_1fr_auto]">
                          <span className="font-semibold tabular-nums text-[var(--color-primary)]">
                            {formatLocalTime(m.nextOccurrence, zone)}
                          </span>
                          <span>
                            <span className="font-medium">{m.name}</span>
                            {m.source === "custom" ? <span className="ml-1 text-[10px] uppercase">mine</span> : null}
                            {m.meetingId ? (
                              <span className="mt-0.5 block text-xs text-[var(--color-fg-3)]">
                                {m.platform === "zoom" ? formatMeetingId(m.meetingId) : m.meetingId}
                                {m.password ? ` · pw ${m.password}` : ""}
                              </span>
                            ) : null}
                            {url ? (
                              <span className="block text-[11px] break-all text-[var(--color-fg-3)] print:text-black">{url}</span>
                            ) : null}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            ))
          : null}
      </main>
      <ZoneSheet />
    </div>
  );
}
