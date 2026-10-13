/**
 * Themes offered in the nav picker. Each one is a block of eight values in src/styles/tokens.css keyed on
 * [data-theme="<id>"]; the menu swatch paints itself from that block. themes.test.ts checks that every id here
 * has its block and its names. The head script accepts any lowercase id, so adding a theme never touches the
 * CSP hash.
 */
export const THEMES = ['midnight', 'daylight'] as const;

export type Theme = (typeof THEMES)[number];
