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
import { initNav } from '@/components/Nav/Nav';
import { initHero } from '@/components/Hero/Hero';
import { initNumbers, initPathChart, initReveals } from '@/components/Charts/Charts';
import { MAP_MAX } from './blocks';

/** The map needs room: below this width the plain list is the better view. */
const MAP_MIN_WIDTH = 900;

async function initWork(): Promise<void> {
    const section = document.querySelector<HTMLElement>('.work');
    const host = section?.querySelector<HTMLElement>('.map-host');
    if (!section || !host || innerWidth <= MAP_MIN_WIDTH) return;
    // Loaded here, not at the top: phones never download the map code
    const { mountNeuralMap } = await import('@/components/NeuralMap/NeuralMap');
    section.classList.add('has-map');
    const map = mountNeuralMap(host, MAP_MAX);

    section.querySelectorAll<HTMLButtonElement>('.query button').forEach((b) =>
        b.addEventListener('click', () => {
            map.query(b.dataset.domain!);
            host.scrollIntoView({
                behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
                block: 'center'
            });
        })
    );

    const list = section.querySelector<HTMLElement>('.project-list')!;
    section.querySelector<HTMLButtonElement>('.see-all')?.addEventListener('click', (e) => {
        const button = e.currentTarget as HTMLButtonElement;
        const open = list.classList.toggle('open');
        button.setAttribute('aria-expanded', String(open));
        button.textContent = i18n.t(open ? 'home.work.hideAll' : 'home.work.seeAll');
    });
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

/** Path and Numbers share a section: a switch shows one panel at a time (without JS both are on the page). */
function initPathTabs(): void {
    const buttons = document.querySelectorAll<HTMLButtonElement>('.path-tabs button');
    const show = (name: string) => {
        buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.panel === name)));
        buttons.forEach(
            (b) => (document.getElementById(`panel-${b.dataset.panel}`)!.hidden = b.dataset.panel !== name)
        );
    };
    buttons.forEach((b) => b.addEventListener('click', () => show(b.dataset.panel!)));
    const numbers = location.hash === '#numbers'; // old links to the Numbers section
    show(numbers ? 'numbers' : 'path');
    if (numbers) document.getElementById('path')?.scrollIntoView();
}

function bootstrap(): void {
    // Old links (/?project=<id>) opened a modal; projects now have their own page
    const linked = PROJECTS.find((p) => p.id === new URLSearchParams(location.search).get('project'));
    if (linked) return location.replace(localizedPath(projectPath(linked.id), i18n.getLang()));

    initAnalytics();
    initNav();
    initGlide();
    initHero();
    void initWork();
    initPathTabs();
    initPathChart();
    initNumbers();
    initReveals();
    initCopyEmail();
    initSpotlight();
}

bootstrap();
