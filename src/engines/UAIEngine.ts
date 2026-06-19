// ──────────────────────────────────────────────────────────────────────────────
// UAIEngine — Pure math for Utility AI
// Agent evaluates all actions each tick and picks the highest-scoring one.
// ──────────────────────────────────────────────────────────────────────────────

export type NeedKey = 'hunger' | 'thirst' | 'rest' | 'social';

export interface Need {
    key: NeedKey;
    label: string;
    value: number; // 0–1, 0 = fully satisfied, 1 = desperate
    decayRate: number; // how fast it grows per tick (0–1 range/s at 60fps)
    color: string;
}

export interface InterestPoint {
    id: NeedKey;
    label: string;
    x: number;
    y: number;
    radius: number;
    color: string;
    icon: string;
}

export interface Action {
    id: NeedKey;
    label: string;
    score: number;
    isWinning: boolean;
}

export class UAIEngine {
    needs: Need[];
    points: InterestPoint[];
    weights: Record<NeedKey, number>;

    constructor(canvasW: number, canvasH: number) {
        this.needs = [
            { key: 'hunger', label: 'Hunger', value: 0.2, decayRate: 0.00035, color: '#fb923c' },
            { key: 'thirst', label: 'Thirst', value: 0.1, decayRate: 0.00055, color: '#22d3ee' },
            { key: 'rest', label: 'Fatigue', value: 0.4, decayRate: 0.0002, color: '#a78bfa' },
            { key: 'social', label: 'Social', value: 0.6, decayRate: 0.00015, color: '#34d399' }
        ];

        this.points = [
            {
                id: 'hunger',
                label: 'Food',
                x: canvasW * 0.78,
                y: canvasH * 0.18,
                radius: 24,
                color: '#fb923c',
                icon: '🍎'
            },
            {
                id: 'thirst',
                label: 'Water',
                x: canvasW * 0.2,
                y: canvasH * 0.22,
                radius: 24,
                color: '#22d3ee',
                icon: '💧'
            },
            {
                id: 'rest',
                label: 'Sleep',
                x: canvasW * 0.78,
                y: canvasH * 0.78,
                radius: 24,
                color: '#a78bfa',
                icon: '🛏'
            },
            {
                id: 'social',
                label: 'Social',
                x: canvasW * 0.2,
                y: canvasH * 0.78,
                radius: 24,
                color: '#34d399',
                icon: '👥'
            }
        ];

        this.weights = { hunger: 1.0, thirst: 1.0, rest: 1.0, social: 1.0 };
    }

    /** Logistic curve — maps need 0→1 to score 0→1, sharply rising near 1 */
    private curve(value: number): number {
        // Exponential scoring: low need = near-zero score, high need = high score
        return Math.pow(value, 2.2);
    }

    /** Evaluate utility scores for all actions this tick */
    evaluateActions(): Action[] {
        const actions: Action[] = this.needs.map((need) => ({
            id: need.key,
            label: need.label,
            score: this.curve(need.value) * this.weights[need.key],
            isWinning: false
        }));

        // Mark the winner
        let bestIdx = 0;
        for (let i = 1; i < actions.length; i++) {
            if (actions[i].score > actions[bestIdx].score) bestIdx = i;
        }
        actions[bestIdx].isWinning = true;

        return actions;
    }

    /** Tick: decay all needs, return actions */
    tick(speedMultiplier: number = 1): Action[] {
        for (const need of this.needs) {
            need.value = Math.min(1, need.value + need.decayRate * speedMultiplier);
        }
        return this.evaluateActions();
    }

    /** Satisfy a need when the agent reaches its point */
    satisfy(needKey: NeedKey, rate: number) {
        const need = this.needs.find((n) => n.key === needKey);
        if (need) need.value = Math.max(0, need.value - rate);
    }

    getNeed(key: NeedKey): Need {
        return this.needs.find((n) => n.key === key)!;
    }

    reset() {
        this.needs[0].value = 0.2;
        this.needs[1].value = 0.1;
        this.needs[2].value = 0.4;
        this.needs[3].value = 0.6;
    }
}
