// SPDX-License-Identifier: AGPL-3.0-or-later
// What the site's pages share: addresses within the site, the latest release as its update file says, and Phazite's
// places on GitHub.

import data from '../generated/release.json';

export interface Release {
	version: string;
	notes: string;
	installer: string;
	fileName: string;
	size: number;
	sha256: string;
}

export const repository = 'https://github.com/august-byrne/Phazite';

const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/';

/** An address within the site, from its path below the site's root: withBase('download/'). */
export function withBase(path: string) {
	return base + path.replace(/^\//, '');
}

/** The latest release, or null while there is none. */
export function getRelease(): Release | null {
	return (data as { release: Release | null }).release;
}

/** A size in bytes as the Download page shows it: "8.1 MB". */
export function formatSize(bytes: number) {
	return `${(bytes / 1_000_000).toFixed(1)} MB`;
}
