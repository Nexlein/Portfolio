import { LocaleString } from '../core/i18n.js';

export interface SimConfig {
    /** Short identifier — used as DOM id suffix, CSS hook, and fetch path. */
    id: string;
    /** Full display label shown in the pill switcher. */
    label: LocaleString;
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
        label: { en: 'Machine Learning (ML) - Supervised', fr: 'Machine Learning (ML) - Supervisé' },
        color: '#22d3ee',
        glow: 'rgba(34,211,238,0.12)',
        autoStart: false,
        relatedProject: 'cvrie'
    },
    {
        id: 'ml-unsupervised',
        label: { en: 'Machine Learning (ML) - Unsupervised', fr: 'Machine Learning (ML) - Non Supervisé' },
        color: '#3b82f6',
        glow: 'rgba(59,130,246,0.12)',
        autoStart: false,
        relatedProject: 'cvrie'
    },
    {
        id: 'rl',
        label: { en: 'Reinforcement Learning (RL)', fr: 'Reinforcement Learning (RL)' },
        color: '#a78bfa',
        glow: 'rgba(167,139,250,0.12)',
        autoStart: false,
        relatedProject: 'starttrek'
    },
    {
        id: 'fsm',
        label: { en: 'Finite State Machine (FSM)', fr: 'Finite State Machine (FSM)' },
        color: '#34d399',
        glow: 'rgba(52,211,153,0.12)',
        autoStart: true,
        relatedProject: 'zappy'
    },
    {
        id: 'uai',
        label: { en: 'Utility AI (UAI)', fr: 'Utility AI (UAI)' },
        color: '#f472b6',
        glow: 'rgba(244,114,182,0.12)',
        autoStart: true,
        relatedProject: 'zappy'
    }
];
