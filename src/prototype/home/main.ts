// PROTOTYPE — throwaway. Picks a redesign variant from ?variant= and mounts it with the switcher.
import './shared.css';
import { mountSwitcher, type Variant } from './switcher';
import { variantA } from './variant-a';
import { variantB } from './variant-b';
import { variantC } from './variant-c';
import { variantD, variantE } from './round2';

const VARIANTS: Variant[] = [
    { key: 'A', name: 'Policy field', mount: variantA },
    { key: 'B', name: 'Learning curve', mount: variantB },
    { key: 'C', name: 'Decision tree', mount: variantC },
    { key: 'D', name: 'Round 2 · projects grid', mount: variantD },
    { key: 'E', name: 'Round 2 · featured + list', mount: variantE }
];

const key = new URLSearchParams(location.search).get('variant')?.toUpperCase() ?? 'D';
const current = VARIANTS.find((v) => v.key === key) ?? VARIANTS[0];
const app = document.getElementById('app')!;

mountSwitcher(VARIANTS, current); // applies the theme first, so variants read the right colors
current.mount(app);
