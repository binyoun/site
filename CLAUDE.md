# site

binyoun.com, Bin Youn's portfolio. Plain HTML/CSS/JS, no build step, no
package.json, no npm. Everything runs as static files.

## Data flow

`index.html` renders from `data/*.json` (`artist.json`, `bio.json`,
`educator.json`, `researcher.json`) via `js/render.js` and `js/main.js`, into
themed sections referred to in the CSS/JS as "islands" (see `css/islands.css`,
`js/nav.js`).

`sync_vault.py` regenerates those JSON files from frontmatter in the Obsidian
vault (`~/Documents/Obsidian Vault`). It preserves sections it can't derive
from the vault (poem, exhibitions, workshops), so it's safe to re-run anytime.
Use `python3 sync_vault.py --dry-run` to preview before writing.

Run this after editing Works/Research/Teaching notes in the vault if the site
should reflect them; nothing on the site writes back to the vault.

## Deploy

GitHub Pages serves directly from the `main` branch root. The `CNAME` file
pins the custom domain (binyoun.com); don't remove or relocate it. There is no
`docs/` folder, no `gh-pages` branch, and no build artifacts to copy: commit
and push to `main` is the entire deploy step.

## Conventions

- No em-dashes in any generated copy (site text, bio, statements).
- Images live in `image/`, named by work title (e.g. `sacredtree.gif`,
  `otherisland.gif`); GLB assets sit at repo root (`model7.glb`).
- CSS is split by concern: `base.css`, `hero.css`, `nav.css`, `islands.css`,
  `sections.css`. Match that split rather than adding one-off inline styles.
