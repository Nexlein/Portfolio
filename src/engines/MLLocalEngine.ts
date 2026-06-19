export class MLLocalEngine {
    w1: number;
    w2: number;
    bias: number;

    constructor() {
        this.w1 = Math.random() * 2 - 1;
        this.w2 = Math.random() * 2 - 1;
        this.bias = Math.random() * 2 - 1;
    }

    predict(x: number, y: number): number {
        const sum = this.w1 * x + this.w2 * y + this.bias;
        return sum >= 0 ? 1 : -1;
    }

    trainPoint(x: number, y: number, label: number, lr: number): boolean {
        const pred = this.predict(x, y);
        if (pred !== label) {
            const err = label - pred;
            this.w1 += lr * err * x;
            this.w2 += lr * err * y;
            this.bias += lr * err;
            return true; // was updated
        }
        return false;
    }

    countErrors(points: { x_norm: number; y_norm: number; label: number }[]): number {
        let errors = 0;
        for (const p of points) {
            if (this.predict(p.x_norm, p.y_norm) !== p.label) {
                errors++;
            }
        }
        return errors;
    }
}
