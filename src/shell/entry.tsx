import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "../router";

export function mountApp() {
  const existing = document.getElementById("app");
  const mount = existing ?? document.createElement("main");
  if (!existing) {
    mount.id = "app";
    document.body.appendChild(mount);
  }
  createRoot(mount).render(<RouterProvider router={getRouter()} />);
}
