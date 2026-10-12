import { descent } from './descent';
import { flocking } from './flocking';
import { neural } from './neural';
import { stage, type Stage } from './stage';
import { valueIteration } from './value-iteration';

/** The hero simulations. `id` names their text in the dictionaries (home.hero.sims.<id>.name / .hint). */
export const SIMS: { id: string; run: (s: Stage) => void }[] = [
    { id: 'valueIteration', run: valueIteration },
    { id: 'flocking', run: flocking },
    { id: 'descent', run: descent },
    { id: 'neural', run: neural }
];

/** Start a simulation on `canvas`; the returned function stops listening (call it before swapping the canvas). */
export function runSim(index: number, canvas: HTMLCanvasElement): () => void {
    const s = stage(canvas);
    SIMS[index].run(s);
    return s.dispose;
}
