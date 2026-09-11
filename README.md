# Acura Showroom Digital Signage

A serverless digital signage system: a full-screen 1920×1080 TV display
(`index.html`) and a PIN-gated staff dashboard (`admin.html`) that controls
it in real time. No servers, no build step — just static files on Netlify,
with Firebase as the backend.

```
acura-signage/
├── index.html          ← put this on the showroom TV / player
├── admin.html           ← staff-only control panel
├── firebase-config.js   ← your Firebase project keys (edit this)
└── README.md
```

**Live host:** Netlify, at <https://sv-tv-signage.netlify.app>. The same
code also lives on GitHub at
<https://github.com/changwonjin00/sv-tv-signage> and mirrors live via
GitHub Pages at <https://changwonjin00.github.io/sv-tv-signage/> — both
point at the same Firebase project, so either URL shows the same live
data. GitHub is version control/backup, not required for the app to run.
When you make code changes, publish to **both**: drag-and-drop onto
Netlify (Section 5) *and* `git push` to GitHub (Pages rebuilds
automatically in under a minute).

---

## 1. Create the Firebase project

1. Go to <https://console.firebase.google.com> and click **Add project**.
   Name it something like `acura-showroom-display`, and finish the wizard
   (Google Analytics is optional — you can turn it off).
2. Once the project opens, click the **`</>` (Web) icon** on the project
   overview page to register a web app. Give it a nickname (e.g. "Showroom
   Display"). You don't need Firebase Hosting — you're deploying to Netlify.
3. Firebase will show you a `firebaseConfig` object that looks like this:

   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "acura-showroom-display.firebaseapp.com",
     projectId: "acura-showroom-display",
     storageBucket: "acura-showroom-display.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```

   Copy those six values into **`firebase-config.js`**, replacing the
   placeholder strings.

This `apiKey` is not a secret in the way a server API key is — it's safe to
ship in client-side code. Firestore/Storage **security rules** (below) are
what actually control access, not this key.

---

## 2. Set up Firestore

1. In the left sidebar, click **Build → Firestore Database → Create
   database**.
2. Choose **Start in production mode**, pick a region close to the
   dealership, and click **Enable**.
3. Go to the **Rules** tab and replace the contents with:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /digitalSignage/config {
         allow read: if true;
         allow write: if true;
       }
     }
   }
   ```

   This lets the TV read the config document, and lets the admin page
   write to it, without requiring visitors to log in. See **Security
   notes** at the bottom of this file — the PIN screen in `admin.html` is
   a UI convenience, not a database-level lock, and the rules above are
   intentionally open so that stays simple. If you want the database
   itself locked down, see the "Hardening" option below.

4. Click **Publish**.

You don't need to manually create the `digitalSignage/config` document —
the first time you unlock `admin.html`, it creates it automatically with
sensible defaults.

---

## 3. Slideshow images (no Storage bucket needed)

This project intentionally skips Firebase Storage — as of late 2024 it
requires the paid **Blaze** billing plan even for light use, which is
unnecessary for a handful of signage photos.

Instead, `admin.html` compresses each uploaded photo client-side (resizing
and re-encoding as JPEG) and stores it directly as a data URL inside the
same Firestore config document from Step 2. All slideshow images share a
900 KB budget, which comfortably fits roughly 5-8 photos depending on their
content. There's nothing to configure here — it works out of the box on
the free **Spark** plan.

If you need a larger photo library, swap in a free third-party image host
(e.g. Cloudinary's free tier) instead — see the `uploadImage`/`compressImage`
functions in `admin.html` for where to make that change.

---

## 4. Get an OpenWeatherMap API key

1. Sign up for a free account at <https://openweathermap.org/api>.
2. Under **My API keys**, copy the default key (new keys can take up to a
   couple of hours to activate).
3. You'll paste this into the admin dashboard's **Dealership & Weather**
   panel later — it's stored in Firestore, not hard-coded, so any staff
   member can update it without touching code.

---

## 5. Deploy to Netlify

No build step is required — this is plain HTML/CSS/JS.

**Option A — drag and drop (fastest):**
1. Go to <https://app.netlify.com>, log in, and go to **Sites**.
2. Drag the whole `acura-signage` folder onto the "Drag and drop your
   site output folder here" area.
3. Netlify deploys it instantly and gives you a URL like
   `https://random-name-123.netlify.app`.
4. Optional: **Site configuration → Change site name** to get a nicer
   URL, or add a custom domain under **Domain management**.

**Option B — Netlify CLI:**
```bash
npm install -g netlify-cli
cd acura-signage
netlify deploy --prod
```
When prompted for the publish directory, enter `.` (the current folder).

**Option C — Git-based deploy:** push this folder to a GitHub/GitLab repo
and connect it in Netlify under **Add new site → Import an existing
project**. Leave the build command blank and set the publish directory to
the repo root (or wherever these files live).

Once deployed you'll have two URLs to use day-to-day:
- `https://yoursite.netlify.app/index.html` → point the showroom TV/player
  browser here (see "Running the TV" below).
- `https://yoursite.netlify.app/admin.html` → give this link only to staff
  who manage the display.

By default Netlify shows a small "Powered by Netlify" badge on the page.
To remove it: **Project configuration → General → Powered by Netlify
badge → Configure**, uncheck **Show the badge on this project**, **Save**.

---

## 6. Running the TV display

Any device with a modern browser works — a cheap Fire TV Stick / Chromebox
/ mini PC connected to the TV, or the TV's own browser if it has one.

1. Open `https://yoursite.netlify.app/index.html` in the browser.
2. Put the browser into full-screen / kiosk mode so there's no address
   bar:
   - **Chrome/Chromium:** launch with `--kiosk https://yoursite.netlify.app/index.html`
   - Or press **F11** for full screen after the page loads.
3. Leave it open. Any change made in `admin.html` — ticker text, colors,
   YouTube link, uploaded images — appears on the TV within a second or
   two, with no refresh needed, because the page uses a live Firestore
   listener (`onSnapshot`).
4. If the device restarts, set the browser to auto-launch that URL on
   boot (most digital-signage players and kiosk browser extensions
   support this natively).

**Built-in resilience for low-power devices (e.g. Fire TV Stick):**
- YouTube playback is capped at **720p** — hours of 1080p decode on a
  weak/low-RAM device is the most likely cause of a browser crash on a
  24/7 display, so this trades some sharpness for real stability. (This
  is YouTube's own "suggested quality" API, so it's honored in the vast
  majority of cases but isn't a hard guarantee on YouTube's end.)
- The page **automatically reloads every 6 hours**, clearing out any
  memory buildup before it can accumulate into a crash, rather than
  waiting for one to happen. (`admin.html` never does this — an
  unexpected reload could wipe out an in-progress unsaved edit there.)

---

## 7. Using the admin dashboard

The dashboard is split into four tabs, plus a single **Save Changes** bar
pinned to the bottom of the screen. **Nothing reaches the TV until you
click it** — every edit (text fields, colors, photo/logo uploads, YouTube
adds, reordering, deleting, reviews) only changes your local working copy.
The bar shows "Unsaved changes" the moment anything differs from what's
live, and reverts to "All changes saved" right after a successful save.
If you try to close or refresh the tab with unsaved edits, the browser
will ask you to confirm first.

1. Open `admin.html`, enter the PIN **8888** on the keypad.
2. **Slideshow tab:** a single ordered list that mixes photos and YouTube
   videos/playlists — the TV plays through it top to bottom, looping back
   to the start.
   - Drag photos into the drop zone, or click it to choose files. Each
     compresses and appears at the bottom of the list.
   - Paste a YouTube video URL (`.../watch?v=...`) or playlist URL
     (`.../playlist?list=...` or any URL with `?list=`) and click **Add
     to slideshow**. Video plays muted; a single video plays once through
     then advances, a playlist plays through to its end then advances.
     Each YouTube row also gets a **custom title** field — set this to
     override what shows in the TV's "Now Playing" line (leave it blank
     to use the video's real YouTube title). Photos never show a title in
     "Now Playing," just their position in the dot row.
   - **Reorder** by dragging a row, or using the ▲/▼ buttons.
   - **Seconds per photo (default):** how long each photo shows before
     advancing. Override it per photo with the small field on its row —
     leave that blank to use the default.
   - Click the **×** on a row to remove it from the slideshow.
3. **Branding tab:** choose whether the header shows **Text** (a name) or
   a **Logo image** (upload a PNG — transparent background recommended,
   since it sits on a dark panel). Also sets the **Tagline** shown under
   the header (leave it blank and save to hide that line entirely), and
   the four **Colors** (background, accent, side-panel text, and the
   ticker's own text color — the ticker sits on the accent bar, so it
   needs its own setting to stay readable).
4. **Reviews tab:** manages the Google-style review carousel shown at the
   bottom of the side column. Add an author name, a 1-5 star rating, and
   the review text; click a review in the list to edit it, or its **×** to
   remove it.
5. **Ticker & Weather tab:** the scrolling ticker message, the weather
   city/units, and the OpenWeatherMap API key (which also drives the
   forecast strip under the current conditions). The TV refreshes weather
   every 30 minutes (backing off to as slow as every 2 hours if requests
   start failing, e.g. the API key or network is down) and shows an
   "Updated H:MM" stamp under the forecast so staff can see at a glance
   how fresh the data is.
6. When you're happy with your edits across any/all tabs, click **Save
   Changes** once at the bottom — it publishes everything together in a
   single update.
7. Click **Lock dashboard** when you're done, or just close the tab — the
   PIN is required again on the next visit from a new browser session.

---

## Security notes

This system is designed to be easy for non-technical staff to operate,
which comes with real trade-offs worth understanding:

- The `admin.html` PIN is a **client-side UI gate**, not database
  security. Anyone who has the Netlify URL and the Firebase config values
  (visible in your deployed source) could, in principle, write directly
  to Firestore/Storage using the browser console, bypassing the PIN
  entirely — the open rules above allow it.
- For a showroom display, the realistic risk is low (worst case, someone
  changes the ticker text or YouTube link), but don't use this pattern
  for anything holding sensitive data.
- **Hardening option:** if you want real access control, switch to
  Firebase Authentication (email/password) for `admin.html`, and change
  the security rules to `allow write: if request.auth != null;`. This
  is a moderate rework of `admin.html` (add a sign-in call before the
  dashboard renders) but keeps `index.html` unauthenticated since the TV
  still needs public read access.
- Treat the `admin.html` link itself as semi-private — don't post it
  publicly — even though the PIN is the primary gate.

---

## Troubleshooting

- **TV shows "No media configured":** the Slideshow Assets list in the
  admin panel is empty — add at least one photo or YouTube link.
- **Weather says "not configured":** fill in both the city and the
  OpenWeatherMap API key in the admin panel's Dealership & Weather
  section, then click Save. New OpenWeatherMap keys can take up to ~2
  hours to activate after signup.
- **Weather says "Weather error: ..."**: the TV now shows OpenWeatherMap's
  actual error message instead of a generic failure, which makes this
  easier to diagnose. The most common cause is the city format — the
  `q=` lookup only reliably supports a state/province code for **US**
  cities; for anywhere else use just `City, Country` (e.g. `Airdrie, CA`
  for Airdrie, Alberta, Canada — not `Airdrie, AB, CA`). `index.html`
  resolves the city through OpenWeatherMap's Geocoding API before
  fetching weather, which is more tolerant than the old direct lookup.
- **Images won't upload / "no room in the image budget":** the shared
  900 KB budget for all slideshow assets is full — remove a photo before
  adding another, per Section 3.
- **YouTube video doesn't play:** confirm the video allows embedding
  (some music/label content blocks embedded playback) and that the URL
  contains `v=` or `list=`.
- **Nothing updates on the TV:** open the browser console (F12) on the
  TV device and check for Firestore permission errors — usually means
  the security rules in Section 2 weren't published.
