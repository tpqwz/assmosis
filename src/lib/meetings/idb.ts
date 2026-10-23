import type { Filters } from "./types";
import type { Dossier } from "./dossier";

const DB_NAME = "nextmeeting";
const DB_VERSION = 1;
const STORE = "kv";

export type StoredUser = {
  custom: unknown[];
  hiddenIds: string[];
  showCatalog: boolean;
  theme: "light" | "dark";
  programs?: unknown[];
  groups?: unknown[];
  alertIds?: string[];
  favoriteMeetingIds?: string[];
  favoriteProgramIds?: string[];
  favoriteGroupIds?: string[];
  alertLeadMinutes?: number;
  alertsEnabled?: boolean;
  barPlace?: "flush" | "bottom";
  cardSize?: "compact" | "comfortable" | "wide";
  fontId?: string;
  textSize?: string;
  locale?: string;
  localeChosen?: boolean;
  languageFollowsApp?: boolean;
  alertFavorites?: boolean;
  dossiers?: Record<string, Dossier>;
  filters?: Filters;
  savedAt?: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
}

export async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  try {
    return await new Promise<T | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error ?? new Error("IndexedDB read failed"));
    });
  } finally {
    db.close();
  }
}

export async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB write failed"));
      tx.onabort = () => reject(tx.error ?? new Error("IndexedDB write aborted"));
    });
  } finally {
    db.close();
  }
}

export function registerOfflineShell() {
  if (!import.meta.env.PROD) return;
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  void navigator.serviceWorker.register("/sw.js").catch(() => {});
}
