/** Add `.scrolled` to the top nav once the page scrolls past #nav-sentinel. */
export function initNavShadow(): void {
    const nav = document.getElementById('topnav');
    const sentinel = document.getElementById('nav-sentinel');
    if (!nav || !sentinel) return;

    const observer = new IntersectionObserver(([entry]) => {
        nav.classList.toggle('scrolled', !entry.isIntersecting);
    });
    observer.observe(sentinel);
}

/** Highlight the nav link whose section crosses the middle of the viewport. */
export function initScrollSpy(): void {
    const navLinks = document.querySelectorAll<HTMLElement>('.nav-link[data-section]');
    const sections = document.querySelectorAll<HTMLElement>('section[id]');

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const id = entry.target.id;
                navLinks.forEach((link) => {
                    link.classList.toggle('active', link.dataset.section === id);
                });
            });
        },
        { rootMargin: '-50% 0px -49% 0px' }
    );

    sections.forEach((s) => observer.observe(s));
}
