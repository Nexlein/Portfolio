// PROTOTYPE — throwaway. Picks a redesign variant from ?variant= and mounts it with the switcher.
import './shared.css';
import { mountSwitcher, type Variant } from './switcher';
import { variantA } from './variant-a';
import { variantB } from './variant-b';
import { variantC } from './variant-c';
import { variantD, variantE } from './round2';
import { variantF } from './round3';
import { variantG } from './board';
import { variantH } from './space';
import { variantI } from './web';
import { variantJ } from './silk';
import { variantK, variantL } from './orbit';
import { variantM } from './brain';
import { variantN, variantO, variantP, variantQ } from './premium';

const VARIANTS: Variant[] = [
    { key: 'A', name: 'Policy field', mount: variantA },
    { key: 'B', name: 'Learning curve', mount: variantB },
    { key: 'C', name: 'Decision tree', mount: variantC },
    { key: 'D', name: 'Round 2 · projects grid', mount: variantD },
    { key: 'E', name: 'Round 2 · featured + list', mount: variantE },
    { key: 'F', name: 'Round 3 · network', mount: variantF },
    { key: 'G', name: 'Round 4 · skill board', mount: variantG },
    { key: 'H', name: 'Round 5 · latent space', mount: variantH },
    { key: 'I', name: 'Round 6 · spider web', mount: variantI },
    { key: 'J', name: 'Round 7 · silk', mount: variantJ },
    { key: 'K', name: 'Round 8 · orbits', mount: variantK },
    { key: 'L', name: 'Round 9 · living web', mount: variantL },
    { key: 'M', name: 'Round 10 · neural map', mount: variantM },
    { key: 'N', name: 'Round 11 · premium', mount: variantN },
    { key: 'O', name: 'Round 12 · charts & motion', mount: variantO },
    { key: 'P', name: 'Round 13 · living page', mount: variantP },
    { key: 'Q', name: 'Round 14 · calmer', mount: variantQ }
];

const key = new URLSearchParams(location.search).get('variant')?.toUpperCase() ?? 'Q';
const current = VARIANTS.find((v) => v.key === key) ?? VARIANTS[0];
const app = document.getElementById('app')!;

mountSwitcher(VARIANTS, current); // applies the theme first, so variants read the right colors
current.mount(app);
