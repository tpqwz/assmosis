# Assmosis

Local-first meeting finder for twelve-step and related fellowships. **0.1.0-alpha.0.**

Your list stays on this device. There is no account and no cloud sync. A shipped catalog loads from this site, and meetings you add or import are stored in the browser (SQLite in IndexedDB, with a JSON copy). The newest save wins.

Assmosis is not affiliated with any fellowship, and it is not NextMeeting.

## What it does

- Browse meetings by day, program, format, language, and open or closed.
- Join in one click. Video rooms that publish a real passcode copy it; Zoom tokens that are already in the link are not treated as a passcode.
- Add, edit, hide, and delete meetings.
- Import and export CSV or Excel from Settings. Import merges; it does not wipe the catalog.
- Printable week.
- Installable as Assmosis. The icon is a folding chair.
- A static copy for a host that only serves files (`npm run export:surge` writes `./surge`). Publish that folder, with `index.html` at the top. `public/` is not a site by itself.

Weekdays are Monday = 1 through Sunday = 7.

## Inspiration

The starting point was this public page, not a repository checkout:

<https://nextmeeting.org/0BF67B1D-444F-45F5-BA5B-E3ADD7E4C30B.html>

That is NextMeeting's ACA list: a week of meetings, "Times in" the viewer's zone, Add a Meeting, Send Feedback, Printable Weekly List. Assmosis took that product shape. It did not take that page's code. Calling it a template is the wrong word if "template" means files that were copied and renamed. Nothing from that page is in this tree.

The Github link printed on the page (`DanielGuru/nextmeeting`) does not resolve. The project that does exist is [NextMeeting/next-meeting-static-site](https://github.com/NextMeeting/next-meeting-static-site). It has no license file. Its code is not included here, and this MIT license does not apply to it.

What *was* carried over is a handful of names, left alone so a browser that already stored data under them would still open:

| Where | What |
| --- | --- |
| `src/lib/meetings/store.ts` | `nextmeeting-aca-v1`, `nextmeeting-theme` |
| `src/lib/meetings/typeface.ts` | `nextmeeting-type` |
| `src/lib/meetings/idb.ts` | IndexedDB name `nextmeeting` |
| `src/components/import-export.tsx` | export filenames `nextmeeting-template` |
| `src/components/session-details.tsx` | calendar id `@nextmeeting`, prodid `TheRooms` |

See [NOTICE](NOTICE) for the full attribution. Renaming the storage keys would orphan saved meetings. The menu used to include Send Feedback, which mailed `feedback@nextmeeting.app`. That item is gone.

## License

[MIT](LICENSE) for Assmosis's own code. Copyright 2026 tpqwz.

Vendored cJSON keeps its own MIT notice in `tools/vendor/`. Packages in `package.json` keep theirs. Fellowship listings in the catalog are facts those groups published, not Assmosis copyright.

## Develop

```sh
npm install
npm run dev
npm run typecheck
npm test
npm run build
npm run export:surge
```

`export:surge` needs a Rust toolchain with the `wasm32-unknown-unknown` target. It compiles `src/shell/shell.rs` to `public/shell.wasm`, then writes the static site into `surge/`. That directory is build output. It is not part of this repository.

Meeting lists can be refreshed with `npm run meetings:fetch` (`tools/assmosis-lists`). That does not rewrite `public/catalog/meetings.json` unless you ask it to.

## Data

The catalog is a fetched file, `public/catalog/meetings.json`, not rows in the app database. Teen groups are not included. This is not a dump of every in-person AA, NA, or OA meeting in the world.
