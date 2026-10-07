import { describe, expect, it } from 'vitest';
import type { ProjectEntry } from '@/data/projects';
import { filterProjects } from './filter';

function project(id: string, category: ProjectEntry['category'], year?: ProjectEntry['year']): ProjectEntry {
    return { id, title: id, tags: [], category, year, github: '', media: { type: 'video', src: '' } };
}

const projects = [
    project('a', 'ai', 'Tek1'),
    project('b', 'systems', 'Tek1'),
    project('c', 'ai'), // no year: counts as Tek2
    project('d', 'graphical', 'Tek2'),
    project('e', 'devops', 'Personal')
];
const ids = (list: ProjectEntry[]) => list.map((p) => p.id);
const all = { year: 'all', category: 'all', limit: 10 };

describe('filterProjects', () => {
    it('returns everything with no filter', () => {
        const result = filterProjects(projects, all);
        expect(ids(result.visible)).toEqual(['a', 'b', 'c', 'd', 'e']);
        expect(result.hasMore).toBe(false);
        expect(result.categories).toEqual(new Set(['ai', 'systems', 'graphical', 'devops']));
    });

    it('treats projects without a year as Tek2', () => {
        expect(ids(filterProjects(projects, { ...all, year: 'Tek2' }).visible)).toEqual(['c', 'd']);
    });

    it('combines year and category', () => {
        expect(ids(filterProjects(projects, { ...all, year: 'Tek1', category: 'ai' }).visible)).toEqual(['a']);
    });

    it('only offers categories present in the selected year', () => {
        expect(filterProjects(projects, { ...all, year: 'Tek1' }).categories).toEqual(new Set(['ai', 'systems']));
    });

    it('falls back to all categories when the selected one is empty for that year', () => {
        const result = filterProjects(projects, { ...all, year: 'Personal', category: 'ai' });
        expect(result.category).toBe('all');
        expect(ids(result.visible)).toEqual(['e']);
    });

    it('applies the limit and reports more results', () => {
        const result = filterProjects(projects, { ...all, limit: 2 });
        expect(ids(result.visible)).toEqual(['a', 'b']);
        expect(result.hasMore).toBe(true);
        expect(filterProjects(projects, { ...all, limit: 5 }).hasMore).toBe(false);
    });
});
