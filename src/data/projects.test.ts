import { describe, expect, it } from 'vitest';
import { PROJECTS, type ProjectEntry } from './projects';
import { videoPoster } from '@/ui/video';
import { LANGS } from '@/core/translate';

// Keys look like '../../public/projects/arcade/arcade.mp4'; map them to their public URL.
const publicFiles = new Set(
    Object.keys(import.meta.glob('../../public/**/*')).map((path) => path.replace('../../public', ''))
);

const indexHtml = import.meta.glob<string>('../../index.html', { query: '?raw', import: 'default', eager: true })[
    '../../index.html'
];

function mediaPaths(project: ProjectEntry): string[] {
    const { media } = project;
    return media.type === 'gallery' ? media.images.map((img) => img.src) : [media.src];
}

function posterPaths(project: ProjectEntry): string[] {
    return project.media.type === 'video' ? [videoPoster(project.media.src)] : [];
}

describe('PROJECTS data', () => {
    it('has unique ids', () => {
        const ids = PROJECTS.map((p) => p.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('finds public files to check against', () => {
        expect(publicFiles.size).toBeGreaterThan(0);
    });

    describe.each(PROJECTS.map((p) => [p.id, p] as const))('%s', (_id, project) => {
        it.each(mediaPaths(project))('media %s exists in public/', (src) => {
            expect(publicFiles).toContain(src);
        });

        it('uses web formats (WebP images, MP4 videos)', () => {
            for (const src of mediaPaths(project)) {
                expect(src).toMatch(project.media.type === 'video' ? /\.mp4$/ : /\.webp$/);
            }
        });

        it.each(posterPaths(project))('poster %s exists (npm run media:posters)', (src) => {
            expect(publicFiles).toContain(src);
        });

        it('has a description in every language', () => {
            for (const lang of LANGS) expect(project.description[lang].trim().length, lang).toBeGreaterThan(40);
        });

        it('has alt text on every image', () => {
            const { media } = project;
            const alts =
                media.type === 'gallery' ? media.images.map((i) => i.alt) : media.type === 'image' ? [media.alt] : [];
            for (const alt of alts) expect(alt.trim()).not.toBe('');
        });

        it('links to GitHub or hides the link', () => {
            if (project.github) expect(project.github).toMatch(/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/);
        });

        it('has a category filter button on the home page', () => {
            expect(indexHtml).toContain(`data-filter="${project.category}"`);
        });
    });
});
