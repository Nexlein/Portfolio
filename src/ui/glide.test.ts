import { describe, expect, it } from 'vitest';
import { ease } from './glide';

describe('ease', () => {
    it('starts at 0 and ends at 1', () => {
        expect(ease(0)).toBe(0);
        expect(ease(1)).toBe(1);
    });

    it('only ever moves forward', () => {
        let last = 0;
        for (let i = 1; i <= 100; i++) {
            const v = ease(i / 100);
            expect(v).toBeGreaterThanOrEqual(last);
            last = v;
        }
    });

    it('starts and ends gently', () => {
        expect(ease(0.1)).toBeLessThan(0.1);
        expect(ease(0.9)).toBeGreaterThan(0.9);
    });
});
