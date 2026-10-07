// PROTOTYPE — Variant C "Decision tree": the visitor chooses a branch; only that content opens.
import './variant-c.css';
import { PROJECTS } from '@/data/projects';
import { EDUCATION, EXPERIENCES, OFFERS, TIMELINE } from '@/data/profile';
import { videoPoster } from '@/ui/video';

const BRANCHES = [
    { id: 'hire', label: 'Hiring an intern', hint: 'Mar – Aug, full time' },
    { id: 'freelance', label: 'A freelance project', hint: 'Backend, AI integration' },
    { id: 'built', label: 'What he built', hint: `${PROJECTS.length} projects` },
    { id: 'path', label: 'The path so far', hint: 'Education & experience' }
] as const;
type Branch = (typeof BRANCHES)[number]['id'];

const thumb = (p: (typeof PROJECTS)[number]) =>
    p.media.type === 'video'
        ? videoPoster(p.media.src)
        : p.media.type === 'image'
          ? p.media.src
          : p.media.images[0].src;

function offerLeaf(id: 'full-time' | 'freelance'): string {
    const o = OFFERS.find((x) => x.id === id)!;
    return `<h2>${o.title.en}</h2><p class="mono">${o.summary.en}</p>
<dl class="vc-rows">${o.rows.map((r) => `<dt class="mono">${r.label.en}</dt><dd>${r.value.en} <span class="mono">${r.note.en}</span></dd>`).join('')}</dl>
<a class="vc-cta" href="mailto:nielsen.combe-bracciale@epitech.eu">Email me</a><a class="vc-cta ghost" href="/cv.pdf">CV (PDF)</a>`;
}

function leaf(branch: Branch): string {
    const byId = new Map([...EXPERIENCES, ...EDUCATION].map((e) => [e.id, e]));
    switch (branch) {
        case 'hire':
            return offerLeaf('full-time');
        case 'freelance':
            return offerLeaf('freelance');
        case 'built':
            return `<h2>What he built</h2><div class="vc-projects">${PROJECTS.map(
                (
                    p
                ) => `<a class="vc-project" href="/projects/${p.id}.html"><img src="${thumb(p)}" alt="" loading="lazy" />
<div><h3>${p.title}</h3><p>${p.description.en.split('. ')[0]}.</p><span class="mono">${p.tags.slice(0, 4).join(' · ')}</span></div></a>`
            ).join('')}</div>`;
        case 'path':
            return `<h2>The path so far</h2><ol class="vc-path">${TIMELINE.map((id) => {
                const e = byId.get(id)!;
                const org = 'org' in e && e.org ? ` <span class="mono">@ ${e.org}</span>` : '';
                return `<li><span class="mono">${e.period.en}</span><h3>${e.title.en}${org}</h3><p>${e.summary.en}</p></li>`;
            }).join('')}</ol>`;
    }
}

export function variantC(root: HTMLElement): void {
    root.innerHTML = `
<div class="vc"><div class="vc-col">
  <div class="vc-root"><span class="mono">builds AI systems that decide and learn</span>
    <h1>Nielsen Combe-Bracciale</h1>
    <p>Epitech student working on reinforcement learning, simulation and C++ systems. Pick what you need; the page decides the rest.</p></div>
  <p class="vc-question">What brings you here?</p>
  <div class="vc-tree"><svg aria-hidden="true"></svg></div>
  <div class="vc-branches" role="group" aria-label="What brings you here?">${BRANCHES.map(
      (b) =>
          `<button type="button" data-branch="${b.id}" aria-pressed="false"><strong>${b.label}</strong><span class="mono">${b.hint}</span></button>`
  ).join('')}</div>
  <div class="vc-out" aria-live="polite"></div>
</div></div>`;

    const col = root.querySelector<HTMLElement>('.vc-col')!;
    const svg = root.querySelector('svg')!;
    const out = root.querySelector<HTMLElement>('.vc-out')!;
    const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-branch]')];

    // Connectors from the question down to each branch node
    const drawTree = (active: Branch | null) => {
        const box = svg.getBoundingClientRect();
        svg.innerHTML = buttons
            .map((b) => {
                const r = b.getBoundingClientRect();
                const tx = r.left + r.width / 2 - box.left;
                const sx = box.width / 2;
                return `<path class="${b.dataset.branch === active ? 'on' : ''}" d="M ${sx} 0 C ${sx} ${box.height / 2}, ${tx} ${box.height / 2}, ${tx} ${box.height}" />`;
            })
            .join('');
    };

    const choose = (branch: Branch | null) => {
        buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.branch === branch)));
        col.classList.toggle('vc-has-choice', branch !== null);
        out.innerHTML = branch ? `<div class="vc-leaf">${leaf(branch)}</div>` : '';
        drawTree(branch);
        if (branch) history.replaceState(null, '', `${location.search}#${branch}`);
    };

    buttons.forEach((b) => b.addEventListener('click', () => choose(b.dataset.branch as Branch)));
    window.addEventListener('resize', () => drawTree((location.hash.slice(1) as Branch) || null));

    const initial = BRANCHES.find((b) => b.id === location.hash.slice(1))?.id ?? null;
    requestAnimationFrame(() => choose(initial));
}
