# Football Strategy 1.0.0 · validation report

## Executed successfully

| Check | Result |
| --- | --- |
| Dependency-free engine and protocol suite | **37 passed, 0 failed** |
| Actual Firestore emulator security/concurrency suite | **17 passed** |
| Node DOM interaction suite | **11 passed** |
| Complete-game simulations | **120 of 120 completed** |
| Simulated resolved downs | **3,174**, maximum **93** in one game |
| JavaScript module syntax | Passed |
| ZIP structure / source inclusion | One project folder; application files at its root |

The simulation uses deterministic purposeful AI with seeded legal action variation (22% of actions are varied) to exercise different results. Every resolved state checks field bounds, six unique player positions, a valid carrier, down bounds, revision progress, nonnegative multiples-of-seven scores and agreement between scores and TD stats. Completed games require equal scheduled opportunities and a non-tied score. The simulation's 400-down harness safety limit is not a game rule; all 120 varied games finished before it. Perfectly mirrored deterministic coaches can remain tied through repeated overtime, which the rules intentionally allow.

## Engine/protocol coverage

Cardinal movement and boundaries; three-turn sequencing; retained positions; eight-down expiration; formation reset; diagonal supercover corner squares; straight paths; defense-first pass ordering; receiver movement after completion; one throw per down; current-carrier throws; pre-throw strips; moving into defenders and swaps; rest-of-down blocks and release; adjacent holding without re-blocking; same-team cancellation and swaps; concurrent block/strip; first interceptor and corner ties; blocked receivers; contact immediately after completion; contact before scoring; safe routes, cutoff rejection and possession-turn budget; offensive/defensive accelerated TDs; bonus return scores; three scheduled possessions; paired overtime; input immutability; deterministic replays; final-state guards; array-order-independent simultaneous contact; simultaneous strip attribution; canonical records/head-to-head; stale submission rejection; duplicate resolution; transaction race models; local JSON resume; changed-game retry and genuine-denial handling.

## Real emulator coverage

The supplied rules were compiled and run in the official Firestore emulator with separate Alice, Bob, outsider and unauthenticated contexts. The production Firebase project was not contacted by these tests.

Verified: anonymous denial; transaction creation; room-code lookup and restricted listing; joining; participant-only active state/replays; participant queries; first-plan secrecy; immutable/owner-only submissions; reveal after both commits; two concurrent resolvers advance once; old replay/plan immutability; stale submissions; concurrent next-down submissions; atomic forfeit/result creation; authenticated summary board; immutable completed results; creator-only cancellation; and ordinary final-down result publication.

The emulator exposed stale-write rule denials during concurrency. The client now uses the same tested guarded transaction helper: only a changed canonical game permits retry after such a denial. Genuine permission failures against unchanged state are not suppressed. Expected permission-denied messages in the emulator test output are deliberate rejection checks.

## Interface interaction coverage

Executed in a Node DOM environment using the actual app source: home actions; practice without Firebase browser imports; player selection; legal squares; movement arrows; undo; pass gesture/path squares; projected ball carrier and receiver position; unsubmitted draft restoration after module reload; review/lock; replay persistence; refresh before viewing a result; skip/continue without changing saved scores/replay count; and replay archive navigation.

These are DOM interaction checks, **not real-browser rendering or physical touch tests**.

## Not verified here

- Firebase console provider enablement, authorized domains, production database creation, or publication of the rules. These steps must be done by the owner.
- Live two-account production Firebase gameplay, account creation, email/password reset delivery, or deployed GitHub Pages behavior.
- Real-browser visual/layout checks, real Android/iPad touch behavior, screen rotation, browser-level offline/reconnect behavior, or actual multi-tab browser playback. A supported browser QA environment was unavailable. Responsive styles and interaction handling are implemented, but are not claimed to be device-verified.
- An existing first-load offline install. There is no service worker; initial app files must load over HTTP/HTTPS.

## Reproduce

`npm test` and `npm run simulate` use only Node built-ins. For the optional suites, run `npm install`, then `npm run test:ui` and `npm run test:rules`. The pinned Firebase CLI/emulator test path ran with Node 24 and Java 17 in the build environment; use a supported Node 20/22 and Java 17+ locally. Emulator tests target the fake project `demo-football-strategy`, never the production project.

No custom server, Cloud Function, production account, or console setting was created or changed during this build.
