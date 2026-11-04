import type { Text } from '../core/translate.ts';

/**
 * Single source of truth for all portfolio projects.
 * To add a project: append one ProjectEntry object to the array below.
 * Cards, the map, project pages, the sitemap and structured data are all generated from it.
 * Text fields hold every language ({ en, fr }).
 */

/** Project domains, in the order the map buttons and the charts list them. */
export const DOMAINS = ['ai', 'fullstack', 'systems', 'graphical', 'devops'] as const;
type ProjectCategory = (typeof DOMAINS)[number];

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
    year?: 'Tek1' | 'Tek2' | 'Tek3' | 'Personal';
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
        id: 'sensai',
        title: 'Sensai',
        description: {
            en: 'A local AI assistant on Ollama, written without any LLM framework. It answers from your documents and cites them, asks before writing a file, remembers facts from one session to the next and masks personal data.',
            fr: "Un assistant IA local sur Ollama, écrit sans framework LLM. Il répond à partir de vos documents en citant ses sources, demande avant d'écrire un fichier, se souvient d'une session à l'autre et masque les données personnelles."
        },
        tags: ['Python', 'LLM', 'RAG', 'Ollama', 'FastAPI', 'Textual'],
        category: 'ai',
        year: 'Tek3',
        date: '2026-09',
        featured: true,
        team: {
            size: 4,
            role: {
                en: 'The structured memory (remember, recall, forget), the first version of the RAG chunker, store and retriever, the first tool-calling loop, the file reading and listing tools, the five CI workflows, and the functional and live test suites.',
                fr: "La mémoire structurée (retenir, retrouver, oublier), la première version du découpage, du stockage et de la recherche du RAG, la première boucle d'appel d'outils, les outils de lecture et de listage de fichiers, les cinq workflows de CI, et les tests fonctionnels et en conditions réelles."
            }
        },
        result: {
            en: "1,406 automated tests run in CI, plus 63 that need a live model, with a 96% coverage floor (lines and branches). In the team's keyword-graded benchmark, document search lifts correct answers from 23% to 82% on 22 questions.",
            fr: "1 406 tests automatisés lancés en CI, plus 63 qui demandent un vrai modèle, avec une couverture minimale de 96 % (lignes et branches). Dans le benchmark de l'équipe, noté par mots-clés, la recherche dans les documents fait passer les bonnes réponses de 23 % à 82 % sur 22 questions."
        },
        github: 'https://github.com/Nexlein/Sensai',
        media: {
            type: 'image',
            src: '/projects/sensai/sensai.webp',
            alt: {
                en: "Sensai's README feature table, the team's RAG benchmark (correct answers from 23% to 82% on 22 questions, keyword-graded) and the pytest line: 1,469 tests collected.",
                fr: "Le tableau des fonctionnalités du README de Sensai, le benchmark RAG de l'équipe (de 23 % à 82 % de bonnes réponses sur 22 questions, noté par mots-clés) et la ligne de pytest : 1 469 tests collectés."
            }
        }
    },
    {
        id: 'bernstein',
        title: 'Bernstein',
        description: {
            en: 'Deploys a voting app supplied by the school (three services, plus Redis and PostgreSQL) to Kubernetes on Azure (AKS) with one command. On every pull request, CI checks that an update or a node drain does not interrupt the service.',
            fr: "Déploie en une commande une application de vote fournie par l'école (trois services, plus Redis et PostgreSQL) sur Kubernetes (AKS, Azure). À chaque pull request, la CI vérifie qu'une mise à jour ou le drain d'un nœud n'interrompt pas le service."
        },
        tags: ['Kubernetes', 'Azure', 'Docker', 'CI/CD', 'PostgreSQL', 'Redis'],
        category: 'devops',
        year: 'Tek3',
        date: '2026-10',
        featured: true,
        team: {
            size: 2,
            role: {
                en: 'Almost everything around the app: the Kubernetes manifests except Redis, Worker and Poll, network policies and autoscaling, the deploy script, the zero-downtime test, the CI pipeline, and most of the 36 decision records.',
                fr: "Presque tout autour de l'application : les manifestes Kubernetes sauf Redis, Worker et Poll, les règles réseau et l'autoscaling, le script de déploiement, le test de continuité de service, la CI, et la plupart des 36 décisions d'architecture documentées."
            }
        },
        result: {
            en: '0 errors out of 13,000 probe requests while Poll scaled from 2 to 6 pods, a node was drained and Poll scaled back down.',
            fr: "Aucune erreur sur 13 000 requêtes de contrôle pendant la montée de Poll de 2 à 6 pods, le drain d'un nœud et le retour à 2 pods."
        },
        github: 'https://github.com/Nexlein/Bernstein',
        media: {
            type: 'image',
            src: '/projects/bernstein/bernstein.webp',
            alt: {
                en: "Bernstein's architecture (Poll, Result, Redis, a Java worker, PostgreSQL) next to its zero-downtime results: 0 errors in 1,519 requests during a rollout and 0 in 1,002 during a node drain (kind in CI, first run), and 0 errors in 13,000 probe requests on AKS while Poll scaled from 2 to 6 pods and back.",
                fr: "L'architecture de Bernstein (Poll, Result, Redis, un worker Java, PostgreSQL) à côté de ses tests de continuité : 0 erreur sur 1 519 requêtes pendant une mise à jour et 0 sur 1 002 pendant le drain d'un nœud (kind en CI, premier passage), puis 0 erreur sur 13 000 requêtes de contrôle sur AKS pendant que Poll passait de 2 à 6 pods et revenait."
            }
        }
    },
    {
        id: 'dashboard',
        title: 'Dashboard',
        description: {
            en: 'A web dashboard you assemble yourself: link your accounts, place widgets (GitHub, weather, crypto, stocks, YouTube) on a drag-and-drop grid, and they refresh on their own.',
            fr: 'Un tableau de bord web à composer soi-même : on relie ses comptes, on place des widgets (GitHub, météo, crypto, bourse, YouTube) sur une grille en glisser-déposer, et ils se mettent à jour tout seuls.'
        },
        tags: ['TypeScript', 'React', 'Express', 'PostgreSQL', 'Redis', 'Playwright'],
        category: 'fullstack',
        year: 'Tek3',
        date: '2026-09',
        featured: true,
        team: {
            size: 2,
            role: {
                en: 'The backend core (database, authentication, three API replicas behind Nginx, Redis cache and rate limits), GDPR export and deletion, and, on the frontend, the grid, the widget editor and the accessibility settings.',
                fr: "Le cœur du backend (base de données, authentification, trois réplicas de l'API derrière Nginx, cache et limites de débit dans Redis), l'export et la suppression RGPD, et, côté interface, la grille, l'éditeur de widgets et les réglages d'accessibilité."
            }
        },
        result: {
            en: 'More than 400 automated tests with coverage floors enforced in CI, and a Lighthouse score of 98 for performance and 100 for accessibility, best practices and SEO.',
            fr: 'Plus de 400 tests automatisés avec des seuils de couverture exigés par la CI, et un score Lighthouse de 98 en performance et de 100 en accessibilité, bonnes pratiques et SEO.'
        },
        github: 'https://github.com/Nexlein/Dashboard',
        media: {
            type: 'gallery',
            images: [
                {
                    src: '/projects/dashboard/dashboard.webp',
                    alt: {
                        en: 'Dashboard in the light theme, on demo data: weather in Paris, a five-day forecast for Lyon, GitHub statistics for facebook/react, a BTC and ETH price chart and an AAPL, NVDA and MSFT stock chart.',
                        fr: "Le tableau de bord en thème clair, sur des données de démonstration : météo à Paris, prévisions sur cinq jours à Lyon, statistiques GitHub de facebook/react, cours du BTC et de l'ETH, cours boursiers d'AAPL, NVDA et MSFT."
                    }
                },
                {
                    src: '/projects/dashboard/dashboard-dark-fr.webp',
                    alt: {
                        en: 'The same dashboard in the dark theme, with the interface in French (demo data).',
                        fr: 'Le même tableau de bord en thème sombre, interface en français (données de démonstration).'
                    }
                },
                {
                    src: '/projects/dashboard/add-widget.webp',
                    alt: {
                        en: 'The add-widget dialog: Weather service, 5-Day Forecast widget, city Marseille, refreshed every 60 seconds (the minimum).',
                        fr: "La fenêtre d'ajout d'un widget : service Weather, widget 5-Day Forecast, ville de Marseille, mise à jour toutes les 60 secondes (le minimum)."
                    }
                },
                {
                    src: '/projects/dashboard/services.webp',
                    alt: {
                        en: 'The Services page on demo data: OpenWeather, CoinGecko and GitHub connected, Twelve Data waiting for an API key. Keys are checked and never shown again.',
                        fr: "La page Services, sur des données de démonstration : OpenWeather, CoinGecko et GitHub connectés, Twelve Data en attente d'une clé d'API. Les clés sont vérifiées et jamais réaffichées."
                    }
                },
                {
                    src: '/projects/dashboard/accessibility.webp',
                    alt: {
                        en: 'The accessibility settings: text size from 100% to 200%, animations, high contrast, underlined links, wider spacing and an easy-to-read font.',
                        fr: "Les réglages d'accessibilité : taille du texte de 100 % à 200 %, animations, contraste élevé, liens soulignés, espacement élargi et police facile à lire."
                    }
                },
                {
                    src: '/projects/dashboard/admin.webp',
                    alt: {
                        en: 'The administration page on demo accounts: 6 users, 2 administrators, 1 banned, a search by email and a table of roles, bans and sign-up dates.',
                        fr: "La page d'administration, sur des comptes de démonstration : 6 utilisateurs, 2 administrateurs, 1 banni, une recherche par e-mail et un tableau des rôles, bannissements et dates d'inscription."
                    }
                }
            ]
        }
    },
    {
        id: 'survivor',
        title: 'Survivor',
        description: {
            en: 'ProfilsActifs, a video job platform built in a two-week sprint: candidates post a short moderated video, recruiters browse a catalog and get in touch. GDPR compliance was part of the brief.',
            fr: "ProfilsActifs, une plateforme d'emploi par vidéo construite en un sprint de deux semaines : les candidats publient une courte vidéo modérée, les recruteurs parcourent un catalogue et les contactent. Le RGPD faisait partie du cahier des charges."
        },
        tags: ['TypeScript', 'Express', 'Prisma', 'PostgreSQL', 'Next.js', 'Whisper'],
        category: 'fullstack',
        year: 'Tek3',
        date: '2026-08',
        team: {
            size: 3,
            role: {
                en: 'The backend data model and demo data, the GDPR export and deletion routes, the age check before a profile is shown, the right to object, the video pipeline with automatic Whisper subtitles, and the deterministic catalog sort.',
                fr: "Le modèle de données et les données de démo du backend, les routes d'export et de suppression RGPD, la vérification de l'âge avant d'afficher un profil, le droit d'opposition, le pipeline vidéo avec sous-titres automatiques par Whisper, et le tri déterministe du catalogue."
            }
        },
        result: {
            en: '35 API endpoints documented in Swagger, with GDPR export and deletion, video moderation before publication and automatic Whisper subtitles.',
            fr: "35 routes d'API documentées dans Swagger, avec l'export et la suppression RGPD, la modération des vidéos avant publication et les sous-titres automatiques par Whisper."
        },
        github: 'https://github.com/Nexlein/Survivor-ProfilsActifs',
        media: {
            type: 'image',
            src: '/projects/survivor/survivor.webp',
            alt: {
                en: 'The data model of ProfilsActifs next to a load test of its catalogue: 550.8 to 638.1 requests per second after a composite index, 0 errors at 100 connections in one 10-second run, with the database-free health route as a reference (3,479.0 to 3,834.4).',
                fr: "Le modèle de données de ProfilsActifs à côté d'un test de charge du catalogue : de 550,8 à 638,1 requêtes par seconde après un index composite, sans erreur à 100 connexions sur un passage de 10 secondes, avec la route de santé, sans base de données, comme référence (de 3 479,0 à 3 834,4)."
            }
        }
    },
    {
        id: 'arcade',
        title: 'Arcade',
        description: {
            en: 'A software arcade: games and graphics libraries are plugins, swapped while it runs.',
            fr: "Une borne d'arcade logicielle : jeux et bibliothèques graphiques sont des plugins, échangeables à chaud."
        },
        tags: ['C++', 'Dynamic Loading', 'OOP', 'Game Dev'],
        category: 'graphical',
        date: '2026-03',
        team: {
            size: 2,
            role: {
                en: 'The core: runtime loading and swapping of the .so modules, the shared interfaces, the menu, Snake, the ncurses display, CMake and CI.',
                fr: "Le cœur : chargement et bascule à chaud des modules .so, les interfaces communes, le menu, Snake, l'affichage ncurses, CMake et la CI."
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
            en: 'A 3D renderer written from scratch in C++: it traces light rays through a scene described in a file to compute lighting, shadows and reflections.',
            fr: 'Un moteur de rendu 3D écrit de zéro en C++ : il suit les rayons lumineux dans une scène décrite par un fichier pour calculer éclairage, ombres et reflets.'
        },
        tags: ['C++', 'Graphics', 'Maths', 'Dynamic Loading'],
        category: 'graphical',
        date: '2026-04',
        team: {
            size: 4,
            role: {
                en: 'The architecture: math, camera, rays, renderer and the .so plugin system; half of the scene parser, the OBJ loader, textures, the sphere, CMake and CI.',
                fr: "L'architecture : maths, caméra, rayons, moteur de rendu et système de plugins .so ; la moitié du parseur de scènes, le chargeur OBJ, les textures, la sphère, CMake et la CI."
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
                { src: '/projects/raytracer/demo.webp', alt: { en: 'Demo scene', fr: 'Scène de démo' } },
                { src: '/projects/raytracer/fractals.webp', alt: { en: 'Fractals', fr: 'Fractales' } },
                { src: '/projects/raytracer/glassBall.webp', alt: { en: 'Glass ball', fr: 'Boule de verre' } },
                { src: '/projects/raytracer/graphCylinder.webp', alt: { en: 'Graph cylinder', fr: 'Cylindre graphe' } },
                { src: '/projects/raytracer/hourglass.webp', alt: { en: 'Hourglass', fr: 'Sablier' } },
                { src: '/projects/raytracer/iceCream.webp', alt: { en: 'Ice cream', fr: 'Glace' } },
                { src: '/projects/raytracer/mirror.webp', alt: { en: 'Mirror room', fr: 'Salle des miroirs' } },
                { src: '/projects/raytracer/mobiusStrip.webp', alt: { en: 'Möbius strip', fr: 'Ruban de Möbius' } },
                { src: '/projects/raytracer/pointLight.webp', alt: { en: 'Point light', fr: 'Lumière ponctuelle' } },
                { src: '/projects/raytracer/tangleCube.webp', alt: { en: 'Tangle cube', fr: 'Cube entrelacé' } },
                { src: '/projects/raytracer/random.webp', alt: { en: 'Random shapes', fr: 'Formes aléatoires' } }
            ]
        }
    },
    {
        id: 'plazza',
        title: 'Plazza',
        description: {
            en: 'A pizzeria simulation in C++ where each kitchen is a process and each cook a thread; orders reach the kitchens over named pipes.',
            fr: 'Une simulation de pizzeria en C++ où chaque cuisine est un processus et chaque cuisinier un thread ; les commandes arrivent aux cuisines par tubes nommés.'
        },
        tags: ['C++', 'Concurrency', 'IPC'],
        category: 'systems',
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
            en: 'Two machine learning tasks: classifying X-rays by body part and clustering 1,010 written symptom descriptions.',
            fr: "Deux tâches d'apprentissage automatique : classer des radiographies par partie du corps et regrouper 1 010 descriptions de symptômes."
        },
        tags: ['Python', 'Machine Learning', 'Data Science', 'scikit-learn', 'NLP'],
        category: 'ai',
        date: '2026-02',
        team: {
            size: 2,
            role: {
                en: 'The KNN, Random Forest and PCA + SVM models and their result displays, the data preparation (cleaning, filtering, normalization) and the whole unsupervised NLP part.',
                fr: "Les modèles KNN, Random Forest et PCA + SVM et l'affichage de leurs résultats, la préparation des données (nettoyage, filtrage, normalisation) et toute la partie non supervisée, NLP compris."
            }
        },
        result: {
            en: 'About 99% test accuracy; all five saved models classify the 20 sample X-rays correctly.',
            fr: "Environ 99 % de bonnes classifications en test ; les cinq modèles sauvegardés classent correctement les 20 radiographies d'exemple."
        },
        github: 'https://github.com/Nexlein/Cvrie',
        media: {
            type: 'image',
            src: '/projects/cvrie/cvrie.webp',
            alt: {
                en: "Real X-ray samples from Cvrie's dataset (chest, head, hand, foot) with their 64×64 model inputs, the saved MLP's training loss and validation accuracy curves, and a terminal showing all five saved models classifying the 20 repo samples correctly.",
                fr: 'Radiographies réelles du jeu de données de Cvrie (thorax, tête, main, pied) avec leur version 64×64 donnée au modèle, les courbes de perte et de taux de réussite en validation du MLP sauvegardé, et un terminal où les cinq modèles sauvegardés classent correctement les 20 échantillons du dépôt.'
            }
        }
    },
    {
        id: 'starttrek',
        title: 'StartTrek',
        description: {
            en: 'A reinforcement learning agent (DQN) that learns to land a lunar module, trained with experience replay, a target network and random wind.',
            fr: "Un agent d'apprentissage par renforcement (DQN) qui apprend à poser un module lunaire, entraîné avec rejeu d'expérience, réseau cible et vent aléatoire."
        },
        tags: ['Python', 'PyTorch', 'RL', 'DQN'],
        category: 'ai',
        date: '2026-04',
        team: {
            size: 3,
            role: {
                en: 'The DQN, written in PyTorch from scratch; the training, evaluation and baseline scripts, random wind and seeds, 95% confidence intervals, and the CI.',
                fr: "Le DQN, écrit de zéro en PyTorch ; les scripts d'entraînement, d'évaluation et de référence, le vent et les graines aléatoires, les intervalles de confiance à 95 %, et la CI."
            }
        },
        result: {
            en: 'Average reward of 191 ± 41 (95% CI) over 5 seeds; the environment counts 200 as solved.',
            fr: "Récompense moyenne de 191 ± 41 (IC à 95 %) sur 5 graines aléatoires ; l'environnement est considéré comme résolu à 200."
        },
        github: 'https://github.com/Nexlein/StartTrek',
        media: { type: 'video', src: '/projects/starttrek/starttrek.mp4' }
    },
    {
        id: 'zappy',
        title: 'Zappy',
        description: {
            en: 'A multiplayer network game where teams of AI players compete on a tile map: a server and a graphical client in C/C++, and Python AI clients run by state machines and utility AI.',
            fr: "Un jeu en réseau où des équipes d'IA s'affrontent sur une carte en tuiles : un serveur et un client graphique en C/C++, et des clients IA en Python pilotés par des machines à états et une IA basée sur l'utilité."
        },
        tags: ['C/C++', 'Python', 'Network', 'FSM', 'Utility AI', 'Game Dev'],
        category: 'systems',
        date: '2026-05',
        team: {
            size: 5,
            role: {
                en: 'The whole Python AI client (three strategies) and 91 of its 121 tests, part of the graphical client (audio, HUD, skybox), and the four CI workflows.',
                fr: 'Tout le client IA en Python (trois stratégies) et 91 de ses 121 tests, une partie du client graphique (audio, HUD, skybox), et les quatre workflows de CI.'
            }
        },
        result: {
            en: '593 automated tests across the server, the graphical client and the AI client.',
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
            en: 'Self-hosted n8n workflows that email each user a news digest on their topics at their local time, and a Mistral chatbot with eight tools.',
            fr: "Des workflows n8n auto-hébergés qui envoient à chaque utilisateur un résumé d'actualités sur ses sujets, à son heure locale, et un chatbot Mistral doté de huit outils."
        },
        tags: ['n8n', 'LLM', 'Mistral AI', 'Supabase', 'Python', 'Docker'],
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
            en: 'A prompt-injection lab: an attack prompt, a hardened system prompt for a local Ollama model, and a 39-case script that checks whether the secret leaks.',
            fr: "Un laboratoire d'injection de prompt : un prompt d'attaque, un prompt système durci pour un modèle Ollama local, et un script de 39 cas qui vérifie si le secret fuit."
        },
        tags: ['Security', 'LLM', 'Prompt Engineering', 'Ollama', 'Bash'],
        category: 'ai',
        date: '2026-03',
        team: {
            size: 2,
            role: {
                en: 'Everything, as a pair: the attack prompt, the defense prompt and the tests.',
                fr: "Tout, à deux : le prompt d'attaque, le prompt de défense et les tests."
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
            en: 'Jenkins set up entirely as code (Docker, JCasC, Job DSL): a seed job creates a build job for any GitHub repository, which reruns its tests on every change.',
            fr: "Jenkins entièrement décrit en code (Docker, JCasC, Job DSL) : un job seed crée un job de build pour n'importe quel dépôt GitHub, qui relance ses tests à chaque changement."
        },
        tags: ['Jenkins', 'Docker', 'CI/CD', 'Groovy', 'YAML'],
        category: 'devops',
        date: '2026-03',
        team: {
            size: 2,
            role: {
                en: 'Private repository support (GitHub authentication, a job with gcovr coverage), a second Jenkins instance, and the CI.',
                fr: 'La prise en charge des dépôts privés (authentification GitHub, job avec couverture gcovr), une seconde instance Jenkins, et la CI.'
            }
        },
        github: 'https://github.com/Nexlein/MyMarvin',
        media: {
            type: 'image',
            src: '/projects/mymarvin/mymarvin.webp',
            alt: {
                en: 'Diagram of the MyMarvin Jenkins setup, from the Dockerfile through the my_marvin.yml configuration-as-code file to the SEED job that generates a build job for any GitHub repository, next to an excerpt of the Groovy Job DSL template.',
                fr: "Schéma de l'installation Jenkins de MyMarvin, du Dockerfile au job SEED qui génère un job de build pour n'importe quel dépôt GitHub, en passant par la configuration my_marvin.yml (JCasC), à côté d'un extrait du modèle Job DSL en Groovy."
            }
        }
    },
    {
        id: 'octopus',
        title: 'Octopus',
        description: {
            en: 'An Ansible playbook (7 plays, 56 idempotent tasks) that deploys a voting app supplied by the school, with Redis and PostgreSQL on separate hosts, behind a firewall that opens only the needed ports.',
            fr: "Un playbook Ansible (7 plays, 56 tâches idempotentes) qui déploie une application de vote fournie par l'école, avec Redis et PostgreSQL sur des hôtes séparés, derrière un pare-feu qui n'ouvre que les ports nécessaires."
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
            en: 'A digital circuit simulator in C++: it reads a circuit file and simulates logic gates, clocks and 4000-series chips.',
            fr: 'Un simulateur de circuits numériques en C++ : il lit un fichier de circuit et simule portes logiques, horloges et puces de la série 4000.'
        },
        tags: ['C++', 'OOP', 'Simulation'],
        category: 'systems',
        date: '2026-02',
        team: {
            size: 2,
            role: {
                en: 'The 4094 and 4512 chips, plus smaller parts of the simulator.',
                fr: "Les puces 4094 et 4512, et d'autres éléments plus petits du simulateur."
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
            en: 'Predicting French train delays from SNCF history: data cleaning, three models compared, and an interactive dashboard of the results.',
            fr: "Prédire les retards de trains à partir de l'historique SNCF : nettoyage des données, comparaison de trois modèles et tableau de bord interactif des résultats."
        },
        tags: ['Python', 'Data Science', 'Machine Learning'],
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
            en: 'A reinforcement learning agent (Maskable PPO) that learns Blackjack from the rules alone, with a terminal interface to watch it play.',
            fr: "Un agent d'apprentissage par renforcement (Maskable PPO) qui apprend le blackjack à partir des seules règles, avec une interface en terminal pour le regarder jouer."
        },
        tags: ['Python', 'Reinforcement Learning', 'Stable-Baselines3', 'Textual', 'Gymnasium'],
        category: 'ai',
        year: 'Personal',
        date: '2026-07',
        team: {
            size: 1,
            role: {
                en: 'Everything: the game engine, the Gymnasium environment with action masking, training, evaluation and the terminal interface.',
                fr: "Tout : le moteur de jeu, l'environnement Gymnasium avec masquage des actions, l'entraînement, l'évaluation et l'interface en terminal."
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
            en: 'A reinforcement learning agent (PPO) that learns to drive around a track, with custom car physics and raycast sensors.',
            fr: "Un agent d'apprentissage par renforcement (PPO) qui apprend à faire le tour d'un circuit, avec une physique de voiture sur mesure et des capteurs à lancer de rayons."
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
            en: 'This site, in vanilla TypeScript: every page prerendered in English and French, with the map, charts and CV computed from two data files.',
            fr: 'Ce site, en TypeScript sans framework : chaque page pré-rendue en anglais et en français, avec la carte, les graphiques et le CV calculés à partir de deux fichiers de données.'
        },
        tags: ['TypeScript', 'Vite', 'Vitest', 'Playwright', 'CI/CD'],
        category: 'fullstack',
        year: 'Personal',
        date: '2026-07',
        team: {
            size: 1,
            role: {
                en: 'Everything: design, code, content, tests and CI.',
                fr: 'Tout : le design, le code, le contenu, les tests et la CI.'
            }
        },
        result: {
            en: 'More than 900 unit tests, plus Playwright tests on desktop and mobile, run in CI on every change.',
            fr: 'Plus de 900 tests unitaires, et des tests Playwright sur ordinateur et mobile, lancés en CI à chaque changement.'
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
