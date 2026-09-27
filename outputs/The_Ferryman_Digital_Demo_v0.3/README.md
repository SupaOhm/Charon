# The Ferryman v0.3: Apprentice Charon (browser prototype)

A turn-based browser prototype of the v0.3 rules in `../The_Ferryman_v0.3_Decided_Rules.md`. It is a separate game from the v0.2 demo in `../The_Ferryman_Digital_Demo/`.

No install, account, network or build step is needed.

## Play

Either:

1. **Double-click `index.html`.** Checked in headless Google Chrome on macOS: the game starts, saves and resumes. Other browsers have not been checked this way.
2. **Or serve the folder locally** (the checked automation path):

   ```
   python3 -m http.server 8000 --bind 127.0.0.1
   ```

   then open `http://127.0.0.1:8000/`.

Your run saves automatically in this browser. "Export run" downloads a JSON file; "Load save" reads it back. "Event reference" keeps discovered events separately from the run.

## Files

| File | Owner | Purpose |
|---|---|---|
| `rules-data.js`, `engine.js` | Worker C | Rules and game engine |
| `content.js` | Worker B | All player-facing text |
| `assets/assets.js`, `assets/art/` | Worker A | Art manifest, paintings, icons |
| `index.html`, `app.js`, `styles.css` | Worker D | Interface |
| `docs/` | B, C | Quick start, showcase script, content review, engine API |
| `tests/`, `verification/` | C, D | Engine tests, integration and browser checks, evidence |
| `handoff/` | all | Delivery notes |

## Checks

From this folder:

```
node --test "tests/engine/*.test.js"
node tests/integration/integration-check.cjs
node tests/integration/browser-flows.cjs
```

The browser check needs a local Google Chrome. See `RELEASE_NOTES.md` for results and limits.
