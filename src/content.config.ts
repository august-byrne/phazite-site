// SPDX-License-Identifier: AGPL-3.0-or-later
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';
import { defineCollection } from 'astro:content';

export const collections = {
	docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
	// The site is in English alone; Starlight looks for this collection all the same.
	i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
};
