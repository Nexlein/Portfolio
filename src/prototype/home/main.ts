// PROTOTYPE — throwaway. Picks a redesign variant from ?variant= and mounts it with the switcher.
import './shared.css';
import { mountSwitcher, type Variant } from './switcher';
import { variantA } from './variant-a';
import { variantB } from './variant-b';
import { variantC } from './variant-c';

const VARIANTS: Variant[] = [
    { key: 'A', name: 'Policy field', mount: variantA },
    { key: 'B', name: 'Learning curve', mount: variantB },
    { key: 'C', name: 'Decision tree', mount: variantC }
];

const key = new URLSearchParams(location.search).get('variant')?.toUpperCase() ?? 'A';
const current = VARIANTS.find((v) => v.key === key) ?? VARIANTS[0];
const app = document.getElementById('app')!;

mountSwitcher(VARIANTS, current); // applies the theme first, so variants read the right colors
current.mount(app);
