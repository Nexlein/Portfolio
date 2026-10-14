/**
 * Home page. Everything is in the HTML already (rendered at build time in every language); this adds the motion
 * and the interactions: nav, hero simulation, the project map on large screens, chart interactions, reveals.
 *
 * To add a project, add a ProjectEntry in src/data/projects.ts: the list, the map, the charts and the counts follow.
 */
import { initAnalytics } from '@/core/analytics';
import { i18n } from '@/core/i18n';
import { localizedPath } from '@/core/translate';
import { PROJECTS, projectPath } from '@/data/projects';
import { initGlide } from '@/ui/glide';
import { prefersReducedMotion } from '@/ui/motion';
import { initNav } from '@/components/Nav/Nav';
import { initHero } from '@/components/Hero/Hero';
import { initNumbers, initPathChart, initPathStory, initReveals } from '@/components/Charts/Charts';
import { MAP_MAX } from './blocks';

/** The map needs room: below this width the plain list is the better view. */
const MAP_MIN_WIDTH = 900;
/** Rows of the list shown at first, and added by each "Show more". */
const LIST_PAGE = 6;
const VIEW_KEY = 'work-view';

const savedView = () => {
    try {
        return localStorage.getItem(VIEW_KEY);
    } catch {
        return null;
    }
};

/**
 * The work section: a map (wide windows) or a list (phones, or by choice), a domain filter for both, and a list
 * that shows a few rows and then "Show more". Without JS every row is in the HTML and nothing is hidden.
 */
function initWork(): void {
    const section = document.querySelector<HTMLElement>('.work');
    const host = section?.querySelector<HTMLElement>('.map-host');
    if (!section || !host) return;
    const list = section.querySelector<HTMLElement>('.project-list')!;
    const rows = [...list.querySelectorAll<HTMLElement>('li')];
    const more = section.querySelector<HTMLElement>('.list-more')!;
    const moreBtn = more.querySelector<HTMLButtonElement>('.more-btn')!;
    const switcher = section.querySelector<HTMLElement>('.work-view')!;
    const chips = [...section.querySelectorAll<HTMLButtonElement>('.query button')];
    const wide = matchMedia(`(min-width: ${MAP_MIN_WIDTH + 1}px)`);

    let domain: string | null = null,
        shown = LIST_PAGE,
        view: 'map' | 'list' = 'list',
        map: { query(d: string | null): void } | undefined,
        mounting: Promise<void> | undefined;

    // ── List: filtered by the domain chip, a page at a time
    const renderList = (reveal = false) => {
        const rowsIn = rows.filter((li) => !domain || li.querySelector('a')!.dataset.domain === domain);
        rows.forEach((li) => {
            const i = rowsIn.indexOf(li);
            const open = i >= 0 && i < shown;
            if (reveal && open && li.hidden) {
                li.style.setProperty('--i', String(i - (shown - LIST_PAGE)));
                li.classList.add('row-in');
            }
            li.hidden = !open;
        });
        const left = rowsIn.length - shown;
        more.hidden = rowsIn.length <= LIST_PAGE;
        moreBtn.textContent =
            left > 0
                ? i18n.t('home.work.showMore').replace('{n}', String(Math.min(LIST_PAGE, left)))
                : i18n.t('home.work.showLess');
    };
    moreBtn.addEventListener('click', () => {
        const left = rows.filter((li) => !domain || li.querySelector('a')!.dataset.domain === domain).length - shown;
        if (left > 0) {
            list.getAnimations().forEach((a) => a.cancel()); // a running one would pin the height being measured
            const from = list.offsetHeight;
            shown += LIST_PAGE;
            renderList(true);
            // The block grows with its rows instead of jumping (the page below follows smoothly)
            if (!prefersReducedMotion())
                list.animate(
                    [
                        { height: `${from}px`, overflow: 'clip' },
                        { height: `${list.offsetHeight}px`, overflow: 'clip' }
                    ],
                    {
                        duration: 420,
                        easing: 'cubic-bezier(0.23, 1, 0.32, 1)'
                    }
                );
        } else {
            shown = LIST_PAGE;
            renderList();
            list.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
        }
    });
    list.addEventListener('animationend', (e) => (e.target as HTMLElement).classList.remove('row-in'));

    // ── Map: loaded the first time it is shown (phones never download the map code)
    const mountMap = (): Promise<void> => {
        mounting ??= import('@/components/NeuralMap/NeuralMap').then(({ mountNeuralMap }) => {
            map = mountNeuralMap(host, MAP_MAX);
            map.query(domain);
        });
        return mounting;
    };

    const show = (next: 'map' | 'list') => {
        view = next;
        section.dataset.view = next;
        switcher
            .querySelectorAll('button')
            .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === next)));
        if (next === 'map') {
            mountMap().catch(() => show('list')); // the code could not load (a stale page after a deploy): the list stays usable
        }
    };

    // ── Which view: the map on wide windows unless the visitor chose the list; the list everywhere else
    const sync = () => {
        const canMap = wide.matches;
        if (canMap) section.dataset.wide = '';
        else delete section.dataset.wide;
        switcher.hidden = !canMap;
        if (!canMap) return show('list');
        if (savedView() === 'list') return show('list');
        // The default map is drawn when its section is about to come into view, not at load: it is hundreds of
        // animated elements and the visitor starts on the hero
        if (map || mounting || view === 'map') return show('map');
        section.dataset.view = 'map';
        const io = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) return;
                io.disconnect();
                if (wide.matches && savedView() !== 'list') show('map');
            },
            { rootMargin: '300px 0px' }
        );
        io.observe(section);
    };
    wide.addEventListener('change', sync);
    switcher.querySelectorAll<HTMLButtonElement>('button').forEach((b) =>
        b.addEventListener('click', () => {
            try {
                localStorage.setItem(VIEW_KEY, b.dataset.view!);
            } catch {
                /* private mode: the choice just lasts until the page is closed */
            }
            show(b.dataset.view as 'map' | 'list');
        })
    );
    section.querySelector<HTMLButtonElement>('.see-all')?.addEventListener('click', () => show('list'));

    // ── A domain chip toggles a filter: on the map its projects stay lit and the others dim, on the list only they
    // remain; the same chip again clears it
    chips.forEach((chip) => {
        chip.setAttribute('aria-pressed', 'false');
        chip.addEventListener('click', () => {
            const on = chip.getAttribute('aria-pressed') !== 'true';
            chips.forEach((c) => c.setAttribute('aria-pressed', String(on && c === chip)));
            domain = on ? chip.dataset.domain! : null;
            shown = LIST_PAGE;
            map?.query(domain);
            renderList();
            if (on && view === 'map')
                host.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
        });
    });

    renderList();
    sync();
}

/** Copy the email address, and say so; if the clipboard is blocked, show the address instead. */
function initCopyEmail(): void {
    const toast = document.querySelector<HTMLElement>('.toast')!;
    let timer = 0;
    document.querySelectorAll<HTMLButtonElement>('.copy-email').forEach((b) =>
        b.addEventListener('click', async () => {
            let message = i18n.t('home.hire.copied');
            try {
                await navigator.clipboard.writeText(b.dataset.email!);
            } catch {
                message = b.dataset.email!;
            }
            toast.textContent = message;
            toast.classList.add('on');
            clearTimeout(timer);
            timer = window.setTimeout(() => toast.classList.remove('on'), 1800);
        })
    );
}

/** A soft light follows the cursor across cards. */
function initSpotlight(): void {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    document.querySelectorAll<HTMLElement>('.feature, .tile, .chart-card').forEach((card) => {
        card.classList.add('spot');
        card.addEventListener('pointermove', (e) => {
            const r = card.getBoundingClientRect();
            card.style.setProperty('--mx', `${e.clientX - r.left}px`);
            card.style.setProperty('--my', `${e.clientY - r.top}px`);
        });
    });
}

/**
 * A #hash link makes the browser scroll as soon as the HTML is parsed, before the script above trims the project list
 * (all rows -> a page) and swaps in the map: the sections below move up and the visitor lands past their target.
 * Scroll to it again once the layout has settled, unless the visitor already moved the page.
 */
function settleHash(): void {
    let id = '';
    try {
        id = decodeURIComponent(location.hash.slice(1));
    } catch {
        return; // a malformed link (#%): nothing to scroll to
    }
    const target = id ? document.getElementById(id) : null;
    if (!target) return;
    let moved = false;
    for (const type of ['wheel', 'touchstart', 'keydown', 'pointerdown'])
        addEventListener(type, () => (moved = true), { once: true, passive: true });
    const again = () => moved || target.scrollIntoView();
    again();
    addEventListener('load', again, { once: true }); // images and fonts can still move things
}

function bootstrap(): void {
    // Old links (/?project=<id>) opened a modal; projects now have their own page
    const linked = PROJECTS.find((p) => p.id === new URLSearchParams(location.search).get('project'));
    if (linked) return location.replace(localizedPath(projectPath(linked.id), i18n.getLang()));

    initAnalytics();
    initNav();
    initGlide();
    initHero();
    initWork();
    initPathChart();
    initPathStory();
    initNumbers();
    initReveals();
    initCopyEmail();
    initSpotlight();
    settleHash();
}

bootstrap();
