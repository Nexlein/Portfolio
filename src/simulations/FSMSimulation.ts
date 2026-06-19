import { SimBase } from '../core/SimBase.js';
import { CanvasHelper } from '../utils/CanvasHelper.js';
import { Vector } from '../utils/Vector.js';
import { FSMEngine } from '../engines/FSMEngine.js';

export class FSMSimulation extends SimBase {
    ui: Record<string, HTMLElement | null>;

    engine: FSMEngine;

    constructor() {
        super('fsm-canvas');

        this.ui = this.bindUIElements({
            btnReset: 'fsm-btn-reset',
            btnSpawn: 'fsm-btn-spawn',
            lblState: 'fsm-var-state',
            lblSpotted: 'fsm-var-spotted',
            lblBattery: 'fsm-var-battery',
            PATROL: 'fsm-node-patrol',
            CHASE: 'fsm-node-chase',
            SEARCH: 'fsm-node-search',
            REST: 'fsm-node-rest'
        });

        const waypoints = [new Vector(150, 80), new Vector(500, 80), new Vector(500, 320), new Vector(200, 320)];
        const charger = new Vector(50, 200);

        this.engine = new FSMEngine(waypoints, charger);

        this.isPlaying = false;
        this.init();
    }

    init() {
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.bindPlayButton(document.getElementById('fsm-btn-play'), 'secondary', 'primary');
        this.ui.btnReset?.addEventListener('click', () => this.reset());
        this.ui.btnSpawn?.addEventListener('click', () => this.spawnIntruderRandomly());

        this.reset();
    }

    reset() {
        super.reset();
        this.engine.reset();

        if (this.ui.btnSpawn) this.ui.btnSpawn.textContent = 'Spawn Intruder (Mouse Click)';
        this.updateUI(false);
        this.start();
    }

    handleCanvasClick(e: MouseEvent) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.engine.spawnIntruder(x, y);
        if (this.ui.btnSpawn) this.ui.btnSpawn.textContent = 'Move Intruder';
    }

    spawnIntruderRandomly() {
        const x = this.width * 0.4 + Math.random() * (this.width * 0.5);
        const y = this.height * 0.2 + Math.random() * (this.height * 0.6);
        this.engine.spawnIntruder(x, y);
        if (this.ui.btnSpawn) this.ui.btnSpawn.textContent = 'Move Intruder';
    }

    update() {
        const targetSpotted = this.engine.update();

        if (!this.engine.intruder.active && this.ui.btnSpawn) {
            this.ui.btnSpawn.textContent = 'Spawn Intruder (Mouse Click)';
        }

        this.updateUI(targetSpotted);
    }

    updateUI(spotted = false) {
        const guard = this.engine.guard;
        const stateColorMap: Record<string, string> = {
            PATROL: '#06b6d4',
            CHASE: '#ef4444',
            SEARCH: '#eab308',
            REST: '#10b981'
        };

        if (this.ui.lblState) {
            this.ui.lblState.textContent = guard.state;
            this.ui.lblState.className = 'var-val badge';
            this.ui.lblState.style.color = stateColorMap[guard.state] || '#94a3b8';
        }

        if (this.ui.lblSpotted) {
            this.ui.lblSpotted.textContent = spotted ? 'YES 🔴' : 'NO ⚪';
            this.ui.lblSpotted.style.color = spotted ? '#ef4444' : '#94a3b8';
        }

        if (this.ui.lblBattery) {
            this.ui.lblBattery.textContent = Math.round(guard.battery) + '%';
            this.ui.lblBattery.style.color =
                guard.battery < 20 ? '#ef4444' : guard.battery < 50 ? '#eab308' : '#10b981';
        }

        ['PATROL', 'CHASE', 'SEARCH', 'REST'].forEach((state) => {
            const node = this.ui[state];
            if (node) {
                node.className = 'fsm-node' + (state === guard.state ? ` active-${state.toLowerCase()}` : '');
            }
        });
    }

    draw() {
        this.drawGrid();

        const guard = this.engine.guard;
        const intruder = this.engine.intruder;
        const charger = this.engine.charger;
        const waypoints = this.engine.waypoints;

        // 1. Charger Station
        this.ctx.strokeStyle = '#10b981';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(charger.x - 20, charger.y - 20, 40, 40);
        this.ctx.fillStyle = 'rgba(16, 185, 129, 0.05)';
        this.ctx.fillRect(charger.x - 20, charger.y - 20, 40, 40);
        CanvasHelper.drawText(this.ctx, '⚡', charger.x, charger.y, '16px Outfit');

        // 2. Patrol Path Dotted lines & Waypoint pins
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(waypoints[0].x, waypoints[0].y);
        for (let i = 1; i < waypoints.length; i++) {
            this.ctx.lineTo(waypoints[i].x, waypoints[i].y);
        }
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.setLineDash([]); // reset

        waypoints.forEach((wp, idx) => {
            CanvasHelper.drawGlowCircle(this.ctx, wp.x, wp.y, 4, '#06b6d4');
            CanvasHelper.drawText(
                this.ctx,
                `WP${idx + 1}`,
                wp.x,
                wp.y - 10,
                '9px JetBrains Mono',
                'rgba(255, 255, 255, 0.3)'
            );
        });

        // 3. Vision Cone
        const movingToCharger = guard.state === 'REST' && guard.pos.dist(charger) < 15;
        if (!movingToCharger) {
            let coneColor = 'rgba(6, 182, 212, 0.05)';
            if (guard.state === 'CHASE') coneColor = 'rgba(239, 68, 68, 0.08)';
            else if (guard.state === 'SEARCH') coneColor = 'rgba(234, 179, 8, 0.06)';

            CanvasHelper.drawCone(this.ctx, guard.pos.x, guard.pos.y, 220, guard.angle, Math.PI / 2, coneColor);
        }

        // 4. Intruder
        if (intruder.active) {
            const pulse = 10 + Math.sin(Date.now() * 0.01) * 4;
            CanvasHelper.drawGlowCircle(this.ctx, intruder.pos.x, intruder.pos.y, pulse, 'rgba(239, 68, 68, 0.15)');
            CanvasHelper.drawGlowCircle(this.ctx, intruder.pos.x, intruder.pos.y, 6, '#ef4444', '#ef4444', 8);
        }

        // 5. Guard
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(guard.pos.x, guard.pos.y);
        this.ctx.lineTo(guard.pos.x + Math.cos(guard.angle) * 16, guard.pos.y + Math.sin(guard.angle) * 16);
        this.ctx.stroke();

        let guardColor = '#06b6d4';
        if (guard.state === 'CHASE') guardColor = '#ef4444';
        if (guard.state === 'SEARCH') guardColor = '#eab308';
        if (guard.state === 'REST') guardColor = '#10b981';

        CanvasHelper.drawGlowCircle(this.ctx, guard.pos.x, guard.pos.y, 12, guardColor, guardColor, 10);

        this.ctx.beginPath();
        this.ctx.arc(guard.pos.x, guard.pos.y, 12, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();

        CanvasHelper.drawText(this.ctx, '👮', guard.pos.x, guard.pos.y, '12px Outfit');
    }
}
