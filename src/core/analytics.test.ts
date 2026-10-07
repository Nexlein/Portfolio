// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ANALYTICS_SCRIPT, initAnalytics } from './analytics';

const scripts = () => document.querySelectorAll(`script[src="${ANALYTICS_SCRIPT}"]`);

describe('initAnalytics', () => {
    afterEach(() => {
        document.head.innerHTML = '';
        vi.restoreAllMocks();
    });

    it('is off outside Vercel builds (tests, local and CI builds)', () => {
        initAnalytics();
        expect(scripts()).toHaveLength(0);
    });

    it('adds the deferred same-origin script once when enabled', () => {
        initAnalytics(true);
        initAnalytics(true);
        expect(scripts()).toHaveLength(1);
        expect((scripts()[0] as HTMLScriptElement).defer).toBe(true);
    });

    it('does not count a page view from inside an iframe (the CV embedded in the home page)', () => {
        vi.spyOn(window, 'top', 'get').mockReturnValue({} as Window);
        initAnalytics(true);
        expect(scripts()).toHaveLength(0);
    });
});
