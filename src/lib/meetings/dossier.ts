import type { Program } from "./programs";
import { localizedProgram } from "./programs";
import { normalizeLocale } from "./i18n";

/** Wikidata items checked by hand. Search is used only when this list has no row. */
export const KNOWN_QIDS: Record<string, string> = {
  aa: "Q18231",
  na: "Q1502731",
  alanon: "Q425084",
  oa: "Q2042328",
  aca: "Q4353225",
  schizo: "Q7431615",
  ea: "Q1339104",
  slaa: "Q567615",
};

export type Dossier = {
  programId: string;
  qid: string;
  labels: Record<string, string>;
  description: string;
  website: string;
  wikipedia: string;
  fetchedAt: number;
};

const LANGS = "en|es|pt|fr|de|la";
const UA = "Assmosis/1.0 (local fellowship directory)";

type SearchHit = { id?: string; label?: string; description?: string };

function api(params: Record<string, string>) {
  const q = new URLSearchParams({ ...params, format: "json", origin: "*" });
  return `https://www.wikidata.org/w/api.php?${q}`;
}

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": UA } });
  if (!res.ok) throw new Error(`Wikidata answered ${res.status}`);
  return res.json();
}

function pickQid(name: string, hits: SearchHit[]): string {
  const want = name.trim().toLowerCase();
  const exact = hits.find((hit) => (hit.label || "").trim().toLowerCase() === want && hit.id);
  if (exact?.id) return exact.id;
  const near = hits.find((hit) => {
    const label = (hit.label || "").toLowerCase();
    const desc = hit.description || "";
    return (
      hit.id &&
      label.includes(want.split(" ")[0] || want) &&
      /organization|fellowship|twelve|program|anonymous|support group|peer/i.test(desc)
    );
  });
  return near?.id || "";
}

function stringClaim(entity: Record<string, unknown>, prop: string): string {
  const claims = entity.claims as Record<string, Array<{ mainsnak?: { datavalue?: { value?: unknown } } }>> | undefined;
  const value = claims?.[prop]?.[0]?.mainsnak?.datavalue?.value;
  return typeof value === "string" ? value : "";
}

export async function fetchDossier(program: Pick<Program, "id" | "name">, knownQid = ""): Promise<Dossier | null> {
  let qid = knownQid || KNOWN_QIDS[program.id] || "";
  if (!qid) {
    const found = (await getJson(
      api({
        action: "wbsearchentities",
        search: program.name,
        language: "en",
        limit: "5",
      }),
    )) as { search?: SearchHit[] };
    qid = pickQid(program.name, found.search || []);
  }
  if (!qid) return null;
  const data = (await getJson(
    api({
      action: "wbgetentities",
      ids: qid,
      props: "labels|descriptions|claims|sitelinks",
      languages: LANGS,
      sitefilter: "enwiki",
    }),
  )) as { entities?: Record<string, Record<string, unknown>> };
  const entity = data.entities?.[qid];
  if (!entity || entity.missing) return null;
  const labels: Record<string, string> = {};
  const rawLabels = (entity.labels || {}) as Record<string, { value?: string }>;
  for (const [lang, row] of Object.entries(rawLabels)) {
    if (row?.value) labels[lang] = row.value;
  }
  const descriptions = (entity.descriptions || {}) as Record<string, { value?: string }>;
  const description = descriptions.en?.value || Object.values(descriptions)[0]?.value || "";
  const sitelinks = (entity.sitelinks || {}) as Record<string, { title?: string }>;
  const wikiTitle = sitelinks.enwiki?.title || "";
  return {
    programId: program.id,
    qid,
    labels,
    description,
    website: stringClaim(entity, "P856"),
    wikipedia: wikiTitle ? `https://en.wikipedia.org/wiki/${encodeURIComponent(wikiTitle.replace(/ /g, "_"))}` : "",
    fetchedAt: Date.now(),
  };
}

export function shownProgram(
  program: Program,
  locale: string,
  dossier?: Dossier | null,
): { short: string; name: string } {
  const base = localizedProgram(program, locale);
  const fromWiki = dossier?.labels?.[normalizeLocale(locale)];
  return fromWiki ? { short: base.short, name: fromWiki } : base;
}

export function isDossier(raw: unknown): raw is Dossier {
  if (!raw || typeof raw !== "object") return false;
  const row = raw as Dossier;
  return typeof row.programId === "string" && typeof row.qid === "string";
}
