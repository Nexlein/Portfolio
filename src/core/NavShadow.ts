export class NavShadow {
    constructor() {
        this.initNavShadow();
    }

    private initNavShadow(): void {
        const nav = document.getElementById('topnav');
        if (!nav) return;
        window.addEventListener(
            'scroll',
            () => {
                nav.classList.toggle('scrolled', window.scrollY > 20);
            },
            { passive: true }
        );
    }
}
