import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Printer, Sun, Moon, Library, Settings } from "lucide-react";
import { useMeetingStore } from "@/lib/meetings/store";

export function AppHeader({ embedded = false }: { embedded?: boolean }) {
  const navOpen = useMeetingStore((s) => s.navOpen);
  const setNavOpen = useMeetingStore((s) => s.setNavOpen);
  const theme = useMeetingStore((s) => s.theme);
  const toggleTheme = useMeetingStore((s) => s.toggleTheme);
  const openCreate = useMeetingStore((s) => s.openCreate);
  const setListsOpen = useMeetingStore((s) => s.setListsOpen);

  return (
    <>
      <header className={`site-header ${embedded ? "" : "sticky top-0 z-30"}`}>
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            aria-label="Navigation menu"
            aria-expanded={navOpen}
            className="flex h-11 w-12 items-center justify-center"
            onClick={() => setNavOpen(!navOpen)}
          >
            <span className={`hamburger relative block h-5 w-8 ${navOpen ? "open" : ""}`}>
              <span className="top" />
              <span className="middle" />
              <span className="bottom" />
            </span>
          </button>

          <Link to="/" className="flex items-center gap-2.5 py-2" onClick={() => setNavOpen(false)}>
            <img
              src="/icon-192.png"
              alt=""
              width={28}
              height={28}
              className="size-7 rounded-md"
            />
            <span className="flex flex-col items-center leading-none">
              <span className="wordmark" style={{ letterSpacing: "0.08em", fontSize: "20px" }}>
                Assmosis
              </span>
              <span className="mt-1 text-[9px] tracking-[0.28em] text-[var(--color-gold)] uppercase">
                Meetings & groups
              </span>
            </span>
          </Link>

          <button
            type="button"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="flex h-11 w-12 items-center justify-center text-[var(--color-gold)]"
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Moon className="size-5" /> : <Sun className="size-5" />}
          </button>
        </div>
      </header>

      {navOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/30"
          onClick={() => setNavOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed z-50 flex flex-col bg-[var(--color-card)] shadow-xl transition-[opacity,transform] duration-150 max-md:inset-x-0 max-md:top-12 max-md:bottom-0 md:left-4 md:top-11 md:max-w-80 md:overflow-hidden md:rounded-2xl ${
          navOpen
            ? "pointer-events-auto translate-x-0 opacity-100 md:translate-y-0"
            : "pointer-events-none -translate-x-16 opacity-0 md:translate-x-0 md:-translate-y-4"
        }`}
      >
        <nav className="flex flex-col">
          <Link to="/settings" onClick={() => setNavOpen(false)} className="block">
            <span className="flex w-full items-center justify-between px-4">
              <span className="flex w-full items-center justify-between border-b border-[var(--color-fg-3)]/30 px-2 py-4 text-[var(--color-fg)]">
                Settings
                <Settings className="size-5 text-[var(--color-primary)]" />
              </span>
            </span>
          </Link>
          <MenuItem
            icon={<Library className="size-5" />}
            label="Programs & groups"
            onClick={() => setListsOpen(true)}
          />
          <MenuItem
            icon={<Plus className="size-5" />}
            label="Add a Meeting"
            onClick={() => {
              openCreate();
              setNavOpen(false);
            }}
          />
          <Link to="/weekly" onClick={() => setNavOpen(false)} className="block">
            <span className="flex w-full items-center justify-between px-4">
              <span className="flex w-full items-center justify-between px-2 py-4 text-[var(--color-fg)]">
                Printable Weekly List
                <Printer className="size-5 text-[var(--color-primary)]" />
              </span>
            </span>
          </Link>
        </nav>
      </aside>
    </>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center justify-between px-4 text-left">
      <span className="flex w-full items-center justify-between border-b border-[var(--color-fg-3)]/30 px-2 py-4 text-[var(--color-fg)]">
        {label}
        <span className="text-[var(--color-primary)]">{icon}</span>
      </span>
    </button>
  );
}
