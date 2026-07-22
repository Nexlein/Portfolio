export const fr = {
    projects_desc: {
        arcade: `Architecture de jeu modulaire. Charge dynamiquement des bibliothèques de jeux (Pacman, Nibbler) et des moteurs graphiques (SDL2, SFML, ncurses) à l'exécution via des objets partagés.`,
        raytracer: `Moteur de rendu 3D codé de zéro. Calcule l'éclairage, les ombres et les reflets en traçant mathématiquement le chemin de la lumière à travers la définition d'une scène.`,
        plazza: `Simulation de pizzeria multi-processus et multi-thread. Explore les architectures concurrentes, la communication inter-processus (IPC) et la coordination par mutex sous charge.`,
        cvrie: `Un laboratoire complet d'apprentissage automatique explorant des algorithmes supervisés et non supervisés, utilisant pandas, numpy et scikit-learn.`,
        starttrek: `Agent d'Apprentissage par Renforcement entraîné via Deep Q-Networks (DQN) pour atterrir un module lunaire en toute sécurité. Inclut le rejeu d'expérience et la randomisation de domaine.`,
        zappy: `Jeu réseau multijoueur où des équipes d'IA autonomes s'affrontent. Développé en C/C++ avec un serveur, un client graphique et des clients autonomes pilotés par des machines à états (FSM) et de l'IA utilitaire.`,
        persona: `Système d'IA automatisé et auto-hébergé fournissant des résumés d'actualités personnalisés basés sur les fuseaux horaires des utilisateurs. Construit avec N8N, Supabase, Mistral AI et NewsAPI.`,
        codename: `Un framework de test robuste conçu pour évaluer et fortifier les modèles de langage (LLM) contre les injections de prompt et les jailbreaks. Intègre du prompting antagoniste pour sécuriser les déploiements.`,
        mymarvin: `Projet complet d'automatisation de pipeline CI/CD basé sur Jenkins. Utilise Docker et Groovy DSL pour définir et provisionner dynamiquement des jobs de build.`,
        octopus: `Projet d'automatisation Infrastructure-as-Code (IaC). Utilise Ansible pour provisionner, configurer et orchestrer des environnements complexes sur plusieurs hôtes distants de manière concurrente.`,
        nanotekspice: `Un simulateur de portes logiques codé en C++. Modélise des composants électroniques numériques en utilisant les principes purs de la programmation orientée objet (OOP).`,
        myradar: `Un simulateur graphique 2D de contrôle aérien construit en C avec CSFML. Simule la navigation d'avions avec détection de collisions complexe et optimisation spatiale par secteurs.`,
        tardis: `Projet d'analyse et de visualisation de données aboutissant à un tableau de bord complet. Se concentre sur le traitement des données, la modélisation statistique et l'extraction d'informations.`,
        mytop: `Un clone sur mesure de l'utilitaire Unix top. Dispose d'une surveillance système en temps réel, de la liste des processus, et de l'utilisation CPU/RAM, développé en C avec ncurses.`,
        secured: `Une bibliothèque C robuste implémentant une table de hachage hautement efficace. Comprend des fonctions de hachage personnalisées et des stratégies de résolution de collisions.`,
        'blackjack-ai': `Un écosystème complet utilisant l'Apprentissage par Renforcement Profond (Maskable PPO) pour apprendre et visualiser la stratégie optimale du Blackjack sans aucune règle codée en dur.`
    },

    navbar: {
        home: 'Accueil',
        journey: 'Parcours',
        projects: 'Projets',
        availability: 'Disponibilité',
        contact: 'Contact',
        email: 'Email Me',
        linkedin: 'LinkedIn'
    },
    home: {
        tag: "À l'écoute d'opportunités",
        bio: "Je conçois des systèmes d'IA capables de décider et d'apprendre. Mon travail englobe les architectures de décision autonomes, les moteurs de simulation en temps réel et le C++ haute performance.<br><br>Actuellement étudiant à Epitech avec une spécialisation en intelligence artificielle.",
        explore: 'Explorer le Labo IA',
        projects: 'Voir les Projets',
        viewcv: 'Voir le CV',
        footerTitle: 'Construisons ensemble.',
        footerDesc:
            'Je suis actuellement ouvert à de nouvelles opportunités. Vérifiez ma disponibilité pour voir si nos calendriers correspondent, ou contactez-moi directement.',
        footerBtn: 'Vérifier ma Disponibilité'
    },
    journey: {
        eyebrow: 'Mon Parcours',
        title: 'Expérience & Formation',
        sub: 'Une chronologie de mon parcours académique, de mon expérience professionnelle et de mon apprentissage continu.',
        degreeDate: 'Prévu pour 2029',
        degreeTitle: "Master en Technologies de l'Information",
        degreeDesc:
            'Cursus intensif de 5 ans en ingénierie informatique à Epitech. Pédagogie par projets avec une spécialisation en architecture logicielle, systèmes et C++.',
        certDate: '2026',
        certTitle: 'Certifications Google Cloud & IA Générative',
        certDesc:
            "Certifié <strong>Google Cloud Computing Foundations</strong> et <strong>Generative AI Leader</strong>. Expertise renforcée en infrastructure cloud et déploiement de modèles d'IA.",
        hackDate: '2025 - 2026',
        hackTitle: 'Hackathons & Cybersécurité',
        hackDesc:
            "Participation à deux Hackathons d'IA Générative pour concevoir des outils LLM innovants, et à deux événements Cycom (Conférences Cybersécurité et CTF).",
        internDate: 'Sept - Déc 2025',
        internTitle: 'Développeur Full-Stack & IA',
        internDesc:
            "Développement de composants Razor et gestion de bases de données via Entity Framework. Conception d'un système RAG interne utilisant Microsoft Agent Framework et Ollama pour interroger les données de l'entreprise de manière sécurisée.",
        biaDate: '2020 - 2021',
        biaTitle: 'Aéronautique & Secourisme',
        biaDesc:
            "Obtention du BIA (Brevet d'initiation à l'Aéronautique) et certification PSC (Prévention et Secours Civiques).",
        highschoolDate: '2024',
        highschoolTitle: 'Baccalauréat & Admission à Epitech',
        highschoolDesc:
            "Spécialité Mathématiques et Sciences Informatiques. Réussite de la 'Piscine' Epitech, un bootcamp intensif de 5 semaines en programmation C."
    },
    projects: {
        eyebrow: 'Ingénierie Logicielle',
        title: 'Projets',
        sub: "Présentation d'applications haute performance, de systèmes concurrents et de moteurs graphiques développés durant mon cursus à Epitech.",
        filterAllYears: 'Toutes les Années',
        filterAllCats: 'Toutes les Catégories',
        filterAi: 'IA & Data Science',
        filterArch: 'Architecture Logicielle',
        filterSys: 'Systèmes & Unix',
        filterDevops: 'DevOps & Infrastructure',
        filterGraph: 'Graphisme & Jeux',
        filterPersonal: 'Personnel',
        showMore: 'Voir plus'
    },
    availability: {
        tag: 'Disponible',
        title: 'Ce que je recherche',
        bio: 'Étudiant en Tek3 à Epitech, je recherche activement des opportunités professionnelles pour mettre en pratique mes compétences en IA, en architecture backend et en développement logiciel haute performance.',
        partTime: {
            title: 'Contrat à Temps Partiel',
            desc: 'Stage alterné obligatoire Epitech Tek3 (2 jours/semaine)',
            l1Lbl: 'Période & Rythme',
            l1Val: '17 Sept. au 26 Fév.<br /><span class="text-muted-sm">Jeudi et Vendredi. Montpellier ou 100% Télétravail.</span>',
            l2Lbl: 'Type de Contrat',
            l2Val: 'Stage, CDD, CDI, SEE.<br /><span class="text-muted-sm">Plusieurs contrats acceptés.</span>',
            l3Lbl: 'Infos Recruteur',
            l3Val: 'Stage : ~4,50€/h (min. légal 2026).<br /><span class="text-muted-sm">CDD Étudiant : Taux SMIC (pas de frais couverts).</span>'
        },
        fullTime: {
            title: 'Stage à Temps Plein',
            desc: "Stage de fin d'année obligatoire Epitech Tek3 (Temps plein)",
            l1Lbl: 'Période & Rythme',
            l1Val: '29 Mars au 27 Août.<br /><span class="text-muted-sm">Au moins 4 mois (5 jours/semaine).</span>',
            l2Lbl: 'Type de Contrat',
            l2Val: 'Stage, CDD ou CDI.<br /><span class="text-muted-sm">Temps plein.</span>',
            l3Lbl: 'Infos Recruteur',
            l3Val: 'Min. légal : 4,50€/h (taux 2026, ~650-700€/mois).<br /><span class="text-muted-sm">Aucun frais de scolarité à la charge de l\'entreprise.<br />Recherche d\'une rémunération compétitive.</span>'
        },
        freelance: {
            title: 'Missions Freelance',
            desc: 'Collaboration B2B par projet',
            l1Lbl: 'Périmètre & Disponibilité',
            l1Val: 'APIs Backend, intégration IA.<br /><span class="text-muted-sm">Horaires flexibles, livraison asynchrone.</span>',
            l2Lbl: 'Statut',
            l2Val: 'Freelance (Auto-entrepreneur)<br /><span class="text-muted-sm">Pas de charges patronales.</span>',
            l3Lbl: 'Tarifs',
            l3Val: 'TJM ou Forfait.<br /><span class="text-muted-sm">Devis fourni sur demande.</span>'
        },
        footer: 'Intéressé ? Contactons-nous.',
        footerBtnEmail: 'Email Me',
        footerBtnLinkedin: 'LinkedIn'
    },
    modal: {
        github: 'Voir sur GitHub',
        trySim: 'Essayer'
    },
    cv: {
        controls: {
            print: 'Sauvegarder PDF / Imprimer'
        },
        hero: {
            role: 'Architecte Systèmes IA & Développeur C++',
            summary:
                "Concepteur de systèmes d'IA autonomes. Spécialisé dans les architectures de décision, les moteurs de simulation en temps réel et le développement haute performance.",
            badge1: 'Temps Partiel (Sept–Fév)',
            badge2: 'Stage Temps Plein (Mar–Aoû)',
            badge3: 'Freelance'
        },
        sections: {
            experience: 'Expérience',
            expertise: 'Expertise Technique',
            systems: 'Architecture Systèmes',
            ai: 'IA & Data Science',
            education: 'Formation & Certifications'
        },
        expertise: {
            arch: 'Architecture'
        },
        exp: {
            climb: {
                title: 'Développeur Full-Stack & IA',
                date: 'Sept – Déc 2025',
                desc1: "Conception d'un système interne RAG (Retrieval-Augmented Generation) utilisant Microsoft Agent Framework et des modèles locaux Ollama.",
                desc2: 'Développement de composants Razor et gestion de bases de données avec Entity Framework.'
            },
            hack: {
                title: 'Hackathons & Cybersécurité',
                date: '2025 – 2026',
                desc1: "Participation à 2 Hackathons IA Générative (création d'outils LLM innovants).",
                desc2: 'Participation à 2 événements Cycom (Conférences et CTFs Cybersécurité).'
            }
        },
        proj: {
            zappy: {
                desc: "Jeu réseau multijoueur avec IA autonome. Gestion des connexions de sockets concurrentes et de l'état."
            },
            arcade: { desc: 'Moteur de rendu mathématique 3D et architecture de jeu modulaire.' },
            secured: { desc: 'Bibliothèque de table de hachage avec hachage cryptographique personnalisé.' },
            plazza: {
                desc: 'Simulation multi-processus et multi-thread explorant la communication inter-processus (IPC) et la coordination par mutex.'
            },
            starttrek: {
                desc: "Agent d'apprentissage par renforcement (DQN) pour alunissage. Intègre l'Experience Replay."
            },
            persona: { desc: "Workflow de résumé d'actualités personnalisé par IA auto-hébergé." },
            blackjack: {
                desc: 'Agent RL profond (Maskable PPO) apprenant la stratégie optimale du Blackjack dans un environnement personnalisé.'
            }
        },
        edu: {
            epitech: {
                date: 'Prévu pour 2029',
                desc: "Master en Technologies de l'Information. Formation intensive axée sur l'ingénierie logicielle avancée."
            },
            gc: {
                date: '2026',
                desc: 'Certifications Google Cloud Computing Foundations & Generative AI Leader.'
            },
            highschool: {
                date: '2024',
                desc: 'Baccalauréat (Spécialités : Mathématiques & NSI).'
            },
            other: {
                title: 'Divers',
                desc: 'BIA (2020), PSC 1 (2021).<br />Langues:<br />Français (Natif), Anglais (Bilingue).'
            }
        }
    }
};
