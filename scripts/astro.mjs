// SPDX-License-Identifier: AGPL-3.0-or-later
// Runs Astro's command line (node scripts/astro.mjs build) with its telemetry off, so that building the site sends
// nothing about who builds it, on any computer or in CI.

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const astro = path.join(site, 'node_modules', 'astro', 'bin', 'astro.mjs');

const result = spawnSync(process.execPath, [astro, ...process.argv.slice(2)], {
	cwd: site,
	stdio: 'inherit',
	env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
});
process.exit(result.status ?? 1);
