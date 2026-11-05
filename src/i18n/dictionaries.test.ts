import { describe, expect, it } from 'vitest';
import { SIMS } from '@/components/Hero/sims';
import { PERIODS } from '@/data/projects';
import { en } from './en';
import { fr } from './fr';

const dictionaries = { en, fr };

function flatten(obj: object, prefix = '', out: Record<string, unknown> = {}): Record<string, unknown> {
    for (const [key, value] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === 'object') flatten(value, path, out);
        else out[path] = value;
    }
    return out;
}

const flat = { en: flatten(en), fr: flatten(fr) };

// Every static data-i18n key used in the HTML pages and in TS templates.
const sources = {
    ...import.meta.glob<string>('../../*.html', { query: '?raw', import: 'default', eager: true }),
    ...import.meta.glob<string>(['../**/*.ts', '!../**/*.test.ts'], { query: '?raw', import: 'default', eager: true })
};
const usedKeys = new Set(
    Object.values(sources).flatMap((src) => [...src.matchAll(/data-i18n="([^"$]+)"/g)].map((m) => m[1]))
);

const slots = (text: unknown) => [...String(text).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).toSorted();

describe('translation dictionaries', () => {
    it('en and fr define the same keys', () => {
        expect(new Set(Object.keys(flat.fr))).toEqual(new Set(Object.keys(flat.en)));
    });

    it.each(Object.keys(dictionaries))('%s has only non-empty string values', (lang) => {
        for (const [key, value] of Object.entries(flat[lang as keyof typeof flat])) {
            expect(typeof value, key).toBe('string');
            expect((value as string).trim(), key).not.toBe('');
        }
    });

    it('en and fr fill the same {slots}', () => {
        for (const [key, text] of Object.entries(flat.en)) expect(slots(flat.fr[key]), key).toEqual(slots(text));
    });

    it('has every key the browser asks for', () => {
        const literal = Object.values(sources).flatMap((src) =>
            [...src.matchAll(/i18n\.t\(\s*'([^']+)'/g)].map((m) => m[1])
        );
        expect(literal.length).toBeGreaterThan(5);
        const built = [
            ...PERIODS.map((p) => `home.work.periods.${p}`),
            ...SIMS.flatMap(({ id }) => [`home.hero.sims.${id}.name`, `home.hero.sims.${id}.hint`]),
            ...['title2', 'title2b', 'title2c'].map((k) => `home.hero.${k}`)
        ];
        for (const key of [...literal, ...built]) {
            expect(flat.en, key).toHaveProperty([key]);
            expect(flat.fr, key).toHaveProperty([key]);
        }
    });

    it('finds data-i18n keys to check', () => {
        expect(usedKeys.size).toBeGreaterThan(30);
    });

    it.each([...usedKeys])('data-i18n key "%s" exists in both languages', (key) => {
        expect(flat.en).toHaveProperty([key]);
        expect(flat.fr).toHaveProperty([key]);
    });
});
