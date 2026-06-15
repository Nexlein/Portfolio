import { SimBase } from '../core/SimBase.js';
import { CanvasHelper } from '../utils/CanvasHelper.js';
import { RLLocalEngine } from '../engines/RLLocalEngine.js';

export class RLSimulation extends SimBase {
    ui: Record<string, HTMLElement | HTMLInputElement | null>;

    engine: RLLocalEngine;
    cellSize: number;
    currentState: { r: number; c: number };
    startState: { r: number; c: number };

    get rows() {
        return this.engine.rows;
    }
    get cols() {
        return this.engine.cols;
    }
    get grid() {
        return this.engine.grid;
    }
    get qTable() {
        return this.engine.qTable;
    }
    get actions() {
        return this.engine.actions;
    }

    episodes: number;
    stepsInEpisode: number;
    lastReward: number;
    recentOutcomes: boolean[];
    stepInterval: ReturnType<typeof setInterval> | null = null;

    constructor() {
        super('rl-canvas');

        this.ui = this.bindUIElements({
            btnTrain100: 'rl-btn-train-100',
            btnReset: 'rl-btn-reset',
            lblEpisodes: 'rl-episodes',
            lblReward: 'rl-reward',
            lblSteps: 'rl-steps',
            lblSuccessRate: 'rl-success-rate'
        });

        // Grid Layout details
        const rows = 5;
        const cols = 5;
        const grid = [
            [0, 0, 0, 0, 2],
            [0, 1, 0, 1, 3],
            [0, 1, 0, 0, 0],
            [0, 0, 1, 1, 0],
            [0, 0, 0, 0, 0]
        ];

        this.engine = new RLLocalEngine(rows, cols, grid);
        this.cellSize = this.width / cols;
        this.startState = { r: 4, c: 0 };
        this.currentState = { ...this.startState };

        this.episodes = 0;
        this.stepsInEpisode = 0;
        this.lastReward = 0;
        this.recentOutcomes = [];

        this.init();
    }

    init() {
        this.engine.initQTable();

        // Sliders
        this.ui.lrSlider = this.bindSlider('rl-lr', 'rl-lr-val');
        this.ui.discountSlider = this.bindSlider('rl-discount', 'rl-discount-val');
        this.ui.epsilonSlider = this.bindSlider('rl-epsilon', 'rl-epsilon-val');
        this.ui.speedSlider = this.bindSlider('rl-speed', 'rl-speed-val', 'ms/step', () => {
            if (this.isPlaying) {
                this.stop();
                this.start();
            }
        });

        // Buttons
        this.bindPlayButton(document.getElementById('rl-btn-play'), 'primary', 'danger');
        this.ui.btnTrain100?.addEventListener('click', () => this.trainMultipleEpisodes(100));
        this.ui.btnReset?.addEventListener('click', () => this.resetTable());

        this.updateStats();
        this.draw();
    }

    resetTable() {
        this.stop();
        this.engine.initQTable();
        this.currentState = { ...this.startState };
        this.episodes = 0;
        this.stepsInEpisode = 0;
        this.lastReward = 0;
        this.recentOutcomes = [];
        this.updateStats();
        this.clearCanvas();
        this.draw();
    }

    // Override start/stop interval loop for RL steps instead of RAF frames
    start() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.onPlayStateChange(true);

        const stepDelay = parseInt((this.ui.speedSlider as HTMLInputElement)?.value || '100');
        this.stepInterval = setInterval(() => {
            this.step();
        }, stepDelay);
    }

    stop() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        this.onPlayStateChange(false);
        if (this.stepInterval) {
            clearInterval(this.stepInterval);
            this.stepInterval = null;
        }
    }

    step() {
        const r = this.currentState.r;
        const c = this.currentState.c;

        const cellType = this.engine.grid[r][c];
        if (cellType === 2 || cellType === 3) {
            this.recentOutcomes.push(cellType === 2);
            if (this.recentOutcomes.length > 30) this.recentOutcomes.shift();

            this.episodes++;
            this.stepsInEpisode = 0;
            this.currentState = { ...this.startState };
            this.updateStats();
            this.clearCanvas();
            this.draw();
            return;
        }

        // Local Tabular Q-Learning fallback
        const epsilon = parseFloat((this.ui.epsilonSlider as HTMLInputElement)?.value || '0.1');
        const action = this.engine.chooseAction(r, c, epsilon);
        this.executeLocalAction(r, c, action);
    }

    executeLocalAction(r: number, c: number, action: number) {
        const move = this.engine.actions[action];

        let nextR = r + move.dr;
        let nextC = c + move.dc;
        let reward = -1;

        if (
            nextR < 0 ||
            nextR >= this.engine.rows ||
            nextC < 0 ||
            nextC >= this.engine.cols ||
            this.engine.grid[nextR][nextC] === 1
        ) {
            nextR = r;
            nextC = c;
            reward = -2;
        } else {
            const targetCell = this.engine.grid[nextR][nextC];
            if (targetCell === 2) {
                reward = 100;
            } else if (targetCell === 3) {
                reward = -100;
            }
        }

        const alpha = parseFloat((this.ui.lrSlider as HTMLInputElement)?.value || '0.1');
        const gamma = parseFloat((this.ui.discountSlider as HTMLInputElement)?.value || '0.9');

        this.engine.updateQ(r, c, action, reward, nextR, nextC, alpha, gamma);

        this.currentState = { r: nextR, c: nextC };
        this.stepsInEpisode++;
        this.lastReward = reward;

        this.updateStats();
        this.clearCanvas();
        this.draw();
    }

    trainMultipleEpisodes(numEpisodes: number) {
        const wasPlaying = this.isPlaying;
        this.stop();

        const alpha = parseFloat((this.ui.lrSlider as HTMLInputElement)?.value || '0.1');
        const gamma = parseFloat((this.ui.discountSlider as HTMLInputElement)?.value || '0.9');
        const epsilon = parseFloat((this.ui.epsilonSlider as HTMLInputElement)?.value || '0.1');

        for (let ep = 0; ep < numEpisodes; ep++) {
            let state = { ...this.startState };
            let steps = 0;
            let reward = 0;

            while (steps < 200) {
                const r = state.r;
                const c = state.c;

                const cellType = this.grid[r][c];
                if (cellType === 2 || cellType === 3) {
                    this.recentOutcomes.push(cellType === 2);
                    if (this.recentOutcomes.length > 30) this.recentOutcomes.shift();
                    break;
                }

                let action;
                if (Math.random() < epsilon) {
                    action = Math.floor(Math.random() * 4);
                } else {
                    let maxVal = -Infinity;
                    let maxIdx = 0;
                    for (let a = 0; a < 4; a++) {
                        if (this.qTable[r][c][a] > maxVal) {
                            maxVal = this.qTable[r][c][a];
                            maxIdx = a;
                        }
                    }
                    action = maxIdx;
                }

                const move = this.actions[action];
                let nextR = r + move.dr;
                let nextC = c + move.dc;
                let stepReward = -1;

                if (
                    nextR < 0 ||
                    nextR >= this.rows ||
                    nextC < 0 ||
                    nextC >= this.cols ||
                    this.grid[nextR][nextC] === 1
                ) {
                    nextR = r;
                    nextC = c;
                    stepReward = -2;
                } else {
                    const targetCell = this.grid[nextR][nextC];
                    if (targetCell === 2) {
                        stepReward = 100;
                    } else if (targetCell === 3) {
                        stepReward = -100;
                    }
                }

                let nextMaxQ = -Infinity;
                for (let a = 0; a < 4; a++) {
                    if (this.qTable[nextR][nextC][a] > nextMaxQ) {
                        nextMaxQ = this.qTable[nextR][nextC][a];
                    }
                }

                const currentQ = this.qTable[r][c][action];
                this.qTable[r][c][action] = currentQ + alpha * (stepReward + gamma * nextMaxQ - currentQ);

                state = { r: nextR, c: nextC };
                steps++;
                reward = stepReward;
            }

            this.episodes++;
            this.lastReward = reward;
            this.stepsInEpisode = steps;
        }

        this.currentState = { ...this.startState };
        this.updateStats();
        this.clearCanvas();
        this.draw();

        if (wasPlaying) {
            this.start();
        }
    }

    updateStats() {
        if (this.ui.lblEpisodes) this.ui.lblEpisodes.textContent = this.episodes.toString();
        if (this.ui.lblReward) this.ui.lblReward.textContent = this.lastReward.toString();
        if (this.ui.lblSteps) this.ui.lblSteps.textContent = this.stepsInEpisode.toString();

        if (this.ui.lblSuccessRate) {
            if (this.recentOutcomes.length === 0) {
                this.ui.lblSuccessRate.textContent = '0%';
            } else {
                const successes = this.recentOutcomes.filter(Boolean).length;
                const rate = Math.round((successes / this.recentOutcomes.length) * 100);
                this.ui.lblSuccessRate.textContent = rate + '%';
            }
        }
    }

    draw() {
        // Background
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw Grid
        this.drawRLGrid(
            this.ctx,
            this.engine.grid,
            this.engine.qTable,
            this.engine.rows,
            this.engine.cols,
            this.cellSize
        );

        // Draw Agent
        this.drawRLAgent(this.ctx, this.currentState.r, this.currentState.c, this.cellSize);
    }

    private drawRLGrid(
        ctx: CanvasRenderingContext2D,
        grid: number[][],
        qTable: number[][][],
        rows: number,
        cols: number,
        cellSize: number
    ) {
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = c * cellSize;
                const y = r * cellSize;
                const type = grid[r][c];

                ctx.strokeStyle = '#334155';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, cellSize, cellSize);

                if (type === 1) {
                    // Wall
                    ctx.fillStyle = '#475569';
                    ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
                    ctx.strokeStyle = '#64748b';
                    ctx.beginPath();
                    ctx.moveTo(x + 10, y + cellSize - 10);
                    ctx.lineTo(x + cellSize - 10, y + cellSize - 10);
                    ctx.lineTo(x + cellSize - 10, y + 10);
                    ctx.stroke();
                } else if (type === 2) {
                    // Target
                    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
                    ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
                    ctx.strokeStyle = '#10b981';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
                    CanvasHelper.drawText(ctx, '🏆', x + cellSize / 2, y + cellSize / 2, '28px Outfit');
                } else if (type === 3) {
                    // Trap
                    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
                    ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
                    ctx.strokeStyle = '#ef4444';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
                    CanvasHelper.drawText(ctx, '🔥', x + cellSize / 2, y + cellSize / 2, '28px Outfit');
                } else {
                    const qVals = qTable[r][c];
                    const midX = x + cellSize / 2;
                    const midY = y + cellSize / 2;
                    const size = cellSize;

                    const drawTriangle = (
                        p1x: number,
                        p1y: number,
                        p2x: number,
                        p2y: number,
                        p3x: number,
                        p3y: number,
                        val: number
                    ) => {
                        ctx.beginPath();
                        ctx.moveTo(p1x, p1y);
                        ctx.lineTo(p2x, p2y);
                        ctx.lineTo(p3x, p3y);
                        ctx.closePath();

                        const strength = Math.min(Math.abs(val) / 100, 1.0);
                        if (val > 0.001) {
                            ctx.fillStyle = `rgba(16, 185, 129, ${0.05 + strength * 0.75})`;
                        } else if (val < -0.001) {
                            ctx.fillStyle = `rgba(239, 68, 68, ${0.05 + strength * 0.75})`;
                        } else {
                            ctx.fillStyle = 'transparent';
                        }
                        ctx.fill();

                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
                        ctx.stroke();

                        if (Math.abs(val) > 0.1) {
                            let tx = (p1x + p2x + p3x) / 3;
                            let ty = (p1y + p2y + p3y) / 3;
                            CanvasHelper.drawText(
                                ctx,
                                val.toFixed(1),
                                tx,
                                ty,
                                '10px JetBrains Mono',
                                'rgba(255, 255, 255, 0.7)'
                            );
                        }
                    };

                    drawTriangle(x, y, x + size, y, midX, midY, qVals[0]); // Up
                    drawTriangle(x + size, y, x + size, y + size, midX, midY, qVals[1]); // Right
                    drawTriangle(x, y + size, x + size, y + size, midX, midY, qVals[2]); // Down
                    drawTriangle(x, y, x, y + size, midX, midY, qVals[3]); // Left
                }
            }
        }
    }

    private drawRLAgent(ctx: CanvasRenderingContext2D, r: number, c: number, cellSize: number) {
        const agentX = c * cellSize + cellSize / 2;
        const agentY = r * cellSize + cellSize / 2;
        CanvasHelper.drawGlowCircle(ctx, agentX, agentY, cellSize * 0.3, '#06b6d4');
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(agentX, agentY, cellSize * 0.15, 0, Math.PI * 2);
        ctx.fill();
    }
}
