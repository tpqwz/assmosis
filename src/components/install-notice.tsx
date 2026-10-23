import { useEffect, useState } from "react";
import { usePwaInstall } from "@/lib/pwa";
import { useMeetingStore } from "@/lib/meetings/store";

const DISMISS_KEY = "assmosis-pwa-notice";

export function InstallNotice() {
  const { standalone, canPrompt, ios, promptInstall } = usePwaInstall();
  const docked = useMeetingStore((s) => s.barPlace) === "bottom";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (standalone) return;
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* private mode */
    }
    const id = window.setTimeout(() => setOpen(true), 600);
    return () => window.clearTimeout(id);
  }, [standalone]);

  if (!open || standalone) return null;

  function dismiss() {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  return (
    <div className={`install-notice ${docked ? "install-notice--docked" : ""}`} role="dialog" aria-label="Install Assmosis">
      <p className="text-xs font-semibold tracking-[0.16em] text-[var(--color-gold)] uppercase">Add to your home screen</p>
      <p className="mt-1 text-sm leading-snug text-[var(--color-fg)]">
        Assmosis can run as its own app, with the meeting list a tap away.
      </p>
      {canPrompt ? (
        <button
          type="button"
          className="btn-primary mt-3 h-10 px-4 text-sm"
          onClick={() => {
            void promptInstall().then((outcome) => {
              if (outcome === "accepted") setOpen(false);
            });
          }}
        >
          Install app
        </button>
      ) : ios ? (
        <p className="mt-2 text-xs leading-relaxed text-[var(--color-fg-3)]">
          In Safari, tap Share, then Add to Home Screen.
        </p>
      ) : (
        <p className="mt-2 text-xs leading-relaxed text-[var(--color-fg-3)]">
          Use the browser menu and choose Install app, or Add to Home Screen.
        </p>
      )}
      <button type="button" className="mt-2 block text-xs tracking-wide text-[var(--color-fg-3)] uppercase" onClick={dismiss}>
        Not now
      </button>
    </div>
  );
}

export function InstallSettings() {
  const { standalone, canPrompt, ios, promptInstall } = usePwaInstall();
  const [outcome, setOutcome] = useState<string | null>(null);

  return (
    <section className="border border-[var(--color-border)] bg-[var(--color-card)] p-4">
      <h2 className="text-xs font-semibold tracking-[0.16em] text-[var(--color-gold)] uppercase">Install</h2>
      {standalone ? (
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-fg)]">
          Already installed. You’re using Assmosis as an app, not in a browser tab.
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-fg-3)]">
            Not installed yet. Add it to your home screen and it opens like its own app.
          </p>
          {canPrompt ? (
            <button
              type="button"
              className="btn-primary mt-3 h-11 px-4"
              onClick={() => {
                void promptInstall().then((result) => {
                  setOutcome(result === "accepted" ? "Installed." : result === "dismissed" ? "Install was cancelled." : null);
                });
              }}
            >
              Install app
            </button>
          ) : ios ? (
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-fg)]">
              This browser can’t install with one tap. In Safari, tap Share, then Add to Home Screen.
            </p>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-fg)]">
              This browser isn’t offering a one-tap install. Open the browser menu and choose Install app, or Add to Home Screen.
            </p>
          )}
          {outcome ? <p className="mt-2 text-xs text-[var(--color-fg-3)]">{outcome}</p> : null}
        </>
      )}
    </section>
  );
}
