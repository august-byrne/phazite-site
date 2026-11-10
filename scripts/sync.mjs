// SPDX-License-Identifier: AGPL-3.0-or-later
// Brings in what the site shows from the Phazite repository, which stays the one source of it: the user guide
// (docs/guide), the window's picture and the share card (docs/images), the logo, the notices of what Phazite is built
// with (resources/licenses/notices.json) and the Lucide icons the app uses. Then it reads the update file of Phazite's
// latest release, the one Phazite's own update check reads, for the Download page.
// PHAZITE_DIR names the repository's folder: ../Phazite, beside this one, unless it says otherwise.

import { existsSync } from 'node:fs';
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const phazite = path.resolve(site, process.env.PHAZITE_DIR ?? '../Phazite');
const releases = 'https://github.com/august-byrne/Phazite/releases';

const copies = [
	['docs/guide', 'src/content/docs/guide'],
	['docs/images/phazite.png', 'src/generated/phazite.png'],
	['resources/logo/phazite.svg', 'src/generated/logo.svg'],
	['resources/licenses/notices.json', 'src/generated/notices.json'],
	['resources/icons/lucide', 'src/generated/lucide'],
	['resources/logo/phazite.svg', 'public/favicon.svg'],
	['docs/images/social-preview.png', 'public/social-preview.png'],
];

for (const [from] of copies) {
	if (!existsSync(path.join(phazite, from))) {
		fail(`there is no ${from} in ${phazite}. Set PHAZITE_DIR to the Phazite repository's folder.`);
	}
}

for (const [from, to] of copies) {
	const target = path.join(site, to);
	await rm(target, { recursive: true, force: true });
	await mkdir(path.dirname(target), { recursive: true });
	await cp(path.join(phazite, from), target, { recursive: true });
}

const release = await readLatestRelease();
await writeFile(
	path.join(site, 'src/generated/release.json'),
	JSON.stringify({ release }, null, '\t') + '\n'
);
console.log(
	`sync: copied the guide, pictures, logo, notices and icons from ${phazite}; ` +
		(release ? `the latest release is ${release.version}.` : 'there is no release yet.')
);

// The latest release's update file, checked as Phazite checks it (src/services/Updates.cpp), or null while there is no
// release. Offline, a build on this computer goes on as if there were none; a build in CI stops.
async function readLatestRelease() {
	let response;
	try {
		response = await fetch(`${releases}/latest/download/phazite-update.json`);
	} catch (error) {
		if (process.env.CI) fail(`the latest release's update file couldn't be read: ${error.message}`);
		console.warn(`sync: offline (${error.message}), so the Download page says there is no release.`);
		return null;
	}

	if (response.status === 404) return null;
	if (!response.ok) fail(`the latest release's update file answered ${response.status}.`);

	const file = await response.json();
	const version = String(file.version ?? '');
	const windows = file.windows ?? {};
	const download = `${releases}/download/v${version}/`;

	if (file.app !== 'Phazite') fail("the update file isn't Phazite's.");
	if (!/^\d+\.\d+\.\d+$/.test(version)) fail(`the update file's version, "${version}", isn't one.`);
	if (file.notes !== `${releases}/tag/v${version}`) fail("the update file's notes aren't its release's page.");
	if (typeof windows.installer !== 'string' || !windows.installer.startsWith(download))
		fail("the update file's installer isn't in its release.");
	if (!Number.isInteger(windows.size) || windows.size <= 0) fail("the update file's size isn't one.");
	if (!/^[0-9a-f]{64}$/.test(String(windows.sha256))) fail("the update file's SHA-256 isn't one.");

	return {
		version,
		notes: file.notes,
		installer: windows.installer,
		fileName: windows.installer.slice(download.length),
		size: windows.size,
		sha256: windows.sha256,
	};
}

function fail(message) {
	console.error(`sync: ${message}`);
	process.exit(1);
}
