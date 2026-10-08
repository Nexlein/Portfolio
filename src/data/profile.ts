/**
 * Everything the site says about its owner, written once in every language.
 * Pages render it at build time: the home timeline, the CV and the availability page.
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
    rows: { label: Text; value: Text; note: Text }[];
}

/** In CV order. Every entry appears on the CV and on the home timeline (see TIMELINE). */
export const EXPERIENCES: Experience[] = [
    {
        id: 'issanka',
        kind: 'job',
        title: { en: 'AI Developer (Part-Time)', fr: 'Développeur IA (Temps partiel)' },
        org: 'Issanka',
        period: { en: 'Sept 2026 - Feb 2027', fr: 'Sept 2026 - Fév 2027' },
        summary: {
            en: 'Building a SaaS platform from scratch that integrates AI-driven workflows and RAG architectures, and developing conversational AI agents while modernizing the web architecture.',
            fr: "Création from scratch d'une plateforme SaaS intégrant des workflows pilotés par l'IA et des architectures RAG, et développement d'agents conversationnels en modernisant l'architecture web."
        },
        highlights: [
            {
                en: 'Building a SaaS platform from scratch integrating AI-driven workflows and RAG architectures.',
                fr: "Création from scratch d'une plateforme SaaS intégrant des workflows pilotés par l'IA et des architectures RAG."
            },
            {
                en: 'Developing conversational AI agents and modernizing the technical web architecture.',
                fr: "Développement d'agents conversationnels et modernisation de l'architecture technique web."
            }
        ]
    },
    {
        id: 'climb2c',
        kind: 'internship',
        title: { en: 'Full-Stack & AI Developer Intern', fr: 'Développeur Full-Stack & IA' },
        org: 'Climb2C (Eliona Conseil)',
        period: { en: 'Sept - Dec 2025', fr: 'Sept - Déc 2025' },
        summary: {
            en: 'Developed Razor components and managed databases via Entity Framework. Engineered an internal Retrieval-Augmented Generation (RAG) system using Microsoft Agent Framework and Ollama to securely query enterprise data.',
            fr: "Développement de composants Razor et gestion de bases de données via Entity Framework. Conception d'un système RAG interne utilisant Microsoft Agent Framework et Ollama pour interroger les données de l'entreprise de manière sécurisée."
        },
        highlights: [
            {
                en: 'Engineered an internal AI Retrieval-Augmented Generation (RAG) system using Microsoft Agent Framework and local Ollama LLMs.',
                fr: "Conception d'un système interne RAG (Retrieval-Augmented Generation) utilisant Microsoft Agent Framework et des modèles locaux Ollama."
            },
            {
                en: 'Developed Razor components and managed databases with Entity Framework.',
                fr: 'Développement de composants Razor et gestion de bases de données avec Entity Framework.'
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
            en: 'Competed in two Generative AI Hackathons to build innovative LLM tools, and two Cycom cybersecurity CTF events.',
            fr: "Participation à deux Hackathons d'IA Générative pour concevoir des outils LLM innovants, et à deux événements Cycom (Conférences Cybersécurité et CTF)."
        },
        highlights: [
            {
                en: 'Competed in 2 Generative AI Hackathons (building innovative LLM tools).',
                fr: "Participation à 2 Hackathons IA Générative (création d'outils LLM innovants)."
            },
            {
                en: 'Participated in 2 Cycom events (Cybersecurity talks and CTFs).',
                fr: 'Participation à 2 événements Cycom (Conférences et CTFs Cybersécurité).'
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
            fr: "Spécialité Mathématiques et Sciences Informatiques. Réussite de la 'Piscine' Epitech, un bootcamp intensif de 5 semaines en programmation C."
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
            fr: 'BIA (2020), PSC 1 (2021).<br />Langues:<br />Français (Natif), Anglais (Bilingue).'
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
        label: { en: 'Baccalauréat + C Piscine', fr: 'Bac + Piscine C' },
        skills: ['C']
    },
    { id: 'epitech', date: '2024-09', label: { en: 'Epitech, year 1', fr: 'Epitech, 1re année' } },
    { id: 'climb2c', date: '2025-09', label: { en: 'Full-stack & AI intern', fr: 'Stage full-stack & IA' } },
    // TODO(owner): confirm the months of the next two
    { id: 'hackathons', date: '2026-01', label: { en: 'Hackathons', fr: 'Hackathons' } },
    {
        id: 'google-cloud',
        date: '2026-04',
        label: { en: 'Google Cloud certified', fr: 'Certifié Google Cloud' },
        skills: ['Google Cloud', 'Generative AI']
    },
    { id: 'issanka', date: '2026-09', label: { en: 'AI developer, Issanka', fr: 'Développeur IA, Issanka' } }
];

/** What is happening now: the centre of the project map and the hero's availability pill. */
export const NOW = {
    role: { en: 'AI developer at Issanka', fr: 'Développeur IA chez Issanka' },
    focus: { en: 'RAG pipelines and conversational agents', fr: 'Pipelines RAG et agents conversationnels' },
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
                    fr: "Jeu réseau multijoueur avec IA autonome. Gestion des connexions de sockets concurrentes et de l'état."
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
                    fr: 'Agent RL (PPO) naviguant dans un environnement de physique cinématique personnalisé avec capteurs à lancer de rayons.'
                },
                tags: ['Python', 'RL', 'Gymnasium']
            },
            {
                id: 'persona',
                summary: {
                    en: 'Self-hosted AI personalized news digest workflow.',
                    fr: "Workflow de résumé d'actualités personnalisé par IA auto-hébergé."
                },
                tags: ['N8N', 'Mistral']
            },
            {
                id: 'blackjack-ai',
                summary: {
                    en: 'Deep RL agent (Maskable PPO) learning optimal Blackjack strategy in a custom environment.',
                    fr: 'Agent RL profond (Maskable PPO) apprenant la stratégie optimale du Blackjack dans un environnement personnalisé.'
                },
                tags: ['Python', 'RL', 'PPO']
            }
        ]
    }
];

export const OFFERS: Offer[] = [
    {
        id: 'full-time',
        title: { en: 'Full-Time Internship', fr: 'Stage à Temps Plein' },
        summary: {
            en: 'Mandatory Epitech Tek3 placement (Full-time)',
            fr: "Stage de fin d'année obligatoire Epitech Tek3 (Temps plein)"
        },
        rows: [
            {
                label: { en: 'Timeline & Rhythm', fr: 'Période & Rythme' },
                value: { en: 'March 29 to Aug. 27.', fr: '29 Mars au 27 Août.' },
                note: { en: 'At least 4 months (5 days/week).', fr: 'Au moins 4 mois (5 jours/semaine).' }
            },
            {
                label: { en: 'Contract Type', fr: 'Type de Contrat' },
                value: { en: 'Internship, CDD, or CDI.', fr: 'Stage, CDD ou CDI.' },
                note: { en: 'Full-time placement.', fr: 'Temps plein.' }
            },
            {
                label: { en: 'Recruiter Info', fr: 'Infos Recruteur' },
                value: {
                    en: 'Legal min: 4.50€/h (2026 rate, ~650-700€/mo).',
                    fr: 'Min. légal : 4,50€/h (taux 2026, ~650-700€/mois).'
                },
                note: {
                    en: 'No school fees covered by the company.<br />Seeking competitive compensation.',
                    fr: "Aucun frais de scolarité à la charge de l'entreprise.<br />Recherche d'une rémunération compétitive."
                }
            }
        ]
    },
    {
        id: 'freelance',
        title: { en: 'Freelance Missions', fr: 'Missions Freelance' },
        summary: { en: 'B2B project-based collaboration', fr: 'Collaboration B2B par projet' },
        rows: [
            {
                label: { en: 'Scope & Availability', fr: 'Périmètre & Disponibilité' },
                value: { en: 'Backend APIs, AI integration.', fr: 'APIs Backend, intégration IA.' },
                note: { en: 'Flexible hours, async delivery.', fr: 'Horaires flexibles, livraison asynchrone.' }
            },
            {
                label: { en: 'Status', fr: 'Statut' },
                value: { en: 'Freelancer (Auto-entrepreneur)', fr: 'Freelance (Auto-entrepreneur)' },
                note: { en: 'No payroll taxes for the client.', fr: 'Pas de charges patronales.' }
            },
            {
                label: { en: 'Rates', fr: 'Tarifs' },
                value: { en: 'Daily Rate or Fixed Price.', fr: 'TJM ou Forfait.' },
                note: { en: 'Quotation provided upon request.', fr: 'Devis fourni sur demande.' }
            }
        ]
    }
];
