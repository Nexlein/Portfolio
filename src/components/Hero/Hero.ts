import { i18n } from '@/core/i18n';
import { prefersReducedMotion } from '@/ui/motion';
import { runSim, SIMS } from './sims';

/**
 * Hero: a live simulation behind the words (a random one per visit, "↻" for the next), and a gentle exit as
 * the page scrolls (the field recedes, the words lift away).
 */
export function initHero(): void {
    const hero = document.querySelector<HTMLElement>('.hero');
    if (!hero) return;
    const hint = hero.querySelector<HTMLElement>('.hero-hint')!,
        pager = hero.querySelector<HTMLElement>('.hero-pager')!,
        copy = hero.querySelector<HTMLElement>('.hero-copy')!;
    let current = Math.floor(Math.random() * SIMS.length);
    let stop: (() => void) | undefined;
    // Scroll progress is a layout read: measure it once, and again when the window changes
    let height = hero.offsetHeight;
    let field = hero.querySelector('canvas')!;

    // One dot per simulation: the lit one is running, the others switch to it
    const dots = SIMS.map((sim, index) => {
        const dot = document.createElement('button');
        const label = i18n.t(`home.hero.sims.${sim.id}.name`);
        dot.type = 'button';
        dot.className = 'hero-dot';
        dot.title = label;
        dot.setAttribute('aria-label', label);
        dot.addEventListener('click', () => index !== current && show((current = index), true));
        pager.append(dot);
        return dot;
    });

    const show = (index: number, swap: boolean) => {
        const old = field;
        const canvas = swap ? document.createElement('canvas') : old;
        canvas.className = 'hero-field';
        canvas.dataset.sim = SIMS[index].id;
        if (swap) {
            canvas.classList.add('incoming');
            canvas.setAttribute('aria-hidden', 'true');
            canvas.style.transform = old.style.transform;
            old.replaceWith(canvas);
            requestAnimationFrame(() => canvas.classList.remove('incoming'));
        }
        stop?.();
        stop = runSim(index, canvas);
        field = canvas;
        dots.forEach((dot, k) => dot.setAttribute('aria-pressed', String(k === index)));
        hint.textContent = i18n.t(`home.hero.sims.${SIMS[index].id}.hint`);
    };
    initCue(hero);
    show(current, false);
    pager.hidden = false;

    if (prefersReducedMotion()) return;
    rotateTitle(hero);
    let ticking = false;
    let progress = 0;
    window.addEventListener('resize', () => (height = hero.offsetHeight), { passive: true });
    window.addEventListener(
        'scroll',
        () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                const p = Math.min(1, scrollY / height);
                ticking = false;
                if (p === 1 && progress === 1) return; // already scrolled away: nothing left to move
                progress = p;
                field.style.transform = `translateY(${p * 90}px) scale(${1 + p * 0.06})`;
                copy.style.transform = `translateY(${p * -50}px)`;
                copy.style.opacity = String(1 - p * 1.15);
            });
        },
        { passive: true }
    );
}

/** The title's second line cycles through a few ways to finish the sentence (not while the tab is hidden or the hero is scrolled away). */
function rotateTitle(hero: HTMLElement): void {
    const line = hero.querySelector<HTMLElement>('[data-i18n="home.hero.title2"]');
    if (!line) return;
    const keys = ['title2', 'title2b', 'title2c'];
    let index = 0;
    window.setInterval(() => {
        if (document.hidden || scrollY > hero.offsetHeight / 2) return;
        line.classList.add('cycling', 'out');
        window.setTimeout(() => {
            index = (index + 1) % keys.length;
            line.textContent = i18n.t(`home.hero.${keys[index]}`);
            line.classList.remove('out');
        }, 450);
    }, 4200);
}

/** The scroll cue fades out as the visitor starts to scroll. */
function initCue(hero: HTMLElement): void {
    const cue = hero.querySelector<HTMLElement>('.scroll-cue');
    if (!cue) return;
    window.addEventListener(
        'scroll',
        () => {
            cue.style.opacity = String(Math.max(0, 1 - scrollY / 120));
        },
        { passive: true }
    );
}
