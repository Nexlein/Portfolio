/**
 * src/data/simulations.ts
 *
 * Single source of truth for every AI simulation.
 * To add a new simulation:
 *   1. Add a SimConfig entry here.
 *   2. Create the simulation class in src/simulations/.
 *   3. Create the view partial in src/views/<id>.html.
 *
 * The pill switcher, sim-view containers, and accent colours
 * are all generated automatically from this array at boot time.
 */

export interface SimConfig {
    /** Short identifier — used as DOM id suffix, CSS hook, and fetch path. */
    id: string;
    /** Full display label shown in the pill switcher. */
    label: string;
    /** Accent colour hex for the dot and CSS scoping. */
    color: string;
    /** Rgba glow for the CSS --accent-glow variable. */
    glow: string;
    /**
     * Whether the simulation runs a continuous rAF loop (true)
     * or only needs a single draw call (false).
     * Controls whether UIController calls sim.start() vs sim.draw().
     */
    autoStart: boolean;
    /** The ID of the project that uses this simulation. */
    relatedProject?: string;
}

export const SIMULATIONS: SimConfig[] = [
    {
        id: 'ml',
        label: 'ML (Supervised)',
        color: '#22d3ee',
        glow: 'rgba(34,211,238,0.12)',
        autoStart: false,
        relatedProject: 'cvrie',
    },
    {
        id: 'ml-unsupervised',
        label: 'ML (Unsupervised)',
        color: '#3b82f6',
        glow: 'rgba(59,130,246,0.12)',
        autoStart: false,
        relatedProject: 'cvrie',
    },
    {
        id: 'rl',
        label: 'Reinforcement Learning',
        color: '#a78bfa',
        glow: 'rgba(167,139,250,0.12)',
        autoStart: false,
        relatedProject: 'starttrek',
    },
    {
        id: 'fsm',
        label: 'Finite State Machine',
        color: '#34d399',
        glow: 'rgba(52,211,153,0.12)',
        autoStart: true,
        relatedProject: 'zappy',
    },
    {
        id: 'ga',
        label: 'Genetic Algorithm',
        color: '#fb923c',
        glow: 'rgba(251,146,60,0.12)',
        autoStart: true,
    },
    {
        id: 'uai',
        label: 'Utility AI',
        color: '#f472b6',
        glow: 'rgba(244,114,182,0.12)',
        autoStart: true,
        relatedProject: 'zappy',
    },
];
