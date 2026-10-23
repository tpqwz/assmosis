import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { Toaster } from "sonner";
import { ImportExport } from "@/components/import-export";
import appCss from "../styles.css?url";

const APP_NAME = "Assmosis";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      { name: "apple-mobile-web-app-title", content: APP_NAME },
      { name: "application-name", content: APP_NAME },
      { name: "description", content: "Meetings and groups across twelve-step programs. One-tap rooms, your own list, and reminders before the ones you mark." },
      { name: "theme-color", content: "#1C140E" },
    ],
    links: [
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-512.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "alternate", href: "/__grok/manifest.webmanifest" },
    ],
  }),
  component: () => (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("nextmeeting-theme");if(t==="dark"){document.documentElement.classList.add("dark","theme-dark");document.documentElement.style.colorScheme="dark"}var f=localStorage.getItem("nextmeeting-type");if(f){var p=JSON.parse(f);var ok={ledger:1,sans:1,plex:1,argon:1,neon:1,xenon:1,radon:1,atkinson:1};if(ok[p.font])document.documentElement.dataset.font=p.font;if(p.size==="s"||p.size==="l"||p.size==="xl")document.documentElement.dataset.size=p.size}}catch(e){}`,
          }}
        />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
          <ImportExport />
          <Toaster
            position="bottom-center"
            toastOptions={{
              className: "font-sans!",
              style: {
                background: "var(--color-fg-2)",
                color: "white",
                border: "none",
                borderRadius: "50px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                fontSize: "12px",
                fontWeight: 700,
              },
            }}
          />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
