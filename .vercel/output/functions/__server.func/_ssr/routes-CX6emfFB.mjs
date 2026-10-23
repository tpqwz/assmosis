import { i as __toESM } from "../_runtime.mjs";
import { J as require_react, S as require_jsx_runtime, b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { A as haversineKm, B as registerOfflineShell, C as fetchDossier, D as formatMeetingId, E as formatLocalWeekday, F as nextOccurrence, H as resolvePostal, I as parseZoomInvite, J as useMeetingStore, K as t, L as placeParts, M as joinHint, N as joinLabel, O as groupByCategory, P as localizedProgram, R as programById, S as emptyDraft, T as formatLocalTime, U as roomField, V as relativePhrase, W as scheduleMeetings, X as viewerZone, Y as useVisibleMeetings, Z as weekdayLong, _ as catalogMeetings, a as PLATFORMS, b as copyText, c as TAG_KEYS, d as areaId, g as canAutoJoin, j as isInNext24Hours, l as TIMEZONES, m as buildZoomAppUrl, n as KNOWN_QIDS, o as PROGRAM_SECTIONS, p as buildJoinUrl, r as LIST_SCOPE, s as TAGS, t as BUILTIN_PROGRAMS, u as WEEKDAYS, v as cn, w as filterMeetings, x as copyTextNow, y as copyDetailsText } from "./store-D4IrIlYG.mjs";
import { C as Copy, S as ExternalLink, T as Bell, _ as MapPin, a as Trash2, c as Settings, d as Plus, f as Phone, g as MessageCircle, h as MonitorPlay, l as Search, m as Moon, n as WandSparkles, o as Sun, p as Pencil, r as Video, s as Star, t as X, u as Printer, v as Mail, w as CalendarPlus, y as Library } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as showNotification, i as requestNotify, r as claimReminder, t as InstallNotice } from "./install-notice-oR8zuoTX.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CX6emfFB.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AppHeader({ embedded = false }) {
	const navOpen = useMeetingStore((s) => s.navOpen);
	const setNavOpen = useMeetingStore((s) => s.setNavOpen);
	const theme = useMeetingStore((s) => s.theme);
	const toggleTheme = useMeetingStore((s) => s.toggleTheme);
	const openCreate = useMeetingStore((s) => s.openCreate);
	const setListsOpen = useMeetingStore((s) => s.setListsOpen);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: `site-header ${embedded ? "" : "sticky top-0 z-30"}`,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between px-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "Navigation menu",
						"aria-expanded": navOpen,
						className: "flex h-11 w-12 items-center justify-center",
						onClick: () => setNavOpen(!navOpen),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: `hamburger relative block h-5 w-8 ${navOpen ? "open" : ""}`,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "top" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "middle" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "bottom" })
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/",
						className: "flex items-center gap-2.5 py-2",
						onClick: () => setNavOpen(false),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FanMark, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex flex-col items-center leading-none",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "wordmark",
									style: {
										letterSpacing: "0.08em",
										fontSize: "20px"
									},
									children: "Assmosis"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mt-1 text-[9px] tracking-[0.28em] text-[var(--color-gold)] uppercase",
									children: "Meetings & groups"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FanMark, { flip: true })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
						className: "flex h-11 w-12 items-center justify-center text-[var(--color-gold)]",
						onClick: toggleTheme,
						children: theme === "dark" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { className: "size-5" })
					})
				]
			})
		}),
		navOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			"aria-label": "Close menu",
			className: "fixed inset-0 z-40 bg-black/30",
			onClick: () => setNavOpen(false)
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
			className: `fixed z-50 flex flex-col bg-[var(--color-card)] shadow-xl transition-[opacity,transform] duration-150 max-md:inset-x-0 max-md:top-12 max-md:bottom-0 md:left-4 md:top-11 md:max-w-80 md:overflow-hidden md:rounded-2xl ${navOpen ? "pointer-events-auto translate-x-0 opacity-100 md:translate-y-0" : "pointer-events-none -translate-x-16 opacity-0 md:translate-x-0 md:-translate-y-4"}`,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
				className: "flex flex-col",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/settings",
						onClick: () => setNavOpen(false),
						className: "block",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "flex w-full items-center justify-between px-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex w-full items-center justify-between border-b border-[var(--color-fg-3)]/30 px-2 py-4 text-[var(--color-fg)]",
								children: ["Settings", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "size-5 text-[var(--color-primary)]" })]
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Library, { className: "size-5" }),
						label: "Programs & groups",
						onClick: () => setListsOpen(true)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-5" }),
						label: "Add a Meeting",
						onClick: () => {
							openCreate();
							setNavOpen(false);
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/weekly",
						onClick: () => setNavOpen(false),
						className: "block",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "flex w-full items-center justify-between px-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex w-full items-center justify-between border-b border-[var(--color-fg-3)]/30 px-2 py-4 text-[var(--color-fg)]",
								children: ["Printable Weekly List", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "size-5 text-[var(--color-primary)]" })]
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "mailto:feedback@nextmeeting.app",
						className: "block",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "flex w-full items-center justify-between px-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex w-full items-center justify-between px-2 py-4 text-[var(--color-fg)]",
								children: ["Send Feedback", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "size-5 text-[var(--color-primary)]" })]
							})
						})
					})
				]
			})
		})
	] });
}
function MenuItem({ icon, label, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: "flex w-full items-center justify-between px-4 text-left",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "flex w-full items-center justify-between border-b border-[var(--color-fg-3)]/30 px-2 py-4 text-[var(--color-fg)]",
			children: [label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[var(--color-primary)]",
				children: icon
			})]
		})
	});
}
function FanMark({ flip = false }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 28 28",
		"aria-hidden": "true",
		className: `size-6 text-[var(--color-gold)] ${flip ? "-scale-x-100" : ""}`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			fill: "currentColor",
			d: "M14 3l1.1 6.2 5.4-3.2-3.1 5.5 6.2 1.1-6.2 1.1 3.1 5.5-5.4-3.2L14 25l-1.1-6.2-5.4 3.2 3.1-5.5L4.4 12.6l6.2-1.1L7.5 6l5.4 3.2z"
		})
	});
}
var RADII = [
	25,
	80,
	200,
	500
];
function PlaceSheet({ onClose }) {
	const filters = useMeetingStore((s) => s.filters);
	const setFilters = useMeetingStore((s) => s.setFilters);
	const custom = useMeetingStore((s) => s.custom);
	const showCatalog = useMeetingStore((s) => s.showCatalog);
	const count = useVisibleMeetings().length;
	const [code, setCode] = (0, import_react.useState)(filters.near === "Here" ? "" : filters.near);
	const [note, setNote] = (0, import_react.useState)("");
	const [q, setQ] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		function onKey(e) {
			if (e.key === "Escape") onClose();
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);
	const places = (0, import_react.useMemo)(() => {
		const names = /* @__PURE__ */ new Set();
		const lists = showCatalog ? [catalogMeetings(), custom] : [custom];
		for (const list of lists) for (const meeting of list) {
			const name = (meeting.location || "").trim();
			if (name) names.add(name);
		}
		return [...names].sort((a, b) => a.localeCompare(b));
	}, [custom, showCatalog]);
	const classified = (0, import_react.useMemo)(() => places.map((name) => ({
		name,
		parts: placeParts(name)
	})).filter((item) => Boolean(item.parts?.continent)), [places]);
	const continents = unique(classified.map((item) => item.parts.continent));
	const continentOn = filters.areas.filter((id) => id.startsWith("continent:"));
	const countryOn = filters.areas.filter((id) => id.startsWith("country:"));
	const regionOn = filters.areas.filter((id) => id.startsWith("region:"));
	const countries = unique(classified.filter((item) => !continentOn.length || continentOn.includes(areaId("continent", item.parts))).map((item) => item.parts.country).filter(Boolean));
	const regions = unique(classified.filter((item) => {
		if (continentOn.length && !continentOn.includes(areaId("continent", item.parts))) return false;
		if (countryOn.length && !countryOn.includes(areaId("country", item.parts))) return false;
		return Boolean(item.parts.region);
	}).map((item) => `${item.parts.country}:${item.parts.region}`));
	const query = q.trim().toLowerCase();
	const cities = places.filter((name) => {
		const parts = placeParts(name);
		if (query && !name.toLowerCase().includes(query)) return false;
		if (!parts) return !continentOn.length && !countryOn.length && !regionOn.length;
		if (continentOn.length && !continentOn.includes(areaId("continent", parts))) return false;
		if (countryOn.length && !countryOn.includes(areaId("country", parts))) return false;
		if (regionOn.length && !regionOn.includes(areaId("region", parts))) return false;
		return true;
	});
	function toggleArea(id) {
		const areas = filters.areas.includes(id) ? filters.areas.filter((item) => item !== id) : [...filters.areas, id];
		setFilters({ areas });
	}
	function applyCode() {
		const hit = resolvePostal(code);
		if (!hit) {
			setNote("That code isn’t in the local list. Try a US ZIP, Canadian, UK, Australian, or Brazilian code, or use Here.");
			return;
		}
		setNote(hit.coarse ? `${hit.label} is a region, not a street.` : hit.label);
		setFilters({
			near: hit.label,
			originLat: hit.lat,
			originLng: hit.lng,
			radiusKm: filters.radiusKm || (hit.coarse ? 400 : 80)
		});
	}
	function useHere() {
		if (!navigator.geolocation) {
			setNote("This browser has no location of its own.");
			return;
		}
		navigator.geolocation.getCurrentPosition((pos) => {
			setNote("Using this device.");
			setCode("");
			setFilters({
				near: "Here",
				originLat: pos.coords.latitude,
				originLng: pos.coords.longitude,
				radiusKm: filters.radiusKm || 80
			});
		}, () => setNote("Location permission was denied."), {
			enableHighAccuracy: false,
			maximumAge: 6e4,
			timeout: 8e3
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-50 flex items-end justify-center md:items-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "sheet-backdrop absolute inset-0",
			"aria-label": "Close places",
			onClick: onClose
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-label": "Places",
			className: "relative z-10 flex max-h-[88dvh] w-full flex-col rounded-t-xl bg-[var(--color-card)] shadow-2xl md:w-[480px] md:rounded-xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "deco-rule flex items-center justify-between px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl tracking-wide",
						children: "Places"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs tracking-wide text-[var(--color-fg-3)] uppercase",
						children: [count, " meetings"]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "rounded-sm bg-[var(--color-bg)] p-2",
						onClick: onClose,
						"aria-label": "Close",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-3 overflow-y-auto px-4 py-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-semibold tracking-[0.14em] text-[var(--color-gold)] uppercase",
								children: "Near a code"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 flex gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: code,
										onChange: (e) => setCode(e.target.value),
										placeholder: "ZIP, postcode",
										className: "field min-w-0 flex-1"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "btn-primary h-10 px-3 text-sm",
										onClick: applyCode,
										children: "Near"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "btn-secondary h-10 px-3 text-sm",
										onClick: useHere,
										children: "Here"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 flex flex-wrap gap-1.5",
								children: [RADII.map((km) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									"aria-pressed": filters.radiusKm === km,
									className: `rounded-sm border px-2 py-1 text-xs ${filters.radiusKm === km ? "border-[var(--color-gold)]" : "border-[var(--color-border)]"}`,
									onClick: () => setFilters({ radiusKm: km }),
									children: [km, " km"]
								}, km)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-pressed": filters.radiusKm === 0,
									className: `rounded-sm border px-2 py-1 text-xs ${filters.radiusKm === 0 ? "border-[var(--color-gold)]" : "border-[var(--color-border)]"}`,
									onClick: () => setFilters({ radiusKm: 0 }),
									children: "Sort only"
								})]
							}),
							filters.near ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-xs text-[var(--color-fg-2)]",
								children: [
									"Showing nearest to ",
									filters.near,
									"."
								]
							}) : null,
							note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-[var(--color-fg-3)]",
								children: note
							}) : null
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Level, {
							title: "Continent",
							items: continents.map((name) => ({
								id: `continent:${name}`,
								label: name
							})),
							selected: filters.areas,
							onToggle: toggleArea
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Level, {
							title: "Country",
							items: countries.map((name) => ({
								id: `country:${name}`,
								label: name
							})),
							selected: filters.areas,
							onToggle: toggleArea
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Level, {
							title: "State or region",
							items: regions.map((key) => ({
								id: `region:${key}`,
								label: key.split(":")[1] || key
							})),
							selected: filters.areas,
							onToggle: toggleArea
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-semibold tracking-[0.14em] text-[var(--color-gold)] uppercase",
								children: "City"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: q,
								onChange: (e) => setQ(e.target.value),
								placeholder: "Find a city",
								className: "field mt-2 w-full"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 flex max-h-40 flex-wrap gap-2 overflow-y-auto",
								children: [cities.slice(0, 80).map((name) => {
									const on = filters.locations.includes(name);
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										"aria-pressed": on,
										onClick: () => setFilters({ locations: on ? filters.locations.filter((item) => item !== name) : [...filters.locations, name] }),
										className: `px-2 py-1 text-sm ${on ? "border border-[var(--color-gold)] bg-[var(--color-bg)]" : "border border-[var(--color-border)]"}`,
										children: name
									}, name);
								}), cities.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-[var(--color-fg-3)]",
									children: "No city in this area."
								}) : null]
							})
						] })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-3 border-t border-[var(--color-border)] px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "text-xs font-semibold tracking-wide text-[var(--color-primary)] uppercase",
						onClick: () => setFilters({
							locations: [],
							areas: [],
							near: "",
							originLat: null,
							originLng: null
						}),
						children: "Any place"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn-primary h-10 px-4 text-sm",
						onClick: onClose,
						children: "Done"
					})]
				})
			]
		})]
	});
}
function unique(values) {
	return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}
function Level({ title, items, selected, onToggle }) {
	if (items.length === 0) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-xs font-semibold tracking-[0.14em] text-[var(--color-gold)] uppercase",
		children: title
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-2 flex flex-wrap gap-1.5",
		children: items.map((item) => {
			const on = selected.includes(item.id);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				"aria-pressed": on,
				onClick: () => onToggle(item.id),
				className: `rounded-sm border px-2 py-1 text-sm ${on ? "border-[var(--color-gold)] bg-[var(--color-bg)]" : "border-[var(--color-border)]"}`,
				children: item.label
			}, item.id);
		})
	})] });
}
function ActionBar() {
	const filters = useMeetingStore((s) => s.filters);
	const setFilters = useMeetingStore((s) => s.setFilters);
	const clearFilters = useMeetingStore((s) => s.clearFilters);
	const customCount = useMeetingStore((s) => s.custom.length);
	const customPrograms = useMeetingStore((s) => s.programs);
	const customMeetings = useMeetingStore((s) => s.custom);
	const hiddenIds = useMeetingStore((s) => s.hiddenIds);
	const favoriteMeetings = useMeetingStore((s) => s.favoriteMeetingIds);
	const favoritePrograms = useMeetingStore((s) => s.favoriteProgramIds);
	const favoriteGroups = useMeetingStore((s) => s.favoriteGroupIds);
	const showCatalog = useMeetingStore((s) => s.showCatalog);
	const visible = useVisibleMeetings();
	const hydrated = useMeetingStore((s) => s.hydrated);
	const barPlace = useMeetingStore((s) => s.barPlace);
	const locale = useMeetingStore((s) => s.locale);
	const label = (key) => t(locale, key);
	const docked = barPlace === "bottom";
	const zone = hydrated ? viewerZone() : "";
	const programs = (0, import_react.useMemo)(() => [...BUILTIN_PROGRAMS, ...customPrograms], [customPrograms]);
	const [sheet, setSheet] = (0, import_react.useState)(null);
	const filtering = Boolean(filters.q || filters.day || filters.who || filters.platform || filters.source || filters.programs.length || filters.languages.length || filters.locations.length || filters.areas.length || filters.modes.length || filters.tags.length || filters.favorites || filters.hideMissingPasscode || filters.near || filters.originLat != null);
	const wayNames = new Map([
		["inperson", label("inPerson")],
		["online", label("online")],
		["phone", label("phone")],
		...PLATFORMS.map((p) => [p.id, p.label])
	]);
	const wayLabel = summarize([
		...filters.modes.map((id) => wayNames.get(id) || id),
		...filters.tags.map((id) => label(TAG_KEYS[id] || id)),
		...filters.hideMissingPasscode ? [label("hideMissingPasscode")] : []
	], label("anyWay"), "ways");
	const programLabel = summarize(filters.programs.map((id) => {
		const program = programs.find((p) => p.id === id);
		return program ? localizedProgram(program, locale).short : id;
	}), label("anyProgram"), "programs");
	const languageChoices = (0, import_react.useMemo)(() => distinctValues(showCatalog ? catalogMeetings() : [], customMeetings, "language"), [customMeetings, showCatalog]);
	const programCounts = (0, import_react.useMemo)(() => {
		const counts = /* @__PURE__ */ new Map();
		const list = [...showCatalog ? catalogMeetings().filter((m) => !hiddenIds.includes(m.id)) : [], ...customMeetings];
		for (const meeting of list) {
			const id = meeting.programId || "aca";
			counts.set(id, (counts.get(id) || 0) + 1);
		}
		return counts;
	}, [
		customMeetings,
		hiddenIds,
		showCatalog
	]);
	const tagOptions = (0, import_react.useMemo)(() => {
		const list = [...showCatalog ? catalogMeetings().filter((m) => !hiddenIds.includes(m.id)) : [], ...customMeetings];
		const pool = filterMeetings(list, {
			...filters,
			tags: [],
			q: ""
		}, Date.now(), viewerZone(), programs, [], {
			meetings: favoriteMeetings,
			programs: favoritePrograms,
			groups: favoriteGroups
		});
		const present = new Set(pool.flatMap((m) => m.tags || []));
		for (const id of filters.tags) present.add(id);
		return TAGS.filter((id) => present.has(id)).map((id) => ({
			id,
			label: t(locale, TAG_KEYS[id]),
			group: t(locale, "aboutMeeting")
		}));
	}, [
		customMeetings,
		filters.programs,
		filters.languages,
		filters.locations,
		filters.areas,
		filters.modes,
		filters.tags,
		filters.day,
		filters.who,
		filters.source,
		filters.near,
		filters.originLat,
		filters.originLng,
		filters.radiusKm,
		hiddenIds,
		favoriteMeetings,
		favoritePrograms,
		favoriteGroups,
		locale,
		programs,
		showCatalog
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: docked ? "fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border)] bg-[var(--color-card)] pb-[max(10px,env(safe-area-inset-bottom))] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]" : "border-b border-[var(--color-border)] bg-[var(--color-card)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex max-w-[900px] flex-wrap items-center gap-2.5 px-3 py-2.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex min-w-0 flex-1 basis-[220px] items-center gap-2 rounded-sm border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 text-[var(--color-fg-3)] focus-within:border-[var(--color-gold)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "size-4 shrink-0" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: filters.q,
								onChange: (e) => setFilters({ q: e.target.value }),
								placeholder: "Search meetings",
								className: "min-w-0 flex-1 bg-transparent py-2.5 text-base text-[var(--color-fg)] outline-none placeholder:text-[var(--color-fg-3)]"
							}),
							filters.q ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": "Clear search",
								onClick: () => setFilters({ q: "" }),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
							}) : null
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "chip-row flex max-w-full gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: `rounded-sm border px-2.5 py-1.5 text-[13px] font-medium whitespace-nowrap ${filters.programs.length ? "border-[var(--color-gold)] text-[var(--color-fg)]" : "border-[var(--color-border)] text-[var(--color-fg)]"}`,
								onClick: () => setSheet("programs"),
								children: programLabel
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterButton, {
								active: filters.languages.length > 0,
								label: summarize(filters.languages, label("anyLanguage"), "languages"),
								onClick: () => setSheet("languages")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterButton, {
								active: filters.locations.length > 0 || filters.areas.length > 0 || Boolean(filters.near),
								label: filters.near ? filters.near : summarize([...filters.areas.map((id) => id.split(":").pop() || id), ...filters.locations], label("anyPlace"), "places"),
								onClick: () => setSheet("locations")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterButton, {
								active: filters.modes.length > 0 || filters.tags.length > 0 || filters.hideMissingPasscode,
								label: wayLabel,
								onClick: () => setSheet("ways")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChipSelect, {
								value: filters.day,
								onChange: (v) => setFilters({ day: v }),
								options: [{
									value: "",
									label: label("anyDay")
								}, ...WEEKDAYS.map((d) => ({
									value: String(d.value),
									label: d.short
								}))]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChipSelect, {
								value: filters.who,
								onChange: (v) => setFilters({ who: v }),
								options: [
									{
										value: "",
										label: label("everyone")
									},
									{
										value: "men",
										label: label("men")
									},
									{
										value: "women",
										label: label("women")
									}
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChipSelect, {
								value: filters.source,
								onChange: (v) => setFilters({ source: v }),
								options: [
									{
										value: "",
										label: label("allLists")
									},
									{
										value: "custom",
										label: `${label("mine")} (${customCount})`
									},
									{
										value: "catalog",
										label: label("builtIn")
									}
								]
							}),
							favoriteMeetings.length || favoritePrograms.length || favoriteGroups.length || filters.favorites ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterButton, {
								active: filters.favorites,
								label: label("favorites"),
								onClick: () => setFilters({ favorites: !filters.favorites })
							}) : null
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "ml-auto hidden items-center sm:flex",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[11px] tracking-wide text-[var(--color-fg-3)] uppercase",
							children: zone ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
								className: "text-[var(--color-fg-2)]",
								children: zone.replace(/_/g, " ")
							}) : null
						})
					})
				]
			}),
			filtering ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex max-w-[900px] flex-wrap items-center gap-x-2.5 gap-y-1 px-3 pb-2 text-[12px] tracking-wide text-[var(--color-fg-3)] uppercase",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
							className: "text-[var(--color-primary)]",
							children: visible.length
						}),
						" ",
						label("matching")
					] }),
					filters.programs.length === 1 && LIST_SCOPE[filters.programs[0]] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "basis-full normal-case tracking-normal text-[var(--color-fg-2)]",
						children: LIST_SCOPE[filters.programs[0]]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "font-semibold tracking-wide text-[var(--color-primary)] uppercase",
						onClick: clearFilters,
						children: label("clear")
					})
				]
			}) : null,
			sheet === "programs" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChoiceSheet, {
				title: label("programs"),
				emptyLabel: label("anyProgram"),
				queryLabel: label("findProgram"),
				selected: filters.programs,
				options: programs.map((p) => {
					const shown = localizedProgram(p, locale);
					const count = programCounts.get(p.id) || 0;
					return {
						id: p.id,
						label: shown.short,
						detail: `${shown.name} · ${count}`,
						group: p.section || label("yours")
					};
				}),
				count: visible.length,
				onToggle: (id) => toggleList(filters.programs, id, (programs) => setFilters({ programs })),
				onClear: () => setFilters({ programs: [] }),
				onClose: () => setSheet(null)
			}) : null,
			sheet === "languages" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChoiceSheet, {
				title: label("languages"),
				emptyLabel: label("anyLanguage"),
				queryLabel: label("findLanguage"),
				selected: filters.languages,
				options: languageChoices.map((name) => ({
					id: name,
					label: name
				})),
				count: visible.length,
				onToggle: (id) => toggleList(filters.languages, id, (languages) => setFilters({ languages })),
				onClear: () => setFilters({ languages: [] }),
				onClose: () => setSheet(null)
			}) : null,
			sheet === "locations" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlaceSheet, { onClose: () => setSheet(null) }) : null,
			sheet === "ways" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChoiceSheet, {
				title: label("anyWay"),
				emptyLabel: label("anyWay"),
				queryLabel: label("findWay"),
				selected: [
					...filters.modes,
					...filters.tags,
					...filters.hideMissingPasscode ? ["nopass"] : []
				],
				groupOrder: [
					label("attendance"),
					label("rooms"),
					label("aboutMeeting"),
					label("passcode")
				],
				options: [
					{
						id: "inperson",
						label: label("inPerson"),
						group: label("attendance")
					},
					{
						id: "online",
						label: label("online"),
						group: label("attendance")
					},
					{
						id: "phone",
						label: label("phone"),
						group: label("attendance")
					},
					...PLATFORMS.filter((p) => p.id !== "inperson" && p.id !== "phone").map((p) => ({
						id: p.id,
						label: p.label,
						group: label("rooms")
					})),
					...tagOptions,
					{
						id: "nopass",
						label: label("hideMissingPasscode"),
						group: label("passcode")
					}
				],
				count: visible.length,
				onToggle: (id) => {
					if (id === "nopass") {
						setFilters({ hideMissingPasscode: !filters.hideMissingPasscode });
						return;
					}
					if (TAGS.includes(id)) {
						toggleList(filters.tags, id, (tags) => setFilters({ tags }));
						return;
					}
					toggleList(filters.modes, id, (modes) => setFilters({ modes }));
				},
				onClear: () => setFilters({
					modes: [],
					tags: [],
					hideMissingPasscode: false
				}),
				onClose: () => setSheet(null)
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        .tool-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid var(--color-gold);
          background: var(--color-card);
          color: var(--color-fg);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 7px 12px;
          border-radius: 2px;
          white-space: nowrap;
          min-height: 36px;
        }
        .chip-row {
          mask-image: linear-gradient(90deg, #000 0, #000 calc(100% - 24px), transparent);
        }
      ` })
		]
	});
}
function ChipSelect({ value, onChange, options }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
		value,
		onChange: (e) => onChange(e.target.value),
		className: `appearance-none rounded-sm border bg-[var(--color-card)] py-1.5 pr-7 pl-2.5 text-[13px] font-medium whitespace-nowrap ${value ? "border-[var(--color-gold)] text-[var(--color-fg)]" : "border-[var(--color-border)] text-[var(--color-fg)]"}`,
		style: {
			backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23737487' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
			backgroundRepeat: "no-repeat",
			backgroundPosition: "right 8px center"
		},
		children: options.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
			value: o.value,
			children: o.label
		}, o.value || "all"))
	});
}
function summarize(selected, empty, noun) {
	if (selected.length === 0) return empty;
	if (selected.length <= 2) return selected.join(" · ");
	return `${selected.length} ${noun}`;
}
function toggleList(current, id, apply) {
	apply(current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
}
function distinctValues(catalog, custom, field) {
	const values = /* @__PURE__ */ new Set();
	for (const meeting of catalog) {
		const value = meeting[field].trim();
		if (value) values.add(value);
	}
	for (const meeting of custom) {
		const value = (meeting[field] || "").trim();
		if (value) values.add(value);
	}
	return [...values].sort((a, b) => a.localeCompare(b));
}
function FilterButton({ active, label, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: `rounded-sm border px-2.5 py-1.5 text-[13px] font-medium whitespace-nowrap ${active ? "border-[var(--color-gold)] text-[var(--color-fg)]" : "border-[var(--color-border)] text-[var(--color-fg)]"}`,
		onClick,
		children: label
	});
}
function ChoiceSheet({ title, emptyLabel, queryLabel, selected, options, count, groupOrder, onToggle, onClear, onClose }) {
	const [q, setQ] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		function onKey(e) {
			if (e.key === "Escape") onClose();
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);
	const query = q.trim().toLowerCase();
	const shown = options.filter((option) => !query || `${option.label} ${option.detail ?? ""} ${option.group ?? ""}`.toLowerCase().includes(query)).sort((a, b) => a.label.localeCompare(b.label));
	const grouped = /* @__PURE__ */ new Map();
	for (const option of shown) {
		const key = option.group || "";
		const list = grouped.get(key);
		if (list) list.push(option);
		else grouped.set(key, [option]);
	}
	const groups = [...grouped.entries()];
	if (groupOrder) groups.sort((a, b) => {
		const ai = groupOrder.indexOf(a[0]);
		const bi = groupOrder.indexOf(b[0]);
		return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-50 flex items-end justify-center md:items-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "sheet-backdrop absolute inset-0",
			"aria-label": `Close ${title}`,
			onClick: onClose
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-label": title,
			className: "relative z-10 flex max-h-[86dvh] w-full flex-col rounded-t-xl bg-[var(--color-card)] shadow-2xl md:w-[440px] md:rounded-xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "deco-rule flex items-center justify-between px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl tracking-wide",
						children: title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs tracking-wide text-[var(--color-fg-3)] uppercase",
						children: selected.length ? `${selected.length} on · ${count} meetings` : emptyLabel
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "rounded-sm bg-[var(--color-bg)] p-2",
						onClick: onClose,
						"aria-label": "Close",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "px-4 pt-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: q,
						onChange: (e) => setQ(e.target.value),
						placeholder: queryLabel,
						className: "field w-full",
						autoFocus: true
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex flex-col gap-3 overflow-y-auto px-4 pb-4",
					children: [groups.map(([title, items]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [title ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-1.5 text-xs font-semibold tracking-[0.14em] text-[var(--color-gold)] uppercase",
						children: title
					}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-2",
						children: items.map((option) => {
							const on = selected.includes(option.id);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								"aria-pressed": on,
								onClick: () => onToggle(option.id),
								className: `px-3 py-2 text-left ${on ? "border border-[var(--color-gold)] bg-[var(--color-bg)]" : "border border-[var(--color-border)]"}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-sm font-semibold",
									children: option.label
								}), option.detail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-xs text-[var(--color-fg-3)]",
									children: option.detail
								}) : null]
							}, option.id);
						})
					})] }, title || "all")), shown.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-[var(--color-fg-3)]",
						children: "Nothing matches."
					}) : null]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-3 border-t border-[var(--color-border)] px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "text-xs font-semibold tracking-wide text-[var(--color-primary)] uppercase",
						onClick: onClear,
						children: emptyLabel
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn-primary h-10 px-4 text-sm",
						onClick: onClose,
						children: "Done"
					})]
				})
			]
		})]
	});
}
function JoinButton({ meeting, size = "sm", className, stopPropagation = true }) {
	const href = buildJoinUrl(meeting);
	const label = buttonLabel(meeting, size);
	const Icon = iconFor(meeting.platform);
	async function onClick(e) {
		if (stopPropagation) e.stopPropagation();
		if (!href) {
			e.preventDefault();
			toast("Add a room or link first");
			return;
		}
		if (!meeting.password) return;
		e.preventDefault();
		let copied = copyTextNow(meeting.password);
		if (!copied) copied = await copyText(meeting.password);
		toast(copied ? "Passcode copied — paste it if the room asks" : "Opening the room");
		window.location.assign(href);
	}
	if (!href) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("btn-secondary opacity-50", size === "lg" ? "h-12 px-5 text-base" : "h-10 min-w-16 px-3 text-sm", className),
		children: "—"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
		href,
		target: "_blank",
		rel: "noopener noreferrer",
		title: label,
		"aria-label": label,
		onClick,
		className: cn("btn-primary", size === "lg" ? "h-12 px-5 text-lg" : "h-10 min-w-16 px-3 text-sm", className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
				className: size === "lg" ? "size-5" : "size-4",
				strokeWidth: 2.2
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "whitespace-nowrap",
				children: label
			}),
			size === "lg" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-4 opacity-80" }) : null
		]
	});
}
function iconFor(platform) {
	if (platform === "phone") return Phone;
	if (platform === "email") return Mail;
	if (platform === "inperson") return MapPin;
	if (platform === "telegram" || platform === "whatsapp" || platform === "signal" || platform === "discord") return MessageCircle;
	if (platform === "other") return ExternalLink;
	return Video;
}
function buttonLabel(meeting, size) {
	if (meeting.platform === "inperson") return "Go";
	if (canAutoJoin(meeting)) return "Auto-Join";
	if (meeting.platform === "zoom" || meeting.platform === "jitsi" || meeting.platform === "meet" || meeting.platform === "teams" || meeting.platform === "skype") return "Join";
	return size === "lg" ? joinLabel(meeting.platform) : shortLabel(meeting.platform);
}
function shortLabel(platform) {
	if (platform === "inperson") return "Go";
	if (platform === "zoom" || platform === "jitsi" || platform === "meet") return "Join";
	return joinLabel(platform);
}
function SessionCard({ meeting, now }) {
	const selectMeeting = useMeetingStore((s) => s.selectMeeting);
	const alertOn = useMeetingStore((s) => s.alertIds.includes(meeting.id));
	const favoriteOn = useMeetingStore((s) => s.favoriteMeetingIds.includes(meeting.id) || s.favoriteProgramIds.includes(meeting.programId || "") || (meeting.groupId ? s.favoriteGroupIds.includes(meeting.groupId) : false));
	const toggleAlert = useMeetingStore((s) => s.toggleAlert);
	const setAlertsEnabled = useMeetingStore((s) => s.setAlertsEnabled);
	const programs = useMeetingStore((s) => s.programs);
	const locale = useMeetingStore((s) => s.locale);
	const zone = viewerZone();
	const soon = isInNext24Hours(meeting.nextOccurrence, now);
	const upcoming = meeting.nextOccurrence > now;
	const rel = relativePhrase(now, meeting.nextOccurrence);
	const program = programById(programs, meeting.programId || "");
	const shown = program ? localizedProgram(program, locale) : null;
	const showProgram = Boolean(program && meeting.programId);
	async function onBell() {
		if (!alertOn) {
			if (await requestNotify() !== "granted") {
				toast("Allow notifications to mark reminders");
				return;
			}
			setAlertsEnabled(true);
		}
		toggleAlert(meeting.id);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "session-card",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			className: "flex min-w-0 flex-1 flex-col-reverse items-start py-1 text-left",
			onClick: () => selectMeeting(meeting.id),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
				className: "flex flex-wrap items-baseline gap-x-2 text-[18px] leading-tight font-normal text-[var(--color-fg)]",
				children: [showProgram && shown ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "badge-program",
					children: shown.short
				}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: meeting.name })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-1 flex flex-wrap items-center gap-x-1 text-[10px] tracking-wide text-[var(--color-fg-3)] uppercase",
				children: [
					meeting.isLive ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "badge-live mr-1 inline-flex items-center gap-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "live-dot" }),
							" ",
							t(locale, "live")
						]
					}) : null,
					meeting.source === "custom" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "badge-mine mr-1",
						children: t(locale, "mine")
					}) : null,
					favoriteOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
						className: "mr-1 size-3 fill-current text-[var(--color-gold)]",
						"aria-label": t(locale, "favorited")
					}) : null,
					!soon ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mr-1",
						children: formatLocalWeekday(meeting.nextOccurrence, zone)
					}) : null,
					upcoming ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mr-1 whitespace-nowrap text-[var(--color-primary)]",
						children: formatLocalTime(meeting.nextOccurrence, zone)
					}) : null,
					upcoming && soon ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mr-1",
						children: "•"
					}) : null,
					soon ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						meeting.isLive ? t(locale, "started") : t(locale, "starting"),
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[var(--color-primary)]",
							children: rel
						})
					] }) : null,
					(meeting.tags || []).map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "badge-program mr-1 normal-case",
						children: t(locale, TAG_KEYS[tag] || tag)
					}, tag))
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "ml-2 flex h-full items-center gap-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "bell-btn",
				"data-on": alertOn,
				"aria-label": alertOn ? t(locale, "remindOn") : t(locale, "remindOff"),
				"aria-pressed": alertOn,
				onClick: onBell,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, {
					className: "size-4",
					fill: alertOn ? "currentColor" : "none"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(JoinButton, { meeting })]
		})]
	});
}
function SessionList() {
	const now = useMeetingStore((s) => s.now);
	const openCreate = useMeetingStore((s) => s.openCreate);
	const meetings = useVisibleMeetings();
	const cardSize = useMeetingStore((s) => s.cardSize);
	const filters = useMeetingStore((s) => s.filters);
	const locale = useMeetingStore((s) => s.locale);
	const customOnly = filters.source === "custom";
	const scheduled = scheduleMeetings(meetings, now, viewerZone());
	if (filters.originLat != null && filters.originLng != null) {
		const lat = filters.originLat;
		const lng = filters.originLng;
		scheduled.sort((a, b) => {
			return (typeof a.lat === "number" && typeof a.lng === "number" ? haversineKm(lat, lng, a.lat, a.lng) : Number.POSITIVE_INFINITY) - (typeof b.lat === "number" && typeof b.lng === "number" ? haversineKm(lat, lng, b.lat, b.lng) : Number.POSITIVE_INFINITY) || a.nextOccurrence - b.nextOccurrence;
		});
	}
	const groups = groupByCategory(scheduled);
	const any = scheduled.length > 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "session-list mx-auto flex w-full max-w-[520px] flex-col items-center px-4 pb-24",
		"data-cards": cardSize,
		children: [!any ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-16 flex max-w-sm flex-col items-center text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm tracking-wide text-[var(--color-fg-2)] uppercase",
					children: customOnly ? t(locale, "emptyMine") : t(locale, "noMatch")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-[15px] leading-relaxed text-[var(--color-fg-3)]",
					children: customOnly ? t(locale, "emptyMineDetail") : t(locale, "noMatchDetail")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "btn-primary mt-6 h-11 px-5 text-base",
					onClick: openCreate,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }),
						" ",
						t(locale, "addMeeting")
					]
				})
			]
		}) : null, groups.map((group) => {
			if (group.meetings.length === 0 && group.hideIfEmpty) return null;
			if (group.meetings.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-7 flex w-full flex-col items-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "session-group__title mb-3",
					children: group.title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-[var(--color-fg-3)]",
					children: group.empty
				})]
			}, group.id);
			const limit = group.id === "live" || group.id === "nextHour" ? 24 : 20;
			const shown = group.meetings.slice(0, limit);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-7 flex w-full flex-col items-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "session-group__title mb-2",
						children: group.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex w-full flex-col items-center gap-2",
						children: shown.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionCard, {
							meeting: m,
							now
						}, m.id))
					}),
					group.meetings.length > limit ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-center text-xs tracking-wide text-[var(--color-fg-3)] uppercase",
						children: [
							limit,
							" of ",
							group.meetings.length,
							". Narrow the list to see a different set."
						]
					}) : null
				]
			}, group.id);
		})]
	});
}
function SessionDetails() {
	const selectedId = useMeetingStore((s) => s.selectedId);
	const meeting = useMeetingStore((s) => s.selectedId ? s.getMeeting(s.selectedId) : void 0);
	const now = useMeetingStore((s) => s.now);
	const selectMeeting = useMeetingStore((s) => s.selectMeeting);
	const openEdit = useMeetingStore((s) => s.openEdit);
	const deleteCustom = useMeetingStore((s) => s.deleteCustom);
	const hideCatalog = useMeetingStore((s) => s.hideCatalog);
	const programs = useMeetingStore((s) => s.programs);
	const locale = useMeetingStore((s) => s.locale);
	const groups = useMeetingStore((s) => s.groups);
	const alertOn = useMeetingStore((s) => selectedId ? s.alertIds.includes(selectedId) : false);
	const favoriteOn = useMeetingStore((s) => selectedId ? s.favoriteMeetingIds.includes(selectedId) : false);
	const toggleAlert = useMeetingStore((s) => s.toggleAlert);
	const toggleFavorite = useMeetingStore((s) => s.toggleFavoriteMeeting);
	const setAlertsEnabled = useMeetingStore((s) => s.setAlertsEnabled);
	if (!selectedId || !meeting) return null;
	const zone = viewerZone();
	const next = nextOccurrence(meeting, now) ?? now;
	const isLive = next <= now;
	const joinUrl = buildJoinUrl(meeting);
	const appUrl = meeting.platform === "zoom" ? buildZoomAppUrl(meeting) : null;
	const program = programById(programs, meeting.programId || "aca");
	const shown = program ? localizedProgram(program, locale) : null;
	const group = groups.find((g) => g.id === meeting.groupId);
	const when = `Every ${formatLocalWeekday(next, zone, "long")} · ${formatLocalTime(next, zone)}`;
	const details = copyDetailsText(meeting, when, joinUrl);
	function close() {
		selectMeeting(null);
	}
	async function copyField(label, value) {
		if (!value) return;
		const ok = await copyText(value);
		toast(ok ? `${label} copied` : "Could not copy");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-50 flex items-end justify-center md:items-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "sheet-backdrop absolute inset-0",
			"aria-label": "Close meeting",
			onClick: close
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": "modal-title",
			className: "relative z-10 flex max-h-[92dvh] w-full flex-col overflow-y-auto rounded-t-xl bg-[var(--color-card)] shadow-2xl md:w-[500px] md:rounded-xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					id: "modal-close",
					className: "sticky top-0 z-2 ml-auto mt-1 mr-3 rounded-lg bg-[var(--color-bg)] px-3 py-1.5 text-[var(--color-primary)]",
					onClick: close,
					"aria-label": "Close",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-6 mt-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center text-[12px] tracking-wide text-[var(--color-fg-3)] uppercase",
							children: [
								isLive ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "badge-live mr-2 inline-flex items-center gap-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "live-dot" }),
										" ",
										t(locale, "live")
									]
								}) : null,
								meeting.source === "custom" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "badge-mine mr-2",
									children: t(locale, "mine")
								}) : null,
								shown ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "badge-program mr-2",
									children: shown.short
								}) : null,
								(meeting.tags || []).map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "badge-program mr-2",
									children: t(locale, TAG_KEYS[tag] || tag)
								}, tag)),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									isLive ? t(locale, "started") : t(locale, "starting"),
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[var(--color-primary)]",
										children: relativePhrase(now, next)
									})
								] })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							id: "modal-title",
							className: "mt-2 mb-1 font-display text-3xl leading-tight text-[var(--color-fg)]",
							children: meeting.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-sm text-[var(--color-fg-3)]",
							children: [shown?.name, group ? ` · ${group.name}` : ""]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-[var(--color-fg-3)] opacity-80",
							children: [
								"Every ",
								formatLocalWeekday(next, zone, "long"),
								" · ",
								formatLocalTime(next, zone)
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-1 text-xs text-[var(--color-fg-3)]",
							children: [
								weekdayLong(meeting.weekday),
								" ",
								meeting.hour.toString().padStart(2, "0"),
								":",
								meeting.minute.toString().padStart(2, "0"),
								" ",
								meeting.zone.replace(/_/g, " "),
								" · ",
								meeting.durationMinutes,
								" min"
							]
						}),
						meeting.language || meeting.location ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1 text-xs tracking-wide text-[var(--color-fg-2)] uppercase",
							children: [meeting.language, meeting.location].filter(Boolean).join(" · ")
						}) : null
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-4 mt-4 mb-2 flex flex-wrap items-center justify-between gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "btn-secondary h-11 px-3 text-sm",
							onClick: () => copyField("Details", details),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" }), " Copy"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "btn-secondary h-11 px-3 text-sm",
							onClick: () => addToCalendar(meeting, next),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarPlus, { className: "size-4" }), " Calendar"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "btn-secondary h-11 px-3 text-sm",
							onClick: () => toggleFavorite(meeting.id),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
								className: "size-4",
								fill: favoriteOn ? "currentColor" : "none"
							}), favoriteOn ? t(locale, "favorited") : t(locale, "favorite")]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "btn-secondary h-11 px-3 text-sm",
							onClick: async () => {
								if (!alertOn) {
									if (await requestNotify() !== "granted") {
										toast("Allow notifications to mark reminders");
										return;
									}
									setAlertsEnabled(true);
								}
								toggleAlert(meeting.id);
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, {
								className: "size-4",
								fill: alertOn ? "currentColor" : "none"
							}), alertOn ? "Reminder on" : "Remind me"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(JoinButton, {
							meeting,
							size: "lg",
							stopPropagation: false
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mx-6 mb-3 text-xs text-[var(--color-fg-3)]",
					children: joinHint(meeting)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-[var(--color-bg-3)] px-4 py-3 text-lg",
					children: [
						meeting.meetingId ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "mb-3 flex w-full items-center justify-between text-left",
							onClick: () => copyField("Meeting ID", meeting.meetingId),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
								className: "mr-2 text-base",
								children: meeting.platform === "phone" ? "Phone" : meeting.platform === "inperson" ? "Place" : "Room"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[var(--color-primary)]",
								children: meeting.platform === "zoom" ? formatMeetingId(meeting.meetingId) : meeting.meetingId
							})]
						}) : null,
						meeting.password ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "flex w-full items-center justify-between text-left",
							onClick: () => copyField("Password", meeting.password),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
								className: "mr-2 text-base",
								children: meeting.platform === "phone" ? "Access code" : "Password"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[var(--color-primary)]",
								children: meeting.password
							})]
						}) : null,
						joinUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "mt-3 flex w-full items-center justify-between gap-3 text-left",
							onClick: () => copyField("Join link", joinUrl),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
								className: "shrink-0 text-base",
								children: "Join URL"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate text-sm text-[var(--color-primary)]",
								children: joinUrl
							})]
						}) : null
					]
				}),
				appUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					href: appUrl,
					className: "mx-6 mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MonitorPlay, { className: "size-4" }), " Open in Zoom app"]
				}) : null,
				meeting.notes ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-6 mt-4 mb-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
						className: "mb-1 text-sm tracking-wide text-[var(--color-fg-2)] uppercase",
						children: "Notes"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "whitespace-pre-wrap text-[15px] leading-relaxed break-words",
						children: meeting.notes
					})]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-6 mt-3 mb-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
						className: "mb-1 text-sm tracking-wide text-[var(--color-fg-2)] uppercase",
						children: "Contact"
					}), meeting.contactInfo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "break-words",
						children: meeting.contactInfo
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "opacity-60",
						children: "No contact info provided."
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-6 mb-8 flex flex-wrap gap-2",
					children: meeting.source === "custom" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "btn-secondary h-11 px-4",
						onClick: () => openEdit(meeting.id),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-4" }), " Edit"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "btn-secondary h-11 px-4 text-[var(--color-live)]",
						onClick: () => {
							if (confirm(`Delete “${meeting.name}”?`)) deleteCustom(meeting.id);
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" }), " Delete"]
					})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn-secondary h-11 px-4",
						onClick: () => hideCatalog(meeting.id),
						children: "Hide from my list"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-2 w-full bg-[image:var(--brand-gradient)] bg-[length:100%_100%]" })
			]
		})]
	});
}
function addToCalendar(meeting, startMs) {
	const end = startMs + meeting.durationMinutes * 6e4;
	const stamp = (ms) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
	const ics = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//TheRooms//EN",
		"BEGIN:VEVENT",
		`UID:${meeting.name}-${stamp(startMs)}@nextmeeting`,
		`DTSTAMP:${stamp(Date.now())}`,
		`DTSTART:${stamp(startMs)}`,
		`DTEND:${stamp(end)}`,
		`SUMMARY:${escapeIcs(meeting.name)}`,
		`DESCRIPTION:${escapeIcs(meeting.notes)}`,
		"END:VEVENT",
		"END:VCALENDAR"
	].join("\r\n");
	const blob = new Blob([ics], { type: "text/calendar" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `${meeting.name.replace(/[^\w]+/g, "-")}.ics`;
	a.click();
	URL.revokeObjectURL(url);
	toast("Calendar event saved");
}
function escapeIcs(s) {
	return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
function MeetingForm() {
	const formOpen = useMeetingStore((s) => s.formOpen);
	const editingId = useMeetingStore((s) => s.editingId);
	const closeForm = useMeetingStore((s) => s.closeForm);
	const upsertCustom = useMeetingStore((s) => s.upsertCustom);
	const existing = useMeetingStore((s) => editingId ? s.getMeeting(editingId) : void 0);
	const customPrograms = useMeetingStore((s) => s.programs);
	const locale = useMeetingStore((s) => s.locale);
	const groups = useMeetingStore((s) => s.groups);
	const [draft, setDraft] = (0, import_react.useState)(emptyDraft());
	const [invite, setInvite] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		if (!formOpen) return;
		const zone = viewerZone();
		if (existing && existing.source === "custom") setDraft({ ...existing });
		else {
			const now = /* @__PURE__ */ new Date();
			setDraft({
				...emptyDraft(zone),
				weekday: (now.getDay() + 6) % 7 + 1,
				hour: now.getHours(),
				minute: 0
			});
		}
		setInvite("");
	}, [formOpen, existing]);
	const programs = (0, import_react.useMemo)(() => [...BUILTIN_PROGRAMS, ...customPrograms], [customPrograms]);
	const preview = (0, import_react.useMemo)(() => buildJoinUrl(draft), [draft]);
	const room = roomField(draft.platform);
	const programGroups = groups.filter((g) => g.programId === draft.programId);
	if (!formOpen) return null;
	function patch(p) {
		setDraft((d) => ({
			...d,
			...p
		}));
	}
	function applyInvite() {
		const parsed = parseZoomInvite(invite);
		if (!parsed.meetingId && !parsed.joinUrl && !parsed.password) {
			toast("Couldn't find a Zoom ID in that text");
			return;
		}
		setDraft((d) => ({
			...d,
			...parsed
		}));
		toast("Zoom details filled in");
	}
	function save(e) {
		e.preventDefault();
		if (!draft.name.trim()) {
			toast("Give the meeting a name");
			return;
		}
		upsertCustom(draft);
		toast(editingId ? "Meeting updated" : "Meeting added");
	}
	const timeValue = `${String(draft.hour).padStart(2, "0")}:${String(draft.minute).padStart(2, "0")}`;
	const zoneList = TIMEZONES.includes(draft.zone) ? [...TIMEZONES] : [draft.zone, ...TIMEZONES];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-50 flex items-end justify-center md:items-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "sheet-backdrop absolute inset-0",
			"aria-label": "Close form",
			onClick: closeForm
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit: save,
			className: "relative z-10 flex max-h-[94dvh] w-full flex-col overflow-y-auto rounded-t-xl bg-[var(--color-card)] shadow-2xl md:w-[540px] md:rounded-xl",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sticky top-0 z-2 flex items-center justify-between bg-[var(--color-card)] px-4 pt-3 pb-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-lg font-semibold",
					children: editingId ? "Edit meeting" : "Add a meeting"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "rounded-lg bg-[var(--color-bg)] p-2 text-[var(--color-primary)]",
					onClick: closeForm,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3 px-4 pb-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-xs font-semibold tracking-wide text-[var(--color-fg-2)] uppercase",
						children: ["Paste a Zoom invite", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							value: invite,
							onChange: (e) => setInvite(e.target.value),
							rows: 3,
							placeholder: "Join Zoom Meeting\nhttps://zoom.us/j/12345678901?pwd=secret\nMeeting ID: 123 4567 8901\nPasscode: hello",
							className: "field mt-1 min-h-[72px] resize-y font-normal normal-case tracking-normal"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "btn-secondary h-10 self-start px-3 text-sm",
						onClick: applyInvite,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WandSparkles, { className: "size-4" }), " Fill from invite"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Name",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "field",
							value: draft.name,
							onChange: (e) => patch({ name: e.target.value }),
							required: true
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Program",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								className: "field",
								value: draft.programId,
								onChange: (e) => patch({
									programId: e.target.value,
									groupId: ""
								}),
								children: programs.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
									value: p.id,
									children: [
										localizedProgram(p, locale).short,
										" — ",
										localizedProgram(p, locale).name
									]
								}, p.id))
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Group",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: "field",
								value: draft.groupId,
								onChange: (e) => patch({ groupId: e.target.value }),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "None"
								}), programGroups.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: g.id,
									children: g.name
								}, g.id))]
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Day",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								className: "field",
								value: draft.weekday,
								onChange: (e) => patch({ weekday: Number(e.target.value) }),
								children: WEEKDAYS.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: d.value,
									children: d.long
								}, d.value))
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Time",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "time",
								className: "field",
								value: timeValue,
								onChange: (e) => {
									const [h, m] = e.target.value.split(":").map(Number);
									patch({
										hour: h ?? 0,
										minute: m ?? 0
									});
								}
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Timezone",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								className: "field",
								value: draft.zone,
								onChange: (e) => patch({ zone: e.target.value }),
								children: zoneList.map((z) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: z,
									children: z.replace(/_/g, " ")
								}, z))
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Duration (min)",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "number",
								min: 15,
								max: 240,
								step: 5,
								className: "field",
								value: draft.durationMinutes,
								onChange: (e) => patch({ durationMinutes: Number(e.target.value) || 60 })
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Language",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "field",
								value: draft.language,
								onChange: (e) => patch({ language: e.target.value }),
								placeholder: "English"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Place",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "field",
								value: draft.location,
								onChange: (e) => patch({ location: e.target.value }),
								placeholder: "City or region"
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Platform",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							className: "field",
							value: draft.platform,
							onChange: (e) => {
								const platform = e.target.value;
								patch({
									platform,
									tags: (draft.tags || []).filter((tag) => tagFits(tag, platform))
								});
							},
							children: PLATFORMS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: p.id,
								children: p.label
							}, p.id))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-2",
						children: TAGS.filter((id) => tagFits(id, draft.platform)).map((id) => {
							const on = (draft.tags || []).includes(id);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-pressed": on,
								className: `px-3 py-2 text-sm ${on ? "border border-[var(--color-gold)]" : "border border-[var(--color-border)]"}`,
								onClick: () => {
									const current = draft.tags || [];
									patch({ tags: on ? current.filter((tag) => tag !== id) : [...current.filter((tag) => tag !== opposite(id)), id] });
								},
								children: t(locale, TAG_KEYS[id])
							}, id);
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: room.label,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "field",
							value: draft.meetingId,
							onChange: (e) => patch({ meetingId: e.target.value }),
							placeholder: room.placeholder,
							inputMode: draft.platform === "zoom" || draft.platform === "phone" ? "tel" : "text"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: draft.platform === "phone" ? "Access code" : "Password / passcode",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "field",
							value: draft.password,
							onChange: (e) => patch({ password: e.target.value }),
							placeholder: "optional"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Join URL (optional — auto-built if blank)",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "field",
							value: draft.joinUrl,
							onChange: (e) => patch({ joinUrl: e.target.value }),
							placeholder: "https://zoom.us/j/…"
						})
					}),
					preview ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "rounded-lg bg-[var(--color-bg-3)] px-3 py-2 text-xs leading-relaxed break-all text-[var(--color-fg-2)]",
						children: ["One-click launch: ", preview]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-[var(--color-fg-3)]",
						children: "Add a room, number, or link to build a one-tap launch."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Who can attend",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							className: "field",
							value: draft.gender,
							onChange: (e) => patch({ gender: e.target.value }),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "ALL",
									children: "Everyone"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "WOMEN_ONLY",
									children: "Women"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "MEN_ONLY",
									children: "Men"
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Notes",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							className: "field min-h-[80px] resize-y",
							value: draft.notes,
							onChange: (e) => patch({ notes: e.target.value })
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Contact",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "field",
							value: draft.contactInfo,
							onChange: (e) => patch({ contactInfo: e.target.value })
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "submit",
						className: "btn-primary mt-2 h-12 w-full text-base",
						children: editingId ? "Save changes" : "Add meeting"
					})
				]
			})]
		})]
	});
}
function tagFits(id, platform) {
	if (id === "access" || id === "paused") return platform === "inperson";
	if (id === "hybrid") return platform !== "phone" && platform !== "email";
	return true;
}
function opposite(id) {
	if (id === "open") return "closed";
	if (id === "closed") return "open";
	return "";
}
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block text-xs font-semibold tracking-wide text-[var(--color-fg-2)] uppercase",
		children: [label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-1 font-normal normal-case tracking-normal",
			children
		})]
	});
}
function ProgramsSheet() {
	const open = useMeetingStore((s) => s.listsOpen);
	const setOpen = useMeetingStore((s) => s.setListsOpen);
	const customPrograms = useMeetingStore((s) => s.programs);
	const groups = useMeetingStore((s) => s.groups);
	const all = (0, import_react.useMemo)(() => [...BUILTIN_PROGRAMS, ...customPrograms], [customPrograms]);
	const deleteProgram = useMeetingStore((s) => s.deleteProgram);
	const addGroup = useMeetingStore((s) => s.addGroup);
	const deleteGroup = useMeetingStore((s) => s.deleteGroup);
	const alertsEnabled = useMeetingStore((s) => s.alertsEnabled);
	const alertFavorites = useMeetingStore((s) => s.alertFavorites);
	const setAlertFavorites = useMeetingStore((s) => s.setAlertFavorites);
	const setAlertsEnabled = useMeetingStore((s) => s.setAlertsEnabled);
	const lead = useMeetingStore((s) => s.alertLeadMinutes);
	const setLead = useMeetingStore((s) => s.setAlertLead);
	const addProgram = useMeetingStore((s) => s.addProgram);
	const setDossier = useMeetingStore((s) => s.setDossier);
	const locale = useMeetingStore((s) => s.locale);
	const label = (key) => t(locale, key);
	const [short, setShort] = (0, import_react.useState)("");
	const [name, setName] = (0, import_react.useState)("");
	const [groupName, setGroupName] = (0, import_react.useState)("");
	const [groupProgram, setGroupProgram] = (0, import_react.useState)("aa");
	const [groupPlatform, setGroupPlatform] = (0, import_react.useState)("whatsapp");
	const [groupLink, setGroupLink] = (0, import_react.useState)("");
	const [programQuery, setProgramQuery] = (0, import_react.useState)("");
	if (!open) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-50 flex items-end justify-center md:items-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "sheet-backdrop absolute inset-0",
			"aria-label": "Close lists",
			onClick: () => setOpen(false)
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative z-10 flex max-h-[92dvh] w-full flex-col overflow-y-auto rounded-t-xl bg-[var(--color-card)] shadow-2xl md:w-[520px] md:rounded-xl",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "deco-rule sticky top-0 z-2 flex items-center justify-between bg-[var(--color-card)] px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl tracking-wide",
					children: label("programsGroups")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "rounded-sm bg-[var(--color-bg)] p-2",
					onClick: () => setOpen(false),
					"aria-label": "Close",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-6 px-4 py-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-xs font-semibold tracking-[0.16em] text-[var(--color-gold)] uppercase",
							children: "Reminders"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-[var(--color-fg-3)]",
							children: label("systemAlerts")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "mt-2 block text-xs font-semibold tracking-wide uppercase",
							children: ["How early", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								className: "field mt-1",
								value: lead,
								onChange: (e) => setLead(Number(e.target.value)),
								children: [
									5,
									10,
									15,
									30,
									60
								].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
									value: n,
									children: [n, " minutes"]
								}, n))
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-[var(--color-fg-3)]",
							children: alertsEnabled ? "Reminders are on for marked meetings." : "Turn on a bell to allow notifications."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							"aria-pressed": alertFavorites,
							className: `mt-3 px-3 py-2 text-left text-sm ${alertFavorites ? "border border-[var(--color-gold)]" : "border border-[var(--color-border)]"}`,
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
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-xs font-semibold tracking-[0.16em] text-[var(--color-gold)] uppercase",
							children: "Programs"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: programQuery,
							onChange: (e) => setProgramQuery(e.target.value),
							placeholder: "Find a program",
							className: "field mt-2 w-full"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2 flex flex-col gap-2",
							children: PROGRAM_SECTIONS.map((section) => {
								const q = programQuery.trim().toLowerCase();
								const items = BUILTIN_PROGRAMS.filter((p) => {
									const shown = localizedProgram(p, locale);
									return p.section === section && (!q || `${shown.short} ${shown.name} ${p.short} ${p.name} ${p.note ?? ""}`.toLowerCase().includes(q));
								});
								if (!items.length) return null;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
									open: Boolean(q) || section === "A–C",
									className: "border border-[var(--color-border)] px-3 py-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
										className: "cursor-pointer text-sm font-semibold tracking-wide",
										children: section
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
										className: "mt-2 divide-y divide-[var(--color-border)]",
										children: items.map((p) => {
											const shown = localizedProgram(p, locale);
											return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
												to: "/program/$id",
												params: { id: p.id },
												className: "block py-1.5 text-sm",
												onClick: () => setOpen(false),
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
														className: "mr-2 tracking-wide",
														children: shown.short
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-[var(--color-fg-3)]",
														children: shown.name
													}),
													p.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "mt-0.5 block text-xs text-[var(--color-fg-3)]",
														children: p.note
													}) : null
												]
											}) }, p.id);
										})
									})]
								}, section);
							})
						}),
						customPrograms.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-3 divide-y divide-[var(--color-border)]",
							children: customPrograms.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center justify-between py-1.5 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/program/$id",
									params: { id: p.id },
									className: "min-w-0",
									onClick: () => setOpen(false),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
										className: "mr-2 tracking-wide",
										children: p.short
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[var(--color-fg-3)]",
										children: p.name
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "text-xs tracking-wide text-[var(--color-primary)] uppercase",
									onClick: () => deleteProgram(p.id),
									children: "Remove"
								})]
							}, p.id))
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							className: "mt-3 grid grid-cols-[88px_1fr_auto] gap-2",
							onSubmit: (e) => {
								e.preventDefault();
								const id = addProgram(short, name);
								if (!id) {
									toast("Give the program a short name");
									return;
								}
								const added = {
									id,
									name: name.trim(),
									short: short.trim()
								};
								setShort("");
								setName("");
								toast("Program added");
								if (typeof navigator !== "undefined" && navigator.onLine !== false) fetchDossier(added, KNOWN_QIDS[id] || "").then((dossier) => {
									if (dossier) setDossier(dossier);
								}).catch(() => void 0);
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "field",
									value: short,
									onChange: (e) => setShort(e.target.value),
									placeholder: "OA",
									"aria-label": "Short name"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "field",
									value: name,
									onChange: (e) => setName(e.target.value),
									placeholder: "Full name",
									"aria-label": "Program name"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "submit",
									className: "btn-primary h-11 px-3 text-xs",
									children: "Add"
								})
							]
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-xs font-semibold tracking-[0.16em] text-[var(--color-gold)] uppercase",
							children: "Groups"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-[var(--color-fg-3)]",
							children: "A group can be a chat, a homegroup, or a place. It does not need a weekly time."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
							className: "mt-2 flex flex-col gap-2",
							children: [groups.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
								className: "text-sm text-[var(--color-fg-3)]",
								children: "No groups yet."
							}) : null, groups.map((g) => {
								const program = all.find((p) => p.id === g.programId);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex items-start justify-between gap-3 border border-[var(--color-border)] px-3 py-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/program/$id",
										params: { id: g.programId },
										className: "text-sm",
										onClick: () => setOpen(false),
										children: g.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-xs tracking-wide text-[var(--color-fg-3)] uppercase",
										children: [program?.short ?? g.programId, g.joinUrl ? ` · ${g.platform}` : ""]
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "text-xs tracking-wide text-[var(--color-primary)] uppercase",
										onClick: () => deleteGroup(g.id),
										children: "Remove"
									})]
								}, g.id);
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							className: "mt-3 flex flex-col gap-2",
							onSubmit: (e) => {
								e.preventDefault();
								if (!addGroup({
									name: groupName,
									programId: groupProgram,
									notes: "",
									contactInfo: "",
									platform: groupPlatform,
									joinUrl: groupLink
								})) {
									toast("Give the group a name");
									return;
								}
								setGroupName("");
								setGroupLink("");
								toast("Group added");
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "field",
									value: groupName,
									onChange: (e) => setGroupName(e.target.value),
									placeholder: "Group name",
									"aria-label": "Group name"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
										className: "field",
										value: groupProgram,
										onChange: (e) => setGroupProgram(e.target.value),
										"aria-label": "Program",
										children: all.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: p.id,
											children: p.short
										}, p.id))
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
										className: "field",
										value: groupPlatform,
										onChange: (e) => setGroupPlatform(e.target.value),
										"aria-label": "Platform",
										children: PLATFORMS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: p.id,
											children: p.label
										}, p.id))
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "field",
									value: groupLink,
									onChange: (e) => setGroupLink(e.target.value),
									placeholder: "Link, optional",
									"aria-label": "Group link"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "submit",
									className: "btn-secondary h-11 px-3 text-sm",
									children: "Add group"
								})
							]
						})
					] })
				]
			})]
		})]
	});
}
function AlertWatcher() {
	const hydrated = useMeetingStore((s) => s.hydrated);
	const alertsEnabled = useMeetingStore((s) => s.alertsEnabled);
	const alertIds = useMeetingStore((s) => s.alertIds);
	const alertFavorites = useMeetingStore((s) => s.alertFavorites);
	const favoriteMeetings = useMeetingStore((s) => s.favoriteMeetingIds);
	const favoritePrograms = useMeetingStore((s) => s.favoriteProgramIds);
	const favoriteGroups = useMeetingStore((s) => s.favoriteGroupIds);
	const lead = useMeetingStore((s) => s.alertLeadMinutes);
	const now = useMeetingStore((s) => s.now);
	const custom = useMeetingStore((s) => s.custom);
	const hiddenIds = useMeetingStore((s) => s.hiddenIds);
	const showCatalog = useMeetingStore((s) => s.showCatalog);
	(0, import_react.useEffect)(() => {
		if (!hydrated || !alertsEnabled) return;
		if (!alertIds.length && !alertFavorites) return;
		if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
		const wanted = useMeetingStore.getState().allMeetings().filter((meeting) => {
			if (alertIds.includes(meeting.id)) return true;
			if (!alertFavorites) return false;
			return favoriteMeetings.includes(meeting.id) || favoritePrograms.includes(meeting.programId || "") || (meeting.groupId ? favoriteGroups.includes(meeting.groupId) : false);
		});
		if (!wanted.length) return;
		const scheduled = scheduleMeetings(wanted, Date.now(), viewerZone());
		const leadMs = lead * 6e4;
		const due = scheduled.filter((meeting) => {
			const delta = meeting.nextOccurrence - Date.now();
			return delta <= leadMs && delta >= -12e4;
		});
		const marked = due.filter((meeting) => alertIds.includes(meeting.id));
		const extras = due.filter((meeting) => !alertIds.includes(meeting.id));
		for (const meeting of marked) notifyOne(meeting);
		if (extras.length === 1) notifyOne(extras[0]);
		else if (extras.length > 1) {
			const key = `favorites:${extras.map((meeting) => meeting.id).sort().join(",")}`;
			if (claimReminder(key)) {
				const names = extras.slice(0, 3).map((meeting) => meeting.name).join(", ");
				showNotification(`${extras.length} favorite meetings`, extras.length > 3 ? `${names}…` : names, key);
			}
		}
	}, [
		hydrated,
		alertsEnabled,
		alertIds,
		alertFavorites,
		favoriteMeetings,
		favoritePrograms,
		favoriteGroups,
		lead,
		now,
		custom,
		hiddenIds,
		showCatalog
	]);
	return null;
}
function notifyOne(meeting) {
	const delta = meeting.nextOccurrence - Date.now();
	const key = `${meeting.id}:${meeting.nextOccurrence}`;
	if (!claimReminder(key)) return;
	const mins = Math.max(0, Math.round(delta / 6e4));
	const body = mins <= 0 ? "Starting now" : `Starts in ${mins} min`;
	showNotification(meeting.name, body, key);
}
function Home() {
	const hydrate = useMeetingStore((s) => s.hydrate);
	const docked = useMeetingStore((s) => s.barPlace) === "bottom";
	const hydrated = useMeetingStore((s) => s.hydrated);
	const tick = useMeetingStore((s) => s.tick);
	(0, import_react.useLayoutEffect)(() => {
		hydrate();
	}, [hydrate]);
	(0, import_react.useEffect)(() => {
		registerOfflineShell();
		const id = window.setInterval(tick, 15e3);
		return () => window.clearInterval(id);
	}, [tick]);
	(0, import_react.useEffect)(() => {
		function onKey(e) {
			if (e.key === "Escape") {
				useMeetingStore.getState().selectMeeting(null);
				useMeetingStore.getState().closeForm();
				useMeetingStore.getState().setImportOpen(false);
				useMeetingStore.getState().setListsOpen(false);
				useMeetingStore.getState().setNavOpen(false);
			}
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `min-h-dvh bg-[var(--color-bg)] text-[var(--color-fg)] ${docked ? "pb-[calc(9.5rem+env(safe-area-inset-bottom))]" : ""}`,
		children: [
			docked ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionBar, {})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sticky top-0 z-30",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, { embedded: true }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionBar, {})]
			}),
			hydrated ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionList, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex max-w-[470px] flex-col gap-3 px-4 py-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "session-card h-20 animate-pulse" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "session-card h-20 animate-pulse" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "session-card h-20 animate-pulse" })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionDetails, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MeetingForm, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProgramsSheet, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertWatcher, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InstallNotice, {})
		]
	});
}
//#endregion
export { Home as component };
