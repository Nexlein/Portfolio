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
    title: Text;
    org?: string;
    period: Text;
    /** One line, for the story under the path chart. */
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
    id: 'ai' | 'fullstack';
    /** Entries reference src/data/projects.ts by id; `also` adds a second project to the same line (both linked). */
    projects: { id: string; also?: string; summary: Text; tags: string[] }[];
}

/** In CV order. Every entry appears on the CV and under the path chart on the home page. */
export const EXPERIENCES: Experience[] = [
    {
        id: 'issanka',
        title: { en: 'AI Developer Intern (Part-Time)', fr: 'Développeur IA (stage à temps partiel)' },
        org: 'Issanka',
        period: { en: 'Sep 2026 - Feb 2027', fr: 'sept. 2026 - févr. 2027' },
        summary: {
            en: 'First mission: rebuilt issanka.com (new visual identity, faster pages, many bugs fixed), live since 9 October 2026.',
            fr: "Première mission : refonte d'issanka.com (nouvelle identité visuelle, pages plus rapides, nombreux bugs corrigés), en ligne depuis le 9 octobre 2026."
        },
        highlights: [
            {
                en: 'First mission: rebuilt <a href="https://issanka.com">issanka.com</a> in the new visual identity, faster and with many bugs fixed; live since 9 October 2026.',
                fr: 'Première mission : refonte d\'<a href="https://issanka.com">issanka.com</a> selon la nouvelle identité visuelle, site plus rapide, nombreux bugs corrigés ; en ligne depuis le 9 octobre 2026.'
            },
            {
                en: 'Replaced paid subscriptions (such as Elementor Pro), which lowers running costs.',
                fr: "Remplacement d'abonnements payants (dont Elementor Pro) : moins de frais."
            }
        ]
    },
    {
        id: 'climb2c',
        title: { en: 'Full-Stack & AI Developer Intern', fr: 'Développeur full-stack et IA (stage)' },
        org: 'Climb2C (Eliona Conseil)',
        period: { en: 'Sep - Dec 2025', fr: 'sept. - déc. 2025' },
        summary: {
            en: "Sole developer of an internal RAG system and a client questionnaire whose answers drive Climb2C's offers.",
            fr: "Conception en solo d'un système RAG interne et d'un questionnaire client dont les réponses orientent les offres de Climb2C."
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
        title: { en: 'Hackathons & Cybersecurity', fr: 'Hackathons et cybersécurité' },
        period: { en: '2025 - 2026', fr: '2025 - 2026' },
        summary: {
            en: 'Two generative AI hackathons, with an encouragement prize in 2025 for a quiz chatbot, and two Cycom cybersecurity events.',
            fr: "Deux hackathons d'IA générative, avec un prix d'encouragement en 2025 pour un chatbot de quiz, et deux événements de cybersécurité Cycom."
        },
        highlights: [
            {
                en: '2 generative AI hackathons: a code-review PR hook and a revision-quiz chatbot (encouragement prize, 2025).',
                fr: "2 hackathons d'IA générative : un hook de PR qui relit le code et un chatbot de révision par quiz (prix d'encouragement, 2025)."
            },
            {
                en: '2 Cycom editions (2025, 2026): a hackathon building a security-scan tool, then a CTF.',
                fr: '2 éditions de Cycom (2025, 2026) : un hackathon (outil de scan de sécurité), puis un CTF.'
            }
        ]
    }
];

/** Newest first. */
export const EDUCATION: Education[] = [
    {
        id: 'epitech',
        title: {
            en: "Software Engineering Expert (Master's level)",
            fr: 'Expert en ingénierie logicielle (bac+5)'
        },
        cvTitle: { en: 'Epitech', fr: 'Epitech' },
        period: { en: 'Expected 2029', fr: 'Prévu pour 2029' },
        summary: {
            en: 'Five-year program, taught through projects.',
            fr: "Cursus de 5 ans, où l'on apprend par projets."
        },
        cvSummary: {
            en: "Master's-level title (bac+5, RNCP level 7), taught through projects.",
            fr: 'Titre bac+5 (RNCP niveau 7), formation par projets.'
        }
    },
    {
        id: 'google-cloud',
        title: { en: 'Google Cloud Certificate', fr: 'Certificat Google Cloud' },
        cvTitle: { en: 'Google Cloud', fr: 'Google Cloud' },
        period: { en: '2026', fr: '2026' },
        summary: {
            en: '<strong><a href="https://www.credly.com/badges/25761c6f-8125-4058-85ef-7775c40ae8c2/public_url">Google Cloud Computing Foundations Certificate</a></strong> on cloud infrastructure.',
            fr: 'Certificat <strong><a href="https://www.credly.com/badges/25761c6f-8125-4058-85ef-7775c40ae8c2/public_url">Google Cloud Computing Foundations</a></strong> sur l\'infrastructure cloud.'
        },
        cvSummary: {
            en: '<a href="https://www.credly.com/badges/25761c6f-8125-4058-85ef-7775c40ae8c2/public_url">Cloud Computing Foundations Certificate</a>.',
            fr: 'Certificat <a href="https://www.credly.com/badges/25761c6f-8125-4058-85ef-7775c40ae8c2/public_url">Cloud Computing Foundations</a>.'
        }
    },
    {
        id: 'high-school',
        title: { en: 'High School Graduation & Epitech Admission', fr: 'Bac et admission à Epitech' },
        cvTitle: { en: 'High School', fr: 'Baccalauréat' },
        period: { en: '2024', fr: '2024' },
        summary: {
            en: "Math and computer science specialties, then Epitech's 5-week C bootcamp.",
            fr: 'Spécialités maths et informatique, puis 5 semaines de C intensif à Epitech.'
        },
        cvSummary: {
            en: 'Baccalaureate, math and computer science specialties.',
            fr: 'Spécialités maths et informatique (NSI).'
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
            en: 'BIA (2020), PSC 1 (2021).<br />Languages:<br />French (native), English (fluent, 835/990 on a TOEIC-format test).',
            fr: 'BIA (2020), PSC 1 (2021).<br />Langues :<br />Français (langue maternelle), anglais courant (835/990 à un test au format TOEIC).'
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
        label: { en: 'Baccalaureate + C bootcamp', fr: 'Bac + bootcamp C' },
        skills: ['C']
    },
    { id: 'epitech', date: '2024-09', label: { en: 'Epitech, year 1', fr: 'Epitech, 1re année' } },
    { id: 'climb2c', date: '2025-09', label: { en: 'Full-stack & AI intern', fr: 'Stage full-stack et IA' } },
    { id: 'hackathons', date: '2026-05', label: { en: 'GenAI hackathon', fr: 'Hackathon IA générative' } },
    {
        id: 'google-cloud',
        date: '2026-06',
        label: { en: 'Google Cloud certificate', fr: 'Certificat Google Cloud' },
        skills: ['Google Cloud']
    },
    {
        id: 'issanka',
        date: '2026-09',
        label: { en: 'AI developer intern, Issanka', fr: 'Développeur IA en stage, Issanka' }
    }
];

/**
 * What is happening now: the centre of the project map and the hero's availability pill.
 * The map keeps its cards clear of this block by size (NOW_BOX in NeuralMap/graph.ts): re-measure if the text grows.
 */
export const NOW = {
    role: { en: 'AI developer intern at Issanka', fr: 'Développeur IA en stage chez Issanka' },
    focus: {
        en: 'First mission: issanka.com, live since 9 October',
        fr: 'Première mission : issanka.com, en ligne depuis le 9 octobre'
    },
    detail: { en: 'Sep 2026 - Feb 2027 · Epitech year 3', fr: 'sept. 2026 - févr. 2027 · 3e année à Epitech' },
    availability: { en: 'Intern at Issanka · since Sep 2026', fr: 'En stage chez Issanka · depuis sept. 2026' }
} satisfies Record<string, Text>;

/** Where the owner works from: the CV header. */
export const LOCATION: Text = { en: 'Montpellier, France · or remote', fr: 'Montpellier · ou télétravail' };

export const SKILLS: SkillGroup[] = [
    {
        id: 'languages',
        title: { en: 'Languages', fr: 'Langages' },
        items: ['Python', 'TypeScript', 'C/C++', 'C#/.NET']
    },
    {
        id: 'ai',
        title: { en: 'AI', fr: 'IA' },
        items: ['LLMs (Ollama)', 'RAG', 'PyTorch', 'RL (PPO, DQN)', 'MS Agent Framework']
    },
    {
        id: 'web',
        title: { en: 'Web', fr: 'Web' },
        items: ['React', 'Express', 'Prisma', 'PostgreSQL', 'Redis']
    },
    {
        id: 'devops',
        title: { en: 'Infra & DevOps', fr: 'Infra et DevOps' },
        items: ['Docker', 'Kubernetes', 'Azure', 'Ansible', 'Jenkins', 'Linux']
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
        id: 'ai',
        projects: [
            {
                id: 'sensai',
                summary: {
                    en: 'Local AI agent on Ollama, built by a team of 4 without an LLM framework: RAG with cited sources, tools, memory; 1,406 tests in CI.',
                    fr: 'Agent IA local sur Ollama, construit en équipe de 4 sans framework LLM : RAG avec sources citées, outils, mémoire ; 1 406 tests en CI.'
                },
                tags: ['Python', 'LLM', 'RAG']
            },
            {
                id: 'starttrek',
                summary: {
                    en: 'DQN written from scratch in PyTorch to land a lunar module (team of 3): average reward of 191 ± 41 over 5 seeds (95% CI; 200 = solved).',
                    fr: 'DQN écrit de zéro en PyTorch pour poser un module lunaire (équipe de 3) : récompense moyenne de 191 ± 41 sur 5 graines (IC à 95 % ; 200 = résolu).'
                },
                tags: ['Python', 'PyTorch', 'DQN']
            },
            {
                id: 'ai-racing',
                also: 'blackjack-ai',
                summary: {
                    en: 'Two solo RL agents (PPO): one drives around a track with raycast sensors, one learns Blackjack from the rules alone.',
                    fr: "Deux agents RL en solo (PPO) : l'un fait le tour d'un circuit avec des capteurs à lancer de rayons, l'autre apprend le blackjack à partir des seules règles."
                },
                tags: ['Python', 'RL', 'Gymnasium']
            }
        ]
    },
    {
        id: 'fullstack',
        projects: [
            {
                id: 'bernstein',
                summary: {
                    en: "Deploys the school's voting app to Kubernetes on Azure (AKS) in one command (team of 2); CI checks that an update or a node drain does not interrupt the service.",
                    fr: "Déploie en une commande l'application de vote de l'école sur Kubernetes (AKS, Azure), en équipe de 2 ; la CI vérifie qu'une mise à jour ou le drain d'un nœud ne coupe pas le service."
                },
                tags: ['Kubernetes', 'Azure', 'CI/CD']
            },
            {
                id: 'dashboard',
                summary: {
                    en: 'Widget dashboard in React and Express (team of 2): authentication, three API replicas behind Nginx, more than 400 tests.',
                    fr: "Tableau de bord à widgets en React et Express (équipe de 2) : authentification, trois réplicas d'API derrière Nginx, plus de 400 tests."
                },
                tags: ['TypeScript', 'React', 'Express']
            },
            {
                id: 'arcade',
                also: 'raytracer',
                summary: {
                    en: 'Game platform with hot-swapped plugins (team of 2) and a 3D ray tracer (team of 4), both in C++.',
                    fr: 'Plateforme de jeux à plugins échangeables à chaud (équipe de 2) et moteur de rendu 3D par lancer de rayons (équipe de 4), en C++.'
                },
                tags: ['C++']
            }
        ]
    }
];
