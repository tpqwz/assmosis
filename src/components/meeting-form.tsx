import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { X, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { useMeetingStore } from "@/lib/meetings/store";
import { TIMEZONES, WEEKDAYS, emptyDraft, type MeetingDraft, type Platform, type Gender } from "@/lib/meetings/types";
import { viewerZone } from "@/lib/meetings/schedule";
import { parseZoomInvite } from "@/lib/meetings/zoom";
import { PLATFORMS, buildJoinUrl, roomField } from "@/lib/meetings/platforms";
import { BUILTIN_PROGRAMS, localizedProgram } from "@/lib/meetings/programs";
import { TAGS, TAG_KEYS, type MeetingTag } from "@/lib/meetings/tags";
import { t } from "@/lib/meetings/i18n";

export function MeetingForm() {
  const formOpen = useMeetingStore((s) => s.formOpen);
  const editingId = useMeetingStore((s) => s.editingId);
  const closeForm = useMeetingStore((s) => s.closeForm);
  const upsertCustom = useMeetingStore((s) => s.upsertCustom);
  const existing = useMeetingStore((s) => (editingId ? s.getMeeting(editingId) : undefined));
  const customPrograms = useMeetingStore((s) => s.programs);
  const locale = useMeetingStore((s) => s.locale);
  const groups = useMeetingStore((s) => s.groups);

  const [draft, setDraft] = useState<MeetingDraft>(emptyDraft());
  const [invite, setInvite] = useState("");

  useEffect(() => {
    if (!formOpen) return;
    const zone = viewerZone();
    if (existing && existing.source === "custom") {
      setDraft({ ...existing });
    } else {
      const now = new Date();
      setDraft({
        ...emptyDraft(zone),
        weekday: ((now.getDay() + 6) % 7) + 1,
        hour: now.getHours(),
        minute: 0,
      });
    }
    setInvite("");
  }, [formOpen, existing]);

  const programs = useMemo(() => [...BUILTIN_PROGRAMS, ...customPrograms], [customPrograms]);
  const preview = useMemo(() => buildJoinUrl(draft), [draft]);
  const room = roomField(draft.platform);
  const programGroups = groups.filter((g) => g.programId === draft.programId);

  if (!formOpen) return null;

  function patch(p: Partial<MeetingDraft>) {
    setDraft((d) => ({ ...d, ...p }));
  }

  function applyInvite() {
    const parsed = parseZoomInvite(invite);
    if (!parsed.meetingId && !parsed.joinUrl && !parsed.password) {
      toast("Couldn't find a Zoom ID in that text");
      return;
    }
    setDraft((d) => ({ ...d, ...parsed }));
    toast("Zoom details filled in");
  }

  function save(e: FormEvent) {
    e.preventDefault();
    if (!draft.name.trim()) {
      toast("Give the meeting a name");
      return;
    }
    upsertCustom(draft);
    toast(editingId ? "Meeting updated" : "Meeting added");
  }

  const timeValue = `${String(draft.hour).padStart(2, "0")}:${String(draft.minute).padStart(2, "0")}`;
  const zoneList: string[] = (TIMEZONES as readonly string[]).includes(draft.zone)
    ? [...TIMEZONES]
    : [draft.zone, ...TIMEZONES];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <button type="button" className="sheet-backdrop absolute inset-0" aria-label="Close form" onClick={closeForm} />
      <form
        onSubmit={save}
        className="relative z-10 flex max-h-[94dvh] w-full flex-col overflow-y-auto rounded-t-xl bg-[var(--color-card)] shadow-2xl md:w-[540px] md:rounded-xl"
      >
        <div className="sticky top-0 z-2 flex items-center justify-between bg-[var(--color-card)] px-4 pt-3 pb-2">
          <h2 className="text-lg font-semibold">{editingId ? "Edit meeting" : "Add a meeting"}</h2>
          <button type="button" className="rounded-lg bg-[var(--color-bg)] p-2 text-[var(--color-primary)]" onClick={closeForm}>
            <X className="size-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3 px-4 pb-6">
          <label className="block text-xs font-semibold tracking-wide text-[var(--color-fg-2)] uppercase">
            Paste a Zoom invite
            <textarea
              value={invite}
              onChange={(e) => setInvite(e.target.value)}
              rows={3}
              placeholder={"Join Zoom Meeting\nhttps://zoom.us/j/12345678901?pwd=secret\nMeeting ID: 123 4567 8901\nPasscode: hello"}
              className="field mt-1 min-h-[72px] resize-y font-normal normal-case tracking-normal"
            />
          </label>
          <button type="button" className="btn-secondary h-10 self-start px-3 text-sm" onClick={applyInvite}>
            <Wand2 className="size-4" /> Fill from invite
          </button>

          <Field label="Name">
            <input className="field" value={draft.name} onChange={(e) => patch({ name: e.target.value })} required />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Program">
              <select className="field" value={draft.programId} onChange={(e) => patch({ programId: e.target.value, groupId: "" })}>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {localizedProgram(p, locale).short} — {localizedProgram(p, locale).name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Group">
              <select className="field" value={draft.groupId} onChange={(e) => patch({ groupId: e.target.value })}>
                <option value="">None</option>
                {programGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Day">
              <select className="field" value={draft.weekday} onChange={(e) => patch({ weekday: Number(e.target.value) })}>
                {WEEKDAYS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.long}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Time">
              <input
                type="time"
                className="field"
                value={timeValue}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(":").map(Number);
                  patch({ hour: h ?? 0, minute: m ?? 0 });
                }}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Timezone">
              <select className="field" value={draft.zone} onChange={(e) => patch({ zone: e.target.value })}>
                {zoneList.map((z) => (
                  <option key={z} value={z}>
                    {z.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Duration (min)">
              <input
                type="number"
                min={15}
                max={240}
                step={5}
                className="field"
                value={draft.durationMinutes}
                onChange={(e) => patch({ durationMinutes: Number(e.target.value) || 60 })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Language">
              <input
                className="field"
                value={draft.language}
                onChange={(e) => patch({ language: e.target.value })}
                placeholder="English"
              />
            </Field>
            <Field label="Place">
              <input
                className="field"
                value={draft.location}
                onChange={(e) => patch({ location: e.target.value })}
                placeholder="City or region"
              />
            </Field>
          </div>

          <Field label="Platform">
            <select
              className="field"
              value={draft.platform}
              onChange={(e) => {
                const platform = e.target.value as Platform;
                patch({
                  platform,
                  tags: (draft.tags || []).filter((tag) => tagFits(tag as MeetingTag, platform)),
                });
              }}
            >
              {PLATFORMS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>

          <div className="flex flex-wrap gap-2">
            {TAGS.filter((id) => tagFits(id, draft.platform)).map((id) => {
              const on = (draft.tags || []).includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  className={`px-3 py-2 text-sm ${on ? "border border-[var(--color-gold)]" : "border border-[var(--color-border)]"}`}
                  onClick={() => {
                    const current = draft.tags || [];
                    const next = on ? current.filter((tag) => tag !== id) : [...current.filter((tag) => tag !== opposite(id)), id];
                    patch({ tags: next });
                  }}
                >
                  {t(locale, TAG_KEYS[id as MeetingTag])}
                </button>
              );
            })}
          </div>

          <Field label={room.label}>
            <input
              className="field"
              value={draft.meetingId}
              onChange={(e) => patch({ meetingId: e.target.value })}
              placeholder={room.placeholder}
              inputMode={draft.platform === "zoom" || draft.platform === "phone" ? "tel" : "text"}
            />
          </Field>

          <Field label={draft.platform === "phone" ? "Access code" : "Password / passcode"}>
            <input
              className="field"
              value={draft.password}
              onChange={(e) => patch({ password: e.target.value })}
              placeholder="optional"
            />
          </Field>

          <Field label="Join URL (optional — auto-built if blank)">
            <input
              className="field"
              value={draft.joinUrl}
              onChange={(e) => patch({ joinUrl: e.target.value })}
              placeholder="https://zoom.us/j/…"
            />
          </Field>

          {preview ? (
            <p className="rounded-lg bg-[var(--color-bg-3)] px-3 py-2 text-xs leading-relaxed break-all text-[var(--color-fg-2)]">
              One-click launch: {preview}
            </p>
          ) : (
            <p className="text-xs text-[var(--color-fg-3)]">Add a room, number, or link to build a one-tap launch.</p>
          )}

          <Field label="Who can attend">
            <select className="field" value={draft.gender} onChange={(e) => patch({ gender: e.target.value as Gender })}>
              <option value="ALL">Everyone</option>
              <option value="WOMEN_ONLY">Women</option>
              <option value="MEN_ONLY">Men</option>
            </select>
          </Field>

          <Field label="Notes">
            <textarea
              className="field min-h-[80px] resize-y"
              value={draft.notes}
              onChange={(e) => patch({ notes: e.target.value })}
            />
          </Field>

          <Field label="Contact">
            <input className="field" value={draft.contactInfo} onChange={(e) => patch({ contactInfo: e.target.value })} />
          </Field>

          <button type="submit" className="btn-primary mt-2 h-12 w-full text-base">
            {editingId ? "Save changes" : "Add meeting"}
          </button>
        </div>
      </form>
    </div>
  );
}

function tagFits(id: MeetingTag, platform: Platform) {
  if (id === "access" || id === "paused") return platform === "inperson";
  if (id === "hybrid") return platform !== "phone" && platform !== "email";
  return true;
}

function opposite(id: string) {
  if (id === "open") return "closed";
  if (id === "closed") return "open";
  return "";
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-xs font-semibold tracking-wide text-[var(--color-fg-2)] uppercase">
      {label}
      <div className="mt-1 font-normal normal-case tracking-normal">{children}</div>
    </label>
  );
}
