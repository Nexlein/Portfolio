import { SimBase } from '../core/SimBase.js';
import { UAIEngine, NeedKey, Action } from '../engines/UAIEngine.js';
import { Vector } from '../utils/Vector.js';
import { CanvasHelper } from '../utils/CanvasHelper.js';

export class UAISimulation extends SimBase {
    engine: UAIEngine;

    // Agent
    agentPos: Vector;
    agentVel: Vector;
    agentTarget: Vector | null;
    currentAction: NeedKey | null;
    lastActions: Action[];
    satisfyingTimer: number;

    ui: Record<string, HTMLElement | HTMLInputElement | null>;
    scoreRows: Record<NeedKey, { bar: HTMLElement | null; score: HTMLElement | null }>;

    ticks: number;

    constructor() {
        super('uai-canvas');

        this.engine = new UAIEngine(this.width, this.height);

        this.agentPos = new Vector(this.width / 2, this.height / 2);
        this.agentVel = new Vector(0, 0);
        this.agentTarget = null;
        this.currentAction = null;
        this.lastActions = [];
        this.satisfyingTimer = 0;
        this.ticks = 0;

        this.ui = this.bindUIElements({
            btnReset: 'uai-btn-reset',
            lblAction: 'uai-current-action',
            lblTicks: 'uai-ticks'
        });

        this.scoreRows = {
            hunger: { bar: null, score: null },
            thirst: { bar: null, score: null },
            rest:   { bar: null, score: null },
            social: { bar: null, score: null },
        };

        this.init();
    }

    init() {
        this.ui.speedSlider = this.bindSlider('uai-speed', 'uai-speed-val', 'x');

        // Weight sliders
        for (const need of this.engine.needs) {
            this.bindSlider(`uai-w-${need.key}`, `uai-w-${need.key}-val`, '', (val) => {
                this.engine.weights[need.key] = parseFloat(val);
            });
        }

        // Score rows refs
        for (const key of Object.keys(this.scoreRows) as NeedKey[]) {
            this.scoreRows[key] = {
                bar:   document.getElementById(`uai-bar-${key}`),
                score: document.getElementById(`uai-score-${key}`),
            };
        }

        this.bindPlayButton(document.getElementById('uai-btn-play'), 'primary', 'secondary');
        this.ui.btnReset?.addEventListener('click', () => this.resetSim());

        this.resetSim();
    }

    resetSim() {
        this.stop();
        this.engine.reset();
        this.agentPos = new Vector(this.width / 2, this.height / 2);
        this.agentVel = new Vector(0, 0);
        this.agentTarget = null;
        this.currentAction = null;
        this.lastActions = this.engine.evaluateActions();
        this.satisfyingTimer = 0;
        this.ticks = 0;
        this.updateStatsPanel(this.lastActions);
        this.clearCanvas();
        this.draw();
    }

    update() {
        const speed = parseFloat((this.ui.speedSlider as HTMLInputElement)?.value ?? '1');
        const actions = this.engine.tick(speed);
        this.lastActions = actions;
        this.ticks++;

        const best = actions.find(a => a.isWinning)!;

        // ── Satisfying phase ───────────────────────────────────────────────
        if (this.satisfyingTimer > 0) {
            this.satisfyingTimer--;
            this.engine.satisfy(this.currentAction!, 0.015 * speed);

            if (this.satisfyingTimer === 0) {
                // Done — wipe state so re-evaluation is forced next tick
                this.currentAction = null;
                this.agentTarget   = null;
            }
            this.updateStatsPanel(actions);
            return;
        }

        // ── Pick best action target ────────────────────────────────────────
        if (best.id !== this.currentAction) {
            this.currentAction = best.id;
            const pt = this.engine.points.find(p => p.id === this.currentAction)!;
            this.agentTarget = new Vector(pt.x, pt.y);
        }

        // ── Move toward target ─────────────────────────────────────────────
        if (this.agentTarget && this.currentAction) {
            const diff = Vector.sub(this.agentTarget, this.agentPos);
            const dist = diff.mag();
            const targetPt = this.engine.points.find(p => p.id === this.currentAction)!;

            if (dist < targetPt.radius + 4) {
                // Arrived — lock into satisfying
                this.satisfyingTimer = Math.floor(55 / Math.max(0.5, speed));
                this.agentVel = new Vector(0, 0);
            } else {
                diff.normalize();
                diff.mult(2.5 * speed);
                this.agentVel.add(diff);
                this.agentVel.limit(3.2 * speed);
                this.agentPos.add(this.agentVel);
                this.agentVel.mult(0.88);
            }
        }

        this.updateStatsPanel(actions);
    }

    updateStatsPanel(actions: Action[]) {
        if (this.ui.lblTicks) this.ui.lblTicks.textContent = this.ticks.toString();

        const winnerAction = actions.find(a => a.isWinning);
        if (this.ui.lblAction && winnerAction) {
            this.ui.lblAction.textContent = winnerAction.label;
            const need = this.engine.getNeed(winnerAction.id);
            (this.ui.lblAction as HTMLElement).style.color = need.color;
        }

        for (const action of actions) {
            const row = this.scoreRows[action.id];
            const need = this.engine.getNeed(action.id);
            const pct = Math.round(need.value * 100);

            if (row.bar) {
                (row.bar as HTMLElement).style.width = `${pct}%`;
                (row.bar as HTMLElement).style.background = need.color;
                (row.bar as HTMLElement).style.boxShadow = action.isWinning
                    ? `0 0 8px ${need.color}` : 'none';
            }
            if (row.score) {
                row.score.textContent = (action.score).toFixed(2);
                (row.score as HTMLElement).style.color = action.isWinning
                    ? need.color : 'var(--text-muted)';
                (row.score as HTMLElement).style.fontWeight = action.isWinning ? '700' : '400';
            }
        }
    }

    draw() {
        // Background
        this.ctx.fillStyle = '#05080e';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Subtle grid
        this.drawGrid(40);

        // Draw connection lines from agent to all points (faint)
        for (const pt of this.engine.points) {
            const isTarget = this.currentAction === pt.id;
            this.ctx.beginPath();
            this.ctx.moveTo(this.agentPos.x, this.agentPos.y);
            this.ctx.lineTo(pt.x, pt.y);
            this.ctx.strokeStyle = isTarget
                ? `${pt.color}44`
                : 'rgba(255,255,255,0.03)';
            this.ctx.lineWidth = isTarget ? 1.5 : 0.5;
            this.ctx.setLineDash(isTarget ? [6, 4] : []);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

        // Draw interest points
        for (const pt of this.engine.points) {
            const need = this.engine.getNeed(pt.id);
            const isActive = this.currentAction === pt.id;
            const urgency = need.value;

            // Outer pulse ring — scales with urgency
            const ring = pt.radius + 8 + urgency * 12;
            this.ctx.beginPath();
            this.ctx.arc(pt.x, pt.y, ring, 0, Math.PI * 2);
            this.ctx.strokeStyle = `${pt.color}${Math.round(urgency * 40).toString(16).padStart(2,'0')}`;
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

            // Background fill
            this.ctx.beginPath();
            this.ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = isActive
                ? `${pt.color}30`
                : `${pt.color}12`;
            this.ctx.fill();

            // Border
            this.ctx.beginPath();
            this.ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = isActive ? pt.color : `${pt.color}55`;
            this.ctx.lineWidth = isActive ? 2 : 1;
            this.ctx.stroke();

            // Need bar arc underneath (0→full circle = 0→1 need)
            const startAngle = -Math.PI / 2;
            const endAngle = startAngle + Math.PI * 2 * urgency;
            this.ctx.beginPath();
            this.ctx.arc(pt.x, pt.y, pt.radius + 5, startAngle, endAngle);
            this.ctx.strokeStyle = pt.color;
            this.ctx.lineWidth = 3;
            this.ctx.lineCap = 'round';
            this.ctx.stroke();
            this.ctx.lineCap = 'butt';

            // Icon label
            CanvasHelper.drawText(this.ctx, pt.icon, pt.x, pt.y - 4, '18px sans-serif');
            CanvasHelper.drawText(this.ctx, pt.label, pt.x, pt.y + 16, '9px Inter', `${pt.color}cc`);

            // Utility score badge
            const action = this.lastActions.find(a => a.id === pt.id);
            if (action) {
                const scoreStr = action.score.toFixed(2);
                CanvasHelper.drawText(
                    this.ctx, scoreStr,
                    pt.x, pt.y - pt.radius - 16,
                    `${action.isWinning ? '700' : '400'} 10px JetBrains Mono`,
                    action.isWinning ? pt.color : 'rgba(255,255,255,0.3)'
                );
            }
        }

        // Agent
        const isSatisfying = this.satisfyingTimer > 0;
        const agentColor = this.currentAction
            ? this.engine.getNeed(this.currentAction).color
            : '#f0f4f8';

        // Glow
        CanvasHelper.drawGlowCircle(this.ctx, this.agentPos.x, this.agentPos.y, 18, `${agentColor}30`);

        // Body
        this.ctx.beginPath();
        this.ctx.arc(this.agentPos.x, this.agentPos.y, 11, 0, Math.PI * 2);
        this.ctx.fillStyle = agentColor;
        this.ctx.fill();

        // Inner dot
        this.ctx.beginPath();
        this.ctx.arc(this.agentPos.x, this.agentPos.y, 4, 0, Math.PI * 2);
        this.ctx.fillStyle = '#05080e';
        this.ctx.fill();

        // "Satisfying" pulse ring
        if (isSatisfying) {
            const pulse = 14 + Math.sin(Date.now() * 0.015) * 4;
            this.ctx.beginPath();
            this.ctx.arc(this.agentPos.x, this.agentPos.y, pulse, 0, Math.PI * 2);
            this.ctx.strokeStyle = `${agentColor}66`;
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();
        }
    }
}
