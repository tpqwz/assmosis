export const FONT_IDS = ["deco", "ledger", "sans", "plex", "argon", "neon", "xenon", "radon", "atkinson"] as const;
export type FontId = (typeof FONT_IDS)[number];

export const TEXT_SIZES = ["s", "m", "l", "xl"] as const;
export type TextSize = (typeof TEXT_SIZES)[number];

export const TYPE_KEY = "nextmeeting-type";

export const TYPEFACES: { id: FontId; label: string; detail: string }[] = [
  { id: "deco", label: "Deco", detail: "Josefin Sans" },
  { id: "ledger", label: "Ledger", detail: "Fraunces" },
  { id: "sans", label: "Sans", detail: "Source Sans 3" },
  { id: "plex", label: "Plex", detail: "IBM Plex Mono" },
  { id: "argon", label: "Argon", detail: "Monaspace Argon" },
  { id: "neon", label: "Neon", detail: "Monaspace Neon" },
  { id: "xenon", label: "Xenon", detail: "Monaspace Xenon" },
  { id: "radon", label: "Radon", detail: "Monaspace Radon" },
  { id: "atkinson", label: "Atkinson", detail: "Atkinson Hyperlegible Mono" },
];

const FONT_SET = new Set<string>(FONT_IDS);

export function normalizeFont(value: unknown): FontId {
  return typeof value === "string" && FONT_SET.has(value) ? (value as FontId) : "deco";
}

export function normalizeTextSize(value: unknown): TextSize {
  return value === "s" || value === "l" || value === "xl" ? value : "m";
}

export function applyTypeface(font: FontId, size: TextSize) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (font === "deco") delete root.dataset.font;
  else root.dataset.font = font;
  if (size === "m") delete root.dataset.size;
  else root.dataset.size = size;
  try {
    localStorage.setItem(TYPE_KEY, JSON.stringify({ font, size }));
  } catch {
    /* private mode */
  }
}
