import type { Text } from '../core/translate.ts';

/**
 * Single source of truth for all portfolio projects.
 * To add a project: append one ProjectEntry object to the array below.
 * Cards, the modal, project pages, the sitemap and structured data are all generated from it.
 * Text fields hold every language ({ en, fr }).
 */

type ProjectCategory = 'architecture' | 'systems' | 'ai' | 'devops' | 'graphical';

interface ProjectMediaVideo {
    type: 'video';
    src: string; // path relative to /public
}

interface ProjectMediaImage {
    type: 'image';
    src: string;
    alt: string;
}

interface ProjectMediaGallery {
    type: 'gallery';
    images: { src: string; alt: string }[];
}

export type ProjectMedia = ProjectMediaVideo | ProjectMediaImage | ProjectMediaGallery;

export interface ProjectEntry {
    id: string;
    title: string;
    description: Text;
    tags: string[];
    category: ProjectCategory;
    year?: 'Tek1' | 'Tek2' | 'Personal';
    /** Month the project started, 'YYYY-MM'. Drives the path chart and "learned this year". */
    date: string;
    /** Shown in "Selected work" and always on the map. */
    featured?: true;
    github: string; // full URL or '' to hide the link
    media: ProjectMedia;
}

/** URL of a project's own page (default language). */
export function projectPath(id: string): string {
    return `/projects/${id}.html`;
}

export const PROJECTS: ProjectEntry[] = [
    {
        id: 'arcade',
        title: 'Arcade',
        description: {
            en: 'Modular gaming architecture. Dynamically loads game libraries (Pacman, Nibbler) and graphics backends (SDL2, SFML, ncurses) at runtime via shared objects.',
            fr: "Architecture de jeu modulaire. Charge dynamiquement des bibliothèques de jeux (Pacman, Nibbler) et des moteurs graphiques (SDL2, SFML, ncurses) à l'exécution via des objets partagés."
        },
        tags: ['C++', 'OOP', 'Dynamic Loading'],
        category: 'graphical',
        date: '2026-03',
        github: 'https://github.com/Nexlein/Arcade',
        media: { type: 'video', src: '/projects/arcade/arcade.mp4' }
    },
    {
        id: 'raytracer',
        title: 'Raytracer',
        description: {
            en: '3D rendering engine built from scratch. Computes lighting, shadows, and reflections by tracing light paths mathematically through a scene definition.',
            fr: "Moteur de rendu 3D codé de zéro. Calcule l'éclairage, les ombres et les reflets en traçant mathématiquement le chemin de la lumière à travers la définition d'une scène."
        },
        tags: ['C++', 'Graphics', 'Maths'],
        category: 'graphical',
        date: '2026-04',
        featured: true,
        github: 'https://github.com/Nexlein/Raytracer',
        media: {
            type: 'gallery',
            images: [
                { src: '/projects/raytracer/demo.webp', alt: 'Demo' },
                { src: '/projects/raytracer/fractals.webp', alt: 'Fractals' },
                { src: '/projects/raytracer/glassBall.webp', alt: 'Glass Ball' },
                { src: '/projects/raytracer/graphCylinder.webp', alt: 'Graph Cylinder' },
                { src: '/projects/raytracer/hourglass.webp', alt: 'Hourglass' },
                { src: '/projects/raytracer/iceCream.webp', alt: 'Ice Cream' },
                { src: '/projects/raytracer/mirror.webp', alt: 'Mirror Room' },
                { src: '/projects/raytracer/mobiusStrip.webp', alt: 'Mobius Strip' },
                { src: '/projects/raytracer/pointLight.webp', alt: 'Point Light' },
                { src: '/projects/raytracer/tangleCube.webp', alt: 'Tangle Cube' },
                { src: '/projects/raytracer/random.webp', alt: 'Random shapes' }
            ]
        }
    },
    {
        id: 'plazza',
        title: 'Plazza',
        description: {
            en: 'Multi-process, multi-threaded pizzeria simulation. Explores concurrent architectures, inter-process communication, and mutex coordination under load.',
            fr: 'Simulation de pizzeria multi-processus et multi-thread. Explore les architectures concurrentes, la communication inter-processus (IPC) et la coordination par mutex sous charge.'
        },
        tags: ['C++', 'Concurrency', 'IPC'],
        category: 'architecture',
        date: '2026-05',
        github: 'https://github.com/Nexlein/Plazza',
        media: { type: 'video', src: '/projects/plazza/plazza-optimized.mp4' }
    },
    {
        id: 'cvrie',
        title: 'Cvrie',
        description: {
            en: 'A comprehensive machine learning laboratory exploring both supervised and unsupervised learning algorithms, leveraging pandas, numpy, and scikit-learn.',
            fr: "Un laboratoire complet d'apprentissage automatique explorant des algorithmes supervisés et non supervisés, utilisant pandas, numpy et scikit-learn."
        },
        tags: ['Python', 'Machine Learning', 'Data Science'],
        category: 'ai',
        date: '2026-02',
        github: 'https://github.com/Nexlein/Cvrie',
        media: {
            type: 'image',
            src: '/projects/cvrie/cvrie.webp',
            alt: 'Abstract visualization of Machine Learning clusters and neural networks'
        }
    },
    {
        id: 'starttrek',
        title: 'StartTrek',
        description: {
            en: 'Reinforcement Learning agent trained using Deep Q-Networks (DQN) to safely land a lunar module. Features experience replay, target networks, and domain randomization.',
            fr: "Agent d'Apprentissage par Renforcement entraîné via Deep Q-Networks (DQN) pour atterrir un module lunaire en toute sécurité. Inclut le rejeu d'expérience et la randomisation de domaine."
        },
        tags: ['Python', 'PyTorch', 'RL', 'DQN'],
        category: 'ai',
        date: '2026-04',
        featured: true,
        github: 'https://github.com/Nexlein/StartTrek',
        media: { type: 'video', src: '/projects/starttrek/starttrek.mp4' }
    },
    {
        id: 'zappy',
        title: 'Zappy',
        description: {
            en: 'Multiplayer network game where teams of autonomous AI compete on a tile-based world. Built in C/C++ with a server, a graphic client, and autonomous clients driven by FSMs and Utility AI.',
            fr: "Jeu réseau multijoueur où des équipes d'IA autonomes s'affrontent. Développé en C/C++ avec un serveur, un client graphique et des clients autonomes pilotés par des machines à états (FSM) et de l'IA utilitaire."
        },
        tags: ['C/C++', 'Network', 'FSM', 'Utility AI', 'Game Dev'],
        category: 'architecture',
        date: '2026-05',
        github: 'https://github.com/Nexlein/Zappy',
        media: {
            type: 'video',
            src: '/projects/zappy/zappy.mp4'
        }
    },
    {
        id: 'persona',
        title: 'Persona',
        description: {
            en: 'Automated, self-hosted AI system delivering personalized news digests based on user topics and timezones. Built with N8N, Supabase, Mistral AI, and NewsAPI. Includes an interactive chatbot and dynamic Python credential mappers.',
            fr: "Système d'IA automatisé et auto-hébergé fournissant des résumés d'actualités personnalisés basés sur les fuseaux horaires des utilisateurs. Construit avec N8N, Supabase, Mistral AI et NewsAPI."
        },
        tags: ['N8N', 'Python', 'Mistral AI', 'Supabase', 'Docker'],
        category: 'ai',
        date: '2026-05',
        github: 'https://github.com/Nexlein/Persona',
        media: {
            type: 'image',
            src: '/projects/persona/persona.webp',
            alt: 'Abstract dataflow network representing an automated AI newsletter system'
        }
    },
    {
        id: 'codename',
        title: 'Codename',
        description: {
            en: 'A robust testing framework designed to evaluate and fortify Large Language Models against prompt injections and jailbreaks. Integrates adversarial prompting and defensive monitoring to ensure safe LLM deployments.',
            fr: 'Un framework de test robuste conçu pour évaluer et fortifier les modèles de langage (LLM) contre les injections de prompt et les jailbreaks. Intègre du prompting antagoniste pour sécuriser les déploiements.'
        },
        tags: ['Security', 'Python', 'LLM', 'Prompt Engineering'],
        category: 'ai',
        date: '2026-03',
        featured: true,
        github: 'https://github.com/Nexlein/Codename',
        media: {
            type: 'image',
            src: '/projects/codename/codename.webp',
            alt: 'Diagram illustrating a prompt input passing through an AI Security Firewall'
        }
    },
    {
        id: 'mymarvin',
        title: 'MyMarvin',
        description: {
            en: 'A complete CI/CD pipeline automation project based on Jenkins. Uses Docker, Groovy DSL, and Job DSL plugins to define and provision scalable build jobs automatically upon repository updates.',
            fr: "Projet complet d'automatisation de pipeline CI/CD basé sur Jenkins. Utilise Docker et Groovy DSL pour définir et provisionner dynamiquement des jobs de build."
        },
        tags: ['Jenkins', 'Docker', 'CI/CD', 'Groovy', 'YAML'],
        category: 'devops',
        date: '2026-03',
        github: 'https://github.com/Nexlein/MyMarvin',
        media: {
            type: 'image',
            src: '/projects/mymarvin/mymarvin.webp',
            alt: 'Architecture diagram showing Jenkins automation via Docker and JCasC'
        }
    },
    {
        id: 'octopus',
        title: 'Octopus',
        description: {
            en: 'An infrastructure-as-code automation project. Uses Ansible to provision, configure, and orchestrate complex environments across multiple remote hosts concurrently, ensuring idempotency and rapid scaling.',
            fr: "Projet d'automatisation Infrastructure-as-Code (IaC). Utilise Ansible pour provisionner, configurer et orchestrer des environnements complexes sur plusieurs hôtes distants de manière concurrente."
        },
        tags: ['Ansible', 'Vagrant', 'IaC', 'PostgreSQL', 'Redis'],
        category: 'devops',
        date: '2026-05',
        github: 'https://github.com/Nexlein/Octopus',
        media: {
            type: 'image',
            src: '/projects/octopus/octopus.webp',
            alt: 'Diagram showing Ansible automation deploying to multiple virtual machines'
        }
    },
    {
        id: 'nanotekspice',
        title: 'NanoTekSpice',
        description: {
            en: 'A logic gate simulator built in C++. Models digital electronic components (such as logic gates, clocks, and memory units) using pure Object-Oriented Programming principles.',
            fr: 'Un simulateur de portes logiques codé en C++. Modélise des composants électroniques numériques en utilisant les principes purs de la programmation orientée objet (OOP).'
        },
        tags: ['C++', 'OOP', 'Simulation', 'Algorithms', 'Architecture'],
        category: 'architecture',
        date: '2026-02',
        github: 'https://github.com/Nexlein/NanoTekSpice',
        media: {
            type: 'image',
            src: '/projects/nanotekspice/nanotekspice.webp',
            alt: 'Vibrant 3D glowing representation of a microchip and electronic circuit board'
        }
    },
    {
        id: 'myradar',
        title: 'MyRadar',
        description: {
            en: 'A 2D graphical air traffic control simulator built in C using CSFML. Simulates planes navigating between control towers with complex collision detection and sector-based grid optimization.',
            fr: "Un simulateur graphique 2D de contrôle aérien construit en C avec CSFML. Simule la navigation d'avions avec détection de collisions complexe et optimisation spatiale par secteurs."
        },
        tags: ['C', 'CSFML', 'Graphics', 'Simulation', 'Algorithms'],
        category: 'graphical',
        year: 'Tek1',
        date: '2025-03',
        github: 'https://github.com/Nexlein/Myradar',
        media: {
            type: 'video',
            src: '/projects/myradar/myradar.mp4'
        }
    },
    {
        id: 'tardis',
        title: 'Tardis',
        description: {
            en: 'Data analysis and visualization project culminating in a comprehensive dashboard. Focuses on data processing, statistical modeling, and extracting actionable insights from large datasets.',
            fr: "Projet d'analyse et de visualisation de données aboutissant à un tableau de bord complet. Se concentre sur le traitement des données, la modélisation statistique et l'extraction d'informations."
        },
        tags: ['Data Science', 'Analytics', 'Dashboard', 'Python'],
        category: 'ai',
        year: 'Tek1',
        date: '2025-06',
        github: 'https://github.com/Nexlein/Tardis',
        media: {
            type: 'image',
            src: '/projects/tardis/tardis.webp',
            alt: 'Screenshot of the Tardis data analytics dashboard'
        }
    },
    {
        id: 'mytop',
        title: 'MyTop',
        description: {
            en: 'A customized clone of the Unix top utility. Features real-time system monitoring, process listing, memory metrics, and CPU usage, built with C and the ncurses library.',
            fr: "Un clone sur mesure de l'utilitaire Unix top. Dispose d'une surveillance système en temps réel, de la liste des processus, et de l'utilisation CPU/RAM, développé en C avec ncurses."
        },
        tags: ['C', 'ncurses', 'Unix', 'System Programming', 'Terminal'],
        category: 'systems',
        year: 'Tek1',
        date: '2025-03',
        github: 'https://github.com/Nexlein/Mytop',
        media: {
            type: 'video',
            src: '/projects/mytop/mytop.mp4'
        }
    },
    {
        id: 'secured',
        title: 'Secured',
        description: {
            en: 'A robust C library implementing a highly efficient Hash Table data structure. Features custom cryptographic hashing functions and collision resolution strategies to ensure secure and fast data retrieval.',
            fr: 'Une bibliothèque C robuste implémentant une table de hachage hautement efficace. Comprend des fonctions de hachage personnalisées et des stratégies de résolution de collisions.'
        },
        tags: ['C', 'Data Structures', 'Algorithms', 'Security', 'Library'],
        category: 'systems',
        year: 'Tek1',
        date: '2025-03',
        github: 'https://github.com/Nexlein/Secured',
        media: {
            type: 'image',
            src: '/projects/secured/secured.webp',
            alt: 'Holographic 3D visualization of a hash table data structure and digital vault'
        }
    },
    {
        id: 'blackjack-ai',
        title: 'Blackjack AI',
        description: {
            en: 'A complete ecosystem using Deep Reinforcement Learning (Maskable PPO) to learn and visualize the mathematically optimal Blackjack strategy without any hardcoded rules.',
            fr: "Un écosystème complet utilisant l'Apprentissage par Renforcement Profond (Maskable PPO) pour apprendre et visualiser la stratégie optimale du Blackjack sans aucune règle codée en dur."
        },
        tags: ['Python', 'Reinforcement Learning', 'Stable-Baselines3', 'Textual', 'Gymnasium'],
        category: 'ai',
        year: 'Personal',
        date: '2026-07',
        github: 'https://github.com/Nexlein/blackjack-ai',
        media: {
            type: 'video',
            src: '/projects/blackjack-ai/blackjack-ai.mp4'
        }
    },
    {
        id: 'ai-racing',
        title: 'AI Racing',
        description: {
            en: 'A Reinforcement Learning agent built with Gymnasium, Pygame, and Stable Baselines3 (PPO) that learns to drive a car around a track using custom kinematic physics and raycast sensors.',
            fr: "Un agent d'Apprentissage par Renforcement construit avec Gymnasium, Pygame et Stable Baselines3 (PPO) qui apprend à conduire une voiture sur un circuit en utilisant une physique cinématique personnalisée et des capteurs à lancer de rayons."
        },
        tags: ['Python', 'Reinforcement Learning', 'Stable-Baselines3', 'Gymnasium', 'Pygame'],
        category: 'ai',
        year: 'Personal',
        date: '2026-08',
        github: 'https://github.com/Nexlein/AI-Racing',
        media: {
            type: 'video',
            src: '/projects/ai-racing/ai-racing.mp4'
        }
    }
];
