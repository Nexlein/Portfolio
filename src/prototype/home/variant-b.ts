// PROTOTYPE — Variant B "Learning curve": the career drawn as a training run; checkpoints are real milestones.
import './variant-b.css';
import { PROJECTS } from '@/data/projects';
import { EDUCATION, EXPERIENCES, OFFERS } from '@/data/profile';

/** Prototype-only: when each milestone happened (fractional years). The real version would derive this from data. */
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

export function variantB(root: HTMLElement): void {
    const W = 1120,
        H = 360,
        X0 = 2020,
        X1 = 2030;
    const x = (year: number) => 40 + ((year - X0) / (X1 - X0)) * (W - 80);
    const byId = new Map([...EXPERIENCES, ...EDUCATION].map((e) => [e.id, e]));
    const entries = Object.keys(WHEN).map((id) => byId.get(id)!); // WHEN is in chronological order
    // Capability rises with each checkpoint; the last one (the degree) is a projection
    const points = entries.map((e, i) => ({
        e,
        px: x(WHEN[e.id]),
        py: H - 50 - (Math.pow(i + 1, 1.25) / Math.pow(entries.length, 1.25)) * (H - 110)
    }));
    const done = points.filter((p) => p.e.id !== 'epitech');
    // Horizontal tangents at every checkpoint: monotone in x, so the curve never loops back
    const path = done
        .map((p, i) => {
            if (i === 0) return `M ${p.px} ${p.py}`;
            const prev = done[i - 1],
                mid = (prev.px + p.px) / 2;
            return `C ${mid} ${prev.py} ${mid} ${p.py} ${p.px} ${p.py}`;
        })
        .join(' ');
    const last = done[done.length - 1],
        future = points[points.length - 1];

    const epochs = ['Tek1', 'Tek2', 'Personal'] as const;

    root.innerHTML = `
<div class="vb"><div class="vb-wrap">
  <header class="vb-head"><h1>Nielsen Combe-Bracciale</h1><span class="data">training run · 2020 → now</span></header>
  <p class="vb-lede">I build AI systems that decide and learn. This is the run so far: every checkpoint is something I shipped or earned.</p>
  <svg class="vb-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Career drawn as a learning curve from 2020 to 2029">
    <g class="grid">${Array.from({ length: X1 - X0 + 1 }, (_, i) => `<line x1="${x(X0 + i)}" y1="20" x2="${x(X0 + i)}" y2="${H - 30}" />`).join('')}</g>
    ${Array.from({ length: X1 - X0 + 1 }, (_, i) => `<text x="${x(X0 + i)}" y="${H - 10}" text-anchor="middle">${X0 + i}</text>`).join('')}
    <text x="40" y="14">capability ↑</text>
    <path class="projection" d="M ${last.px} ${last.py} L ${future.px} ${future.py}" />
    <path class="run" d="${path}" />
    ${points
        .map(
            (p, i) => `<g class="cp" style="animation-delay:${0.3 + i * 0.25}s" transform="translate(${p.px} ${p.py})">
      <circle r="6" /><text class="title" x="${i % 2 ? 10 : -10}" y="${i % 2 ? 22 : -14}" text-anchor="${i % 2 ? 'start' : 'end'}">${SHORT[p.e.id]}</text>
      <text x="${i % 2 ? 10 : -10}" y="${i % 2 ? 37 : -29}" text-anchor="${i % 2 ? 'start' : 'end'}">${p.e.period.en}</text></g>`
        )
        .join('')}
  </svg>

  <section class="vb-section"><h2>Evaluation runs</h2><p class="data">projects, grouped by epoch</p>
    ${epochs
        .map(
            (epoch) =>
                `<div class="vb-epoch"><div class="vb-epoch-label">epoch: ${epoch}</div><div class="vb-runs">${PROJECTS.filter(
                    (p) => (p.year ?? 'Tek2') === epoch
                )
                    .map(
                        (p) =>
                            `<a href="/projects/${p.id}.html"><h3>${p.title}</h3><p>${p.description.en.split('. ')[0]}.</p><span class="data">${p.tags.slice(0, 3).join(' · ')}</span></a>`
                    )
                    .join('')}</div></div>`
        )
        .join('')}
  </section>

  <section class="vb-section"><h2>Deploy me</h2>
    <div class="vb-deploy">${OFFERS.map(
        (o) =>
            `<div><h3>${o.title.en}</h3><dl>${o.rows.map((r) => `<dt class="data">${r.label.en}</dt><dd>${r.value.en}</dd>`).join('')}</dl></div>`
    ).join('')}</div>
    <div class="vb-links"><a href="mailto:nielsen.combe-bracciale@epitech.eu">nielsen.combe-bracciale@epitech.eu</a>
      <a href="https://github.com/Nexlein">GitHub</a><a href="https://www.linkedin.com/in/nielsen-combebracciale/">LinkedIn</a><a href="/cv.pdf">CV (PDF)</a></div>
  </section>
</div></div>`;
}
