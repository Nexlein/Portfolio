// PROTOTYPE — Round 11 (N) "premium": the whole home page rebuilt around the neural map, minimal and Apple-like.
// Quiet chrome, big two-tone type, one accent (amber) reserved for activity. "What brings you here?" is gone:
// two actions in the hero, a query control on the map, two tiles at the end.
import './premium.css';
import './round12.css';
import './round13.css';
import './round14.css';
import {
    clusters,
    countUp,
    distinctSkills,
    donut,
    learnedThisYear,
    mountPathChart,
    newSkills,
    radar,
    stacked,
    topSkills
} from './charts';
import { EDUCATION, EXPERIENCES, OFFERS } from '@/data/profile';
import { PROJECTS, projectPath } from '@/data/projects';
import { DOMAIN_LABEL, oneLiner, still } from './round2';
import { mountBrain } from './brain';
import { ICONS } from './space';
import { SIMS } from './sims';

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

function tiles(r13: boolean): string {
    return OFFERS.map(
        (o) => `<article class="vn-tile">
<p class="vn-eyebrow">${o.id === 'full-time' ? 'Internship' : 'Freelance'}</p>
<h3>${o.title.en}</h3><p class="vn-tile-lede">${o.summary.en}</p>
<dl>${o.rows
            .filter((r) => !r13 || r.label.en !== 'Recruiter Info') // pay details belong on the CV / availability page
            .map((r) => `<div><dt>${r.label.en}</dt><dd>${r.value.en}</dd></div>`)
            .join('')}</dl>
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

const face = (k: string, v: string, body: string, show = false) =>
    `<div class="face${show ? ' show' : ''}"><p class="vo-k">${k}</p><p class="vo-v">${v}</p>${body}</div>`;
const count = (n: number) => `<span class="count" data-to="${n}">${n}</span>`;

/** A card with one or more faces; with several, they take turns (round 13). */
function card(faces: string[], wide = false): string {
    const dots =
        faces.length > 1
            ? `<div class="vo-dots" role="group" aria-label="Chart">${faces.map((_, i) => `<button type="button" aria-label="Chart ${i + 1}" aria-pressed="${i === 0}"></button>`).join('')}</div>`
            : '';
    return `<article class="vo-card${wide ? ' wide' : ''}"><div class="vo-faces">${faces.join('')}</div>${dots}</article>`;
}

function bento(r13: boolean, r14 = false): string {
    const n = distinctSkills(),
        domains = new Set(PROJECTS.map((p) => p.category)).size,
        fresh = learnedThisYear();
    const more = (...faces: string[]) => (r13 ? faces : []);
    return `<div class="vo-bento">
  ${card([face('Coverage', `${count(domains)} domains`, radar(), true), ...more(face('Periods', `${count(PROJECTS.length)} projects, by period`, donut()))])}
  ${card([face('Languages', 'Main language, by period', stacked(), true), ...more(face('Growth', 'New skills, by period', newSkills()))])}
  ${card([face('Most used', `${count(n)} distinct skills`, topSkills(), true), ...more(face('This year', `${count(fresh.count)} new skills in 12 months`, fresh.html))])}
  ${r14 ? '' : card([face('Clusters', 'Projects placed by shared skills: close points have more in common', clusters(), true)], true)}
</div>`;
}

/** Real project titles reused for the stress test (?stress): 40 projects in total. */
function stress(): void {
    if (!new URLSearchParams(location.search).has('stress') || PROJECTS.some((p) => p.id.includes('-stress'))) return;
    const years = ['Tek1', 'Tek2', 'Personal'] as const;
    const base = [...PROJECTS];
    for (let k = 0; PROJECTS.length < 40; k++) {
        const p = base[k % base.length];
        PROJECTS.push({
            ...p,
            id: `${p.id}-stress${k}`,
            title: `${p.title} ${['II', 'III', 'IV'][Math.floor(k / base.length)]}`,
            year: years[k % 3]
        });
    }
}

const FEATURED = ['starttrek', 'raytracer', 'codename'];

function gallery(): string {
    return `<div class="vp-gallery" tabindex="-1">${FEATURED.map((id) => PROJECTS.find((p) => p.id === id)!)
        .map(
            (p, i) => `<a class="vp-slide${i === 0 ? ' active' : ''}" href="${projectPath(p.id)}">
<span class="media"><img src="${still(p)}" alt="" loading="lazy" /></span>
<span class="body"><span class="vn-eyebrow">${DOMAIN_LABEL[p.category]}</span><strong>${p.title}</strong><span class="lede">${oneLiner(p)}</span>
<span class="tags">${p.tags.slice(0, 4).join(' · ')}</span><span class="vn-link">Open project <span aria-hidden="true">›</span></span></span>
<span class="vp-progress" aria-hidden="true"><span></span></span></a>`
        )
        .join('')}</div>
<div class="vp-controls"><div class="vp-gdots">${FEATURED.map((_, i) => `<button type="button" aria-label="Project ${i + 1}" aria-pressed="${i === 0}"></button>`).join('')}</div>
<button type="button" class="vp-play" aria-label="Pause the slideshow">Pause</button></div>`;
}

function experience(): string {
    return `<ul class="vp-exp">${EXPERIENCES.map(
        (
            e
        ) => `<li><span class="when">${e.period.en}</span><span class="what"><strong>${e.title.en.replace(' (Part-Time)', '')}${e.org ? ` · ${e.org}` : ''}</strong>
<span>${e.summary.en.split('. ')[0].replace(/\.$/, '')}.</span></span></li>`
    ).join('')}</ul>`;
}

export const variantN = (root: HTMLElement) => mountPremium(root, 11);
export const variantO = (root: HTMLElement) => mountPremium(root, 12);
export const variantP = (root: HTMLElement) => mountPremium(root, 13);
export const variantQ = (root: HTMLElement) => mountPremium(root, 14);

function mountPremium(root: HTMLElement, level: 11 | 12 | 13 | 14): void {
    const r12 = level >= 12,
        r13 = level >= 13,
        r14 = level === 14;
    const talk = `<div class="vn-actions"><button type="button" class="vn-btn vp-copy" data-email="nielsen.combe-bracciale@epitech.eu">Copy email</button>
      <a class="vn-link" href="https://www.linkedin.com/in/nielsen-combebracciale/">LinkedIn <span aria-hidden="true">›</span></a>
      <a class="vn-link" href="/cv.pdf">CV <span aria-hidden="true">›</span></a></div>
      <p class="vp-mail mono">nielsen.combe-bracciale@epitech.eu</p>`;
    if (r13) stress();
    const sim = r13 ? Math.floor(Math.random() * SIMS.length) : 0;
    const used = new Set<string>(PROJECTS.map((p) => p.category));
    const domains = ['ai', 'systems', 'architecture', 'graphical', 'devops'].filter((d) => used.has(d));
    root.innerHTML = `
<div class="vn${r12 ? ' vo' : ''}${r14 ? ' vq' : ''}">
  <header class="vn-nav"><a class="vn-name" href="#top">Nielsen<span class="vp-last"> Combe-Bracciale</span></a>
    <nav>${r12 ? '<span class="vo-ind" aria-hidden="true"></span>' : ''}<a href="#work">Work</a><a href="#path">Path</a>${r12 ? '<a href="#numbers">Numbers</a>' : ''}<a href="#hire">Hire</a>${r13 ? '<span class="vp-lang"><a aria-current="true">EN</a><a href="/fr/">FR</a></span>' : ''}${
        r12
            ? `<div class="vo-themes"><button type="button" class="vo-theme-btn" aria-expanded="false" aria-label="Choose a theme"><span class="sw"></span></button>
      <div class="vo-pop" role="menu">${THEMES.map((t) => `<button type="button" role="menuitemradio" data-theme-id="${t.id}"><span class="sw2"><i style="background:${t.swatch[0]}"></i><i style="background:${t.swatch[1]}"></i></span>${t.name}</button>`).join('')}</div></div>`
            : ''
    }<a class="vn-pill" href="/cv.pdf">CV</a></nav></header>

  <section class="vn-hero" id="top">
    <canvas aria-label="Value iteration: arrows point toward the cursor, which is the reward. Click to add or remove walls."></canvas>
    <div class="vn-hero-copy vn-reveal">
      ${r13 ? '<a class="vp-avail" href="#hire"><span class="live" aria-hidden="true"></span>Open to an internship · Mar – Aug</a>' : ''}
      <p class="vn-eyebrow">AI &amp; C++ engineer · Epitech</p>
      <h1>Software that learns.<br /><span>And decides.</span></h1>
      <p class="vn-lede">I build reinforcement-learning agents, simulations and the systems that run them. Currently an AI developer at Issanka.</p>
      <div class="vn-actions"><a class="vn-btn" href="#work">See the work</a><a class="vn-link" href="#hire">Hire me <span aria-hidden="true">›</span></a></div>
    </div>
    <p class="vn-hint">Live ${SIMS[sim].name.toLowerCase()}. ${SIMS[sim].hint}</p>
    ${r13 ? `<button type="button" class="vp-sim" aria-label="Show another simulation"><span aria-hidden="true">↻</span><span class="name">${SIMS[sim].name}</span></button>` : ''}
  </section>
${
    r13
        ? `  <section class="vn-section" id="featured">
    <div class="vn-head vn-reveal"><h2>Selected work.<br /><span>Three to start with.</span></h2></div>
    ${gallery()}
  </section>`
        : ''
}

  <section class="vn-section" id="work">
    <div class="vn-head vn-reveal"><h2>${PROJECTS.length} projects.<br /><span>One network.</span></h2>
      <p>Projects connect where they share skills.<span class="vn-desk"> Hover one to see what it lights up, or ask the network.</span></p>
      <div class="vn-query" role="group" aria-label="Light up a domain">${domains
          .map((d) => `<button type="button" data-domain="${d}">${DOMAIN_LABEL[d]}</button>`)
          .join('')}</div></div>
    <div class="vn-map"></div>
    ${r13 && PROJECTS.length > 24 ? `<p class="vp-more">Showing 24 of ${PROJECTS.length}, the rest rotate in. <button type="button">See all projects</button></p>` : ''}
    ${list()}
  </section>

  <section class="vn-section" id="path">
    <div class="vn-head vn-reveal"><h2>The path so far.<br /><span>Every checkpoint earned.</span></h2></div>
    ${r12 ? '<div class="vo-path"></div>' : path()}
    ${r13 ? experience() : ''}
  </section>
${
    r12
        ? `  <section class="vn-section" id="numbers">
    <div class="vn-head vn-reveal"><h2${r14 ? ' class="vq-sm"' : ''}>By the numbers.<br /><span>Computed, not claimed.</span></h2>
      <p>Every chart below is calculated from the projects themselves.</p></div>
    ${bento(r13, r14)}
  </section>`
        : ''
}

  <section class="vn-section" id="hire">
    <div class="vn-head vn-reveal">${r14 ? '<h2 class="vq-sm">Two ways to work together.<br /><span>Internship or freelance.</span></h2>' : '<h2>Two ways<br /><span>to work together.</span></h2>'}</div>
    <div class="vn-tiles vn-reveal">${tiles(r13)}</div>
    ${r14 ? `<div class="vq-talk vn-reveal"><p>Either way, the fastest is an email.</p>${talk}</div>` : ''}
  </section>
${
    r13
        ? `${
              r14
                  ? ''
                  : `  <section class="vn-section vp-talk" id="contact">
    <div class="vn-head vn-reveal"><h2>Let's talk.<br /><span>Internship or freelance.</span></h2>
      ${talk}</div>
  </section>`
          }
  <div class="vp-toast" role="status" aria-live="polite"></div>`
        : ''
}

  <footer class="vn-foot"><span>Nielsen Combe-Bracciale</span>
    <nav><a href="mailto:nielsen.combe-bracciale@epitech.eu">Email</a><a href="https://github.com/Nexlein">GitHub</a>
    <a href="https://www.linkedin.com/in/nielsen-combebracciale/">LinkedIn</a><a href="/cv.pdf">CV</a>${r13 ? '<a href="https://github.com/Nexlein/Portfolio">View the source ›</a>' : ''}</nav></footer>
</div>`;

    root.querySelector('canvas')!.dataset.sim = String(sim);
    SIMS[sim].run(root.querySelector('canvas')!);

    const map = root.querySelector<HTMLElement>('.vn-map')!;
    mountBrain(map, r13 ? { max: 24, featured: FEATURED } : {});

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
    if (r13) living(root, sim, r14);
}

/** Round 12: chart path, bento reveals, headline lines, hero parallax, nav indicator, spotlight, theme picker. */
function motion(root: HTMLElement): void {
    const calm = reduceMotion();
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
        copy = hero.querySelector<HTMLElement>('.vn-hero-copy')!;
    let ticking = false;
    window.addEventListener(
        'scroll',
        () => {
            if (calm || ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                const p = Math.min(1, scrollY / hero.offsetHeight);
                hero.querySelector('canvas')!.style.transform = `translateY(${p * 90}px) scale(${1 + p * 0.06})`;
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

/** Show face i of a bento card, replaying its count-ups and bars. */
const showFace = (c: HTMLElement, i: number) => {
    const faces = [...c.querySelectorAll<HTMLElement>('.face')];
    faces.forEach((f, k) => f.classList.toggle('show', k === i));
    c.querySelectorAll('.vo-dots button').forEach((d, k) => d.setAttribute('aria-pressed', String(k === i)));
    const f = faces[i];
    f.querySelectorAll<HTMLElement>('.count').forEach(countUp);
    f.querySelectorAll<HTMLElement>('.fill').forEach((b) => {
        b.style.setProperty('--w', '0');
        requestAnimationFrame(() => requestAnimationFrame(() => b.style.setProperty('--w', b.dataset.w!)));
    });
};

/** Round 13: hero simulations, featured gallery, rotating bento faces, see all, copy email. */
function living(root: HTMLElement, first: number, calmer: boolean): void {
    const calm = reduceMotion();

    // Hero: another simulation on demand (a random one on load)
    const hero = root.querySelector<HTMLElement>('.vn-hero')!,
        simBtn = hero.querySelector<HTMLButtonElement>('.vp-sim')!,
        hint = hero.querySelector<HTMLElement>('.vn-hint')!;
    let sim = first;
    simBtn.addEventListener('click', () => {
        sim = (sim + 1) % SIMS.length;
        const old = hero.querySelector('canvas')!,
            fresh = document.createElement('canvas');
        fresh.setAttribute('aria-label', `${SIMS[sim].name}. ${SIMS[sim].hint}`);
        fresh.className = 'vp-incoming';
        fresh.dataset.sim = String(sim);
        fresh.style.transform = old.style.transform;
        old.replaceWith(fresh);
        SIMS[sim].run(fresh);
        requestAnimationFrame(() => fresh.classList.remove('vp-incoming'));
        simBtn.querySelector('.name')!.textContent = SIMS[sim].name;
        hint.textContent = `Live ${SIMS[sim].name.toLowerCase()}. ${SIMS[sim].hint}`;
    });

    // Featured gallery: swipe or use the dots; autoplay 6 s with a progress bar, paused on hover, focus, touch,
    // off-screen, by the Pause button and with reduced motion
    const gal = root.querySelector<HTMLElement>('.vp-gallery')!,
        slides = [...gal.querySelectorAll<HTMLElement>('.vp-slide')],
        gdots = [...root.querySelectorAll<HTMLButtonElement>('.vp-gdots button')],
        play = root.querySelector<HTMLButtonElement>('.vp-play')!;
    let at = 0,
        paused = calm || calmer; // round 14: no autoplay
    const setActive = (i: number) => {
        at = i;
        slides.forEach((s, k) => s.classList.toggle('active', k === i));
        gdots.forEach((d, k) => d.setAttribute('aria-pressed', String(k === i)));
    };
    const go = (i: number) => {
        const s = slides[i];
        gal.scrollTo({
            left: s.offsetLeft - (gal.clientWidth - s.offsetWidth) / 2,
            behavior: calm ? 'auto' : 'smooth'
        });
        setActive(i);
    };
    gdots.forEach((d, i) => d.addEventListener('click', () => go(i)));
    let settle = 0;
    gal.addEventListener('scroll', () => {
        clearTimeout(settle);
        settle = window.setTimeout(() => {
            const mid = gal.scrollLeft + gal.clientWidth / 2;
            const i = slides.reduce(
                (b, s, k) =>
                    Math.abs(s.offsetLeft + s.offsetWidth / 2 - mid) <
                    Math.abs(slides[b].offsetLeft + slides[b].offsetWidth / 2 - mid)
                        ? k
                        : b,
                0
            );
            if (i !== at) setActive(i);
        }, 120);
    });
    slides.forEach((s) =>
        s.querySelector('.vp-progress span')!.addEventListener('animationend', () => go((at + 1) % slides.length))
    );
    const syncPlay = () => {
        gal.classList.toggle('playing', !paused);
        play.textContent = paused ? 'Play' : 'Pause';
        play.setAttribute('aria-label', paused ? 'Play the slideshow' : 'Pause the slideshow');
    };
    play.addEventListener('click', () => {
        paused = !paused;
        syncPlay();
    });
    gal.addEventListener('pointerdown', () => {
        paused = true;
        syncPlay();
    });
    new IntersectionObserver(([e]) => gal.classList.toggle('seen', e.isIntersecting), { threshold: 0.5 }).observe(gal);
    syncPlay();

    // Bento: cards with several faces take turns every 10 s, one card at a time, never under the pointer or focus
    const faced = [...root.querySelectorAll<HTMLElement>('.vo-card')].filter(
        (c) => c.querySelectorAll('.face').length > 1
    );
    faced.forEach((c) =>
        c.querySelectorAll('.vo-dots button').forEach((d, i) => d.addEventListener('click', () => showFace(c, i)))
    );
    let turn = 0;
    const nextFace = () => {
        if (!calm && faced.length) {
            const c = faced[turn % faced.length];
            faced.forEach((o) => o.classList.toggle('next', o === faced[(turn + 1) % faced.length]));
            const inView = c.getBoundingClientRect().top < innerHeight && c.getBoundingClientRect().bottom > 0;
            if (inView && !c.matches(':hover, :focus-within') && c.classList.contains('in')) {
                const faces = [...c.querySelectorAll('.face')];
                showFace(c, (faces.findIndex((f) => f.classList.contains('show')) + 1) % faces.length);
            }
            turn++;
        }
        setTimeout(nextFace, 10000 / Math.max(1, faced.length));
    };
    if (!calmer) setTimeout(nextFace, 6000); // round 14: faces change on click only

    // See all: on desktop the full list opens under the map
    root.querySelector('.vp-more button')?.addEventListener('click', (e) => {
        const all = root.querySelector<HTMLElement>('.vn-list')!;
        all.classList.toggle('vp-open');
        (e.target as HTMLElement).textContent = all.classList.contains('vp-open')
            ? 'Hide the list'
            : 'See all projects';
    });

    // Copy email, with a toast that says what happened
    const toast = root.querySelector<HTMLElement>('.vp-toast')!;
    let toastTimer = 0;
    root.querySelector<HTMLButtonElement>('.vp-copy')!.addEventListener('click', async (e) => {
        const email = (e.currentTarget as HTMLElement).dataset.email!;
        let msg = 'Email copied';
        try {
            await navigator.clipboard.writeText(email);
        } catch {
            msg = email; // clipboard blocked: show the address instead
        }
        toast.textContent = msg;
        toast.classList.add('on');
        clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => toast.classList.remove('on'), 1800);
    });
}
