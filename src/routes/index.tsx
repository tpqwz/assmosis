import { useEffect, useLayoutEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMeetingStore } from "@/lib/meetings/store";
import { registerOfflineShell } from "@/lib/meetings/idb";
import { AppHeader } from "@/components/app-header";
import { ActionBar } from "@/components/action-bar";
import { SessionList } from "@/components/session-list";
import { SessionDetails } from "@/components/session-details";
import { MeetingForm } from "@/components/meeting-form";
import { ProgramsSheet } from "@/components/programs-sheet";
import { AlertWatcher } from "@/components/alert-watcher";
import { InstallNotice } from "@/components/install-notice";
import "@/lib/pwa";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const hydrate = useMeetingStore((s) => s.hydrate);
  const barPlace = useMeetingStore((s) => s.barPlace);
  const docked = barPlace === "bottom";
  const hydrated = useMeetingStore((s) => s.hydrated);
  const tick = useMeetingStore((s) => s.tick);

  useLayoutEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    registerOfflineShell();
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, [tick]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
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

  return (
    <div
      className={`min-h-dvh bg-[var(--color-bg)] text-[var(--color-fg)] ${
        docked ? "pb-[calc(9.5rem+env(safe-area-inset-bottom))]" : ""
      }`}
    >
      {docked ? (
        <>
          <AppHeader />
          <ActionBar />
        </>
      ) : (
        <div className="sticky top-0 z-30">
          <AppHeader embedded />
          <ActionBar />
        </div>
      )}
      {hydrated ? (
        <SessionList />
      ) : (
        <div className="mx-auto flex max-w-[470px] flex-col gap-3 px-4 py-6">
          <div className="session-card h-20 animate-pulse" />
          <div className="session-card h-20 animate-pulse" />
          <div className="session-card h-20 animate-pulse" />
        </div>
      )}
      <SessionDetails />
      <MeetingForm />
      <ProgramsSheet />
      <AlertWatcher />
      <InstallNotice />
    </div>
  );
}
