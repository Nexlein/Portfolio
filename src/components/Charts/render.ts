/**
 * Charts as static SVG, rendered at build time in every language (data-render="path-chart" / "numbers").
 * No inline styles anywhere (the CSP forbids them): colours come from classes, sizes from attributes.
 * Relative imports only: rendered from Node by vite-plugins/pages.ts. The browser never loads this file: what its
 * interactions need is rendered ahead (every range of the path chart) or embedded as JSON (PathData).
 */
import { CHECKPOINTS } from '../../data/profile.ts';
import type { ProjectEntry } from '../../data/projects.ts';
import { lookup, type Lang } from '../../core/translate.ts';
import { periodOf } from '../NeuralMap/graph.ts';
import {
    distinctSkills,
    domainAxes,
    INFRA,
    languageBuckets,
    learnedSince,
    newSkillsPerPeriod,
    OTHER,
    periodsIn,
    phasesIn,
    prettySkill,
    RANGES,
    changeSince,
    EPITECH_START,
    rangeStart,
    skillSeries,
    timeTicks,
    topSkills,
    valueAt,
    yDomain,
    yearOf,
    yTicks,
    type Point,
    type Range,
    type Tick
} from './data.ts';
import { monthLabel, PATH, pathSamples, type PathData } from './series.ts';

const f1 = (n: number) => n.toFixed(1);
const t = (lang: Lang, key: string) => lookup(lang, `home.${key}`);
const MONTHS: Record<Lang, string[]> = {
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    fr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
};
export const monthName = (time: number, lang: Lang) => monthLabel(time, MONTHS[lang]);

// ── Path: a performance chart of the skill toolbox ─────────────────────────

/** Where the visitor was: "Tek 2 · 2025–26" (or "Tek 2"), and "Before Epitech" for school year 0. */
export function phaseLabel(lang: Lang, year: number, start: number, short = false): string {
    if (year === 0) return t(lang, 'path.beforeEpitech');
    return short ? `Tek ${year}` : `Tek ${year} · ${start}–${String(start + 1).slice(2)}`;
}

/** The change since the start of a range, as the chart's headline says it: "▲ +37 (176 %) past 12 months". */
/** The change over a range: `text` is what is shown (`▲ +21 (58 %)`), `over` names the range for screen readers (`past 12 months`). */
export function changeText(
    lang: Lang,
    range: Range,
    points: Point[],
    t0: number
): { text: string; over: string; up: boolean } {
    const { delta, pct } = changeSince(points, t0);
    const over =
        range.months === null
            ? t(lang, 'path.since').replace('{d}', monthName(points[0].t + 2 / 12, lang)) // the first step is two months in
            : range.months === 1
              ? t(lang, 'path.over1')
              : t(lang, 'path.over').replace('{n}', String(range.months));
    const text = `${delta > 0 ? '▲ +' : ''}${delta}${pct === null ? '' : ` (${pct} %)`}`;
    return { text, over, up: delta > 0 };
}

/**
 * The month labels a phone keeps (CSS hides the others there): about three, never closer than a third of the range,
 * and a January (it names its year) wins over the first label when the two are close.
 */
function narrowTicks(axis: Tick[], t0: number, now: number): Set<Tick> {
    const gap = (now - t0) / 3.2;
    const kept: Tick[] = [];
    for (const tk of axis) {
        const last = kept[kept.length - 1];
        if (!last || tk.t - last.t >= gap - 1e-9) kept.push(tk);
        else if (tk.month === 0 && last.month !== 0 && kept.length === 1) kept[0] = tk;
    }
    return new Set(kept);
}

/** The plot itself, for a range starting at t0. */
export function pathSvg(lang: Lang, points: Point[], t0: number, now: number): string {
    const { W, H, L, R, T, B } = PATH;
    const total = points[points.length - 1].v;
    const domain = yDomain(points, t0);
    const x = (time: number) => L + ((time - t0) / (now - t0)) * (W - L - R);
    const y = (v: number) => H - B - ((v - domain.lo) / (domain.hi - domain.lo || 1)) * (H - T - B);
    const samples = pathSamples(points, t0, now, domain);
    const line = samples.map(([px, py], i) => `${i ? 'L' : 'M'}${f1(px)} ${f1(py)}`).join('');
    const ticks = yTicks(domain.lo, domain.hi);
    const axis = timeTicks(t0, now);
    const narrow = narrowTicks(axis, t0, now);
    // The band of life along the bottom: before Epitech, then each school year (a label only where it fits)
    const phases = phasesIn(t0, now)
        .map((ph, i) => {
            const x0 = x(ph.from),
                x1 = x(ph.to),
                mid = (x0 + x1) / 2,
                room = x1 - x0;
            const long = phaseLabel(lang, ph.year, ph.start),
                short = phaseLabel(lang, ph.year, ph.start, true);
            const text =
                room > long.length * 7.5
                    ? `<text class="phase-label" x="${f1(mid)}" y="${H - B - 6}">${long}</text>`
                    : room > short.length * 7.5
                      ? `<text class="phase-label" x="${f1(mid)}" y="${H - B - 6}">${short}</text>`
                      : '';
            return `<g class="phase${i % 2 ? ' odd' : ''}"><rect x="${f1(x0)}" y="${H - B - 18}" width="${f1(room)}" height="18" />${text}</g>`;
        })
        .join('');
    // Checkpoint labels take the first free row; when none is free the checkpoint keeps a dot and a tooltip
    const rowsEnd = [-Infinity, -Infinity, -Infinity];
    const marks = CHECKPOINTS.filter((c) => yearOf(c.date) >= t0 - 1e-9 && yearOf(c.date) <= now)
        .map((c) => {
            const label = c.label[lang],
                mx = x(yearOf(c.date)),
                my = y(valueAt(points, yearOf(c.date))),
                half = label.length * 3.3 + 8;
            const row = rowsEnd.findIndex((end) => mx - half > end);
            if (row < 0)
                return `<g class="mark" data-cp="${c.id}"><circle class="mark-hit" cx="${f1(mx)}" cy="${f1(my)}" r="16" /><circle class="mark-dot" cx="${f1(mx)}" cy="${f1(my)}" r="3.5"><title>${label}</title></circle></g>`;
            rowsEnd[row] = mx + half;
            // A checkpoint at the very start or end of a range keeps its name inside the picture
            const anchor = mx - half < 0 ? ' start' : mx + half > W ? ' end' : '';
            return `<g class="mark" data-cp="${c.id}"><line x1="${f1(mx)}" x2="${f1(mx)}" y1="${18 + row * 22}" y2="${f1(my)}" /><text class="${anchor.trim()}" x="${f1(mx)}" y="${12 + row * 22}">${label}</text><circle class="mark-hit" cx="${f1(mx)}" cy="${f1(my)}" r="16" /><circle class="mark-dot" cx="${f1(mx)}" cy="${f1(my)}" r="3.5" /></g>`;
        })
        .join('');
    return `<svg class="path-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${t(lang, 'path.aria').replace('{n}', String(total))}">
<defs><linearGradient id="path-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" class="stop-top" /><stop offset="1" class="stop-bottom" /></linearGradient></defs>
<g class="grid">${ticks.map((v, i) => `<line x1="${L}" x2="${W - R}" y1="${f1(y(v))}" y2="${f1(y(v))}" /><text${ticks.length > 3 && i % 2 ? ' class="value-minor"' : ''} x="${W - R + 10}" y="${f1(y(v) + 4)}">${v}</text>`).join('')}${axis.map((tk, i) => `<text class="tick${axis.length > 7 && tk.month !== 0 && i !== 0 ? ' minor' : ''}${narrow.has(tk) ? '' : ' wide'}${x(tk.t) < L + 40 ? ' first' : ''}" x="${f1(x(tk.t))}" y="${H - 8}">${MONTHS[lang][tk.month]}${tk.month === 0 || i === 0 ? ` ${tk.year}` : ''}</text>`).join('')}</g>
<path class="area" d="${line}L${f1(x(now))} ${H - B}L${f1(x(t0))} ${H - B}Z" />
<g class="phases">${phases}</g>
<path class="line" pathLength="1" d="${line}" />
<circle class="now" cx="${f1(x(now))}" cy="${f1(y(total))}" r="4.5" />
<g class="cross" visibility="hidden"><line class="cross-x" y1="${T - 10}" y2="${H - B}" /><circle class="cross-dot" r="4.5" /></g>
<rect class="hit" x="${L}" y="0" width="${W - L - R}" height="${H}" />
<g class="marks">${marks}</g></svg>`;
}

/** What a step is, in words: a checkpoint's name, "<project> started", or nothing (the start and end points). */
function whatOf(lang: Lang, p: Point): string {
    if (p.m?.checkpoint) return p.m.checkpoint.label[lang];
    return p.m?.project ? t(lang, 'path.shipped').replace('{p}', p.m.project.title) : '';
}

/**
 * The path chart. The full range is drawn in the page; the other ranges wait in <template>s (rendered here too, so
 * switching is a swap, not a redraw), and the series the crosshair reads is embedded as JSON (PathData).
 */
export function pathChart(lang: Lang, projects: ProjectEntry[], now: number): string {
    const points = skillSeries(projects, now);
    const total = points[points.length - 1].v;
    const first = RANGES[RANGES.length - 1]; // opens on everything, like a price chart's Max
    const ranges = RANGES.map((r) => {
        const t0 = rangeStart(r, points, now);
        return { r, t0, change: changeText(lang, r, points, t0) };
    });
    const change = ranges[ranges.length - 1].change;
    const data: PathData = {
        now,
        epitech: EPITECH_START,
        months: MONTHS[lang],
        before: t(lang, 'path.beforeEpitech'),
        skills: t(lang, 'path.skills'),
        points: points.map((p) => ({ t: p.t, v: p.v, what: whatOf(lang, p) })),
        ranges: Object.fromEntries(
            ranges.map(({ r, t0, change: c }) => [r.id, { t0, text: c.text, over: c.over, up: c.up }])
        )
    };
    // A data block, never executed (the CSP's script-src does not apply). Escape '<' so text can't close the tag.
    const json = JSON.stringify(data).replace(/</g, '\\u003c');
    const later = ranges
        .filter(({ r }) => r !== first)
        .map(({ r, t0 }) => `<template data-plot="${r.id}">${pathSvg(lang, points, t0, now)}</template>`)
        .join('');
    return `<div class="path-chart surface reveal">
  <div class="path-ticker">
    <div><p class="path-symbol">${t(lang, 'path.symbol')}</p>
      <p class="path-total"><span class="count" data-to="${total}">${total}</span><span class="path-delta${change.up ? '' : ' flat'}" aria-live="polite">${change.text}<span class="sr-only"> ${change.over}</span></span></p></div>
    <div class="segmented path-range" role="group" aria-label="${t(lang, 'path.range')}">${RANGES.map((r) => `<button type="button" data-range="${r.id}"${r === first ? ' aria-pressed="true"' : ''}>${t(lang, `path.ranges.${r.id}`)}</button>`).join('')}</div>
  </div>
  <div class="path-plot">${pathSvg(lang, points, points[0].t, now)}<div class="path-tip" aria-hidden="true" hidden></div></div>
  ${later}<script type="application/json" class="path-data">${json}</script>
</div>`;
}

// ── Numbers: small charts ───────────────────────────────────────

const label = (lang: Lang, key: string, set = 'domains') => {
    if (key === OTHER) return t(lang, 'numbers.other');
    if (key === INFRA) return t(lang, 'numbers.infra');
    const domain = lookup(lang, `home.${set}.${key}`);
    return domain.startsWith('home.') ? key : domain;
};
const period = (lang: Lang, y: string) => t(lang, `work.periods.${y}`).split(' · ')[0];

function radar(lang: Lang, projects: ProjectEntry[]): string {
    const { keys, counts } = domainAxes(projects);
    const max = Math.max(...counts),
        C = 130,
        Rr = 84;
    const at = (i: number, r: number) => {
        const a = -Math.PI / 2 + (i / keys.length) * Math.PI * 2;
        return [C + Math.cos(a) * r, C + Math.sin(a) * r];
    };
    const poly = (r: (i: number) => number) =>
        keys
            .map((_, i) => at(i, r(i)))
            .map(([px, py]) => `${f1(px)},${f1(py)}`)
            .join(' ');
    return `<svg class="radar" viewBox="-100 10 460 240" role="img" aria-label="${keys.map((k, i) => `${label(lang, k)} ${counts[i]}`).join(', ')}">
${[0.25, 0.5, 0.75, 1].map((k) => `<polygon class="ring" points="${poly(() => Rr * k)}" />`).join('')}
${keys.map((_, i) => `<line class="spoke" x1="${C}" y1="${C}" x2="${f1(at(i, Rr)[0])}" y2="${f1(at(i, Rr)[1])}" />`).join('')}
<polygon class="shape" points="${poly((i) => (Rr * counts[i]) / max)}" />
${keys
    .map((k, i) => {
        const [px, py] = at(i, (Rr * counts[i]) / max);
        const [lx, ly] = at(i, Rr + 18);
        const anchor = lx < C - 10 ? 'end' : lx > C + 10 ? 'start' : 'middle';
        return `<circle class="pt" cx="${f1(px)}" cy="${f1(py)}" r="3" /><text x="${f1(lx)}" y="${f1(ly + 4)}" text-anchor="${anchor}">${label(lang, k, 'domainsShort')} · ${counts[i]}</text>`;
    })
    .join('')}</svg>`;
}

function donut(lang: Lang, projects: ProjectEntry[]): string {
    const pers = periodsIn(projects);
    const counts = pers.map((y) => projects.filter((p) => periodOf(p) === y).length),
        total = counts.reduce((a, b) => a + b, 0);
    let acc = 0;
    const arcs = counts
        .map((n, k) => {
            const pct = (n / total) * 100;
            const arc = `<circle class="arc c${k}" cx="130" cy="110" r="74" pathLength="100" stroke-dasharray="${f1(Math.max(0, pct - 0.8))} ${f1(100 - pct + 0.8)}" stroke-dashoffset="${f1(-acc)}" />`;
            acc += pct;
            return arc;
        })
        .join('');
    return `<svg class="donut" viewBox="0 0 260 220" role="img" aria-label="${pers.map((y, k) => `${period(lang, y)} ${counts[k]}`).join(', ')}">
<g class="spin">${arcs}</g><text class="big" x="130" y="114">${total}</text><text x="130" y="134">${t(lang, 'numbers.projects')}</text></svg>
<ul class="key">${pers.map((y, k) => `<li><span class="c${k}"></span>${period(lang, y)} · ${counts[k]}</li>`).join('')}</ul>`;
}

function stackedLanguages(lang: Lang, projects: ProjectEntry[]): string {
    const pers = periodsIn(projects);
    const { keys, bucket } = languageBuckets(projects);
    const data = pers.map((y) => keys.map((l) => projects.filter((p) => periodOf(p) === y && bucket(p) === l).length));
    const max = Math.max(...data.map((r) => r.reduce((a, b) => a + b, 0)));
    const W = 300,
        H = 220,
        col = (W - 60) / pers.length,
        bw = Math.min(54, col - 20),
        base = H - 28;
    const name = (k: string) => label(lang, k);
    const bars = data
        .map((row, i) => {
            let acc = 0;
            const bx = 30 + i * col + (col - bw) / 2;
            return `<g class="bar">${row
                .map((n, k) => {
                    if (!n) return '';
                    const h = (n / max) * (H - 60),
                        y0 = base - acc - h;
                    acc += h;
                    return `<rect class="c${k}" x="${f1(bx)}" y="${f1(y0)}" width="${f1(bw)}" height="${f1(h - 2)}" rx="3"><title>${period(lang, pers[i])}: ${n} · ${name(keys[k])}</title></rect>`;
                })
                .join('')}<text x="${f1(bx + bw / 2)}" y="${H - 8}">${period(lang, pers[i])}</text></g>`;
        })
        .join('');
    return `<svg class="columns" viewBox="0 0 ${W} ${H}" role="img" aria-label="${t(lang, 'numbers.languagesTitle')}">${bars}</svg>
<ul class="key">${keys.map((k, i) => `<li><span class="c${i}"></span>${name(k)}</li>`).join('')}</ul>`;
}

function newSkillColumns(lang: Lang, projects: ProjectEntry[]): string {
    const pers = periodsIn(projects),
        counts = newSkillsPerPeriod(projects);
    const max = Math.max(...counts, 1),
        W = 300,
        H = 220,
        col = (W - 60) / pers.length;
    return `<svg class="columns" viewBox="0 0 ${W} ${H}" role="img" aria-label="${pers.map((y, k) => `${period(lang, y)} ${counts[k]}`).join(', ')}">
${pers
    .map((y, k) => {
        const h = (counts[k] / max) * (H - 70),
            bx = 30 + k * col + col / 2 - 22;
        return `<g class="bar"><rect class="c0" x="${f1(bx)}" y="${f1(H - 28 - h)}" width="44" height="${f1(h)}" rx="4" /><text class="value" x="${f1(bx + 22)}" y="${f1(H - 36 - h)}">${counts[k]}</text><text x="${f1(bx + 22)}" y="${H - 8}">${period(lang, y)}</text></g>`;
    })
    .join('')}</svg>`;
}

/** Long skill names are cut so they never run into their bar. */
const short = (s: string) => (s.length > 16 ? `${s.slice(0, 15)}…` : s);

function topSkillBars(projects: ProjectEntry[]): string {
    const best = topSkills(projects),
        max = best[0]?.[1] ?? 1;
    const W = 300,
        row = 26;
    return `<svg class="bars" viewBox="0 0 ${W} ${best.length * row}" role="img" aria-label="${best.map(([s, n]) => `${prettySkill(s)} ${n}`).join(', ')}">
${best
    .map(
        ([s, n], i) =>
            `<g class="bar-row"><text class="name" x="0" y="${i * row + 15}">${short(prettySkill(s))}<title>${prettySkill(s)}</title></text><rect class="track" x="128" y="${i * row + 8}" width="140" height="6" rx="3" /><rect class="fill" x="128" y="${i * row + 8}" width="${f1((140 * n) / max)}" height="6" rx="3" /><text class="value" x="${W}" y="${i * row + 15}" text-anchor="end">${n}</text></g>`
    )
    .join('')}</svg>`;
}

function chips(projects: ProjectEntry[], now: number): string {
    const recent = learnedSince(projects, now);
    return `<ul class="chips">${recent
        .slice(0, 18)
        .map((s) => `<li>${prettySkill(s)}</li>`)
        .join('')}${recent.length > 18 ? `<li class="more">+${recent.length - 18}</li>` : ''}</ul>`;
}

function heatmap(lang: Lang, projects: ProjectEntry[]): string {
    const pers = periodsIn(projects);
    const { keys } = domainAxes(projects);
    const inCell = (d: string, y: string) =>
        projects.filter((p) => (d === OTHER ? !keys.includes(p.category) : p.category === d) && periodOf(p) === y)
            .length;
    const grid = keys.map((d) => pers.map((y) => inCell(d, y)));
    const max = Math.max(...grid.flat(), 1);
    const W = 300,
        H = 220,
        left = 100,
        cw = (W - left - 4) / pers.length,
        ch = Math.min(30, (H - 44) / keys.length);
    const cells = keys
        .map((d, r) => {
            const y0 = 6 + r * ch;
            const row = pers
                .map((y, c) => {
                    const n = grid[r][c];
                    const x0 = left + c * cw;
                    return `<rect class="cell${n ? '' : ' empty'}" x="${f1(x0 + 2)}" y="${f1(y0 + 2)}" width="${f1(cw - 4)}" height="${f1(ch - 4)}" rx="4"${n ? ` fill-opacity="${(0.18 + 0.82 * (n / max)).toFixed(2)}"` : ''}><title>${label(lang, d, 'domainsShort')} · ${period(lang, y)}: ${n}</title></rect>${n ? `<text class="n" x="${f1(x0 + cw / 2)}" y="${f1(y0 + ch / 2 + 3.5)}">${n}</text>` : ''}`;
                })
                .join('');
            return `<g class="heat-row"><text class="row" x="${left - 8}" y="${f1(y0 + ch / 2 + 3.5)}" text-anchor="end">${label(lang, d, 'domainsShort')}</text>${row}</g>`;
        })
        .join('');
    const cols = pers
        .map((y, c) => `<text x="${f1(left + c * cw + cw / 2)}" y="${H - 8}">${period(lang, y)}</text>`)
        .join('');
    return `<svg class="heat" viewBox="0 0 ${W} ${H}" role="img" aria-label="${t(lang, 'numbers.heatTitle')}">${cells}${cols}</svg>`;
}

const count = (n: number) => `<span class="count" data-to="${n}">${n}</span>`;

/** One chart of the deck: a small label, a one-line title, the chart. */
const chartCard = (k: string, v: string, body: string) =>
    `<article class="chart-card surface reveal"><p class="card-k">${k}</p><p class="card-v">${v}</p>${body}</article>`;

/**
 * The numbers: small charts computed from the projects, shown as a deck (see initNumbers; a plain grid without
 * JS). Adding a chart is one more `chartCard` below.
 */
export function numbers(lang: Lang, projects: ProjectEntry[], now: number): string {
    const domains = domainAxes(projects).keys.length,
        recent = learnedSince(projects, now).length;
    const n = (key: string, value: number) => t(lang, `numbers.${key}`).replace('{n}', count(value));
    const cards = [
        chartCard(t(lang, 'numbers.coverage'), n('domains', domains), radar(lang, projects)),
        chartCard(t(lang, 'numbers.languages'), t(lang, 'numbers.languagesTitle'), stackedLanguages(lang, projects)),
        chartCard(t(lang, 'numbers.mostUsed'), n('distinct', distinctSkills(projects)), topSkillBars(projects)),
        chartCard(t(lang, 'numbers.heat'), t(lang, 'numbers.heatTitle'), heatmap(lang, projects)),
        chartCard(t(lang, 'numbers.periods'), n('byPeriod', projects.length), donut(lang, projects)),
        chartCard(t(lang, 'numbers.growth'), t(lang, 'numbers.growthTitle'), newSkillColumns(lang, projects)),
        chartCard(t(lang, 'numbers.thisYear'), n('newSkills', recent), chips(projects, now))
    ].join('\n');
    return `<div class="numbers" id="numbers">
<div class="numbers-head"><p class="numbers-sub">${t(lang, 'numbers.sub')}</p></div>
<div class="numbers-body"><div class="numbers-nav" hidden><button type="button" class="numbers-prev" aria-label="${t(lang, 'numbers.prev')}">‹</button><button type="button" class="numbers-next" aria-label="${t(lang, 'numbers.next')}">›</button></div>
<div class="numbers-index" role="group" aria-label="${t(lang, 'numbers.sub')}"></div>
<div class="numbers-stage"><div class="numbers-row">
${cards}
</div></div></div>
</div>`;
}
