/** First sentence of a text, without HTML tags, ending in one full stop ("A. B." gives "A."). Node-safe (relative imports only). */
export function firstSentence(text: string): string {
    return `${text
        .split('. ')[0]
        .replace(/<[^>]+>/g, '')
        .replace(/\.$/, '')}.`;
}

/**
 * Safe text for a double-quoted HTML attribute in the build's string templates. Ampersands stay as they are: the
 * dictionaries already write entities ('IA &amp; RL'), and escaping them again would show '&amp;' on the page.
 */
export function attr(text: string): string {
    return text.replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
