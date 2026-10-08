import { THEMES, type Theme } from './themes';

const store = (key: string, value: string) => {
    try {
        localStorage.setItem(key, value);
    } catch {
        // Storage blocked: the choice still applies to this page, it just isn't remembered
    }
};

/**
 * Behaviour of the build-time nav: a pill that slides to the hovered link and rests on the section in view,
 * the theme menu, and remembering a language picked by hand (it turns off the first-visit redirect).
 */
export function initNav(): void {
    const nav = document.querySelector<HTMLElement>('#nav nav');
    if (!nav) return;
    initPill(nav);
    initThemes(nav);
    nav.querySelectorAll<HTMLAnchorElement>('[data-lang]').forEach((a) =>
        a.addEventListener('click', () => store('lang', a.dataset.lang!))
    );
}

function initPill(nav: HTMLElement): void {
    const pill = nav.querySelector<HTMLElement>('.nav-pill')!;
    const links = [...nav.querySelectorAll<HTMLAnchorElement>('.nav-link')];
    let active: HTMLAnchorElement | null = null;
    const moveTo = (a: HTMLAnchorElement | null) => {
        pill.classList.toggle('on', !!a && a.offsetWidth > 0);
        if (!a || !a.offsetWidth) return;
        pill.style.width = `${a.offsetWidth + 24}px`;
        pill.style.transform = `translateX(${a.offsetLeft - 12}px)`;
    };
    links.forEach((a) => a.addEventListener('pointerenter', () => moveTo(a)));
    nav.addEventListener('pointerleave', () => moveTo(active));

    const sections = links.map((a) => document.getElementById(a.dataset.section!)).filter((s): s is HTMLElement => !!s);
    const spy = new IntersectionObserver(
        (entries) =>
            entries.forEach((e) => {
                if (!e.isIntersecting) return;
                active = links.find((a) => a.dataset.section === e.target.id) ?? null;
                links.forEach((a) => a.toggleAttribute('aria-current', a === active));
                if (!nav.matches(':hover')) moveTo(active);
            }),
        { rootMargin: '-45% 0px -50% 0px' }
    );
    sections.forEach((s) => spy.observe(s));
}

const currentTheme = () => document.documentElement.dataset.theme as Theme;

function initThemes(nav: HTMLElement): void {
    const wrap = nav.querySelector<HTMLElement>('.nav-themes')!,
        button = wrap.querySelector<HTMLButtonElement>('.nav-theme-btn')!,
        items = [...wrap.querySelectorAll<HTMLButtonElement>('[data-theme-id]')];
    const sync = () =>
        items.forEach((b) => b.setAttribute('aria-checked', String(b.dataset.themeId === currentTheme())));
    const setOpen = (open: boolean) => {
        wrap.classList.toggle('open', open);
        button.setAttribute('aria-expanded', String(open));
        if (open) (items.find((b) => b.getAttribute('aria-checked') === 'true') ?? items[0]).focus();
    };

    button.addEventListener('click', () => setOpen(!wrap.classList.contains('open')));
    items.forEach((b, i) => {
        b.addEventListener('click', () => {
            const theme = b.dataset.themeId as Theme;
            if (!THEMES.includes(theme)) return;
            document.documentElement.dataset.theme = theme;
            store('theme', theme);
            window.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
            sync();
            setOpen(false);
            button.focus();
        });
        // Arrow keys move inside the menu, as in any menu
        b.addEventListener('keydown', (e) => {
            const step = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
            if (!step) return;
            e.preventDefault();
            items[(i + step + items.length) % items.length].focus();
        });
    });
    document.addEventListener('pointerdown', (e) => {
        if (!wrap.contains(e.target as Node)) setOpen(false);
    });
    wrap.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        setOpen(false);
        button.focus();
    });
    sync();
}
