# Phazite's website

The website of [Phazite](https://github.com/august-byrne/Phazite), a free, open-source DAW: what it is, its download, and its user guide. It is published at https://august-byrne.github.io/phazite-site/.

It is built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build), in the app's own colors, font (Inter) and icons (Lucide), and published by GitHub Pages. It sets no cookies, has no analytics, loads nothing from other sites, and builds with Astro's telemetry off.

## Where things come from

The Phazite repository stays the one source of what the site shows about the app. Before each build, `scripts/sync.mjs` copies from it:

| From Phazite | What the site does with it |
|---|---|
| `docs/guide/` | The user guide's pages. Edit them there: a change to Phazite updates its page in the same commit. |
| `docs/images/phazite.png` | The window's picture on the home page. |
| `docs/images/social-preview.png` | The picture other sites show for a link to this one. |
| `resources/logo/phazite.svg` | The logo and the browser tab's icon. |
| `resources/licenses/notices.json` | What Phazite is built with, on the About page. |
| `resources/icons/lucide/` | The icons. |

Then it reads `phazite-update.json` from Phazite's latest release (the file Phazite's own update check reads) for the Download page: the installer's address, size and SHA-256. While there is no release, the page says how to build Phazite.

This repository holds the rest: the home, Download, About and missing-page pages (`src/pages/`, `src/content/docs/about.mdx`), the components they share (`src/components/`), the theme (`src/styles/theme.css`, from the app's `DesignTokens.h`), and the plug-in that turns the guide's relative links into the site's or GitHub's (`src/plugins/guide-links.mjs`).

## Building it

You need [Node.js](https://nodejs.org) 26 or newer (`winget install OpenJS.NodeJS.LTS` on Windows) and the Phazite repository beside this one (`../Phazite`), or its folder in `PHAZITE_DIR`.

```sh
npm ci            # installs the exact versions in package-lock.json, running no package's scripts (.npmrc)
npm run build     # copies from Phazite, builds the site into dist/, and checks every link within it
npm run preview   # serves dist/ at http://localhost:4321/phazite-site/
npm run dev       # or: a server that rebuilds as you edit
```

A build fails if a link within the site leads nowhere (`scripts/check-links.mjs`), if a licence's text is missing from the About page, or if the latest release's update file isn't as Phazite writes it.

## Publishing

`.github/workflows/deploy.yml` builds the site and publishes it on GitHub Pages on every push to `main`, every day (for the guide's changes and a new release), and by hand (Actions > Deploy > Run workflow). It takes the guide from the latest release's tag, so that it describes what the installer does, or from Phazite's `main` while there is no release. Its actions are pinned to full commit hashes, as in the Phazite repository.

With a domain of its own one day: set `site` to it and `base` to `/` in `astro.config.mjs`, and `base` in `scripts/check-links.mjs`, add the domain in the repository's Pages settings, verify it in the account's settings, and turn on Enforce HTTPS. GitHub sends the old address on to the new one.

## License

The site's code and text are licensed under the [GNU Affero General Public License, version 3 or later](LICENSE), as Phazite is. What it is built with is listed, with each license's text, on its About page.
