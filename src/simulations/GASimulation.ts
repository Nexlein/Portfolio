import { SimBase } from '../core/SimBase.js';
import { CanvasHelper } from '../utils/CanvasHelper.js';
import { Vector } from '../utils/Vector.js';
import { DNA, GAAgent } from '../engines/GAEngine.js';

export class GASimulation extends SimBase {
    ui: Record<string, HTMLElement | HTMLInputElement | null>;
    lifespan: number;
    currentStep: number;
    generation: number;
    target: Vector & { r: number };
    obstacle: { x: number, y: number, w: number, h: number };
    startPos: Vector;
    agents: GAAgent[];
    matingPool: GAAgent[];
    bestDNA: DNA | null;
    reachedCount: number;

    constructor() {
        super('ga-canvas');

        // Controls
        this.ui = this.bindUIElements({
            btnReset: 'ga-btn-reset',
            lblGen: 'ga-gen',
            lblFitness: 'ga-fitness',
            lblAvgFitness: 'ga-avg-fitness',
            lblReached: 'ga-reached',
        });

        // DNA Config
        this.lifespan = 180;
        this.currentStep = 0;
        this.generation = 0;

        // Dimensions
        this.target = Object.assign(new Vector(this.width / 2, 50), { r: 12 });
        this.obstacle = { x: this.width / 2 - 150, y: this.height / 2 - 10, w: 300, h: 20 };
        this.startPos = new Vector(this.width / 2, this.height - 40);

        this.isPlaying = false;
        this.agents = [];
        this.matingPool = [];
        this.bestDNA = null;
        this.reachedCount = 0;

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
        this.generation = 1;
        this.currentStep = 0;
        this.bestDNA = null;
        this.reachedCount = 0;

        this.initializePopulation();
        this.updateStats(0, 0);
        this.clearCanvas();
        this.draw();
    }

    initializePopulation() {
        const popSize = parseInt((this.ui.popSlider as HTMLInputElement)?.value || "150");
        this.agents = [];
        for (let i = 0; i < popSize; i++) {
            const dna = new DNA(this.lifespan);
            this.agents.push(new GAAgent(this.startPos, dna, this.width, this.height, this.target, this.obstacle));
        }
    }

    update() {
        this.agents.forEach(agent => agent.update(this.currentStep));
        this.currentStep++;

        const allDone = this.agents.every(a => a.crashed || a.completed);
        if (this.currentStep >= this.lifespan || allDone) {
            this.evaluateAndBreed();
        }
    }

    evaluateAndBreed() {
        let maxFit = 0;
        let sumFit = 0;
        let reached = 0;
        let bestAgent = this.agents[0];

        this.agents.forEach(agent => {
            agent.calcFitness();
            sumFit += agent.fitness;
            if (agent.fitness > maxFit) {
                maxFit = agent.fitness;
                bestAgent = agent;
            }
            if (agent.completed) {
                reached++;
            }
        });

        const avgFit = sumFit / this.agents.length;
        this.reachedCount = reached;
        this.bestDNA = bestAgent.dna;

        this.updateStats(maxFit, avgFit);

        // Selection mating pool
        this.matingPool = [];
        this.agents.forEach(agent => {
            const normalizedFitness = maxFit === 0 ? 0 : agent.fitness / maxFit;
            const n = Math.floor(normalizedFitness * 100);
            for (let j = 0; j < n; j++) {
                this.matingPool.push(agent);
            }
        });

        if (this.matingPool.length === 0) {
            this.matingPool = [...this.agents];
        }

        // Breeding
        const popSize = parseInt((this.ui.popSlider as HTMLInputElement)?.value || "150");
        const nextAgents = [];

        // Carry over elite DNA
        const eliteDna = new DNA(this.lifespan);
        eliteDna.genes = this.bestDNA.genes.map(v => v.copy());
        nextAgents.push(new GAAgent(this.startPos, eliteDna, this.width, this.height, this.target, this.obstacle));

        const mutateRate = parseFloat((this.ui.mutateSlider as HTMLInputElement)?.value || "0.01");
        for (let i = 1; i < popSize; i++) {
            const parentA = this.matingPool[Math.floor(Math.random() * this.matingPool.length)];
            const parentB = this.matingPool[Math.floor(Math.random() * this.matingPool.length)];
            const childDNA = parentA.dna.crossover(parentB.dna);
            childDNA.mutate(mutateRate);
            nextAgents.push(new GAAgent(this.startPos, childDNA, this.width, this.height, this.target, this.obstacle));
        }

        this.agents = nextAgents;
        this.generation++;
        this.currentStep = 0;
    }

    updateStats(maxFit: number, avgFit: number) {
        if (this.ui.lblGen) this.ui.lblGen.textContent = this.generation.toString();
        if (this.ui.lblFitness) this.ui.lblFitness.textContent = maxFit.toFixed(4);
        if (this.ui.lblAvgFitness) this.ui.lblAvgFitness.textContent = avgFit.toFixed(4);
        if (this.ui.lblReached) this.ui.lblReached.textContent = this.reachedCount + ' / ' + this.agents.length;
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

        const progressWidth = (this.currentStep / this.lifespan) * this.width;
        this.ctx.fillStyle = '#f97316';
        this.ctx.fillRect(0, 0, progressWidth, 4);

        // Sort agents by fitness descending
        const sortedAgents = [...this.agents].sort((a, b) => b.fitness - a.fitness);

        sortedAgents.forEach((agent, idx) => {
            CanvasHelper.drawGAAgent(this.ctx, agent.pos.x, agent.pos.y, agent.crashed, agent.completed, idx === 0 && this.generation > 1);
        });
    }
}
