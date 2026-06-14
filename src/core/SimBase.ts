import { CanvasHelper } from '../utils/CanvasHelper.js';

export class SimBase {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    isPlaying: boolean;
    animationId: number | null;

    btnPlay?: HTMLElement | null;
    playClass?: string;
    pauseClass?: string;
    playText?: string;
    pauseText?: string;

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!this.canvas) {
            throw new Error(`Canvas with id "${canvasId}" not found.`);
        }
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.isPlaying = false;
        this.animationId = null;
    }

    // Base methods to be overridden by child simulations
    init() {
        this.reset();
    }

    start() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.onPlayStateChange(true);
        this.loop();
    }

    stop() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        this.onPlayStateChange(false);
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    toggle() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.start();
        }
    }

    reset() {
        this.stop();
        this.clearCanvas();
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    drawGrid(spacing = 30) {
        CanvasHelper.drawGrid(this.ctx, this.width, this.height, spacing);
    }

    // Hook for loop logic
    loop() {
        if (!this.isPlaying) return;
        this.update();
        this.clearCanvas();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.loop());
    }

    update() {
        // Override in subclass
    }

    draw() {
        // Override in subclass
    }

    bindPlayButton(btnElement: HTMLElement | null, playClass: string = 'primary', pauseClass: string = 'danger', playText: string = 'Play', pauseText: string = 'Pause') {
        if (!btnElement) return;
        this.btnPlay = btnElement;
        this.playClass = playClass;
        this.pauseClass = pauseClass;
        this.playText = playText;
        this.pauseText = pauseText;
        this.btnPlay.addEventListener('click', () => this.toggle());
    }

    bindSlider(sliderId: string, valId: string, suffix: string = '', onChange: ((val: string) => void) | null = null): HTMLInputElement | null {
        const slider = document.getElementById(sliderId) as HTMLInputElement;
        const val = document.getElementById(valId);
        if (!slider || !val) return null;

        slider.addEventListener('input', () => {
            val.textContent = slider.value + suffix;
            if (onChange) onChange(slider.value);
        });
        return slider;
    }

    /**
     * Automatically binds a map of property keys to DOM element IDs.
     * @param map A dictionary where key is the property name, and value is the DOM ID.
     */
    protected bindUIElements<T extends Record<string, string>>(map: T): Record<keyof T, HTMLElement | HTMLInputElement | null> {
        const bound: Record<string, HTMLElement | null> = {};
        for (const [key, id] of Object.entries(map)) {
            bound[key] = document.getElementById(id);
        }
        return bound as Record<keyof T, HTMLElement | HTMLInputElement | null>;
    }

    onPlayStateChange(isPlaying: boolean) {
        if (!this.btnPlay || !this.pauseText || !this.playText || !this.pauseClass || !this.playClass) return;
        if (isPlaying) {
            this.btnPlay.textContent = this.pauseText;
            this.btnPlay.classList.add(this.pauseClass);
            this.btnPlay.classList.remove(this.playClass);
        } else {
            this.btnPlay.textContent = this.playText;
            this.btnPlay.classList.remove(this.pauseClass);
            this.btnPlay.classList.add(this.playClass);
        }
    }
}
