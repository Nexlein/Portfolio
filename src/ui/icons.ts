/** Inline SVG icons shared across components. Size them from CSS. */
export const Icons = {
    Prev: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>`,
    Next: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>`
};

/** One icon per project domain (the map, the project list, selected work). Stroked, sized and coloured by CSS. */
const DOMAIN_PATHS: Record<string, string> = {
    ai: '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M8 6h8M7 8l4 8M17 8l-4 8"/>',
    architecture: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    systems: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M13 15h4"/>',
    graphical: '<path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M12 22V12M21 7l-9 5-9-5"/>',
    devops: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>'
};

export const domainIcon = (domain: string) =>
    `<svg class="domain-icon" viewBox="0 0 24 24" aria-hidden="true">${DOMAIN_PATHS[domain] ?? DOMAIN_PATHS.systems}</svg>`;
