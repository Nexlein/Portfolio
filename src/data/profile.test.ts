import { describe, expect, it } from 'vitest';
import { CHECKPOINTS, CV_PROJECTS, EDUCATION, EXPERIENCES, NOW, OFFERS, SKILLS, TIMELINE, type Text } from './profile';
import { PROJECTS } from './projects';
import { LANGS } from '@/core/translate';

/** Every Text in the profile, with a path for error messages. */
function texts(value: unknown, path = ''): [string, Text][] {
    if (!value || typeof value !== 'object') return [];
    if (LANGS.every((l) => typeof (value as Record<string, unknown>)[l] === 'string')) return [[path, value as Text]];
    return Object.entries(value).flatMap(([k, v]) => texts(v, path ? `${path}.${k}` : k));
}

const all = texts({ EXPERIENCES, EDUCATION, SKILLS, CV_PROJECTS, OFFERS, CHECKPOINTS, NOW });

describe('profile data', () => {
    it('finds text to check', () => {
        expect(all.length).toBeGreaterThan(50);
    });

    it.each(all)('%s is filled in every language', (_path, text) => {
        for (const lang of LANGS) expect(text[lang].trim()).not.toBe('');
    });

    it.each(all)('%s carries no styling (classes belong to templates)', (_path, text) => {
        for (const lang of LANGS) expect(text[lang]).not.toMatch(/\b(class|style)=/);
    });

    it('lists every experience and education entry on the timeline exactly once', () => {
        const ids = [...EXPERIENCES, ...EDUCATION].map((e) => e.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(TIMELINE).toHaveLength(ids.length);
        expect(new Set(TIMELINE)).toEqual(new Set(ids));
    });

    it('dates every checkpoint, oldest first, and points it at a real entry', () => {
        const ids = new Set([...EXPERIENCES, ...EDUCATION].map((e) => e.id));
        CHECKPOINTS.forEach((c, i) => {
            expect(c.date).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
            expect(ids).toContain(c.id);
            if (i) expect(c.date >= CHECKPOINTS[i - 1].date).toBe(true);
        });
    });

    it('only highlights projects that exist on the CV', () => {
        for (const group of CV_PROJECTS) {
            for (const entry of group.projects) expect(PROJECTS.map((p) => p.id)).toContain(entry.id);
        }
    });
});
