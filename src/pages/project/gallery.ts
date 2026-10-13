/** Gallery on a project page: arrows, dots, arrow keys and a "2 / 4" counter. One image shows at a time. */
export function initGallery(gallery: HTMLElement): void {
    const images = [...gallery.querySelectorAll<HTMLImageElement>('img')];
    const dots = [...gallery.querySelectorAll<HTMLButtonElement>('.gallery-dots button')];
    const count = gallery.querySelector<HTMLElement>('.gallery-count')!;
    let current = 0;

    const show = (i: number) => {
        current = (i + images.length) % images.length;
        images.forEach((img, k) => img.classList.toggle('active', k === current));
        dots.forEach((d, k) =>
            k === current ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current')
        );
        count.textContent = `${current + 1} / ${images.length}`;
    };

    gallery.querySelector('.prev')!.addEventListener('click', () => show(current - 1));
    gallery.querySelector('.next')!.addEventListener('click', () => show(current + 1));
    dots.forEach((d, k) => d.addEventListener('click', () => show(k)));
    gallery.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') show(current - 1);
        if (e.key === 'ArrowRight') show(current + 1);
    });
}
