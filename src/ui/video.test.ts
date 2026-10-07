import { describe, expect, it } from 'vitest';
import { videoPoster, videoType } from './video';

describe('videoType', () => {
    it('detects webm case-insensitively and defaults to mp4', () => {
        expect(videoType('/a/demo.WEBM')).toBe('video/webm');
        expect(videoType('/a/demo.mp4')).toBe('video/mp4');
        expect(videoType('/a/demo')).toBe('video/mp4');
    });
});

describe('videoPoster', () => {
    it('swaps the extension for .poster.webp', () => {
        expect(videoPoster('/projects/zappy/zappy.mp4')).toBe('/projects/zappy/zappy.poster.webp');
        expect(videoPoster('/projects/plazza/plazza-optimized.mp4')).toBe(
            '/projects/plazza/plazza-optimized.poster.webp'
        );
    });

    it('only touches the file extension', () => {
        expect(videoPoster('/projects/v1.2/demo.mp4')).toBe('/projects/v1.2/demo.poster.webp');
    });
});
