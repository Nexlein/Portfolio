import { SimBase } from '../core/SimBase.js';
import { CanvasHelper } from '../utils/CanvasHelper.js';
import { Vector } from '../utils/Vector.js';
import { GAEngine } from '../engines/GAEngine.js';

export class GASimulation extends SimBase {
    ui: Record<string, HTMLElement | HTMLInputElement | null>;
    target: Vector & { r: number };
    obstacle: { x: number; y: number; w: number; h: number };
    startPos: Vector;
    engine: GAEngine;

    constructor() {
        super('ga-canvas');

        // Controls
        this.ui = this.bindUIElements({
            btnReset: 'ga-btn-reset',
            lblGen: 'ga-gen',
            lblFitness: 'ga-fitness',
            lblAvgFitness: 'ga-avg-fitness',
            lblReached: 'ga-reached'
        });

        // Dimensions
        this.target = Object.assign(new Vector(this.width / 2, 50), { r: 12 });
        this.obstacle = { x: this.width / 2 - 150, y: this.height / 2 - 10, w: 300, h: 20 };
        this.startPos = new Vector(this.width / 2, this.height - 40);

        this.engine = new GAEngine(180, this.width, this.height, this.startPos);
        this.engine.setEnvironment(this.target, this.obstacle);

        this.isPlaying = false;
        this.init();
    }

    init() {
        this.ui.mutateSlider = this.bindSlider('ga-mutate', 'ga-mutate-val', '', (val) => {
            const valEl = document.getElementById('ga-mutate-val');
            if (valEl) valEl.textContent = Math.round(parseFloat(val) * 100) + '%';
        });
        this.ui.popSlider = this.bindSlider('ga-pop', 'ga-pop-val');

        this.bindPlayButton(document.getElementById('ga-btn-play'), 'primary', 'danger');
        this.ui.btnReset?.addEventListener('click', () => this.reset());

        this.reset();
    }

    reset() {
        super.reset();

        const popSize = parseInt((this.ui.popSlider as HTMLInputElement)?.value || '150');
        this.engine.initializePopulation(popSize);

        this.updateStats();
        this.clearCanvas();
        this.draw();
    }

    update() {
        const generationDone = this.engine.step();

        if (generationDone) {
            const popSize = parseInt((this.ui.popSlider as HTMLInputElement)?.value || '150');
            const mutateRate = parseFloat((this.ui.mutateSlider as HTMLInputElement)?.value || '0.01');
            this.engine.evaluateAndBreed(popSize, mutateRate);
            this.updateStats();
        }
    }

    updateStats() {
        if (this.ui.lblGen) this.ui.lblGen.textContent = this.engine.generation.toString();
        if (this.ui.lblFitness) this.ui.lblFitness.textContent = this.engine.maxFitness.toFixed(4);
        if (this.ui.lblAvgFitness) this.ui.lblAvgFitness.textContent = this.engine.avgFitness.toFixed(4);
        if (this.ui.lblReached)
            this.ui.lblReached.textContent = this.engine.reachedCount + ' / ' + this.engine.agents.length;
    }

    draw() {
        this.drawGrid();

        // 2. Target 🎯
        CanvasHelper.drawTarget(this.ctx, this.target.x, this.target.y, this.target.r);

        // 3. Obstacle wall
        this.ctx.fillStyle = '#334155';
        this.ctx.fillRect(this.obstacle.x, this.obstacle.y, this.obstacle.w, this.obstacle.h);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(this.obstacle.x, this.obstacle.y, this.obstacle.w, this.obstacle.h);

        // 4. Lifespan Progress
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.fillRect(0, 0, this.width, 4);

        const progressWidth = (this.engine.currentStep / this.engine.lifespan) * this.width;
        this.ctx.fillStyle = '#f97316';
        this.ctx.fillRect(0, 0, progressWidth, 4);

        // Sort agents by fitness descending for rendering (elite goes last or first?)
        const sortedAgents = [...this.engine.agents].sort((a, b) => b.fitness - a.fitness);

        sortedAgents.forEach((agent, idx) => {
            CanvasHelper.drawGAAgent(
                this.ctx,
                agent.pos.x,
                agent.pos.y,
                agent.crashed,
                agent.completed,
                idx === 0 && this.engine.generation > 1
            );
        });
    }
}
