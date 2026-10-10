# EverySpool

![EverySpool](brand/mark.png)

How many spools do I need? A free calculator for 3D printing: add your prints (grams or meters), pick a spool size, and see how many spools to buy, what's left over, and what it costs.

**Live site:** https://everyspool.com

## Features
- Multiple prints with a per-print breakdown
- Meters-to-grams conversion for 14 materials at 1.75 or 2.85 mm
- Spool sizes from 250 g to 5 kg, or a custom size
- Waste buffer and filament already on hand
- Cost to buy and cost of filament actually used
- Shareable links, remembered settings, dark mode

## How this project runs on GitHub

| Job | GitHub tool |
|---|---|
| Write code | Codespaces (full editor in the browser) or press `.` in the repo for a quick edit |
| Store code and history | This repo |
| Test every change | GitHub Actions runs `npm test` on every push and pull request |
| Publish the site | GitHub Actions deploys to GitHub Pages when tests pass on `main` |
| Collect feedback | Issues, with forms for features, materials, and wrong results |
| Plan the roadmap | GitHub Projects board linked to the issues |
| Keep tools up to date | Dependabot |
| Donations | `FUNDING.yml` adds a Sponsor button to the repo |

## First-time setup
1. Create a **public** repo named `everyspool` and upload everything in this folder (including the hidden `.github` folder).
2. Go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Go to the **Actions** tab. The first run tests and deploys the site; it's live in a minute or two.
4. Edit `assets/app.js` → the `SITE` block at the top: your repo name, tip link, and affiliate tag. Set any link to `""` to hide its button.
5. Edit `.github/FUNDING.yml` and the name in `LICENSE`.

## Making changes
1. On the repo page, click **Code → Codespaces → Create codespace on main**.
2. In the Terminal, run `python3 -m http.server 3000` and open the preview.
3. Run `npm test` in the terminal to check the math.
4. Commit and push. Actions tests it and, if everything passes, updates the live site.

For bigger changes, make a branch and open a pull request. Tests run on the pull request, and the site only updates after you merge.

## Files
- `index.html`: the page
- `assets/style.css`: look and layout
- `assets/materials.js`: filament densities (the easiest thing for others to contribute)
- `assets/calc.js`: all the math
- `assets/app.js`: connects the page to the math, plus site settings
- `tests/calc.test.js`: checks the math and the materials list

## Brand
Everything is in `brand/`.
- `mark.svg`, `mark-dark.svg`, `mark-mono.svg`: the two-spool mark (mono takes the text color, for stickers or engraving)
- `app-icon.svg`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`: app and home-screen icons
- `favicon.svg`, `favicon.ico`, `favicon-32.png`: browser tab icons
- `wordmark.png`, `wordmark-dark.png`, `og-image.png`: made by the **Render brand images** action (below)

Colors: ink `#172030`, cobalt `#2F6FE4`, marigold `#F4B400`, magenta `#D6336C`, teal `#0FA3A3`. Font: Bricolage Grotesque Bold.

The wordmark and link-preview image need the Bricolage Grotesque font, so a GitHub Action renders them: after your first upload, go to **Actions → Render brand images → Run workflow**. It commits the PNGs and redeploys the site. It also reruns automatically whenever you edit the templates in `brand/src/`.

## Custom domain (Cloudflare)
1. Buy `everyspool.com` at **Cloudflare → Domain Registration**.
2. In **Settings → Pages → Custom domain**, enter `everyspool.com` and save.
3. In Cloudflare **DNS**, add these records, each set to **DNS only** (grey cloud, not orange). GitHub can't issue your HTTPS certificate through Cloudflare's proxy.
   - Four `A` records for `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - One `CNAME` for `www` pointing to `YOURNAME.github.io`
4. Back in **Settings → Pages**, wait for the DNS check to pass, then turn on **Enforce HTTPS**.
5. Set up email forwarding for `hello@everyspool.com` under **Cloudflare → Email → Email Routing**.

## Analytics (GoatCounter)
1. Sign up at goatcounter.com and pick a site code (e.g. `everyspool`).
2. Replace `YOURCODE` in `index.html` and `privacy.html`.
3. Clicks on "Shop spools," "Copy share link," and "Buy me a spool" are counted automatically as events.

## Amazon Associates
Apply once the site is live and getting some visits, because Amazon generally closes accounts without 3 qualifying sales within 180 days of approval. Until then, leave `shopUrl` as `""` in `assets/app.js`, which hides the shop button and disclosure. After approval, paste your search link with your tag. The required disclosure is already on the page and in `privacy.html`.

## Roadmap
Tracked as issues on the Projects board. v1 is the manual calculator; launch steps are in [LAUNCH.md](LAUNCH.md). Next:
- [ ] G-code upload that reads filament use automatically (the "big launch" feature)
- [ ] Electricity and print-time cost
- [ ] Spool inventory tracker
- [ ] More languages
