import { useMemo } from "react";
import { create } from "zustand";
import type { Filters, FellowshipGroup, Meeting, MeetingDraft, Platform, Gender } from "./types";
import { EMPTY_FILTERS } from "./types";
import { uid } from "@/lib/utils";
import { shownZone, isValidZone, nextOccurrence } from "./schedule";
import { buildJoinUrl, passcodeMissing, PLATFORMS } from "./platforms";
import { areaId, haversineKm, placeParts } from "./places";
import { BUILTIN_PROGRAMS, type Program } from "./programs";
import { inferTags, knownTags } from "./tags";
import { aliasHaystack, meetingLanguage, normalizeLocale, systemLocale, type LocaleId } from "./i18n";
import { isDossier, type Dossier } from "./dossier";
import { idbGet, idbSet, type StoredUser } from "./idb";
import { readSqliteUser, writeSqliteUser } from "./sqlite";
import { listExpired } from "./list-window";
import { CATALOG_VERSION } from "./catalog-version";
import { applyTypeface, normalizeFont, normalizeTextSize, type FontId, type TextSize } from "./typeface";

const STORAGE_KEY = "nextmeeting-aca-v1";
const THEME_KEY = "nextmeeting-theme";

type CatalogRow = {
  id: string;
  name: string;
  weekday: number;
  hour: number;
  minute: number;
  zone: string;
  durationMinutes: number;
  platform: Platform;
  meetingId: string;
  password: string;
  joinUrl: string;
  notes: string;
  contactInfo: string;
  gender: Gender;
  programId?: string;
  language?: string;
  location?: string;
  lat?: number | null;
  lng?: number | null;
  tags?: string[];
};

let CATALOG: Meeting[] = [];
const catalogById = new Map<string, Meeting>();
let catalogPromise: Promise<void> | null = null;

function normalizeRow(m: CatalogRow): Meeting {
  return {
    ...m,
    source: "catalog" as const,
    programId: m.programId || "aca",
    groupId: "",
    language: m.language || "",
    location: m.location || "",
    lat: typeof m.lat === "number" ? m.lat : null,
    lng: typeof m.lng === "number" ? m.lng : null,
    tags: knownTags(m.tags).length ? knownTags(m.tags) : inferTags(m.notes || ""),
  };
}

/** Shipped meetings stay a cached file. SQLite is only for what you change. */
export function loadCatalog(): Promise<void> {
  if (CATALOG.length) return Promise.resolve();
  if (typeof window === "undefined") return Promise.resolve();
  catalogPromise ??= fetch(`${import.meta.env.BASE_URL}catalog/meetings.json?v=${CATALOG_VERSION}`)
    .then((response) => {
      if (!response.ok) throw new Error("catalog");
      return response.json() as Promise<CatalogRow[]>;
    })
    .then((rows) => {
      catalogById.clear();
      CATALOG = rows.map((row) => {
        const meeting = normalizeRow(row);
        catalogById.set(meeting.id, meeting);
        return meeting;
      });
    })
    .catch(() => {
      catalogPromise = null;
    });
  return catalogPromise;
}

export function catalogMeetings(): Meeting[] {
  return CATALOG;
}

export type ThemeMode = "light" | "dark";

type Persisted = {
  custom: Meeting[];
  hiddenIds: string[];
  showCatalog: boolean;
  programs: Program[];
  groups: FellowshipGroup[];
  alertIds: string[];
  favoriteMeetingIds: string[];
  favoriteProgramIds: string[];
  favoriteGroupIds: string[];
  alertLeadMinutes: number;
  alertsEnabled: boolean;
  barPlace: "flush" | "bottom";
  cardSize: "compact" | "comfortable" | "wide";
  fontId: FontId;
  textSize: TextSize;
  locale: LocaleId;
  localeChosen: boolean;
  languageFollowsApp: boolean;
  alertFavorites: boolean;
  showExpired: boolean;
  displayZone: string;
  dossiers: Record<string, Dossier>;
  filters: Filters;
};

type UiState = {
  selectedId: string | null;
  formOpen: boolean;
  editingId: string | null;
  importOpen: boolean;
  listsOpen: boolean;
  navOpen: boolean;
  zoneOpen: boolean;
  now: number;
  hydrated: boolean;
  catalogReady: boolean;
};

type MeetingState = Persisted &
  UiState & {
    theme: ThemeMode;
    hydrate: () => void;
    setTheme: (theme: ThemeMode) => void;
    toggleTheme: () => void;
    tick: () => void;
    setFilters: (patch: Partial<Filters>) => void;
    clearFilters: () => void;
    setShowCatalog: (show: boolean) => void;
    setNavOpen: (open: boolean) => void;
    selectMeeting: (id: string | null) => void;
    openCreate: () => void;
    openEdit: (id: string) => void;
    closeForm: () => void;
    setImportOpen: (open: boolean) => void;
    setListsOpen: (open: boolean) => void;
    upsertCustom: (draft: MeetingDraft) => string;
    deleteCustom: (id: string) => void;
    hideCatalog: (id: string) => void;
    unhideCatalog: (id: string) => void;
    importCustom: (incoming: Meeting[], mode: "merge" | "replace") => number;
    addProgram: (short: string, name: string) => string;
    deleteProgram: (id: string) => void;
    addGroup: (draft: Omit<FellowshipGroup, "id"> & { id?: string }) => string;
    deleteGroup: (id: string) => void;
    toggleAlert: (id: string) => void;
    toggleFavoriteMeeting: (id: string) => void;
    toggleFavoriteProgram: (id: string) => void;
    toggleFavoriteGroup: (id: string) => void;
    setAlertsEnabled: (on: boolean) => void;
    setAlertLead: (minutes: number) => void;
    setBarPlace: (place: "flush" | "bottom") => void;
    setCardSize: (size: "compact" | "comfortable" | "wide") => void;
    setFont: (font: string) => void;
    setTextSize: (size: string) => void;
    setLocale: (locale: string) => void;
    setAlertFavorites: (on: boolean) => void;
    setShowExpired: (on: boolean) => void;
    setDisplayZone: (zone: string) => void;
    setZoneOpen: (open: boolean) => void;
    setDossier: (dossier: Dossier) => void;
    allPrograms: () => Program[];
    allMeetings: () => Meeting[];
    visibleMeetings: () => Meeting[];
    getMeeting: (id: string) => Meeting | undefined;
  };

function emptyPersisted(): Persisted {
  return {
    custom: [],
    hiddenIds: [],
    showCatalog: true,
    programs: [],
    groups: [],
    alertIds: [],
    favoriteMeetingIds: [],
    favoriteProgramIds: [],
    favoriteGroupIds: [],
    alertLeadMinutes: 15,
    alertsEnabled: false,
    barPlace: "flush",
    cardSize: "compact",
    fontId: "deco",
    textSize: "m",
    locale: "en",
    localeChosen: false,
    languageFollowsApp: true,
    alertFavorites: false,
    showExpired: false,
    displayZone: "",
    dossiers: {},
    filters: { ...EMPTY_FILTERS },
  };
}

function normalizeFilters(raw: unknown): Filters {
  const f = raw && typeof raw === "object" ? (raw as Partial<Filters> & { program?: unknown }) : {};
  const fromList = Array.isArray(f.programs) ? f.programs.filter((id): id is string => typeof id === "string" && id.length > 0) : [];
  const legacy = typeof f.program === "string" && f.program ? [f.program] : [];
  const languages = Array.isArray(f.languages) ? f.languages.filter((id): id is string => typeof id === "string" && id.length > 0) : [];
  const locations = Array.isArray(f.locations) ? f.locations.filter((id): id is string => typeof id === "string" && id.length > 0) : [];
  const areas = Array.isArray(f.areas) ? f.areas.filter((id): id is string => typeof id === "string" && id.length > 0) : [];
  const wayIds = new Set(["inperson", "online", "phone", ...PLATFORMS.map((p) => p.id)]);
  const modes = Array.isArray(f.modes) ? f.modes.filter((id): id is string => wayIds.has(id)) : [];
  if (typeof f.platform === "string" && f.platform && wayIds.has(f.platform) && !modes.includes(f.platform)) {
    modes.push(f.platform);
  }
  const tags = knownTags(f.tags);
  const originLat = typeof f.originLat === "number" && Number.isFinite(f.originLat) ? f.originLat : null;
  const originLng = typeof f.originLng === "number" && Number.isFinite(f.originLng) ? f.originLng : null;
  return {
    q: typeof f.q === "string" ? f.q : "",
    day: typeof f.day === "string" ? f.day : "",
    who: typeof f.who === "string" ? f.who : "",
    platform: "",
    source: typeof f.source === "string" ? f.source : "",
    programs: fromList.length ? fromList : legacy,
    languages,
    locations,
    areas,
    modes,
    tags,
    favorites: f.favorites === true,
    hideMissingPasscode: f.hideMissingPasscode === true,
    near: typeof f.near === "string" ? f.near : "",
    radiusKm: typeof f.radiusKm === "number" && f.radiusKm >= 0 ? f.radiusKm : 80,
    originLat,
    originLng,
  };
}

function readLocalRecord(): StoredUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredUser;
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.custom)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function persistedFrom(record: StoredUser): Persisted {
  const locale = record.localeChosen ? normalizeLocale(record.locale) : systemLocale();
  const chosenLanguages = Array.isArray(record.filters?.languages) && record.filters.languages.length > 0;
  const languageFollowsApp =
    record.languageFollowsApp === false ? false : record.languageFollowsApp === true || !chosenLanguages;
  const filters = normalizeFilters(record.filters);
  const name = meetingLanguage(locale);
  return {
    custom: (Array.isArray(record.custom) ? record.custom : []).map((m) => normalizeMeeting(m as Meeting)),
    hiddenIds: Array.isArray(record.hiddenIds) ? record.hiddenIds.filter((id) => typeof id === "string") : [],
    showCatalog: record.showCatalog !== false,
    programs: (Array.isArray(record.programs) ? record.programs : [])
      .map(normalizeProgram)
      .filter((p): p is Program => Boolean(p)),
    groups: (Array.isArray(record.groups) ? record.groups : [])
      .map(normalizeGroup)
      .filter((g): g is FellowshipGroup => Boolean(g)),
    alertIds: Array.isArray(record.alertIds) ? record.alertIds.filter((id) => typeof id === "string") : [],
    favoriteMeetingIds: Array.isArray(record.favoriteMeetingIds) ? record.favoriteMeetingIds.filter((id) => typeof id === "string") : [],
    favoriteProgramIds: Array.isArray(record.favoriteProgramIds) ? record.favoriteProgramIds.filter((id) => typeof id === "string") : [],
    favoriteGroupIds: Array.isArray(record.favoriteGroupIds) ? record.favoriteGroupIds.filter((id) => typeof id === "string") : [],
    alertLeadMinutes: Number(record.alertLeadMinutes) || 15,
    alertsEnabled: record.alertsEnabled === true,
    barPlace: record.barPlace === "bottom" ? "bottom" : "flush",
    cardSize: record.cardSize === "comfortable" || record.cardSize === "wide" ? record.cardSize : "compact",
    fontId: normalizeFont(record.fontId),
    textSize: normalizeTextSize(record.textSize),
    locale,
    localeChosen: record.localeChosen === true,
    languageFollowsApp,
    alertFavorites: record.alertFavorites === true,
    showExpired: record.showExpired === true,
    displayZone: typeof record.displayZone === "string" && isValidZone(record.displayZone) ? record.displayZone : "",
    dossiers: normalizeDossiers(record.dossiers),
    filters: languageFollowsApp ? { ...filters, languages: name ? [name] : [] } : filters,
  };
}

function normalizeMeeting(m: Meeting): Meeting {
  return {
    id: m.id || uid(),
    name: String(m.name || "").trim(),
    weekday: Number(m.weekday) || 1,
    hour: Number(m.hour) || 0,
    minute: Number(m.minute) || 0,
    zone: m.zone || "America/New_York",
    durationMinutes: Number(m.durationMinutes) || 60,
    platform: (m.platform as Platform) || "zoom",
    meetingId: m.meetingId || "",
    password: m.password || "",
    joinUrl: m.joinUrl || "",
    notes: m.notes || "",
    contactInfo: m.contactInfo || "",
    gender: (m.gender as Gender) || "ALL",
    source: "custom",
    programId: m.programId || "aca",
    groupId: m.groupId || "",
    language: m.language || "",
    location: m.location || "",
    lat: typeof m.lat === "number" ? m.lat : null,
    lng: typeof m.lng === "number" ? m.lng : null,
    tags: knownTags(m.tags),
  };
}

function normalizeProgram(raw: unknown): Program | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Program;
  const short = String(p.short || "").trim();
  const name = String(p.name || short).trim();
  if (!short || !name) return null;
  if (BUILTIN_PROGRAMS.some((b) => b.short.toLowerCase() === short.toLowerCase())) return null;
  const id = String(p.id || short)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 16);
  if (!id || BUILTIN_PROGRAMS.some((b) => b.id === id)) return null;
  return { id, short, name };
}

function normalizeDossiers(raw: unknown): Record<string, Dossier> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, Dossier> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (isDossier(value)) out[key] = value;
  }
  return out;
}

function normalizeGroup(raw: unknown): FellowshipGroup | null {
  if (!raw || typeof raw !== "object") return null;
  const g = raw as FellowshipGroup;
  const name = String(g.name || "").trim();
  if (!name) return null;
  return {
    id: g.id || uid(),
    name,
    programId: g.programId || "other",
    notes: g.notes || "",
    contactInfo: g.contactInfo || "",
    platform: (g.platform as Platform) || "other",
    joinUrl: g.joinUrl || "",
  };
}

let saveTimer = 0;

function persist(state: Persisted & { theme: ThemeMode }) {
  const record: StoredUser = {
    custom: state.custom,
    hiddenIds: state.hiddenIds,
    showCatalog: state.showCatalog,
    theme: state.theme,
    programs: state.programs,
    groups: state.groups,
    alertIds: state.alertIds,
    favoriteMeetingIds: state.favoriteMeetingIds,
    favoriteProgramIds: state.favoriteProgramIds,
    favoriteGroupIds: state.favoriteGroupIds,
    alertLeadMinutes: state.alertLeadMinutes,
    alertsEnabled: state.alertsEnabled,
    barPlace: state.barPlace,
    cardSize: state.cardSize,
    fontId: state.fontId,
    textSize: state.textSize,
    locale: state.locale,
    localeChosen: state.localeChosen,
    languageFollowsApp: state.languageFollowsApp,
    alertFavorites: state.alertFavorites,
    showExpired: state.showExpired,
    displayZone: state.displayZone,
    dossiers: state.dossiers,
    filters: state.filters,
    savedAt: Date.now(),
  };
  applyTypeface(state.fontId, state.textSize);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    localStorage.setItem(THEME_KEY, state.theme);
  } catch {
    /* private mode */
  }
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    void writeSqliteUser(record).catch(() => {});
    void idbSet("user", record).catch(() => {});
  }, 400);
}

let boot: Promise<void> | null = null;

function newerRecord(a: StoredUser | null | undefined, b: StoredUser | null | undefined): StoredUser | null {
  const aOk = Boolean(a && Array.isArray(a.custom));
  const bOk = Boolean(b && Array.isArray(b.custom));
  if (aOk && bOk) return (a!.savedAt ?? 0) >= (b!.savedAt ?? 0) ? a! : b!;
  if (aOk) return a!;
  if (bOk) return b!;
  return null;
}

async function readUser(): Promise<StoredUser> {
  let fromSql: StoredUser | null = null;
  try {
    fromSql = await readSqliteUser();
  } catch {
    fromSql = null;
  }
  let fromDb: StoredUser | undefined;
  try {
    fromDb = await idbGet<StoredUser>("user");
  } catch {
    fromDb = undefined;
  }
  const chosen = newerRecord(fromSql, newerRecord(fromDb, readLocalRecord()));
  if (chosen) {
    const theme = chosen.theme === "dark" || chosen.theme === "light" ? chosen.theme : readTheme();
    const record: StoredUser = { ...chosen, theme };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch {
      /* ignore */
    }
    if (chosen !== fromSql) void writeSqliteUser(record).catch(() => {});
    if (chosen !== fromDb) void idbSet("user", record).catch(() => {});
    return record;
  }
  const legacy = emptyPersisted();
  const record: StoredUser = { ...legacy, theme: readTheme(), savedAt: Date.now() };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    /* ignore */
  }
  void writeSqliteUser(record).catch(() => {});
  void idbSet("user", record).catch(() => {});
  return record;
}

function readTheme(): ThemeMode {
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t === "dark" || t === "light") return t;
  } catch {
    /* ignore */
  }
  return "light";
}

export function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("theme-dark", theme === "dark");
  root.style.colorScheme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore */
  }
}

function matchesFilters(
  m: Meeting,
  filters: Filters,
  nextIso: number | null,
  zone: string,
  extra?: { program?: string; group?: string },
  sets?: {
    programSet: Set<string> | null;
    languageSet: Set<string> | null;
    locationSet: Set<string> | null;
    areaSet: Set<string> | null;
    modeSet: Set<string> | null;
    favoriteMeetings: Set<string> | null;
    favoritePrograms: Set<string> | null;
    favoriteGroups: Set<string> | null;
  },
) {
  if (filters.source === "custom" && m.source !== "custom") return false;
  if (filters.source === "catalog" && m.source !== "catalog") return false;
  if (filters.favorites && sets?.favoriteMeetings) {
    const hit =
      sets.favoriteMeetings.has(m.id) ||
      sets.favoritePrograms?.has(m.programId || "") ||
      (m.groupId ? sets.favoriteGroups?.has(m.groupId) : false);
    if (!hit) return false;
  }
  if (filters.hideMissingPasscode && passcodeMissing(m)) return false;
  if (filters.source === "catalog" && m.source !== "catalog") return false;
  if (sets?.programSet && !sets.programSet.has(m.programId || "aca")) return false;
  if (sets?.languageSet && !sets.languageSet.has(m.language || "")) return false;
  if (sets?.locationSet || sets?.areaSet) {
    const parts = placeParts(m.location || "");
    const city = sets.locationSet?.has(m.location || "") ?? false;
    const area = parts
      ? Boolean(
          sets.areaSet?.has(areaId("continent", parts)) ||
            (parts.country && sets.areaSet?.has(areaId("country", parts))) ||
            (parts.region && sets.areaSet?.has(areaId("region", parts))),
        )
      : false;
    if (!city && !area) return false;
  }
  if (sets?.modeSet) {
    const coarse = m.platform === "inperson" ? "inperson" : m.platform === "phone" ? "phone" : "online";
    if (!sets.modeSet.has(coarse) && !sets.modeSet.has(m.platform)) return false;
  }
  if (filters.originLat != null && filters.originLng != null && filters.radiusKm > 0) {
    if (typeof m.lat !== "number" || typeof m.lng !== "number") return false;
    if (haversineKm(filters.originLat, filters.originLng, m.lat, m.lng) > filters.radiusKm) return false;
  }
  if (filters.who === "men" && m.gender !== "MEN_ONLY") return false;
  if (filters.who === "women" && m.gender !== "WOMEN_ONLY") return false;
  if (filters.tags.length) {
    const have = m.tags || [];
    if (!filters.tags.every((tag) => have.includes(tag))) return false;
  }
  if (filters.q) {
    const hay = [
      m.name,
      m.notes,
      m.contactInfo,
      m.meetingId,
      m.zone,
      m.language,
      m.location,
      m.password,
      extra?.program ?? "",
      extra?.group ?? "",
    ]
      .join(" ")
      .toLowerCase();
    const tokens = filters.q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!tokens.every((t) => hay.includes(t))) return false;
  }
  if (filters.day && nextIso != null) {
    const want = Number(filters.day);
    const localDay = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      weekday: "short",
    }).format(new Date(nextIso));
    const map: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
    if (map[localDay] !== want) return false;
  }
  return true;
}

export const useMeetingStore = create<MeetingState>((set, get) => ({
  custom: [],
  hiddenIds: [],
  showCatalog: true,
  programs: [],
  groups: [],
  alertIds: [],
  favoriteMeetingIds: [],
  favoriteProgramIds: [],
  favoriteGroupIds: [],
  alertLeadMinutes: 15,
  alertsEnabled: false,
  barPlace: "flush",
  cardSize: "compact",
  fontId: "deco",
  textSize: "m",
  locale: systemLocale(),
  localeChosen: false,
  languageFollowsApp: true,
  alertFavorites: false,
  showExpired: false,
  displayZone: "",
  dossiers: {},
  theme: "light",
  selectedId: null,
  formOpen: false,
  editingId: null,
  importOpen: false,
  listsOpen: false,
  navOpen: false,
  zoneOpen: false,
  filters: {
    ...EMPTY_FILTERS,
    languages: meetingLanguage(systemLocale()) ? [meetingLanguage(systemLocale())] : [],
  },
  now: Date.now(),
  hydrated: false,
  catalogReady: false,

  hydrate: () => {
    if (get().hydrated || boot) return;
    const start = get();
    boot = (async () => {
      try {
        const [record] = await Promise.all([readUser(), loadCatalog()]);
        const saved = persistedFrom(record);
        const theme = record.theme === "dark" ? "dark" : "light";
        const current = get();
        const next: Persisted & { theme: ThemeMode; hydrated: boolean; catalogReady: boolean; now: number } = {
          custom: current.custom !== start.custom ? current.custom : saved.custom,
          hiddenIds: current.hiddenIds !== start.hiddenIds ? current.hiddenIds : saved.hiddenIds,
          showCatalog: current.showCatalog !== start.showCatalog ? current.showCatalog : saved.showCatalog,
          programs: current.programs !== start.programs ? current.programs : saved.programs,
          groups: current.groups !== start.groups ? current.groups : saved.groups,
          alertIds: current.alertIds !== start.alertIds ? current.alertIds : saved.alertIds,
          favoriteMeetingIds:
            current.favoriteMeetingIds !== start.favoriteMeetingIds ? current.favoriteMeetingIds : saved.favoriteMeetingIds,
          favoriteProgramIds:
            current.favoriteProgramIds !== start.favoriteProgramIds ? current.favoriteProgramIds : saved.favoriteProgramIds,
          favoriteGroupIds:
            current.favoriteGroupIds !== start.favoriteGroupIds ? current.favoriteGroupIds : saved.favoriteGroupIds,
          alertLeadMinutes:
            current.alertLeadMinutes !== start.alertLeadMinutes ? current.alertLeadMinutes : saved.alertLeadMinutes,
          alertsEnabled: current.alertsEnabled !== start.alertsEnabled ? current.alertsEnabled : saved.alertsEnabled,
          barPlace: current.barPlace !== start.barPlace ? current.barPlace : saved.barPlace,
          cardSize: current.cardSize !== start.cardSize ? current.cardSize : saved.cardSize,
          fontId: current.fontId !== start.fontId ? current.fontId : saved.fontId,
          textSize: current.textSize !== start.textSize ? current.textSize : saved.textSize,
          locale: current.locale !== start.locale ? current.locale : saved.locale,
          localeChosen: current.localeChosen !== start.localeChosen ? current.localeChosen : saved.localeChosen,
          languageFollowsApp:
            current.languageFollowsApp !== start.languageFollowsApp ? current.languageFollowsApp : saved.languageFollowsApp,
          alertFavorites: current.alertFavorites !== start.alertFavorites ? current.alertFavorites : saved.alertFavorites,
          showExpired: current.showExpired !== start.showExpired ? current.showExpired : saved.showExpired,
          displayZone: current.displayZone !== start.displayZone ? current.displayZone : saved.displayZone,
          dossiers: current.dossiers !== start.dossiers ? current.dossiers : saved.dossiers,
          filters: current.filters !== start.filters ? current.filters : saved.filters,
          theme: current.theme !== start.theme ? current.theme : theme,
          hydrated: true,
          catalogReady: CATALOG.length > 0,
          now: Date.now(),
        };
        if (next.theme === theme) applyTheme(theme);
        applyTypeface(next.fontId, next.textSize);
        set(next);
        const edited =
          next.custom !== saved.custom ||
          next.barPlace !== saved.barPlace ||
          next.cardSize !== saved.cardSize ||
          next.fontId !== saved.fontId ||
          next.textSize !== saved.textSize ||
          next.locale !== saved.locale ||
          next.dossiers !== saved.dossiers ||
          next.filters !== saved.filters ||
          next.displayZone !== saved.displayZone ||
          next.theme !== theme;
        if (edited) persist(get());
      } catch {
        set({ hydrated: true, catalogReady: CATALOG.length > 0, now: Date.now() });
      }
    })();
  },
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
    persist(get());
  },
  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    get().setTheme(next);
  },
  tick: () => set({ now: Date.now() }),
  setFilters: (patch) => {
    set((s) => ({
      filters: { ...s.filters, ...patch },
      languageFollowsApp: "languages" in patch ? false : s.languageFollowsApp,
    }));
    persist(get());
  },
  clearFilters: () => {
    const name = get().languageFollowsApp ? meetingLanguage(get().locale) : "";
    set({ filters: { ...EMPTY_FILTERS, languages: name ? [name] : [] } });
    persist(get());
  },
  setShowCatalog: (showCatalog) => {
    set({ showCatalog });
    persist(get());
  },
  setNavOpen: (navOpen) => set({ navOpen }),
  selectMeeting: (selectedId) => set({ selectedId, navOpen: false }),
  openCreate: () => set({ formOpen: true, editingId: null, navOpen: false, selectedId: null }),
  openEdit: (id) => set({ formOpen: true, editingId: id, selectedId: null }),
  closeForm: () => set({ formOpen: false, editingId: null }),
  setImportOpen: (importOpen) => set({ importOpen, navOpen: false }),
  setListsOpen: (listsOpen) => set({ listsOpen, navOpen: false }),

  upsertCustom: (draft) => {
    const id = draft.id && get().custom.some((m) => m.id === draft.id) ? draft.id : uid();
    const meeting: Meeting = {
      id,
      name: draft.name.trim(),
      weekday: draft.weekday,
      hour: draft.hour,
      minute: draft.minute,
      zone: draft.zone,
      durationMinutes: draft.durationMinutes || 60,
      platform: draft.platform,
      meetingId: draft.meetingId.trim(),
      password: draft.password.trim(),
      joinUrl: draft.joinUrl.trim() || buildJoinUrl(draft) || "",
      notes: draft.notes.trim(),
      contactInfo: draft.contactInfo.trim(),
      gender: draft.gender,
      programId: draft.programId || "aca",
      groupId: draft.groupId || "",
      language: draft.language.trim(),
      location: draft.location.trim(),
      lat: draft.lat ?? null,
      lng: draft.lng ?? null,
      tags: knownTags(draft.tags),
      source: "custom",
    };
    set((s) => {
      const exists = s.custom.some((m) => m.id === id);
      const custom = exists ? s.custom.map((m) => (m.id === id ? meeting : m)) : [meeting, ...s.custom];
      return { custom, formOpen: false, editingId: null, selectedId: id };
    });
    persist(get());
    return id;
  },
  deleteCustom: (id) => {
    set((s) => ({
      custom: s.custom.filter((m) => m.id !== id),
      favoriteMeetingIds: s.favoriteMeetingIds.filter((x) => x !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    }));
    persist(get());
  },
  hideCatalog: (id) => {
    set((s) => ({
      hiddenIds: s.hiddenIds.includes(id) ? s.hiddenIds : [...s.hiddenIds, id],
      selectedId: s.selectedId === id ? null : s.selectedId,
    }));
    persist(get());
  },
  unhideCatalog: (id) => {
    set((s) => ({ hiddenIds: s.hiddenIds.filter((x) => x !== id) }));
    persist(get());
  },
  importCustom: (incoming, mode) => {
    const cleaned = incoming.map((m) => normalizeMeeting({ ...m, source: "custom" }));
    if (mode === "replace") {
      set({ custom: cleaned, importOpen: false });
      persist(get());
      return cleaned.length;
    }
    const shipped = new Set(
      catalogMeetings()
        .filter((m) => m.meetingId)
        .map((m) => `${m.programId}|${m.weekday}|${m.hour}|${m.minute}|${m.meetingId}`),
    );
    let added = 0;
    set((s) => {
      const keys = new Set(s.custom.map((m) => `${m.name}|${m.weekday}|${m.hour}|${m.minute}|${m.meetingId}`));
      const merged = [...s.custom];
      for (const m of cleaned) {
        const key = `${m.name}|${m.weekday}|${m.hour}|${m.minute}|${m.meetingId}`;
        const ship = `${m.programId}|${m.weekday}|${m.hour}|${m.minute}|${m.meetingId}`;
        if (keys.has(key) || (m.meetingId && shipped.has(ship))) continue;
        keys.add(key);
        merged.unshift(m);
        added += 1;
      }
      return { custom: merged, importOpen: false };
    });
    persist(get());
    return added;
  },
  addProgram: (short, name) => {
    const cleanShort = short.trim();
    const cleanName = (name || short).trim();
    if (!cleanShort) return "";
    const existing = get()
      .allPrograms()
      .find((p) => p.short.toLowerCase() === cleanShort.toLowerCase());
    if (existing) return existing.id;
    const id = cleanShort.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 16) || uid();
    const program: Program = { id, short: cleanShort, name: cleanName };
    set((s) => ({ programs: [...s.programs, program] }));
    persist(get());
    return id;
  },
  deleteProgram: (id) => {
    if (BUILTIN_PROGRAMS.some((p) => p.id === id)) return;
    set((s) => ({
      programs: s.programs.filter((p) => p.id !== id),
      favoriteProgramIds: s.favoriteProgramIds.filter((x) => x !== id),
      custom: s.custom.map((m) => (m.programId === id ? { ...m, programId: "other" } : m)),
    }));
    persist(get());
  },
  addGroup: (draft) => {
    const id = draft.id && get().groups.some((g) => g.id === draft.id) ? draft.id : uid();
    const group: FellowshipGroup = {
      id,
      name: draft.name.trim(),
      programId: draft.programId || "other",
      notes: draft.notes.trim(),
      contactInfo: draft.contactInfo.trim(),
      platform: draft.platform,
      joinUrl: draft.joinUrl.trim(),
    };
    if (!group.name) return "";
    set((s) => {
      const exists = s.groups.some((g) => g.id === id);
      const groups = exists ? s.groups.map((g) => (g.id === id ? group : g)) : [group, ...s.groups];
      return { groups };
    });
    persist(get());
    return id;
  },
  deleteGroup: (id) => {
    set((s) => ({
      groups: s.groups.filter((g) => g.id !== id),
      favoriteGroupIds: s.favoriteGroupIds.filter((x) => x !== id),
      custom: s.custom.map((m) => (m.groupId === id ? { ...m, groupId: "" } : m)),
    }));
    persist(get());
  },
  toggleAlert: (id) => {
    set((s) => ({
      alertIds: s.alertIds.includes(id) ? s.alertIds.filter((x) => x !== id) : [...s.alertIds, id],
    }));
    persist(get());
  },
  toggleFavoriteMeeting: (id) => {
    set((s) => ({
      favoriteMeetingIds: s.favoriteMeetingIds.includes(id)
        ? s.favoriteMeetingIds.filter((x) => x !== id)
        : [...s.favoriteMeetingIds, id],
    }));
    persist(get());
  },
  toggleFavoriteProgram: (id) => {
    set((s) => ({
      favoriteProgramIds: s.favoriteProgramIds.includes(id)
        ? s.favoriteProgramIds.filter((x) => x !== id)
        : [...s.favoriteProgramIds, id],
    }));
    persist(get());
  },
  toggleFavoriteGroup: (id) => {
    set((s) => ({
      favoriteGroupIds: s.favoriteGroupIds.includes(id)
        ? s.favoriteGroupIds.filter((x) => x !== id)
        : [...s.favoriteGroupIds, id],
    }));
    persist(get());
  },
  setAlertsEnabled: (alertsEnabled) => {
    set({ alertsEnabled });
    persist(get());
  },
  setAlertLead: (minutes) => {
    const alertLeadMinutes = [5, 10, 15, 30, 60].includes(minutes) ? minutes : 15;
    set({ alertLeadMinutes });
    persist(get());
  },
  setBarPlace: (barPlace) => {
    set({ barPlace: barPlace === "bottom" ? "bottom" : "flush" });
    persist(get());
  },
  setCardSize: (size) => {
    const cardSize = size === "comfortable" || size === "wide" ? size : "compact";
    set({ cardSize });
    persist(get());
  },
  setFont: (font) => {
    set({ fontId: normalizeFont(font) });
    persist(get());
  },
  setTextSize: (size) => {
    set({ textSize: normalizeTextSize(size) });
    persist(get());
  },
  setLocale: (locale) => {
    const next = normalizeLocale(locale);
    const name = meetingLanguage(next);
    set((s) => ({
      locale: next,
      localeChosen: true,
      languageFollowsApp: true,
      filters: { ...s.filters, languages: name ? [name] : [] },
    }));
    persist(get());
  },
  setAlertFavorites: (alertFavorites) => {
    set({ alertFavorites });
    persist(get());
  },
  setShowExpired: (showExpired) => {
    set({ showExpired });
    persist(get());
  },
  setDisplayZone: (zone) => {
    set({ displayZone: zone && isValidZone(zone) ? zone : "" });
    persist(get());
  },
  setZoneOpen: (zoneOpen) => set({ zoneOpen }),
  setDossier: (dossier) => {
    if (!dossier.programId) return;
    set({ dossiers: { ...get().dossiers, [dossier.programId]: dossier } });
    persist(get());
  },
  allPrograms: () => [...BUILTIN_PROGRAMS, ...get().programs],
  allMeetings: () => collectMeetings(get().custom, get().hiddenIds, get().showCatalog),
  visibleMeetings: () => {
    const { filters, now, groups, favoriteMeetingIds, favoriteProgramIds, favoriteGroupIds, showExpired, displayZone } = get();
    return filterMeetings(
      get().allMeetings(),
      filters,
      now,
      shownZone(displayZone),
      get().allPrograms(),
      groups,
      { meetings: favoriteMeetingIds, programs: favoriteProgramIds, groups: favoriteGroupIds },
      showExpired,
    );
  },
  getMeeting: (id) => {
    return get().custom.find((m) => m.id === id) ?? catalogById.get(id);
  },
}));

export { CATALOG };

export function collectMeetings(custom: Meeting[], hiddenIds: string[], showCatalog: boolean): Meeting[] {
  if (!showCatalog) return custom;
  if (!hiddenIds.length) return custom.length ? [...custom, ...CATALOG] : CATALOG;
  const hidden = new Set(hiddenIds);
  return [...custom, ...CATALOG.filter((meeting) => !hidden.has(meeting.id))];
}

export function filterMeetings(
  meetings: Meeting[],
  filters: Filters,
  now: number,
  zone: string,
  programs: Program[] = BUILTIN_PROGRAMS,
  groups: FellowshipGroup[] = [],
  favorites?: { meetings: string[]; programs: string[]; groups: string[] },
  showExpired = false,
): Meeting[] {
  const programSet = filters.programs.length ? new Set(filters.programs) : null;
  const languageSet = filters.languages.length ? new Set(filters.languages) : null;
  const locationSet = filters.locations.length ? new Set(filters.locations) : null;
  const areaSet = filters.areas.length ? new Set(filters.areas) : null;
  const modeSet = filters.modes.length ? new Set(filters.modes) : null;
  const favoriteMeetings = filters.favorites ? new Set(favorites?.meetings ?? []) : null;
  const favoritePrograms = filters.favorites ? new Set(favorites?.programs ?? []) : null;
  const favoriteGroups = filters.favorites ? new Set(favorites?.groups ?? []) : null;
  const wantText = Boolean(filters.q);
  const names = wantText ? new Map(programs.map((p) => [p.id, `${p.short} ${p.name} ${aliasHaystack(p.id)}`])) : null;
  const groupNames = wantText ? new Map(groups.map((g) => [g.id, g.name])) : null;
  const out: Meeting[] = [];
  for (const m of meetings) {
    if (!showExpired && listExpired(m, now)) continue;
    const nextIso = filters.day ? nextOccurrence(m, now) : null;
    if (
      matchesFilters(m, filters, nextIso, zone, wantText
        ? { program: names?.get(m.programId || "aca") ?? "", group: groupNames?.get(m.groupId) ?? "" }
        : undefined, {
        programSet,
        languageSet,
        locationSet,
        areaSet,
        modeSet,
        favoriteMeetings,
        favoritePrograms,
        favoriteGroups,
      })
    ) {
      out.push(m);
    }
  }
  return out;
}

export function useVisibleMeetings() {
  const custom = useMeetingStore((s) => s.custom);
  const hiddenIds = useMeetingStore((s) => s.hiddenIds);
  const showCatalog = useMeetingStore((s) => s.showCatalog);
  const filters = useMeetingStore((s) => s.filters);
  const now = useMeetingStore((s) => s.now);
  const hydrated = useMeetingStore((s) => s.hydrated);
  const programs = useMeetingStore((s) => s.programs);
  const groups = useMeetingStore((s) => s.groups);
  const favoriteMeetingIds = useMeetingStore((s) => s.favoriteMeetingIds);
  const favoriteProgramIds = useMeetingStore((s) => s.favoriteProgramIds);
  const favoriteGroupIds = useMeetingStore((s) => s.favoriteGroupIds);
  const showExpired = useMeetingStore((s) => s.showExpired);
  const displayZone = useMeetingStore((s) => s.displayZone);
  return useMemo(() => {
    if (!hydrated) return [];
    return filterMeetings(
      collectMeetings(custom, hiddenIds, showCatalog),
      filters,
      now,
      shownZone(displayZone),
      [...BUILTIN_PROGRAMS, ...programs],
      groups,
      { meetings: favoriteMeetingIds, programs: favoriteProgramIds, groups: favoriteGroupIds },
      showExpired,
    );
  }, [
    custom,
    hiddenIds,
    showCatalog,
    filters,
    now,
    hydrated,
    programs,
    groups,
    favoriteMeetingIds,
    favoriteProgramIds,
    favoriteGroupIds,
    showExpired,
    displayZone,
  ]);
}

export function useShownZone() {
  const chosen = useMeetingStore((s) => s.displayZone);
  return shownZone(chosen);
}
