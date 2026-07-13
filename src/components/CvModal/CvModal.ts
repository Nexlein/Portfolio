export class CvModal {
    private readonly modal: HTMLElement;
    private readonly link: HTMLElement | null;
    private readonly closeBtn: HTMLElement | null;

    constructor() {
        this.link = document.getElementById('hero-cv-link');
        this.modal = document.getElementById('cv-modal-backdrop') as HTMLElement;
        this.closeBtn = document.getElementById('cv-modal-close');

        if (this.link && this.modal) {
            this.bindEvents();
        }
    }

    private bindEvents() {
        this.link!.addEventListener('click', (e) => {
            e.preventDefault();
            this.open();
        });

        const closeHandler = () => this.close();

        this.closeBtn?.addEventListener('click', closeHandler);

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) closeHandler();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('show')) {
                closeHandler();
            }
        });
    }

    private open() {
        this.modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    private close() {
        this.modal.classList.remove('show');
        setTimeout(() => {
            document.body.style.overflow = '';
        }, 300);
    }
}
