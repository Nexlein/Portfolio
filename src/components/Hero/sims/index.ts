import { descent } from './descent';
import { flocking } from './flocking';
import { stage, type Stage } from './stage';
import { valueIteration } from './value-iteration';

/** The hero simulations. `id` names their text in the dictionaries (home.hero.sims.<id>.name / .hint). */
export const SIMS: { id: string; run: (s: Stage) => void }[] = [
    { id: 'valueIteration', run: valueIteration },
    { id: 'flocking', run: flocking },
    { id: 'descent', run: descent }
];

export function runSim(index: number, canvas: HTMLCanvasElement): void {
    SIMS[index].run(stage(canvas));
}
