/**
 * Themes offered in the nav picker. Each one is a block of tokens in src/styles/tokens.css keyed on
 * html[data-theme="<id>"] and a swatch class in Nav.css. The head script accepts any lowercase id, so adding a
 * theme never touches the CSP hash.
 */
export const THEMES = ['midnight', 'daylight'] as const;

export type Theme = (typeof THEMES)[number];
