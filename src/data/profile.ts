/**
 * Everything the site says about its owner, written once in every language.
 * Pages render it at build time: the home and the CV.
 * UI words (buttons, headings) stay in src/i18n; facts live here.
 * Text may contain inline <strong>/<br>, but never CSS classes: styling belongs to the templates.
 */
import type { Text } from '../core/translate.ts';

export type { Text };

export interface Experience {
    id: string;
    kind: 'job' | 'internship' | 'event';
    title: Text;
    org?: string;
    period: Text;
    /** Long form, for the home timeline. */
    summary: Text;
    /** Short bullets, for the CV. */
    highlights: Text[];
    tags?: string[];
}

export interface Education {
    id: string;
    /** Timeline heading. */
    title: Text;
    /** CV heading: short, often just the institution. */
    cvTitle: Text;
    period: Text;
    summary: Text;
    cvSummary: Text;
    /** The CV shows no date for this entry. */
    cvHidePeriod?: boolean;
}

export interface SkillGroup {
    id: string;
    title: Text;
    items: string[];
}

export interface CvProjectGroup {
    id: 'systems' | 'ai';
    /** Entries reference src/data/projects.ts by id; `title` overrides the project title when grouping several. */
    projects: { id: string; title?: string; summary: Text; tags: string[] }[];
}

export interface Offer {
    id: 'full-time' | 'freelance';
    title: Text;
    summary: Text;
    /** `recruiter`: pay and contract details, folded away on the home. */
    rows: { label: Text; value: Text; note: Text; recruiter?: true }[];
}

/** In CV order. Every entry appears on the CV and under the path chart on the home page. */
export const EXPERIENCES: Experience[] = [
    {
        id: 'issanka',
        kind: 'job',
        title: { en: 'AI Developer (Part-Time)', fr: 'Développeur IA (temps partiel)' },
        org: 'Issanka',
        period: { en: 'Sept 2026 - Feb 2027', fr: 'Sept 2026 - Fév 2027' },
        summary: {
            en: 'Rebuilt the company website, live since 9 October 2026: a new visual identity, faster pages and many bugs fixed. It also replaced paid subscriptions (such as Elementor Pro), which lowers running costs.',
            fr: "Refonte du site de l'entreprise, en ligne depuis le 9 octobre 2026 : une nouvelle identité visuelle, des pages plus rapides et de nombreux bugs corrigés. Elle remplace aussi des abonnements payants (comme Elementor Pro), ce qui réduit les coûts."
        },
        highlights: [
            {
                en: 'Rebuilt the company website with the new visual identity: faster, many bugs fixed, live since 9 October 2026.',
                fr: "Refonte du site de l'entreprise à la nouvelle identité visuelle : plus rapide, de nombreux bugs corrigés, en ligne depuis le 9 octobre 2026."
            },
            {
                en: 'Replaced paid subscriptions (such as Elementor Pro), which lowers running costs.',
                fr: "Remplacement d'abonnements payants (comme Elementor Pro) : des coûts en moins."
            }
        ]
    },
    {
        id: 'climb2c',
        kind: 'internship',
        title: { en: 'Full-Stack & AI Developer Intern', fr: 'Développeur Full-Stack & IA (stage)' },
        org: 'Climb2C (Eliona Conseil)',
        period: { en: 'Sept - Dec 2025', fr: 'Sept - Déc 2025' },
        summary: {
            en: "In a team of five, I developed my parts on my own: an internal Retrieval-Augmented Generation (RAG) system with Microsoft Agent Framework and local Ollama models, and a client questionnaire in Razor and Entity Framework: the clients' answers drive the Climb2C offers recommended to them.",
            fr: "Dans une équipe de cinq, j'ai développé seul mes parties : un système RAG (Retrieval-Augmented Generation) interne avec Microsoft Agent Framework et des modèles Ollama en local, et d'un questionnaire client en Razor et Entity Framework : les réponses des clients déterminent les offres Climb2C qui leur sont recommandées."
        },
        highlights: [
            {
                en: 'Built an internal RAG system on my own, with Microsoft Agent Framework and local Ollama models.',
                fr: "Conception en solo d'un système RAG interne avec Microsoft Agent Framework et des modèles Ollama en local."
            },
            {
                en: 'Built a client questionnaire (Razor, Entity Framework): the answers drive the offers we recommend.',
                fr: 'Questionnaire client (Razor, Entity Framework) : les réponses déterminent les offres recommandées.'
            }
        ],
        tags: ['C# / ASP.NET', 'Entity Framework', 'Ollama', 'MS Agent Framework']
    },
    {
        id: 'hackathons',
        kind: 'event',
        title: { en: 'Hackathons & Cybersecurity', fr: 'Hackathons & Cybersécurité' },
        period: { en: '2025 - 2026', fr: '2025 - 2026' },
        summary: {
            en: 'Two generative-AI hackathons (48 hours each, about seven teams): a pull-request hook that reviews the code with good points, bad points and questions that keep a human in the loop, and a chatbot that turns lessons into quiz questions and grades the answers, which placed second. Two Cycom cybersecurity events (2025 and 2026): a hackathon where we built a tool that automates security scans such as nmap, then a classic CTF.',
            fr: "Deux hackathons d'IA générative (48 heures chacun, environ sept équipes) : un hook de pull request qui relit le code avec des points positifs, des points négatifs et des questions pour garder l'humain dans la boucle, et un chatbot qui transforme des cours en questions de quiz et note les réponses, et qui a fini deuxième. Deux événements de cybersécurité Cycom (2025 et 2026) : un hackathon où nous avons conçu un outil qui automatise des scans de sécurité comme nmap, puis un CTF classique."
        },
        highlights: [
            {
                en: '2 generative-AI hackathons, 48 h each: a code-review PR hook and a revision-quiz chatbot (2nd place).',
                fr: "2 hackathons d'IA générative de 48 h : un hook de PR qui relit le code et un chatbot de révision par quiz (2e place)."
            },
            {
                en: '2 Cycom editions (2025, 2026): a hackathon building a security-scan tool, then a CTF.',
                fr: '2 éditions de Cycom (2025, 2026) : un hackathon (outil de scans de sécurité), puis un CTF.'
            }
        ]
    }
];

/** Newest first. */
export const EDUCATION: Education[] = [
    {
        id: 'epitech',
        title: { en: "Master's Degree in Information Technology", fr: "Master en Technologies de l'Information" },
        cvTitle: { en: 'Epitech', fr: 'Epitech' },
        period: { en: 'Expected 2029', fr: 'Prévu pour 2029' },
        summary: {
            en: 'Intensive 5-year project-based curriculum focusing on advanced software engineering, system architecture, and C++.',
            fr: 'Cursus intensif de 5 ans en ingénierie informatique à Epitech. Pédagogie par projets avec une spécialisation en architecture logicielle, systèmes et C++.'
        },
        cvSummary: {
            en: "Master's Degree in Information Technology. Intensive focus on advanced software engineering.",
            fr: "Master en Technologies de l'Information. Formation intensive axée sur l'ingénierie logicielle avancée."
        }
    },
    {
        id: 'google-cloud',
        title: { en: 'Google Cloud & Generative AI Certifications', fr: 'Certifications Google Cloud & IA Générative' },
        cvTitle: { en: 'Google Cloud', fr: 'Google Cloud' },
        period: { en: '2026', fr: '2026' },
        summary: {
            en: 'Certified in <strong>Google Cloud Computing Foundations</strong> and <strong>Generative AI Leader</strong>. Solidified expertise in modern cloud infrastructure and AI deployment.',
            fr: "Certifié <strong>Google Cloud Computing Foundations</strong> et <strong>Generative AI Leader</strong>. Expertise renforcée en infrastructure cloud et déploiement de modèles d'IA."
        },
        cvSummary: {
            en: 'Cloud Computing Foundations & Generative AI Leader Certifications.',
            fr: 'Certifications Google Cloud Computing Foundations & Generative AI Leader.'
        }
    },
    {
        id: 'high-school',
        title: { en: 'High School Graduation & Epitech Admission', fr: 'Baccalauréat & Admission à Epitech' },
        cvTitle: { en: 'High School', fr: 'Baccalauréat' },
        period: { en: '2024', fr: '2024' },
        summary: {
            en: "Specialized in Mathematics and Computer Science. Successfully passed the intensive 5-week Epitech C Programming 'Piscine' bootcamp.",
            fr: 'Spécialité Mathématiques et Sciences Informatiques. Réussite de la « Piscine » Epitech, un bootcamp intensif de 5 semaines en programmation C.'
        },
        cvSummary: {
            en: 'Baccalaureate (Specialization: Mathematics & Computer Science).',
            fr: 'Baccalauréat (Spécialités : Mathématiques & NSI).'
        }
    },
    {
        id: 'bia-psc',
        title: { en: 'Aeronautics & First Aid', fr: 'Aéronautique & Secourisme' },
        cvTitle: { en: 'Additional', fr: 'Divers' },
        period: { en: '2020 - 2021', fr: '2020 - 2021' },
        summary: {
            en: 'Obtained the BIA (Aeronautics Initiation Certificate) and the PSC (First Aid) certification.',
            fr: "Obtention du BIA (Brevet d'initiation à l'Aéronautique) et certification PSC (Prévention et Secours Civiques)."
        },
        cvHidePeriod: true,
        cvSummary: {
            en: 'BIA (2020), PSC 1 (2021).<br />Languages:<br />French (Native), English (Fluent).',
            fr: 'BIA (2020), PSC 1 (2021).<br />Langues :<br />Français (Natif), Anglais (Bilingue).'
        }
    }
];

/** A dated step of the path chart. `id` points at an experience or education entry. */
export interface Checkpoint {
    id: string;
    /** 'YYYY-MM' */
    date: string;
    label: Text;
    /** Skills it brought, on top of the entry's own tags (path chart). */
    skills?: string[];
}

/** Path chart checkpoints, oldest first. */
export const CHECKPOINTS: Checkpoint[] = [
    {
        id: 'high-school',
        date: '2024-07',
        label: { en: 'Baccalauréat + C bootcamp', fr: 'Bac + Piscine C' },
        skills: ['C']
    },
    { id: 'epitech', date: '2024-09', label: { en: 'Epitech, year 1', fr: 'Epitech, 1re année' } },
    { id: 'climb2c', date: '2025-09', label: { en: 'Full-stack & AI intern', fr: 'Stage full-stack & IA' } },
    { id: 'hackathons', date: '2026-05', label: { en: 'GenAI hackathon', fr: 'Hackathon IA générative' } },
    {
        id: 'google-cloud',
        date: '2026-06',
        label: { en: 'Google Cloud certified', fr: 'Certifié Google Cloud' },
        skills: ['Google Cloud', 'Generative AI']
    },
    { id: 'issanka', date: '2026-09', label: { en: 'AI developer, Issanka', fr: 'Développeur IA, Issanka' } }
];

/** What is happening now: the centre of the project map and the hero's availability pill. */
export const NOW = {
    role: { en: 'AI developer at Issanka', fr: 'Développeur IA chez Issanka' },
    focus: {
        en: "The company's new website, live since 9 October",
        fr: "Le nouveau site de l'entreprise, en ligne depuis le 9 octobre"
    },
    detail: { en: 'Sept 2026 – Feb 2027 · Epitech year 3', fr: 'Sept 2026 – Fév 2027 · Epitech 3e année' },
    availability: { en: 'Open to an internship · Mar – Aug', fr: 'Disponible en stage · mars – août' }
} satisfies Record<string, Text>;

/** Home timeline order (newest first), mixing experiences and education by id. A test checks every entry is listed once. */
export const TIMELINE: string[] = [
    'issanka',
    'epitech',
    'google-cloud',
    'hackathons',
    'climb2c',
    'high-school',
    'bia-psc'
];

export const SKILLS: SkillGroup[] = [
    {
        id: 'languages',
        title: { en: 'Languages', fr: 'Langages' },
        items: ['C/C++', 'Python', 'C# / .NET', 'TypeScript']
    },
    {
        id: 'ai-data',
        title: { en: 'AI & Data', fr: 'IA & Data' },
        items: ['PyTorch', 'RAG', 'LLMs (Ollama)', 'Agentic Frameworks', 'Prompt Engineering']
    },
    {
        id: 'devops',
        title: { en: 'DevOps & Arch', fr: 'DevOps & Archi' },
        items: ['Docker', 'Linux', 'Git', 'Ansible', 'Jenkins']
    },
    {
        id: 'practices',
        title: { en: 'Practices', fr: 'Pratiques' },
        items: ['TDD', 'CI/CD', 'Vitest', 'Playwright', 'GitHub Actions']
    }
];

/** The CV's two project columns. Ids must exist in src/data/projects.ts. */
export const CV_PROJECTS: CvProjectGroup[] = [
    {
        id: 'systems',
        projects: [
            {
                id: 'zappy',
                summary: {
                    en: 'Multiplayer autonomous AI network game. Handled concurrent socket connections and state.',
                    fr: "Jeu en réseau multijoueur avec IA autonome. Gestion des connexions simultanées par sockets et de l'état du jeu."
                },
                tags: ['C++', 'Sockets']
            },
            {
                id: 'arcade',
                title: 'Arcade & Raytracer',
                summary: {
                    en: '3D math rendering engine and modular gaming architecture.',
                    fr: 'Moteur de rendu mathématique 3D et architecture de jeu modulaire.'
                },
                tags: ['C++']
            },
            {
                id: 'plazza',
                summary: {
                    en: 'Multi-process, multi-threaded pizzeria simulation exploring IPC and mutex coordination.',
                    fr: 'Simulation multi-processus et multi-thread explorant la communication inter-processus (IPC) et la coordination par mutex.'
                },
                tags: ['C++', 'IPC']
            }
        ]
    },
    {
        id: 'ai',
        projects: [
            {
                id: 'ai-racing',
                title: 'AI-Racing',
                summary: {
                    en: 'RL agent (PPO) navigating a custom kinematic physics environment with raycast sensors.',
                    fr: 'Agent RL (PPO) qui navigue dans un environnement à physique cinématique sur mesure, avec des capteurs à lancer de rayons.'
                },
                tags: ['Python', 'RL', 'Gymnasium']
            },
            {
                id: 'persona',
                summary: {
                    en: 'Self-hosted AI personalized news digest workflow.',
                    fr: "Workflow auto-hébergé de résumé d'actualités personnalisé par IA."
                },
                tags: ['N8N', 'Mistral']
            },
            {
                id: 'blackjack-ai',
                summary: {
                    en: 'Deep RL agent (Maskable PPO) learning optimal Blackjack strategy in a custom environment.',
                    fr: 'Agent RL profond (Maskable PPO) qui apprend la stratégie optimale du blackjack dans un environnement sur mesure.'
                },
                tags: ['Python', 'RL', 'PPO']
            }
        ]
    }
];

export const OFFERS: Offer[] = [
    {
        id: 'full-time',
        title: { en: 'Full-Time Internship', fr: 'Stage à temps plein' },
        summary: {
            en: 'Mandatory Epitech Tek3 placement (Full-time)',
            fr: "Stage de fin d'année obligatoire Epitech Tek3 (temps plein)"
        },
        rows: [
            {
                label: { en: 'Timeline & Rhythm', fr: 'Période et rythme' },
                value: { en: 'March 29 to Aug. 27.', fr: '29 Mars au 27 Août.' },
                note: { en: 'At least 4 months (5 days/week).', fr: 'Au moins 4 mois (5 jours/semaine).' }
            },
            {
                label: { en: 'Contract Type', fr: 'Type de contrat' },
                value: { en: 'Internship, CDD, or CDI.', fr: 'Stage, CDD ou CDI.' },
                note: { en: 'Full-time placement.', fr: 'Temps plein.' }
            },
            {
                label: { en: 'Recruiter Info', fr: 'Infos recruteur' },
                recruiter: true,
                value: {
                    en: 'Legal min: 4.50€/h (2026 rate, ~650-700€/mo).',
                    fr: 'Min. légal : 4,50 €/h (taux 2026, 650–700 €/mois).'
                },
                note: {
                    en: 'No school fees covered by the company.<br />Seeking competitive compensation.',
                    fr: "Aucun frais de scolarité à la charge de l'entreprise.<br />Je souhaite une rémunération compétitive."
                }
            }
        ]
    },
    {
        id: 'freelance',
        title: { en: 'Freelance Missions', fr: 'Missions freelance' },
        summary: { en: 'B2B project-based collaboration', fr: 'Collaboration B2B par projet' },
        rows: [
            {
                label: { en: 'Scope & Availability', fr: 'Périmètre et disponibilité' },
                value: { en: 'Backend APIs, AI integration.', fr: "API back-end, intégration d'IA." },
                note: { en: 'Flexible hours, async delivery.', fr: 'Horaires flexibles, livraison asynchrone.' }
            },
            {
                label: { en: 'Status', fr: 'Statut' },
                value: { en: 'Freelancer (Auto-entrepreneur)', fr: 'Freelance (auto-entrepreneur)' },
                note: { en: 'No payroll taxes for the client.', fr: 'Pas de charges patronales.' }
            },
            {
                label: { en: 'Rates', fr: 'Tarifs' },
                value: { en: 'Daily Rate or Fixed Price.', fr: 'TJM ou forfait.' },
                note: { en: 'Quotation provided upon request.', fr: 'Devis fourni sur demande.' }
            }
        ]
    }
];
