import type { Text } from '../core/translate.ts';

/**
 * Single source of truth for all portfolio projects.
 * To add a project: append one ProjectEntry object to the array below.
 * Cards, the map, project pages, the sitemap and structured data are all generated from it.
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
    alt: Text;
}

interface ProjectMediaGallery {
    type: 'gallery';
    images: { src: string; alt: Text }[];
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
            fr: "Architecture de jeu modulaire : les jeux (Pacman, Nibbler) et les moteurs graphiques (SDL2, SFML, ncurses) se chargent dynamiquement à l'exécution, sous forme de bibliothèques partagées."
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
            fr: "Moteur de rendu 3D codé de zéro. Il calcule l'éclairage, les ombres et les reflets en suivant mathématiquement le trajet de la lumière dans la scène décrite."
        },
        tags: ['C++', 'Graphics', 'Maths'],
        category: 'graphical',
        date: '2026-04',
        featured: true,
        github: 'https://github.com/Nexlein/Raytracer',
        media: {
            type: 'gallery',
            images: [
                { src: '/projects/raytracer/demo.webp', alt: { en: 'Demo', fr: 'Démo' } },
                { src: '/projects/raytracer/fractals.webp', alt: { en: 'Fractals', fr: 'Fractales' } },
                { src: '/projects/raytracer/glassBall.webp', alt: { en: 'Glass Ball', fr: 'Boule de verre' } },
                { src: '/projects/raytracer/graphCylinder.webp', alt: { en: 'Graph Cylinder', fr: 'Cylindre graphe' } },
                { src: '/projects/raytracer/hourglass.webp', alt: { en: 'Hourglass', fr: 'Sablier' } },
                { src: '/projects/raytracer/iceCream.webp', alt: { en: 'Ice Cream', fr: 'Glace' } },
                { src: '/projects/raytracer/mirror.webp', alt: { en: 'Mirror Room', fr: 'Salle des miroirs' } },
                { src: '/projects/raytracer/mobiusStrip.webp', alt: { en: 'Mobius Strip', fr: 'Ruban de Möbius' } },
                { src: '/projects/raytracer/pointLight.webp', alt: { en: 'Point Light', fr: 'Lumière ponctuelle' } },
                { src: '/projects/raytracer/tangleCube.webp', alt: { en: 'Tangle Cube', fr: 'Cube entrelacé' } },
                { src: '/projects/raytracer/random.webp', alt: { en: 'Random shapes', fr: 'Formes aléatoires' } }
            ]
        }
    },
    {
        id: 'plazza',
        title: 'Plazza',
        description: {
            en: 'Multi-process, multi-threaded pizzeria simulation. Explores concurrent architectures, inter-process communication, and mutex coordination under load.',
            fr: "Simulation d'une pizzeria multi-processus et multi-thread, pour explorer les architectures concurrentes, la communication inter-processus (IPC) et la synchronisation par mutex sous charge."
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
            en: 'Machine learning in two parts. Supervised: X-ray body-part classification (chest, head, hand, foot) with Random Forest, PCA + SVM and an MLP tuned by grid search, about 99% test accuracy. Unsupervised: clustering 1,010 written symptom descriptions with TF-IDF, sentence embeddings, UMAP, K-Means and HDBSCAN.',
            fr: 'Apprentissage automatique en deux parties. Supervisé : classification de radiographies par partie du corps (thorax, tête, main, pied) avec Random Forest, PCA + SVM et un MLP réglé par grid search, environ 99 % de précision en test. Non supervisé : regroupement de 1 010 descriptions de symptômes avec TF-IDF, embeddings de phrases, UMAP, K-Means et HDBSCAN.'
        },
        tags: ['Python', 'Machine Learning', 'Data Science', 'scikit-learn', 'NLP'],
        category: 'ai',
        date: '2026-02',
        github: 'https://github.com/Nexlein/Cvrie',
        media: {
            type: 'image',
            src: '/projects/cvrie/cvrie.webp',
            alt: {
                en: "Real X-ray samples from Cvrie's dataset (chest, head, hand, foot) with their 64×64 model inputs, the saved MLP's training loss and validation accuracy curves, and a terminal showing all five saved models classifying the 20 repo samples correctly.",
                fr: 'Radiographies réelles du jeu de données de Cvrie (thorax, tête, main, pied) avec leur version 64×64 donnée au modèle, les courbes de perte et de précision de validation du MLP sauvegardé, et un terminal où les cinq modèles sauvegardés classent correctement les 20 échantillons du dépôt.'
            }
        }
    },
    {
        id: 'starttrek',
        title: 'StartTrek',
        description: {
            en: 'Reinforcement Learning agent trained using Deep Q-Networks (DQN) to safely land a lunar module. Features experience replay, target networks, and domain randomization.',
            fr: "Agent d'apprentissage par renforcement entraîné via Deep Q-Networks (DQN) pour faire atterrir un module lunaire sans encombre. Inclut le rejeu d'expérience, des réseaux cibles et la randomisation de domaine."
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
            fr: "Jeu en réseau multijoueur où des équipes d'IA autonomes s'affrontent. Développé en C/C++ avec un serveur, un client graphique et des clients autonomes pilotés par des machines à états (FSM) et une IA à utilité."
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
            fr: "Système d'IA automatisé et auto-hébergé qui envoie des résumés d'actualités personnalisés, selon les sujets et le fuseau horaire de chaque utilisateur. Construit avec N8N, Supabase, Mistral AI et NewsAPI. Inclut un chatbot interactif et des mappeurs d'identifiants dynamiques en Python."
        },
        tags: ['N8N', 'Python', 'Mistral AI', 'Supabase', 'Docker'],
        category: 'ai',
        date: '2026-05',
        github: 'https://github.com/Nexlein/Persona',
        media: {
            type: 'image',
            src: '/projects/persona/persona.webp',
            alt: {
                en: "Persona's two real n8n workflows: an hourly news pipeline that loops over users and topics, has a Mistral agent build a NewsAPI query and emails the articles, and a chatbot agent wired to Mistral, a memory buffer and eight Supabase and code tools.",
                fr: 'Les deux workflows n8n réels de Persona : un pipeline horaire qui parcourt utilisateurs et sujets, fait construire une requête NewsAPI par un agent Mistral et envoie les articles par e-mail, et un agent conversationnel relié à Mistral, à une mémoire et à huit outils Supabase et code.'
            }
        }
    },
    {
        id: 'codename',
        title: 'Codename',
        description: {
            en: 'A prompt-injection lab: an attack prompt, a hardened system prompt for a local Ollama model, and a 39-case audit script in 9 attack families (role play, exfiltration tricks, multilingual, near-miss passwords...) that checks whether the secret leaks.',
            fr: "Un laboratoire d'injection de prompt : un prompt d'attaque, un prompt système durci pour un modèle Ollama local, et un script d'audit de 39 cas en 9 familles d'attaques (jeu de rôle, exfiltration, multilingue, mots de passe presque exacts...) qui vérifie si le secret fuit."
        },
        tags: ['Security', 'LLM', 'Prompt Engineering', 'Ollama', 'Bash'],
        category: 'ai',
        date: '2026-03',
        featured: true,
        github: 'https://github.com/Nexlein/Codename',
        media: {
            type: 'image',
            src: '/projects/codename/codename.webp',
            alt: {
                en: "Codename's real attack prompt and hardened defense prompt side by side, above the nine attack families of its 39-case audit script.",
                fr: "Le vrai prompt d'attaque et le prompt de défense durci de Codename côte à côte, au-dessus des neuf familles d'attaques de son script d'audit de 39 cas."
            }
        }
    },
    {
        id: 'mymarvin',
        title: 'MyMarvin',
        description: {
            en: 'Jenkins configured entirely as code (Docker, JCasC, Job DSL): users and roles are set at boot, and a seed job generates a build job for any GitHub repository, which then rebuilds and runs the tests whenever the repository changes.',
            fr: "Jenkins entièrement configuré as code (Docker, JCasC, Job DSL) : utilisateurs et rôles définis au démarrage, et un job seed qui génère un job de build pour n'importe quel dépôt GitHub, lequel recompile et relance les tests à chaque changement du dépôt."
        },
        tags: ['Jenkins', 'Docker', 'CI/CD', 'Groovy', 'YAML'],
        category: 'devops',
        date: '2026-03',
        github: 'https://github.com/Nexlein/MyMarvin',
        media: {
            type: 'image',
            src: '/projects/mymarvin/mymarvin.webp',
            alt: {
                en: 'Diagram of the MyMarvin Jenkins setup, from the Dockerfile through the my_marvin.yml configuration-as-code file to the SEED job that generates a build job for any GitHub repository, next to an excerpt of the Groovy Job DSL template.',
                fr: "Schéma de l'installation Jenkins de MyMarvin, du Dockerfile au fichier de configuration as code my_marvin.yml jusqu'au job SEED qui génère un job de build pour n'importe quel dépôt GitHub, à côté d'un extrait du modèle Job DSL en Groovy."
            }
        }
    },
    {
        id: 'octopus',
        title: 'Octopus',
        description: {
            en: 'Infrastructure as code with Ansible: 7 plays and 56 idempotent tasks deploy a voting app (Python poll, Java worker, Node.js result) with Redis and PostgreSQL on separate host groups, behind a ufw firewall that opens only the ports each service needs.',
            fr: "Infrastructure as code avec Ansible : 7 plays et 56 tâches idempotentes déploient une application de vote (poll en Python, worker en Java, result en Node.js) avec Redis et PostgreSQL sur des groupes d'hôtes séparés, derrière un pare-feu ufw qui n'ouvre que les ports nécessaires."
        },
        tags: ['Ansible', 'IaC', 'PostgreSQL', 'Redis', 'Linux'],
        category: 'devops',
        date: '2026-05',
        github: 'https://github.com/Nexlein/Octopus',
        media: {
            type: 'image',
            src: '/projects/octopus/octopus.webp',
            alt: {
                en: 'Terminal listing the seven plays and their tasks from the Octopus Ansible playbook, next to a diagram of the poll, result, worker, Redis and PostgreSQL roles and the ports the firewall opens between them.',
                fr: "Terminal listant les sept plays du playbook Ansible d'Octopus et leurs tâches, à côté d'un schéma des rôles poll, result, worker, Redis et PostgreSQL et des ports que le pare-feu ouvre entre eux."
            }
        }
    },
    {
        id: 'nanotekspice',
        title: 'NanoTekSpice',
        description: {
            en: 'A logic gate simulator built in C++. Models digital electronic components (such as logic gates, clocks, and memory units) using pure Object-Oriented Programming principles.',
            fr: 'Un simulateur de circuits logiques codé en C++. Il modélise des composants électroniques numériques (portes logiques, horloges, mémoires) avec les principes de la programmation orientée objet (POO).'
        },
        tags: ['C++', 'OOP', 'Simulation', 'Algorithms', 'Architecture'],
        category: 'architecture',
        date: '2026-02',
        github: 'https://github.com/Nexlein/NanoTekSpice',
        media: {
            type: 'image',
            src: '/projects/nanotekspice/nanotekspice.webp',
            alt: {
                en: 'A NanoTekSpice circuit file wiring a clock and a reset input to a 4040 binary counter, next to a real simulator session where the outputs count up to 3 and return to 0 after reset.',
                fr: "Un fichier de circuit NanoTekSpice reliant une horloge et une entrée de remise à zéro à un compteur binaire 4040, à côté d'une vraie session du simulateur où les sorties comptent jusqu'à 3 puis reviennent à 0 après la remise à zéro."
            }
        }
    },
    {
        id: 'myradar',
        title: 'MyRadar',
        description: {
            en: 'A 2D graphical air traffic control simulator built in C using CSFML. Simulates planes navigating between control towers with complex collision detection and sector-based grid optimization.',
            fr: "Un simulateur graphique 2D de contrôle aérien construit en C avec CSFML. Simule la navigation d'avions, avec une détection de collisions poussée et une optimisation spatiale par secteurs."
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
            fr: "Projet d'analyse et de visualisation de données aboutissant à un tableau de bord complet. Il couvre le traitement des données, la modélisation statistique et l'extraction d'informations."
        },
        tags: ['Data Science', 'Analytics', 'Dashboard', 'Python'],
        category: 'ai',
        year: 'Tek1',
        date: '2025-06',
        github: 'https://github.com/Nexlein/Tardis',
        media: {
            type: 'image',
            src: '/projects/tardis/tardis.webp',
            alt: {
                en: 'Screenshot of the Tardis data analytics dashboard',
                fr: "Capture d'écran du tableau de bord d'analyse de données Tardis"
            }
        }
    },
    {
        id: 'mytop',
        title: 'MyTop',
        description: {
            en: 'A customized clone of the Unix top utility. Features real-time system monitoring, process listing, memory metrics, and CPU usage, built with C and the ncurses library.',
            fr: "Un clone sur mesure de l'utilitaire Unix top. Surveille le système en temps réel : liste des processus, utilisation du CPU et de la RAM. Développé en C avec ncurses."
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
            en: 'A C library implementing a hash table: a custom hash function, separate chaining (a linked list per bucket), and 36 unit tests.',
            fr: 'Une bibliothèque C qui implémente une table de hachage : une fonction de hachage maison, le chaînage séparé (une liste chaînée par case) et 36 tests unitaires.'
        },
        tags: ['C', 'Data Structures', 'Algorithms', 'Security', 'Library'],
        category: 'systems',
        year: 'Tek1',
        date: '2025-03',
        github: 'https://github.com/Nexlein/Secured',
        media: {
            type: 'image',
            src: '/projects/secured/secured.webp',
            alt: {
                en: 'Terminal output of a demo of the Secured C hash table library: eight entries dumped across eight buckets, searches, a deletion and the table dumped again, above a unit-test summary of 36 out of 36 passing.',
                fr: "Sortie terminal d'une démo de la bibliothèque de table de hachage Secured en C : huit entrées réparties dans huit cases, des recherches, une suppression puis un nouvel affichage de la table, au-dessus d'un résumé de 36 tests unitaires sur 36 réussis."
            }
        }
    },
    {
        id: 'blackjack-ai',
        title: 'Blackjack AI',
        description: {
            en: 'A complete ecosystem using Deep Reinforcement Learning (Maskable PPO) to learn and visualize the mathematically optimal Blackjack strategy without any hardcoded rules.',
            fr: "Un écosystème complet d'apprentissage par renforcement profond (Maskable PPO) qui apprend et visualise la stratégie optimale du blackjack, sans aucune règle codée en dur."
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
            fr: "Un agent d'apprentissage par renforcement (PPO), construit avec Gymnasium, Pygame et Stable Baselines3, qui apprend à conduire une voiture sur un circuit. Il s'appuie sur une physique cinématique sur mesure et des capteurs à lancer de rayons."
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
