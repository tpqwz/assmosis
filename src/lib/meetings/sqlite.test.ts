import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import initSqlJs from "sql.js";
import { applyRecord, readRecord } from "./sqlite.ts";
import type { StoredUser } from "./idb.ts";

test("sqlite keeps meetings, programs, and settings", async () => {
  const sql = await initSqlJs({
    wasmBinary: readFileSync(new URL("../../../node_modules/sql.js/dist/sql-wasm.wasm", import.meta.url)),
  });
  const db = new sql.Database();
  const record: StoredUser = {
    custom: [
      {
        id: "m1",
        name: "Thursday night",
        weekday: 4,
        hour: 19,
        minute: 30,
        zone: "Australia/Adelaide",
        durationMinutes: 90,
        platform: "zoom",
        meetingId: "123456789",
        password: "hope",
        joinUrl: "https://zoom.us/j/123456789",
        notes: "Bring the book",
        contactInfo: "",
        gender: "ALL",
        programId: "na",
        groupId: "",
        language: "English",
        location: "Adelaide",
        source: "custom",
      },
    ],
    hiddenIds: ["cat-1"],
    showCatalog: true,
    theme: "dark",
    programs: [{ id: "local", short: "LOC", name: "Local fellowship" }],
    groups: [
      {
        id: "g1",
        name: "Thursday chat",
        programId: "na",
        notes: "",
        contactInfo: "",
        platform: "telegram",
        joinUrl: "https://t.me/example",
      },
    ],
    alertIds: ["m1"],
    alertLeadMinutes: 10,
    alertsEnabled: true,
    barPlace: "bottom",
    cardSize: "wide",
    fontId: "ledger",
    textSize: "l",
    filters: {
      q: "night",
      day: "",
      who: "",
      platform: "",
      source: "",
      programs: ["na"],
      languages: ["English"],
      locations: ["Adelaide"],
      areas: [],
      modes: [],
      tags: [],
      favorites: false,
      hideMissingPasscode: false,
      near: "",
      radiusKm: 80,
      originLat: null,
      originLng: null,
    },
    savedAt: 42,
  };
  applyRecord(db, record);
  const again = new sql.Database(db.export());
  const loaded = readRecord(again);
  assert.ok(loaded);
  assert.equal(loaded.custom.length, 1);
  assert.equal((loaded.custom[0] as { name: string }).name, "Thursday night");
  assert.equal((loaded.custom[0] as { location: string }).location, "Adelaide");
  assert.deepEqual(loaded.hiddenIds, ["cat-1"]);
  assert.equal((loaded.programs?.[0] as { short: string }).short, "LOC");
  assert.equal((loaded.groups?.[0] as { platform: string }).platform, "telegram");
  assert.deepEqual(loaded.alertIds, ["m1"]);
  assert.equal(loaded.theme, "dark");
  assert.equal(loaded.barPlace, "bottom");
  assert.equal(loaded.cardSize, "wide");
  assert.equal(loaded.fontId, "ledger");
  assert.equal(loaded.textSize, "l");
  assert.equal(loaded.alertLeadMinutes, 10);
  assert.equal(loaded.alertsEnabled, true);
  assert.equal(loaded.locale, "en");
  assert.equal(loaded.savedAt, 42);
  const aliases = again.exec(
    "SELECT name FROM aliases WHERE entity_id = 'aa' AND locale = 'es'",
  ) as unknown as { values: string[][] }[];
  assert.equal(aliases[0].values[0][0], "Alcohólicos Anónimos");
  assert.deepEqual(loaded.filters?.programs, ["na"]);
  assert.equal(readRecord(new sql.Database()), null);
});
