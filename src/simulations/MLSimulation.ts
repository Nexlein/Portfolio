import { SimBase } from '../core/SimBase.js';
import { CanvasHelper } from '../utils/CanvasHelper.js';
import { MLLocalEngine } from '../engines/MLLocalEngine.js';

export class MLSimulation extends SimBase {
    ui: Record<string, HTMLElement | HTMLInputElement | null>;
    points: { px_x: number; px_y: number; label: number; x_norm: number; y_norm: number }[];
    engine: MLLocalEngine;
    epochs: number;
    trainingInterval: ReturnType<typeof setInterval> | null;
    activeClass: number;

    constructor() {
        super('ml-canvas');

        this.ui = this.bindUIElements({
            btnStep: 'ml-btn-step',
            btnReset: 'ml-btn-reset',
            lblEpoch: 'ml-epoch',
            lblAcc: 'ml-acc',
            lblW1: 'ml-w1',
            lblW2: 'ml-w2',
            lblBias: 'ml-bias',
            toast: 'ml-success-toast'
        });

        // Data
        this.points = []; // { x_norm, y_norm, label, px_x, px_y }
        this.engine = new MLLocalEngine();
        this.epochs = 0;
        this.trainingInterval = null;
        this.activeClass = 1;

        this.init();
    }

    init() {
        // Canvas interaction
        this.canvas.addEventListener('click', (e) => this.addPoint(e));
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.addPoint(e, true);
        });

        // Control hooks
        this.ui.lrSlider = this.bindSlider('ml-lr', 'ml-lr-val');
        this.ui.speedSlider = this.bindSlider('ml-speed', 'ml-speed-val', 'Hz', () => {
            if (this.isPlaying) {
                this.stop();
                this.start();
            }
        });

        this.bindPlayButton(document.getElementById('ml-btn-train'), 'primary', 'danger', 'Train', 'Pause');
        this.ui.btnStep?.addEventListener('click', () => this.trainStep());
        this.ui.btnReset?.addEventListener('click', () => this.reset());

        const btnClass = document.getElementById('ml-btn-class');
        if (btnClass) {
            btnClass.addEventListener('click', () => {
                this.activeClass = this.activeClass === 1 ? -1 : 1;
                const isRed = this.activeClass === 1;
                btnClass.innerHTML = `<span class="color-dot ${isRed ? 'red' : 'blue'}"></span> Class ${isRed ? 'A' : 'B'}`;
            });
        }

        this.reset();
    }

    reset() {
        this.stop();
        this.points = [];
        this.engine = new MLLocalEngine();
        this.epochs = 0;
        this.addDefaultPoints();
        this.updateStats();
        this.clearCanvas();
        this.draw();
    }

    addDefaultPoints() {
        const w = this.width;
        const h = this.height;

        // Class A (Red, +1)
        this.points.push(this.createPointObject(w * 0.2, h * 0.3, 1));
        this.points.push(this.createPointObject(w * 0.3, h * 0.2, 1));
        this.points.push(this.createPointObject(w * 0.15, h * 0.5, 1));
        this.points.push(this.createPointObject(w * 0.4, h * 0.4, 1));

        // Class B (Blue, -1)
        this.points.push(this.createPointObject(w * 0.7, h * 0.8, -1));
        this.points.push(this.createPointObject(w * 0.8, h * 0.7, -1));
        this.points.push(this.createPointObject(w * 0.85, h * 0.5, -1));
        this.points.push(this.createPointObject(w * 0.6, h * 0.6, -1));
    }

    createPointObject(px_x: number, px_y: number, label: number) {
        const x_norm = (px_x - this.width / 2) / (this.width / 2);
        const y_norm = -(px_y - this.height / 2) / (this.height / 2);
        return { x_norm, y_norm, label, px_x, px_y };
    }

    addPoint(e: MouseEvent, isRightClick = false) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const px_x = (e.clientX - rect.left) * scaleX;
        const px_y = (e.clientY - rect.top) * scaleY;
        const label = isRightClick || e.shiftKey ? -1 : this.activeClass;

        this.points.push(this.createPointObject(px_x, px_y, label));
        this.updateStats();
        this.clearCanvas();
        this.draw();
    }

    start() {
        if (this.points.length === 0) return;
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.onPlayStateChange(true);

        const speed = parseFloat((this.ui.speedSlider as HTMLInputElement)?.value || '10');
        const ms = 1000 / speed;

        this.trainingInterval = setInterval(() => {
            const allCorrect = this.trainStep();
            if (allCorrect) {
                this.stop();
                this.showToast();
            }
        }, ms);
    }

    stop() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        this.onPlayStateChange(false);
        if (this.trainingInterval) {
            clearInterval(this.trainingInterval);
            this.trainingInterval = null;
        }
    }

    predict(x: number, y: number) {
        return this.engine.predict(x, y);
    }

    trainStep() {
        if (this.points.length === 0) return true;

        const lr = parseFloat((this.ui.lrSlider as HTMLInputElement)?.value || '0.01');

        for (const p of this.points) {
            const updated = this.engine.trainPoint(p.x_norm, p.y_norm, p.label, lr);
            if (updated) {
                break; // update one point at a time for visual feedback
            }
        }

        const totalErrors = this.engine.countErrors(this.points);

        this.epochs++;
        this.updateStats(totalErrors);
        this.clearCanvas();
        this.draw();

        return totalErrors === 0;
    }

    updateStats(errors = -1) {
        if (errors === -1) {
            errors = 0;
            for (const p of this.points) {
                if (this.predict(p.x_norm, p.y_norm) !== p.label) {
                    errors++;
                }
            }
        }

        const total = this.points.length;
        const accuracy = total === 0 ? 0 : Math.round(((total - errors) / total) * 100);

        if (this.ui.lblEpoch) this.ui.lblEpoch.textContent = this.epochs.toString();
        if (this.ui.lblAcc) this.ui.lblAcc.textContent = accuracy + '%';
        if (this.ui.lblW1) this.ui.lblW1.textContent = this.engine.w1.toFixed(3);
        if (this.ui.lblW2) this.ui.lblW2.textContent = this.engine.w2.toFixed(3);
        if (this.ui.lblBias) this.ui.lblBias.textContent = this.engine.bias.toFixed(3);
    }

    showToast() {
        if (!this.ui.toast) return;
        this.ui.toast.classList.add('show');
        setTimeout(() => {
            if (this.ui.toast) this.ui.toast.classList.remove('show');
        }, 2500);
    }

    draw() {
        // Draw background grid lines
        this.drawGrid();

        // Draw coordinate axes
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.width / 2, 0);
        this.ctx.lineTo(this.width / 2, this.height);
        this.ctx.moveTo(0, this.height / 2);
        this.ctx.lineTo(this.width, this.height / 2);
        this.ctx.stroke();

        // Shaded decision boundary regions
        this.drawDecisionRegions();

        // Decision boundary line
        this.drawDecisionLine();

        // Points
        for (const p of this.points) {
            const isCorrect = this.predict(p.x_norm, p.y_norm) === p.label;

            if (!isCorrect) {
                this.ctx.beginPath();
                this.ctx.arc(p.px_x, p.px_y, 14, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
                this.ctx.fill();
                this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
                this.ctx.lineWidth = 1.5;
                this.ctx.setLineDash([3, 3]);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }

            CanvasHelper.drawGlowCircle(
                this.ctx,
                p.px_x,
                p.px_y,
                8,
                p.label === 1 ? '#ff4a4a' : '#3b82f6',
                p.label === 1 ? 'rgba(255, 74, 74, 0.4)' : 'rgba(59, 130, 246, 0.4)',
                8
            );

            // Inner core
            CanvasHelper.drawGlowCircle(this.ctx, p.px_x, p.px_y, 3, '#ffffff');
        }
    }

    drawDecisionRegions() {
        const cellSize = 12;
        this.ctx.globalAlpha = 0.07;
        for (let x = 0; x < this.width; x += cellSize) {
            for (let y = 0; y < this.height; y += cellSize) {
                const x_norm = (x + cellSize / 2 - this.width / 2) / (this.width / 2);
                const y_norm = -(y + cellSize / 2 - this.height / 2) / (this.height / 2);
                const pred = this.predict(x_norm, y_norm);

                this.ctx.fillStyle = pred === 1 ? '#ff4a4a' : '#3b82f6';
                this.ctx.fillRect(x, y, cellSize, cellSize);
            }
        }
        this.ctx.globalAlpha = 1.0;
    }

    drawDecisionLine() {
        const w1 = this.engine.w1;
        const w2 = this.engine.w2;
        const b = this.engine.bias;

        if (Math.abs(w2) < 0.001) {
            if (Math.abs(w1) < 0.001) return;
            const x_norm = -b / w1;
            const px_x = x_norm * (this.width / 2) + this.width / 2;

            this.ctx.strokeStyle = '#06b6d4';
            this.ctx.lineWidth = 3;
            this.ctx.shadowColor = 'rgba(6, 182, 212, 0.5)';
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.moveTo(px_x, 0);
            this.ctx.lineTo(px_x, this.height);
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
            return;
        }

        const x1_n = -1.2;
        const y1_n = -(w1 * x1_n + b) / w2;
        const x2_n = 1.2;
        const y2_n = -(w1 * x2_n + b) / w2;

        const p1x = x1_n * (this.width / 2) + this.width / 2;
        const p1y = this.height / 2 - y1_n * (this.height / 2);
        const p2x = x2_n * (this.width / 2) + this.width / 2;
        const p2y = this.height / 2 - y2_n * (this.height / 2);

        this.ctx.strokeStyle = '#06b6d4';
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = 'rgba(6, 182, 212, 0.6)';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.moveTo(p1x, p1y);
        this.ctx.lineTo(p2x, p2y);
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }
}
