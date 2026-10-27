# Tidy Tribe v1.0 — setup guide

About 30–40 minutes, once. Everything is free (Firebase "Spark" plan — no credit card).
Do steps 1–6 on a computer. Steps 7–9 use the phones.

**Want a look first?** Do step 7 only. Until Firebase is filled in, the app runs in
*demo mode* (saved on that phone only, any password works).

---

## 1. Create the Firebase project

1. Go to **console.firebase.google.com** and sign in with your Google account.
2. Click **Create a project** (or **Add project**).
3. Name it `tidytribe` → **Continue**.
4. Turn **Google Analytics off** → **Create project** → **Continue**.

## 2. Turn on sign-in and add the five people

1. In the left menu: **Build → Authentication → Get started**.
2. Under **Sign-in method**, click **Email/Password**, switch on the first toggle
   (leave "Email link" off) → **Save**.
3. Click the **Users** tab → **Add user**, and add these five, one at a time.
   Use exactly these emails (they're just usernames — no emails are ever sent).
   Choose a password for each and write them down:

   | Person  | Email                 |
   |---------|-----------------------|
   | Shaun   | shaun@tidytribe.app   |
   | Lyndsey | lyndsey@tidytribe.app |
   | Heidi   | heidi@tidytribe.app   |
   | Alex    | alex@tidytribe.app    |
   | Emma    | emma@tidytribe.app    |

   Brooke doesn't need one — she uses your or Lyndsey's phone.
4. Click the **Settings** tab → **User actions** → **untick "Enable create (sign-up)"** → **Save**.
   (This stops anyone else creating accounts.)
5. Still in **Settings → Authorized domains → Add domain**: type `sskehan.github.io` → **Add**.

## 3. Create the database

1. Left menu: **Build → Firestore Database → Create database**.
2. Location: **australia-southeast1 (Sydney)** → **Next**.
3. Choose **Start in production mode** → **Create**.

## 4. Get the app's connection details

1. Click the **gear icon** (top left, next to "Project Overview") → **Project settings**.
2. Scroll to **Your apps** → click the **`</>`** (web) icon.
3. Nickname: `Tidy Tribe`. Leave "Firebase Hosting" **unticked** → **Register app**.
4. You'll see a box of code containing `const firebaseConfig = { apiKey: "…", … }`.
   **Copy that whole box and send it to Claude** — I'll put it into `firebase-config.js` for you.
   (Or paste the six values into `firebase-config.js` yourself, replacing each `PASTE_…`.)
   These values are not secret — the security rules in step 5 protect the data.
5. Click **Continue to console**.

## 5. Add the security rules

1. Left menu: **Firestore Database → Rules** tab.
2. Delete everything in the box.
3. Open `firestore.rules` from the app files, copy all of it, and paste it in.
4. Click **Publish**. If Firebase shows a red error, send Claude a screenshot.

These rules mean Alex and Emma can only tick their own chores, ask for rewards and pick
their colour. They can't change points. Adults can change everything.

## 6. Put the app on GitHub (same as your other apps)

1. On github.com, create a new **public** repository called `tidytribe`.
2. Upload all the app files and the `icons` folder (you don't need the `tests` folder).
3. **Settings → Pages** → Source: **Deploy from a branch** → Branch **main**, folder **/ (root)** → **Save**.
4. After a minute the app is at **https://sskehan.github.io/tidytribe/**

## 7. Install on each phone

1. Open **https://sskehan.github.io/tidytribe/** in Chrome (or Samsung Internet if Chrome
   gives the "already installed" problem you had with Our Tax).
2. Menu (⋮) → **Add to Home screen** / **Install app**.
   If Play Protect warns about it, choose to install anyway, like before.
3. Open Tidy Tribe from the home screen, tap the person whose phone it is, and enter their password.
   Each phone only signs in once.

## 8. First-time setup (Shaun's phone)

1. Sign in as **Shaun**.
2. Tap **Set up Tidy Tribe**. This loads the chores from S'moresUp, the two rewards and
   the balances (Alex 45, Emma 721, Brooke 842).
3. Tap **Adults — enter PIN** and create your 4-digit PIN.
4. Check each kid's chores under **Admin → Manage → Chores** and adjust anything that's off.

## 9. The other adults

- **Lyndsey**: sign in on her phone, tap **Adults — enter PIN**, create her PIN.
- **Heidi**: same on her phone. Her **Chores** list starts empty — she can add chores or use
  **Copy from other house**, then edit.

---

## Good to know

- **Which house the kids are at** comes from **Schedule** (week on/week off, changing Sunday 5 pm).
  Add swaps and holidays there.
- **School terms**: NSW public school dates and public holidays for 2026–2027 are loaded.
  Add pupil-free days, and next year's terms when they're released, under **Schedule**.
- **Backups**: **Admin → Settings → Download backup**. Save the file to Dropbox or the QNAP.
- **No internet?** Kids can still tick chores; they sync when the phone is back online.
  Signing in the first time needs internet.
- **Forgotten password**: the reset-email option won't work for these usernames. Instead go to
  Firebase console → Authentication → Users → ⋮ next to the person → **Delete account**, then
  **Add user** again with the same email and a new password. Their points are not affected.
- **Forgotten PIN**: another adult can't see it. Sign in to Firebase console →
  Firestore Database → `config` → `main` → `pins` → delete your line, then create a new PIN in the app.
