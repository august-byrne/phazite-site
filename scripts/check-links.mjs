// SPDX-License-Identifier: AGPL-3.0-or-later
// Checks the built site (dist) for links within it that lead nowhere: every href and src that starts with the site's
// base must name a page or a file the build wrote, and every #anchor on a page of the site an id on it. Links to other
// sites aren't fetched.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(site, 'dist');
const base = '/phazite-site/';

const pages = new Map(); // a page's path within the site ("guide/faq/") to its HTML
for (const file of walk(dist)) {
	if (file.endsWith('.html')) pages.set(toSitePath(file), readFileSync(file, 'utf8'));
}

const problems = [];
for (const [page, html] of pages) {
	for (const [, , link] of html.matchAll(/\s(href|src)="([^"]+)"/g)) {
		if (!link.startsWith(base) && !link.startsWith('#')) continue;

		const [target, anchor] = (link.startsWith('#') ? '/' + base.slice(1) + page + link : link).split('#');
		const within = decodeURI(target.slice(base.length));
		const file = path.join(dist, within);
		const exists = within === '' || within.endsWith('/') ? existsSync(path.join(file, 'index.html')) : existsSync(file);

		if (!exists) {
			problems.push(`${base}${page}: ${link} leads nowhere`);
		} else if (anchor && pages.has(within) && !pages.get(within).includes(`id="${anchor}"`)) {
			problems.push(`${base}${page}: ${link} has no #${anchor} there`);
		}
	}
}

if (problems.length > 0) {
	console.error(`check-links: ${problems.length} broken links:\n  ${problems.join('\n  ')}`);
	process.exit(1);
}
console.log(`check-links: every link within the site leads somewhere (${pages.size} pages).`);

function* walk(folder) {
	for (const name of readdirSync(folder)) {
		const file = path.join(folder, name);
		if (statSync(file).isDirectory()) yield* walk(file);
		else yield file;
	}
}

function toSitePath(file) {
	const relative = path.relative(dist, file).split(path.sep).join('/');
	return relative === 'index.html' ? '' : relative.replace(/index\.html$/, '');
}
