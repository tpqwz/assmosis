import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMeetingStore, useVisibleMeetings, useShownZone, catalogMeetings, filterMeetings } from "@/lib/meetings/store";
import { WEEKDAYS } from "@/lib/meetings/types";
import { PLATFORMS } from "@/lib/meetings/platforms";
import { listExpired } from "@/lib/meetings/list-window";
import { BUILTIN_PROGRAMS, LIST_SCOPE, localizedProgram } from "@/lib/meetings/programs";
import { t } from "@/lib/meetings/i18n";
import { TAGS, TAG_KEYS } from "@/lib/meetings/tags";
import { PlaceSheet } from "./place-sheet";

export function ActionBar() {
  const filters = useMeetingStore((s) => s.filters);
  const setFilters = useMeetingStore((s) => s.setFilters);
  const clearFilters = useMeetingStore((s) => s.clearFilters);
  const customCount = useMeetingStore((s) => s.custom.length);
  const customPrograms = useMeetingStore((s) => s.programs);
  const customMeetings = useMeetingStore((s) => s.custom);
  const hiddenIds = useMeetingStore((s) => s.hiddenIds);
  const favoriteMeetings = useMeetingStore((s) => s.favoriteMeetingIds);
  const favoritePrograms = useMeetingStore((s) => s.favoriteProgramIds);
  const favoriteGroups = useMeetingStore((s) => s.favoriteGroupIds);
  const showCatalog = useMeetingStore((s) => s.showCatalog);
  const showExpired = useMeetingStore((s) => s.showExpired);
  const catalogReady = useMeetingStore((s) => s.catalogReady);
  const visible = useVisibleMeetings();
  const hydrated = useMeetingStore((s) => s.hydrated);
  const setZoneOpen = useMeetingStore((s) => s.setZoneOpen);
  const barPlace = useMeetingStore((s) => s.barPlace);
  const locale = useMeetingStore((s) => s.locale);
  const label = (key: string) => t(locale, key);
  const docked = barPlace === "bottom";
  const zone = useShownZone();
  const programs = useMemo(() => [...BUILTIN_PROGRAMS, ...customPrograms], [customPrograms]);
  const [sheet, setSheet] = useState<"programs" | "languages" | "locations" | "ways" | null>(null);
  const filtering = Boolean(
    filters.q ||
      filters.day ||
      filters.who ||
      filters.platform ||
      filters.source ||
      filters.programs.length ||
      filters.languages.length ||
      filters.locations.length ||
      filters.areas.length ||
      filters.modes.length ||
      filters.tags.length ||
      filters.favorites ||
      filters.hideMissingPasscode ||
      filters.near ||
      filters.originLat != null,
  );
  const wayNames = new Map<string, string>([
    ["inperson", label("inPerson")],
    ["online", label("online")],
    ["phone", label("phone")],
    ...PLATFORMS.map((p) => [p.id, p.label] as const),
  ]);
  const wayLabel = summarize(
    [
      ...filters.modes.map((id) => wayNames.get(id) || id),
      ...filters.tags.map((id) => label(TAG_KEYS[id as keyof typeof TAG_KEYS] || id)),
      ...(filters.hideMissingPasscode ? [label("hideMissingPasscode")] : []),
    ],
    label("anyWay"),
    "ways",
  );
  const programLabel = summarize(
    filters.programs.map((id) => {
      const program = programs.find((p) => p.id === id);
      return program ? localizedProgram(program, locale).short : id;
    }),
    label("anyProgram"),
    "programs",
  );
  const languageChoices = useMemo(
    () => distinctValues(showCatalog ? catalogMeetings() : [], customMeetings, "language"),
    [catalogReady, customMeetings, showCatalog],
  );
  const programCounts = useMemo(() => {
    const counts = new Map<string, number>();
    const list = [
      ...(showCatalog ? catalogMeetings().filter((m) => !hiddenIds.includes(m.id)) : []),
      ...customMeetings,
    ];
    for (const meeting of list) {
      if (!showExpired && listExpired(meeting)) continue;
      const id = meeting.programId || "aca";
      counts.set(id, (counts.get(id) || 0) + 1);
    }
    return counts;
  }, [catalogReady, customMeetings, hiddenIds, showCatalog, showExpired]);
  const tagOptions = useMemo(() => {
    const list = [
      ...(showCatalog ? catalogMeetings().filter((m) => !hiddenIds.includes(m.id)) : []),
      ...customMeetings,
    ];
    const pool = filterMeetings(
      list,
      { ...filters, tags: [], q: "" },
      Date.now(),
      zone,
      programs,
      [],
      { meetings: favoriteMeetings, programs: favoritePrograms, groups: favoriteGroups },
      showExpired,
    );
    const present = new Set(pool.flatMap((m) => m.tags || []));
    for (const id of filters.tags) present.add(id);
    return TAGS.filter((id) => present.has(id)).map((id) => ({
      id,
      label: t(locale, TAG_KEYS[id]),
      group: t(locale, "aboutMeeting"),
    }));
  }, [
    customMeetings,
    filters.programs,
    filters.languages,
    filters.locations,
    filters.areas,
    filters.modes,
    filters.tags,
    filters.day,
    filters.who,
    filters.source,
    filters.near,
    filters.originLat,
    filters.originLng,
    filters.radiusKm,
    hiddenIds,
    favoriteMeetings,
    favoritePrograms,
    favoriteGroups,
    locale,
    programs,
    showCatalog,
    showExpired,
    catalogReady,
    zone,
  ]);

  return (
    <div
      className={
        docked
          ? "fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border)] bg-[var(--color-card)] pb-[max(10px,env(safe-area-inset-bottom))] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
          : "border-b border-[var(--color-border)] bg-[var(--color-card)]"
      }
    >
      <div className="mx-auto flex max-w-[900px] flex-wrap items-center gap-2.5 px-3 py-2.5">
        <label className="flex min-w-0 flex-1 basis-[220px] items-center gap-2 rounded-sm border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 text-[var(--color-fg-3)] focus-within:border-[var(--color-gold)]">
          <Search className="size-4 shrink-0" />
          <input
            value={filters.q}
            onChange={(e) => setFilters({ q: e.target.value })}
            placeholder="Search meetings"
            className="min-w-0 flex-1 bg-transparent py-2.5 text-base text-[var(--color-fg)] outline-none placeholder:text-[var(--color-fg-3)]"
          />
          {filters.q ? (
            <button type="button" aria-label="Clear search" onClick={() => setFilters({ q: "" })}>
              <X className="size-4" />
            </button>
          ) : null}
        </label>

        <div className="chip-row flex max-w-full gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            className={`rounded-sm border px-2.5 py-1.5 text-[13px] font-medium whitespace-nowrap ${
              filters.programs.length
                ? "border-[var(--color-gold)] text-[var(--color-fg)]"
                : "border-[var(--color-border)] text-[var(--color-fg)]"
            }`}
            onClick={() => setSheet("programs")}
          >
            {programLabel}
          </button>
          <FilterButton
            active={filters.languages.length > 0}
            label={summarize(filters.languages, label("anyLanguage"), "languages")}
            onClick={() => setSheet("languages")}
          />
          <FilterButton
            active={filters.locations.length > 0 || filters.areas.length > 0 || Boolean(filters.near)}
            label={
              filters.near
                ? filters.near
                : summarize(
                    [
                      ...filters.areas.map((id) => id.split(":").pop() || id),
                      ...filters.locations,
                    ],
                    label("anyPlace"),
                    "places",
                  )
            }
            onClick={() => setSheet("locations")}
          />
          <FilterButton
            active={filters.modes.length > 0 || filters.tags.length > 0 || filters.hideMissingPasscode}
            label={wayLabel}
            onClick={() => setSheet("ways")}
          />
          <ChipSelect
            value={filters.day}
            onChange={(v) => setFilters({ day: v })}
            options={[{ value: "", label: label("anyDay") }, ...WEEKDAYS.map((d) => ({ value: String(d.value), label: d.short }))]}
          />
          <ChipSelect
            value={filters.who}
            onChange={(v) => setFilters({ who: v })}
            options={[
              { value: "", label: label("everyone") },
              { value: "men", label: label("men") },
              { value: "women", label: label("women") },
            ]}
          />
          <ChipSelect
            value={filters.source}
            onChange={(v) => setFilters({ source: v })}
            options={[
              { value: "", label: label("allLists") },
              { value: "custom", label: `${label("mine")} (${customCount})` },
              { value: "catalog", label: label("builtIn") },
            ]}
          />
          {favoriteMeetings.length || favoritePrograms.length || favoriteGroups.length || filters.favorites ? (
            <FilterButton
              active={filters.favorites}
              label={label("favorites")}
              onClick={() => setFilters({ favorites: !filters.favorites })}
            />
          ) : null}
        </div>
      </div>
      {filtering || zone ? (
        <div className="mx-auto max-w-[900px] px-3 pb-2">
          <div className="flex items-center justify-between gap-3 text-[12px] tracking-wide text-[var(--color-fg-3)] uppercase">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2.5">
              {filtering ? (
                <>
                  <span>
                    <b className="text-[var(--color-primary)]">{visible.length}</b> {label("matching")}
                  </span>
                  <button type="button" className="font-semibold tracking-wide text-[var(--color-primary)] uppercase" onClick={clearFilters}>
                    {label("clear")}
                  </button>
                </>
              ) : null}
            </div>
            {hydrated ? (
              <button
                type="button"
                className="shrink-0 px-1 py-1 text-left text-[11px] tracking-wide underline decoration-[var(--color-border)] underline-offset-4"
                onClick={() => setZoneOpen(true)}
              >
                Times in <b className="text-[var(--color-fg-2)]">{zone.replace(/_/g, " ")}</b>
              </button>
            ) : null}
          </div>
          {filtering && filters.programs.length === 1 && LIST_SCOPE[filters.programs[0]] ? (
            <p className="mt-1 normal-case tracking-normal text-[var(--color-fg-2)]">{LIST_SCOPE[filters.programs[0]]}</p>
          ) : null}
        </div>
      ) : null}
      {sheet === "programs" ? (
        <ChoiceSheet
          title={label("programs")}
          emptyLabel={label("anyProgram")}
          queryLabel={label("findProgram")}
          selected={filters.programs}
          options={programs.map((p) => {
            const shown = localizedProgram(p, locale);
            const count = programCounts.get(p.id) || 0;
            return {
              id: p.id,
              label: shown.short,
              detail: `${shown.name} · ${count}`,
              group: p.section || label("yours"),
            };
          })}
          count={visible.length}
          onToggle={(id) => toggleList(filters.programs, id, (programs) => setFilters({ programs }))}
          onClear={() => setFilters({ programs: [] })}
          onClose={() => setSheet(null)}
        />
      ) : null}
      {sheet === "languages" ? (
        <ChoiceSheet
          title={label("languages")}
          emptyLabel={label("anyLanguage")}
          queryLabel={label("findLanguage")}
          selected={filters.languages}
          options={languageChoices.map((name) => ({ id: name, label: name }))}
          count={visible.length}
          onToggle={(id) => toggleList(filters.languages, id, (languages) => setFilters({ languages }))}
          onClear={() => setFilters({ languages: [] })}
          onClose={() => setSheet(null)}
        />
      ) : null}
      {sheet === "locations" ? <PlaceSheet onClose={() => setSheet(null)} /> : null}
      {sheet === "ways" ? (
        <ChoiceSheet
          title={label("anyWay")}
          emptyLabel={label("anyWay")}
          queryLabel={label("findWay")}
          selected={[...filters.modes, ...filters.tags, ...(filters.hideMissingPasscode ? ["nopass"] : [])]}
          groupOrder={[label("attendance"), label("rooms"), label("aboutMeeting"), label("passcode")]}
          options={[
            { id: "inperson", label: label("inPerson"), group: label("attendance") },
            { id: "online", label: label("online"), group: label("attendance") },
            { id: "phone", label: label("phone"), group: label("attendance") },
            ...PLATFORMS.filter((p) => p.id !== "inperson" && p.id !== "phone").map((p) => ({
              id: p.id,
              label: p.label,
              group: label("rooms"),
            })),
            ...tagOptions,
            { id: "nopass", label: label("hideMissingPasscode"), group: label("passcode") },
          ]}
          count={visible.length}
          onToggle={(id) => {
            if (id === "nopass") {
              setFilters({ hideMissingPasscode: !filters.hideMissingPasscode });
              return;
            }
            if (TAGS.includes(id as (typeof TAGS)[number])) {
              toggleList(filters.tags, id, (tags) => setFilters({ tags }));
              return;
            }
            toggleList(filters.modes, id, (modes) => setFilters({ modes }));
          }}
          onClear={() => setFilters({ modes: [], tags: [], hideMissingPasscode: false })}
          onClose={() => setSheet(null)}
        />
      ) : null}
      <style>{`
        .tool-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid var(--color-gold);
          background: var(--color-card);
          color: var(--color-fg);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 7px 12px;
          border-radius: 2px;
          white-space: nowrap;
          min-height: 36px;
        }
        .chip-row {
          mask-image: linear-gradient(90deg, #000 0, #000 calc(100% - 24px), transparent);
        }
      `}</style>
    </div>
  );
}

function ChipSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`appearance-none rounded-sm border bg-[var(--color-card)] py-1.5 pr-7 pl-2.5 text-[13px] font-medium whitespace-nowrap ${
        value
          ? "border-[var(--color-gold)] text-[var(--color-fg)]"
          : "border-[var(--color-border)] text-[var(--color-fg)]"
      }`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23737487' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 8px center",
      }}
    >
      {options.map((o) => (
        <option key={o.value || "all"} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function summarize(selected: string[], empty: string, noun: string) {
  if (selected.length === 0) return empty;
  if (selected.length <= 2) return selected.join(" · ");
  return `${selected.length} ${noun}`;
}

function toggleList(current: string[], id: string, apply: (next: string[]) => void) {
  apply(current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
}

function distinctValues(
  catalog: { language: string; location: string }[],
  custom: { language: string; location: string }[],
  field: "language" | "location",
) {
  const values = new Set<string>();
  for (const meeting of catalog) {
    const value = meeting[field].trim();
    if (value) values.add(value);
  }
  for (const meeting of custom) {
    const value = (meeting[field] || "").trim();
    if (value) values.add(value);
  }
  return [...values].sort((a, b) => a.localeCompare(b));
}

function FilterButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`rounded-sm border px-2.5 py-1.5 text-[13px] font-medium whitespace-nowrap ${
        active ? "border-[var(--color-gold)] text-[var(--color-fg)]" : "border-[var(--color-border)] text-[var(--color-fg)]"
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function ChoiceSheet({
  title,
  emptyLabel,
  queryLabel,
  selected,
  options,
  count,
  groupOrder,
  onToggle,
  onClear,
  onClose,
}: {
  title: string;
  emptyLabel: string;
  queryLabel: string;
  selected: string[];
  options: { id: string; label: string; detail?: string; group?: string }[];
  count: number;
  groupOrder?: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const query = q.trim().toLowerCase();
  const shown = options
    .filter((option) => !query || `${option.label} ${option.detail ?? ""} ${option.group ?? ""}`.toLowerCase().includes(query))
    .sort((a, b) => a.label.localeCompare(b.label));
  const grouped = new Map<string, typeof shown>();
  for (const option of shown) {
    const key = option.group || "";
    const list = grouped.get(key);
    if (list) list.push(option);
    else grouped.set(key, [option]);
  }
  const groups = [...grouped.entries()];
  if (groupOrder) {
    groups.sort((a, b) => {
      const ai = groupOrder.indexOf(a[0]);
      const bi = groupOrder.indexOf(b[0]);
      return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <button type="button" className="sheet-backdrop absolute inset-0" aria-label={`Close ${title}`} onClick={onClose} />
      <div
        role="dialog"
        aria-label={title}
        className="relative z-10 flex max-h-[86dvh] w-full flex-col rounded-t-xl bg-[var(--color-card)] shadow-2xl md:w-[440px] md:rounded-xl"
      >
        <div className="deco-rule flex items-center justify-between px-4 py-3">
          <div>
            <h2 className="font-display text-2xl tracking-wide">{title}</h2>
            <p className="text-xs tracking-wide text-[var(--color-fg-3)] uppercase">
              {selected.length ? `${selected.length} on · ${count} meetings` : emptyLabel}
            </p>
          </div>
          <button type="button" className="rounded-sm bg-[var(--color-bg)] p-2" onClick={onClose} aria-label="Close">
            <X className="size-5" />
          </button>
        </div>
        <div className="px-4 pt-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={queryLabel} className="field w-full" autoFocus />
        </div>
        <div className="mt-3 flex flex-col gap-3 overflow-y-auto px-4 pb-4">
          {groups.map(([title, items]) => (
            <div key={title || "all"}>
              {title ? <p className="mb-1.5 text-xs font-semibold tracking-[0.14em] text-[var(--color-gold)] uppercase">{title}</p> : null}
              <div className="flex flex-wrap gap-2">
                {items.map((option) => {
                  const on = selected.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => onToggle(option.id)}
                      className={`px-3 py-2 text-left ${
                        on ? "border border-[var(--color-gold)] bg-[var(--color-bg)]" : "border border-[var(--color-border)]"
                      }`}
                    >
                      <span className="block text-sm font-semibold">{option.label}</span>
                      {option.detail ? <span className="block text-xs text-[var(--color-fg-3)]">{option.detail}</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {shown.length === 0 ? <p className="text-sm text-[var(--color-fg-3)]">Nothing matches.</p> : null}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border)] px-4 py-3">
          <button type="button" className="text-xs font-semibold tracking-wide text-[var(--color-primary)] uppercase" onClick={onClear}>
            {emptyLabel}
          </button>
          <button type="button" className="btn-primary h-10 px-4 text-sm" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
