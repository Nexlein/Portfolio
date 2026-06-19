import { SimBase } from '../core/SimBase.js';
import { CanvasHelper } from '../utils/CanvasHelper.js';
import { MLUnsupervisedEngine, Point } from '../engines/MLUnsupervisedEngine.js';

const CLUSTER_COLORS = ['#ff4a4a', '#3b82f6', '#34d399', '#fb923c', '#a78bfa'];

export class MLUnsupervisedSimulation extends SimBase {
    engine: MLUnsupervisedEngine;
    points: Point[] = [];
    ui: Record<string, HTMLElement | HTMLInputElement | null>;
    trainingInterval: ReturnType<typeof setInterval> | null = null;
    stepPhase: 'assign' | 'update' = 'assign';

    constructor() {
        super('ml-unsupervised-canvas');
        this.engine = new MLUnsupervisedEngine(3);

        this.ui = this.bindUIElements({
            btnStep: 'ml-unsupervised-btn-step',
            btnReset: 'ml-unsupervised-btn-reset'
        });
        this.ui.sliderK = this.bindSlider('ml-unsupervised-k', 'ml-unsupervised-k-val');
        this.bindPlayButton(
            document.getElementById('ml-unsupervised-btn-train'),
            'primary',
            'danger',
            'Auto Cluster',
            'Pause'
        );

        this.init();
    }

    init() {
        this.canvas.addEventListener('click', (e) => this.addPoint(e));
        this.ui.btnStep?.addEventListener('click', () => {
            this.trainStep();
        });
        this.ui.btnReset?.addEventListener('click', () => this.reset());

        this.ui.sliderK?.addEventListener('input', () => {
            this.engine.k = parseInt((this.ui.sliderK as HTMLInputElement).value);
            this.resetCentroids();
        });

        this.reset();
    }

    reset() {
        this.stop();
        this.points = [];
        this.stepPhase = 'assign';
        this.engine.k = parseInt((this.ui.sliderK as HTMLInputElement)?.value || '3');
        this.addDefaultPoints();
        this.resetCentroids();
        this.draw();
    }

    resetCentroids() {
        this.points.forEach((p) => (p.cluster = -1));
        this.engine.initCentroids(this.points);
        this.stepPhase = 'assign';
        this.draw();
    }

    addDefaultPoints() {
        const w = this.width;
        const h = this.height;

        const addCluster = (cx: number, cy: number, spread: number, count: number) => {
            for (let i = 0; i < count; i++) {
                const px_x = cx + (Math.random() - 0.5) * spread;
                const px_y = cy + (Math.random() - 0.5) * spread;
                this.points.push(this.createPointObject(px_x, px_y));
            }
        };

        addCluster(w * 0.2, h * 0.2, 100, 15);
        addCluster(w * 0.8, h * 0.8, 100, 15);
        addCluster(w * 0.2, h * 0.8, 100, 15);
    }

    createPointObject(px_x: number, px_y: number): Point {
        return {
            px_x,
            px_y,
            x_norm: (px_x - this.width / 2) / (this.width / 2),
            y_norm: -(px_y - this.height / 2) / (this.height / 2),
            cluster: -1
        };
    }

    addPoint(e: MouseEvent) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const px_x = (e.clientX - rect.left) * scaleX;
        const px_y = (e.clientY - rect.top) * scaleY;
        this.points.push(this.createPointObject(px_x, px_y));
        this.draw();
    }

    trainStep(): boolean {
        if (this.points.length === 0) return true;
        let done = false;

        if (this.stepPhase === 'assign') {
            const changed = this.engine.assignClusters(this.points);
            if (!changed) done = true;
            this.stepPhase = 'update';
        } else {
            this.engine.updateCentroids(this.points);
            this.stepPhase = 'assign';
        }

        this.draw();
        return done;
    }

    start() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.onPlayStateChange(true);

        this.trainingInterval = setInterval(() => {
            const done = this.trainStep();
            if (done) this.stop();
        }, 500); // Slower interval to see the K-Means steps clearly
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

    draw() {
        this.clearCanvas();
        this.drawGrid();

        // Draw points
        for (const p of this.points) {
            const color = p.cluster >= 0 ? CLUSTER_COLORS[p.cluster % CLUSTER_COLORS.length] : '#888';
            CanvasHelper.drawGlowCircle(this.ctx, p.px_x, p.px_y, 6, color, color, 4);
        }

        // Draw centroids
        for (let i = 0; i < this.engine.centroids.length; i++) {
            const c = this.engine.centroids[i];
            const px = c.x_norm * (this.width / 2) + this.width / 2;
            const py = this.height / 2 - c.y_norm * (this.height / 2);
            const color = CLUSTER_COLORS[i % CLUSTER_COLORS.length];

            // Draw a cross for the centroid
            this.ctx.beginPath();
            this.ctx.moveTo(px - 10, py - 10);
            this.ctx.lineTo(px + 10, py + 10);
            this.ctx.moveTo(px + 10, py - 10);
            this.ctx.lineTo(px - 10, py + 10);
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 4;
            this.ctx.stroke();

            // Glow
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 10;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        }
    }
}
