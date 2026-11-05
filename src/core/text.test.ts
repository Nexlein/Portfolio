import { describe, expect, it } from 'vitest';
import { attr, clampWords, firstSentence, jsonBlock } from './text';

describe('firstSentence', () => {
    it('keeps the first sentence and ends it with one full stop', () => {
        expect(firstSentence('A first one. A second one.')).toBe('A first one.');
        expect(firstSentence('Only one.')).toBe('Only one.');
        expect(firstSentence('No full stop')).toBe('No full stop.');
    });

    it('drops HTML tags', () => {
        expect(firstSentence('A <b>bold</b> start. Then more.')).toBe('A bold start.');
    });

    it('does not cut at a dot inside a word (C++ 17, v1.2)', () => {
        expect(firstSentence('Built with v1.2 of the engine. Next.')).toBe('Built with v1.2 of the engine.');
    });
});

describe('attr', () => {
    it('escapes quotes and tags but keeps entities', () => {
        expect(attr('a "quoted" <b> &amp; c')).toBe('a &quot;quoted&quot; &lt;b> &amp; c');
    });
});

describe('clampWords', () => {
    it('leaves a short text alone', () => {
        expect(clampWords('Short enough.', 20)).toBe('Short enough.');
    });

    it('cuts at the last whole word, within the limit', () => {
        expect(clampWords('One two three four', 10)).toBe('One two…');
    });

    it('drops the punctuation before the cut', () => {
        expect(clampWords('One, two three', 8)).toBe('One…');
    });
});

describe('jsonBlock', () => {
    it('cannot close its script tag, and still parses back', () => {
        const block = jsonBlock({ text: '</script><script>alert(1)</script>' });
        expect(block).not.toContain('<');
        expect(JSON.parse(block)).toEqual({ text: '</script><script>alert(1)</script>' });
    });
});
