// SPDX-License-Identifier: AGPL-3.0-or-later
// The guide is written in the Phazite repository (docs/guide), where its links are relative, so that they work on
// GitHub too: [Troubleshooting](troubleshooting.md), [Building Phazite](../building.md). On the site, a link to another
// page of the guide goes to that page, and a link to anything else in the repository goes to it on GitHub.
// A Sätteri plugin (Astro's Markdown processor), made for each page of the guide and for nothing else.

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repository = 'https://github.com/august-byrne/Phazite/blob/main/';

/** @param {{ base: string, contentRoot: string }} options */
export function guideLinks({ base, contentRoot }) {
	const root = path.resolve(contentRoot);
	const guide = path.join(root, 'guide');
	const home = base.endsWith('/') ? base : base + '/';

	return ({ fileURL }) => {
		const source = fileURL ? fileURLToPath(fileURL) : '';
		if (!source.startsWith(guide + path.sep)) return null;

		return {
			name: 'phazite-guide-links',
			link(node, context) {
				const url = rewrite(node.url, source);
				if (url !== node.url) context.setProperty(node, 'url', url);
			},
		};
	};

	function rewrite(url, source) {
		if (/^[a-z][a-z0-9+.-]*:|^#|^\//i.test(url)) return url;

		const [target, hash] = url.split('#');
		const resolved = path.resolve(path.dirname(source), decodeURIComponent(target));
		const fromRoot = path.relative(root, resolved).split(path.sep).join('/');
		const anchor = hash ? '#' + hash : '';

		if (resolved.startsWith(guide + path.sep) && /\.mdx?$/.test(resolved)) {
			const page = fromRoot.replace(/\.mdx?$/, '').replace(/(^|\/)index$/, '');
			return home + page + '/' + anchor;
		}
		// The guide's folder is the repository's docs/guide, so what is above it is in the repository too.
		return repository + path.posix.normalize('docs/' + fromRoot) + anchor;
	}
}
