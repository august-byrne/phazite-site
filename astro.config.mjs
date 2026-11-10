// SPDX-License-Identifier: AGPL-3.0-or-later
// Phazite's website: Astro with Starlight, served by GitHub Pages at august-byrne.github.io/phazite-site/. With a
// domain of its own one day, `site` becomes it and `base` becomes '/'.

import { satteri } from '@astrojs/markdown-satteri';
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import { guideLinks } from './src/plugins/guide-links.mjs';

const site = 'https://august-byrne.github.io';
const base = '/phazite-site';

export default defineConfig({
	site,
	base,
	trailingSlash: 'always',
	devToolbar: { enabled: false },
	markdown: {
		processor: satteri({ mdastPlugins: [guideLinks({ base, contentRoot: './src/content/docs' })] }),
	},
	integrations: [
		starlight({
			title: 'Phazite',
			description: 'A free, open-source DAW for making beats and finishing songs.',
			logo: { src: './src/generated/logo.svg', alt: '' },
			favicon: '/favicon.svg',
			social: [{ icon: 'github', label: 'Phazite on GitHub', href: 'https://github.com/august-byrne/Phazite' }],
			customCss: ['@fontsource-variable/inter', './src/styles/theme.css'],
			// The guide is written in the Phazite repository; the site's own pages say where they are.
			editLink: { baseUrl: 'https://github.com/august-byrne/Phazite/edit/main/docs/' },
			// src/pages/404.astro is the site's own: Starlight's has a hero, which would be the home page's.
			disable404Route: true,
			// Starlight puts the base in front of these.
			sidebar: [
				{ label: 'Download', link: '/download/' },
				{ label: 'Guide', items: [{ autogenerate: { directory: 'guide' } }] },
				{ label: 'About', slug: 'about' },
			],
			head: [
				{ tag: 'meta', attrs: { property: 'og:image', content: `${site}${base}/social-preview.png` } },
				{ tag: 'meta', attrs: { property: 'og:image:alt', content: "Phazite's logo and its window" } },
			],
			components: {
				Header: './src/components/Header.astro',
				Hero: './src/components/Hero.astro',
				SocialIcons: './src/components/HeaderLinks.astro',
				Footer: './src/components/Footer.astro',
				// Dark until a visitor picks a theme, as Phazite opens dark.
				ThemeProvider: './src/components/ThemeProvider.astro',
				ThemeSelect: './src/components/ThemeSelect.astro',
			},
		}),
	],
});
