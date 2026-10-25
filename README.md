# $DRIFT stats page

A live burn tracker for $DRIFT on Pangea. A GitHub job reads Pangea's numbers about every
10 minutes and saves them in `data/`; GitHub Pages shows `index.html`.

## Setup (once)
1. Create a free GitHub account, then a new **public** repo (e.g. `drift`).
2. Upload everything in this folder (keep the `.github` folder; it holds the scheduled job).
3. Repo **Settings → Pages** → Source: "Deploy from a branch", Branch: `main`, folder `/ (root)` → Save.
   Your page: `https://<your-username>.github.io/drift/`
4. Repo **Settings → Actions → General** → Workflow permissions: "Read and write" → Save.

## After you launch the coin
1. Find its slug: the coin page URL on Pangea is `pangea.trade/app/t/<address>`; the slug is the short name
   Pangea uses (e.g. `drift` or `drift-ab12cd`). Easiest: tell Claude the coin page link.
2. Edit `config.json` on GitHub: set `"slug"`, and `"x"` to your X account link. Commit.
3. **Actions** tab → "update-stats" → **Run workflow** to fill the page right away.
