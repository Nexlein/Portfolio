// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { playVideosWhenVisible } from './video';

type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;

let callback: Callback;
const observed: Element[] = [];
const disconnect = vi.fn();

class FakeIntersectionObserver {
    constructor(cb: Callback) {
        callback = cb;
    }
    observe(el: Element) {
        observed.push(el);
    }
    disconnect() {
        disconnect();
        observed.length = 0;
    }
}

function renderVideos(count: number): HTMLVideoElement[] {
    document.body.innerHTML = '<video></video>'.repeat(count);
    const videos = [...document.querySelectorAll('video')];
    for (const video of videos) {
        video.play = vi.fn(() => Promise.resolve());
        video.pause = vi.fn();
    }
    return videos;
}

function mockReducedMotion(reduce: boolean) {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: reduce } as MediaQueryList);
}

describe('playVideosWhenVisible', () => {
    beforeEach(() => {
        vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
        mockReducedMotion(false);
    });

    afterEach(() => {
        playVideosWhenVisible(document.body); // flush module state between tests
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
        disconnect.mockClear();
        observed.length = 0;
    });

    it('observes every video without playing any up front', () => {
        const videos = renderVideos(3);
        playVideosWhenVisible(document.body);
        expect(observed).toEqual(videos);
        for (const v of videos) expect(v.play).not.toHaveBeenCalled();
    });

    it('plays videos entering the viewport and pauses those leaving it', () => {
        const [a, b] = renderVideos(2);
        playVideosWhenVisible(document.body);

        callback([
            { target: a, isIntersecting: true },
            { target: b, isIntersecting: false }
        ]);
        expect(a.play).toHaveBeenCalledOnce();
        expect(b.pause).toHaveBeenCalledOnce();
        expect(b.play).not.toHaveBeenCalled();
    });

    it('drops the previous observer when the grid re-renders', () => {
        renderVideos(2);
        playVideosWhenVisible(document.body);
        const fresh = renderVideos(1);
        playVideosWhenVisible(document.body);

        expect(disconnect).toHaveBeenCalled();
        expect(observed).toEqual(fresh);
    });

    it('never autoplays with reduced motion', () => {
        mockReducedMotion(true);
        renderVideos(2);
        playVideosWhenVisible(document.body);
        expect(observed).toHaveLength(0);
    });

    it('ignores a refused play() (the poster stays)', async () => {
        const [a] = renderVideos(1);
        a.play = vi.fn(() => Promise.reject(new DOMException('NotAllowedError')));
        playVideosWhenVisible(document.body);
        callback([{ target: a, isIntersecting: true }]);
        await expect(Promise.resolve()).resolves.toBeUndefined(); // no unhandled rejection
    });
});
