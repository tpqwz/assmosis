import { i as __toESM } from "../_runtime.mjs";
import { J as require_react, S as require_jsx_runtime, b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as fetchDossier, G as shownProgram, J as useMeetingStore, K as t, R as programById, _ as catalogMeetings, n as KNOWN_QIDS, r as LIST_SCOPE, t as BUILTIN_PROGRAMS } from "./store-D4IrIlYG.mjs";
import { E as ArrowLeft, s as Star } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as Route } from "./router-DFArTy16.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/program._id-CIO-2lP5.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ProgramPage() {
	const { id } = Route.useParams();
	const locale = useMeetingStore((s) => s.locale);
	const custom = useMeetingStore((s) => s.programs);
	const groups = useMeetingStore((s) => s.groups);
	const customMeetings = useMeetingStore((s) => s.custom);
	const hiddenIds = useMeetingStore((s) => s.hiddenIds);
	const showCatalog = useMeetingStore((s) => s.showCatalog);
	const dossier = useMeetingStore((s) => s.dossiers[id]);
	const programOn = useMeetingStore((s) => s.favoriteProgramIds.includes(id));
	const favoriteGroups = useMeetingStore((s) => s.favoriteGroupIds);
	const toggleProgram = useMeetingStore((s) => s.toggleFavoriteProgram);
	const toggleGroup = useMeetingStore((s) => s.toggleFavoriteGroup);
	const setDossier = useMeetingStore((s) => s.setDossier);
	const label = (key) => t(locale, key);
	const program = programById([...custom, ...BUILTIN_PROGRAMS], id);
	const listed = (0, import_react.useMemo)(() => {
		if (!program) return 0;
		return [...showCatalog ? catalogMeetings().filter((meeting) => !hiddenIds.includes(meeting.id)) : [], ...customMeetings].filter((meeting) => (meeting.programId || "aca") === program.id).length;
	}, [
		customMeetings,
		hiddenIds,
		program,
		showCatalog
	]);
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function update() {
		if (!program) return;
		if (typeof navigator !== "undefined" && navigator.onLine === false) {
			toast(label("offline"));
			return;
		}
		setBusy(true);
		try {
			const next = await fetchDossier(program, dossier?.qid || KNOWN_QIDS[program.id] || "");
			if (!next) {
				toast(label("updateMiss"));
				return;
			}
			setDossier(next);
			toast(label("updated"));
		} catch {
			toast(label("offline"));
		} finally {
			setBusy(false);
		}
	}
	if (!program) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-[var(--color-bg)] px-4 py-6 text-[var(--color-fg)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/",
			className: "text-sm text-[var(--color-gold)]",
			children: label("back")
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-6",
			children: label("updateMiss")
		})]
	});
	const shown = shownProgram(program, locale, dossier);
	const names = Object.entries(dossier?.labels || {}).filter(([lang]) => lang !== "en");
	const related = groups.filter((group) => group.programId === program.id);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-[var(--color-bg)] text-[var(--color-fg)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "site-header sticky top-0 z-20 flex items-center justify-between px-2 py-1",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					className: "flex h-11 items-center gap-1 px-2 font-semibold text-[#f6e7c1]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-5" }),
						" ",
						label("back")
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "wordmark text-base",
					style: { letterSpacing: "0.12em" },
					children: shown.short
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-16" })
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto flex max-w-lg flex-col gap-4 px-4 py-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "border border-[var(--color-border)] bg-[var(--color-card)] p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs tracking-[0.16em] text-[var(--color-gold)] uppercase",
						children: shown.short
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-1 font-display text-3xl leading-tight",
						children: shown.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-sm leading-relaxed text-[var(--color-fg-2)]",
						children: [
							listed,
							" ",
							label("inThisList"),
							".",
							LIST_SCOPE[program.id] ? ` ${LIST_SCOPE[program.id]}` : ""
						]
					}),
					program.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm leading-relaxed text-[var(--color-fg-2)]",
						children: program.note
					}) : null,
					dossier?.description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm leading-relaxed",
						children: dossier.description
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm leading-relaxed text-[var(--color-fg-3)]",
						children: label("aboutMeetings")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-col gap-1 text-sm",
						children: [dossier?.website ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							className: "text-[var(--color-gold)] underline",
							href: dossier.website,
							target: "_blank",
							rel: "noreferrer",
							children: label("officialSite")
						}) : null, dossier?.wikipedia ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							className: "text-[var(--color-gold)] underline",
							href: dossier.wikipedia,
							target: "_blank",
							rel: "noreferrer",
							children: label("wikipedia")
						}) : null]
					}),
					names.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-xs font-semibold tracking-[0.16em] text-[var(--color-gold)] uppercase",
							children: label("otherNames")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-2 text-sm",
							children: names.map(([lang, name]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
								className: "mr-2 uppercase",
								children: lang
							}), name] }, lang))
						})]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-xs text-[var(--color-fg-3)]",
						children: dossier ? `${label("updated")} · ${new Date(dossier.fetchedAt).toLocaleString()}${dossier.qid ? ` · ${dossier.qid}` : ""}` : label("neverFetched")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "btn-secondary mt-4 h-11 px-4",
						onClick: () => toggleProgram(program.id),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
							className: "size-4",
							fill: programOn ? "currentColor" : "none"
						}), programOn ? label("favorited") : label("favorite")]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-xs text-[var(--color-fg-3)]",
						children: label("favoriteHint")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn-primary mt-4 ml-2 h-11 px-4",
						disabled: busy,
						onClick: update,
						children: busy ? label("updating") : label("updatePage")
					})
				]
			}), related.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "border border-[var(--color-border)] bg-[var(--color-card)] p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-xs font-semibold tracking-[0.16em] text-[var(--color-gold)] uppercase",
					children: label("yours")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-2 text-sm",
					children: related.map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center justify-between gap-3 py-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [group.name, group.joinUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [" · ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							className: "text-[var(--color-gold)] underline",
							href: group.joinUrl,
							target: "_blank",
							rel: "noreferrer",
							children: group.platform
						})] }) : null] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "text-[var(--color-gold)]",
							"aria-pressed": favoriteGroups.includes(group.id),
							onClick: () => toggleGroup(group.id),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
								className: "size-4",
								fill: favoriteGroups.includes(group.id) ? "currentColor" : "none"
							})
						})]
					}, group.id))
				})]
			}) : null]
		})]
	});
}
//#endregion
export { ProgramPage as component };
