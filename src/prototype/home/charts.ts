// PROTOTYPE — Round 12 charts. Real data only: everything is computed from projects.ts and profile.ts.
// Dates are approximate (school year of each project, spread evenly); the real build should store a date per project.
import { EXPERIENCES } from '@/data/profile';
import { PROJECTS, type ProjectEntry } from '@/data/projects';
import { DOMAIN_LABEL } from './round2';
import { mds, yearOf } from './space';

const f1 = (n: number) => n.toFixed(1);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const month = (t: number) => `${MONTHS[Math.min(11, Math.floor((t % 1) * 12))]} ${Math.floor(t)}`;
export const NOW = 2026.77;
const START = 2024.3; // just before the Baccalauréat and the C Piscine: nothing to chart earlier

function skills(tags: string[]): string[] {
    return tags.flatMap((raw) =>
        raw
            .toLowerCase()
            .split('/')
            .map((s) => s.trim())
            .map((s) => (s === 'rl' ? 'reinforcement learning' : s))
            .filter(Boolean)
    );
}

/** Insertion sort by key (the codebase lint bans Array#sort and ES2020 has no toSorted). */
function sortBy<T>(items: T[], key: (x: T) => number): T[] {
    const out: T[] = [];
    for (const it of items) {
        let i = out.length;
        while (i > 0 && key(out[i - 1]) > key(it)) i--;
        out.splice(i, 0, it);
    }
    return out;
}

// ── Path: a performance chart of the skill toolbox ─────────────────────────
interface Milestone {
    t: number;
    label: string;
    checkpoint: boolean;
    add: string[];
}

const exp = (id: string) => skills(EXPERIENCES.find((e) => e.id === id)?.tags ?? []);

function events(): Milestone[] {
    const evs: Milestone[] = [
        { t: 2024.5, label: 'Baccalauréat + C Piscine', checkpoint: true, add: ['c'] },
        { t: 2024.72, label: 'Epitech, year 1', checkpoint: true, add: [] },
        { t: 2025.75, label: 'Full-stack & AI intern', checkpoint: true, add: exp('climb2c') },
        { t: 2026.0, label: 'Hackathons', checkpoint: true, add: exp('hackathons') },
        { t: 2026.3, label: 'Google Cloud certified', checkpoint: true, add: ['google cloud', 'generative ai'] },
        { t: 2026.7, label: 'AI developer, Issanka', checkpoint: true, add: exp('issanka') }
    ];
    const per: Record<string, { start: number; step: number }> = {
        Tek1: { start: 2024.85, step: 0.18 },
        Tek2: { start: 2025.8, step: 0.06 },
        Personal: { start: 2026.45, step: 0.15 }
    };
    const seen: Record<string, number> = {};
    for (const p of PROJECTS) {
        const y = yearOf(p),
            k = (seen[y] = (seen[y] ?? -1) + 1);
        evs.push({
            t: per[y].start + k * per[y].step,
            label: `${p.title} shipped`,
            checkpoint: false,
            add: skills(p.tags)
        });
    }
    return sortBy(evs, (e) => e.t);
}

interface Point {
    t: number;
    v: number;
    label: string;
}

/** Cumulative distinct skills after each event. */
function series(): { points: Point[]; marks: Milestone[] } {
    const evs = events();
    const known = new Set<string>();
    const points: Point[] = [{ t: START, v: 0, label: 'Start' }];
    for (const e of evs) {
        e.add.forEach((s) => known.add(s));
        points.push({ t: e.t, v: known.size, label: e.label });
    }
    points.push({ t: NOW, v: known.size, label: 'Now' });
    return { points, marks: evs.filter((e) => e.checkpoint) };
}

const valueAt = (pts: Point[], t: number) => pts.reduce((v, p) => (p.t <= t ? p.v : v), 0);
const lastAt = (pts: Point[], t: number) => pts.reduce((l, p) => (p.t <= t ? p : l), pts[0]);
const smooth = (u: number) => u * u * (3 - 2 * u);

export function mountPathChart(host: HTMLElement): void {
    const { points, marks } = series();
    const W = 1080,
        H = 360,
        L = 44,
        R = 60,
        T = 84,
        B = 30;
    const total = points[points.length - 1].v,
        yearAgo = valueAt(points, NOW - 1),
        delta = total - yearAgo;
    host.innerHTML = `<div class="vo-ticker">
  <div><p class="vo-sym">SKILLS · toolbox index</p>
    <p class="vo-big"><span class="count" data-to="${total}">${total}</span><span class="vo-delta">▲ +${delta} (${Math.round((delta / Math.max(1, yearAgo)) * 100)} %) past 12 months</span></p></div>
  <div class="vo-range" role="group" aria-label="Time range"><button type="button" data-range="1">1Y</button><button type="button" data-range="2">2Y</button><button type="button" data-range="all" aria-pressed="true">Max</button></div>
</div>
<div class="vo-plot"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Distinct skills over time, ${total} today, up ${delta} in the past 12 months"></svg>
<div class="vo-tip" hidden></div></div>`;
    const svg = host.querySelector('svg')!,
        tip = host.querySelector<HTMLElement>('.vo-tip')!;
    let t0 = START;
    const x = (t: number) => L + ((t - t0) / (NOW - t0)) * (W - L - R);
    const y = (v: number) => H - B - (v / (total * 1.08)) * (H - T - B);

    const draw = () => {
        // Sampled smooth steps: the line, the hover dot and the tooltip all agree
        const vis = [{ t: t0, v: valueAt(points, t0), label: '' }, ...points.filter((p) => p.t > t0)];
        const samples: [number, number][] = [];
        vis.forEach((p, i) => {
            if (i === 0) return samples.push([x(p.t), y(p.v)]);
            const a = vis[i - 1];
            for (let k = 1; k <= 14; k++) {
                const u = k / 14;
                samples.push([x(a.t + (p.t - a.t) * u), y(a.v + (p.v - a.v) * smooth(u))]);
            }
        });
        const line = samples.map(([px, py], i) => `${i ? 'L' : 'M'}${f1(px)} ${f1(py)}`).join('');
        const years: number[] = [];
        for (let yr = Math.ceil(t0); yr <= NOW; yr++) years.push(yr);
        const step = total > 40 ? 20 : 10,
            ticks: number[] = [];
        for (let v = 0; v <= total; v += step) ticks.push(v);
        const shown = marks.filter((m) => m.t >= t0);
        svg.innerHTML = `<defs><linearGradient id="vo-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" class="s0" /><stop offset="1" class="s1" /></linearGradient></defs>
<g class="grid">${ticks.map((v) => `<line x1="${L}" x2="${W - R}" y1="${f1(y(v))}" y2="${f1(y(v))}" /><text x="${W - R + 10}" y="${f1(y(v) + 4)}">${v}</text>`).join('')}
${years.map((yr) => `<text class="yr" x="${f1(x(yr))}" y="${H - 8}">${yr}</text>`).join('')}</g>
<g class="marks">${shown
            .map((m, i) => {
                const mx = x(m.t),
                    row = i % 3;
                return `<g class="mark"><line x1="${f1(mx)}" x2="${f1(mx)}" y1="${18 + row * 22}" y2="${f1(y(valueAt(points, m.t)))}" />
<text x="${f1(mx)}" y="${12 + row * 22}">${m.label}</text><circle cx="${f1(mx)}" cy="${f1(y(valueAt(points, m.t)))}" r="3.5" /></g>`;
            })
            .join('')}</g>
<path class="area" d="${line}L${f1(x(NOW))} ${H - B}L${f1(x(t0))} ${H - B}Z" />
<path class="line" pathLength="1" d="${line}" />
<circle class="now" cx="${f1(x(NOW))}" cy="${f1(y(total))}" r="4.5" />
<g class="cross" style="display:none"><line class="cx" y1="${T - 10}" y2="${H - B}" /><circle class="cd" r="4.5" /></g>
<rect class="hit" x="${L}" y="0" width="${W - L - R}" height="${H}" />`;
        const cross = svg.querySelector<SVGGElement>('.cross')!;
        const hit = svg.querySelector('.hit')!;
        hit.addEventListener('pointermove', (pe) => {
            const e = pe as PointerEvent;
            const r = svg.getBoundingClientRect(),
                sx = ((e.clientX - r.left) / r.width) * W;
            const near = samples.reduce((a, b) => (Math.abs(b[0] - sx) < Math.abs(a[0] - sx) ? b : a));
            const t = t0 + ((near[0] - L) / (W - L - R)) * (NOW - t0);
            cross.style.display = '';
            cross.querySelector('.cx')!.setAttribute('x1', f1(near[0]));
            cross.querySelector('.cx')!.setAttribute('x2', f1(near[0]));
            cross.querySelector('.cd')!.setAttribute('cx', f1(near[0]));
            cross.querySelector('.cd')!.setAttribute('cy', f1(near[1]));
            const ev = lastAt(points, t);
            tip.hidden = false;
            tip.innerHTML = `<span class="mono">${month(t)}</span><strong>${valueAt(points, t)} skills</strong><span>${ev.label}</span>`;
            tip.style.left = `${(near[0] / W) * 100}%`;
            tip.style.top = `${(near[1] / H) * 100}%`;
        });
        hit.addEventListener('pointerleave', () => {
            cross.style.display = 'none';
            tip.hidden = true;
        });
        // Redraw animation when the range changes
        host.classList.remove('drawn');
        void host.offsetWidth;
        host.classList.add('drawn');
    };

    host.querySelectorAll<HTMLButtonElement>('.vo-range button').forEach((b) =>
        b.addEventListener('click', () => {
            host.querySelectorAll('.vo-range button').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
            t0 = b.dataset.range === 'all' ? START : NOW - Number(b.dataset.range);
            draw();
        })
    );
    draw();
}

// ── Bento: radar, stacked bars, clusters, top skills ────────────────────────
const DOMAINS = ['ai', 'systems', 'architecture', 'graphical', 'devops'] as const;

export function radar(): string {
    const counts = DOMAINS.map((d) => PROJECTS.filter((p) => p.category === d).length);
    const max = Math.max(...counts),
        C = 130,
        Rr = 96;
    const at = (i: number, r: number) => {
        const a = -Math.PI / 2 + (i / DOMAINS.length) * Math.PI * 2;
        return [C + Math.cos(a) * r, C + Math.sin(a) * r];
    };
    const poly = (r: (i: number) => number) =>
        DOMAINS.map((_, i) => at(i, r(i)))
            .map(([px, py]) => `${f1(px)},${f1(py)}`)
            .join(' ');
    return `<svg class="vo-radar" viewBox="-70 0 400 260" role="img" aria-label="Projects per domain: ${DOMAINS.map((d, i) => `${DOMAIN_LABEL[d]} ${counts[i]}`).join(', ')}">
${[0.25, 0.5, 0.75, 1].map((k) => `<polygon class="ring" points="${poly(() => Rr * k)}" />`).join('')}
${DOMAINS.map((_, i) => {
    const [px, py] = at(i, Rr);
    return `<line class="spoke" x1="${C}" y1="${C}" x2="${f1(px)}" y2="${f1(py)}" />`;
}).join('')}
<polygon class="shape" points="${poly((i) => (Rr * counts[i]) / max)}" />
${DOMAINS.map((d, i) => {
    const [px, py] = at(i, Rr * (counts[i] / max));
    const [lx, ly] = at(i, Rr + 18);
    return `<circle class="pt" cx="${f1(px)}" cy="${f1(py)}" r="3"><title>${DOMAIN_LABEL[d]}: ${counts[i]}</title></circle>
<text x="${f1(lx)}" y="${f1(ly + 4)}" text-anchor="${lx < C - 10 ? 'end' : lx > C + 10 ? 'start' : 'middle'}">${DOMAIN_LABEL[d]} · ${counts[i]}</text>`;
}).join('')}</svg>`;
}

function language(p: ProjectEntry): string {
    for (const t of p.tags) {
        if (t === 'C/C++' || t === 'C++') return 'C++';
        if (t === 'C' || t === 'Python') return t;
    }
    return 'Tooling';
}

export function stacked(): string {
    const periods = ['Tek1', 'Tek2', 'Personal'],
        names: Record<string, string> = { Tek1: 'tek 1', Tek2: 'tek 2', Personal: 'personal' };
    const langs = ['C', 'C++', 'Python', 'Tooling'];
    const data = periods.map((per) =>
        langs.map((l) => PROJECTS.filter((p) => yearOf(p) === per && language(p) === l).length)
    );
    const max = Math.max(...data.map((r) => r.reduce((a, b) => a + b, 0)));
    const W = 300,
        H = 220,
        bw = 54,
        base = H - 28;
    const bars = data
        .map((row, i) => {
            let acc = 0;
            const bx = 30 + i * ((W - 60) / periods.length) + 12;
            return `<g class="bar">${row
                .map((n, k) => {
                    if (!n) return '';
                    const h = (n / max) * (H - 60),
                        y0 = base - acc - h;
                    acc += h;
                    return `<rect class="l${k}" x="${bx}" y="${f1(y0)}" width="${bw}" height="${f1(h - 2)}" rx="3"><title>${names[periods[i]]}: ${n} in ${langs[k]}</title></rect>`;
                })
                .join('')}<text x="${bx + bw / 2}" y="${H - 8}">${names[periods[i]]}</text></g>`;
        })
        .join('');
    return `<svg class="vo-stack" viewBox="0 0 ${W} ${H}" role="img" aria-label="Main language per project, by period">${bars}</svg>
<ul class="vo-key">${langs.map((l, k) => `<li><span class="l${k}"></span>${l}</li>`).join('')}</ul>`;
}

export function clusters(): string {
    const raw = mds(PROJECTS);
    const xs = raw.map((p) => p[0]),
        ys = raw.map((p) => p[1]);
    const W = 1000,
        H = 300;
    const pts = raw.map(([px, py]) => ({
        x: 40 + ((px - Math.min(...xs)) / (Math.max(...xs) - Math.min(...xs) || 1)) * (W - 80),
        y: 30 + ((py - Math.min(...ys)) / (Math.max(...ys) - Math.min(...ys) || 1)) * (H - 60)
    }));
    // Similar projects land on top of each other: push them apart just enough to see every point
    for (let pass = 0; pass < 120; pass++)
        for (let i = 0; i < pts.length; i++)
            for (let j = i + 1; j < pts.length; j++) {
                const dx = pts[j].x - pts[i].x,
                    dy = pts[j].y - pts[i].y,
                    d = Math.hypot(dx, dy) || 0.01;
                if (d >= 34) continue;
                const push = (34 - d) / 2;
                pts[i].x -= (dx / d) * push;
                pts[i].y -= (dy / d) * push;
                pts[j].x += (dx / d) * push;
                pts[j].y += (dy / d) * push;
            }
    const used = [...new Set(PROJECTS.map((p) => p.category))];
    return `<svg class="vo-scatter" viewBox="0 0 ${W} ${H}" role="img" aria-label="Projects placed by skill similarity: close points share skills">
${PROJECTS.map((p, i) => {
    const { x, y } = pts[i],
        left = x > W - 160;
    return `<g class="pt" data-domain="${p.category}" tabindex="0"><circle cx="${f1(x)}" cy="${f1(y)}" r="7" /><circle class="halo" cx="${f1(x)}" cy="${f1(y)}" r="16" />
<text x="${f1(left ? x - 14 : x + 14)}" y="${f1(y + 4)}" text-anchor="${left ? 'end' : 'start'}">${p.title}</text></g>`;
}).join('')}</svg>
<ul class="vo-key">${used.map((d) => `<li><span class="dom" data-domain="${d}"></span>${DOMAIN_LABEL[d]}</li>`).join('')}</ul>`;
}

export function topSkills(): string {
    const freq = new Map<string, number>();
    for (const p of PROJECTS) for (const s of new Set(skills(p.tags))) freq.set(s, (freq.get(s) ?? 0) + 1);
    const top: [string, number][] = [];
    for (const e of freq) {
        top.push(e);
        let i = top.length - 1;
        while (i > 0 && top[i - 1][1] < top[i][1]) {
            [top[i - 1], top[i]] = [top[i], top[i - 1]];
            i--;
        }
    }
    const best = top.slice(0, 7),
        max = best[0][1];
    return `<ol class="vo-bars">${best
        .map(
            ([s, n]) =>
                `<li><span class="name">${s.length <= 3 ? s.toUpperCase() : s[0].toUpperCase() + s.slice(1)}</span><span class="track"><span class="fill" data-w="${n / max}"></span></span><span class="n">${n}</span></li>`
        )
        .join('')}</ol>`;
}

export const distinctSkills = () => new Set(PROJECTS.flatMap((p) => skills(p.tags))).size;

/** Count-up for `.count[data-to]` once visible. */
export function countUp(el: HTMLElement): void {
    const to = Number(el.dataset.to),
        start = performance.now();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const step = (t: number) => {
        const u = Math.min(1, (t - start) / 1100);
        el.textContent = String(Math.round(to * (1 - (1 - u) ** 3)));
        if (u < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}
