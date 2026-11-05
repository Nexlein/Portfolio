// Everything generated from a project's media, each step needing the one before: a poster per video, card-sized copies
// of a still that is an image (public/projects/<id>/<name>.320.webp and .640.webp, loaded through srcset), then the
// social image (og.jpg, 1200x630, what LinkedIn and X expect): the still the cards show, fitted whole over a blurred,
// darkened copy of itself.
// Only missing files are made. To redo some: npm run media -- --force=posters,og
// --force=thumbs also replaces the hand-made crops (README, Media).
// Usage: npm run media [-- --force=posters,thumbs,og]   (requires ffmpeg; Node runs this TypeScript file as it is)
import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { projectImage, PROJECTS } from '../src/data/projects.ts';
import { stillImage, THUMB_WIDTHS, thumbOf, videoPoster } from '../src/ui/video.ts';

const KINDS = ['posters', 'thumbs', 'og'];
const forced = new Set<string>();
for (const arg of process.argv.slice(2)) {
    const kinds = arg.startsWith('--force=') ? arg.slice(8).split(',') : [''];
    if (!kinds.every((kind) => KINDS.includes(kind))) {
        console.error(`media: unknown argument ${arg}. Usage: npm run media [-- --force=${KINDS.join(',')}]`);
        process.exit(1);
    }
    kinds.forEach((kind) => forced.add(kind));
}

const OG_FILTER =
    '[0]scale=1200:630:force_original_aspect_ratio=increase,crop=1200:630,boxblur=24,eq=brightness=-0.25[bg];' +
    '[0]scale=1200:630:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2';

/** Make `out` with ffmpeg, unless it is there already. */
function make(kind: string, out: string, args: string[]): void {
    if (existsSync(out) && !forced.has(kind)) return;
    execFileSync('ffmpeg', ['-v', 'error', '-y', ...args, out]);
    console.log(`${kind}: ${out} (${Math.round(statSync(out).size / 1024)} kB)`);
}

for (const project of PROJECTS) {
    const { media } = project;
    const image = stillImage(project);
    if (media.type === 'video') {
        // A frame at 1s (first frames are often blank), at most 800px wide (cards are about 400px at 2x DPR)
        const video = ['-ss', '1', '-i', `public${media.src}`, '-frames:v', '1'];
        const webp = ['-vf', "scale='min(800,iw)':-2", '-c:v', 'libwebp', '-quality', '75'];
        make('posters', `public${videoPoster(media.src)}`, [...video, ...webp]);
    }
    if (image)
        for (const width of THUMB_WIDTHS) {
            const webp = ['-vf', `scale='min(${width},iw)':-2`, '-c:v', 'libwebp', '-quality', '72'];
            make('thumbs', `public${thumbOf(image, width)}`, ['-i', `public${image}`, ...webp]);
        }
    const still = media.type === 'video' ? videoPoster(media.src) : image;
    const social = ['-filter_complex', OG_FILTER, '-frames:v', '1', '-q:v', '4'];
    make('og', `public${projectImage(project.id)}`, ['-i', `public${still}`, ...social]);
}
