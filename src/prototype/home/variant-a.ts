// PROTOTYPE — Variant A "Policy field": a real value-iteration agent in the hero, your cursor is the reward.
import './variant-a.css';
import { PROJECTS } from '@/data/projects';
import { EDUCATION, EXPERIENCES, OFFERS, TIMELINE } from '@/data/profile';
import { videoPoster } from '@/ui/video';

const DOMAIN: Record<string, string> = {
    ai: 'AI / RL',
    architecture: 'Architecture',
    systems: 'Systems',
    devops: 'DevOps',
    graphical: 'Graphics'
};

const preview = (p: (typeof PROJECTS)[number]) =>
    p.media.type === 'video'
        ? videoPoster(p.media.src)
        : p.media.type === 'image'
          ? p.media.src
          : p.media.images[0].src;

export function variantA(root: HTMLElement): void {
    const byId = new Map([...EXPERIENCES, ...EDUCATION].map((e) => [e.id, e]));
    root.innerHTML = `
<div class="va">
  <header class="va-top"><span class="mono">NIELSEN COMBE-BRACCIALE</span>
    <nav><a href="#work">Work</a><a href="#path">Path</a><a href="#contact">Contact</a></nav></header>
  <section class="va-hero">
    <canvas aria-label="Value iteration: arrows point toward the cursor, which is the reward"></canvas>
    <div class="va-thesis">
      <h1>I build agents that <em>decide</em> and learn.</h1>
      <p class="mono">value iteration · γ = 0.95 · reward = your cursor</p>
    </div>
  </section>
  <section class="va-section" id="work"><h2>Work</h2>
    <table class="va-table"><thead><tr><th>Project</th><th class="hide-sm">Domain</th><th class="hide-sm">Stack</th><th>Year</th></tr></thead>
    <tbody>${PROJECTS.map(
        (
            p
        ) => `<tr data-preview="${preview(p)}"><td><div class="title">${p.title}</div><div class="mono">${p.description.en.slice(0, 92)}…</div></td>
        <td class="hide-sm">${DOMAIN[p.category]}</td><td class="hide-sm mono">${p.tags.slice(0, 3).join(' · ')}</td><td class="mono">${p.year ?? 'Tek2'}</td></tr>`
    ).join('')}</tbody></table>
  </section>
  <section class="va-section" id="path"><h2>Path</h2>
    <dl class="va-path">${TIMELINE.map((id) => {
        const e = byId.get(id)!;
        const org = 'org' in e && e.org ? ` <span class="mono">@ ${e.org}</span>` : '';
        return `<dt class="mono">${e.period.en}</dt><dd><strong>${e.title.en}</strong>${org}</dd>`;
    }).join('')}</dl>
  </section>
  <section class="va-section"><h2>Available for</h2>
    <div class="va-offers">${OFFERS.map(
        (o) =>
            `<div><h3>${o.title.en}</h3><p class="mono">${o.summary.en}</p>${o.rows.map((r) => `<p>${r.value.en}</p>`).join('')}</div>`
    ).join('')}</div>
  </section>
  <footer class="va-contact" id="contact">
    <a href="mailto:nielsen.combe-bracciale@epitech.eu">Email</a><a href="https://github.com/Nexlein">GitHub</a>
    <a href="https://www.linkedin.com/in/nielsen-combebracciale/">LinkedIn</a><a href="/cv.pdf">CV (PDF)</a>
  </footer>
  <img class="va-preview" alt="" />
</div>`;

    // Hover preview follows the mouse over the table
    const img = root.querySelector<HTMLImageElement>('.va-preview')!;
    root.querySelectorAll<HTMLTableRowElement>('tr[data-preview]').forEach((row) => {
        row.addEventListener('mouseenter', () => {
            img.src = row.dataset.preview!;
            img.style.opacity = '1';
        });
        row.addEventListener('mouseleave', () => (img.style.opacity = '0'));
        row.addEventListener('mousemove', (e) => {
            img.style.left = `${e.clientX + 24}px`;
            img.style.top = `${e.clientY - 80}px`;
        });
    });

    policyField(root.querySelector('canvas')!);
}

/** Value iteration on a grid with walls; the goal (reward) is the cursor cell. Arrows show the greedy policy. */
export function policyField(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d')!;
    const CELL = 30;
    const GAMMA = 0.95;
    const DIRS = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1]
    ] as const;
    let cols = 0,
        rows = 0,
        V = new Float32Array(0),
        angle = new Float32Array(0),
        wall = new Uint8Array(0);
    let goal = { x: 0, y: 0 },
        pointer: { x: number; y: number } | null = null;
    let colors = { line: '', cold: '', signal: '' };
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const readColors = () => {
        const s = getComputedStyle(canvas.parentElement!); // CSS variables of whichever page hosts the field
        colors = {
            line: s.getPropertyValue('--line'),
            cold: s.getPropertyValue('--cold'),
            signal: s.getPropertyValue('--signal')
        };
    };

    const resize = () => {
        const dpr = devicePixelRatio || 1;
        canvas.width = canvas.clientWidth * dpr;
        canvas.height = canvas.clientHeight * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cols = Math.ceil(canvas.clientWidth / CELL);
        rows = Math.ceil(canvas.clientHeight / CELL);
        V = new Float32Array(cols * rows);
        angle = new Float32Array(cols * rows);
        wall = new Uint8Array(cols * rows);
        // Short wall segments, seeded so the layout is stable, make the policy bend around obstacles
        let seed = 7;
        const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
        for (let k = 0; k < (cols * rows) / 40; k++) {
            const x = Math.floor(rnd() * cols),
                y = Math.floor(rnd() * rows),
                horizontal = rnd() > 0.5;
            for (let i = 0; i < 4; i++) {
                const cx = x + (horizontal ? i : 0),
                    cy = y + (horizontal ? 0 : i);
                if (cx < cols && cy < rows) wall[cy * cols + cx] = 1;
            }
        }
    };

    const sweep = () => {
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const i = y * cols + x;
                if (wall[i]) continue;
                if (x === goal.x && y === goal.y) {
                    V[i] = 1;
                    continue;
                }
                let best = 0,
                    bx = 0,
                    by = 0;
                for (const [dx, dy] of DIRS) {
                    const nx = x + dx,
                        ny = y + dy;
                    if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || wall[ny * cols + nx]) continue;
                    const v = GAMMA * V[ny * cols + nx] * (dx && dy ? 0.98 : 1);
                    if (v > best) {
                        best = v;
                        bx = dx;
                        by = dy;
                    }
                }
                V[i] = best;
                if (best > 0) {
                    const target = Math.atan2(by, bx);
                    let d = target - angle[i];
                    d = Math.atan2(Math.sin(d), Math.cos(d));
                    angle[i] += reduce ? d : d * 0.25; // ease the arrows toward the new decision
                }
            }
        }
    };

    const draw = () => {
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const i = y * cols + x,
                    cx = x * CELL + CELL / 2,
                    cy = y * CELL + CELL / 2;
                if (wall[i]) {
                    ctx.fillStyle = colors.line;
                    ctx.fillRect(x * CELL + 3, y * CELL + 3, CELL - 6, CELL - 6);
                    continue;
                }
                const v = V[i];
                if (v <= 0) continue;
                const len = 5 + 8 * Math.sqrt(v);
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(angle[i]);
                ctx.globalAlpha = 0.25 + 0.75 * Math.sqrt(v);
                ctx.strokeStyle = v > 0.55 ? colors.signal : colors.cold;
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                ctx.moveTo(-len / 2, 0);
                ctx.lineTo(len / 2, 0);
                ctx.lineTo(len / 2 - 3, -3);
                ctx.moveTo(len / 2, 0);
                ctx.lineTo(len / 2 - 3, 3);
                ctx.stroke();
                ctx.restore();
            }
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = colors.signal;
        ctx.beginPath();
        ctx.arc(goal.x * CELL + CELL / 2, goal.y * CELL + CELL / 2, 6, 0, Math.PI * 2);
        ctx.fill();
    };

    const setGoal = (px: number, py: number) => {
        const x = Math.max(0, Math.min(cols - 1, Math.floor(px / CELL)));
        const y = Math.max(0, Math.min(rows - 1, Math.floor(py / CELL)));
        if (!wall[y * cols + x]) goal = { x, y };
    };

    canvas.addEventListener('pointermove', (e) => {
        const r = canvas.getBoundingClientRect();
        pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
    });
    canvas.addEventListener('pointerleave', () => (pointer = null));
    // Click toggles a wall: the agent re-plans around it on the next sweeps
    canvas.addEventListener('pointerdown', (e) => {
        const r = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - r.left) / CELL),
            y = Math.floor((e.clientY - r.top) / CELL);
        if (x === goal.x && y === goal.y) return;
        const i = y * cols + x;
        wall[i] = wall[i] ? 0 : 1;
        V[i] = 0;
        if (reduce) {
            for (let k = 0; k < cols + rows; k++) sweep();
            draw();
        }
    });
    window.addEventListener('resize', () => {
        resize();
        readColors();
    });
    window.addEventListener('proto-theme', readColors);

    resize();
    readColors();
    setGoal(canvas.clientWidth * 0.7, canvas.clientHeight * 0.35);

    if (reduce) {
        for (let k = 0; k < cols + rows; k++) sweep();
        draw();
        return;
    }

    let t = 0,
        seen = true;
    new IntersectionObserver(([e]) => (seen = e.isIntersecting)).observe(canvas);
    const frame = () => {
        if (!canvas.isConnected) return; // swapped for another simulation
        if (!seen) return void requestAnimationFrame(frame); // off-screen: no work
        t += 0.004;
        if (pointer) setGoal(pointer.x, pointer.y);
        else
            setGoal(
                canvas.clientWidth * (0.55 + 0.3 * Math.sin(t)),
                canvas.clientHeight * (0.4 + 0.25 * Math.sin(t * 1.7))
            );
        sweep();
        sweep();
        draw();
        requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
}
