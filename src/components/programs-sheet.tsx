import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useMeetingStore } from "@/lib/meetings/store";
import { PLATFORMS } from "@/lib/meetings/platforms";
import type { Platform } from "@/lib/meetings/types";
import { BUILTIN_PROGRAMS, PROGRAM_SECTIONS, localizedProgram } from "@/lib/meetings/programs";
import { t } from "@/lib/meetings/i18n";
import { requestNotify } from "@/lib/meetings/alerts";
import { KNOWN_QIDS, fetchDossier } from "@/lib/meetings/dossier";

export function ProgramsSheet() {
  const open = useMeetingStore((s) => s.listsOpen);
  const setOpen = useMeetingStore((s) => s.setListsOpen);
  const customPrograms = useMeetingStore((s) => s.programs);
  const groups = useMeetingStore((s) => s.groups);
  const all = useMemo(() => [...BUILTIN_PROGRAMS, ...customPrograms], [customPrograms]);
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
  const label = (key: string) => t(locale, key);

  const [short, setShort] = useState("");
  const [name, setName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupProgram, setGroupProgram] = useState("aa");
  const [groupPlatform, setGroupPlatform] = useState<Platform>("whatsapp");
  const [groupLink, setGroupLink] = useState("");
  const [programQuery, setProgramQuery] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <button type="button" className="sheet-backdrop absolute inset-0" aria-label="Close lists" onClick={() => setOpen(false)} />
      <div className="relative z-10 flex max-h-[92dvh] w-full flex-col overflow-y-auto rounded-t-xl bg-[var(--color-card)] shadow-2xl md:w-[520px] md:rounded-xl">
        <div className="deco-rule sticky top-0 z-2 flex items-center justify-between bg-[var(--color-card)] px-4 py-3">
          <h2 className="font-display text-2xl tracking-wide">{label("programsGroups")}</h2>
          <button type="button" className="rounded-sm bg-[var(--color-bg)] p-2" onClick={() => setOpen(false)} aria-label="Close">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex flex-col gap-6 px-4 py-4">
          <section>
            <h3 className="text-xs font-semibold tracking-[0.16em] text-[var(--color-gold)] uppercase">Reminders</h3>
            <p className="mt-1 text-sm text-[var(--color-fg-3)]">{label("systemAlerts")}</p>
            <label className="mt-2 block text-xs font-semibold tracking-wide uppercase">
              How early
              <select className="field mt-1" value={lead} onChange={(e) => setLead(Number(e.target.value))}>
                {[5, 10, 15, 30, 60].map((n) => (
                  <option key={n} value={n}>
                    {n} minutes
                  </option>
                ))}
              </select>
            </label>
            <p className="mt-1 text-xs text-[var(--color-fg-3)]">
              {alertsEnabled ? "Reminders are on for marked meetings." : "Turn on a bell to allow notifications."}
            </p>
            <button
              type="button"
              aria-pressed={alertFavorites}
              className={`mt-3 px-3 py-2 text-left text-sm ${alertFavorites ? "border border-[var(--color-gold)]" : "border border-[var(--color-border)]"}`}
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

          <section>
            <h3 className="text-xs font-semibold tracking-[0.16em] text-[var(--color-gold)] uppercase">Programs</h3>
            <input
              value={programQuery}
              onChange={(e) => setProgramQuery(e.target.value)}
              placeholder="Find a program"
              className="field mt-2 w-full"
            />
            <div className="mt-2 flex flex-col gap-2">
              {PROGRAM_SECTIONS.map((section) => {
                const q = programQuery.trim().toLowerCase();
                const items = BUILTIN_PROGRAMS.filter((p) => {
                  const shown = localizedProgram(p, locale);
                  return (
                    p.section === section &&
                    (!q || `${shown.short} ${shown.name} ${p.short} ${p.name} ${p.note ?? ""}`.toLowerCase().includes(q))
                  );
                });
                if (!items.length) return null;
                return (
                  <details key={section} open={Boolean(q) || section === "A–C"} className="border border-[var(--color-border)] px-3 py-2">
                    <summary className="cursor-pointer text-sm font-semibold tracking-wide">{section}</summary>
                    <ul className="mt-2 divide-y divide-[var(--color-border)]">
                      {items.map((p) => {
                        const shown = localizedProgram(p, locale);
                        return (
                        <li key={p.id}>
                          <Link
                            to="/program/$id"
                            params={{ id: p.id }}
                            className="block py-1.5 text-sm"
                            onClick={() => setOpen(false)}
                          >
                            <b className="mr-2 tracking-wide">{shown.short}</b>
                            <span className="text-[var(--color-fg-3)]">{shown.name}</span>
                            {p.note ? <span className="mt-0.5 block text-xs text-[var(--color-fg-3)]">{p.note}</span> : null}
                          </Link>
                        </li>
                        );
                      })}
                    </ul>
                  </details>
                );
              })}
            </div>
            {customPrograms.length ? (
              <ul className="mt-3 divide-y divide-[var(--color-border)]">
                {customPrograms.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-1.5 text-sm">
                    <Link to="/program/$id" params={{ id: p.id }} className="min-w-0" onClick={() => setOpen(false)}>
                      <b className="mr-2 tracking-wide">{p.short}</b>
                      <span className="text-[var(--color-fg-3)]">{p.name}</span>
                    </Link>
                    <button type="button" className="text-xs tracking-wide text-[var(--color-primary)] uppercase" onClick={() => deleteProgram(p.id)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <form
              className="mt-3 grid grid-cols-[88px_1fr_auto] gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const id = addProgram(short, name);
                if (!id) {
                  toast("Give the program a short name");
                  return;
                }
                const added = { id, name: name.trim(), short: short.trim() };
                setShort("");
                setName("");
                toast("Program added");
                if (typeof navigator !== "undefined" && navigator.onLine !== false) {
                  void fetchDossier(added, KNOWN_QIDS[id] || "")
                    .then((dossier) => {
                      if (dossier) setDossier(dossier);
                    })
                    .catch(() => undefined);
                }
              }}
            >
              <input className="field" value={short} onChange={(e) => setShort(e.target.value)} placeholder="OA" aria-label="Short name" />
              <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" aria-label="Program name" />
              <button type="submit" className="btn-primary h-11 px-3 text-xs">
                Add
              </button>
            </form>
          </section>

          <section>
            <h3 className="text-xs font-semibold tracking-[0.16em] text-[var(--color-gold)] uppercase">Groups</h3>
            <p className="mt-1 text-sm text-[var(--color-fg-3)]">
              A group can be a chat, a homegroup, or a place. It does not need a weekly time.
            </p>
            <ul className="mt-2 flex flex-col gap-2">
              {groups.length === 0 ? <li className="text-sm text-[var(--color-fg-3)]">No groups yet.</li> : null}
              {groups.map((g) => {
                const program = all.find((p) => p.id === g.programId);
                return (
                  <li key={g.id} className="flex items-start justify-between gap-3 border border-[var(--color-border)] px-3 py-2">
                    <div>
                      <Link to="/program/$id" params={{ id: g.programId }} className="text-sm" onClick={() => setOpen(false)}>
                        {g.name}
                      </Link>
                      <div className="text-xs tracking-wide text-[var(--color-fg-3)] uppercase">
                        {program?.short ?? g.programId}
                        {g.joinUrl ? ` · ${g.platform}` : ""}
                      </div>
                    </div>
                    <button type="button" className="text-xs tracking-wide text-[var(--color-primary)] uppercase" onClick={() => deleteGroup(g.id)}>
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
            <form
              className="mt-3 flex flex-col gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const id = addGroup({
                  name: groupName,
                  programId: groupProgram,
                  notes: "",
                  contactInfo: "",
                  platform: groupPlatform,
                  joinUrl: groupLink,
                });
                if (!id) {
                  toast("Give the group a name");
                  return;
                }
                setGroupName("");
                setGroupLink("");
                toast("Group added");
              }}
            >
              <input className="field" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Group name" aria-label="Group name" />
              <div className="grid grid-cols-2 gap-2">
                <select className="field" value={groupProgram} onChange={(e) => setGroupProgram(e.target.value)} aria-label="Program">
                  {all.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.short}
                    </option>
                  ))}
                </select>
                <select className="field" value={groupPlatform} onChange={(e) => setGroupPlatform(e.target.value as Platform)} aria-label="Platform">
                  {PLATFORMS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <input className="field" value={groupLink} onChange={(e) => setGroupLink(e.target.value)} placeholder="Link, optional" aria-label="Group link" />
              <button type="submit" className="btn-secondary h-11 px-3 text-sm">
                Add group
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
