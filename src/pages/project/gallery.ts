/** Gallery on a project page: arrows, dots, arrow keys and a "2 / 4" counter. One image shows at a time. */
export function initGallery(gallery: HTMLElement): void {
    const images = [...gallery.querySelectorAll<HTMLImageElement>('img')];
    const dots = [...gallery.querySelectorAll<HTMLButtonElement>('.gallery-dots button')];
    const count = gallery.querySelector<HTMLElement>('.gallery-count')!;
    let current = 0;

    const show = (i: number) => {
        current = (i + images.length) % images.length;
        // Pictures start hidden and unfetched (lazy + hidden): the one shown and its two neighbours are let in, so the
        // next click is instant and the others cost nothing
        for (const k of [current, current - 1, current + 1]) images[(k + images.length) % images.length].hidden = false;
        void gallery.offsetWidth; // render the unhidden one at opacity 0 first, so it fades in
        images.forEach((img, k) => {
            img.classList.toggle('active', k === current);
            img.setAttribute('aria-hidden', String(k !== current)); // a screen reader reads the one shown, not all of them
        });
        dots.forEach((d, k) =>
            k === current ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current')
        );
        count.textContent = `${current + 1} / ${images.length}`;
    };

    show(0); // lets the neighbours of the first picture in

    gallery.querySelector('.prev')!.addEventListener('click', () => show(current - 1));
    gallery.querySelector('.next')!.addEventListener('click', () => show(current + 1));
    dots.forEach((d, k) => d.addEventListener('click', () => show(k)));
    gallery.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') show(current - 1);
        if (e.key === 'ArrowRight') show(current + 1);
    });
}
