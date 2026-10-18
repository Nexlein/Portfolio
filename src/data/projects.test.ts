import { describe, expect, it } from 'vitest';
import { PROJECTS, type ProjectEntry } from './projects';
import { still, stillImage, THUMB_WIDTHS, thumbOf, videoPoster } from '@/ui/video';
import { LANGS, lookup } from '@/core/translate';
import { domainQuery } from '@/pages/home/blocks';

// Keys look like '../../public/projects/arcade/arcade.mp4'; map them to their public URL.
const publicFiles = new Set(
    Object.keys(import.meta.glob('../../public/**/*')).map((path) => path.replace('../../public', ''))
);

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

    it('features exactly three projects (the "Selected work" row)', () => {
        expect(PROJECTS.filter((p) => p.featured)).toHaveLength(3);
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

        it('has the card-sized copies its cards show (npm run media:thumbs)', () => {
            const image = stillImage(project);
            const copies = image ? THUMB_WIDTHS.map((w) => thumbOf(image, w)) : [still(project)];
            for (const src of copies) expect(publicFiles).toContain(src);
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

        it('has a start month that is a real, past month', () => {
            expect(project.date).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
            expect(new Date(`${project.date}-01`).getTime()).toBeLessThanOrEqual(Date.now());
        });

        it('links to GitHub or hides the link', () => {
            if (project.github) expect(project.github).toMatch(/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/);
        });

        it('has a domain name in every language and a button to light it up on the map', () => {
            for (const lang of LANGS) expect(lookup(lang, `home.domains.${project.category}`)).not.toMatch(/^home\./);
            expect(domainQuery('en')).toContain(`data-domain="${project.category}"`);
        });
    });
});
