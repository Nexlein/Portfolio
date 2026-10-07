// PROTOTYPE — floating variant switcher + theme toggle. Never shipped: prototype-home.html is not a build input.

export interface Variant {
    key: string;
    name: string;
    mount: (root: HTMLElement) => void;
}

type Theme = 'light' | 'dark';

function systemTheme(): Theme {
    return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(theme: Theme): void {
    document.documentElement.dataset.theme = theme;
}

export function mountSwitcher(variants: Variant[], current: Variant): void {
    let theme: Theme = (sessionStorage.getItem('proto-theme') as Theme | null) ?? systemTheme();
    applyTheme(theme);

    const go = (step: number) => {
        const i = (variants.indexOf(current) + step + variants.length) % variants.length;
        const url = new URL(location.href);
        url.searchParams.set('variant', variants[i].key);
        location.assign(url);
    };

    const bar = document.createElement('div');
    bar.className = 'proto-bar';
    bar.innerHTML = `
        <button type="button" data-step="-1" aria-label="Previous variant">←</button>
        <span class="proto-label">${current.key} — ${current.name}</span>
        <button type="button" data-step="1" aria-label="Next variant">→</button>
        <span class="proto-sep"></span>
        <button type="button" class="proto-theme" aria-label="Toggle theme">${theme === 'dark' ? '☾' : '☀'}</button>`;
    document.body.appendChild(bar);

    bar.addEventListener('click', (e) => {
        const btn = (e.target as HTMLElement).closest('button');
        if (!btn) return;
        if (btn.classList.contains('proto-theme')) {
            theme = theme === 'dark' ? 'light' : 'dark';
            sessionStorage.setItem('proto-theme', theme);
            applyTheme(theme);
            btn.textContent = theme === 'dark' ? '☾' : '☀';
            window.dispatchEvent(new Event('proto-theme'));
        } else {
            go(Number(btn.dataset.step));
        }
    });

    window.addEventListener('keydown', (e) => {
        const t = e.target as HTMLElement;
        if (t.closest('input, textarea, [contenteditable]')) return;
        if (e.key === 'ArrowLeft') go(-1);
        if (e.key === 'ArrowRight') go(1);
    });
}
