# Spartan 2027

Personal training app for the Spartan Super at Snowbasin, Sunday 22 August 2027.
An offline-first PWA on GitHub Pages: open it on the phone, Add to Home Screen.

Plain HTML/JS, no build.

| File | What it is |
|---|---|
| `plan.js` | The 43-week plan as data: phases, weeks, sessions, exercises with coaching cards, climb options, mobility, benchmarks, fuel, gear |
| `figure.js` | Side-view stick-figure renderer with two-link IK, used for every exercise animation |
| `moves.js` | Keyframes for each exercise animation |
| `store.js` | The training log: localStorage first, synced to a BlueStep endpoint when a key is set |
| `app.js` | The app: Today, Week, Reps, Progress, Plan, plus the session, interval and mobility runners |
| `sw.js` | Offline cache. **Bump `CACHE_VERSION` on every change** or phones keep the old copy |

Deploy = commit and push to `main`.

## Data

Every record is an entry `{ id, kind, date, updatedAt, ... }` with kind `session`, `gtg` (a day's reps),
`mobility`, `bench`, `activity` or `gear`. Deletes are tombstones. The BlueStep endpoint
`/b/spartandata` (org U141648, beh.bluestep.net) stores them; it needs a key, entered once in
Plan → Settings (or opened once as `…/spartan-2027/#k=<key>`) and never committed here.

The helmet icon is an original drawing, not the Spartan Race logo.
