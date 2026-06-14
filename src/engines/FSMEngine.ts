/**
 * src/engines/FSMEngine.ts
 *
 * Encapsulates the pure logic of the Finite State Machine (FSM).
 * Handles guard movement, state transitions, battery decay, and vision.
 * Separated from the DOM / Canvas rendering.
 */

import { Vector } from '../utils/Vector.js';

export type FSMState = 'PATROL' | 'CHASE' | 'SEARCH' | 'REST';

export interface Guard {
    pos: Vector;
    angle: number;
    speed: number;
    battery: number;
    state: FSMState;
    currentWaypointIdx: number;
    searchTimer: number;
    lastKnownTarget: Vector;
    hasTarget: boolean;
    searchTarget?: Vector;
}

export interface Intruder {
    pos: Vector;
    active: boolean;
    speed: number;
    noiseTimer: number;
}

export class FSMEngine {
    guard: Guard;
    intruder: Intruder;
    waypoints: Vector[];
    charger: Vector;

    constructor(waypoints: Vector[], charger: Vector) {
        this.waypoints = waypoints;
        this.charger = charger;
        
        // Initialised via reset()
        this.guard = this.createDefaultGuard();
        this.intruder = this.createDefaultIntruder();
    }

    private createDefaultGuard(): Guard {
        return {
            pos: this.waypoints[0].copy(),
            angle: 0,
            speed: 1.8,
            battery: 100,
            state: 'PATROL',
            currentWaypointIdx: 0,
            searchTimer: 0,
            lastKnownTarget: new Vector(0, 0),
            hasTarget: false
        };
    }

    private createDefaultIntruder(): Intruder {
        return {
            pos: new Vector(0, 0),
            active: false,
            speed: 2.2,
            noiseTimer: 0
        };
    }

    reset() {
        this.guard = this.createDefaultGuard();
        this.intruder = this.createDefaultIntruder();
    }

    spawnIntruder(x: number, y: number) {
        this.intruder.pos.set(x, y);
        this.intruder.active = true;
    }

    /**
     * Ticks the simulation forward one step.
     * @returns boolean true if the intruder was spotted in this tick.
     */
    update(): boolean {
        // 1. Intruder noise/wiggle logic
        if (this.intruder.active) {
            this.intruder.noiseTimer += 0.05;
            this.intruder.pos.x += Math.sin(this.intruder.noiseTimer) * 0.5;
            this.intruder.pos.y += Math.cos(this.intruder.noiseTimer) * 0.5;
        }

        // 2. Vision Check (90 degree FOV, 220 range)
        let targetSpotted = false;
        if (this.intruder.active) {
            const dist = this.guard.pos.dist(this.intruder.pos);
            if (dist < 220) {
                const angleToTarget = Math.atan2(this.intruder.pos.y - this.guard.pos.y, this.intruder.pos.x - this.guard.pos.x);
                let diffAngle = angleToTarget - this.guard.angle;

                while (diffAngle < -Math.PI) diffAngle += Math.PI * 2;
                while (diffAngle > Math.PI) diffAngle -= Math.PI * 2;

                if (Math.abs(diffAngle) < Math.PI / 4) {
                    targetSpotted = true;
                    this.guard.lastKnownTarget = this.intruder.pos.copy();
                    this.guard.hasTarget = true;
                }
            }
        }

        // 3. FSM Logic
        switch (this.guard.state) {
            case 'PATROL':
                this.guard.speed = 1.6;
                this.guard.battery -= 0.04;

                const wp = this.waypoints[this.guard.currentWaypointIdx];
                this.moveGuardTowards(wp);

                if (this.guard.pos.dist(wp) < 10) {
                    this.guard.currentWaypointIdx = (this.guard.currentWaypointIdx + 1) % this.waypoints.length;
                }

                if (targetSpotted) {
                    this.guard.state = 'CHASE';
                } else if (this.guard.battery < 20) {
                    this.guard.state = 'REST';
                }
                break;

            case 'CHASE':
                this.guard.speed = 2.6;
                this.guard.battery -= 0.12;

                if (this.guard.hasTarget) {
                    this.moveGuardTowards(this.guard.lastKnownTarget);

                    if (this.guard.pos.dist(this.intruder.pos) < 16) {
                        this.intruder.active = false;
                        this.guard.hasTarget = false;
                        this.guard.state = 'SEARCH';
                        this.guard.searchTimer = 180;
                    }
                }

                if (this.guard.battery < 10) {
                    this.guard.state = 'REST';
                } else if (!targetSpotted) {
                    this.guard.state = 'SEARCH';
                    this.guard.searchTimer = 180;
                }
                break;

            case 'SEARCH':
                this.guard.speed = 1.0;
                this.guard.battery -= 0.05;
                this.guard.searchTimer--;

                if (this.guard.searchTimer % 45 === 0) {
                    const base = this.guard.hasTarget ? this.guard.lastKnownTarget : this.guard.pos;
                    this.guard.searchTarget = new Vector(
                        base.x + (Math.random() * 80 - 40),
                        base.y + (Math.random() * 80 - 40)
                    );
                }

                if (this.guard.searchTarget) {
                    this.moveGuardTowards(this.guard.searchTarget);
                }

                if (targetSpotted) {
                    this.guard.state = 'CHASE';
                } else if (this.guard.battery < 15) {
                    this.guard.state = 'REST';
                } else if (this.guard.searchTimer <= 0) {
                    this.guard.state = 'PATROL';
                }
                break;

            case 'REST':
                this.guard.speed = 2.0;
                const distToCharger = this.guard.pos.dist(this.charger);

                if (distToCharger < 10) {
                    this.guard.speed = 0;
                    this.guard.battery += 0.4;
                    if (this.guard.battery >= 100) {
                        this.guard.battery = 100;
                        this.guard.state = 'PATROL';
                    }
                } else {
                    this.moveGuardTowards(this.charger);
                }

                if (targetSpotted && this.guard.battery > 40) {
                    this.guard.state = 'CHASE';
                }
                break;
        }

        this.guard.battery = Math.max(0, this.guard.battery);
        
        return targetSpotted;
    }

    private moveGuardTowards(target: Vector) {
        const diff = Vector.sub(target, this.guard.pos);
        const dist = diff.mag();

        if (dist > 2) {
            const desiredAngle = Math.atan2(diff.y, diff.x);
            let angleDiff = desiredAngle - this.guard.angle;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

            this.guard.angle += angleDiff * 0.15;

            this.guard.pos.x += Math.cos(this.guard.angle) * this.guard.speed;
            this.guard.pos.y += Math.sin(this.guard.angle) * this.guard.speed;
        }
    }
}
