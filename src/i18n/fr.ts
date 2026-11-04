export const fr = {
    meta: {
        imageAlt: 'Nielsen COMBE--BRACCIALE, développeur IA et full-stack',
        home: {
            title: 'Nielsen COMBE--BRACCIALE — Développeur IA et full-stack',
            description:
                'Nielsen COMBE--BRACCIALE (Nexlein), développeur IA et full-stack, étudiant à Epitech : assistants LLM locaux, RAG, applis web testées, Kubernetes.'
        },
        cv: {
            title: 'Nielsen COMBE--BRACCIALE — CV · Développeur IA et full-stack',
            description:
                "CV de Nielsen COMBE--BRACCIALE, développeur IA et full-stack : assistants LLM locaux, RAG, applications web, Kubernetes, tests d'abord."
        },
        notFound: {
            title: 'Page introuvable — Nielsen COMBE--BRACCIALE',
            description: "Cette page n'existe pas. Retour au portfolio de Nielsen COMBE--BRACCIALE (Nexlein)."
        }
    },
    site: {
        nav: {
            label: 'Navigation principale',
            skip: 'Aller au contenu',
            work: 'Projets',
            path: 'Parcours',
            contact: 'Contact',
            cv: 'CV',
            language: 'Langue',
            theme: 'Choisir un thème'
        },
        themes: {
            midnight: 'Minuit',
            daylight: 'Plein jour'
        },
        footer: {
            made: 'Fait avec du café, du temps et des tokens',
            email: 'E-mail',
            source: 'Voir le code source'
        }
    },
    home: {
        hero: {
            role: 'Développeur IA et full-stack · Epitech',
            title1: 'Nexlein.',
            title2: 'IA qui cite ses sources.',
            title2b: 'Mises à jour sans coupure.',
            title2c: 'Web testé de bout en bout.',
            lede: "J'écris d'abord les tests et je donne des règles écrites aux agents de codage ; la CI vérifie chaque changement. Étudiant en 3e année à Epitech.",
            work: 'Voir les projets',
            contact: 'Me contacter',
            switch: 'Changer de simulation',
            pause: "Mettre l'animation en pause",
            scroll: 'Faire défiler',
            sims: {
                valueIteration: {
                    name: 'Itération sur les valeurs',
                    hint: 'Itération sur les valeurs en direct. Votre curseur est la récompense. Cliquez pour poser un mur.'
                },
                flocking: {
                    name: 'Agents en essaim',
                    hint: 'Essaim en direct. Les agents suivent votre curseur. Cliquez pour les disperser.'
                },
                descent: {
                    name: 'Descente de gradient',
                    hint: 'Descente de gradient en direct. Votre curseur est le minimum. Cliquez pour ajouter une colline.'
                },
                neural: {
                    name: 'Réseau de neurones',
                    hint: 'Réseau de neurones en direct. Votre curseur active les neurones. Cliquez pour envoyer une impulsion.'
                }
            }
        },
        featured: {
            label: 'Pour commencer'
        },
        work: {
            title1: '{n} projets.',
            title2: 'Un seul réseau.',
            sub: 'Les projets sont reliés par leurs compétences communes.',
            subDesk: 'Survolez un projet pour voir ses liens, ou activez un domaine.',
            ask: 'Activer un domaine',
            mapLabel:
                'Les projets en réseau : les plus récents au centre, reliés quand ils partagent des compétences (lien plus lumineux = plus proches). Survolez ou sélectionnez un projet pour un aperçu ; validez pour ouvrir sa page.',
            more: '{shown} projets affichés sur {n}, les autres apparaissent à tour de rôle.',
            seeAll: 'Voir tous les projets',
            viewLabel: 'Affichage des projets',
            viewMap: 'Carte',
            viewList: 'Liste',
            showMore: 'Voir {n} de plus',
            showLess: 'Voir moins',
            now: 'En ce moment',
            open: 'Voir le projet',
            similar: '{s} % en commun',
            periods: {
                Tek1: '1re année · 2024-25',
                Tek2: '2e année · 2025-26',
                Tek3: '3e année · 2026-27',
                Personal: 'perso · 2026'
            }
        },
        domains: {
            ai: 'IA',
            fullstack: 'Full-stack',
            systems: 'Systèmes',
            graphical: 'Rendu et jeux',
            devops: 'DevOps'
        },
        domainsShort: {
            ai: 'IA',
            fullstack: 'Full-stack',
            systems: 'Systèmes',
            graphical: 'Rendu et jeux',
            devops: 'DevOps'
        },
        path: {
            title1: 'Le parcours.',
            title2: 'Étape par étape.',
            symbol: 'Compétences · indice de la boîte à outils',
            over: 'sur {n} mois',
            over1: 'sur 1 mois',
            since: 'depuis {d}',
            beforeEpitech: 'Avant Epitech',
            range: 'Période',
            ranges: { '1m': '1M', '6m': '6M', '1y': '1A', max: 'Max' },
            aria: "Compétences distinctes au fil du temps : {n} aujourd'hui.",
            skills: '{n} compétences',
            shipped: 'Début de {p}',
            prevStep: 'Étape précédente',
            nextStep: 'Étape suivante'
        },
        numbers: {
            heat: 'Domaines par période',
            heatTitle: 'Où se placent les projets',
            prev: 'Graphiques précédents',
            next: 'Graphiques suivants',
            sub: 'Tous les graphiques ci-dessous sont calculés à partir des projets.',
            other: 'Autres',
            infra: 'Infra / config',
            projects: 'projets',
            coverage: 'Étendue',
            domains: '{n} domaines',
            periods: 'Périodes',
            byPeriod: '{n} projets, par période',
            languages: 'Langages',
            languagesTitle: 'Langage principal, par période',
            growth: 'Progression',
            growthTitle: 'Nouvelles compétences, par période',
            mostUsed: 'Les plus utilisées',
            distinct: '{n} dans les projets · {t} au total',
            thisYear: 'Sur un an',
            newSkills: '{n} nouvelles compétences en 12 mois'
        },
        method: {
            title1: 'Comment je travaille.',
            title2: 'Vite, et vérifié.',
            test: {
                title: "Les tests d'abord",
                body: "J'écris le test avant le code, que le code vienne de moi ou d'un agent. Chaque commit lance les tests unitaires, chaque pull request les relance en CI avec les tests de bout en bout, et rien n'arrive en production sans que la CI passe."
            },
            agents: {
                title: 'Des agents sous contrôle',
                body: "Les agents de codage travaillent selon des règles que j'ai écrites : un fichier de conventions, une carte du code régénérée à chaque commit, et des permissions qui les tiennent à l'écart de ce qu'ils ne doivent pas toucher. Parfois j'écris le code, parfois je dirige les agents et je relis ce qu'ils produisent."
            },
            compound: {
                title: 'Chaque projet accélère le suivant',
                body: "Les choix techniques sont consignés avec leur justification (36 décisions documentées sur Bernstein), et chaque projet laisse des scripts, des tests et des règles sur lesquels le suivant s'appuie."
            },
            source: 'Voir comment ce site est construit'
        },
        contact: {
            title1: 'Prenons contact.',
            title2: 'Le plus rapide : un e-mail.',
            talk: 'Une question sur un projet ? Écrivez-moi.',
            copy: "Copier l'e-mail",
            copied: 'E-mail copié'
        }
    },
    notFound: {
        line1: 'Rien ici.',
        line2: "Cette page n'existe pas.",
        text: "Le lien est peut-être ancien ou mal tapé. Tout se trouve sur la page d'accueil.",
        home: "Retour à l'accueil",
        work: 'Voir les projets'
    },
    projectPage: {
        back: 'Tous les projets',
        code: 'Voir le code',
        started: 'Début',
        domain: 'Domaine',
        period: 'Période',
        stack: 'Stack',
        team: 'Équipe',
        solo: 'Solo',
        people: '{n} personnes',
        role: 'Ma part',
        result: 'Résultat',
        related1: 'Projets liés.',
        related2: 'Où mènent ces compétences.',
        shares: 'En commun :',
        sameDomain: 'Même domaine : {domain}',
        overlap: '{n} % en commun',
        gallery: "Captures d'écran",
        image: 'Image {i} sur {n}',
        prev: 'Image précédente',
        next: 'Image suivante',
        video: 'Vidéo de démonstration : {p}'
    },
    cv: {
        controls: {
            label: 'Curriculum vitae · A4',
            qr: 'QR code vers le portfolio',
            print: 'Imprimer',
            pdf: 'Télécharger le PDF'
        },
        hero: {
            role: 'Développeur IA et full-stack',
            summary:
                "Des assistants IA, des applications web et leur déploiement, construits avec les tests d'abord, des agents de codage encadrés par des règles écrites et la CI sur chaque changement."
        },
        sections: {
            experience: 'Expérience',
            skills: 'Compétences',
            fullstack: 'Projets full-stack, infra et C++',
            ai: 'Projets IA',
            education: 'Formation',
            certs: 'Certifications'
        }
    }
};
