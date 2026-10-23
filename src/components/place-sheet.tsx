import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useMeetingStore, useVisibleMeetings, catalogMeetings } from "@/lib/meetings/store";
import { areaId, placeParts, resolvePostal, type PlaceParts } from "@/lib/meetings/places";

const RADII = [25, 80, 200, 500];

export function PlaceSheet({ onClose }: { onClose: () => void }) {
  const filters = useMeetingStore((s) => s.filters);
  const setFilters = useMeetingStore((s) => s.setFilters);
  const custom = useMeetingStore((s) => s.custom);
  const showCatalog = useMeetingStore((s) => s.showCatalog);
  const catalogReady = useMeetingStore((s) => s.catalogReady);
  const count = useVisibleMeetings().length;
  const [code, setCode] = useState(filters.near === "Here" ? "" : filters.near);
  const [note, setNote] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const places = useMemo(() => {
    const names = new Set<string>();
    const lists = showCatalog ? [catalogMeetings(), custom] : [custom];
    for (const list of lists) {
      for (const meeting of list) {
        const name = (meeting.location || "").trim();
        if (name) names.add(name);
      }
    }
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [catalogReady, custom, showCatalog]);

  const classified = useMemo(
    () =>
      places
        .map((name) => ({ name, parts: placeParts(name) }))
        .filter((item): item is { name: string; parts: PlaceParts } => Boolean(item.parts?.continent)),
    [places],
  );

  const continents = unique(classified.map((item) => item.parts.continent));
  const continentOn = filters.areas.filter((id) => id.startsWith("continent:"));
  const countryOn = filters.areas.filter((id) => id.startsWith("country:"));
  const regionOn = filters.areas.filter((id) => id.startsWith("region:"));
  const countries = unique(
    classified
      .filter((item) => !continentOn.length || continentOn.includes(areaId("continent", item.parts)))
      .map((item) => item.parts.country)
      .filter(Boolean),
  );
  const regions = unique(
    classified
      .filter((item) => {
        if (continentOn.length && !continentOn.includes(areaId("continent", item.parts))) return false;
        if (countryOn.length && !countryOn.includes(areaId("country", item.parts))) return false;
        return Boolean(item.parts.region);
      })
      .map((item) => `${item.parts.country}:${item.parts.region}`),
  );
  const query = q.trim().toLowerCase();
  const cities = places.filter((name) => {
    const parts = placeParts(name);
    if (query && !name.toLowerCase().includes(query)) return false;
    if (!parts) return !continentOn.length && !countryOn.length && !regionOn.length;
    if (continentOn.length && !continentOn.includes(areaId("continent", parts))) return false;
    if (countryOn.length && !countryOn.includes(areaId("country", parts))) return false;
    if (regionOn.length && !regionOn.includes(areaId("region", parts))) return false;
    return true;
  });

  function toggleArea(id: string) {
    const areas = filters.areas.includes(id) ? filters.areas.filter((item) => item !== id) : [...filters.areas, id];
    setFilters({ areas });
  }

  function applyCode() {
    const hit = resolvePostal(code);
    if (!hit) {
      setNote("That code isn’t in the local list. Try a US ZIP, Canadian, UK, Australian, or Brazilian code, or use Here.");
      return;
    }
    setNote(hit.coarse ? `${hit.label} is a region, not a street.` : hit.label);
    setFilters({
      near: hit.label,
      originLat: hit.lat,
      originLng: hit.lng,
      radiusKm: filters.radiusKm || (hit.coarse ? 400 : 80),
    });
  }

  function useHere() {
    if (!navigator.geolocation) {
      setNote("This browser has no location of its own.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNote("Using this device.");
        setCode("");
        setFilters({
          near: "Here",
          originLat: pos.coords.latitude,
          originLng: pos.coords.longitude,
          radiusKm: filters.radiusKm || 80,
        });
      },
      () => setNote("Location permission was denied."),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 8_000 },
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <button type="button" className="sheet-backdrop absolute inset-0" aria-label="Close places" onClick={onClose} />
      <div role="dialog" aria-label="Places" className="relative z-10 flex max-h-[88dvh] w-full flex-col rounded-t-xl bg-[var(--color-card)] shadow-2xl md:w-[480px] md:rounded-xl">
        <div className="deco-rule flex items-center justify-between px-4 py-3">
          <div>
            <h2 className="font-display text-2xl tracking-wide">Places</h2>
            <p className="text-xs tracking-wide text-[var(--color-fg-3)] uppercase">{count} meetings</p>
          </div>
          <button type="button" className="rounded-sm bg-[var(--color-bg)] p-2" onClick={onClose} aria-label="Close">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex flex-col gap-3 overflow-y-auto px-4 py-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-[var(--color-gold)] uppercase">Near a code</p>
            <div className="mt-2 flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="ZIP, postcode"
                className="field min-w-0 flex-1"
              />
              <button type="button" className="btn-primary h-10 px-3 text-sm" onClick={applyCode}>
                Near
              </button>
              <button type="button" className="btn-secondary h-10 px-3 text-sm" onClick={useHere}>
                Here
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {RADII.map((km) => (
                <button
                  key={km}
                  type="button"
                  aria-pressed={filters.radiusKm === km}
                  className={`rounded-sm border px-2 py-1 text-xs ${filters.radiusKm === km ? "border-[var(--color-gold)]" : "border-[var(--color-border)]"}`}
                  onClick={() => setFilters({ radiusKm: km })}
                >
                  {km} km
                </button>
              ))}
              <button
                type="button"
                aria-pressed={filters.radiusKm === 0}
                className={`rounded-sm border px-2 py-1 text-xs ${filters.radiusKm === 0 ? "border-[var(--color-gold)]" : "border-[var(--color-border)]"}`}
                onClick={() => setFilters({ radiusKm: 0 })}
              >
                Sort only
              </button>
            </div>
            {filters.near ? <p className="mt-1 text-xs text-[var(--color-fg-2)]">Showing nearest to {filters.near}.</p> : null}
            {note ? <p className="mt-1 text-xs text-[var(--color-fg-3)]">{note}</p> : null}
          </div>
          <Level title="Continent" items={continents.map((name) => ({ id: `continent:${name}`, label: name }))} selected={filters.areas} onToggle={toggleArea} />
          <Level title="Country" items={countries.map((name) => ({ id: `country:${name}`, label: name }))} selected={filters.areas} onToggle={toggleArea} />
          <Level
            title="State or region"
            items={regions.map((key) => ({ id: `region:${key}`, label: key.split(":")[1] || key }))}
            selected={filters.areas}
            onToggle={toggleArea}
          />
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-[var(--color-gold)] uppercase">City</p>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a city" className="field mt-2 w-full" />
            <div className="mt-2 flex max-h-40 flex-wrap gap-2 overflow-y-auto">
              {cities.slice(0, 80).map((name) => {
                const on = filters.locations.includes(name);
                return (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setFilters({
                        locations: on ? filters.locations.filter((item) => item !== name) : [...filters.locations, name],
                      })
                    }
                    className={`px-2 py-1 text-sm ${on ? "border border-[var(--color-gold)] bg-[var(--color-bg)]" : "border border-[var(--color-border)]"}`}
                  >
                    {name}
                  </button>
                );
              })}
              {cities.length === 0 ? <p className="text-sm text-[var(--color-fg-3)]">No city in this area.</p> : null}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border)] px-4 py-3">
          <button
            type="button"
            className="text-xs font-semibold tracking-wide text-[var(--color-primary)] uppercase"
            onClick={() => setFilters({ locations: [], areas: [], near: "", originLat: null, originLng: null })}
          >
            Any place
          </button>
          <button type="button" className="btn-primary h-10 px-4 text-sm" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function Level({
  title,
  items,
  selected,
  onToggle,
}: {
  title: string;
  items: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.14em] text-[var(--color-gold)] uppercase">{title}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((item) => {
          const on = selected.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(item.id)}
              className={`rounded-sm border px-2 py-1 text-sm ${on ? "border-[var(--color-gold)] bg-[var(--color-bg)]" : "border-[var(--color-border)]"}`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
