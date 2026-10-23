import { i as __toESM } from "../_runtime.mjs";
import { J as require_react, S as require_jsx_runtime, b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { B as registerOfflineShell, D as formatMeetingId, J as useMeetingStore, T as formatLocalTime, W as scheduleMeetings, X as viewerZone, Y as useVisibleMeetings, h as buildZoomJoinUrl, k as groupByWeekday } from "./store-D4IrIlYG.mjs";
import { E as ArrowLeft, u as Printer } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/weekly-BatrHv-V.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function WeeklyPage() {
	const hydrate = useMeetingStore((s) => s.hydrate);
	const hydrated = useMeetingStore((s) => s.hydrated);
	const now = useMeetingStore((s) => s.now);
	const meetings = useVisibleMeetings();
	const zone = viewerZone();
	(0, import_react.useLayoutEffect)(() => {
		hydrate();
		registerOfflineShell();
	}, [hydrate]);
	const scheduled = scheduleMeetings(meetings, now, zone);
	const days = groupByWeekday(scheduled, zone);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-[var(--color-bg)] text-[var(--color-fg)] print:bg-white print:text-black",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "brand-gradient print:hidden sticky top-0 z-20 flex items-center justify-between px-3 py-2 text-white shadow-[var(--shadow-nav)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					className: "flex h-11 items-center gap-1 px-2 font-semibold",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-5" }), " Back"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "wordmark text-base",
					children: "Weekly"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "flex h-11 items-center gap-1 px-2",
					onClick: () => window.print(),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "size-5" }), " Print"]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto max-w-3xl px-4 py-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-6 text-center text-sm text-[var(--color-fg-3)] print:text-neutral-600",
				children: hydrated ? `Times shown in ${zone.replace(/_/g, " ")} · ${scheduled.length} meetings` : "Loading weekly list…"
			}), hydrated ? days.map((day) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mb-6 break-inside-avoid",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-2 border-b-2 border-[var(--color-primary)] pb-1 text-sm font-bold tracking-wider text-[var(--color-fg-2)] uppercase",
					children: day.long
				}), day.meetings.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-[var(--color-fg-3)]",
					children: "No meetings"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "flex flex-col gap-1.5",
					children: day.meetings.map((m) => {
						const url = buildZoomJoinUrl(m);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "grid grid-cols-[72px_1fr] items-baseline gap-2 text-sm sm:grid-cols-[72px_1fr_auto]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold tabular-nums text-[var(--color-primary)]",
								children: formatLocalTime(m.nextOccurrence, zone)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: m.name
								}),
								m.source === "custom" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "ml-1 text-[10px] uppercase",
									children: "mine"
								}) : null,
								m.meetingId ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "mt-0.5 block text-xs text-[var(--color-fg-3)]",
									children: [m.platform === "zoom" ? formatMeetingId(m.meetingId) : m.meetingId, m.password ? ` · pw ${m.password}` : ""]
								}) : null,
								url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-[11px] break-all text-[var(--color-fg-3)] print:text-black",
									children: url
								}) : null
							] })]
						}, m.id);
					})
				})]
			}, day.value)) : null]
		})]
	});
}
//#endregion
export { WeeklyPage as component };
