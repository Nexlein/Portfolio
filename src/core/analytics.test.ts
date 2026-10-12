// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { ANALYTICS_SCRIPT, initAnalytics } from './analytics';

const scripts = () => document.querySelectorAll(`script[src="${ANALYTICS_SCRIPT}"]`);

describe('initAnalytics', () => {
    beforeAll(() => {
        // happy-dom doesn't fetch scripts; treat that as a successful load instead of logging an error
        (
            window as unknown as { happyDOM: { settings: { handleDisabledFileLoadingAsSuccess: boolean } } }
        ).happyDOM.settings.handleDisabledFileLoadingAsSuccess = true;
    });

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
});
