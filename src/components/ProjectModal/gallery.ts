export function bindModalGallery(container: HTMLElement, total: number): void {
    const gallery = container.querySelector('.modal-gallery');
    if (!gallery) return;

    let currentIdx = 0;
    const images = gallery.querySelectorAll('img');
    const dots = gallery.querySelectorAll('.gallery-dot');
    const prevBtn = gallery.querySelector('.prev');
    const nextBtn = gallery.querySelector('.next');

    const updateGallery = (newIdx: number) => {
        images[currentIdx].classList.remove('active');
        dots[currentIdx].classList.remove('active');
        currentIdx = (newIdx + total) % total;
        images[currentIdx].classList.add('active');
        dots[currentIdx].classList.add('active');
    };

    prevBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        updateGallery(currentIdx - 1);
    });
    nextBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        updateGallery(currentIdx + 1);
    });

    dots.forEach((dot, i) => {
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            updateGallery(i);
        });
    });
}
