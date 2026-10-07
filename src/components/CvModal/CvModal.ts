/** Open the CV (cv.html in an iframe) in a modal from the hero "CV" link. */
export function initCvModal(): void {
    const link = document.getElementById('hero-cv-link');
    const modal = document.getElementById('cv-modal-backdrop');
    if (!link || !modal) return;

    const open = () => {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    };

    const close = () => {
        modal.classList.remove('show');
        setTimeout(() => {
            document.body.style.overflow = '';
        }, 300);
    };

    link.addEventListener('click', (e) => {
        e.preventDefault();
        open();
    });

    document.getElementById('cv-modal-close')?.addEventListener('click', close);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) close();
    });
}
