import { Vector } from '../utils/Vector.js';

export interface Target extends Vector {
    r: number;
}

export interface Obstacle {
    x: number;
    y: number;
    w: number;
    h: number;
}

export class DNA {
    genes: Vector[];
    lifespan: number;

    constructor(lifespan: number) {
        this.genes = [];
        this.lifespan = lifespan;
        for (let i = 0; i < lifespan; i++) {
            this.genes.push(Vector.random(0.4)); // accel force magnitude 0.4
        }
    }

    crossover(partner: DNA) {
        const child = new DNA(this.lifespan);
        const midpoint = Math.floor(Math.random() * this.lifespan);
        for (let i = 0; i < this.lifespan; i++) {
            if (i > midpoint) {
                child.genes[i] = this.genes[i].copy();
            } else {
                child.genes[i] = partner.genes[i].copy();
            }
        }
        return child;
    }

    mutate(rate: number) {
        for (let i = 0; i < this.lifespan; i++) {
            if (Math.random() < rate) {
                this.genes[i] = Vector.random(0.4);
            }
        }
    }
}

export class GAAgent {
    canvasWidth: number;
    canvasHeight: number;
    pos: Vector;
    vel: Vector;
    dna: DNA;
    target: Target;
    obstacle: Obstacle;
    crashed: boolean;
    completed: boolean;
    fitness: number;
    completedSteps: number;

    constructor(pos: Vector, dna: DNA, canvasWidth: number, canvasHeight: number, target: Target, obstacle: Obstacle) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.pos = pos.copy();
        this.vel = new Vector(0, 0);
        this.dna = dna;
        this.target = target;
        this.obstacle = obstacle;

        this.crashed = false;
        this.completed = false;
        this.fitness = 0;
        this.completedSteps = 0;
    }

    update(step: number) {
        if (this.crashed || this.completed) return;

        if (step < this.dna.genes.length) {
            this.vel.add(this.dna.genes[step]);
        }

        this.vel.limit(4); // speed limit
        this.pos.add(this.vel);

        // Check target reach
        const distToTarget = this.pos.dist(this.target);
        if (distToTarget < this.target.r) {
            this.completed = true;
            this.completedSteps = step;
            this.pos = this.target.copy();
        }

        // Check border crash
        if (this.pos.x < 0 || this.pos.x > this.canvasWidth || this.pos.y < 0 || this.pos.y > this.canvasHeight) {
            this.crashed = true;
        }

        // Check obstacle crash
        if (
            this.pos.x > this.obstacle.x &&
            this.pos.x < this.obstacle.x + this.obstacle.w &&
            this.pos.y > this.obstacle.y &&
            this.pos.y < this.obstacle.y + this.obstacle.h
        ) {
            this.crashed = true;
        }
    }

    calcFitness() {
        const dist = this.pos.dist(this.target);
        this.fitness = 1 / (dist + 1);

        if (this.crashed) {
            this.fitness *= 0.1;
        }

        if (this.completed) {
            this.fitness = 2.0 + (this.dna.genes.length - this.completedSteps) * 2;
        }

        this.fitness = Math.pow(this.fitness, 2);
    }
}
