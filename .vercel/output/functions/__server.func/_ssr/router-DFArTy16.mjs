import { i as __toESM } from "../_runtime.mjs";
import { J as require_react, S as require_jsx_runtime, _ as lazyRouteComponent, f as Scripts, g as Outlet, h as createRouter, p as HeadContent, v as createFileRoute, x as useRouter, y as createRootRoute } from "../_libs/@tanstack/react-router+[...].mjs";
import { J as useMeetingStore, f as asPlatform, p as buildJoinUrl, q as uid, u as WEEKDAYS, z as programIdFromLabel } from "./store-D4IrIlYG.mjs";
import { b as FileText, i as TriangleAlert, t as X, x as FileSpreadsheet } from "../_libs/lucide-react.mjs";
import { a as union, i as string, n as number, r as object, t as literal } from "../_libs/zod.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
import { n as utils, r as writeSync, t as readSync } from "../_libs/xlsx.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-DFArTy16.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";
function errorMessage(error) {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return FALLBACK_MESSAGE;
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: errorMessage(error)
			})
		]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var CONNECTOR_TOKEN_READY_EVENT = "grok:connector-token-ready";
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
var ConnectorTokenReadySchema = EnvelopeSchema.extend({ type: literal("connector-token-ready") });
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Origin of the Grok embedder framing this page, or null when the page runs
* top-level (download/export, local `npm run dev`, deployed sites) or under a
* non-Grok parent. Client-only; null during SSR.
*/
function resolveCurrentEmbedderOrigin() {
	if (typeof window === "undefined") return null;
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	return resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	const parentOrigin = resolveCurrentEmbedderOrigin();
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onHello = (data) => {
		if (!HelloSchema.safeParse(data).success) return;
		announce();
	};
	const onNavigate = (data) => {
		const parsed = NavigateSchema.safeParse(data);
		if (!parsed.success) return;
		navigate(parsed.data.path);
		queueMicrotask(reportLocation);
	};
	const onHistory = (data) => {
		const parsed = HistorySchema.safeParse(data);
		if (!parsed.success) return;
		if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
		window.history.go(parsed.data.delta);
	};
	const onConnectorTokenReady = (data) => {
		if (!ConnectorTokenReadySchema.safeParse(data).success) return;
		window.dispatchEvent(new Event(CONNECTOR_TOKEN_READY_EVENT));
	};
	const hostMessageHandlers = /* @__PURE__ */ new Map([
		["hello", onHello],
		["navigate", onNavigate],
		["history", onHistory],
		["connector-token-ready", onConnectorTokenReady]
	]);
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		hostMessageHandlers.get(envelope.data.type)?.(event.data);
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
var CSV_HEADERS = [
	"Name",
	"Weekday",
	"Time",
	"Timezone",
	"Duration Minutes",
	"Platform",
	"Meeting ID",
	"Password",
	"Join URL",
	"Notes",
	"Contact",
	"Gender",
	"Program",
	"Language",
	"Location"
];
var HEADER_ALIASES = {
	name: "Name",
	title: "Name",
	meeting: "Name",
	weekday: "Weekday",
	day: "Weekday",
	"day of week": "Weekday",
	time: "Time",
	"start time": "Time",
	timezone: "Timezone",
	"time zone": "Timezone",
	tz: "Timezone",
	zone: "Timezone",
	duration: "Duration Minutes",
	"duration minutes": "Duration Minutes",
	minutes: "Duration Minutes",
	platform: "Platform",
	type: "Platform",
	"meeting id": "Meeting ID",
	meetingid: "Meeting ID",
	id: "Meeting ID",
	"zoom id": "Meeting ID",
	"zoom room": "Meeting ID",
	room: "Meeting ID",
	password: "Password",
	passcode: "Password",
	pwd: "Password",
	"join url": "Join URL",
	joinurl: "Join URL",
	url: "Join URL",
	link: "Join URL",
	"zoom url": "Join URL",
	notes: "Notes",
	note: "Notes",
	description: "Notes",
	contact: "Contact",
	"contact info": "Contact",
	email: "Contact",
	gender: "Gender",
	who: "Gender",
	program: "Program",
	fellowship: "Program",
	language: "Language",
	lang: "Language",
	location: "Location",
	place: "Location",
	city: "Location"
};
function csvEscape(value) {
	if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, "\"\"")}"`;
	return value;
}
function timeString(hour, minute) {
	return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
function weekdayLabel(n) {
	return WEEKDAYS.find((d) => d.value === n)?.long ?? String(n);
}
function meetingToRow(m) {
	return {
		Name: m.name,
		Weekday: weekdayLabel(m.weekday),
		Time: timeString(m.hour, m.minute),
		Timezone: m.zone,
		"Duration Minutes": String(m.durationMinutes || 60),
		Platform: m.platform,
		"Meeting ID": m.meetingId,
		Password: m.password,
		"Join URL": m.joinUrl || buildJoinUrl(m) || "",
		Notes: m.notes,
		Contact: m.contactInfo,
		Gender: m.gender,
		Program: m.programId || "aca",
		Language: m.language || "",
		Location: m.location || ""
	};
}
function meetingsToCsv(meetings) {
	return [CSV_HEADERS.join(","), ...meetings.map((m) => {
		const row = meetingToRow(m);
		return CSV_HEADERS.map((h) => csvEscape(row[h] ?? "")).join(",");
	})].join("\r\n") + "\r\n";
}
function meetingsToSheetRows(meetings) {
	return [[...CSV_HEADERS], ...meetings.map((m) => {
		const row = meetingToRow(m);
		return CSV_HEADERS.map((h) => row[h] ?? "");
	})];
}
function parseCsvLine(line) {
	const out = [];
	let cur = "";
	let quoted = false;
	for (let i = 0; i < line.length; i++) {
		const ch = line[i];
		if (quoted) {
			if (ch === "\"") {
				if (line[i + 1] === "\"") {
					cur += "\"";
					i++;
				} else quoted = false;
			} else cur += ch;
		} else if (ch === "\"") quoted = true;
		else if (ch === ",") {
			out.push(cur);
			cur = "";
		} else cur += ch;
	}
	out.push(cur);
	return out;
}
function parseCsv(text) {
	const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
	const rows = [];
	let buf = "";
	let quoted = false;
	for (let i = 0; i < normalized.length; i++) {
		const ch = normalized[i];
		if (ch === "\"") {
			quoted = !quoted;
			buf += ch;
		} else if (ch === "\n" && !quoted) {
			if (buf.trim()) rows.push(parseCsvLine(buf));
			buf = "";
		} else buf += ch;
	}
	if (buf.trim()) rows.push(parseCsvLine(buf));
	return rows;
}
function parseWeekday(raw) {
	const s = raw.trim().toLowerCase();
	if (!s) return null;
	const asNum = Number(s);
	if (asNum >= 1 && asNum <= 7) return asNum;
	return {
		mon: 1,
		monday: 1,
		tue: 2,
		tues: 2,
		tuesday: 2,
		wed: 3,
		weds: 3,
		wednesday: 3,
		thu: 4,
		thur: 4,
		thurs: 4,
		thursday: 4,
		fri: 5,
		friday: 5,
		sat: 6,
		saturday: 6,
		sun: 7,
		sunday: 7
	}[s] ?? null;
}
function parseTime(raw) {
	const s = raw.trim();
	if (!s) return null;
	const ampm = s.match(/^(\d{1,2})(?::(\d{2}))?\s*([ap]m?)$/i);
	if (ampm) {
		let hour = Number(ampm[1]);
		const minute = Number(ampm[2] || 0);
		const mer = ampm[3].toLowerCase();
		if (mer.startsWith("p") && hour < 12) hour += 12;
		if (mer.startsWith("a") && hour === 12) hour = 0;
		return {
			hour,
			minute
		};
	}
	const hm = s.match(/^(\d{1,2}):(\d{2})$/);
	if (hm) return {
		hour: Number(hm[1]),
		minute: Number(hm[2])
	};
	const hourOnly = s.match(/^(\d{1,2})$/);
	if (hourOnly) return {
		hour: Number(hourOnly[1]),
		minute: 0
	};
	return null;
}
function parsePlatform(raw) {
	return asPlatform(raw);
}
function parseGender(raw) {
	const s = raw.trim().toLowerCase();
	if (s.includes("women") || s === "w" || s === "women_only") return "WOMEN_ONLY";
	if (s.includes("men") || s === "m" || s === "men_only") return "MEN_ONLY";
	return "ALL";
}
function rowToMeeting(row) {
	const name = (row.Name || "").trim();
	if (!name) return null;
	const weekday = parseWeekday(row.Weekday || "");
	const time = parseTime(row.Time || "");
	if (weekday == null || !time) return null;
	const duration = Number(row["Duration Minutes"] || 60) || 60;
	const platform = parsePlatform(row.Platform || "");
	return {
		id: uid(),
		name,
		weekday,
		hour: time.hour,
		minute: time.minute,
		zone: (row.Timezone || "").trim() || "America/New_York",
		durationMinutes: duration,
		platform,
		meetingId: (row["Meeting ID"] || "").trim(),
		password: (row.Password || "").trim(),
		joinUrl: (row["Join URL"] || "").trim(),
		notes: (row.Notes || "").trim(),
		contactInfo: (row.Contact || "").trim(),
		gender: parseGender(row.Gender || ""),
		programId: programIdFromLabel(row.Program || "aca"),
		groupId: "",
		language: (row.Language || "").trim(),
		location: (row.Location || "").trim(),
		source: "custom"
	};
}
function mapHeader(cell) {
	return HEADER_ALIASES[cell.trim().toLowerCase().replace(/[_-]+/g, " ")] ?? null;
}
function rowsToMeetings(grid) {
	if (grid.length < 2) return [];
	const header = grid[0].map((h) => mapHeader(h));
	const meetings = [];
	for (const cells of grid.slice(1)) {
		if (!cells.some((c) => c && c.trim())) continue;
		const row = {};
		header.forEach((h, i) => {
			if (h) row[h] = cells[i] ?? "";
		});
		const meeting = rowToMeeting(row);
		if (meeting) meetings.push(meeting);
	}
	return meetings;
}
function parseMeetingsCsv(text) {
	return rowsToMeetings(parseCsv(text));
}
function parseMeetingsWorkbook(buffer) {
	const wb = readSync(buffer, { type: "array" });
	const sheetName = wb.SheetNames[0];
	if (!sheetName) return [];
	const sheet = wb.Sheets[sheetName];
	return rowsToMeetings(utils.sheet_to_json(sheet, {
		header: 1,
		raw: false,
		defval: ""
	}).map((r) => r.map((c) => String(c ?? ""))));
}
function buildXlsxBytes(meetings) {
	const ws = utils.aoa_to_sheet(meetingsToSheetRows(meetings));
	ws["!cols"] = CSV_HEADERS.map((h) => ({ wch: Math.max(14, h.length + 2) }));
	const wb = utils.book_new();
	utils.book_append_sheet(wb, ws, "Meetings");
	const out = writeSync(wb, {
		bookType: "xlsx",
		type: "array"
	});
	return out instanceof Uint8Array ? out : new Uint8Array(out);
}
function downloadBlob(filename, blob) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1500);
}
function downloadBytes(filename, bytes, mime) {
	const copy = new Uint8Array(bytes.byteLength);
	copy.set(bytes);
	downloadBlob(filename, new Blob([copy.buffer], { type: mime }));
}
function stampFilename(base, ext) {
	const d = /* @__PURE__ */ new Date();
	const pad = (n) => String(n).padStart(2, "0");
	return `${base}-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.${ext}`;
}
function ImportExport() {
	const open = useMeetingStore((s) => s.importOpen);
	const setImportOpen = useMeetingStore((s) => s.setImportOpen);
	const importCustom = useMeetingStore((s) => s.importCustom);
	const custom = useMeetingStore((s) => s.custom);
	const [mode, setMode] = (0, import_react.useState)("merge");
	const [previewCount, setPreviewCount] = (0, import_react.useState)(null);
	const [pending, setPending] = (0, import_react.useState)(null);
	if (!open) return null;
	async function onFile(file) {
		const name = file.name.toLowerCase();
		try {
			let meetings;
			if (name.endsWith(".xlsx") || name.endsWith(".xls")) meetings = parseMeetingsWorkbook(await file.arrayBuffer());
			else meetings = parseMeetingsCsv(await file.text());
			if (meetings.length === 0) {
				toast("No valid rows found — need Name, Weekday, and Time");
				setPending(null);
				setPreviewCount(0);
				return;
			}
			setPending(meetings);
			setPreviewCount(meetings.length);
		} catch {
			toast("Could not read that file");
		}
	}
	function apply() {
		if (!pending?.length) {
			toast("Choose a CSV or Excel file first");
			return;
		}
		const n = importCustom(pending, mode);
		toast(`Imported ${n} meeting${n === 1 ? "" : "s"}`);
		setPending(null);
		setPreviewCount(null);
	}
	function downloadTemplate(kind) {
		const sample = useMeetingStore.getState().custom.slice(0, 3);
		const rows = sample.length ? sample : [{
			id: "sample",
			name: "Sunday Homegroup",
			weekday: 7,
			hour: 19,
			minute: 0,
			zone: "America/New_York",
			durationMinutes: 60,
			platform: "zoom",
			meetingId: "123 4567 8901",
			password: "serenity",
			joinUrl: "",
			notes: "Example row — replace with your meetings",
			contactInfo: "",
			gender: "ALL",
			programId: "aca",
			groupId: "",
			language: "English",
			location: "",
			source: "custom"
		}];
		if (kind === "csv") downloadBlob(stampFilename("nextmeeting-template", "csv"), new Blob([meetingsToCsv(rows)], { type: "text/csv" }));
		else downloadBytes(stampFilename("nextmeeting-template", "xlsx"), buildXlsxBytes(rows), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-50 flex items-end justify-center md:items-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "sheet-backdrop absolute inset-0",
			"aria-label": "Close import",
			onClick: () => setImportOpen(false)
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative z-10 w-full max-w-[500px] rounded-t-xl bg-[var(--color-card)] p-5 shadow-2xl md:rounded-xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-3 flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-lg font-semibold",
						children: "Import & export"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "rounded-lg bg-[var(--color-bg)] p-2",
						onClick: () => setImportOpen(false),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm leading-relaxed text-[var(--color-fg-3)]",
					children: [
						"Spreadsheets need columns for ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
							className: "text-[var(--color-fg)]",
							children: "Name"
						}),
						",",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
							className: "text-[var(--color-fg)]",
							children: "Weekday"
						}),
						", and ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
							className: "text-[var(--color-fg)]",
							children: "Time"
						}),
						". Meeting ID and Password become a one-click Zoom link."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--color-primary)]/40 bg-[var(--color-bg)] px-4 py-8 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileSpreadsheet, { className: "mb-2 size-8 text-[var(--color-primary)]" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold",
							children: "Drop CSV or Excel"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-1 text-xs text-[var(--color-fg-3)]",
							children: ".csv, .xlsx, .xls"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "file",
							accept: ".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
							className: "sr-only",
							onChange: (e) => {
								const file = e.target.files?.[0];
								if (file) onFile(file);
							}
						})
					]
				}),
				previewCount != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 text-sm",
					children: [
						"Ready to import ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: previewCount }),
						" meeting",
						previewCount === 1 ? "" : "s",
						". You currently have ",
						custom.length,
						" of your own."
					]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
					className: "mt-4 flex flex-col gap-2 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "radio",
							name: "mode",
							checked: mode === "merge",
							onChange: () => setMode("merge")
						}), "Merge with my meetings (skip duplicates)"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "radio",
							name: "mode",
							checked: mode === "replace",
							onChange: () => setMode("replace")
						}), "Replace my meetings"]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "btn-primary mt-5 h-12 w-full",
					onClick: apply,
					children: "Import"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "btn-secondary h-10 flex-1 text-sm",
						onClick: () => downloadTemplate("csv"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-4" }), " Template CSV"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "btn-secondary h-10 flex-1 text-sm",
						onClick: () => downloadTemplate("xlsx"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileSpreadsheet, { className: "size-4" }), " Template Excel"]
					})]
				})
			]
		})]
	});
}
var styles_default = "/assets/styles-C2RHYfvh.css";
var APP_NAME = "Assmosis";
var Route$4 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, viewport-fit=cover"
			},
			{ title: APP_NAME },
			{
				name: "apple-mobile-web-app-title",
				content: APP_NAME
			},
			{
				name: "application-name",
				content: APP_NAME
			},
			{
				name: "description",
				content: "Meetings and groups across twelve-step programs. One-tap rooms, your own list, and reminders before the ones you mark."
			},
			{
				name: "theme-color",
				content: "#1C140E"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/png",
				sizes: "192x192",
				href: "/icon-192.png"
			},
			{
				rel: "icon",
				type: "image/png",
				sizes: "512x512",
				href: "/icon-512.png"
			},
			{
				rel: "apple-touch-icon",
				sizes: "180x180",
				href: "/__grok/icon-180.png"
			},
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/manifest.webmanifest"
			},
			{
				rel: "alternate",
				href: "/__grok/manifest.webmanifest"
			}
		]
	}),
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("head", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("script", { dangerouslySetInnerHTML: { __html: `try{var t=localStorage.getItem("nextmeeting-theme");if(t==="dark"){document.documentElement.classList.add("dark","theme-dark");document.documentElement.style.colorScheme="dark"}}catch(e){}` } })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AuthProvider, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImportExport, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
					position: "bottom-center",
					toastOptions: {
						className: "font-[Josefin_Sans]!",
						style: {
							background: "var(--color-fg-2)",
							color: "white",
							border: "none",
							borderRadius: "50px",
							textTransform: "uppercase",
							letterSpacing: "0.5px",
							fontSize: "12px",
							fontWeight: 700
						}
					}
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
		] })]
	})
});
var $$splitComponentImporter$3 = () => import("./routes-CX6emfFB.mjs");
var Route$3 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./settings-CLvBjhMQ.mjs");
var Route$2 = createFileRoute("/settings")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./weekly-BatrHv-V.mjs");
var Route$1 = createFileRoute("/weekly")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./program._id-CIO-2lP5.mjs");
var Route = createFileRoute("/program/$id")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var rootRouteChildren = {
	IndexRoute: Route$3.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$4
	}),
	SettingsRoute: Route$2.update({
		id: "/settings",
		path: "/settings",
		getParentRoute: () => Route$4
	}),
	WeeklyRoute: Route$1.update({
		id: "/weekly",
		path: "/weekly",
		getParentRoute: () => Route$4
	}),
	ProgramIdRoute: Route.update({
		id: "/program/$id",
		path: "/program/$id",
		getParentRoute: () => Route$4
	})
};
var routeTree = Route$4._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { downloadBytes as a, downloadBlob as i, Route as n, meetingsToCsv as o, buildXlsxBytes as r, stampFilename as s, router_exports as t };
