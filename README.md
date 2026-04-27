# The QLC Live Scoring

A mobile-first Ryder Cup-style scoring site for the QLC: Jailbirds vs Zookeepers.

## What this includes

- Public leaderboard
- Mobile score-entry page
- Commissioner/admin correction page
- Supabase realtime sync
- Front nine for sessions 1 and 3
- Back nine for sessions 2 and 4
- Half adjusted handicap, playing off the low side
- Manual stroke overrides
- X score option for forfeited player balls or team holes

## Local setup

1. Install Node.js if you do not have it.
2. In Terminal:

```bash
cd qlc-live-scoring
npm install
npm run dev
```

3. Open the local URL Vite prints, usually:

```text
http://localhost:5173
```

Without Supabase env variables, the app falls back to browser local storage.

## Supabase setup

1. Create a new Supabase project.
2. Go to **SQL Editor**.
3. Paste and run `supabase/schema.sql`.
4. Go to **Project Settings > API**.
5. Copy:
   - Project URL
   - anon public key
6. Create a local `.env` file:

```bash
cp .env.example .env
```

7. Fill in:

```text
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

8. Restart local dev server:

```bash
npm run dev
```

## Vercel deployment

1. Push this folder to GitHub.
2. Import the GitHub repo into Vercel.
3. In Vercel, add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy.

## Useful URLs

- `/` or `#/board` — leaderboard
- `#/score` — choose a match to score
- `#/score/sat-am-1` — direct scorer link for one match
- `#/admin` — commissioner admin

## Match IDs

Session 1:
- `sat-am-1` — Josh & Rij vs Spencer & Howie
- `sat-am-2` — Cramer & Michael vs Larry & Wolf
- `sat-am-3` — Marshall & Jake vs Zach & Kaelan
- `sat-am-4` — Bernie vs Ziv

Session 2:
- `sat-pm-1` — Michael vs Spencer
- `sat-pm-2` — Rij & Jake vs Howie & Wolf
- `sat-pm-3` — Cramer & Marshall vs Zach & Ziv
- `sat-pm-4` — Josh & Bernie vs Kaelan & Larry

Session 3:
- `sun-am-1` — Cramer & Jake vs Howie & Larry
- `sun-am-2` — Bernie & Marshall vs Spencer & Wolf
- `sun-am-3` — Michael & Rij vs Kaelan & Ziv
- `sun-am-4` — Josh vs Zach

Session 4:
- `sun-pm-1` — Jake vs Wolf
- `sun-pm-2` — Cramer vs Howie
- `sun-pm-3` — Bernie vs Ziv
- `sun-pm-4` — Rij vs Kaelan
- `sun-pm-5` — Marshall vs Larry
- `sun-pm-6` — Josh & Michael vs Zach & Spencer
