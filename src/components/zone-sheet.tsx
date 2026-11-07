import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useMeetingStore } from "@/lib/meetings/store";
import { deviceZone } from "@/lib/meetings/schedule";
import { TIMEZONES } from "@/lib/meetings/types";

/** Changes how the list prints a time. It does not touch a meeting's own clock. */
export function ZoneSheet() {
  const open = useMeetingStore((s) => s.zoneOpen);
  const chosen = useMeetingStore((s) => s.displayZone);
  const setDisplayZone = useMeetingStore((s) => s.setDisplayZone);
  const setZoneOpen = useMeetingStore((s) => s.setZoneOpen);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setZoneOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setZoneOpen]);

  if (!open) return null;

  const device = deviceZone();
  const zones = (TIMEZONES as readonly string[]).includes(device) ? [...TIMEZONES] : [device, ...TIMEZONES];
  const query = q.trim().toLowerCase().replace(/\s+/g, "");
  const shown = zones.filter((zone) => !query || zone.toLowerCase().replace(/[/_]/g, "").includes(query.replace(/[/_]/g, "")));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <button type="button" className="sheet-backdrop absolute inset-0" aria-label="Close time zone" onClick={() => setZoneOpen(false)} />
      <div
        role="dialog"
        aria-label="Times shown in"
        className="relative z-10 flex max-h-[86dvh] w-full flex-col rounded-t-xl bg-[var(--color-card)] shadow-2xl md:w-[440px] md:rounded-xl"
      >
        <div className="deco-rule flex items-center justify-between px-4 py-3">
          <div className="min-w-0 pr-3">
            <h2 className="font-display text-2xl tracking-wide">Times shown in</h2>
            <p className="mt-1 text-sm leading-relaxed text-[var(--color-fg-3)] normal-case">
              This is the list's clock. A meeting keeps the time zone it was saved with.
            </p>
          </div>
          <button type="button" className="rounded-sm bg-[var(--color-bg)] p-2" onClick={() => setZoneOpen(false)} aria-label="Close">
            <X className="size-5" />
          </button>
        </div>
        <div className="px-4 pt-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a time zone" className="field w-full" autoFocus />
        </div>
        <div className="mt-3 flex flex-col gap-2 overflow-y-auto px-4 pb-4">
          <ZoneChoice
            selected={!chosen}
            title="This device"
            detail={device.replace(/_/g, " ")}
            onClick={() => {
              setDisplayZone("");
              setZoneOpen(false);
            }}
          />
          {shown.map((zone) => (
            <ZoneChoice
              key={zone}
              selected={chosen === zone}
              title={zone.replace(/_/g, " ")}
              detail={zone === device ? "Same as this device, and it stays if you travel" : ""}
              onClick={() => {
                setDisplayZone(zone);
                setZoneOpen(false);
              }}
            />
          ))}
          {shown.length === 0 ? <p className="text-sm text-[var(--color-fg-3)]">Nothing matches.</p> : null}
        </div>
      </div>
    </div>
  );
}

function ZoneChoice({
  selected,
  title,
  detail,
  onClick,
}: {
  selected: boolean;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`px-3 py-2 text-left ${selected ? "border border-[var(--color-gold)] bg-[var(--color-bg)]" : "border border-[var(--color-border)]"}`}
    >
      <span className="block text-sm font-semibold">{title}</span>
      {detail ? <span className="block text-xs text-[var(--color-fg-3)]">{detail}</span> : null}
    </button>
  );
}