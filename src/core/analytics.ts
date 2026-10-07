/**
 * Vercel Web Analytics: cookie-free page views, enabled in the Vercel dashboard (Project → Analytics).
 *
 * The script is served by Vercel from our own origin, so the CSP's script-src 'self' allows it.
 * It only exists on Vercel deployments: IS_VERCEL_BUILD is true only for builds made on Vercel,
 * so local and CI builds never request it.
 */
export const ANALYTICS_SCRIPT = '/_vercel/insights/script.js';

export function initAnalytics(enabled: boolean = IS_VERCEL_BUILD): void {
    if (!enabled) return;
    // The home page embeds cv.html in an iframe: count the visit once, from the top-level page
    if (window.top !== window.self) return;
    if (document.querySelector(`script[src="${ANALYTICS_SCRIPT}"]`)) return;

    const script = document.createElement('script');
    script.src = ANALYTICS_SCRIPT;
    script.defer = true;
    document.head.appendChild(script);
}
