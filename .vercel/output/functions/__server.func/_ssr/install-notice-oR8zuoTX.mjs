import { i as __toESM } from "../_runtime.mjs";
import { J as require_react, S as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { J as useMeetingStore } from "./store-D4IrIlYG.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/install-notice-oR8zuoTX.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var deferred = null;
var listeners = /* @__PURE__ */ new Set();
function emit() {
	listeners.forEach((fn) => fn());
}
if (typeof window !== "undefined") {
	window.addEventListener("beforeinstallprompt", (event) => {
		event.preventDefault();
		deferred = event;
		emit();
	});
	window.addEventListener("appinstalled", () => {
		deferred = null;
		emit();
	});
}
function isStandalone() {
	if (typeof window === "undefined") return false;
	const nav = navigator;
	return window.matchMedia("(display-mode: standalone)").matches || window.matchMedia("(display-mode: fullscreen)").matches || nav.standalone === true;
}
function isIosBrowser() {
	if (typeof navigator === "undefined") return false;
	const ua = navigator.userAgent;
	const iOS = /iphone|ipad|ipod/i.test(ua);
	const iPadOs = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
	return iOS || iPadOs;
}
function canPromptInstall() {
	return deferred != null && !isStandalone();
}
async function promptInstall() {
	if (!deferred) return "unavailable";
	await deferred.prompt();
	const choice = await deferred.userChoice;
	deferred = null;
	emit();
	return choice.outcome;
}
function usePwaInstall() {
	const [standalone, setStandalone] = (0, import_react.useState)(false);
	const [canPrompt, setCanPrompt] = (0, import_react.useState)(false);
	const [ios, setIos] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const sync = () => {
			setStandalone(isStandalone());
			setCanPrompt(canPromptInstall());
			setIos(isIosBrowser());
		};
		sync();
		listeners.add(sync);
		const media = window.matchMedia("(display-mode: standalone)");
		media.addEventListener?.("change", sync);
		return () => {
			listeners.delete(sync);
			media.removeEventListener?.("change", sync);
		};
	}, []);
	return {
		standalone,
		canPrompt,
		ios,
		promptInstall
	};
}
var fired = /* @__PURE__ */ new Set();
async function notifyRegistration() {
	if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
	try {
		const ready = await navigator.serviceWorker.getRegistration();
		if (ready) return ready;
		window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone;
		return await navigator.serviceWorker.register("/sw.js");
	} catch {
		return null;
	}
}
function requestNotify() {
	if (typeof Notification === "undefined") return Promise.resolve("denied");
	notifyRegistration();
	if (Notification.permission === "granted") return Promise.resolve("granted");
	if (Notification.permission === "denied") return Promise.resolve("denied");
	return Notification.requestPermission();
}
async function showNotification(title, body, tag) {
	const options = {
		body,
		icon: "/icon-192.png",
		badge: "/icon-192.png",
		tag,
		lang: typeof navigator !== "undefined" ? navigator.language : "en"
	};
	try {
		const reg = await notifyRegistration();
		if (reg) {
			await reg.showNotification(title, options);
			return;
		}
	} catch {}
	try {
		new Notification(title, options);
	} catch {}
}
function claimReminder(key) {
	if (fired.has(key)) return false;
	fired.add(key);
	return true;
}
var DISMISS_KEY = "assmosis-pwa-notice";
function InstallNotice() {
	const { standalone, canPrompt, ios, promptInstall } = usePwaInstall();
	const docked = useMeetingStore((s) => s.barPlace) === "bottom";
	const [open, setOpen] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (standalone) return;
		try {
			if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
		} catch {}
		const id = window.setTimeout(() => setOpen(true), 600);
		return () => window.clearTimeout(id);
	}, [standalone]);
	if (!open || standalone) return null;
	function dismiss() {
		try {
			sessionStorage.setItem(DISMISS_KEY, "1");
		} catch {}
		setOpen(false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `install-notice ${docked ? "install-notice--docked" : ""}`,
		role: "dialog",
		"aria-label": "Install Assmosis",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-semibold tracking-[0.16em] text-[var(--color-gold)] uppercase",
				children: "Add to your home screen"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm leading-snug text-[var(--color-fg)]",
				children: "Assmosis can run as its own app, with the meeting list a tap away."
			}),
			canPrompt ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn-primary mt-3 h-10 px-4 text-sm",
				onClick: () => {
					promptInstall().then((outcome) => {
						if (outcome === "accepted") setOpen(false);
					});
				},
				children: "Install app"
			}) : ios ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-xs leading-relaxed text-[var(--color-fg-3)]",
				children: "In Safari, tap Share, then Add to Home Screen."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-xs leading-relaxed text-[var(--color-fg-3)]",
				children: "Use the browser menu and choose Install app, or Add to Home Screen."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "mt-2 block text-xs tracking-wide text-[var(--color-fg-3)] uppercase",
				onClick: dismiss,
				children: "Not now"
			})
		]
	});
}
function InstallSettings() {
	const { standalone, canPrompt, ios, promptInstall } = usePwaInstall();
	const [outcome, setOutcome] = (0, import_react.useState)(null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "border border-[var(--color-border)] bg-[var(--color-card)] p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-xs font-semibold tracking-[0.16em] text-[var(--color-gold)] uppercase",
			children: "Install"
		}), standalone ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm leading-relaxed text-[var(--color-fg)]",
			children: "Already installed. You’re using Assmosis as an app, not in a browser tab."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm leading-relaxed text-[var(--color-fg-3)]",
				children: "Not installed yet. Add it to your home screen and it opens like its own app."
			}),
			canPrompt ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn-primary mt-3 h-11 px-4",
				onClick: () => {
					promptInstall().then((result) => {
						setOutcome(result === "accepted" ? "Installed." : result === "dismissed" ? "Install was cancelled." : null);
					});
				},
				children: "Install app"
			}) : ios ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm leading-relaxed text-[var(--color-fg)]",
				children: "This browser can’t install with one tap. In Safari, tap Share, then Add to Home Screen."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm leading-relaxed text-[var(--color-fg)]",
				children: "This browser isn’t offering a one-tap install. Open the browser menu and choose Install app, or Add to Home Screen."
			}),
			outcome ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-xs text-[var(--color-fg-3)]",
				children: outcome
			}) : null
		] })]
	});
}
//#endregion
export { showNotification as a, requestNotify as i, InstallSettings as n, claimReminder as r, InstallNotice as t };
