/**
 * Dates as fractional years, the unit of the charts and of every month the pages print.
 * Pure, relative imports only: the build and the browser both run it.
 */
import type { Lang } from './lang.ts';

/** 'YYYY-MM' -> fractional year (2026-04 -> 2026.25). */
export const yearOf = (month: string) => Number(month.slice(0, 4)) + (Number(month.slice(5, 7)) - 1) / 12;

/** Today, as a fractional year at the start of the current month. In UTC: every machine builds the same month. */
export const thisMonth = (now = new Date()) => now.getUTCFullYear() + now.getUTCMonth() / 12;

/** The month nearest a time, just past its start: steps of that month count as done. */
export const nearestMonth = (time: number) => Math.round(time * 12) / 12 + 1e-9;

/** "Jan 2026" from a fractional year, with the month names of a language. */
export const monthLabel = (time: number, months: readonly string[]) =>
    `${months[Math.min(11, Math.round((time % 1) * 12))]} ${Math.floor(time + 1e-6)}`;

export const MONTHS: Record<Lang, string[]> = {
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    fr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
};

export const monthName = (time: number, lang: Lang) => monthLabel(time, MONTHS[lang]);
