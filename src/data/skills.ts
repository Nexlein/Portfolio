/**
 * Skills from free-form tags: the one rule behind the map's similarity, the charts' counts and a project page's
 * "Shares...". Pure, relative imports only: the build and the browser both run it.
 */

/** Other names of a skill, in lowercase, and how the site spells it. */
const ALIASES: Record<string, string> = { rl: 'Reinforcement Learning' };

/** Tags whose '/' belongs to the name: 'C/C++' is two skills, 'CI/CD' is one. */
const WHOLE = new Set(['ci/cd']);

/** The skills of a tag as the data spells them: split on '/', trimmed, aliases resolved, empties dropped. */
function spelled(tag: string): string[] {
    const parts = WHOLE.has(tag.trim().toLowerCase()) ? [tag] : tag.split('/');
    return parts
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => ALIASES[part.toLowerCase()] ?? part);
}

/** The normalised skills of one tag. */
export const skillsOfTag = (tag: string) => spelled(tag).map((skill) => skill.toLowerCase());

/** The normalised skills of a list of tags, repeats kept. */
export const skillsOf = (tags: string[]) => tags.flatMap(skillsOfTag);

/** Normalised skill -> the spelling the tags use ('typescript' -> 'TypeScript'). */
export const skillNames = (tags: string[]) =>
    new Map(tags.flatMap(spelled).map((skill) => [skill.toLowerCase(), skill]));
