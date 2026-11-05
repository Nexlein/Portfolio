/**
 * schema.org JSON-LD for search engines (rendered into each page at build time).
 * Pure functions, no browser APIs, so Node can run them from the Vite plugins.
 */
import { SKILLS } from '../data/profile.ts';
import { projectPath, type ProjectEntry } from '../data/projects.ts';
import { OWNER, SITE } from './site.ts';
import { localizedPath, lookup, type Lang } from './translate.ts';

type JsonLd = Record<string, unknown>;

// Spellings people type in search engines. The displayed name stays OWNER.name.
const NAME_VARIANTS = [OWNER.alias, 'Nielsen Combe-Bracciale', 'Nielsen Combe Bracciale'];

/** CV labels that bundle or abbreviate, as the names search engines know them; other labels are already names. */
export const SKILL_ENTITIES: Record<string, string[]> = {
    'C/C++': ['C', 'C++'],
    'C#/.NET': ['C#', '.NET'],
    'LLMs (Ollama)': ['Large language models', 'Ollama'],
    'RL (PPO, DQN)': ['Reinforcement learning'],
    'MS Agent Framework': ['Microsoft Agent Framework']
};

const SKILL_NAMES = [
    ...new Set(SKILLS.flatMap((group) => group.items.flatMap((item) => SKILL_ENTITIES[item] ?? [item])))
];

function person(lang: Lang): JsonLd {
    return {
        '@type': 'Person',
        '@id': `${SITE}/#person`,
        name: OWNER.name,
        alternateName: NAME_VARIANTS,
        url: SITE + localizedPath('/', lang),
        jobTitle: lookup(lang, 'cv.hero.role'),
        knowsAbout: SKILL_NAMES,
        affiliation: { '@type': 'CollegeOrUniversity', name: OWNER.school },
        address: { '@type': 'PostalAddress', addressLocality: OWNER.city, addressCountry: OWNER.country },
        sameAs: [OWNER.github, OWNER.linkedin]
    };
}

/** Home page: a profile page about the owner. */
export function profilePage(lang: Lang): JsonLd {
    return {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        url: SITE + localizedPath('/', lang),
        inLanguage: lang,
        // The site itself, so search engines can show "Nexlein" as its name
        isPartOf: {
            '@type': 'WebSite',
            '@id': `${SITE}/#website`,
            name: OWNER.alias,
            alternateName: OWNER.name,
            url: SITE + '/'
        },
        mainEntity: person(lang)
    };
}

export function cvPerson(lang: Lang): JsonLd {
    return { '@context': 'https://schema.org', ...person(lang) };
}

export function projectSource(project: ProjectEntry, lang: Lang, description: string, image: string): JsonLd {
    return {
        '@context': 'https://schema.org',
        '@type': 'SoftwareSourceCode',
        name: project.title,
        description,
        url: SITE + localizedPath(projectPath(project.id), lang),
        image,
        inLanguage: lang,
        dateCreated: project.date, // 'YYYY-MM', a valid partial ISO date
        keywords: project.tags.join(', '),
        ...(project.github ? { codeRepository: project.github } : {}),
        author: { '@type': 'Person', '@id': `${SITE}/#person`, name: OWNER.name, url: SITE + '/' }
    };
}
