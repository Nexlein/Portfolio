export class ScrollObserver {
    constructor() {
        this.initScrollObserver();
    }

    private initScrollObserver(): void {
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
}
