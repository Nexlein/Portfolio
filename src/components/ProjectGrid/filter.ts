import type { ProjectEntry } from '@/data/projects';

export interface ProjectFilter {
    year: string; // 'all' or a ProjectEntry year
    category: string; // 'all' or a ProjectEntry category
    limit: number;
}

export interface FilterResult {
    visible: ProjectEntry[];
    hasMore: boolean;
    /** Categories that still have projects for the selected year. */
    categories: Set<string>;
    /** The applied category: falls back to 'all' when the selected one has no project that year. */
    category: string;
}

/** Projects without a year are Tek2 projects. */
export function projectYear(project: ProjectEntry): string {
    return project.year ?? 'Tek2';
}

export function filterProjects(projects: ProjectEntry[], { year, category, limit }: ProjectFilter): FilterResult {
    const byYear = projects.filter((p) => year === 'all' || projectYear(p) === year);
    const categories = new Set<string>(byYear.map((p) => p.category));
    const applied = category === 'all' || categories.has(category) ? category : 'all';
    const matched = byYear.filter((p) => applied === 'all' || p.category === applied);

    return {
        visible: matched.slice(0, limit),
        hasMore: matched.length > limit,
        categories,
        category: applied
    };
}
