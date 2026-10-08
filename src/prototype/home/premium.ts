// PROTOTYPE — Round 11 (N) "premium": the whole home page rebuilt around the neural map, minimal and Apple-like.
// Quiet chrome, big two-tone type, one accent (amber) reserved for activity. "What brings you here?" is gone:
// two actions in the hero, a query control on the map, two tiles at the end.
import './premium.css';
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

export function variantN(root: HTMLElement): void {
    const used = new Set<string>(PROJECTS.map((p) => p.category));
    const domains = ['ai', 'systems', 'architecture', 'graphical', 'devops'].filter((d) => used.has(d));
    root.innerHTML = `
<div class="vn">
  <header class="vn-nav"><a class="vn-name" href="#top">Nielsen Combe-Bracciale</a>
    <nav><a href="#work">Work</a><a href="#path">Path</a><a href="#hire">Hire</a><a class="vn-pill" href="/cv.pdf">CV</a></nav></header>

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
    ${path()}
  </section>

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
}
