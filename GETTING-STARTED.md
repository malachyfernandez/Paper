# Getting Started with Paper Base

This repo is a clean React Native starter that keeps **every system** from the Paper codebase and strips out all the app-specific content. The goal: you (or an AI agent) start a brand-new thread, point it at this repo, and build a new app on top of a proven, real-time, authenticated, per-user-state foundation — without re-deriving any plumbing.

This document is the single source of truth for understanding the base and building on it. For the deeper architecture write-up, read [`utils/about-this-codebase.md`](./utils/about-this-codebase.md) and [`utils/userVariables-system.md`](./utils/userVariables-system.md).

---

## 1. What this is (and isn't)

**Included (the systems):**
- **userVariables** — the reactive, Convex-backed, per-user state layer. This is the heart of everything.
- **Convex backend** — schema + queries/mutations that implement userVariables (`convex/`).
- **Clerk auth** — Google OAuth + a user-code fallback (`contexts/AppAuthContext.tsx`, `app/index.tsx`).
- **UI kit** — `PoppinsText`, `AppButton`, `PoppinsTextInput`, dialogs, `Column`/`Row` layout, Uniwind (Tailwind for RN) styling, `StateAnimatedView` page transitions.
- **Feedback systems** — global toast (`contexts/ToastContext`) + undo/redo command system (`hooks/useUndoRedo`).
- **Animations** — `react-native-reanimated` is installed and used; see the demo and the patterns below.

**Not included (app content):** no FairRide, no ReceiptVault, no document/math editor. The only screen is `app/components/MainPage.tsx`, a tiny **notes demo** that exercises the userVariables system end-to-end. Treat it as a worked example, then replace it.

---

## 2. Tech stack

| Layer | Tool |
| --- | --- |
| Framework | React Native + Expo (Expo Router) |
| Backend / DB | Convex (real-time) |
| Auth | Clerk |
| Styling | Uniwind (Tailwind CSS for RN) |
| Animations | react-native-reanimated |
| Language | TypeScript (strict) |

---

## 3. Run it locally

```bash
npm install

# Configure environment (see section 4)
cp .env.example .env   # if present; otherwise create .env with the vars below

# Start the Convex dev backend (separate terminal) — generates convex/_generated
npx convex dev

# Start the app
npm run web      # or: npm run start / android / ios
```

> First run: `npx convex dev` will prompt you to log in and create/select a Convex project, then it writes `CONVEX_DEPLOYMENT` to `.env.local` and regenerates `convex/_generated`. You must run it once before `tsc` and the app will fully work.

### Required environment variables

Create `.env` (and `.env.local` is written by Convex) with:

```bash
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...   # from Clerk dashboard
EXPO_PUBLIC_CONVEX_URL=https://<your-deployment>.convex.cloud   # from `npx convex dev`
```

Clerk also needs a JWT template named `convex` (see Convex + Clerk docs) so Convex can verify the Clerk identity. `convex/auth.config.ts` reads it.

---

## 4. The userVariables system (the one thing to understand)

Everything persistent in an app built on this base is a **userVariable**. There are two shapes:

### Single value per user — `useUserVariable`

```tsx
const [profile, setProfile] = useUserVariable<UserData>({
  key: 'userData',          // unique key for this value
  defaultValue: { name: '', email: '', userId: '' },
  privacy: 'PUBLIC',        // 'PUBLIC' | 'PRIVATE' | string[] (allow-list of userIds)
  searchKeys: ['name'],     // optional: which fields are searchable
});

setProfile({ ...profile.value, name: 'Ada' }); // optimistic + synced
```

### A collection per user — `useUserList` family

```tsx
// Write/upsert one item imperatively
const setNote = useUserListSet<Note>();
setNote({
  key: 'notes',                       // the list key
  itemId: id,                         // unique id for this item
  value: { id, text, createdAt },
  privacy: 'PRIVATE',
  searchKeys: ['text'],
  sortKey: 'PROPERTY_LAST_MODIFIED',
});

// Read many items (the current user, or any set of users)
const records = useUserListGet<Note>({ key: 'notes', userIds: [userId] });
const notes = (records ?? []).map(r => r.value);

// Remove one item
const removeNote = useUserListRemove();
removeNote({ key: 'notes', itemId: id });

// Subscribe to / edit a single known item
const [note, setNote] = useUserList<Note>({ key: 'notes', itemId: id, defaultValue });
```

Other hooks: `useUserVariableGet` (read other users' single values), `useUserListLength` / `useUserVariableLength` (constant-time counts), `useUserVariablePrivacy` / `useUserListPrivacy` (change sharing).

### The golden rule: **subscribe, don't prop-drill**

Each component calls the hook for the data it needs. Two components using the same `key` stay in sync automatically — no Context, no Redux, no passing values down through props.

```tsx
// ❌ Don't
<Child userData={userData} />

// ✅ Do — Child subscribes itself
function Child() {
  const [userData] = useUserVariable<UserData>({ key: 'userData', defaultValue });
}
```

The demo (`app/components/example/`) shows this: `ProfileHeader`, `AddNoteInput`, and `NotesList` each subscribe independently to `userData` / `notes`.

### Privacy

- `'PRIVATE'` (default mindset): only the owner can read.
- `'PUBLIC'`: anyone can read (enables search/discovery across users).
- `string[]`: an allow-list of specific userIds.

Start private, widen as needed.

---

## 5. Building a new app on this base

1. **Clone & reset history** (see README "Using this as a base").
2. **Rename** in `package.json` (`name`) and `app.json` (`expo.name`, `expo.slug`, `expo.ios.bundleIdentifier`).
3. **Delete the demo**: remove `app/components/example/` and `types/note.ts`, and rewrite `app/components/MainPage.tsx` to render your app's first screen. Keep the `useUserVariable<UserData>` + `useSyncUserData` block at the top — that wires the signed-in user into state.
4. **Model your data as userVariables**: pick a `key` per value/collection, define a TypeScript type in `types/`, decide privacy. No schema migration needed — `user_vars`/`user_lists` are generic.
5. **Componentize everything**: small components that each subscribe to what they need.
6. **Use the UI kit + layout primitives** (`Column`/`Row`, `PoppinsText`, `AppButton`, Uniwind classes) for a consistent look.
7. **Animate** with `react-native-reanimated` for polish (entrance fades, springy presses, pulses).

### Suggested folder convention

```
app/components/
├── <yourapp>/        # your screens + feature components
│   └── shared/       # reusable feature components (animations, cards, inputs)
├── ui/               # base UI kit (provided)
├── layout/           # Column, Row, etc. (provided)
└── MainPage.tsx      # your app shell
types/                # your data types
convex/               # only touch if you add custom server logic; userVariables already covers most needs
```

---

## 6. Color & styling tokens (Uniwind)

Use `className` with these semantic tokens (defined in the Tailwind/Uniwind config):

- `bg-background`, `bg-inner-background` — surfaces
- `text-text` — primary text
- `border-border`, `border-subtle-border` — borders
- `bg-primary-accent` / `text-primary-accent` — primary action color

Spacing: `Column`/`Row` take a `gap` prop in 4px units (`gap={4}` = 16px).

---

## 7. Common gotchas

- **`tsc` errors about `convex/_generated`**: run `npx convex dev` once to regenerate the generated API for your deployment.
- **Auth not ready**: `userVariables` hooks no-op until Clerk reports a signed-in user; gate UI on `isAuthenticated` (see `app/index.tsx`).
- **`PROPERTY_LAST_MODIFIED`** is a built-in sort key for "most recently changed first."

That's it — the plumbing is done. Pick your `key`s, model your data, and build.
