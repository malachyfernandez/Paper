# Paper Base

A clean, batteries-included React Native starter built from the Paper codebase. It ships **all of the systems** — the `userVariables` reactive state layer (Convex-backed, real-time, per-user, privacy-aware), Clerk authentication, the Uniwind (Tailwind) UI kit, layout primitives, toast + undo/redo, and `react-native-reanimated` animation patterns — with **none of the app-specific content**. The home screen is a tiny notes demo that shows the patterns; delete it and build your own app on top.

> **New here? Read [GETTING-STARTED.md](./GETTING-STARTED.md).** It explains the architecture and how to build a new app on this base in minutes.

---

## What's included

- **userVariables system**: `useUserVariable` (single value) + `useUserList`/`useUserListGet`/`useUserListSet`/`useUserListRemove` (per-user collections) — see `hooks/` and `utils/userVariables-system.md`.
- **Convex backend**: the `user_vars` / `user_lists` schema + queries/mutations that power userVariables (`convex/`).
- **Auth**: Clerk + a user-code fallback, wired through `contexts/AppAuthContext`.
- **UI kit**: `PoppinsText`, `AppButton`, `PoppinsTextInput`, dialogs, layout (`Column`/`Row`), Uniwind styling, `StateAnimatedView` page transitions.
- **System feedback**: global toast (`contexts/ToastContext`) and an undo/redo command system (`hooks/useUndoRedo`).
- **Docs**: `utils/about-this-codebase.md` (architecture deep-dive) and `utils/userVariables-system.md`.

---

## Requirements

- **Node.js** (LTS recommended, e.g. 20.x)
- **npm** (comes with Node)
- **Git**
- Expo tooling will be installed as part of `npm install`.

---

## Getting started (using this repo directly)

1. **Clone the repo**

   ```bash
   git clone https://github.com/malachyfernandez/paper-base.git
   cd paper-base
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run the app**

   Available scripts (from `package.json`):

   - Start Metro / Expo dev server:

     ```bash
     npm run start
     ```

   - Run on Android (device or emulator):

     ```bash
     npm run android
     ```

   - Run on iOS (simulator):

     ```bash
     npm run ios
     ```

   - Run on the web (Expo web):

     ```bash
     npm run web
     ```

   Follow the Expo CLI instructions in your terminal to open on your target platform.

---

## Using this as a **base** for a new project

Whenever you want to start a new app based on this setup:

1. **Clone into a new folder**

   ```bash
   git clone https://github.com/malachyfernandez/paper-base.git my-new-app
   cd my-new-app
   ```

2. **(Optional but recommended) Remove this repo's git history and start fresh**

   ```bash
   rm -rf .git
   git init
   git add .
   git commit -m "Initial commit for my-new-app"
   ```

   At this point, `my-new-app` is its **own** git repository, separate from the base.

3. **Install dependencies and run**

   ```bash
   npm install
   npm run start    # or npm run android / ios / web
   ```

4. **(Optional) Create a new GitHub repo for the new app**

   - Create a new, empty repo on GitHub.
   - Then connect your local project to it:

     ```bash
     git remote add origin https://github.com/YOUR_USERNAME/YOUR_NEW_REPO.git
     git branch -M main
     git push -u origin main
     ```

---

## Project identity / naming

Internally, the project uses the technical name:

- `paper`

This is used for things like `package.json` and the Expo slug.

If you create a new project from this base, you can edit:

- `package.json` → `name`
- `app.json` → `expo.name`, `expo.slug`, and `expo.ios.bundleIdentifier`

To match your new app's branding.


