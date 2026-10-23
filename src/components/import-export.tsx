import { useState } from "react";
import { X, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import { useMeetingStore } from "@/lib/meetings/store";
import {
  downloadBlob,
  downloadBytes,
  meetingsToCsv,
  parseMeetingsCsv,
  parseMeetingsWorkbook,
  stampFilename,
  buildXlsxBytes,
} from "@/lib/meetings/io";

export function ImportExport() {
  const open = useMeetingStore((s) => s.importOpen);
  const setImportOpen = useMeetingStore((s) => s.setImportOpen);
  const importCustom = useMeetingStore((s) => s.importCustom);
  const custom = useMeetingStore((s) => s.custom);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [pending, setPending] = useState<ReturnType<typeof parseMeetingsCsv> | null>(null);

  if (!open) return null;

  async function onFile(file: File) {
    const name = file.name.toLowerCase();
    try {
      let meetings;
      if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
        const buf = await file.arrayBuffer();
        meetings = parseMeetingsWorkbook(buf);
      } else {
        const text = await file.text();
        meetings = parseMeetingsCsv(text);
      }
      if (meetings.length === 0) {
        toast("No valid rows found — need Name, Weekday, and Time");
        setPending(null);
        setPreviewCount(0);
        return;
      }
      setPending(meetings);
      setPreviewCount(meetings.length);
    } catch {
      toast("Could not read that file");
    }
  }

  function apply() {
    if (!pending?.length) {
      toast("Choose a CSV or Excel file first");
      return;
    }
    const n = importCustom(pending, mode);
    toast(`Imported ${n} meeting${n === 1 ? "" : "s"}`);
    setPending(null);
    setPreviewCount(null);
  }

  function downloadTemplate(kind: "csv" | "xlsx") {
    const sample = useMeetingStore.getState().custom.slice(0, 3);
    const rows = sample.length
      ? sample
      : [
          {
            id: "sample",
            name: "Sunday Homegroup",
            weekday: 7,
            hour: 19,
            minute: 0,
            zone: "America/New_York",
            durationMinutes: 60,
            platform: "zoom" as const,
            meetingId: "123 4567 8901",
            password: "serenity",
            joinUrl: "",
            notes: "Example row — replace with your meetings",
            contactInfo: "",
            gender: "ALL" as const,
            programId: "aca",
            groupId: "",
            language: "English",
            location: "",
            source: "custom" as const,
          },
        ];
    if (kind === "csv") {
      downloadBlob(stampFilename("nextmeeting-template", "csv"), new Blob([meetingsToCsv(rows)], { type: "text/csv" }));
    } else {
      downloadBytes(
        stampFilename("nextmeeting-template", "xlsx"),
        buildXlsxBytes(rows),
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <button type="button" className="sheet-backdrop absolute inset-0" aria-label="Close import" onClick={() => setImportOpen(false)} />
      <div className="relative z-10 w-full max-w-[500px] rounded-t-xl bg-[var(--color-card)] p-5 shadow-2xl md:rounded-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Import & export</h2>
          <button type="button" className="rounded-lg bg-[var(--color-bg)] p-2" onClick={() => setImportOpen(false)}>
            <X className="size-5" />
          </button>
        </div>
        <p className="text-sm leading-relaxed text-[var(--color-fg-3)]">
          Spreadsheets need columns for <b className="text-[var(--color-fg)]">Name</b>,{" "}
          <b className="text-[var(--color-fg)]">Weekday</b>, and <b className="text-[var(--color-fg)]">Time</b>. Meeting ID and
          Password become a one-click Zoom link.
        </p>

        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--color-primary)]/40 bg-[var(--color-bg)] px-4 py-8 text-center">
          <FileSpreadsheet className="mb-2 size-8 text-[var(--color-primary)]" />
          <span className="font-semibold">Drop CSV or Excel</span>
          <span className="mt-1 text-xs text-[var(--color-fg-3)]">.csv, .xlsx, .xls</span>
          <input
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onFile(file);
            }}
          />
        </label>

        {previewCount != null ? (
          <p className="mt-3 text-sm">
            Ready to import <b>{previewCount}</b> meeting{previewCount === 1 ? "" : "s"}. You currently have {custom.length} of
            your own.
          </p>
        ) : null}

        <fieldset className="mt-4 flex flex-col gap-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name="mode" checked={mode === "merge"} onChange={() => setMode("merge")} />
            Merge with my meetings (skip duplicates)
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="mode" checked={mode === "replace"} onChange={() => setMode("replace")} />
            Replace my meetings
          </label>
        </fieldset>

        <button type="button" className="btn-primary mt-5 h-12 w-full" onClick={apply}>
          Import
        </button>

        <div className="mt-4 flex gap-2">
          <button type="button" className="btn-secondary h-10 flex-1 text-sm" onClick={() => downloadTemplate("csv")}>
            <FileText className="size-4" /> Template CSV
          </button>
          <button type="button" className="btn-secondary h-10 flex-1 text-sm" onClick={() => downloadTemplate("xlsx")}>
            <FileSpreadsheet className="size-4" /> Template Excel
          </button>
        </div>
      </div>
    </div>
  );
}
