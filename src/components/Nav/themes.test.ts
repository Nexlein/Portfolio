import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { en } from '../../i18n/en';
import { fr } from '../../i18n/fr';
import { THEMES } from './themes';

const tokens = readFileSync(new URL('../../styles/tokens.css', import.meta.url), 'utf8');
const declared = [...tokens.matchAll(/\[data-theme='([a-z-]+)'\]/g)].map((m) => m[1]);

describe('themes', () => {
    it('every theme has a token block and a name in both languages', () => {
        for (const id of THEMES) {
            expect(declared, `tokens.css has no [data-theme='${id}'] block`).toContain(id);
            expect(en.site.themes, `en name for ${id}`).toHaveProperty(id);
            expect(fr.site.themes, `fr name for ${id}`).toHaveProperty(id);
        }
    });

    it('every token block belongs to a listed theme', () => {
        for (const id of new Set(declared)) expect(THEMES as readonly string[]).toContain(id);
    });

    it('every theme defines the same inputs, and nothing else', () => {
        const inputs = ['--bg', '--surface', '--ink', '--signal', '--cold', '--third', '--depth', 'color-scheme'];
        for (const id of THEMES) {
            const block = tokens.match(new RegExp(`\\[data-theme='${id}'\\]\\s*\\{([^}]*)\\}`))?.[1] ?? '';
            const defined = [...block.matchAll(/(--[a-z0-9-]+|color-scheme)\s*:/g)].map((m) => m[1]);
            expect(new Set(defined), `inputs of ${id}`).toEqual(new Set(inputs));
        }
    });
});
