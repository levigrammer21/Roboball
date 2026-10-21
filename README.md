# Football Strategy · 1.1.0

A complete, buildless, mobile-first football strategy game for a small group of friends. Program three players for three simultaneous turns. Read the defense, time a pass, and find the end zone.

**Start with [START-HERE.html](START-HERE.html) or [SETUP.md](SETUP.md).**

## New in 1.1.0

- Little football players with helmets, shoulder pads, jerseys, pants and cleats.
- Custom numbers through the **Jerseys** button, saved for each coach and visible to both sides.
- **Next turn → Next turn → Finish**, with no submission confirmation dialog.
- Automatic playback when both coaches finish, followed by the next planning down.
- Speed-aware movement transitions, running poses and shorter pauses.

Publish the updated `firestore.rules` when replacing the app files. Existing matches are compatible.

## Play

- Upload the contents of this project folder to the root of your GitHub repository. `index.html` must be at the repository root.
- Turn on GitHub Pages for that branch, root folder.
- Practice is available without an account. Multiplayer needs the Firebase console setup described in SETUP.md.
- Firebase configuration is already in `cloud.js`; no build, custom server, Cloud Functions, or Storage setup is required.

## Included

- Touch planning with projected positions, paths, legal-square highlights, pass mode, undo, hold, turn editing, clearing, and direct Finish submission.
- Deterministic shared rules, simultaneous contact, supercover passes, conservative breakaway search, paired overtime.
- Firebase email accounts, profiles, room codes, invitation links, asynchronous games, locked secret plans, transactional resolution, cancellation and forfeits.
- Saved replay events, speed/skip controls, archived game film, active/completed lists, derived records and head-to-head leaderboard.
- Offline local practice, purposeful computer coach, saved drafts and first-play tutorial.

## Project files

All application/source files are directly in this folder. No build output or dependency folder is needed for hosting.

| File | Purpose |
| --- | --- |
| index.html / style.css / app.js | Interface, touch controls, local storage and replay playback |
| engine.js | Pure shared engine, pass paths, projection, AI and records |
| protocol.js | Submission validation and guarded resolution patches |
| cloud.js | Integrated Firebase configuration and transaction-based multiplayer |
| firestore.rules | Participant access and hidden immutable plans |
| RULES.md | All rule and collision interpretations |
| SETUP.md / START-HERE.html | Mobile-friendly setup |
| VALIDATION.md | What was actually checked and remaining live checks |
| engine.test.mjs / backend.test.mjs | Dependency-free meaningful engine/protocol tests |
| simulate.mjs | Reproducible 120-game simulation |
| ui.test.mjs | Optional Node DOM interaction/refresh tests (not a real browser) |
| security.test.mjs | Optional real Firestore emulator access and concurrency tests |
| firebase.json / firestore.indexes.json | Optional Firebase CLI/emulator configuration |

## Run local tests

With Node.js 20+ installed:

```sh
npm test
npm run simulate
```

Optional Firebase emulator tests also need Java 17+ and the development dependencies:

```sh
npm install
npm run test:rules
npm run test:ui
```

For local play, use any static HTTP server; do not open `index.html` as a `file://` URL because browsers restrict JavaScript modules. For example, `python3 -m http.server 8000`. GitHub Pages does not require you to run a server yourself.

No live Firebase console changes or live two-account multiplayer checks are claimed. See VALIDATION.md.
