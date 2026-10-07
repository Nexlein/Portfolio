export const fr = {
    meta: {
        imageAlt: 'Portfolio de Nielsen Combe-Bracciale, développeur IA et logiciel',
        home: {
            title: 'Nexlein — Développeur IA & Logiciel',
            description:
                "Portfolio de Nielsen Combe-Bracciale (Nexlein), étudiant à Epitech et développeur de systèmes d'IA : simulations temps réel, moteurs de décision et architectures C++."
        },
        cv: {
            title: 'Nielsen Combe-Bracciale — CV',
            description:
                "CV de Nielsen Combe-Bracciale, architecte de systèmes d'IA et développeur C++ : systèmes de décision autonomes, moteurs de simulation temps réel et ingénierie haute performance."
        },
        availability: {
            title: 'Nexlein — Disponibilités',
            description:
                "Disponibilités de Nielsen Combe-Bracciale : stage de fin d'études Epitech (Tek3) à temps plein et missions freelance en intégration d'IA et développement backend."
        }
    },
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
        'blackjack-ai': `Un écosystème complet utilisant l'Apprentissage par Renforcement Profond (Maskable PPO) pour apprendre et visualiser la stratégie optimale du Blackjack sans aucune règle codée en dur.`,
        'ai-racing': `Un agent d'Apprentissage par Renforcement construit avec Gymnasium, Pygame et Stable Baselines3 (PPO) qui apprend à conduire une voiture sur un circuit en utilisant une physique cinématique personnalisée et des capteurs à lancer de rayons.`
    },

    navbar: {
        home: 'Accueil',
        journey: 'Parcours',
        projects: 'Projets',
        availability: 'Disponibilité',
        contact: 'Contact'
    },
    home: {
        tag: "À l'écoute d'opportunités",
        bio: "Je conçois des systèmes d'IA capables de décider et d'apprendre. Mon travail englobe les architectures de décision autonomes, les moteurs de simulation en temps réel et le C++ haute performance.<br><br>Actuellement étudiant à Epitech avec une spécialisation en intelligence artificielle.",
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
        sub: 'Une chronologie de mon parcours académique, de mon expérience professionnelle et de mon apprentissage continu.'
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
        footer: 'Intéressé ? Contactons-nous.',
        footerBtnEmail: 'Email Me',
        footerBtnLinkedin: 'LinkedIn'
    },
    modal: {
        github: 'Voir sur GitHub',
        page: 'Ouvrir la page du projet'
    },
    projectPage: {
        back: 'Tous les projets'
    },
    cv: {
        controls: {
            print: 'Imprimer',
            pdf: 'Télécharger le PDF'
        },
        hero: {
            role: 'Architecte Systèmes IA & Développeur C++',
            summary:
                "Concepteur de systèmes d'IA autonomes. Spécialisé dans les architectures de décision, les moteurs de simulation en temps réel et le développement haute performance.",
            badge1: 'Temps Partiel (Sept-Fév)',
            badge2: 'Stage Temps Plein (Mar-Aoû)',
            badge3: 'Freelance'
        },
        sections: {
            experience: 'Expérience',
            expertise: 'Expertise Technique',
            systems: 'Architecture Systèmes',
            ai: 'IA & Data Science',
            education: 'Formation & Certifications'
        },
        links: {
            linkedin: 'Profil LinkedIn'
        }
    }
};
