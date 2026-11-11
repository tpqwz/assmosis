#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { build } from "vite";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "surge");
const base = process.env.PAGES_BASE || "/";
const prefix = base.endsWith("/") ? base : `${base}/`;

const rustc = spawnSync(
  "rustc",
  [
    "--edition",
    "2021",
    "--target",
    "wasm32-unknown-unknown",
    "-C",
    "opt-level=z",
    "-C",
    "lto",
    "-C",
    "panic=abort",
    "--crate-type",
    "cdylib",
    join(root, "src/shell/shell.rs"),
    "-o",
    join(root, "public/shell.wasm"),
  ],
  { stdio: "inherit" },
);
if (rustc.status !== 0) process.exit(rustc.status ?? 1);

await build({
  configFile: false,
  root,
  base: prefix,
  publicDir: "public",
  resolve: { tsconfigPaths: true },
  plugins: [tailwindcss()],
  build: {
    outDir,
    emptyOutDir: true,
    rollupOptions: {
      input: { index: join(root, "src/shell/loader.html") },
      treeshake: {
        // The app package marks every file side-effect free. The shell's
        // mount call, route registration, and the install listener are not.
        moduleSideEffects(id) {
          return id.includes("/src/") || id.includes(".css") || id.includes("fontsource");
        },
      },
    },
  },
});

function absolutize(html) {
  return html
    .replaceAll('href="./assets/', `href="${prefix}assets/`)
    .replaceAll('src="./assets/', `src="${prefix}assets/`)
    .replaceAll('href="assets/', `href="${prefix}assets/`)
    .replaceAll('src="assets/', `src="${prefix}assets/`);
}

function findBuiltHtml(dir) {
  const found = [];
  const walk = (current) => {
    for (const name of readdirSync(current)) {
      const path = join(current, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (name.endsWith(".html")) found.push(path);
    }
  };
  walk(dir);
  const shell = found.find((path) => readFileSync(path, "utf8").includes('data-shell="wasm"'));
  if (!shell) {
    console.error("built shell html not found");
    process.exit(1);
  }
  return shell;
}

const builtPath = findBuiltHtml(outDir);
let html = absolutize(readFileSync(builtPath, "utf8"));
if (!html.includes(`src="${prefix}assets/`) && !html.includes(`href="${prefix}assets/`)) {
  console.error("built html has no absolute /assets/ urls");
  process.exit(1);
}
const assetDir = join(outDir, "assets");
const loadsWasm = readdirSync(assetDir).some((name) => {
  if (!name.endsWith(".js")) return false;
  return readFileSync(join(assetDir, name), "utf8").includes("shell.wasm");
});
if (!loadsWasm) {
  console.error("shell bundle does not load /shell.wasm");
  process.exit(1);
}
writeFileSync(join(outDir, "index.html"), html);
writeFileSync(join(outDir, "settings.html"), html);
writeFileSync(join(outDir, "weekly.html"), html);
writeFileSync(join(outDir, "200.html"), html);
writeFileSync(join(outDir, "404.html"), html);

const programs = readFileSync(join(root, "src/lib/meetings/programs.ts"), "utf8");
const ids = [...programs.matchAll(/row\(\s*[^,\n]+,\s*"([^"]+)"/g)].map((match) => match[1]);
if (ids.length !== 156 || new Set(ids).size !== ids.length) {
  console.error(`expected 156 program ids, found ${ids.length}`);
  process.exit(1);
}
mkdirSync(join(outDir, "program"), { recursive: true });
for (const id of ids) writeFileSync(join(outDir, "program", `${id}.html`), html);
if (builtPath !== join(outDir, "index.html")) rmSync(join(outDir, "src"), { recursive: true, force: true });

console.log(`surge export ok (${ids.length} programs)`);
