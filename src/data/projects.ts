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
    /** Who built it, from the repository's history: team size (1 = solo) and my own part. Project page. */
    team?: { size: number; role: Text };
    /** One concrete outcome the repository shows (tests, scores, features). Project page. */
    result?: Text;
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
            en: 'Modular gaming architecture. Games (Snake, Solarfox) and graphics backends (ncurses, SDL2, Allegro5) are shared libraries loaded at runtime and swapped without restarting.',
            fr: "Architecture de jeu modulaire : les jeux (Snake, Solarfox) et les moteurs graphiques (ncurses, SDL2, Allegro5) sont des bibliothèques partagées chargées à l'exécution et interchangeables sans redémarrer."
        },
        tags: ['C++', 'OOP', 'Dynamic Loading'],
        category: 'graphical',
        date: '2026-03',
        team: {
            size: 2,
            role: {
                en: 'The core: runtime loading and swapping of the .so modules, the shared interfaces, the menu, Snake, the ncurses display, CMake and CI (about 60% of the code).',
                fr: "Le cœur : chargement et bascule à chaud des modules .so, les interfaces communes, le menu, Snake, l'affichage ncurses, CMake et la CI (environ 60 % du code)."
            }
        },
        result: {
            en: 'Three graphics libraries (ncurses, SDL2, Allegro5) and two games (Snake, Solarfox), swapped while the program runs.',
            fr: "Trois bibliothèques graphiques (ncurses, SDL2, Allegro5) et deux jeux (Snake, Solarfox), interchangeables pendant l'exécution."
        },
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
        team: {
            size: 4,
            role: {
                en: 'The architecture: maths, camera, rays, renderer and the .so plugin system; half of the scene parser, the OBJ loader, textures, the sphere, CMake and CI (about 45% of the code).',
                fr: "L'architecture : maths, caméra, rayons, moteur de rendu et système de plugins .so ; la moitié du parseur de scènes, le chargeur OBJ, les textures, la sphère, CMake et la CI (environ 45 % du code)."
            }
        },
        result: {
            en: '15 primitives and 39 example scenes.',
            fr: "15 primitives et 39 scènes d'exemple."
        },
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
        team: {
            size: 3,
            role: {
                en: 'The kitchen processes and their FIFO-based IPC, the pizza model, the status command, idle kitchen shutdown, 50 of the 62 unit tests and the CI.',
                fr: 'Les processus cuisines et leur communication par FIFO, le modèle des pizzas, la commande status, la fermeture des cuisines inactives, 50 des 62 tests unitaires et la CI.'
            }
        },
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
        team: {
            size: 2,
            role: {
                en: 'Models (KNN, Random Forest, PCA, SVM) and how their results are shown, the data preparation (cleaning, filtering, normalization), and the whole unsupervised part with its NLP.',
                fr: "Des modèles (KNN, Random Forest, PCA, SVM) et l'affichage de leurs résultats, la préparation des données (nettoyage, filtrage, normalisation), et toute la partie non supervisée avec son NLP."
            }
        },
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
        team: {
            size: 3,
            role: {
                en: 'The DQN, written in PyTorch from scratch; the training, evaluation and baseline scripts, wind and seed randomisation, 95% confidence intervals, and the CI.',
                fr: "Le DQN, écrit en PyTorch de zéro ; les scripts d'entraînement, d'évaluation et de référence, la randomisation du vent et des graines, les intervalles de confiance à 95 %, et la CI."
            }
        },
        result: {
            en: 'Average reward of 191 ± 41 over 5 seeds (the environment counts 200 as solved).',
            fr: "Récompense moyenne de 191 ± 41 sur 5 graines (l'environnement considère 200 comme résolu)."
        },
        github: 'https://github.com/Nexlein/StartTrek',
        media: { type: 'video', src: '/projects/starttrek/starttrek.mp4' }
    },
    {
        id: 'zappy',
        title: 'Zappy',
        description: {
            en: 'Multiplayer network game where teams of autonomous AI compete on a tile-based world. A server and a graphic client in C/C++, and autonomous AI clients in Python driven by FSMs and Utility AI.',
            fr: "Jeu en réseau multijoueur où des équipes d'IA autonomes s'affrontent. Un serveur et un client graphique en C/C++, et des clients IA autonomes en Python pilotés par des machines à états (FSM) et une IA à utilité."
        },
        tags: ['C/C++', 'Python', 'Network', 'FSM', 'Utility AI', 'Game Dev'],
        category: 'architecture',
        date: '2026-05',
        team: {
            size: 5,
            role: {
                en: 'The whole Python AI client (three strategies) and 91 of its 121 tests, part of the graphic client (audio, HUD, skybox), and the four CI workflows.',
                fr: 'Tout le client IA en Python (trois stratégies) et 91 de ses 121 tests, une partie du client graphique (audio, HUD, skybox), et les quatre workflows de CI.'
            }
        },
        result: {
            en: '593 automated tests across the server, the graphic client and the AI client.',
            fr: '593 tests automatisés sur le serveur, le client graphique et le client IA.'
        },
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
        team: {
            size: 2,
            role: {
                en: 'The scripts that start n8n locally with our credentials, the Supabase setup, and some of the workflow tools.',
                fr: 'Les scripts qui lancent n8n en local avec nos identifiants, la mise en place de Supabase, et une partie des outils du workflow.'
            }
        },
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
        team: {
            size: 2,
            role: {
                en: 'Both of us wrote the attack prompt, the defense prompt and the tests together.',
                fr: "Nous avons écrit à deux le prompt d'attaque, le prompt de défense et les tests."
            }
        },
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
        team: {
            size: 2,
            role: {
                en: 'The bonus (a job for private repositories with gcovr coverage, and a second Jenkins instance), GitHub authentication for private repositories, and the CI.',
                fr: "Le bonus (un job pour dépôts privés avec couverture gcovr, et une seconde instance Jenkins), l'authentification GitHub pour les dépôts privés, et la CI."
            }
        },
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
        team: {
            size: 2,
            role: {
                en: 'The base, Redis and PostgreSQL roles, the poll, worker and service roles, and the firewall.',
                fr: 'Les rôles base, Redis et PostgreSQL, les rôles poll, worker et service, et le pare-feu.'
            }
        },
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
        tags: ['C++', 'OOP', 'Simulation', 'Algorithms'],
        category: 'architecture',
        date: '2026-02',
        team: {
            size: 2,
            role: {
                en: 'The 4094 and 4512 chips, and many smaller pieces around the simulator.',
                fr: 'Les puces 4094 et 4512, et beaucoup de petites pièces autour du simulateur.'
            }
        },
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
        id: 'tardis',
        title: 'Tardis',
        description: {
            en: 'Predicting train delays from historical SNCF data: cleaning the dataset, comparing three models (linear regression, decision tree, random forest) and presenting the results in an interactive dashboard.',
            fr: "Prédiction des retards de trains à partir de l'historique SNCF : nettoyage des données, comparaison de trois modèles (régression linéaire, arbre de décision, forêt aléatoire) et présentation des résultats dans un tableau de bord interactif."
        },
        tags: ['Data Science', 'Python'],
        category: 'ai',
        year: 'Tek1',
        date: '2025-06',
        team: {
            size: 3,
            role: {
                en: 'The prediction models (linear regression, decision tree, random forest), written from scratch, and the dataset cleaning.',
                fr: 'Les modèles de prédiction (régression linéaire, arbre de décision, forêt aléatoire), écrits de zéro, et le nettoyage des données.'
            }
        },
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
        id: 'blackjack-ai',
        title: 'Blackjack AI',
        description: {
            en: 'A Deep Reinforcement Learning agent (Maskable PPO) that learns to play Blackjack from the rules alone, with no strategy coded in, and a terminal interface to watch it play and evaluate it.',
            fr: "Un agent d'apprentissage par renforcement profond (Maskable PPO) qui apprend à jouer au blackjack à partir des seules règles, sans stratégie codée en dur, avec une interface terminal pour le regarder jouer et l'évaluer."
        },
        tags: ['Python', 'Reinforcement Learning', 'Stable-Baselines3', 'Textual', 'Gymnasium'],
        category: 'ai',
        year: 'Personal',
        date: '2026-07',
        team: {
            size: 1,
            role: {
                en: 'Everything: the game engine, the Gymnasium environment with action masking, training, evaluation and the terminal interface.',
                fr: "Tout : le moteur de jeu, l'environnement Gymnasium avec masquage des actions, l'entraînement, l'évaluation et l'interface terminal."
            }
        },
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
        team: {
            size: 1,
            role: {
                en: 'Everything: the Gymnasium environment, the physics and raycast sensors, PPO training, the Pygame viewer with MP4 export, and the CI.',
                fr: "Tout : l'environnement Gymnasium, la physique et les capteurs à lancer de rayons, l'entraînement PPO, le visualiseur Pygame avec export MP4, et la CI."
            }
        },
        github: 'https://github.com/Nexlein/AI-Racing',
        media: {
            type: 'video',
            src: '/projects/ai-racing/ai-racing.mp4'
        }
    },
    {
        id: 'portfolio',
        title: 'Portfolio',
        description: {
            en: 'This site. Vanilla TypeScript and Vite, every page prerendered in English and French at build time, a strict CSP, and 860+ unit tests plus Playwright browser tests on desktop and mobile in CI. The project map, the charts and the CV are all computed from the same two data files.',
            fr: 'Ce site. TypeScript sans framework et Vite, chaque page pré-rendue en anglais et en français au build, une CSP stricte, et plus de 860 tests unitaires plus des tests navigateur Playwright sur ordinateur et mobile en CI. La carte des projets, les graphiques et le CV sont tous calculés à partir des deux mêmes fichiers de données.'
        },
        tags: ['TypeScript', 'Vite', 'Vitest', 'Playwright', 'CI/CD'],
        category: 'architecture',
        year: 'Personal',
        date: '2026-07',
        team: {
            size: 1,
            role: {
                en: 'Everything: design, code, content, tests and CI.',
                fr: 'Tout : le design, le code, le contenu, les tests et la CI.'
            }
        },
        github: 'https://github.com/Nexlein/Portfolio',
        media: {
            type: 'gallery',
            images: [
                {
                    src: '/projects/portfolio/home.webp',
                    alt: {
                        en: 'Home page of the portfolio: the headline over a live simulation.',
                        fr: "Page d'accueil du portfolio : le titre sur une simulation en direct."
                    }
                },
                {
                    src: '/projects/portfolio/map.webp',
                    alt: {
                        en: 'The project map: projects as a network, linked where they share skills.',
                        fr: 'La carte des projets : un réseau où les projets se relient quand ils partagent des compétences.'
                    }
                },
                {
                    src: '/projects/portfolio/path.webp',
                    alt: {
                        en: 'The path chart: distinct skills over time, computed from the projects and jobs.',
                        fr: 'Le graphique du parcours : les compétences distinctes au fil du temps, calculées à partir des projets et des postes.'
                    }
                },
                {
                    src: '/projects/portfolio/cv.webp',
                    alt: {
                        en: 'The one-page CV, rendered from the same data as the site.',
                        fr: "Le CV d'une page, rendu à partir des mêmes données que le site."
                    }
                }
            ]
        }
    }
];
