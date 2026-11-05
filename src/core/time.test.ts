import { describe, expect, it } from 'vitest';
import { monthName, nearestMonth, thisMonth, yearOf } from './time';

describe('dates', () => {
    it('reads a month as a fractional year (January is the year itself)', () => {
        expect(yearOf('2026-01')).toBe(2026);
        expect(yearOf('2026-04')).toBe(2026.25);
        expect(yearOf('2026-12')).toBeCloseTo(2026 + 11 / 12);
    });

    it('puts today at the start of the current month', () => {
        expect(thisMonth(new Date('2026-10-14'))).toBeCloseTo(2026 + 9 / 12);
        expect(thisMonth(new Date('2027-01-31'))).toBe(2027);
    });

    it('reads today in UTC, so every machine builds the same month', () => {
        expect(thisMonth(new Date('2026-11-30T23:30:00Z'))).toBeCloseTo(2026 + 10 / 12);
        expect(thisMonth(new Date('2026-12-01T00:30:00Z'))).toBeCloseTo(2026 + 11 / 12);
    });

    it('rounds to the nearest month, just past its start so that month counts as reached', () => {
        expect(monthName(nearestMonth(2026.65), 'en')).toBe('Sep 2026');
        expect(nearestMonth(2026.65)).toBeGreaterThan(yearOf('2026-09'));
        expect(nearestMonth(2026.97)).toBeGreaterThan(yearOf('2027-01'));
    });

    it('names a month in each language', () => {
        expect(monthName(yearOf('2026-04'), 'en')).toBe('Apr 2026');
        expect(monthName(yearOf('2026-02'), 'fr')).toBe('févr. 2026');
        expect(monthName(yearOf('2026-12'), 'en')).toBe('Dec 2026');
    });
});
