// PROTOTYPE — Round 11 (N) "premium": the whole home page rebuilt around the neural map, minimal and Apple-like.
// Quiet chrome, big two-tone type, one accent (amber) reserved for activity. "What brings you here?" is gone:
// two actions in the hero, a query control on the map, two tiles at the end.
import './premium.css';
import './round12.css';
import { clusters, countUp, distinctSkills, mountPathChart, radar, stacked, topSkills } from './charts';
import { EDUCATION, EXPERIENCES, OFFERS } from '@/data/profile';
import { PROJECTS, projectPath } from '@/data/projects';
import { DOMAIN_LABEL, oneLiner } from './round2';
import { mountBrain } from './brain';
import { ICONS } from './space';
import { policyField } from './variant-a';

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Short checkpoint names for the path (prototype copy; the real build would add them to profile.ts). */
const CHECKPOINT: Record<string, string> = {
    'bia-psc': 'Aeronautics & first aid',
    'high-school': 'Baccalauréat, maths & CS',
    epitech: 'Epitech',
    climb2c: 'Full-stack & AI intern',
    hackathons: 'Hackathons & security',
    'google-cloud': 'Google Cloud certified',
    issanka: 'AI developer, Issanka'
};

function path(): string {
    const byId = new Map<string, { period: string }>([
        ...EXPERIENCES.map((e) => [e.id, { period: e.period.en }] as const),
        ...EDUCATION.map((e) => [e.id, { period: e.id === 'epitech' ? '2024 – 2029' : e.period.en }] as const)
    ]);
    const steps = ['bia-psc', 'high-school', 'epitech', 'climb2c', 'hackathons', 'google-cloud', 'issanka']; // by start date, ending on now
    return `<ol class="vn-path">${steps
        .map(
            (id, i) =>
                `<li${i === steps.length - 1 ? ' class="now"' : ''}><span class="dot" aria-hidden="true"></span>
<span class="when">${byId.get(id)?.period ?? ''}</span><span class="what">${CHECKPOINT[id]}</span></li>`
        )
        .join('')}</ol>`;
}

function tiles(): string {
    return OFFERS.map(
        (o) => `<article class="vn-tile">
<p class="vn-eyebrow">${o.id === 'full-time' ? 'Internship' : 'Freelance'}</p>
<h3>${o.title.en}</h3><p class="vn-tile-lede">${o.summary.en}</p>
<dl>${o.rows.map((r) => `<div><dt>${r.label.en}</dt><dd>${r.value.en}</dd></div>`).join('')}</dl>
<a class="vn-link" href="mailto:nielsen.combe-bracciale@epitech.eu">${o.id === 'full-time' ? 'Discuss an internship' : 'Ask for a quote'} <span aria-hidden="true">›</span></a>
</article>`
    ).join('');
}

function list(): string {
    return `<ul class="vn-list">${PROJECTS.map(
        (
            p
        ) => `<li><a href="${projectPath(p.id)}"><span class="ico"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[p.category]}</svg></span>
<span class="txt"><strong>${p.title}</strong><span>${oneLiner(p)}</span></span><span class="chev" aria-hidden="true">›</span></a></li>`
    ).join('')}</ul>`;
}

const THEMES = [
    { id: 'dark', name: 'Midnight', swatch: ['#05070d', '#f5a524'] },
    { id: 'light', name: 'Daylight', swatch: ['#fbfbfd', '#c26d00'] }
];

function bento(): string {
    const n = distinctSkills();
    return `<div class="vo-bento">
  <article class="vo-card"><p class="vo-k">Coverage</p><p class="vo-v"><span class="count" data-to="5">5</span> domains</p>${radar()}</article>
  <article class="vo-card"><p class="vo-k">Languages</p><p class="vo-v">Main language, by period</p>${stacked()}</article>
  <article class="vo-card"><p class="vo-k">Most used</p><p class="vo-v"><span class="count" data-to="${n}">${n}</span> distinct skills</p>${topSkills()}</article>
  <article class="vo-card wide"><p class="vo-k">Clusters</p><p class="vo-v">Projects placed by shared skills: close points have more in common</p>${clusters()}</article>
</div>`;
}

export const variantN = (root: HTMLElement) => mountPremium(root, false);
export const variantO = (root: HTMLElement) => mountPremium(root, true);

function mountPremium(root: HTMLElement, r12: boolean): void {
    const used = new Set<string>(PROJECTS.map((p) => p.category));
    const domains = ['ai', 'systems', 'architecture', 'graphical', 'devops'].filter((d) => used.has(d));
    root.innerHTML = `
<div class="vn${r12 ? ' vo' : ''}">
  <header class="vn-nav"><a class="vn-name" href="#top">Nielsen Combe-Bracciale</a>
    <nav>${r12 ? '<span class="vo-ind" aria-hidden="true"></span>' : ''}<a href="#work">Work</a><a href="#path">Path</a>${r12 ? '<a href="#numbers">Numbers</a>' : ''}<a href="#hire">Hire</a>${
        r12
            ? `<div class="vo-themes"><button type="button" class="vo-theme-btn" aria-expanded="false" aria-label="Choose a theme"><span class="sw"></span></button>
      <div class="vo-pop" role="menu">${THEMES.map((t) => `<button type="button" role="menuitemradio" data-theme-id="${t.id}"><span class="sw2"><i style="background:${t.swatch[0]}"></i><i style="background:${t.swatch[1]}"></i></span>${t.name}</button>`).join('')}</div></div>`
            : ''
    }<a class="vn-pill" href="/cv.pdf">CV</a></nav></header>

  <section class="vn-hero" id="top">
    <canvas aria-label="Value iteration: arrows point toward the cursor, which is the reward. Click to add or remove walls."></canvas>
    <div class="vn-hero-copy vn-reveal">
      <p class="vn-eyebrow">AI &amp; C++ engineer · Epitech</p>
      <h1>Software that learns.<br /><span>And decides.</span></h1>
      <p class="vn-lede">I build reinforcement-learning agents, simulations and the systems that run them. Currently an AI developer at Issanka.</p>
      <div class="vn-actions"><a class="vn-btn" href="#work">See the work</a><a class="vn-link" href="#hire">Hire me <span aria-hidden="true">›</span></a></div>
    </div>
    <p class="vn-hint">Live value iteration. Your cursor is the reward. Click to place a wall.</p>
  </section>

  <section class="vn-section" id="work">
    <div class="vn-head vn-reveal"><h2>${PROJECTS.length} projects.<br /><span>One network.</span></h2>
      <p>Projects connect where they share skills.<span class="vn-desk"> Hover one to see what it lights up, or ask the network.</span></p>
      <div class="vn-query" role="group" aria-label="Light up a domain">${domains
          .map((d) => `<button type="button" data-domain="${d}">${DOMAIN_LABEL[d]}</button>`)
          .join('')}</div></div>
    <div class="vn-map"></div>
    ${list()}
  </section>

  <section class="vn-section" id="path">
    <div class="vn-head vn-reveal"><h2>The path so far.<br /><span>Every checkpoint earned.</span></h2></div>
    ${r12 ? '<div class="vo-path"></div>' : path()}
  </section>
${
    r12
        ? `  <section class="vn-section" id="numbers">
    <div class="vn-head vn-reveal"><h2>By the numbers.<br /><span>Computed, not claimed.</span></h2>
      <p>Every chart below is calculated from the projects themselves.</p></div>
    ${bento()}
  </section>`
        : ''
}

  <section class="vn-section" id="hire">
    <div class="vn-head vn-reveal"><h2>Two ways<br /><span>to work together.</span></h2></div>
    <div class="vn-tiles vn-reveal">${tiles()}</div>
  </section>

  <footer class="vn-foot"><span>Nielsen Combe-Bracciale</span>
    <nav><a href="mailto:nielsen.combe-bracciale@epitech.eu">Email</a><a href="https://github.com/Nexlein">GitHub</a>
    <a href="https://www.linkedin.com/in/nielsen-combebracciale/">LinkedIn</a><a href="/cv.pdf">CV</a></nav></footer>
</div>`;

    policyField(root.querySelector('canvas')!);

    const map = root.querySelector<HTMLElement>('.vn-map')!;
    mountBrain(map);

    // Ask the network: the chosen domain's projects fire and the activation spreads
    root.querySelectorAll<HTMLButtonElement>('.vn-query button').forEach((b) =>
        b.addEventListener('click', () => {
            map.dispatchEvent(new CustomEvent('nm-query', { detail: b.dataset.domain }));
            map.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'center' });
        })
    );

    // Section heads and the path reveal once, as they arrive
    const io = new IntersectionObserver(
        (entries) =>
            entries.forEach((e) => {
                if (!e.isIntersecting) return;
                e.target.classList.add('in');
                io.unobserve(e.target);
            }),
        { rootMargin: '0px 0px -12% 0px' }
    );
    root.querySelectorAll('.vn-reveal, .vn-path').forEach((n) => io.observe(n));
    if (r12) motion(root);
}

/** Round 12: chart path, bento reveals, headline lines, hero parallax, nav indicator, spotlight, theme picker. */
function motion(root: HTMLElement): void {
    const still = reduceMotion();
    mountPathChart(root.querySelector('.vo-path')!);

    // Reveal targets: charts, cards; count-ups and bar widths start when seen
    const seen = new IntersectionObserver(
        (entries) =>
            entries.forEach((e) => {
                if (!e.isIntersecting) return;
                const n = e.target as HTMLElement;
                n.classList.add('in');
                n.querySelectorAll<HTMLElement>('.count').forEach(countUp);
                n.querySelectorAll<HTMLElement>('.fill').forEach((f) => f.style.setProperty('--w', f.dataset.w!));
                seen.unobserve(n);
            }),
        { rootMargin: '0px 0px -15% 0px' }
    );
    root.querySelectorAll('.vo-path, .vo-card').forEach((n) => seen.observe(n));
    root.querySelectorAll<SVGGElement>('.vo-scatter .pt').forEach((g, i) => (g.style.transitionDelay = `${i * 35}ms`));
    root.querySelectorAll<HTMLElement>('.vo-bars li').forEach((li, i) => li.style.setProperty('--i', String(i)));

    // Headlines: each line slides up from behind a mask
    root.querySelectorAll('.vn h1, .vn h2').forEach((h) => {
        h.innerHTML = h.innerHTML
            .split(/<br\s*\/?>/)
            .map((part) => `<span class="ln"><span>${part}</span></span>`)
            .join('');
    });

    // Hero: the field recedes and the words lift away as you scroll
    const hero = root.querySelector<HTMLElement>('.vn-hero')!,
        canvas = hero.querySelector('canvas')!,
        copy = hero.querySelector<HTMLElement>('.vn-hero-copy')!;
    let ticking = false;
    window.addEventListener(
        'scroll',
        () => {
            if (still || ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                const p = Math.min(1, scrollY / hero.offsetHeight);
                canvas.style.transform = `translateY(${p * 90}px) scale(${1 + p * 0.06})`;
                copy.style.transform = `translateY(${p * -50}px)`;
                copy.style.opacity = String(1 - p * 1.15);
                ticking = false;
            });
        },
        { passive: true }
    );

    // Nav: a soft pill slides to the hovered link and rests on the section in view
    const nav = root.querySelector<HTMLElement>('.vn-nav nav')!,
        ind = nav.querySelector<HTMLElement>('.vo-ind')!;
    const links = [...nav.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')];
    let active: HTMLAnchorElement | null = null;
    const moveTo = (a: HTMLAnchorElement | null) => {
        ind.style.opacity = a ? '1' : '0';
        if (!a) return;
        ind.style.width = `${a.offsetWidth + 24}px`;
        ind.style.transform = `translateX(${a.offsetLeft - 12}px)`;
    };
    links.forEach((a) => a.addEventListener('pointerenter', () => moveTo(a)));
    nav.addEventListener('pointerleave', () => moveTo(active));
    const spy = new IntersectionObserver(
        (entries) =>
            entries.forEach((e) => {
                if (!e.isIntersecting) return;
                active = links.find((a) => a.hash === `#${e.target.id}`) ?? null;
                links.forEach((a) => a.classList.toggle('on', a === active));
                if (!nav.matches(':hover')) moveTo(active);
            }),
        { rootMargin: '-45% 0px -50% 0px' }
    );
    root.querySelectorAll('section[id]').forEach((s) => spy.observe(s));

    // Spotlight: a soft light follows the cursor across cards and tiles
    root.querySelectorAll<HTMLElement>('.vo-card, .vn-tile').forEach((c) =>
        c.addEventListener('pointermove', (e) => {
            const r = c.getBoundingClientRect();
            c.style.setProperty('--mx', `${e.clientX - r.left}px`);
            c.style.setProperty('--my', `${e.clientY - r.top}px`);
        })
    );

    // Theme picker: data-driven, so adding a theme is one entry + one CSS block
    const wrap = root.querySelector<HTMLElement>('.vo-themes')!,
        btn = wrap.querySelector<HTMLButtonElement>('.vo-theme-btn')!;
    const sync = () =>
        wrap
            .querySelectorAll<HTMLButtonElement>('[data-theme-id]')
            .forEach((b) =>
                b.setAttribute('aria-checked', String(b.dataset.themeId === document.documentElement.dataset.theme))
            );
    const setOpen = (open: boolean) => {
        wrap.classList.toggle('open', open);
        btn.setAttribute('aria-expanded', String(open));
    };
    btn.addEventListener('click', () => setOpen(!wrap.classList.contains('open')));
    wrap.querySelectorAll<HTMLButtonElement>('[data-theme-id]').forEach((b) =>
        b.addEventListener('click', () => {
            document.documentElement.dataset.theme = b.dataset.themeId;
            sessionStorage.setItem('proto-theme', b.dataset.themeId!);
            window.dispatchEvent(new Event('proto-theme'));
            sync();
            setOpen(false);
        })
    );
    document.addEventListener('pointerdown', (e) => !wrap.contains(e.target as Node) && setOpen(false));
    window.addEventListener('keydown', (e) => e.key === 'Escape' && setOpen(false));
    sync();
}
