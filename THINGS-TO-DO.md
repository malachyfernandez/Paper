# THINGS-TO-DO — Master handoff (whole thread, all repos)

**You are a local agent on Malachy's machine with a real terminal, real credentials, and the ability to create GitHub repos + configure DNS. This single file is the complete, copy-paste-executable plan to get EVERYTHING from this thread fully online.**

Everything Devin could do without your credentials is already done and pushed as
the PRs listed below. This file tells you exactly what's left: merge the PRs,
create one new repo, deploy, and wire up a custom subdomain.

Work top-to-bottom. Each section is independent unless noted.

---

## 0. TL;DR — what exists and what's left

Three deliverables were built on **Paper's `userVariables` system** (Expo + Convex + Clerk + Uniwind + Reanimated):

| # | Thing | Where it lives | State | Your job |
|---|-------|----------------|-------|----------|
| A | **ReceiptVault** — receipt logging + multi-currency + client-side OpenRouter AI scan | `malachyfernandez/Paper` PR **#4** | built, CI green, open | merge |
| B | **FairRide** — budget ride-share, 8% fee, Reanimated polish | `malachyfernandez/Paper` PR **#3** (core, merged) + PR **#5** (animation polish, open) | PR #5 CI green, open | merge #5 |
| C | **Portfolio tiles + live demos** for both apps | `malachyfernandez/malachyfernandez.github.io` PR **#5** | built, open | merge + enable Pages |
| D | **paper-base** — clean starter repo (all systems, no app content) | pushed as branch `paper-base-snapshot` on `malachyfernandez/Paper` | built | create the new repo from it |
| E | **Custom subdomain** for the ReceiptVault demo (`receipts.malachyf.com`) | DNS (Porkbun / your registrar) | not done | add DNS + CNAME |

Links:
- Paper PR #4 (ReceiptVault): https://github.com/malachyfernandez/Paper/pull/4
- Paper PR #5 (FairRide polish): https://github.com/malachyfernandez/Paper/pull/5
- Paper PR #3 (FairRide core, already merged): https://github.com/malachyfernandez/Paper/pull/3
- Portfolio PR #5 (tiles + demos): https://github.com/malachyfernandez/malachyfernandez.github.io/pull/5

> All Paper CI (Vercel) is green on PR #4 and PR #5 as of writing.

---

## 1. Merge the PRs

```bash
# ReceiptVault (Paper #4) and FairRide polish (Paper #5)
gh pr merge 4 --repo malachyfernandez/Paper --squash --delete-branch
gh pr merge 5 --repo malachyfernandez/Paper --squash --delete-branch

# Portfolio tiles + live demos
gh pr merge 5 --repo malachyfernandez/malachyfernandez.github.io --squash --delete-branch
```

If #4 and #5 conflict on merge (both touch `app/components/MainPage.tsx` app-mode
switch and `THINGS-TO-DO.md`), merge #4 first, then rebase #5:
```bash
git -C Paper fetch origin
git -C Paper checkout devin/1782792000-fairride-reanimated
git -C Paper rebase origin/main         # resolve MainPage.tsx: keep BOTH the `receipts` and `fairride` app modes
git -C Paper push --force-with-lease
```
Only ONE `THINGS-TO-DO.md` should exist after merges — this file. If a merge
re-introduces another, delete the extra.

---

## 2. Run Paper (both apps) locally — needs the project env vars

```bash
cd Paper
npm install

# .env.local — get real values from the Convex + Clerk dashboards:
cat > .env.local <<'EOF'
EXPO_PUBLIC_CONVEX_URL=<from Convex dashboard>
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=<from Clerk dashboard>
EOF

npx convex dev        # terminal 1 — pushes convex/ functions (receipts.ts, fairride.ts, etc.)
npx expo start --web  # terminal 2 — opens http://localhost:8081
```
On the Paper home screen you'll see **"ReceiptVault →"** and **"FairRide →"** buttons.

---

## 3. ReceiptVault specifics (PR #4)

### 3a. What's built
- Types `types/receipts.ts`; currency utils `utils/currencyConversion.ts`
  (`convertToHome`, `convertBetween`, `formatMoney`; JPY/KRW are whole-number).
- App in `app/components/receipts/`: `ReceiptVaultMainPage.tsx` + screens
  (Groups, GroupDetail, AddReceipt, ReceiptDetail, Insights, Settings) + shared
  components (GroupCard, ReceiptCard, CategoryPill, CurrencyPicker, MoneyText,
  PhotoPickerButton, ReceiptImageView, SpendBar, StatTile).
- **Client-side AI scan**: `app/components/receipts/services/openRouterAI.ts` +
  `app/components/receipts/shared/ScanningOverlay.tsx` (animated loading).
- Convex: `convex/receipts.ts` (`getGroupBreakdown`, `getAccountBreakdown`).
- Standalone mock (no Clerk/Convex): `receiptvault-mock/index.html`.

### 3b. Data model → userVariables
| Data | Hook / key | Notes |
|------|-----------|-------|
| Profile | `useUserVariable` key `receipts_userData` | private |
| Settings | `useUserVariable` key `receipts_settings` | home currency + rates |
| OpenRouter key | `useUserVariable` key `receipts_openrouter_key` | **private, per-user** |
| Groups | `useUserList` key `receipt_groups` | `itemId = group.id` |
| Receipts | `useUserList` key `receipt_items` | `itemId = receipt.id`, `filterKey = groupId` |

Rates are stored as **units of currency per 1 unit of home currency**
(`rates.JPY = 157.2` ⇒ `1 USD = 157.2 JPY`). All conversion is client-side.

### 3c. OpenRouter AI scan — how it works / what you may want to change
- The user pastes their **own** OpenRouter API key (stored privately in
  `receipts_openrouter_key`). The client base64-encodes the receipt photo and
  POSTs directly to OpenRouter's vision endpoint; the JSON reply auto-fills
  merchant / amount / currency / category / date / purpose.
- Model used: `google/gemini-2.0-flash-001` (cheap + vision). Change in
  `openRouterAI.ts` if you prefer another vision model.
- No server key is stored anywhere — it's BYO-key by design. Nothing to provision.

### 3d. Real photo upload (optional, for cross-device persistence)
`PhotoPickerButton` currently returns the local/blob URI from `expo-image-picker`.
Pipe the picked file through the repo's existing UploadThing setup
(`app/components/ui/imageUpload/` + `utils/imageCompression.ts`) and store the
hosted URL in `receipt.image.url`.

### 3e. Live FX rates (optional)
Rates are entered manually in Settings. To auto-refresh, fetch
open.er-api.com / exchangerate.host (free, no key) and write into
`receipts_settings.exchangeRates` + `lastRatesUpdate`.

### 3f. Open the mock (no setup)
```bash
cd Paper/receiptvault-mock && python3 -m http.server 8090   # http://localhost:8090/
```

---

## 4. FairRide specifics (PR #3 core + PR #5 polish)

### 4a. What's built
- 8% platform fee (vs Uber ~25%), drivers keep 92%, demand capped at 1.3× (no surge).
- Rider (7 screens) + Driver (6 screens) + 9 shared components, in
  `app/components/fairride/`. Pricing engine `utils/fairridePricing.ts`,
  Convex `convex/fairride.ts` (nearby drivers via Haversine, demand analytics).
- **PR #5 Reanimated polish**: new primitives
  `shared/PressableScale.tsx` (springy press) and `shared/EnterView.tsx`
  (staggered `FadeInDown` entrances); pulsing map pin in `MapPlaceholder.tsx`;
  springy `RatingStars` + `RideTypeSelector`; screen-level `FadeIn` transitions.
- Standalone mock: `fairride-mock/index.html`.

### 4b. Open the mock (no setup)
```bash
cd Paper/fairride-mock && python3 -m http.server 8080   # http://localhost:8080/
```

### 4c. Not built (UI only — wire up if you want real transactions)
- **Payments**: payment-method UI exists; there's no real Stripe charge. To make
  it real, add Stripe (PaymentIntents) + a Convex action holding the secret key.
- **Live driver location / maps**: `MapPlaceholder` is a styled placeholder. Swap
  in `react-native-maps` (native) / a web map lib and feed real coordinates.

---

## 5. Portfolio tiles + live demos (github.io PR #5)

### 5a. What's built
- New **"Full-Stack React Native Apps"** section in `config/projects.js` with
  **ReceiptVault** + **FairRide** tiles (cover images in `cover-images/`).
- Self-contained live demos copied into the Pages site:
  `ReceiptVault/index.html` (+ `demo-receipt.jpg`) and `FairRide/index.html`.
  After merge they're live at:
  - https://malachyfernandez.github.io/ReceiptVault/
  - https://malachyfernandez.github.io/FairRide/
- "GitHub" buttons link to the Paper source subfolders; "Try It Live" links to
  the demos above.

### 5b. Confirm GitHub Pages is serving
The repo `malachyfernandez.github.io` is a user Pages site (no build step, no CI).
After merging PR #5, confirm Pages is enabled:
```bash
gh api repos/malachyfernandez/malachyfernandez.github.io/pages 2>/dev/null || echo "Pages not enabled"
# If not enabled: Settings → Pages → Source = Deploy from branch, main / (root)
```
Give it ~1 min, then hard-refresh the two demo URLs.

---

## 6. Custom subdomain for the ReceiptVault demo (`receipts.malachyf.com`)

> **Assumption Devin made:** you host `malachyf.com` DNS at your registrar
> (Porkbun — "prol bun") and want the ReceiptVault demo on a subdomain.
> Change the subdomain name below if you prefer something else.

GitHub Pages allows **one** custom domain per repo (via a `CNAME` file), and it
applies to the whole site — you can't point a subdomain at just the
`/ReceiptVault/` path of the main Pages site. So pick ONE approach:

### Option A (recommended, cleanest URL) — dedicated repo for the demo
1. Create a small repo just for the demo and push the mock as its `index.html`:
   ```bash
   mkdir receiptvault-demo && cd receiptvault-demo
   cp ../Paper/receiptvault-mock/index.html ./index.html
   cp ../Paper/receiptvault-mock/demo-receipt.png ./demo-receipt.png   # if referenced
   echo "receipts.malachyf.com" > CNAME
   git init && git add -A && git commit -m "ReceiptVault live demo"
   gh repo create malachyfernandez/receiptvault-demo --public --source=. --push
   ```
   Enable Pages: Settings → Pages → main / (root).
2. **Porkbun DNS** for `malachyf.com`: add a **CNAME**
   - Host/Name: `receipts`
   - Answer/Target: `malachyfernandez.github.io`  (note: apex would need A records, but a subdomain uses CNAME)
   - TTL: default
3. In the `receiptvault-demo` repo → Settings → Pages → Custom domain =
   `receipts.malachyf.com`, tick **Enforce HTTPS** once the cert provisions
   (a few minutes).
4. Update the portfolio tile "Try It Live" link to `https://receipts.malachyf.com`
   in `config/projects.js` (currently points at the github.io path).

### Option B (no new repo) — keep the path URL
Skip the subdomain and just use https://malachyfernandez.github.io/ReceiptVault/ .
Do NOT add a `CNAME` to the main `malachyfernandez.github.io` repo unless you want
`malachyf.com` to take over your entire portfolio site.

(If you also want `fairride.malachyf.com`, repeat Option A with a `fairride-demo` repo.)

---

## 7. Create the `paper-base` starter repo (deliverable D)

Devin built a clean fork of Paper with **all the systems and none of the app
content** (no FairRide / ReceiptVault / math demo). It's pushed as the branch
**`paper-base-snapshot`** on the Paper repo (the Devin GitHub App can't create new
repos, so you finish this step).

What's inside: the `userVariables` layer (`useUserVariable` / `useUserList*`
hooks + Convex backend), Clerk auth, Uniwind styling, Reanimated animation
primitives, the component-first architecture, a minimal notes demo showing the
subscribe-don't-prop-drill pattern, a rewritten `README.md`, and a
**`GETTING-STARTED.md`** explaining the system + how to build a new app on it.

Create the repo from the snapshot:
```bash
# From a scratch dir
git clone --branch paper-base-snapshot --single-branch \
  https://github.com/malachyfernandez/Paper.git paper-base
cd paper-base

# Start clean history (optional but recommended for a template repo)
rm -rf .git
git init && git add -A && git commit -m "Initial commit: Paper Base"

# Create the GitHub repo and push
gh repo create malachyfernandez/paper-base --public --source=. --push
```
Then read `paper-base/GETTING-STARTED.md` — it's the per-repo onboarding doc.
Consider marking the repo a **Template** (Settings → check "Template repository")
so future threads can spin off from it in one click.

Sanity check it builds:
```bash
cd paper-base && npm install
npx tsc --noEmit    # a few pre-existing errors in hooks/ carry over from Paper; app compiles
npx expo start --web
```

---

## 8. Final verification checklist

- [ ] Paper PR #4 merged; PR #5 merged (FairRide animates on web).
- [ ] `npx expo start --web` on Paper opens both apps from the home screen.
- [ ] ReceiptVault: create a group, add a receipt, JPY→USD total converts; paste an
      OpenRouter key and "Scan with AI" auto-fills from a photo.
- [ ] Portfolio PR #5 merged; both tiles show; both "Try It Live" demos load.
- [ ] `receipts.malachyf.com` resolves + HTTPS (if you did §6 Option A).
- [ ] `malachyfernandez/paper-base` repo exists, installs, and runs.
- [ ] Exactly ONE `THINGS-TO-DO.md` in the Paper repo (this one).

---

## 9. Decisions Devin made autonomously (change if you disagree)
- **ReceiptVault**: default home currency USD; one `groupId` per receipt (switch to
  `groupIds: string[]` in `types/receipts.ts` for multi-group); client-side
  conversion so offline/manual rates always work; AI scan is BYO-OpenRouter-key,
  model `google/gemini-2.0-flash-001`.
- **FairRide**: 8% fee / 92% driver / 1.3× demand cap; payments + live maps are UI
  placeholders (see §4c).
- **Subdomain**: assumed `receipts.malachyf.com` via a dedicated demo repo (§6A),
  because Pages custom domains are per-repo/whole-site.
- **paper-base**: kept a tiny notes demo to illustrate the subscription pattern
  rather than shipping a totally empty app.
