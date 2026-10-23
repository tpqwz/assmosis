# Assmosis

Local-first meeting list. Installed name is **Assmosis**, not "Grok App".

## Installer icon (do not regress)

The home-screen installer reads one file and ignores the others:

- `public/__grok/icon-180.png` is the folding-chair icon. Keep that picture in that file.
- The web manifest's **first** icon `src` must stay `/__grok/icon-180.png`.
- `<link rel="apple-touch-icon">` must stay `href="/__grok/icon-180.png"`.

`/icon-192.png`, `/icon-512.png`, and `/apple-touch-icon.png` are extras. If the manifest or the apple-touch link points at those instead, the installer drops them and shows the default Grok icon. Do not "fix" the icon by moving it off `/__grok/icon-180.png`.

A phone that already installed the app keeps the old icon until that home-screen shortcut is removed and the app is added again.

## Meeting notes

When a meeting listing is imported, keep the fellowship's own words. `notes` gets the description, the format, and any instruction such as "email this person for the passcode." `contactInfo` gets the address, phone, or name they published for that meeting. Do not replace either with a generic label like "AA online." A site-wide webmaster address is not the group's contact.
