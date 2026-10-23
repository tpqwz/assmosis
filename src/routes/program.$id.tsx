import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Star } from "lucide-react";
import { toast } from "sonner";
import { catalogMeetings, useMeetingStore } from "@/lib/meetings/store";
import { BUILTIN_PROGRAMS, LIST_SCOPE, programById } from "@/lib/meetings/programs";
import { t } from "@/lib/meetings/i18n";
import { KNOWN_QIDS, fetchDossier, shownProgram } from "@/lib/meetings/dossier";

export const Route = createFileRoute("/program/$id")({
  component: ProgramPage,
});

function ProgramPage() {
  const { id } = Route.useParams();
  const locale = useMeetingStore((s) => s.locale);
  const custom = useMeetingStore((s) => s.programs);
  const groups = useMeetingStore((s) => s.groups);
  const customMeetings = useMeetingStore((s) => s.custom);
  const hiddenIds = useMeetingStore((s) => s.hiddenIds);
  const showCatalog = useMeetingStore((s) => s.showCatalog);
  const catalogReady = useMeetingStore((s) => s.catalogReady);
  const hydrate = useMeetingStore((s) => s.hydrate);
  const dossier = useMeetingStore((s) => s.dossiers[id]);
  const programOn = useMeetingStore((s) => s.favoriteProgramIds.includes(id));
  const favoriteGroups = useMeetingStore((s) => s.favoriteGroupIds);
  const toggleProgram = useMeetingStore((s) => s.toggleFavoriteProgram);
  const toggleGroup = useMeetingStore((s) => s.toggleFavoriteGroup);
  const setDossier = useMeetingStore((s) => s.setDossier);
  const label = (key: string) => t(locale, key);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  const program = programById([...custom, ...BUILTIN_PROGRAMS], id);
  const listed = useMemo(() => {
    if (!program) return 0;
    const catalog = showCatalog ? catalogMeetings().filter((meeting) => !hiddenIds.includes(meeting.id)) : [];
    return [...catalog, ...customMeetings].filter((meeting) => (meeting.programId || "aca") === program.id).length;
  }, [catalogReady, customMeetings, hiddenIds, program, showCatalog]);
  const [busy, setBusy] = useState(false);

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

  if (!program) {
    return (
      <div className="min-h-dvh bg-[var(--color-bg)] px-4 py-6 text-[var(--color-fg)]">
        <Link to="/" className="text-sm text-[var(--color-gold)]">
          {label("back")}
        </Link>
        <p className="mt-6">{label("updateMiss")}</p>
      </div>
    );
  }

  const shown = shownProgram(program, locale, dossier);
  const names = Object.entries(dossier?.labels || {}).filter(([lang]) => lang !== "en");
  const related = groups.filter((group) => group.programId === program.id);

  return (
    <div className="min-h-dvh bg-[var(--color-bg)] text-[var(--color-fg)]">
      <header className="site-header sticky top-0 z-20 flex items-center justify-between px-2 py-1">
        <Link to="/" className="flex h-11 items-center gap-1 px-2 font-semibold text-[#f6e7c1]">
          <ArrowLeft className="size-5" /> {label("back")}
        </Link>
        <h1 className="wordmark text-base" style={{ letterSpacing: "0.12em" }}>
          {shown.short}
        </h1>
        <span className="w-16" />
      </header>
      <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
        <section className="border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <p className="text-xs tracking-[0.16em] text-[var(--color-gold)] uppercase">{shown.short}</p>
          <h2 className="mt-1 font-display text-3xl leading-tight">{shown.name}</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-fg-2)]">
            {listed} {label("inThisList")}.{LIST_SCOPE[program.id] ? ` ${LIST_SCOPE[program.id]}` : ""}
          </p>
          {program.note ? <p className="mt-3 text-sm leading-relaxed text-[var(--color-fg-2)]">{program.note}</p> : null}
          {dossier?.description ? <p className="mt-3 text-sm leading-relaxed">{dossier.description}</p> : null}
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-fg-3)]">{label("aboutMeetings")}</p>
          <div className="mt-3 flex flex-col gap-1 text-sm">
            {dossier?.website ? (
              <a className="text-[var(--color-gold)] underline" href={dossier.website} target="_blank" rel="noreferrer">
                {label("officialSite")}
              </a>
            ) : null}
            {dossier?.wikipedia ? (
              <a className="text-[var(--color-gold)] underline" href={dossier.wikipedia} target="_blank" rel="noreferrer">
                {label("wikipedia")}
              </a>
            ) : null}
          </div>
          {names.length ? (
            <div className="mt-4">
              <h3 className="text-xs font-semibold tracking-[0.16em] text-[var(--color-gold)] uppercase">{label("otherNames")}</h3>
              <ul className="mt-2 text-sm">
                {names.map(([lang, name]) => (
                  <li key={lang}>
                    <b className="mr-2 uppercase">{lang}</b>
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="mt-3 text-xs text-[var(--color-fg-3)]">
            {dossier
              ? `${label("updated")} · ${new Date(dossier.fetchedAt).toLocaleString()}${dossier.qid ? ` · ${dossier.qid}` : ""}`
              : label("neverFetched")}
          </p>
          <button type="button" className="btn-secondary mt-4 h-11 px-4" onClick={() => toggleProgram(program.id)}>
            <Star className="size-4" fill={programOn ? "currentColor" : "none"} />
            {programOn ? label("favorited") : label("favorite")}
          </button>
          <p className="mt-2 text-xs text-[var(--color-fg-3)]">{label("favoriteHint")}</p>
          <button type="button" className="btn-primary mt-4 ml-2 h-11 px-4" disabled={busy} onClick={update}>
            {busy ? label("updating") : label("updatePage")}
          </button>
        </section>
        {related.length ? (
          <section className="border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <h3 className="text-xs font-semibold tracking-[0.16em] text-[var(--color-gold)] uppercase">{label("yours")}</h3>
            <ul className="mt-2 text-sm">
              {related.map((group) => (
                <li key={group.id} className="flex items-center justify-between gap-3 py-1">
                  <span>
                    {group.name}
                    {group.joinUrl ? (
                      <>
                        {" · "}
                        <a className="text-[var(--color-gold)] underline" href={group.joinUrl} target="_blank" rel="noreferrer">
                          {group.platform}
                        </a>
                      </>
                    ) : null}
                  </span>
                  <button type="button" className="text-[var(--color-gold)]" aria-pressed={favoriteGroups.includes(group.id)} onClick={() => toggleGroup(group.id)}>
                    <Star className="size-4" fill={favoriteGroups.includes(group.id) ? "currentColor" : "none"} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </div>
  );
}
