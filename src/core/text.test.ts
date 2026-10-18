import { describe, expect, it } from 'vitest';
import { attr, firstSentence } from './text';

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
