// PROTOTYPE — Round 2: A's identity and playable hero, B's learning curve in A's look, C's branches inside sections.
// Two layouts for the projects section: D = grid, E = featured + list.
import './round2.css';
import { PROJECTS, type ProjectEntry } from '@/data/projects';
import { EDUCATION, EXPERIENCES, OFFERS } from '@/data/profile';
import { videoPoster } from '@/ui/video';
import { policyField } from './variant-a';

type Layout = 'grid' | 'featured';
type Domain = ProjectEntry['category'] | 'all';

const DOMAINS: { id: Domain; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'ai', label: 'AI & RL' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'systems', label: 'Systems' },
    { id: 'graphical', label: 'Graphics & sims' },
    { id: 'devops', label: 'DevOps' }
];
const DOMAIN_LABEL = Object.fromEntries(DOMAINS.map((d) => [d.id, d.label]));

/** Prototype-only dates for the curve (same as variant B). */
const WHEN: Record<string, number> = {
    'bia-psc': 2020.6,
    'high-school': 2024.5,
    climb2c: 2025.75,
    hackathons: 2026.0,
    'google-cloud': 2026.3,
    issanka: 2026.75,
    epitech: 2029.5
};
const SHORT: Record<string, string> = {
    'bia-psc': 'BIA & first aid',
    'high-school': 'Bac + Epitech Piscine',
    climb2c: 'RAG intern @ Climb2C',
    hackathons: 'GenAI hackathons',
    'google-cloud': 'Google Cloud certs',
    issanka: 'AI dev @ Issanka',
    epitech: 'Master, expected'
};

const oneLiner = (p: ProjectEntry) => `${p.description.en.split('. ')[0].replace(/\.$/, '')}.`;
const still = (p: ProjectEntry) =>
    p.media.type === 'video'
        ? videoPoster(p.media.src)
        : p.media.type === 'image'
          ? p.media.src
          : p.media.images[0].src;

/** Poster always; a video plays on hover (D) or straight away (featured). */
function media(p: ProjectEntry, autoplay = false): string {
    if (p.media.type !== 'video') return `<div class="vr-media"><img src="${still(p)}" alt="" loading="lazy" /></div>`;
    return `<div class="vr-media"><video muted loop playsinline preload="none" poster="${still(p)}" ${autoplay ? 'autoplay' : 'data-hover'} src="${p.media.src}"></video></div>`;
}

const tags = (p: ProjectEntry, n = 4) =>
    `<div class="vr-tags">${p.tags
        .slice(0, n)
        .map((t) => `<span>${t}</span>`)
        .join('')}</div>`;
const metaLine = (p: ProjectEntry) =>
    `<div class="vr-meta mono"><span>${DOMAIN_LABEL[p.category]}</span><span>${p.year ?? 'Tek2'}</span></div>`;

function grid(list: ProjectEntry[]): string {
    return `<div class="vr-grid">${list
        .map(
            (p) => `<a class="vr-card" href="/projects/${p.id}.html">${media(p)}<div class="vr-card-body">${metaLine(p)}
<h3>${p.title}</h3><p>${oneLiner(p)}</p>${tags(p)}</div></a>`
        )
        .join('')}</div>`;
}

function featured(list: ProjectEntry[]): string {
    const [top, ...rest] = [
        ...list.filter((p) => p.media.type === 'video'),
        ...list.filter((p) => p.media.type !== 'video')
    ];
    if (!top) return '';
    return `<article class="vr-featured">${media(top, true)}<div>${metaLine(top)}<h3>${top.title}</h3><p>${top.description.en}</p>${tags(top, 6)}
<a class="vr-open" href="/projects/${top.id}.html">Open the project →</a></div></article>
<div class="vr-rows">${rest
        .map(
            (
                p
            ) => `<a class="vr-row" href="/projects/${p.id}.html">${media(p)}<div><h4>${p.title}</h4><p>${oneLiner(p)}</p></div>
<span class="mono">${DOMAIN_LABEL[p.category]} · ${p.year ?? 'Tek2'}</span></a>`
        )
        .join('')}</div>`;
}

function curve(): string {
    const W = 1120,
        H = 330,
        X0 = 2020,
        X1 = 2030;
    const x = (year: number) => 40 + ((year - X0) / (X1 - X0)) * (W - 80);
    const byId = new Map([...EXPERIENCES, ...EDUCATION].map((e) => [e.id, e]));
    const ids = Object.keys(WHEN);
    const points = ids.map((id, i) => ({
        id,
        e: byId.get(id)!,
        px: x(WHEN[id]),
        py: H - 50 - (Math.pow(i + 1, 1.25) / Math.pow(ids.length, 1.25)) * (H - 110)
    }));
    const done = points.filter((p) => p.id !== 'epitech');
    const path = done
        .map((p, i) =>
            i === 0
                ? `M ${p.px} ${p.py}`
                : `C ${(done[i - 1].px + p.px) / 2} ${done[i - 1].py} ${(done[i - 1].px + p.px) / 2} ${p.py} ${p.px} ${p.py}`
        )
        .join(' ');
    const last = done[done.length - 1],
        future = points[points.length - 1];
    return `<svg class="vr-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Career as a learning curve, 2020 to 2029">
<g class="grid">${Array.from({ length: X1 - X0 + 1 }, (_, i) => `<line x1="${x(X0 + i)}" y1="20" x2="${x(X0 + i)}" y2="${H - 30}" />`).join('')}</g>
${Array.from({ length: X1 - X0 + 1 }, (_, i) => `<text x="${x(X0 + i)}" y="${H - 10}" text-anchor="middle">${X0 + i}</text>`).join('')}
<path class="projection" d="M ${last.px} ${last.py} L ${future.px} ${future.py}" /><path class="run" d="${path}" />
${points
    .map((p, i) => {
        const up = i % 2 === 0,
            dx = up ? -10 : 10,
            anchor = up ? 'end' : 'start';
        return `<g class="cp" transform="translate(${p.px} ${p.py})"><circle r="6" />
<text class="title" x="${dx}" y="${up ? -14 : 22}" text-anchor="${anchor}">${SHORT[p.id]}</text>
<text x="${dx}" y="${up ? -29 : 37}" text-anchor="${anchor}">${p.e.period.en}</text></g>`;
    })
    .join('')}</svg>`;
}

function offer(id: 'full-time' | 'freelance'): string {
    const o = OFFERS.find((x) => x.id === id)!;
    return `<div class="vr-offer"><div><h3>${o.title.en}</h3><p class="mono">${o.summary.en}</p>
<a class="vr-cta" href="mailto:nielsen.combe-bracciale@epitech.eu">Email me</a><a class="vr-cta ghost" href="/cv.pdf">CV (PDF)</a></div>
<dl>${o.rows.map((r) => `<dt class="mono">${r.label.en}</dt><dd>${r.value.en}<br /><span class="mono">${r.note.en.replace(/<br \/>/g, ' ')}</span></dd>`).join('')}</dl></div>`;
}

function branches(group: string, items: { id: string; label: string; count?: number }[], active: string): string {
    return `<div class="vr-branches" role="group" data-group="${group}">${items
        .map(
            (b) =>
                `<button type="button" data-id="${b.id}" aria-pressed="${b.id === active}">${b.label}${b.count !== undefined ? `<span>${b.count}</span>` : ''}</button>`
        )
        .join('')}</div>`;
}

const count = (d: Domain) => (d === 'all' ? PROJECTS.length : PROJECTS.filter((p) => p.category === d).length);

function mountRound2(root: HTMLElement, layout: Layout): void {
    root.innerHTML = `
<div class="vr">
  <header class="vr-top"><span class="mono">NIELSEN COMBE-BRACCIALE</span>
    <nav><a href="#work">Work</a><a href="#path">Path</a><a href="#hire">Hire</a></nav></header>
  <section class="vr-hero">
    <canvas aria-label="Value iteration: arrows point toward the cursor, which is the reward. Click to add or remove walls."></canvas>
    <div class="vr-thesis"><h1>I build agents that <em>decide</em> and learn.</h1>
      <p class="mono">value iteration · γ = 0.95 · reward = your cursor · click to add walls</p></div>
  </section>

  <section class="vr-section" id="path"><div class="vr-head"><h2>The run so far</h2><span class="mono">every checkpoint shipped or earned</span></div>${curve()}</section>

  <section class="vr-section" id="work"><div class="vr-head"><h2>Work</h2>${branches(
      'domain',
      DOMAINS.map((d) => ({ id: d.id, label: d.label, count: count(d.id) })).filter((d) => d.count > 0),
      'all'
  )}</div><div class="vr-projects"></div></section>

  <section class="vr-section" id="hire"><div class="vr-head"><h2>Work with me</h2>${branches(
      'offer',
      [
          { id: 'full-time', label: "I'm hiring an intern" },
          { id: 'freelance', label: 'I have a freelance project' }
      ],
      'full-time'
  )}</div><div class="vr-offer-out">${offer('full-time')}</div></section>

  <footer class="vr-contact"><a href="mailto:nielsen.combe-bracciale@epitech.eu">Email</a><a href="https://github.com/Nexlein">GitHub</a>
    <a href="https://www.linkedin.com/in/nielsen-combebracciale/">LinkedIn</a><a href="/cv.pdf">CV (PDF)</a></footer>
</div>`;

    policyField(root.querySelector('canvas')!);

    const projects = root.querySelector<HTMLElement>('.vr-projects')!;
    const showDomain = (d: Domain) => {
        const list = d === 'all' ? PROJECTS : PROJECTS.filter((p) => p.category === d);
        projects.innerHTML = layout === 'grid' ? grid(list) : featured(list);
        projects.querySelectorAll<HTMLVideoElement>('video[data-hover]').forEach((v) => {
            const card = v.closest('a')!;
            card.addEventListener('mouseenter', () => void v.play().catch(() => {}));
            card.addEventListener('mouseleave', () => v.pause());
        });
    };
    showDomain('all');

    root.querySelectorAll<HTMLElement>('.vr-branches').forEach((group) => {
        group.addEventListener('click', (e) => {
            const btn = (e.target as HTMLElement).closest('button');
            if (!btn) return;
            group.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
            if (group.dataset.group === 'domain') showDomain(btn.dataset.id as Domain);
            else root.querySelector('.vr-offer-out')!.innerHTML = offer(btn.dataset.id as 'full-time' | 'freelance');
        });
    });

    // Draw the curve when it scrolls into view
    const chart = root.querySelector('.vr-chart')!;
    new IntersectionObserver(
        (entries, obs) => {
            if (entries[0].isIntersecting) {
                chart.classList.add('drawn');
                chart
                    .querySelectorAll<SVGGElement>('.cp')
                    .forEach((g, i) => (g.style.transitionDelay = `${0.3 + i * 0.25}s`));
                obs.disconnect();
            }
        },
        { threshold: 0.3 }
    ).observe(chart);
}

export const variantD = (root: HTMLElement) => mountRound2(root, 'grid');
export const variantE = (root: HTMLElement) => mountRound2(root, 'featured');
