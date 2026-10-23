const fired = new Set<string>();

async function notifyRegistration() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    const ready = await navigator.serviceWorker.getRegistration();
    if (ready) return ready;
    const installed =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (!import.meta.env.PROD && !installed) return null;
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}

export function requestNotify(): Promise<NotificationPermission> {
  if (typeof Notification === "undefined") return Promise.resolve("denied");
  void notifyRegistration();
  if (Notification.permission === "granted") return Promise.resolve("granted");
  if (Notification.permission === "denied") return Promise.resolve("denied");
  return Notification.requestPermission();
}

export async function showNotification(title: string, body: string, tag: string) {
  const options: NotificationOptions = {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag,
    lang: typeof navigator !== "undefined" ? navigator.language : "en",
  };
  try {
    const reg = await notifyRegistration();
    if (reg) {
      await reg.showNotification(title, options);
      return;
    }
  } catch {
    /* fall through to the page notification */
  }
  try {
    new Notification(title, options);
  } catch {
    /* browser blocked it */
  }
}

export function claimReminder(key: string): boolean {
  if (fired.has(key)) return false;
  fired.add(key);
  return true;
}
