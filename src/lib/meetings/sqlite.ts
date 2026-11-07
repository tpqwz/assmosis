import { idbGet, idbSet, type StoredUser } from "./idb.ts";
import { aliasRows } from "./i18n.ts";
import { knownTags } from "./tags.ts";

type SqlStatement = {
  run(params?: Array<string | number | null>): void;
  step(): boolean;
  getAsObject(): Record<string, string | number | Uint8Array | null>;
  free(): void;
};

export type SqlDatabase = {
  exec(sql: string): void;
  run(sql: string, params?: Array<string | number | null>): void;
  prepare(sql: string): SqlStatement;
  export(): Uint8Array;
};

type InitSqlJs = (config?: { locateFile?: (file: string) => string }) => Promise<{
  Database: new (data?: ArrayLike<number> | null) => SqlDatabase;
}>;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  weekday INTEGER NOT NULL,
  hour INTEGER NOT NULL,
  minute INTEGER NOT NULL,
  zone TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  platform TEXT NOT NULL,
  meeting_id TEXT NOT NULL,
  password TEXT NOT NULL,
  join_url TEXT NOT NULL,
  notes TEXT NOT NULL,
  contact_info TEXT NOT NULL,
  gender TEXT NOT NULL,
  program_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  language TEXT NOT NULL,
  location TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS meetings_program ON meetings(program_id);
CREATE INDEX IF NOT EXISTS meetings_language ON meetings(language);
CREATE INDEX IF NOT EXISTS meetings_location ON meetings(location);
CREATE TABLE IF NOT EXISTS hidden (id TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS alerts (id TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS favorite_meetings (id TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS favorite_programs (id TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS favorite_groups (id TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY,
  short TEXT NOT NULL,
  name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  program_id TEXT NOT NULL,
  notes TEXT NOT NULL,
  contact_info TEXT NOT NULL,
  platform TEXT NOT NULL,
  join_url TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS prefs (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  theme TEXT NOT NULL,
  show_catalog INTEGER NOT NULL,
  alert_lead INTEGER NOT NULL,
  alerts_enabled INTEGER NOT NULL,
  bar_place TEXT NOT NULL,
  card_size TEXT NOT NULL,
  filters TEXT NOT NULL,
  saved_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS aliases (
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  locale TEXT NOT NULL,
  short TEXT NOT NULL,
  name TEXT NOT NULL,
  PRIMARY KEY (entity, entity_id, locale)
);
CREATE TABLE IF NOT EXISTS dossiers (
  program_id TEXT PRIMARY KEY,
  payload TEXT NOT NULL
);
`;

const FILE_KEY = "sqlite";

let opening: Promise<SqlDatabase> | null = null;
let writing: Promise<void> = Promise.resolve();

function text(value: unknown) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function rows(db: SqlDatabase, sql: string): Record<string, string | number | null>[] {
  const stmt = db.prepare(sql);
  const out: Record<string, string | number | null>[] = [];
  while (stmt.step()) {
    const raw = stmt.getAsObject();
    const row: Record<string, string | number | null> = {};
    for (const [key, value] of Object.entries(raw)) {
      row[key] = typeof value === "string" || typeof value === "number" ? value : null;
    }
    out.push(row);
  }
  stmt.free();
  return out;
}

export function applyRecord(db: SqlDatabase, record: StoredUser) {
  db.exec("BEGIN");
  try {
    db.exec(SCHEMA);
    try {
      db.run("ALTER TABLE meetings ADD COLUMN tags TEXT");
    } catch {
      /* already there */
    }
    db.run("DELETE FROM meetings");
    db.run("DELETE FROM hidden");
    db.run("DELETE FROM alerts");
    db.run("DELETE FROM favorite_meetings");
    db.run("DELETE FROM favorite_programs");
    db.run("DELETE FROM favorite_groups");
    db.run("DELETE FROM programs");
    db.run("DELETE FROM groups");
    db.run("DELETE FROM dossiers");
    db.run("DELETE FROM prefs");
    const meeting = db.prepare(
      `INSERT INTO meetings (
        id, name, weekday, hour, minute, zone, duration_minutes, platform, meeting_id, password,
        join_url, notes, contact_info, gender, program_id, group_id, language, location, tags
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    );
    for (const raw of record.custom) {
      const m = raw as Record<string, unknown>;
      meeting.run([
        text(m.id),
        text(m.name),
        Number(m.weekday) || 1,
        Number(m.hour) || 0,
        Number(m.minute) || 0,
        text(m.zone || "America/New_York"),
        Number(m.durationMinutes) || 60,
        text(m.platform || "zoom"),
        text(m.meetingId),
        text(m.password),
        text(m.joinUrl),
        text(m.notes),
        text(m.contactInfo),
        text(m.gender || "ALL"),
        text(m.programId || "aca"),
        text(m.groupId),
        text(m.language),
        text(m.location),
        knownTags(m.tags).join(","),
      ]);
    }
    meeting.free();
    const hidden = db.prepare("INSERT INTO hidden (id) VALUES (?)");
    for (const id of record.hiddenIds) hidden.run([id]);
    hidden.free();
    const alert = db.prepare("INSERT INTO alerts (id) VALUES (?)");
    for (const id of record.alertIds ?? []) alert.run([id]);
    alert.free();
    const favMeeting = db.prepare("INSERT INTO favorite_meetings (id) VALUES (?)");
    for (const id of record.favoriteMeetingIds ?? []) favMeeting.run([id]);
    favMeeting.free();
    const favProgram = db.prepare("INSERT INTO favorite_programs (id) VALUES (?)");
    for (const id of record.favoriteProgramIds ?? []) favProgram.run([id]);
    favProgram.free();
    const favGroup = db.prepare("INSERT INTO favorite_groups (id) VALUES (?)");
    for (const id of record.favoriteGroupIds ?? []) favGroup.run([id]);
    favGroup.free();
    const program = db.prepare("INSERT INTO programs (id, short, name) VALUES (?,?,?)");
    for (const raw of record.programs ?? []) {
      const p = raw as Record<string, unknown>;
      if (!text(p.id)) continue;
      program.run([text(p.id), text(p.short), text(p.name)]);
    }
    program.free();
    const group = db.prepare(
      "INSERT INTO groups (id, name, program_id, notes, contact_info, platform, join_url) VALUES (?,?,?,?,?,?,?)",
    );
    for (const raw of record.groups ?? []) {
      const g = raw as Record<string, unknown>;
      if (!text(g.id)) continue;
      group.run([
        text(g.id),
        text(g.name),
        text(g.programId || "other"),
        text(g.notes),
        text(g.contactInfo),
        text(g.platform || "other"),
        text(g.joinUrl),
      ]);
    }
    group.free();
    try {
      db.run("ALTER TABLE prefs ADD COLUMN locale TEXT");
    } catch {
      /* column already present */
    }
    try {
      db.run("ALTER TABLE prefs ADD COLUMN locale_chosen INTEGER");
    } catch {
      /* column already present */
    }
    try {
      db.run("ALTER TABLE prefs ADD COLUMN language_follows INTEGER");
    } catch {
      /* column already present */
    }
    try {
      db.run("ALTER TABLE prefs ADD COLUMN alert_favorites INTEGER");
    } catch {
      /* column already present */
    }
    for (const column of ["font TEXT", "text_size TEXT", "show_expired INTEGER", "display_zone TEXT"]) {
      try {
        db.run(`ALTER TABLE prefs ADD COLUMN ${column}`);
      } catch {
        /* column already present */
      }
    }
    db.run("DELETE FROM aliases");
    const alias = db.prepare(
      "INSERT INTO aliases (entity, entity_id, locale, short, name) VALUES (?,?,?,?,?)",
    );
    for (const row of aliasRows()) alias.run([row.entity, row.id, row.locale, row.short, row.name]);
    alias.free();
    const dossier = db.prepare("INSERT INTO dossiers (program_id, payload) VALUES (?,?)");
    for (const [id, row] of Object.entries(record.dossiers ?? {})) {
      if (!id) continue;
      dossier.run([id, JSON.stringify(row)]);
    }
    dossier.free();
    db.run(
      `INSERT INTO prefs (
        id, theme, show_catalog, alert_lead, alerts_enabled, bar_place, card_size, filters, saved_at, locale,
        locale_chosen, language_follows, alert_favorites, font, text_size, show_expired, display_zone
      ) VALUES (1,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        record.theme === "dark" ? "dark" : "light",
        record.showCatalog === false ? 0 : 1,
        Number(record.alertLeadMinutes) || 15,
        record.alertsEnabled ? 1 : 0,
        record.barPlace === "bottom" ? "bottom" : "flush",
        record.cardSize === "comfortable" || record.cardSize === "wide" ? record.cardSize : "compact",
        JSON.stringify(record.filters ?? {}),
        Number(record.savedAt) || Date.now(),
        text(record.locale || "en"),
        record.localeChosen ? 1 : 0,
        record.languageFollowsApp === false ? 0 : 1,
        record.alertFavorites ? 1 : 0,
        text(record.fontId || "deco"),
        text(record.textSize || "m"),
        record.showExpired ? 1 : 0,
        text(record.displayZone || ""),
      ],
    );
    db.run("COMMIT");
  } catch (error) {
    try {
      db.run("ROLLBACK");
    } catch {
      /* already closed */
    }
    throw error;
  }
}

export function readRecord(db: SqlDatabase): StoredUser | null {
  db.exec(SCHEMA);
  const pref = rows(db, "SELECT * FROM prefs WHERE id = 1")[0];
  if (!pref) return null;
  let filters: StoredUser["filters"];
  try {
    filters = JSON.parse(text(pref.filters) || "{}") as StoredUser["filters"];
  } catch {
    filters = undefined;
  }
  return {
    custom: rows(db, "SELECT * FROM meetings ORDER BY name").map((m) => ({
      id: text(m.id),
      name: text(m.name),
      weekday: Number(m.weekday) || 1,
      hour: Number(m.hour) || 0,
      minute: Number(m.minute) || 0,
      zone: text(m.zone),
      durationMinutes: Number(m.duration_minutes) || 60,
      platform: text(m.platform),
      meetingId: text(m.meeting_id),
      password: text(m.password),
      joinUrl: text(m.join_url),
      notes: text(m.notes),
      contactInfo: text(m.contact_info),
      gender: text(m.gender || "ALL"),
      programId: text(m.program_id || "aca"),
      groupId: text(m.group_id),
      language: text(m.language),
      location: text(m.location),
      tags: knownTags(m.tags),
      source: "custom",
    })),
    hiddenIds: rows(db, "SELECT id FROM hidden").map((row) => text(row.id)),
    showCatalog: Number(pref.show_catalog) !== 0,
    theme: pref.theme === "dark" ? "dark" : "light",
    programs: rows(db, "SELECT * FROM programs ORDER BY name").map((p) => ({
      id: text(p.id),
      short: text(p.short),
      name: text(p.name),
    })),
    groups: rows(db, "SELECT * FROM groups ORDER BY name").map((g) => ({
      id: text(g.id),
      name: text(g.name),
      programId: text(g.program_id),
      notes: text(g.notes),
      contactInfo: text(g.contact_info),
      platform: text(g.platform),
      joinUrl: text(g.join_url),
    })),
    alertIds: rows(db, "SELECT id FROM alerts").map((row) => text(row.id)),
    favoriteMeetingIds: rows(db, "SELECT id FROM favorite_meetings").map((row) => text(row.id)),
    favoriteProgramIds: rows(db, "SELECT id FROM favorite_programs").map((row) => text(row.id)),
    favoriteGroupIds: rows(db, "SELECT id FROM favorite_groups").map((row) => text(row.id)),
    alertLeadMinutes: Number(pref.alert_lead) || 15,
    alertsEnabled: Number(pref.alerts_enabled) === 1,
    barPlace: pref.bar_place === "bottom" ? "bottom" : "flush",
    cardSize: pref.card_size === "comfortable" || pref.card_size === "wide" ? pref.card_size : "compact",
    fontId: text(pref.font || "deco"),
    textSize: text(pref.text_size || "m"),
    locale: text(pref.locale || "en"),
    localeChosen: Number(pref.locale_chosen) === 1,
    languageFollowsApp: pref.language_follows == null || Number(pref.language_follows) !== 0,
    alertFavorites: Number(pref.alert_favorites) === 1,
    showExpired: Number(pref.show_expired) === 1,
    displayZone: text(pref.display_zone),
    dossiers: Object.fromEntries(
      rows(db, "SELECT program_id, payload FROM dossiers").flatMap((row) => {
        try {
          const parsed = JSON.parse(text(row.payload));
          return parsed && typeof parsed === "object" ? [[text(row.program_id), parsed]] : [];
        } catch {
          return [];
        }
      }),
    ),
    filters,
    savedAt: Number(pref.saved_at) || 0,
  };
}

async function openDatabase(): Promise<SqlDatabase> {
  const imported = await import("sql.js");
  const initSqlJs = (imported.default ?? imported) as InitSqlJs;
  const sql = await initSqlJs({ locateFile: () => "/sql-wasm.wasm" });
  let bytes: Uint8Array | undefined;
  try {
    bytes = await idbGet<Uint8Array>(FILE_KEY);
  } catch {
    bytes = undefined;
  }
  const db = bytes && bytes.byteLength ? new sql.Database(bytes) : new sql.Database();
  db.exec(SCHEMA);
  try {
    db.run("ALTER TABLE meetings ADD COLUMN tags TEXT");
  } catch {
    /* already there */
  }
  try {
    db.run("ALTER TABLE prefs ADD COLUMN locale TEXT");
  } catch {
    /* already there, or prefs does not exist yet */
  }
  for (const column of ["locale_chosen INTEGER", "language_follows INTEGER", "alert_favorites INTEGER", "font TEXT", "text_size TEXT", "show_expired INTEGER", "display_zone TEXT"]) {
    try {
      db.run(`ALTER TABLE prefs ADD COLUMN ${column}`);
    } catch {
      /* already there */
    }
  }
  return db;
}

function database(): Promise<SqlDatabase> {
  if (typeof window === "undefined") return Promise.reject(new Error("SQLite runs in the browser"));
  opening ??= openDatabase();
  return opening;
}

export async function readSqliteUser(): Promise<StoredUser | null> {
  const db = await database();
  return readRecord(db);
}

export function writeSqliteUser(record: StoredUser): Promise<void> {
  writing = writing
    .catch(() => undefined)
    .then(async () => {
      const db = await database();
      applyRecord(db, record);
      await idbSet(FILE_KEY, db.export());
    });
  return writing;
}
