import { i as __toESM } from "../_runtime.mjs";
import { J as require_react, S as require_jsx_runtime, b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as fetchDossier, J as useMeetingStore, K as t, i as LOCALES, n as KNOWN_QIDS, t as BUILTIN_PROGRAMS } from "./store-D4IrIlYG.mjs";
import { E as ArrowLeft } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as downloadBytes, i as downloadBlob, o as meetingsToCsv, r as buildXlsxBytes, s as stampFilename } from "./router-DFArTy16.mjs";
import { i as requestNotify, n as InstallSettings } from "./install-notice-oR8zuoTX.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings-CLvBjhMQ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SettingsPage() {
	const hydrate = useMeetingStore((s) => s.hydrate);
	const place = useMeetingStore((s) => s.barPlace);
	const setBarPlace = useMeetingStore((s) => s.setBarPlace);
	const cardSize = useMeetingStore((s) => s.cardSize);
	const setCardSize = useMeetingStore((s) => s.setCardSize);
	const locale = useMeetingStore((s) => s.locale);
	const setLocale = useMeetingStore((s) => s.setLocale);
	const alertFavorites = useMeetingStore((s) => s.alertFavorites);
	const setAlertFavorites = useMeetingStore((s) => s.setAlertFavorites);
	const setAlertsEnabled = useMeetingStore((s) => s.setAlertsEnabled);
	const dossiers = useMeetingStore((s) => s.dossiers);
	const setDossier = useMeetingStore((s) => s.setDossier);
	const setImportOpen = useMeetingStore((s) => s.setImportOpen);
	const [refreshing, setRefreshing] = (0, import_react.useState)(false);
	const label = (key) => t(locale, key);
	(0, import_react.useLayoutEffect)(() => {
		hydrate();
	}, [hydrate]);
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
					children: label("settings")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-16" })
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto flex max-w-lg flex-col gap-4 px-4 py-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InstallSettings, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "border border-[var(--color-border)] bg-[var(--color-card)] p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-xs font-semibold tracking-[0.16em] text-[var(--color-gold)] uppercase",
							children: label("language")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm leading-relaxed text-[var(--color-fg-3)]",
							children: label("languageDetail")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3 grid gap-2",
							children: LOCALES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
								selected: locale === item.id,
								title: item.name,
								detail: "",
								onClick: () => setLocale(item.id)
							}, item.id))
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "border border-[var(--color-border)] bg-[var(--color-card)] p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-xs font-semibold tracking-[0.16em] text-[var(--color-gold)] uppercase",
							children: "Reminders"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm leading-relaxed text-[var(--color-fg-3)]",
							children: label("systemAlerts")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							"aria-pressed": alertFavorites,
							className: `mt-3 w-full px-3 py-2 text-left text-sm ${alertFavorites ? "border border-[var(--color-gold)]" : "border border-[var(--color-border)]"}`,
							onClick: async () => {
								if (!alertFavorites) {
									if (await requestNotify() !== "granted") {
										toast("Allow notifications to remind you");
										return;
									}
									setAlertsEnabled(true);
								}
								setAlertFavorites(!alertFavorites);
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
								className: "block",
								children: label("alertFavorites")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-[var(--color-fg-3)]",
								children: label("alertFavoritesDetail")
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "border border-[var(--color-border)] bg-[var(--color-card)] p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-xs font-semibold tracking-[0.16em] text-[var(--color-gold)] uppercase",
							children: label("files")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm leading-relaxed text-[var(--color-fg-3)]",
							children: label("filesDetail")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 grid gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "btn-secondary h-11 px-4 text-left",
									onClick: () => setImportOpen(true),
									children: label("importFile")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "btn-secondary h-11 px-4 text-left",
									onClick: () => {
										const meetings = useMeetingStore.getState().visibleMeetings();
										downloadBlob(stampFilename("assmosis", "csv"), new Blob([meetingsToCsv(meetings)], { type: "text/csv;charset=utf-8" }));
										toast(`${meetings.length}`);
									},
									children: label("exportCsv")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "btn-secondary h-11 px-4 text-left",
									onClick: () => {
										const meetings = useMeetingStore.getState().visibleMeetings();
										downloadBytes(stampFilename("assmosis", "xlsx"), buildXlsxBytes(meetings), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
										toast(`${meetings.length}`);
									},
									children: label("exportExcel")
								})
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "border border-[var(--color-border)] bg-[var(--color-card)] p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-xs font-semibold tracking-[0.16em] text-[var(--color-gold)] uppercase",
							children: label("refreshKnown")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm leading-relaxed text-[var(--color-fg-3)]",
							children: label("refreshDetail")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn-secondary mt-3 h-11 px-4",
							disabled: refreshing,
							onClick: () => {
								if (typeof navigator !== "undefined" && navigator.onLine === false) {
									toast(label("offline"));
									return;
								}
								setRefreshing(true);
								const known = BUILTIN_PROGRAMS.filter((program) => KNOWN_QIDS[program.id] || dossiers[program.id]);
								(async () => {
									let count = 0;
									for (const program of known) try {
										const next = await fetchDossier(program, dossiers[program.id]?.qid || KNOWN_QIDS[program.id] || "");
										if (next) {
											setDossier(next);
											count += 1;
										}
									} catch {
										toast(label("offline"));
										break;
									}
									if (count) toast(`${count} · ${label("updated")}`);
									setRefreshing(false);
								})();
							},
							children: refreshing ? label("updating") : label("refreshGo")
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "border border-[var(--color-border)] bg-[var(--color-card)] p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-xs font-semibold tracking-[0.16em] text-[var(--color-gold)] uppercase",
							children: label("searchBar")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm leading-relaxed text-[var(--color-fg-3)]",
							children: label("searchDetail")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 grid gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
								selected: place !== "bottom",
								title: label("flush"),
								detail: label("flushDetail"),
								onClick: () => setBarPlace("flush")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
								selected: place === "bottom",
								title: label("bottom"),
								detail: label("bottomDetail"),
								onClick: () => setBarPlace("bottom")
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "border border-[var(--color-border)] bg-[var(--color-card)] p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-xs font-semibold tracking-[0.16em] text-[var(--color-gold)] uppercase",
							children: label("cards")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm leading-relaxed text-[var(--color-fg-3)]",
							children: label("cardsDetail")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 grid gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
									selected: cardSize === "compact",
									title: label("compact"),
									detail: label("compactDetail"),
									onClick: () => setCardSize("compact")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
									selected: cardSize === "comfortable",
									title: label("comfortable"),
									detail: label("comfortableDetail"),
									onClick: () => setCardSize("comfortable")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
									selected: cardSize === "wide",
									title: label("wide"),
									detail: label("wideDetail"),
									onClick: () => setCardSize("wide")
								})
							]
						})
					]
				})
			]
		})]
	});
}
function Choice({ selected, title, detail, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		"aria-pressed": selected,
		className: `px-3 py-3 text-left ${selected ? "border border-[var(--color-gold)] bg-[var(--color-bg)]" : "border border-[var(--color-border)]"}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block text-sm",
			children: title
		}), detail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mt-0.5 block text-xs text-[var(--color-fg-3)]",
			children: detail
		}) : null]
	});
}
//#endregion
export { SettingsPage as component };
