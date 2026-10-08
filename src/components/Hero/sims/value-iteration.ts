/**
 * Value iteration on a grid: every cell's arrow points along the best path to the reward (the cursor).
 * A click toggles a wall and the policy re-plans around it.
 */
import type { Stage } from './stage';

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

export function valueIteration(s: Stage): void {
    const { ctx, colors } = s;
    let cols = 0,
        rows = 0,
        V = new Float32Array(0),
        angle = new Float32Array(0),
        wall = new Uint8Array(0);
    let goal = { x: 0, y: 0 };

    const grid = () => {
        cols = Math.ceil(s.width / CELL);
        rows = Math.ceil(s.height / CELL);
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
        for (let y = 0; y < rows; y++)
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
                    const d = Math.atan2(
                        Math.sin(Math.atan2(by, bx) - angle[i]),
                        Math.cos(Math.atan2(by, bx) - angle[i])
                    );
                    angle[i] += s.reduced ? d : d * 0.25; // ease the arrows toward the new decision
                }
            }
    };

    const draw = () => {
        ctx.clearRect(0, 0, s.width, s.height);
        ctx.lineWidth = 1.6;
        for (let y = 0; y < rows; y++)
            for (let x = 0; x < cols; x++) {
                const i = y * cols + x;
                if (wall[i]) {
                    ctx.globalAlpha = 1;
                    ctx.fillStyle = colors.line;
                    ctx.fillRect(x * CELL + 3, y * CELL + 3, CELL - 6, CELL - 6);
                    continue;
                }
                const v = V[i];
                if (v <= 0) continue;
                const len = 5 + 8 * Math.sqrt(v);
                ctx.save();
                ctx.translate(x * CELL + CELL / 2, y * CELL + CELL / 2);
                ctx.rotate(angle[i]);
                ctx.globalAlpha = 0.25 + 0.75 * Math.sqrt(v);
                ctx.strokeStyle = v > 0.55 ? colors.signal : colors.cold;
                ctx.beginPath();
                ctx.moveTo(-len / 2, 0);
                ctx.lineTo(len / 2, 0);
                ctx.lineTo(len / 2 - 3, -3);
                ctx.moveTo(len / 2, 0);
                ctx.lineTo(len / 2 - 3, 3);
                ctx.stroke();
                ctx.restore();
            }
        ctx.globalAlpha = 1;
        ctx.fillStyle = colors.signal;
        ctx.beginPath();
        ctx.arc(goal.x * CELL + CELL / 2, goal.y * CELL + CELL / 2, 6, 0, Math.PI * 2);
        ctx.fill();
    };

    const setGoal = (p: { x: number; y: number }) => {
        const x = Math.max(0, Math.min(cols - 1, Math.floor(p.x / CELL))),
            y = Math.max(0, Math.min(rows - 1, Math.floor(p.y / CELL)));
        if (!wall[y * cols + x]) goal = { x, y };
    };

    s.onClick((p) => {
        const x = Math.floor(p.x / CELL),
            y = Math.floor(p.y / CELL);
        if (x === goal.x && y === goal.y) return;
        const i = y * cols + x;
        wall[i] = wall[i] ? 0 : 1;
        V[i] = 0;
        if (s.reduced) {
            for (let k = 0; k < cols + rows; k++) sweep();
            draw();
        }
    });
    s.onResize(grid);
    grid();
    setGoal({ x: s.width * 0.7, y: s.height * 0.35 });

    let t = 0;
    s.loop(() => {
        if (s.reduced) {
            for (let k = 0; k < cols + rows; k++) sweep();
            return draw();
        }
        setGoal(s.pointer() ?? s.wander((t += 0.004)));
        sweep();
        sweep();
        draw();
    });
}
