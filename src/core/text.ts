/** A text without its HTML tags. */
export const stripTags = (text: string) => text.replace(/<[^>]+>/g, '');

/** First sentence of a text, without HTML tags, ending in one full stop ("A. B." gives "A."). Node-safe (relative imports only). */
export function firstSentence(text: string): string {
    return `${stripTags(text.split('. ')[0]).replace(/\.$/, '')}.`;
}

/** A text cut at the last whole word within `max` characters: what a search result shows without cutting it itself. */
export function clampWords(text: string, max = 155): string {
    return text.length <= max ? text : `${text.slice(0, max).replace(/[\s,;:.]+\S*$/, '')}…`;
}

/** A number for an SVG attribute: one decimal is plenty. */
export const f1 = (n: number) => n.toFixed(1);

/** Data for a <script type="application/json"> block, which never runs: '<' is escaped so text can't close the tag. */
export const jsonBlock = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');

/**
 * Safe text for a double-quoted HTML attribute in the build's string templates. Ampersands stay as they are: the
 * dictionaries already write entities ('IA &amp; RL'), and escaping them again would show '&amp;' on the page.
 */
export function attr(text: string): string {
    return text.replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
