# Set up Football Strategy on your phone

Your Firebase project `footballstratagy` is already configured in the code. The following console steps still need to be completed by the project owner. They have not been performed for you.

## 1. Enable accounts

1. Open https://console.firebase.google.com/ and select **footballstratagy**.
2. Open **Build → Authentication** and choose **Get started** if needed.
3. Under **Sign-in method**, enable **Email/Password**. Save. Email-link sign-in is not used. Google sign-in is not required.
4. Under **Settings → Authorized domains**, add your GitHub Pages hostname: `YOUR-USERNAME.github.io`. Enter only the hostname, without `https://` or a repository path. If you use a custom domain, add it too. Local testing may require adding `localhost`.
5. In the game, choose the account icon, choose **Create account**, enter email/password and a coach name and color. Passwords need at least six characters. Your friend creates a separate account.

## 2. Create Firestore and publish the rules

1. Open **Build → Firestore Database → Create database**.
2. Create the default **Cloud Firestore Standard** database, using production mode and a suitable nearby region. If a database already exists, use it.
3. Open its **Rules** tab.
4. Replace the editor contents with the complete contents of **firestore.rules** in this ZIP, then tap **Publish**.
5. Do not leave test-mode or public-write rules in place.

The app creates its own `profiles`, `games` and `results` documents. No manual collections or seed records are needed. Queries use only an array membership filter; no custom composite index is required. Firebase Storage, Analytics and Cloud Functions are not used.

The friend group is everyone with an account in this Firebase project. Signed-in coaches can read finished summary results for the leaderboard. Ongoing match data, plans and replays are participant-only, except that an open waiting room can be looked up by its code to join. An account does not grant access to other games' private plans. This is a trust-based friends game; the rules enforce participation and immutability, not server-side re-simulation of every football move.

## 3. Upload to GitHub

1. Unzip **Football-Strategy-v1.0.0.zip**. It contains one folder named **Football-Strategy-v1.0.0**.
2. Open your repository on GitHub. Upload the **files inside that folder** to the repository root. Do not upload the surrounding folder as another nested directory.
3. Confirm that `index.html`, `app.js`, `engine.js`, `cloud.js` and `style.css` are directly in the root.
4. Open **Settings → Pages**. Under deployment source, choose **Deploy from a branch**, select your branch (usually `main`) and **/(root)**. Save.
5. Open the URL GitHub supplies, usually `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`.
6. Allow a little time after uploading; reload if GitHub is still serving an earlier version. Version **1.0.0** is visible at the top.

The source uses relative local paths, so repository URLs work. Firebase modules load from Google's CDN, and optional fonts load from Google Fonts. Font failures fall back to system fonts. Practice uses only local game code and does not depend on Firebase sign-in; the initial site files must still have loaded. This release does not include a service worker or promise a first load without internet.

## 4. Start a real game

1. Coach A signs in and chooses **Create game → Create room**.
2. Copy the seven-character room code or invitation link.
3. Coach B signs into a different account, chooses **Join game** and enters the code, or opens the invitation link.
4. Both coaches program three turns and choose **Review & lock → Lock all three turns**.
5. The last submission triggers resolution. The other client also attempts a guarded resolution if needed; only one transaction can advance that down.
6. Watch or skip the replay, then continue. You can leave between submissions and come back later.

An unfinished plan is device-local and scoped to the exact room, possession and down. Submitted plans and game results sync through Firestore. Local drafts are not shared across devices. Completed games are under Records/history; practice never changes records.

## Troubleshooting

- **Firebase denied access:** Publish the supplied Firestore rules in the correct project. Sign out/in, then retry. Old rules or a different Firebase project will not work.
- **Email provider disabled:** Enable Email/Password under Authentication.
- **Page shows raw files or 404:** Confirm `index.html` is at the root and Pages is using that branch/root.
- **Blank page:** Open through GitHub Pages/HTTP, not a phone file viewer. Confirm every `.js` and `.css` file was uploaded. The browser must support JavaScript modules.
- **Connection interrupted:** Keep your draft; reconnect and retry. Multiplayer transactions require internet. The pending screen has a resolve/reconnect button.
- **Room not found:** Use the seven-character code. Cancelled, joined and completed rooms cannot be joined again by a third coach.
- **A game is still tied:** Overtime intentionally repeats paired possessions; there is no arbitrary sudden-death cutoff.
- **A saved draft vanished:** Drafts are stored in that browser's local storage. Private browsing, clearing site data or switching browsers/devices can remove them. Submitted plans remain on Firebase.

## Final live verification you should perform

Use two separate accounts, preferably in two browsers/devices. Join a room, submit at the same time, watch both replays, refresh one coach before and after submitting, finish a game, verify records once, and try an unjoined cancellation and an active resignation. Confirm a third account cannot read active game/replay/plan data. No production credentials or accounts were used during this build.

Official Firebase references: https://firebase.google.com/docs/auth/web/password-auth • https://firebase.google.com/docs/firestore/security/get-started • https://firebase.google.com/docs/firestore/manage-data/transactions
