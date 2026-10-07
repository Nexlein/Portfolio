export class NavShadow {
    constructor() {
        this.initNavShadow();
    }

    private initNavShadow(): void {
        const nav = document.getElementById('topnav');
        const sentinel = document.getElementById('nav-sentinel');
        if (!nav || !sentinel) return;

        const observer = new IntersectionObserver(([entry]) => {
            nav.classList.toggle('scrolled', !entry.isIntersecting);
        });
        observer.observe(sentinel);
    }
}
