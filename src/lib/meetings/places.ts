import zips from "@/data/us-zips.json";

export type PlaceParts = {
  continent: string;
  country: string;
  region: string;
};

export type PostalHit = {
  lat: number;
  lng: number;
  label: string;
  coarse: boolean;
};

const US_ZIPS = zips as unknown as Record<string, [number, number]>;

const US: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado",
  CT: "Connecticut", DE: "Delaware", DC: "District of Columbia", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", IA: "Iowa", ID: "Idaho", IL: "Illinois", IN: "Indiana", KS: "Kansas", KY: "Kentucky",
  LA: "Louisiana", MA: "Massachusetts", MD: "Maryland", ME: "Maine", MI: "Michigan", MN: "Minnesota",
  MO: "Missouri", MS: "Mississippi", MT: "Montana", NC: "North Carolina", ND: "North Dakota",
  NE: "Nebraska", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NV: "Nevada", NY: "New York",
  OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VA: "Virginia", VT: "Vermont",
  WA: "Washington", WI: "Wisconsin", WV: "West Virginia", WY: "Wyoming",
};

const CA: Record<string, string> = {
  AB: "Alberta", BC: "British Columbia", MB: "Manitoba", NB: "New Brunswick", NL: "Newfoundland and Labrador",
  NS: "Nova Scotia", NT: "Northwest Territories", NU: "Nunavut", ON: "Ontario", QC: "Quebec",
  SK: "Saskatchewan", YT: "Yukon",
};

const AU: Record<string, string> = {
  NSW: "New South Wales", VIC: "Victoria", QLD: "Queensland", SA: "South Australia", WA: "Western Australia",
  TAS: "Tasmania", NT: "Northern Territory", ACT: "Australian Capital Territory",
};

const BR: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AM: "Amazonas", AP: "Amapá", BA: "Bahia", CE: "Ceará", DF: "Distrito Federal",
  ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão", MG: "Minas Gerais", MS: "Mato Grosso do Sul",
  MT: "Mato Grosso", PA: "Pará", PB: "Paraíba", PE: "Pernambuco", PI: "Piauí", PR: "Paraná", RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte", RO: "Rondônia", RR: "Roraima", RS: "Rio Grande do Sul", SC: "Santa Catarina",
  SE: "Sergipe", SP: "São Paulo", TO: "Tocantins",
};

const NAMED: Record<string, PlaceParts> = {
  adelaide: { continent: "Oceania", country: "Australia", region: "South Australia" },
  australia: { continent: "Oceania", country: "Australia", region: "" },
  "new zealand": { continent: "Oceania", country: "New Zealand", region: "" },
  "united states": { continent: "North America", country: "United States", region: "" },
  "united kingdom": { continent: "Europe", country: "United Kingdom", region: "" },
  england: { continent: "Europe", country: "United Kingdom", region: "England" },
  scotland: { continent: "Europe", country: "United Kingdom", region: "Scotland" },
  wales: { continent: "Europe", country: "United Kingdom", region: "Wales" },
  ireland: { continent: "Europe", country: "Ireland", region: "" },
  canada: { continent: "North America", country: "Canada", region: "" },
  melbourne: { continent: "Oceania", country: "Australia", region: "Victoria" },
  sydney: { continent: "Oceania", country: "Australia", region: "New South Wales" },
  brisbane: { continent: "Oceania", country: "Australia", region: "Queensland" },
  perth: { continent: "Oceania", country: "Australia", region: "Western Australia" },
  hobart: { continent: "Oceania", country: "Australia", region: "Tasmania" },
  darwin: { continent: "Oceania", country: "Australia", region: "Northern Territory" },
  canberra: { continent: "Oceania", country: "Australia", region: "Australian Capital Territory" },
  frankston: { continent: "Oceania", country: "Australia", region: "Victoria" },
  auckland: { continent: "Oceania", country: "New Zealand", region: "" },
  london: { continent: "Europe", country: "United Kingdom", region: "England" },
  "london - north east area": { continent: "Europe", country: "United Kingdom", region: "England" },
  devon: { continent: "Europe", country: "United Kingdom", region: "England" },
  dorset: { continent: "Europe", country: "United Kingdom", region: "England" },
  surrey: { continent: "Europe", country: "United Kingdom", region: "England" },
  leicester: { continent: "Europe", country: "United Kingdom", region: "England" },
  "east midlands area": { continent: "Europe", country: "United Kingdom", region: "England" },
  "west midlands": { continent: "Europe", country: "United Kingdom", region: "England" },
  "west midlands area": { continent: "Europe", country: "United Kingdom", region: "England" },
  "northwest uk": { continent: "Europe", country: "United Kingdom", region: "England" },
  "east coast scotland area": { continent: "Europe", country: "United Kingdom", region: "Scotland" },
  "outer hebrides": { continent: "Europe", country: "United Kingdom", region: "Scotland" },
  paris: { continent: "Europe", country: "France", region: "Île-de-France" },
  france: { continent: "Europe", country: "France", region: "" },
  "grand est": { continent: "Europe", country: "France", region: "Grand Est" },
  berlin: { continent: "Europe", country: "Germany", region: "Berlin" },
  bayern: { continent: "Europe", country: "Germany", region: "Bavaria" },
  hamburg: { continent: "Europe", country: "Germany", region: "Hamburg" },
  bremen: { continent: "Europe", country: "Germany", region: "Bremen" },
  cologne: { continent: "Europe", country: "Germany", region: "North Rhine-Westphalia" },
  deutschland: { continent: "Europe", country: "Germany", region: "" },
  "nordrhein-westfalen": { continent: "Europe", country: "Germany", region: "North Rhine-Westphalia" },
  amsterdam: { continent: "Europe", country: "Netherlands", region: "North Holland" },
  "amesterdam 000": { continent: "Europe", country: "Netherlands", region: "North Holland" },
  alkmaar: { continent: "Europe", country: "Netherlands", region: "North Holland" },
  "noord-holland": { continent: "Europe", country: "Netherlands", region: "North Holland" },
  madrid: { continent: "Europe", country: "Spain", region: "" },
  barcelona: { continent: "Europe", country: "Spain", region: "" },
  lisbon: { continent: "Europe", country: "Portugal", region: "" },
  portugal: { continent: "Europe", country: "Portugal", region: "" },
  rome: { continent: "Europe", country: "Italy", region: "" },
  zurich: { continent: "Europe", country: "Switzerland", region: "" },
  zürich: { continent: "Europe", country: "Switzerland", region: "" },
  suisse: { continent: "Europe", country: "Switzerland", region: "" },
  moscow: { continent: "Europe", country: "Russia", region: "" },
  москва: { continent: "Europe", country: "Russia", region: "" },
  helsingborg: { continent: "Europe", country: "Sweden", region: "" },
  malmö: { continent: "Europe", country: "Sweden", region: "" },
  "jönköping": { continent: "Europe", country: "Sweden", region: "" },
  karlskrona: { continent: "Europe", country: "Sweden", region: "" },
  athens: { continent: "Europe", country: "Greece", region: "" },
  bratislava: { continent: "Europe", country: "Slovakia", region: "" },
  bucharest: { continent: "Europe", country: "Romania", region: "" },
  "são paulo": { continent: "South America", country: "Brazil", region: "São Paulo" },
  "rio de janeiro": { continent: "South America", country: "Brazil", region: "Rio de Janeiro" },
  brasilia: { continent: "South America", country: "Brazil", region: "Distrito Federal" },
  brasília: { continent: "South America", country: "Brazil", region: "Distrito Federal" },
  "area sul": { continent: "South America", country: "Brazil", region: "" },
  nordeste: { continent: "South America", country: "Brazil", region: "" },
  "mexico city": { continent: "North America", country: "Mexico", region: "" },
  "ciudad de méxico": { continent: "North America", country: "Mexico", region: "" },
  medellin: { continent: "South America", country: "Colombia", region: "" },
  medellín: { continent: "South America", country: "Colombia", region: "" },
  uruguay: { continent: "South America", country: "Uruguay", region: "" },
  "santo domingo": { continent: "North America", country: "Dominican Republic", region: "" },
  bridgetown: { continent: "North America", country: "Barbados", region: "" },
  toronto: { continent: "North America", country: "Canada", region: "Ontario" },
  chicago: { continent: "North America", country: "United States", region: "Illinois" },
  alberta: { continent: "North America", country: "Canada", region: "Alberta" },
  manitoba: { continent: "North America", country: "Canada", region: "Manitoba" },
  quebec: { continent: "North America", country: "Canada", region: "Quebec" },
  québec: { continent: "North America", country: "Canada", region: "Quebec" },
  newfoundland: { continent: "North America", country: "Canada", region: "Newfoundland and Labrador" },
  usa: { continent: "North America", country: "United States", region: "" },
  cairo: { continent: "Africa", country: "Egypt", region: "" },
  johannesburg: { continent: "Africa", country: "South Africa", region: "" },
  rosettenville: { continent: "Africa", country: "South Africa", region: "Gauteng" },
  "eastern africa": { continent: "Africa", country: "", region: "" },
  lagos: { continent: "Africa", country: "Nigeria", region: "" },
  tehran: { continent: "Asia", country: "Iran", region: "" },
  shiraz: { continent: "Asia", country: "Iran", region: "" },
  lahore: { continent: "Asia", country: "Pakistan", region: "Punjab" },
  punjab: { continent: "Asia", country: "Pakistan", region: "Punjab" },
  "tel aviv": { continent: "Asia", country: "Israel", region: "" },
  bangkok: { continent: "Asia", country: "Thailand", region: "" },
  "koh samui": { continent: "Asia", country: "Thailand", region: "" },
  singapore: { continent: "Asia", country: "Singapore", region: "" },
  "hong kong": { continent: "Asia", country: "Hong Kong", region: "" },
  manila: { continent: "Asia", country: "Philippines", region: "" },
  jakarta: { continent: "Asia", country: "Indonesia", region: "" },
  dhaka: { continent: "Asia", country: "Bangladesh", region: "" },
  nepal: { continent: "Asia", country: "Nepal", region: "" },
  lumbini: { continent: "Asia", country: "Nepal", region: "" },
  tokyo: { continent: "Asia", country: "Japan", region: "" },
  nsw: { continent: "Oceania", country: "Australia", region: "New South Wales" },
  qld: { continent: "Oceania", country: "Australia", region: "Queensland" },
  tas: { continent: "Oceania", country: "Australia", region: "Tasmania" },
};

const FR_REGIONS = new Set([
  "Île-de-France", "Bretagne", "Occitanie", "Nouvelle-Aquitaine", "Grand Est", "Pays de la Loire",
  "Centre", "Normandie", "Hauts-de-France", "Provence-Alpes-Côte d'Azur", "Auvergne-Rhône-Alpes",
  "Bourgogne-Franche-Comté", "Corse",
]);

const DE_REGIONS = new Set([
  "Bayern", "Berlin", "Hamburg", "Hessen", "Nordrhein-Westfalen", "Bremen", "Baden-Württemberg",
  "Niedersachsen", "Sachsen", "Thüringen", "Brandenburg", "Saarland", "Schleswig-Holstein",
  "Mecklenburg-Vorpommern", "Rheinland-Pfalz", "Sachsen-Anhalt",
]);

export function placeParts(location: string): PlaceParts | null {
  const raw = location.trim();
  if (!raw) return null;
  const named = NAMED[raw.toLowerCase()];
  if (named) return named.country || named.continent ? named : null;
  const suffix = raw.includes(",") ? raw.split(",").pop()!.trim() : "";
  if (US[suffix]) return { continent: "North America", country: "United States", region: US[suffix] };
  if (AU[suffix]) return { continent: "Oceania", country: "Australia", region: AU[suffix] };
  if (CA[suffix] || suffix === "Ontario" || suffix === "Québec" || suffix === "Quebec") {
    return { continent: "North America", country: "Canada", region: CA[suffix] || (suffix === "Québec" ? "Quebec" : suffix) };
  }
  if (BR[suffix]) return { continent: "South America", country: "Brazil", region: BR[suffix] };
  if (suffix === "France" || FR_REGIONS.has(suffix)) return { continent: "Europe", country: "France", region: suffix === "France" ? "" : suffix };
  if (suffix === "Ireland") return { continent: "Europe", country: "Ireland", region: "" };
  if (suffix === "England" || suffix === "Scotland" || suffix === "Wales" || suffix === "Northern Ireland") {
    return { continent: "Europe", country: "United Kingdom", region: suffix };
  }
  if (suffix === "United Kingdom") return { continent: "Europe", country: "United Kingdom", region: "" };
  if (suffix === "United States" || suffix === "USA") return { continent: "North America", country: "United States", region: "" };
  if (suffix === "Canada") return { continent: "North America", country: "Canada", region: "" };
  if (suffix === "Australia") return { continent: "Oceania", country: "Australia", region: "" };
  if (suffix === "New Zealand") return { continent: "Oceania", country: "New Zealand", region: "" };
  if (suffix === "Singapore") return { continent: "Asia", country: "Singapore", region: "" };
  if (DE_REGIONS.has(suffix) || suffix === "Germany") {
    return { continent: "Europe", country: "Germany", region: suffix === "Germany" ? "" : suffix };
  }
  return null;
}

export function areaId(kind: "continent" | "country" | "region", parts: PlaceParts) {
  if (kind === "continent") return `continent:${parts.continent}`;
  if (kind === "country") return `country:${parts.country}`;
  return `region:${parts.country}:${parts.region}`;
}

export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const r = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(h)));
}

const CA_FSA: Record<string, PostalHit> = {
  A: { lat: 47.5615, lng: -52.7126, label: "Newfoundland", coarse: true },
  B: { lat: 44.6488, lng: -63.5752, label: "Nova Scotia", coarse: true },
  C: { lat: 46.2382, lng: -63.1311, label: "Prince Edward Island", coarse: true },
  E: { lat: 45.9636, lng: -66.6431, label: "New Brunswick", coarse: true },
  G: { lat: 46.8139, lng: -71.208, label: "Quebec", coarse: true },
  H: { lat: 45.5017, lng: -73.5673, label: "Montreal area", coarse: true },
  J: { lat: 45.5017, lng: -73.5673, label: "Quebec", coarse: true },
  K: { lat: 45.4215, lng: -75.6972, label: "Ottawa area", coarse: true },
  L: { lat: 43.6532, lng: -79.3832, label: "Ontario", coarse: true },
  M: { lat: 43.6532, lng: -79.3832, label: "Toronto area", coarse: true },
  N: { lat: 43.2557, lng: -79.8711, label: "Southwestern Ontario", coarse: true },
  P: { lat: 46.4917, lng: -81.0101, label: "Northern Ontario", coarse: true },
  R: { lat: 49.8951, lng: -97.1384, label: "Manitoba", coarse: true },
  S: { lat: 50.4452, lng: -104.6189, label: "Saskatchewan", coarse: true },
  T: { lat: 51.0447, lng: -114.0719, label: "Alberta", coarse: true },
  V: { lat: 49.2827, lng: -123.1207, label: "British Columbia", coarse: true },
  X: { lat: 62.454, lng: -114.3718, label: "Northwest Territories", coarse: true },
  Y: { lat: 60.7212, lng: -135.0568, label: "Yukon", coarse: true },
};

const UK_AREA: Record<string, PostalHit> = {
  EC: { lat: 51.515, lng: -0.09, label: "London", coarse: false },
  WC: { lat: 51.517, lng: -0.12, label: "London", coarse: false },
  SW: { lat: 51.46, lng: -0.15, label: "London", coarse: false },
  SE: { lat: 51.47, lng: -0.05, label: "London", coarse: false },
  NW: { lat: 51.55, lng: -0.2, label: "London", coarse: false },
  N: { lat: 51.57, lng: -0.1, label: "London", coarse: false },
  E: { lat: 51.55, lng: -0.05, label: "London", coarse: false },
  W: { lat: 51.51, lng: -0.22, label: "London", coarse: false },
  B: { lat: 52.4862, lng: -1.8904, label: "Birmingham", coarse: true },
  M: { lat: 53.4808, lng: -2.2426, label: "Manchester", coarse: true },
  L: { lat: 53.4084, lng: -2.9916, label: "Liverpool", coarse: true },
  G: { lat: 55.8642, lng: -4.2518, label: "Glasgow", coarse: true },
  EH: { lat: 55.9533, lng: -3.1883, label: "Edinburgh", coarse: true },
  CF: { lat: 51.4816, lng: -3.1791, label: "Cardiff", coarse: true },
  BT: { lat: 54.5973, lng: -5.9301, label: "Belfast", coarse: true },
  LS: { lat: 53.8008, lng: -1.5491, label: "Leeds", coarse: true },
  BS: { lat: 51.4545, lng: -2.5879, label: "Bristol", coarse: true },
  OX: { lat: 51.752, lng: -1.2577, label: "Oxford", coarse: true },
  CB: { lat: 52.2053, lng: 0.1218, label: "Cambridge", coarse: true },
};

const AU_RANGE: { from: number; to: number; hit: PostalHit }[] = [
  { from: 200, to: 299, hit: { lat: -35.2809, lng: 149.13, label: "Canberra", coarse: true } },
  { from: 800, to: 899, hit: { lat: -12.4634, lng: 130.8456, label: "Darwin", coarse: true } },
  { from: 1000, to: 2599, hit: { lat: -33.8688, lng: 151.2093, label: "Sydney", coarse: true } },
  { from: 2600, to: 2618, hit: { lat: -35.2809, lng: 149.13, label: "Canberra", coarse: true } },
  { from: 2619, to: 2899, hit: { lat: -33.8688, lng: 151.2093, label: "New South Wales", coarse: true } },
  { from: 2900, to: 2920, hit: { lat: -35.2809, lng: 149.13, label: "Canberra", coarse: true } },
  { from: 3000, to: 3999, hit: { lat: -37.8136, lng: 144.9631, label: "Melbourne", coarse: true } },
  { from: 4000, to: 4999, hit: { lat: -27.4698, lng: 153.0251, label: "Brisbane", coarse: true } },
  { from: 5000, to: 5999, hit: { lat: -34.9285, lng: 138.6007, label: "Adelaide", coarse: true } },
  { from: 6000, to: 6999, hit: { lat: -31.9505, lng: 115.8605, label: "Perth", coarse: true } },
  { from: 7000, to: 7999, hit: { lat: -42.8821, lng: 147.3272, label: "Hobart", coarse: true } },
];

const BR_DIGIT: PostalHit[] = [
  { lat: -23.5505, lng: -46.6333, label: "São Paulo", coarse: true },
  { lat: -22.0, lng: -48.0, label: "São Paulo state", coarse: true },
  { lat: -22.9068, lng: -43.1729, label: "Rio de Janeiro", coarse: true },
  { lat: -19.9167, lng: -43.9345, label: "Minas Gerais", coarse: true },
  { lat: -12.9777, lng: -38.5016, label: "Bahia", coarse: true },
  { lat: -8.0476, lng: -34.877, label: "Pernambuco", coarse: true },
  { lat: -3.7172, lng: -38.5433, label: "Ceará", coarse: true },
  { lat: -15.7975, lng: -47.8919, label: "Brasília", coarse: true },
  { lat: -25.4284, lng: -49.2733, label: "Paraná", coarse: true },
  { lat: -30.0346, lng: -51.2177, label: "Rio Grande do Sul", coarse: true },
];

export function resolvePostal(raw: string): PostalHit | null {
  const code = raw.trim().toUpperCase();
  if (!code) return null;
  const us = code.match(/^(\d{5})(?:-\d{4})?$/);
  if (us) {
    const hit = US_ZIPS[us[1]];
    if (!hit) return null;
    return { lat: hit[0], lng: hit[1], label: us[1], coarse: false };
  }
  const ca = code.match(/^([ABCEGHJ-NPRSTVXY])\d[ABCEGHJ-NPRSTV-Z](?:\s?\d[ABCEGHJ-NPRSTV-Z]\d)?$/);
  if (ca) {
    const hit = CA_FSA[ca[1]];
    return hit ? { ...hit, label: `${hit.label} (${code})` } : null;
  }
  const uk = code.match(/^([A-Z]{1,2})\d[A-Z\d]?/);
  if (uk && /[A-Z]/.test(code) && /\d/.test(code)) {
    const hit = UK_AREA[uk[1]];
    if (hit) return { ...hit, label: `${hit.label} (${code})` };
    return { lat: 54.0, lng: -2.5, label: `United Kingdom (${code})`, coarse: true };
  }
  if (/^\d{4}$/.test(code)) {
    const n = Number(code);
    const range = AU_RANGE.find((item) => n >= item.from && n <= item.to);
    return range ? { ...range.hit, label: `${range.hit.label} (${code})` } : null;
  }
  const br = code.match(/^(\d{5})-?(\d{3})$/);
  if (br) {
    const hit = BR_DIGIT[Number(br[1][0])] ?? BR_DIGIT[1];
    return { ...hit, label: `${hit.label} (${br[1]}-${br[2]})` };
  }
  return null;
}
