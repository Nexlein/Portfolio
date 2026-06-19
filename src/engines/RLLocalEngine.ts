export class RLLocalEngine {
    qTable: number[][][] = [];
    actions: { dr: number; dc: number }[];
    grid: number[][];
    rows: number;
    cols: number;

    constructor(rows: number, cols: number, grid: number[][]) {
        this.rows = rows;
        this.cols = cols;
        this.grid = grid;
        this.actions = [
            { dr: -1, dc: 0 },
            { dr: 0, dc: 1 },
            { dr: 1, dc: 0 },
            { dr: 0, dc: -1 }
        ];
        this.initQTable();
    }

    initQTable() {
        this.qTable = [];
        for (let r = 0; r < this.rows; r++) {
            this.qTable[r] = [];
            for (let c = 0; c < this.cols; c++) {
                this.qTable[r][c] = [0, 0, 0, 0];
            }
        }
    }

    getMaxQ(r: number, c: number) {
        let maxVal = -Infinity;
        let maxIdx = 0;
        for (let a = 0; a < 4; a++) {
            if (this.qTable[r][c][a] > maxVal) {
                maxVal = this.qTable[r][c][a];
                maxIdx = a;
            }
        }
        return { value: maxVal, action: maxIdx };
    }

    chooseAction(r: number, c: number, epsilon: number) {
        if (Math.random() < epsilon) {
            return Math.floor(Math.random() * 4);
        } else {
            return this.getMaxQ(r, c).action;
        }
    }

    updateQ(
        r: number,
        c: number,
        action: number,
        reward: number,
        nextR: number,
        nextC: number,
        alpha: number,
        gamma: number
    ) {
        const maxFutureQ = this.getMaxQ(nextR, nextC).value;
        const currentQ = this.qTable[r][c][action];
        this.qTable[r][c][action] = currentQ + alpha * (reward + gamma * maxFutureQ - currentQ);
    }
}
