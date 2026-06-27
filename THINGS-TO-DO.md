# ReceiptVault — Things To Do (handoff for your local agent)

This file is the explicit follow-up checklist for **ReceiptVault**, a receipt-logging
web app built on Paper's `userVariables` system (same architecture as the FairRide
demo). Devin built everything it could autonomously; the items below are the steps
that need a human / local agent with credentials or a local environment.

---

## What's already done (in this PR)

- **Types**: `types/receipts.ts` — groups, receipts, settings, currencies, categories.
- **Currency utils**: `utils/currencyConversion.ts` — `convertToHome`, `convertBetween`,
  `formatMoney` (JPY/KRW are whole-number).
- **React Native app** in `app/components/receipts/`:
  - `ReceiptVaultMainPage.tsx` — top nav + screen router (Groups / Insights / Settings).
  - `screens/GroupsPage.tsx` — list groups, create group, account totals.
  - `screens/GroupDetailPage.tsx` — receipts in a group, per-category breakdown.
  - `screens/AddReceiptPage.tsx` — add/edit receipt: photo, merchant, purpose, amount,
    currency, category, notes, date, live conversion preview.
  - `screens/ReceiptDetailPage.tsx` — full receipt view, converted amount, edit/delete.
  - `screens/InsightsPage.tsx` — spend by category / group / currency (bar charts).
  - `screens/SettingsPage.tsx` — home currency + editable exchange-rate table.
  - `shared/` — GroupCard, ReceiptCard, CategoryPill, CurrencyPicker, MoneyText,
    PhotoPickerButton, ReceiptImageView, SpendBar, StatTile.
- **Convex backend**: `convex/receipts.ts` — `getGroupBreakdown`, `getAccountBreakdown`
  (server-side per-user subtotals).
- **Wired into the app**: `app/components/MainPage.tsx` now has a `receipts` app mode
  and a "ReceiptVault →" button on the Paper home screen.
- **Standalone mock**: `receiptvault-mock/index.html` — runs with no Clerk/Convex,
  dummy data (Japan 2026 / Work Expenses / Groceries + 8 receipts). Used for the video.
- Lint + Prettier pass on all new files. `tsc` shows no errors in any new file
  (the only remaining `tsc` errors are pre-existing, in `hooks/` and
  `ui/imageUpload/PublicImageUpload.tsx`, untouched by this PR).

## Data model (how it maps onto userVariables)

| Data            | Hook / key                                   | Notes |
|-----------------|----------------------------------------------|-------|
| Profile         | `useUserVariable` key `receipts_userData`    | private |
| Settings        | `useUserVariable` key `receipts_settings`    | home currency + rates |
| Groups          | `useUserList` key `receipt_groups`           | `itemId = group.id` |
| Receipts        | `useUserList` key `receipt_items`            | `itemId = receipt.id`, `filterKey = groupId` |

Conversion rates are stored as **units of currency per 1 unit of home currency**
(e.g. `rates.JPY = 157.2` means `1 USD = 157.2 JPY`). All totals are converted to the
user's home currency on the client (where the editable rate table lives).

---

## TODO — needs you / your local agent

### 1. Run it locally (needs the project's env vars)
```bash
cd Paper
npm install
# Create .env.local with the real values (ask the project owner / Convex + Clerk dashboards):
#   EXPO_PUBLIC_CONVEX_URL=...
#   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=...
npx convex dev        # in one terminal — pushes convex/receipts.ts
npx expo start --web  # in another terminal — opens http://localhost:8081
```
Then click **"ReceiptVault →"** on the Paper home screen.

### 2. Real photo upload (UploadThing)
The RN `PhotoPickerButton` currently returns the local/blob URI from
`expo-image-picker`. For persistence across devices, pipe the picked file through the
repo's existing UploadThing setup (see `app/components/ui/imageUpload/` and
`utils/imageCompression.ts`) and store the returned hosted URL in `receipt.image.url`.

### 3. Live exchange rates (optional)
Rates are currently entered manually in Settings. To auto-refresh, add a small fetch
(e.g. exchangerate.host / open.er-api.com) and write the result into
`receipts_settings.exchangeRates` + `lastRatesUpdate`. No key needed for the free tiers.

### 4. Verify Convex query indexes
`convex/receipts.ts` reads the `user_lists` table via the `by_user_key_sort` index.
Confirm that matches your deployed schema after `npx convex dev` (it does in the
current `convex/schema.ts`). These queries are optional helpers — the UI works without
them (it aggregates client-side).

### 5. Open the mock (no setup needed)
```bash
cd Paper/receiptvault-mock
python3 -m http.server 8090
# open http://localhost:8090/index.html
```

---

## Decisions Devin made autonomously (change if you disagree)
- Default home currency = **USD**; seeded rates for JPY/EUR/GBP/KRW/THB/INR/etc.
- Receipts grouped by a single `groupId` (one group per receipt). If you want a receipt
  in multiple groups, change `groupId: string` to `groupIds: string[]` in
  `types/receipts.ts` and update the filters.
- Conversion done on the client so offline / manual rates always work.
- Categories: food, transport, lodging, shopping, entertainment, groceries, health,
  business, other.
