/** First sentence of a text, without HTML tags, ending in one full stop ("A. B." gives "A."). Node-safe (relative imports only). */
export function firstSentence(text: string): string {
    return `${text
        .split('. ')[0]
        .replace(/<[^>]+>/g, '')
        .replace(/\.$/, '')}.`;
}
