import { afterEach, describe, expect, it, vi } from 'vitest';
import { boot } from './boot';

describe('boot', () => {
    afterEach(() => vi.restoreAllMocks());

    it('runs every script in turn', () => {
        const order: number[] = [];
        boot(
            () => order.push(1),
            () => order.push(2)
        );
        expect(order).toEqual([1, 2]);
    });

    it('reports a script that throws and still runs the next ones', () => {
        const error = new Error('no such element');
        const report = vi.spyOn(console, 'error').mockImplementation(() => {});
        const next = vi.fn();
        boot(() => {
            throw error;
        }, next);
        expect(report).toHaveBeenCalledWith(error);
        expect(next).toHaveBeenCalledOnce();
    });
});
