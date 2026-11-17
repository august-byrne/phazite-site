// SPDX-License-Identifier: AGPL-3.0-or-later
// The home page's motion, all of it led by the page's scroll position: the window's picture at the top stands up, each
// chapter's picture stays in view and moves from one step's place to the next (src/components/Story.astro), and the
// rows of devices slide past (src/components/DeviceStrip.astro). Every frame is worked out from where the page is, so
// scrolling back plays it backwards, and nothing runs while the page holds still.
// A visitor who asked their system for less motion gets none of it: the page is then as it is without scripts, but that
// a click on a step shows its place in the picture.

type View = [x: number, y: number, width: number];

interface Story {
	section: HTMLElement;
	stage: HTMLElement;
	film: HTMLElement;
	shots: HTMLElement[];
	steps: { element: HTMLElement; view: View; image: number }[];
	current: number;
	image: number;
}

const lessMotion = matchMedia('(prefers-reduced-motion: reduce)');
const root = document.documentElement;

const hero = document.querySelector<HTMLElement>('[data-hero]');
const heroShot = hero?.querySelector<HTMLElement>('[data-hero-shot]');
const strips = [...document.querySelectorAll<HTMLElement>('[data-strip]')];
const stories: Story[] = [...document.querySelectorAll<HTMLElement>('[data-story]')].map((section) => ({
	section,
	stage: section.querySelector<HTMLElement>('.stage')!,
	film: section.querySelector<HTMLElement>('[data-film]')!,
	shots: [...section.querySelectorAll<HTMLElement>('[data-shot]')],
	steps: [...section.querySelectorAll<HTMLElement>('[data-step]')].map((element) => ({
		element,
		view: element.dataset.view!.split(' ').map(Number) as View,
		image: Number(element.dataset.image),
	})),
	current: 0,
	image: 0,
}));

// The part of each step's stretch of the scroll that the picture holds still for; it moves on in the rest.
const hold = 0.55;

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const ease = (t: number) => t * t * (3 - 2 * t);
const mix = (from: number, to: number, t: number) => from + (to - from) * t;

// The film is laid out larger than its frame, not scaled, so that the browser draws the picture sharp at every size.
function showView(story: Story, [x, y, width]: View) {
	const size = `${100 / width}%`;
	const { style } = story.film;

	style.width = size;
	style.height = size;
	style.left = `${(-x / width) * 100}%`;
	style.top = `${(-y / width) * 100}%`;
}

function showStep(story: Story, current: number) {
	if (current !== story.current) {
		story.steps[story.current].element.removeAttribute('data-current');
		story.steps[current].element.setAttribute('data-current', '');
		story.current = current;
	}

	const image = story.steps[current].image;
	if (image !== story.image) {
		story.shots[story.image]?.removeAttribute('data-shown');
		story.shots[image]?.setAttribute('data-shown', '');
		story.image = image;
	}
}

// A chapter at a place along its steps: 0 at the first step's start, 1 at the second's, and so on.
function showStory(story: Story, place: number) {
	const last = story.steps.length - 1;
	const index = Math.min(last, Math.floor(place));
	const moved = index < last ? ease(clamp((place - index - hold) / (1 - hold))) : 0;
	const from = story.steps[index].view;
	const to = story.steps[Math.min(last, index + 1)].view;

	showView(story, [mix(from[0], to[0], moved), mix(from[1], to[1], moved), mix(from[2], to[2], moved)]);
	showStep(story, moved >= 0.5 ? index + 1 : index);
	story.steps.forEach((step, at) => step.element.style.setProperty('--fill', clamp(place - at).toFixed(3)));
}

function showFrame() {
	const height = window.innerHeight;

	// Measure everything, then move everything: no layout in between.
	const heroBox = heroShot?.getBoundingClientRect();
	const storyBoxes = stories.map((story) => ({
		section: story.section.getBoundingClientRect(),
		top: parseFloat(getComputedStyle(story.stage).top) || 0,
		stage: story.stage.offsetHeight,
	}));
	const stripBoxes = strips.map((strip) => ({
		section: strip.getBoundingClientRect(),
		stage: strip.querySelector<HTMLElement>('.stage')!,
		rows: [...strip.querySelectorAll<HTMLElement>('[data-row]')].map((row) => ({
			row,
			spare: row.scrollWidth - row.parentElement!.clientWidth,
		})),
	}));

	if (hero && heroBox) {
		// Standing once its middle is at the window's, or its top is under the header where it is taller than the window.
		const standsAt = Math.max(1, window.scrollY + heroBox.top - Math.max(80, (height - heroBox.height) / 2));
		hero.style.setProperty('--hero-p', clamp(0.25 + (0.75 * window.scrollY) / standsAt).toFixed(4));
	}

	stories.forEach((story, at) => {
		const box = storyBoxes[at];
		const through = clamp((box.top - box.section.top) / Math.max(1, box.section.height - box.stage));

		story.section.style.setProperty('--p', through.toFixed(4));
		story.section.style.setProperty('--enter', clamp((height - box.section.top) / (height - box.top)).toFixed(4));
		showStory(story, through * (story.steps.length - 1 + hold));
	});

	stripBoxes.forEach((box) => {
		const top = parseFloat(getComputedStyle(box.stage).top) || 0;
		const through = clamp((top - box.section.top) / Math.max(1, box.section.height - box.stage.offsetHeight));

		box.rows.forEach(({ row, spare }) => {
			row.style.transform = `translate3d(${-ease(through) * Math.max(0, spare)}px, 0, 0)`;
		});
	});
}

// The devices' cards as wide as lets both rows fit under the heading in the window's height, and where even narrow ones
// don't, without their descriptions (pz-short). A pixel off a card's width takes its picture's share off each row's height.
function fitStrips() {
	const rem = parseFloat(getComputedStyle(root).fontSize);
	const narrowest = 13 * rem;

	for (const strip of strips) {
		strip.classList.remove('pz-short');
		strip.style.removeProperty('--card');
		if (lessMotion.matches) continue;

		const stage = strip.querySelector<HTMLElement>('.stage')!;
		const card = strip.querySelector<HTMLElement>('.device')!;
		const picture = card.querySelector('img')!;
		const shape = Number(picture.getAttribute('height')) / Number(picture.getAttribute('width')) || 0.5;
		const rows = strip.querySelectorAll('[data-row]').length;
		const style = getComputedStyle(stage);
		const room = stage.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
		const gaps = parseFloat(style.rowGap) * (stage.children.length - 1);
		const over = () =>
			[...stage.children].reduce((sum, child) => sum + (child as HTMLElement).offsetHeight, gaps) - room;

		for (const short of [false, true]) {
			strip.classList.toggle('pz-short', short);
			strip.style.removeProperty('--card');
			let width = card.offsetWidth;

			for (let pass = 0; pass < 5 && over() > 0 && width > narrowest; pass++) {
				width = Math.max(narrowest, width - over() / (rows * shape));
				strip.style.setProperty('--card', `${Math.floor(width)}px`);
			}

			if (over() <= 0) break;
		}
	}
}

let waiting = false;
function askForFrame() {
	if (waiting || lessMotion.matches) return;
	waiting = true;
	requestAnimationFrame(() => {
		waiting = false;
		showFrame();
	});
}

function setMotion() {
	root.classList.toggle('pz-motion', !lessMotion.matches);
	fitStrips();

	if (lessMotion.matches) {
		// As the page is without scripts.
		hero?.style.removeProperty('--hero-p');
		strips.forEach((strip) => strip.querySelectorAll<HTMLElement>('[data-row]').forEach((row) => (row.style.transform = '')));
		stories.forEach((story) => {
			story.section.style.removeProperty('--enter');
			showStory(story, story.current);
		});
	} else {
		showFrame();
	}
}

// A click on a step: the page scrolls to it, or, with less motion, the picture shows its place at once.
stories.forEach((story) => {
	story.steps.forEach((step, at) => {
		step.element.addEventListener('click', () => {
			if (lessMotion.matches) {
				showStory(story, at);
				return;
			}

			const box = story.section.getBoundingClientRect();
			const top = parseFloat(getComputedStyle(story.stage).top) || 0;
			const through = (at + hold / 2) / (story.steps.length - 1 + hold);
			window.scrollTo({
				top: window.scrollY + box.top - top + through * (box.height - story.stage.offsetHeight),
				behavior: 'smooth',
			});
		});
	});
});

// What comes into view fades up, once.
const arrivals = new IntersectionObserver(
	(entries) => {
		for (const entry of entries) {
			if (entry.isIntersecting) {
				entry.target.classList.add('pz-arrived');
				arrivals.unobserve(entry.target);
			}
		}
	},
	{ rootMargin: '0px 0px -10% 0px' }
);
document.querySelectorAll('[data-arrives]').forEach((element) => arrivals.observe(element));

window.addEventListener('scroll', askForFrame, { passive: true });
window.addEventListener('resize', () => {
	fitStrips();
	askForFrame();
});
window.addEventListener('load', () => {
	fitStrips();
	askForFrame();
});
document.fonts?.ready.then(fitStrips);
lessMotion.addEventListener('change', setMotion);
setMotion();
