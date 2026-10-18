// Card-sized copies of every project still that is an image: public/projects/<id>/<name>.webp -> <name>.320.webp and
// <name>.640.webp. Cards (the home page's "Start here", the map, a project page's connected projects) load the
// smallest copy that is sharp at their size (srcset); the full image stays for the project page.
// Video stills are their posters, already small (npm run media:posters).
// Usage: npm run media:thumbs [-- --force]   (requires ffmpeg; Node runs this TypeScript file as it is)
import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { PROJECTS } from '../src/data/projects.ts';
import { stillImage, THUMB_WIDTHS, thumbOf } from '../src/ui/video.ts';

const force = process.argv.includes('--force');

for (const project of PROJECTS) {
    const image = stillImage(project);
    if (!image) continue;
    for (const width of THUMB_WIDTHS) {
        const out = `public${thumbOf(image, width)}`;
        if (existsSync(out) && !force) continue;
        const scale = `scale='min(${width},iw)':-2`;
        execFileSync('ffmpeg', [
            '-v',
            'error',
            '-y',
            '-i',
            `public${image}`,
            '-vf',
            scale,
            '-c:v',
            'libwebp',
            '-quality',
            '72',
            out
        ]);
        console.log(`thumb: ${out} (${Math.round(statSync(out).size / 1024)} kB)`);
    }
}
