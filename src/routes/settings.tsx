import { useState } from "react";
import { useLayoutEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useMeetingStore } from "@/lib/meetings/store";
import { downloadBlob, downloadBytes, meetingsToCsv, stampFilename, buildXlsxBytes } from "@/lib/meetings/io";
import { InstallSettings } from "@/components/install-notice";
import { LOCALES, t } from "@/lib/meetings/i18n";
import { requestNotify } from "@/lib/meetings/alerts";
import { BUILTIN_PROGRAMS } from "@/lib/meetings/programs";
import { KNOWN_QIDS, fetchDossier } from "@/lib/meetings/dossier";
import { TYPEFACES } from "@/lib/meetings/typeface";
import "@/lib/pwa";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  const hydrate = useMeetingStore((s) => s.hydrate);
  const place = useMeetingStore((s) => s.barPlace);
  const setBarPlace = useMeetingStore((s) => s.setBarPlace);
  const cardSize = useMeetingStore((s) => s.cardSize);
  const setCardSize = useMeetingStore((s) => s.setCardSize);
  const fontId = useMeetingStore((s) => s.fontId);
  const setFont = useMeetingStore((s) => s.setFont);
  const textSize = useMeetingStore((s) => s.textSize);
  const setTextSize = useMeetingStore((s) => s.setTextSize);
  const locale = useMeetingStore((s) => s.locale);
  const setLocale = useMeetingStore((s) => s.setLocale);
  const alertFavorites = useMeetingStore((s) => s.alertFavorites);
  const setAlertFavorites = useMeetingStore((s) => s.setAlertFavorites);
  const showExpired = useMeetingStore((s) => s.showExpired);
  const setShowExpired = useMeetingStore((s) => s.setShowExpired);
  const setAlertsEnabled = useMeetingStore((s) => s.setAlertsEnabled);
  const dossiers = useMeetingStore((s) => s.dossiers);
  const setDossier = useMeetingStore((s) => s.setDossier);
  const setImportOpen = useMeetingStore((s) => s.setImportOpen);
  const [refreshing, setRefreshing] = useState(false);
  const label = (key: string) => t(locale, key);

  useLayoutEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="min-h-dvh bg-[var(--color-bg)] text-[var(--color-fg)]">
      <header className="site-header sticky top-0 z-20 flex items-center justify-between px-2 py-1">
        <Link to="/" className="flex h-11 items-center gap-1 px-2 font-semibold text-[#f6e7c1]">
          <ArrowLeft className="size-5" /> {label("back")}
        </Link>
        <h1 className="wordmark text-base" style={{ letterSpacing: "0.12em" }}>
          {label("settings")}
        </h1>
        <span className="w-16" />
      </header>

      <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
        <InstallSettings />
        <section className="border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <h2 className="text-xs font-semibold tracking-[0.16em] text-[var(--color-gold)] uppercase">
            {label("language")}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-fg-3)]">{label("languageDetail")}</p>
          <div className="mt-3 grid gap-2">
            {LOCALES.map((item) => (
              <Choice
                key={item.id}
                selected={locale === item.id}
                title={item.name}
                detail=""
                onClick={() => setLocale(item.id)}
              />
            ))}
          </div>
        </section>
        <section className="border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <h2 className="text-xs font-semibold tracking-[0.16em] text-[var(--color-gold)] uppercase">Expired lists</h2>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-fg-3)]">
            Some lists were copied for one week or one dated directory. After that date they drop off. You can still look at them.
          </p>
          <div className="mt-3 grid gap-2">
            <Choice
              selected={!showExpired}
              title="Hide expired lists"
              detail="The current list only."
              onClick={() => setShowExpired(false)}
            />
            <Choice
              selected={showExpired}
              title="Show expired lists"
              detail="Older copies stay, marked expired."
              onClick={() => setShowExpired(true)}
            />
          </div>
        </section>
        <section className="border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <h2 className="text-xs font-semibold tracking-[0.16em] text-[var(--color-gold)] uppercase">Reminders</h2>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-fg-3)]">{label("systemAlerts")}</p>
          <button
            type="button"
            aria-pressed={alertFavorites}
            className={`mt-3 w-full px-3 py-2 text-left text-sm ${alertFavorites ? "border border-[var(--color-gold)]" : "border border-[var(--color-border)]"}`}
            onClick={async () => {
              if (!alertFavorites) {
                const perm = await requestNotify();
                if (perm !== "granted") {
                  toast("Allow notifications to remind you");
                  return;
                }
                setAlertsEnabled(true);
              }
              setAlertFavorites(!alertFavorites);
            }}
          >
            <b className="block">{label("alertFavorites")}</b>
            <span className="text-xs text-[var(--color-fg-3)]">{label("alertFavoritesDetail")}</span>
          </button>
        </section>
        <section className="border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <h2 className="text-xs font-semibold tracking-[0.16em] text-[var(--color-gold)] uppercase">{label("files")}</h2>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-fg-3)]">{label("filesDetail")}</p>
          <div className="mt-3 grid gap-2">
            <button type="button" className="btn-secondary h-11 px-4 text-left" onClick={() => setImportOpen(true)}>
              {label("importFile")}
            </button>
            <button
              type="button"
              className="btn-secondary h-11 px-4 text-left"
              onClick={() => {
                const meetings = useMeetingStore.getState().visibleMeetings();
                downloadBlob(
                  stampFilename("assmosis", "csv"),
                  new Blob([meetingsToCsv(meetings)], { type: "text/csv;charset=utf-8" }),
                );
                toast(`${meetings.length}`);
              }}
            >
              {label("exportCsv")}
            </button>
            <button
              type="button"
              className="btn-secondary h-11 px-4 text-left"
              onClick={() => {
                const meetings = useMeetingStore.getState().visibleMeetings();
                downloadBytes(
                  stampFilename("assmosis", "xlsx"),
                  buildXlsxBytes(meetings),
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                );
                toast(`${meetings.length}`);
              }}
            >
              {label("exportExcel")}
            </button>
          </div>
        </section>
        <section className="border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <h2 className="text-xs font-semibold tracking-[0.16em] text-[var(--color-gold)] uppercase">
            {label("refreshKnown")}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-fg-3)]">{label("refreshDetail")}</p>
          <button
            type="button"
            className="btn-secondary mt-3 h-11 px-4"
            disabled={refreshing}
            onClick={() => {
              if (typeof navigator !== "undefined" && navigator.onLine === false) {
                toast(label("offline"));
                return;
              }
              setRefreshing(true);
              const known = BUILTIN_PROGRAMS.filter((program) => KNOWN_QIDS[program.id] || dossiers[program.id]);
              void (async () => {
                let count = 0;
                for (const program of known) {
                  try {
                    const next = await fetchDossier(program, dossiers[program.id]?.qid || KNOWN_QIDS[program.id] || "");
                    if (next) {
                      setDossier(next);
                      count += 1;
                    }
                  } catch {
                    toast(label("offline"));
                    break;
                  }
                }
                if (count) toast(`${count} · ${label("updated")}`);
                setRefreshing(false);
              })();
            }}
          >
            {refreshing ? label("updating") : label("refreshGo")}
          </button>
        </section>
        <section className="border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <h2 className="text-xs font-semibold tracking-[0.16em] text-[var(--color-gold)] uppercase">
            {label("searchBar")}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-fg-3)]">{label("searchDetail")}</p>
          <div className="mt-3 grid gap-2">
            <Choice
              selected={place !== "bottom"}
              title={label("flush")}
              detail={label("flushDetail")}
              onClick={() => setBarPlace("flush")}
            />
            <Choice
              selected={place === "bottom"}
              title={label("bottom")}
              detail={label("bottomDetail")}
              onClick={() => setBarPlace("bottom")}
            />
          </div>
        </section>
        <section className="border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <h2 className="text-xs font-semibold tracking-[0.16em] text-[var(--color-gold)] uppercase">
            {label("textSize")}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-fg-3)]">{label("textSizeDetail")}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(
              [
                ["s", "sizeSmall"],
                ["m", "sizeMedium"],
                ["l", "sizeLarge"],
                ["xl", "sizeLarger"],
              ] as const
            ).map(([id, key]) => (
              <Choice
                key={id}
                selected={textSize === id}
                title={label(key)}
                detail=""
                onClick={() => setTextSize(id)}
              />
            ))}
          </div>
        </section>
        <section className="border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <h2 className="text-xs font-semibold tracking-[0.16em] text-[var(--color-gold)] uppercase">
            {label("typeface")}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-fg-3)]">{label("typefaceDetail")}</p>
          <p className="mt-3 text-base" data-font={fontId}>
            Thursday · 7:30 · Step meeting
          </p>
          <div className="mt-3 grid gap-2">
            {TYPEFACES.map((face) => (
              <Choice
                key={face.id}
                selected={fontId === face.id}
                title={face.label}
                detail={face.detail}
                face={face.id}
                onClick={() => setFont(face.id)}
              />
            ))}
          </div>
        </section>
        <section className="border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <h2 className="text-xs font-semibold tracking-[0.16em] text-[var(--color-gold)] uppercase">
            {label("cards")}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-fg-3)]">{label("cardsDetail")}</p>
          <div className="mt-3 grid gap-2">
            <Choice
              selected={cardSize === "compact"}
              title={label("compact")}
              detail={label("compactDetail")}
              onClick={() => setCardSize("compact")}
            />
            <Choice
              selected={cardSize === "comfortable"}
              title={label("comfortable")}
              detail={label("comfortableDetail")}
              onClick={() => setCardSize("comfortable")}
            />
            <Choice
              selected={cardSize === "wide"}
              title={label("wide")}
              detail={label("wideDetail")}
              onClick={() => setCardSize("wide")}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function Choice({
  selected,
  title,
  detail,
  face,
  onClick,
}: {
  selected: boolean;
  title: string;
  detail: string;
  face?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      data-font={face}
      className={`px-3 py-3 text-left ${
        selected
          ? "border border-[var(--color-gold)] bg-[var(--color-bg)]"
          : "border border-[var(--color-border)]"
      }`}
    >
      <span className="block text-sm">{title}</span>
      {detail ? <span className="mt-0.5 block text-xs text-[var(--color-fg-3)]">{detail}</span> : null}
    </button>
  );
}
