import "../styles.css";

type ShellExports = {
  memory: WebAssembly.Memory;
  set_path_byte: (index: number, byte: number) => void;
  set_path_len: (length: number) => void;
  render: () => number;
  html_ptr: () => number;
  html_len: () => number;
};

const PATH_MAX = 256;

async function paintFromWasm(pathname: string) {
  const response = await fetch("/shell.wasm");
  if (!response.ok) throw new Error("shell missing");
  const bytes = await response.arrayBuffer();
  const { instance } = await WebAssembly.instantiate(bytes, {});
  const shell = instance.exports as unknown as ShellExports;
  const encoded = new TextEncoder().encode(pathname);
  const length = Math.min(encoded.length, PATH_MAX);
  for (let i = 0; i < length; i++) shell.set_path_byte(i, encoded[i] ?? 0);
  shell.set_path_len(length);
  const rendered = shell.render();
  const size = rendered > 0 ? rendered : shell.html_len();
  if (size <= 0) return;
  const html = new TextDecoder().decode(new Uint8Array(shell.memory.buffer, shell.html_ptr(), size));
  const split = html.indexOf("\n");
  if (split < 0) return;
  const title = html.slice(0, split);
  const body = html.slice(split + 1);
  if (title) document.title = title;
  if (body.includes('id="app"')) document.body.innerHTML = body;
}

async function boot() {
  try {
    await paintFromWasm(location.pathname);
  } catch (err) {
    console.error(err);
  }
  const { mountApp } = await import("./entry");
  mountApp();
}

void boot();
